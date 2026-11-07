import {spawn,execFile} from 'node:child_process';
import type {ChildProcess} from 'node:child_process';

export interface BoundedResult {
 error:Error|null;
 stdout:string;
 stderr:string;
 cancelled:boolean;
 timedOut:boolean;
}
/** Only terminate processes launched by this extension, never inspected PIDs.
 * Unix: a detached process group contains children of the permitted probe.
 * Windows: taskkill /T is scoped to the exact PID returned by execFile.
 */
function stopOwnedProcess(child:ChildProcess):void {
 const pid=child.pid;
 if(!pid || !Number.isSafeInteger(pid) || pid<=0)return;
 if(process.platform==='win32'){
  execFile('taskkill',['/PID',String(pid),'/T','/F'],{
   shell:false,windowsHide:true,timeout:2000,maxBuffer:1024
  },()=>{try{child.kill('SIGKILL');}catch{/* already exited */}});
 }else{
  try {process.kill(-pid,'SIGKILL');}
  catch {try{child.kill('SIGKILL');}catch{/* already exited */}}
 }
}
/** Fixed allowlisted callers only. Bound all output, time and cancellation.
 * Do not pass workspace scripts, arbitrary user commands or dynamic arguments.
 */
export function runBoundedCommand(command:string,args:readonly string[],
 options:{timeoutMs:number;maxBuffer:number;env?:NodeJS.ProcessEnv},
 signal?:AbortSignal):Promise<BoundedResult> {
 return new Promise(resolve=>{
  if(signal?.aborted){
   resolve({error:null,stdout:'',stderr:'',cancelled:true,timedOut:false});
   return;
  }
  const limit=Math.min(10000,Math.max(400,Math.floor(options.timeoutMs)));
  const maxBuffer=Math.min(131072,Math.max(1024,options.maxBuffer));
  let cancelled=false,timedOut=false,done=false;
  let error:Error|null=null,stdoutLength=0,stderrLength=0;
  const stdoutChunks:Buffer[]=[],stderrChunks:Buffer[]=[];
  let timer:ReturnType<typeof setTimeout>|undefined;
  let child:ChildProcess;
  const finish=():void=>{
   if(done)return;
   done=true;
   if(timer)clearTimeout(timer);
   signal?.removeEventListener('abort',cancel);
   resolve({error,stdout:Buffer.concat(stdoutChunks).toString('utf8'),
    stderr:Buffer.concat(stderrChunks).toString('utf8'),cancelled,timedOut});
  };
  const cancel=():void=>{if(done)return;cancelled=true;stopOwnedProcess(child);};
  const expire=():void=>{if(done)return;timedOut=true;stopOwnedProcess(child);};
  try {
   // Unlike execFile, spawn forwards detached to the operating system.
   // On Unix that gives this allowlisted probe its own process group.
   child=spawn(command,[...args],{shell:false,windowsHide:true,
    detached:process.platform!=='win32',env:options.env,
    stdio:['ignore','pipe','pipe']});
  }catch(e){
   error=e instanceof Error?e:new Error('Probe launch failed');
   finish();
   return;
  }
  const collect=(chunk:Buffer|string,stderr:boolean):void=>{
   const part=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);
   const size=stderr?stderrLength:stdoutLength;
   const allowed=Math.max(0,maxBuffer-size);
   if(allowed) (stderr?stderrChunks:stdoutChunks).push(part.subarray(0,allowed));
   if(stderr)stderrLength+=part.length;
   else stdoutLength+=part.length;
   if(size+part.length>maxBuffer && !error){
    error=new Error('Probe output limit exceeded');
    stopOwnedProcess(child);
   }
  };
  child.stdout?.on('data',data=>collect(data as Buffer,false));
  child.stderr?.on('data',data=>collect(data as Buffer,true));
  child.once('error',e=>{error=e;});
  child.once('close',(code,signalName)=>{
   if(!error && !cancelled && !timedOut && (code!==0 || signalName))
    error=new Error('Probe exited unsuccessfully');
   finish();
  });
  timer=setTimeout(expire,limit);
  signal?.addEventListener('abort',cancel,{once:true});
  if(signal?.aborted)cancel();
 });
}

import {execFile} from 'node:child_process';
import type {ChildProcess,ExecFileOptions} from 'node:child_process';

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
  let cancelled=false,timedOut=false,done=false;
  let timer:ReturnType<typeof setTimeout>|undefined;
  let child:ChildProcess;
  const finish=(error:Error|null,stdout:string,stderr:string):void=>{
   if(done)return;
   done=true;
   if(timer)clearTimeout(timer);
   signal?.removeEventListener('abort',cancel);
   resolve({error,stdout,stderr,cancelled,timedOut});
  };
  const cancel=():void=>{if(done)return;cancelled=true;stopOwnedProcess(child);};
  const expire=():void=>{if(done)return;timedOut=true;stopOwnedProcess(child);};
  try {
   child=execFile(command,[...args],{
    shell:false,windowsHide:true,
    detached:process.platform!=='win32',
    timeout:0,maxBuffer:options.maxBuffer,env:options.env
   } as ExecFileOptions,(error,stdout,stderr)=>{
    finish(error,String(stdout||''),String(stderr||''));
   });
  }catch(error){
   finish(error instanceof Error?error:new Error('Probe launch failed'),'','');
   return;
  }
  timer=setTimeout(expire,limit);
  signal?.addEventListener('abort',cancel,{once:true});
  if(signal?.aborted)cancel();
 });
}

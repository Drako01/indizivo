import {execFile} from 'node:child_process';
import type {Descriptor} from './i18n';

export interface PortOwner {pid:number;name:string;observed:true}
export interface InspectionCommand {command:string;args:string[]}
export type InspectionStatus='observed'|'inconclusive'|'unsupported'|'cancelled';
export interface OwnerInspection {
  status:InspectionStatus;
  owners:PortOwner[];
  detail:string;
  i18nDetail:Descriptor;
}

export function endpointPort(value:unknown):number|null {
  const match= /:(\d{1,5})$/.exec(typeof value==='string'?value:'');
  const port=match?Number(match[1]):0;
  return port>=1 && port<=65535?port:null;
}
export function safeLabel(label:unknown):string {
  return String(label||'').replace(/[^a-zA-Z0-9_.+-]/g,'').slice(0,50)||'unknown';
}
export function parseOwners(platform:string,output:unknown,port:number):PortOwner[] {
  if (!Number.isInteger(port)||port<1||port>65535)return [];
  const owners:PortOwner[]=[];
  const lines=String(output||'').split(/\r?\n/);
  for(const line of lines) {
    const cols=line.trim().split(/\s+/);
    let pid=0,name='unknown';
    if(platform==='win32') {
      if(cols[0]!=='TCP'||cols[3]?.toUpperCase()!=='LISTENING'||endpointPort(cols[1])!==port)continue;
      pid=Number(cols[4]);name='process';
    }else if(platform==='linux'){
      if(cols[0]!=='LISTEN'||endpointPort(cols[3])!==port)continue;
      pid=Number(/\bpid=(\d+)\b/.exec(line)?.[1]);
      name=safeLabel(/users:\(\("([^"]{1,100})"/.exec(line)?.[1]);
    }else if(platform==='darwin'){
      const exact=/\bTCP\s+\S+:(\d+)\s+\(LISTEN\)\s*$/.exec(line);
      if(!exact || Number(exact[1])!==port)continue;
      pid=Number(cols[1]);name=safeLabel(cols[0]);

    }else continue;
    if(Number.isSafeInteger(pid)&&pid>0&&pid<=2147483647&&
      !owners.some(owner=>owner.pid===pid))owners.push({pid,name:safeLabel(name),observed:true});
    if(owners.length===12)break;
  }
  return owners;
}
export function inspectionArgs(platform:string,port:number):InspectionCommand|null {
  if(platform==='win32')return {command:'netstat',args:['-ano','-p','tcp']};
  if(platform==='linux')return {command:'ss',args:['-ltnp']};
  if(platform==='darwin')return {command:'lsof',args:['-nP','-iTCP:'+port,'-sTCP:LISTEN']};
  return null;
}
export function inspectOwner(port:number,timeoutMs:number,signal?:AbortSignal,
  platform:string=process.platform):Promise<OwnerInspection>{
  const spec=inspectionArgs(platform,port);
  if(!spec)return Promise.resolve({status:'unsupported',owners:[],
    detail:'Platform not supported for owner inspection.',
    i18nDetail:{key:'diag.ownerUnsupported'}});
  return new Promise(resolve=>{
    if(signal?.aborted)return resolve({status:'cancelled',owners:[],detail:'Cancelled',
      i18nDetail:{key:'diag.cancelled'}});
    let settled=false;
    const child=execFile(spec.command,spec.args,{
      shell:false,windowsHide:true,
      timeout:Math.min(5000,Math.max(400,timeoutMs||2000)),
      maxBuffer:131072
    },(err:Error|null,stdout:string)=>{
      if(settled)return;
      settled=true;
      signal?.removeEventListener('abort',cancel);
      if(signal?.aborted)return resolve({status:'cancelled',owners:[],detail:'Cancelled',
        i18nDetail:{key:'diag.cancelled'}});
      if(err)return resolve({status:'inconclusive',owners:[],
        detail:'Process ownership unavailable or permission denied.',
        i18nDetail:{key:'diag.ownerNotAvailable'}});
      const owners=parseOwners(platform,stdout,port);
      resolve({status:owners.length?'observed':'inconclusive',owners,
        detail:owners.length?'Process IDs observed in host tool output.':
          'No process ID visible; permission or namespace may limit this tool.',
        i18nDetail:{key:owners.length?'diag.ownerObserved':'diag.ownerUnknown'}});
    });
    function cancel():void{try{child.kill();}catch{/* best effort */}}
    signal?.addEventListener('abort',cancel,{once:true});
  });
}

/** One bounded read-only platform snapshot for all declared TCP ports. */
export function inspectionBatchArgs(platform:string):InspectionCommand|null {
 if(platform==='win32')return {command:'netstat',args:['-ano','-p','tcp']};
 if(platform==='linux')return {command:'ss',args:['-ltnp']};
 if(platform==='darwin')return {command:'lsof',args:['-nP','-iTCP','-sTCP:LISTEN']};
 return null;
}
export function inspectOwners(ports:number[],timeoutMs:number,signal?:AbortSignal,
 platform:string=process.platform):Promise<Map<number,OwnerInspection>> {
 const requested=[...new Set(ports)].filter(x=>Number.isInteger(x)&&x>=1&&x<=65535).slice(0,12);
 const unavailable=(status:InspectionStatus,detail:string,key:Descriptor['key'])=>{
  const map=new Map<number,OwnerInspection>();
  for(const port of requested)map.set(port,{status,owners:[],detail,i18nDetail:{key}});
  return map;
 };
 const spec=inspectionBatchArgs(platform);
 if(!spec)return Promise.resolve(unavailable('unsupported','Unsupported host inspection.', 'diag.ownerUnsupported'));
 return new Promise(resolve=>{
  if(signal?.aborted)return resolve(unavailable('cancelled','Cancelled','diag.cancelled'));
  let finished=false;
  const child=execFile(spec.command,spec.args,{shell:false,windowsHide:true,
   timeout:Math.min(5000,Math.max(400,timeoutMs||2000)),maxBuffer:131072},
   (error,stdout)=>{
    if(finished)return;
    finished=true;signal?.removeEventListener('abort',cancel);
    if(signal?.aborted)return resolve(unavailable('cancelled','Cancelled','diag.cancelled'));
    if(error)return resolve(unavailable('inconclusive','Ownership unavailable or permission denied.',
      'diag.ownerNotAvailable'));
    const map=new Map<number,OwnerInspection>();
    for(const port of requested){
      const owners=parseOwners(platform,stdout,port);
      map.set(port,{status:owners.length?'observed':'inconclusive',owners,
        detail:owners.length?'Process IDs observed in host tool output.':
          'No visible process owner; permission or namespace may limit inspection.',
        i18nDetail:{key:owners.length?'diag.ownerObserved':'diag.ownerUnknown'}});
    }
    resolve(map);
   });
  function cancel():void{try{child.kill();}catch{/* best effort */}}
  signal?.addEventListener('abort',cancel,{once:true});
 });
}

import {execFile} from 'node:child_process';

export type ToolName='node'|'go'|'python3'|'python'|'py'|'php'|'java'|'docker';
export interface ToolResult {ok:boolean;value:string;missing:boolean}
interface ToolSpec {command:ToolName;args:readonly string[]}
const SPECS:Record<ToolName,ToolSpec>={
 node:{command:'node',args:['--version']},
 go:{command:'go',args:['version']},
 python3:{command:'python3',args:['--version']},
 python:{command:'python',args:['--version']},
 py:{command:'py',args:['-3','--version']},
 php:{command:'php',args:['--version']},
 java:{command:'java',args:['-version']},
 docker:{command:'docker',args:['--version']}
};
export function toolArguments(tool:ToolName):readonly string[]{return SPECS[tool].args;}
/**
 * Recognize bounded version-only prefixes. Never return arbitrary stdout/stderr:
 * command output can be hostile even when arguments are fixed.
 */
export function parseToolVersion(tool:ToolName,output:unknown):string|null {
 if(typeof output!=='string'||output.length>16384)return null;
 const line=output.trim().split(/\r?\n/,1)[0]||'';
 let match:RegExpExecArray|null=null;
 switch(tool){
   case 'node':match=/^v\d+\.\d+\.\d+(?:\b|$)/.exec(line);return match?.[0]||null;
   case 'go':match=/^go version go\d+\.\d+(?:\.\d+)?(?:\b|$)/.exec(line);return match?.[0]||null;
   case 'python3':case 'python':case 'py':
     match=/^Python\s+(\d+\.\d+(?:\.\d+)?)(?:\b|$)/.exec(line);
     return match?'Python '+match[1]:null;
   case 'php':
     match=/^PHP\s+(\d+\.\d+(?:\.\d+)?)(?:\b|$)/.exec(line);
     return match?'PHP '+match[1]:null;
   case 'java':
     match=/^(?:openjdk|java)(?: version)?\s+["']?(\d+(?:\.\d+){0,2})(?:["'\s]|$)/i.exec(line);
     return match?'Java '+match[1]:null;
   case 'docker':
     match=/^Docker version\s+(\d+\.\d+(?:\.\d+)?)(?:,|\b)/.exec(line);
     return match?'Docker '+match[1]:null;
 }
}
/** Fixed command allowlist; no repo scripts, user-provided args or shells. */
export function probeTool(tool:ToolName,timeout:number,signal?:AbortSignal):Promise<ToolResult> {
 const spec=SPECS[tool];
 return new Promise(resolve=>{
  if(signal?.aborted)return resolve({ok:false,value:'Cancelled',missing:false});
  let settled=false;
  const child=execFile(spec.command,[...spec.args],{
   shell:false,windowsHide:true,
   timeout:Math.min(10000,Math.max(400,timeout)),
   maxBuffer:16384
  },(error,stdout,stderr)=>{
   if(settled)return;
   settled=true;
   signal?.removeEventListener('abort',cancel);
   const version=parseToolVersion(tool,String(stdout||stderr));
   const missing=Boolean(error && error.code==='ENOENT');
   resolve({ok:!error && !!version,
     missing,value:error?(missing?'Not installed / not on PATH':'Could not inspect runtime'):
       (version||'Unrecognized runtime version output')});
  });
  function cancel():void{try{child.kill();}catch{/* no permission or already exited */}}
  signal?.addEventListener('abort',cancel,{once:true});
 });
}

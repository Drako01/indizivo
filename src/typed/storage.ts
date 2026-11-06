import type {DiagnosticCheck,DiagnosticSession} from './diagnostics';
import type {CheckStatus} from './contracts';
import {CATALOG} from './i18n';
import type {Descriptor,FindingTranslation} from './i18n';

export interface HistoryEntry {
  project:string;
  completedAt:string;
  checks:Array<Pick<DiagnosticCheck,'id'|'status'>>;
  snapshot?:DiagnosticSession;
}
const STATUSES=new Set<CheckStatus>(['pass','warn','info','inconclusive','blocked','skip']);
const MAX_HISTORY=10,MAX_SNAPSHOT_BYTES=131072,MAX_CHECKS=150;
function record(value:unknown):Record<string,unknown>|null {
  return value!==null && typeof value==='object' && !Array.isArray(value) ?
    value as Record<string,unknown>:null;
}
function str(value:unknown,max:number):value is string {
  return typeof value==='string' && value.length>0 && value.length<=max;
}
function descriptor(value:unknown,depth=0):Descriptor|null {
  const item=record(value);
  if(!item || !str(item.key,120) || !Object.hasOwn(CATALOG.en,item.key) || depth>3)return null;
  const values=record(item.values);
  if(item.values!==undefined && !values)return null;
  const safe:Record<string,string|number|Descriptor>={};
  for(const [key,param] of Object.entries(values||{})){
    if(!/^[a-zA-Z][\w]{0,49}$/.test(key)||Object.keys(safe).length>=30)return null;
    if(typeof param==='string' && param.length<=1024)safe[key]=param;
    else if(typeof param==='number' && Number.isFinite(param))safe[key]=param;
    else {
      const nested=descriptor(param,depth+1);
      if(!nested)return null;
      safe[key]=nested;
    }
  }
  return Object.keys(safe).length?{key:item.key as Descriptor['key'],values:safe}:
    {key:item.key as Descriptor['key']};
}
function finding(value:unknown):DiagnosticCheck|null {
  const item=record(value);
  if(!item||!str(item.id,90)||!(/^[a-z0-9-]+$/i).test(item.id)||
     !str(item.label,200)||!str(item.category,80)||
     typeof item.detail!=='string'||item.detail.length>5000||
     !STATUSES.has(item.status as CheckStatus)||
     !Array.isArray(item.evidence)||item.evidence.length>20)return null;
  const evidence=[];
  for(const raw of item.evidence){
    const one=record(raw);
    if(!one||!str(one.id,90)||typeof one.fact!=='string'||one.fact.length>3000||
       !str(one.observedAt,60))return null;
    evidence.push({id:one.id,fact:one.fact,observedAt:one.observedAt});
  }
  const localized:FindingTranslation={};
  const translations=record(item.i18n);
  for(const key of ['label','category','detail','suggestion','evidence','limitations'] as const){
    if(translations?.[key]===undefined)continue;
    const translated=descriptor(translations[key]);
    if(translated)localized[key]=translated;
  }
  const originalMetadata=record(item.metadata);
  const severity=originalMetadata?.severity;
  const safeMetadata=originalMetadata?.schemaVersion===1 &&
    str(originalMetadata.checkId,80) && /^[a-z][a-z0-9-]*$/.test(originalMetadata.checkId) &&
    str(originalMetadata.targetId,90) && /^[a-z0-9-]+$/i.test(originalMetadata.targetId) &&
    ['unassessed','none','low','medium','high'].includes(String(severity)) ?
    {schemaVersion:1 as const,checkId:originalMetadata.checkId,
      targetId:originalMetadata.targetId,
      severity:severity as 'unassessed'|'none'|'low'|'medium'|'high'}:null;
  const sanitized={
    id:item.id,category:item.category,label:item.label,status:item.status as CheckStatus,
    detail:item.detail,suggestion:typeof item.suggestion==='string'?
      item.suggestion.slice(0,3000):'',evidence,
    ...(safeMetadata?{metadata:safeMetadata}:{}),
    ...(Object.keys(localized).length?{i18n:localized}:{})
  };
  // Historical schema v1 did not include provenance; do not invent it.
  const original=record(item.provenance);
  if(original &&
     ['workspace-file','runtime-tool','tcp-loopback','approved-http','framework-convention','discovery'].includes(String(original.origin)) &&
     ['observed','inferred','inconclusive'].includes(String(original.confidence)) &&
     str(original.method,80)&&str(original.host,100)&&str(original.target,100)&&
     typeof original.limitations==='string' && original.limitations.length<=2000){
    return {...sanitized,provenance:{
      origin:original.origin as DiagnosticCheck['provenance']['origin'],
      confidence:original.confidence as DiagnosticCheck['provenance']['confidence'],
      method:original.method,host:original.host,target:original.target,
      limitations:original.limitations
    }};
  }
  return sanitized as DiagnosticCheck;
}
/** Historical comparisons are optional; malformed trends must never break Webview rendering. */
function safeComparison(value:unknown):DiagnosticSession['comparison']|undefined {
 const raw=record(value);
 if(!raw||!Array.isArray(raw.observations)||raw.observations.length>150 ||
    !str(raw.note,1000)||!str(raw.previousAt,60)||!str(raw.currentAt,60))return undefined;
 const trends=[];
 for(const value of raw.observations){
  const entry=record(value);
  if(!entry||!str(entry.id,90)||!(/^[a-z0-9-]+$/i).test(entry.id)||
    !['new-observation','unchanged','status-changed','not-reobserved'].includes(String(entry.trend))||
    (entry.before!==null && !STATUSES.has(entry.before as CheckStatus))||
    (entry.after!==null && !STATUSES.has(entry.after as CheckStatus)))return undefined;
  trends.push({id:entry.id,
    before:entry.before as CheckStatus|null,
    after:entry.after as CheckStatus|null,
    trend:entry.trend as 'new-observation'|'unchanged'|'status-changed'|'not-reobserved'});
 }
 return {note:raw.note,previousAt:raw.previousAt,currentAt:raw.currentAt,observations:trends};
}
/** Only preserve bounded discovery facts: arbitrary old state is untrusted input. */
function safeDiscovery(value:unknown):DiagnosticSession['discovery']|null {
 const raw=record(value);
 if(!raw||!str(raw.project,160)||typeof raw.node!=='boolean'||
   typeof raw.go!=='boolean')return null;
 const stringList=(input:unknown,max:number):string[]=>
   Array.isArray(input)?input.filter(x=>typeof x==='string'&&x.length<=80).slice(0,max):[];
 const ports=Array.isArray(raw.ports)?
   raw.ports.filter(x=>Number.isInteger(x)&&x>=1&&x<=65535).slice(0,12):[];
 const fileStates:Record<string,'present'|'missing'|'blocked'|'unreadable'>={};
 const states=record(raw.fileStates);
 for(const [key,val] of Object.entries(states||{})){
   if(key.length<=80 && ['present','missing','blocked','unreadable'].includes(String(val)) &&
      Object.keys(fileStates).length<30)
     fileStates[key]=val as 'present'|'missing'|'blocked'|'unreadable';
 }
 const origins:Record<string,'declared'|'heuristic'>={};
 const origin=record(raw.portOrigins);
 for(const port of ports){
   const val=origin?.[String(port)];
   if(val==='declared'||val==='heuristic')origins[String(port)]=val;
 }
 const optional:Record<string,string[]>={};
 const tools=record(raw.optionalRuntimes);
 for(const key of ['python','php','java','docker']){
   const names=stringList(tools?.[key],16);
   if(names.length)optional[key]=names;
 }
 return {project:raw.project,node:raw.node,go:raw.go,
  malformedPackage:raw.malformedPackage===true,
  nodeRequirement:typeof raw.nodeRequirement==='string'?raw.nodeRequirement.slice(0,80):'',
  goRequirement:typeof raw.goRequirement==='string'?raw.goRequirement.slice(0,80):'',
  goToolchain:typeof raw.goToolchain==='string'?raw.goToolchain.slice(0,80):'',
  goRequirementOrigin:['declared','implicit','invalid','none'].includes(String(raw.goRequirementOrigin))?
    raw.goRequirementOrigin as 'declared'|'implicit'|'invalid'|'none':'none',
  goToolchainOrigin:['declared','invalid','none'].includes(String(raw.goToolchainOrigin))?
    raw.goToolchainOrigin as 'declared'|'invalid'|'none':'none',
  ports,portOrigins:origins,fileStates,optionalRuntimes:optional,
  packageManager:typeof raw.packageManager==='string' &&
    /^(?:npm|pnpm|yarn|bun)@[0-9][0-9A-Za-z.+-]{0,40}$/.test(raw.packageManager)?
    raw.packageManager:'',
  lockfiles:stringList(raw.lockfiles,6).filter(name=>
    ['package-lock.json','npm-shrinkwrap.json','pnpm-lock.yaml','yarn.lock','bun.lock','bun.lockb'].includes(name)),
  requiredEnv:stringList(raw.requiredEnv,100).filter(name=>/^[A-Za-z_][A-Za-z0-9_]{0,79}$/.test(name)),
  missingEnv:stringList(raw.missingEnv,100).filter(name=>/^[A-Za-z_][A-Za-z0-9_]{0,79}$/.test(name)),
  hasEnvExample:raw.hasEnvExample===true,hasEnvFile:raw.hasEnvFile===true};
}
export function restoreSession(value:unknown):DiagnosticSession|null {
  const raw=record(value);
  // Legacy snapshots without a version are schema v1; unknown future schemas
  // must never be interpreted as successful current diagnostics.
  const schemaVersion=raw?.schemaVersion===undefined?1:raw.schemaVersion;
  if((schemaVersion!==1 && schemaVersion!==2) ||
     !raw || !['completed','partial'].includes(String(raw.state))||!str(raw.id,90)||
     !str(raw.project,160)||!str(raw.completedAt,60)||!str(raw.startedAt,60)||
     !str(raw.host,100)||!Array.isArray(raw.checks)||
     !Array.isArray(raw.serviceChecks)||
     raw.checks.length>MAX_CHECKS||raw.serviceChecks.length>MAX_CHECKS)return null;
  let serial:string;
  try{serial=JSON.stringify(raw);}catch{return null;}
  if(serial.length>MAX_SNAPSHOT_BYTES)return null;
  const checks=raw.checks.map(finding),serviceChecks=raw.serviceChecks.map(finding);
  if(checks.includes(null)||serviceChecks.includes(null))return null;
  const discovery=safeDiscovery(raw.discovery);
  if(!discovery)return null;
  const comparison=safeComparison(raw.comparison);
  const safe={
    id:raw.id,project:raw.project,host:raw.host,state:raw.state as 'completed'|'partial',
    startedAt:raw.startedAt,completedAt:raw.completedAt,
    schemaVersion,
    ...(str(raw.scopeId,100)?{scopeId:raw.scopeId}:{}),
    checks:checks as DiagnosticCheck[],serviceChecks:serviceChecks as DiagnosticCheck[],
    discovery,
    ...(comparison?{comparison}:{})
  };
  return safe as DiagnosticSession;
}
export function restoreHistory(value:unknown):HistoryEntry[] {
  if(!Array.isArray(value))return [];
  const entries:HistoryEntry[]=[];
  for(const candidate of value.slice(0,MAX_HISTORY)){
    const entry=record(candidate);
    if(!entry||!str(entry.project,160)||!str(entry.completedAt,60)||
      !Array.isArray(entry.checks)||entry.checks.length>MAX_CHECKS)continue;
    const checks:Array<Pick<DiagnosticCheck,'id'|'status'>>=[];
    for(const item of entry.checks){
      const raw=record(item);
      if(!raw || !str(raw.id,90)||!(/^[a-z0-9-]+$/i).test(raw.id)||
        !STATUSES.has(raw.status as CheckStatus))continue;
      checks.push({id:raw.id,status:raw.status as CheckStatus});
    }
    const snapshot=restoreSession(entry.snapshot);
    entries.push({
      project:entry.project,completedAt:entry.completedAt,checks,
      ...(snapshot?{snapshot}:{})
    });
  }
  return entries;
}

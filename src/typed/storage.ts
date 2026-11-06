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
  if(!item || !str(item.key,120) || !(item.key in CATALOG.en) || depth>3)return null;
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
  for(const key of ['label','category','detail','suggestion','evidence'] as const){
    if(translations?.[key]===undefined)continue;
    const translated=descriptor(translations[key]);
    if(translated)localized[key]=translated;
  }
  const sanitized={
    id:item.id,category:item.category,label:item.label,status:item.status as CheckStatus,
    detail:item.detail,suggestion:typeof item.suggestion==='string'?
      item.suggestion.slice(0,3000):'',evidence,
    ...(Object.keys(localized).length?{i18n:localized}:{})
  };
  // Historical schema v1 did not include provenance; do not invent it.
  const original=record(item.provenance);
  if(original && str(original.origin,50)&&str(original.confidence,50)&&
     str(original.method,80)&&str(original.host,100)&&str(original.target,100)&&
     typeof original.limitations==='string' && original.limitations.length<=2000){
    return {...sanitized,provenance:original} as DiagnosticCheck;
  }
  return sanitized as DiagnosticCheck;
}
export function restoreSession(value:unknown):DiagnosticSession|null {
  const raw=record(value);
  if(!raw || raw.state!=='completed'||!str(raw.id,90)||
     !str(raw.project,160)||!str(raw.completedAt,60)||!str(raw.startedAt,60)||
     !str(raw.host,100)||!Array.isArray(raw.checks)||
     !Array.isArray(raw.serviceChecks)||
     raw.checks.length>MAX_CHECKS||raw.serviceChecks.length>MAX_CHECKS)return null;
  let serial:string;
  try{serial=JSON.stringify(raw);}catch{return null;}
  if(serial.length>MAX_SNAPSHOT_BYTES)return null;
  const checks=raw.checks.map(finding),serviceChecks=raw.serviceChecks.map(finding);
  if(checks.includes(null)||serviceChecks.includes(null))return null;
  const discovery=record(raw.discovery);
  if(!discovery)return null;
  const safe={
    id:raw.id,project:raw.project,host:raw.host,state:'completed' as const,
    startedAt:raw.startedAt,completedAt:raw.completedAt,
    ...(typeof raw.schemaVersion==='number' && Number.isInteger(raw.schemaVersion)?
      {schemaVersion:raw.schemaVersion}:{}),
    ...(str(raw.scopeId,100)?{scopeId:raw.scopeId}:{}),
    checks:checks as DiagnosticCheck[],serviceChecks:serviceChecks as DiagnosticCheck[],
    discovery:JSON.parse(JSON.stringify(discovery)) as DiagnosticSession['discovery'],
    ...(record(raw.comparison) ? {comparison:JSON.parse(JSON.stringify(raw.comparison))}: {})
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

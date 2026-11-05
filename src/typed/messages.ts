import type {UIRequest} from './contracts';
const SIMPLE=new Set([
  'ready','selectProject','openHome','diagnose','cancel','prepareServices',
  'confirmServices','declineServices','clearHistory'
]);
function record(value:unknown): Record<string,unknown>|null {
  if(!value || typeof value!=='object' || Array.isArray(value))return null;
  const proto=Object.getPrototypeOf(value);
  if(proto!==Object.prototype && proto!==null)return null;
  return value as Record<string,unknown>;
}
export function validateUiMessage(input:unknown):UIRequest|null {
  const m=record(input);
  if(!m || typeof m.type!=='string' || m.type.length>40 || Object.keys(m).length>4)return null;
  const type=m.type;
  if(SIMPLE.has(type))return {type} as UIRequest;
  if(type==='addService') {
    if(typeof m.name!=='string' || !m.name.trim() || m.name.length>50 ||
      typeof m.url!=='string' || m.url.length>600)return null;
    return {type,name:m.name,url:m.url};
  }
  if(type==='removeService')return typeof m.url==='string' && m.url.length<=600 ? {type,url:m.url}:null;
  if(type==='copyEvidence')
    return typeof m.id==='string' && /^[a-z0-9-]{1,90}$/i.test(m.id)?{type,id:m.id}:null;
  if(type==='saveTimeout')
    return typeof m.value==='number' && Number.isInteger(m.value) && m.value>=400 && m.value<=10000 ?
      {type,value:m.value}:null;
  if(type==='export')
    return m.format==='md' || m.format==='json'?{type,format:m.format}:null;
  if(type==='selectHistory')
    return typeof m.index==='number' && Number.isInteger(m.index) && m.index>=-1 && m.index<10 ?
      {type,index:m.index}:null;
  if(type==='setLocale')
    return m.locale==='en'||m.locale==='es'?{type,locale:m.locale}:null;
  return null;
}

import type {CheckStatus, SessionSummary} from './contracts';
export interface Trend {
  id:string;
  before:CheckStatus|null;
  after:CheckStatus|null;
  trend:'new-observation'|'unchanged'|'status-changed'|'not-reobserved';
}
export interface Comparison {
  previousAt:string;
  currentAt:string;
  observations:Trend[];
  note:string;
}
export function compareSessions(previous:SessionSummary|null, current:SessionSummary|null):Comparison|null {
  if(!previous||!current||previous.state!=='completed'||current.state!=='completed'||
    previous.project!==current.project ||
    (previous.host!==undefined && current.host!==undefined && previous.host!==current.host) ||
    ((previous.scopeId!==undefined || current.scopeId!==undefined) && previous.scopeId!==current.scopeId))return null;
  const from=new Map((previous.checks||[]).concat(previous.serviceChecks||[]).map(c=>[c.id,c.status]));
  const to=new Map((current.checks||[]).concat(current.serviceChecks||[]).map(c=>[c.id,c.status]));
  const observations:Trend[]=[];
  for(const [id,status] of to) {
    const before=from.get(id);
    observations.push({id,before:before||null,after:status,
      trend:before===undefined?'new-observation':before===status?'unchanged':'status-changed'});
  }
  for(const [id,status] of from)if(!to.has(id))
    observations.push({id,before:status,after:null,trend:'not-reobserved'});
  return {previousAt:previous.completedAt,currentAt:current.completedAt,
    observations:observations.slice(0,150),
    note:'Status comparison only. A changed or absent observation does not prove the root cause was resolved.'};
}

'use strict';
function compareSessions(previous, current) {
  if (!previous || !current || previous.state!=='completed' || current.state!=='completed' ||
    previous.project!==current.project) return null;
  const from = new Map((previous.checks||[]).concat(previous.serviceChecks||[]).map(c=>[c.id,c.status]));
  const to = new Map((current.checks||[]).concat(current.serviceChecks||[]).map(c=>[c.id,c.status]));
  const observations=[];
  for (const [id,status] of to) {
    const before=from.get(id);
    observations.push({id, before:before || null, after:status,
      trend:before===undefined?'new-observation':before===status?'unchanged':'status-changed'});
  }
  for(const [id,status] of from) if(!to.has(id))
    observations.push({id,before:status,after:null,trend:'not-reobserved'});
  return {previousAt:previous.completedAt,currentAt:current.completedAt,
    observations:observations.slice(0,150),
    note:'Status comparison only. A changed or absent observation does not prove the root cause was resolved.'};
}
module.exports={compareSessions};

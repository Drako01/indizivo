import type {DiagnosticCheck} from './diagnostics';
import type {SessionStatus} from './contracts';
import type {I18nKey} from './i18n';
import {redactReport,redactSensitiveText} from './redaction';

/** Renderer deliberately has no VS Code dependency and never writes files. */
export interface ReportSession {
 project:string;
 completedAt:string;
 state:SessionStatus;
 host?:string;
 scopeId?:string;
 checks:readonly DiagnosticCheck[];
 serviceChecks:readonly DiagnosticCheck[];
}
export type ReportFormat='md'|'json';
export type ReportTranslation=(key:I18nKey)=>string;

/** Additive JSON metadata; preserve original session fields and order. */
export function renderReport(session:ReportSession,format:ReportFormat,
 tr:ReportTranslation,generatedAt:string=new Date().toISOString()):string {
 if(format==='json')
  return JSON.stringify(redactReport({
   ...session,reportFormatVersion:1,reportGeneratedAt:generatedAt
  }),null,2)+'\n';
 const lines=['# '+tr('report.heading'),'',tr('report.project')+': '+session.project,
  tr('report.date')+': '+session.completedAt,
  tr('report.state')+': '+tr(`state.${session.state}`),
  ...(session.host?[tr('report.host')+': '+session.host]:[]),
  ...(session.scopeId?[tr('report.scope')+': '+session.scopeId]:[]),
  '', '> '+tr('report.disclaimer'),''];
 for(const finding of [...session.checks,...session.serviceChecks]){
  lines.push('## '+finding.label,'',
   '**'+tr(`status.${finding.status}`)+'** — '+finding.detail,
   '',finding.suggestion||'','');
  const p=finding.provenance;
  if(p)lines.push(
   '- '+tr('ui.source')+': '+tr(`origin.${p.origin}`),
   '- '+tr('ui.method')+': '+p.method,
   '- '+tr('ui.confidence')+': '+tr(`confidence.${p.confidence}`),
   '- '+tr('ui.limitations')+': '+p.limitations);
  for(const evidence of finding.evidence||[])
   lines.push('- '+tr('report.evidence')+': '+evidence.fact+' ('+evidence.observedAt+')');
  lines.push('');
 }
 return redactSensitiveText(lines.join('\n'));
}

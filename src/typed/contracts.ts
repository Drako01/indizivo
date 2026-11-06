/** Type-safe contracts shared by the Indizivo diagnostic core and UI bridge. */
export type CheckStatus='pass'|'warn'|'info'|'inconclusive'|'blocked'|'skip';
export type SessionStatus='created'|'running'|'completed'|'cancelled'|'failed'|'partial';
export interface Evidence {
  id: string;
  fact: string;
  observedAt: string;
}
export interface Finding {
  id: string;
  category: string;
  label: string;
  status: CheckStatus;
  detail: string;
  suggestion?: string;
  evidence: readonly Evidence[];
}
export interface ServiceTarget {name:string; url:string}
export interface SessionSummary {
  project: string;
  host?:string;
  completedAt: string;
  state: SessionStatus;
  checks?: readonly Pick<Finding,'id'|'status'>[];
  serviceChecks?: readonly Pick<Finding,'id'|'status'>[];
}
export type UIRequest =
  | {type:'ready'|'selectProject'|'openHome'|'diagnose'|'cancel'|'prepareServices'|'confirmServices'|'declineServices'|'clearHistory'}
  | {type:'addService';name:string;url:string}
  | {type:'removeService';url:string}
  | {type:'copyEvidence';id:string}
  | {type:'saveTimeout';value:number}
  | {type:'export';format:'md'|'json'}
  | {type:'selectHistory';index:number}
  | {type:'setLocale';locale:'en'|'es'};

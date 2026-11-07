import * as crypto from 'node:crypto';
import {validateService} from './diagnostics';
import type {DiagnosticSession,ServiceTarget} from './diagnostics';
import {restoreSession,restoreHistory} from './storage';
import type {HistoryEntry} from './storage';
import type {Locale} from './i18n';

export type RunningSession=Pick<DiagnosticSession,'project'|'startedAt'|'completedAt'|'state'|'checks'|'serviceChecks'>;
export type DisplaySession=DiagnosticSession|RunningSession;
export interface ProjectData {
 session:DisplaySession|null;
 services:ServiceTarget[];
 history:HistoryEntry[];
 timeoutMs:number;
 locale:Locale;
}
/** The subset of vscode.Memento we need, so persistence is testable without VS Code. */
export interface StateStorage {
 get<T>(key:string,defaultValue:T):T;
 update(key:string,value:unknown):PromiseLike<void>;
}
export interface LoadedState {data:ProjectData;readFailed:boolean}

const DEFAULT_TIMEOUT_MS=2500;
const MIN_TIMEOUT_MS=400;
const MAX_TIMEOUT_MS=10000;
const MAX_SERVICES=20;

/** Persistence boundary for one workspace project; never throws on storage faults. */
export class ProjectStateStore {
 constructor(private readonly storage:StateStorage,
  private readonly defaultLocale:()=>Locale) {}

 /** Stable per-project key; the root URI is hashed so paths never reach storage keys. */
 key(rootUri:string|null):string {
  return 'indizivo:v1:'+crypto.createHash('sha256').update(rootUri||'none').digest('hex');
 }
 load(rootUri:string|null):LoadedState {
  // Broken or inaccessible workspaceState must not prevent activation, and a failed
  // read is never evidence of a previous successful check.
  let value:unknown={};
  let readFailed=false;
  try {value=this.storage.get<unknown>(this.key(rootUri),{});}
  catch {readFailed=true;}
  const stored=value && typeof value==='object' && !Array.isArray(value)?
   value as Partial<ProjectData>:{};
  const timeout=typeof stored.timeoutMs==='number' && Number.isFinite(stored.timeoutMs)?
   stored.timeoutMs:DEFAULT_TIMEOUT_MS;
  return {readFailed,data:{
   session:restoreSession(stored.session),
   services:(Array.isArray(stored.services)?stored.services:[]).map(validateService)
    .filter((item):item is ServiceTarget=>item!==null).slice(0,MAX_SERVICES),
   history:restoreHistory(stored.history),
   timeoutMs:Math.min(MAX_TIMEOUT_MS,Math.max(MIN_TIMEOUT_MS,timeout)),
   locale:stored.locale==='es'||stored.locale==='en'?stored.locale:this.defaultLocale()
  }};
 }
 /** @returns false when storage rejected the write; callers keep the in-memory data. */
 async save(rootUri:string|null,data:ProjectData):Promise<boolean> {
  try {await this.storage.update(this.key(rootUri),data);return true;}
  catch {return false;}
 }
}

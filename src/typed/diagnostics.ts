import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as net from 'node:net';
import * as http from 'node:http';
import * as crypto from 'node:crypto';
import {execFile} from 'node:child_process';
import {evaluateVersion} from './versions';
import {inspectOwner} from './port-owners';
import type {FindingTranslation,Descriptor} from './i18n';
import type {CheckStatus,SessionStatus} from './contracts';
import type {Comparison} from './comparison';
export interface PackageManifest {
 scripts?:Record<string,string>;
 dependencies?:Record<string,string>;
 devDependencies?:Record<string,string>;
 engines?:{node?:string};
}
export interface Discovery {
 project:string;node:boolean;go:boolean;malformedPackage:boolean;
 nodeRequirement:string;goRequirement:string;ports:number[];
 requiredEnv:string[];missingEnv:string[];
 hasEnvExample:boolean;hasEnvFile:boolean;
}
export interface Evidence {id:string;fact:string;observedAt:string}
export interface DiagnosticCheck {
 id:string;category:string;label:string;status:CheckStatus;
 detail:string;suggestion:string;evidence:Evidence[];i18n?:FindingTranslation|undefined;
}
export interface DiagnosticSession {
 id:string;project:string;startedAt:string;completedAt:string;
 host:string;state:SessionStatus;checks:DiagnosticCheck[];discovery:Discovery;
 serviceChecks:DiagnosticCheck[];
 comparison?:Comparison|null;
}
export interface ServiceTarget {name:string;url:string}
type VersionResult={ok:boolean;value:string};
type PortState='cancelled'|'listening'|'timeout'|'not-listening'|'inconclusive';
type ServiceResult={ok:boolean;detail:string};


function assertActive(signal?:AbortSignal):void {
  if(signal?.aborted) {
    const err=new Error('Diagnosis cancelled') as Error & {code:string};
    err.code='ABORT_ERR';
    throw err;
  }
}
const msg=(key:Descriptor['key'],values?:Descriptor['values']):Descriptor=>
  values?{key,values}:{key};
function createCheck(id:string,category:string,label:string,status:CheckStatus,
 detail:string,suggestion='',fact='',i18n?:FindingTranslation):DiagnosticCheck {
  return { id, category, label, status, detail, suggestion: suggestion || '', i18n,
    evidence: [{ id: crypto.randomBytes(6).toString('hex'), fact: String(fact || detail),
      observedAt: new Date().toISOString() }] };
}
export function parsePorts(scripts:Record<string,string>|null|undefined):number[] {
  const result = new Set<number>();
  for (const script of Object.values(scripts || {})) {
    if (typeof script !== 'string') continue;
    const match = /(?:--port[= ]|(?:^|\s)PORT\s*=\s*)(\d{2,5})/i.exec(script);
    const port=Number(match?.[1] ?? 0);
    if (port > 0 && port < 65536) result.add(port);
  }
  return [...result].sort((a, b) => a-b).slice(0, 12);
}
export function parseKeys(data:string|undefined|null):string[] {
  const names=new Set<string>();
  for(const line of (data||'').split(/\r?\n/)) {
    const key=/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]{0,79})\s*=/.exec(line)?.[1];
    if(key)names.add(key);
    if(names.size>=100)break;
  }
  return [...names];
}
function safeVersionRequirement(input:unknown):string {
  const value=String(input||'').trim().slice(0,80);
  return /^[0-9v.^~<>=*xX\s,-]{1,80}$/.test(value)?value:'';
}
async function readBounded(root:string,name:string):Promise<string> {
  let handle:fs.FileHandle|undefined;
  try {
    const base=await fs.realpath(root);
    const full=path.resolve(root,name);
    if(!full.startsWith(path.resolve(root)+path.sep))return '';
    const stat=await fs.lstat(full);
    if(!stat.isFile() || stat.isSymbolicLink() || stat.size>262144)return '';
    const real=await fs.realpath(full);
    if(!real.startsWith(base+path.sep))return '';
    // No shell, no traversal and no following a replaced final symlink.
    const flags=require('node:fs').constants;
    handle=await fs.open(full,flags.O_RDONLY|(flags.O_NOFOLLOW||0));
    const fileStat=await handle.stat();
    if(!fileStat.isFile() || fileStat.size>262144)return '';
    const limit=262145;
    const buffer=Buffer.alloc(limit);
    let total=0;
    while(total<limit) {
      const chunk=await handle.read(buffer,total,limit-total,total);
      if(!chunk.bytesRead)break;
      total+=chunk.bytesRead;
    }
    if(total>262144)return '';
    return buffer.subarray(0,total).toString('utf8');
  } catch { return ''; }
  finally { if(handle)await handle.close(); }
}
export function validateService(input:unknown):ServiceTarget|null {
  if(!input || typeof input!=='object')return null;
  const candidate=input as Partial<ServiceTarget>;
  if (typeof candidate.name !== 'string' || typeof candidate.url !== 'string') return null;
  const name = candidate.name.trim().slice(0, 50);
  if (!name) return null;
  try {
    const url = new URL(candidate.url);
    if (url.protocol !== 'http:' || !['localhost','127.0.0.1','[::1]'].includes(url.hostname) ||
      url.username || url.password || url.hash || url.search || url.href.length > 600) return null;
    return { name, url: url.href };
  } catch { return null; }
}
export async function discover(root:string):Promise<Discovery> {
  const packageText = await readBounded(root, 'package.json');
  const goMod = await readBounded(root, 'go.mod');
  const example = await readBounded(root, '.env.example');
  const env = await readBounded(root, '.env');
  const nvm = safeVersionRequirement(await readBounded(root, '.nvmrc'));
  let pkg:PackageManifest|null=null;
  try {
    const parsed:unknown=packageText?JSON.parse(packageText):null;
    if(parsed && typeof parsed==='object'&&!Array.isArray(parsed))
      pkg=parsed as PackageManifest;
  }catch{pkg=null;}
  const scripts = pkg && typeof pkg.scripts === 'object' ? pkg.scripts : {};
  const ports = parsePorts(scripts);
  const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
  if (!ports.length && deps.next) ports.push(3000);
  if (!ports.length && deps.vite) ports.push(5173);
  const required = parseKeys(example);
  const provided = new Set(parseKeys(env));
  return { project: path.basename(root), node: Boolean(packageText), go: Boolean(goMod),
    malformedPackage: Boolean(packageText && !pkg),
    nodeRequirement: nvm || safeVersionRequirement(pkg?.engines?.node),
    goRequirement: /^\s*go\s+([\d.]+)/m.exec(goMod)?.[1] || '',
    ports, requiredEnv: required, missingEnv: required.filter(key => !provided.has(key)),
    hasEnvExample: !!example, hasEnvFile: !!env };
}
function runVersion(command:string,args:string[],timeout:number,signal?:AbortSignal):
 Promise<VersionResult> {
  return new Promise<VersionResult>(resolve => {
    if (signal?.aborted) return resolve({ ok: false, value: 'Cancelled' });
    let finished = false;
    const child = execFile(command, args, { shell: false, timeout, maxBuffer: 16384,
      windowsHide: true }, (err, stdout, stderr) => {
      if (finished) return;
      finished = true;
      signal?.removeEventListener('abort', cancel);
      const raw=String(stdout || stderr).trim();
      const safeVersion = command === 'node' ? /^v\d+\.\d+\.\d+/.exec(raw)?.[0] :
        /^go version go\d+\.\d+(?:\.\d+)?/.exec(raw)?.[0];
      resolve({ ok: !err && !!safeVersion, value: err ? (err.code === 'ENOENT' ? 'Not installed / not on PATH' :
        'Could not inspect runtime') : (safeVersion || 'Unrecognized runtime version output') });
    });
    function cancel() { try { child.kill(); } catch { /* ignore */ } }
    signal?.addEventListener('abort', cancel, { once: true });
  });
}
function inspectPort(port:number,timeout:number,signal?:AbortSignal):Promise<PortState> {
  return new Promise<PortState>(resolve => {
    if (signal?.aborted) return resolve('cancelled');
    const socket = new net.Socket();
    let done = false;
    function finish(state:PortState):void { if (done) return; done = true;
      signal?.removeEventListener('abort', cancel); socket.destroy(); resolve(state); }
    function cancel() { finish('cancelled'); }
    signal?.addEventListener('abort', cancel, { once: true });
    socket.setTimeout(timeout);
    socket.once('connect', () => finish('listening'));
    socket.once('timeout', () => finish('timeout'));
    socket.once('error', err => finish('code' in err && err.code === 'ECONNREFUSED' ? 'not-listening' : 'inconclusive'));
    socket.connect({ host: '127.0.0.1', port });
  });
}
function inspectService(service:ServiceTarget,timeout:number,signal?:AbortSignal):Promise<ServiceResult> {
  const valid = validateService(service);
  if (!valid) return Promise.resolve({ ok: false, detail: 'Blocked: only local HTTP targets allowed.' });
  return new Promise<ServiceResult>(resolve => {
    if (signal?.aborted) return resolve({ ok: false, detail: 'Cancelled' });
    let done = false;
    function finish(ok:boolean, detail:string):void { if (done) return; done = true;
      signal?.removeEventListener('abort', cancel); resolve({ ok, detail }); }
    const req = http.get(valid.url, { timeout, agent: false,
      lookup: (_host, _options, callback) => callback(null, '127.0.0.1', 4),
      headers: { 'user-agent': 'Indizivo/0.1' } }, res => {
      // Headers are sufficient evidence. Never download or buffer service bodies.
      const status=res.statusCode ?? 0;
      finish(status >= 200 && status < 300, 'HTTP ' + status);
      res.destroy();
    });
    const cancel = () => req.destroy(new Error('cancelled'));
    signal?.addEventListener('abort', cancel, { once: true });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', () => finish(false, signal?.aborted ? 'Cancelled' : 'Connection unavailable'));
  });
}
export async function diagnose(root:string,timeout=2500,signal?:AbortSignal,
 progress?:(checks:DiagnosticCheck[])=>void):Promise<DiagnosticSession> {
  const start = new Date().toISOString();
  assertActive(signal);
  const d = await discover(root);
  assertActive(signal);
  const checks:DiagnosticCheck[] = [];
  const push = (c:DiagnosticCheck):void => { checks.push(c); progress?.([...checks]); };
  const t = Math.min(10000, Math.max(400, Number(timeout) || 2500));
  if (d.malformedPackage) push(createCheck('package','Configuration','package.json','warn',
    'Invalid JSON; Node.js project metadata cannot be inspected.','','', {
      category:msg('diag.category.Configuration'),detail:msg('diag.invalidPackage')
    }));
  if (d.node) {
    if (signal?.aborted) throw new Error('Cancelled');
    const result = await runVersion('node',['--version'], t, signal);
    assertActive(signal);
    const localizedVersion=result.ok ? result.value :
      result.value==='Not installed / not on PATH' ? msg('diag.notInstalled') :
      result.value==='Could not inspect runtime' ? msg('diag.runtimeUnavailable') :
      msg('diag.runtimeUnknown');
    const verdict = result.ok ? evaluateVersion(result.value.replace(/^v/,''),d.nodeRequirement,'node') : null;
    const nodeStatus = !result.ok || verdict?.status==='incompatible'?'warn':
      verdict?.status==='compatible'?'pass':'info';
    push(createCheck('node','Runtime','Node.js',nodeStatus,
      result.value + (d.nodeRequirement ? ' — declared requirement: ' + d.nodeRequirement : '') +
      (verdict ? '. '+verdict.detail : ''),
      nodeStatus==='warn'?'Check the configured Node.js runtime version.':
      !d.nodeRequirement?'Declare engines.node in package.json or add .nvmrc to enable compatibility checks.':
      'The declared requirement was evaluated when supported.',
      'Runtime output: '+result.value, {
        category:msg('diag.category.Runtime'),
        detail:msg('diag.nodeDetail',{version:localizedVersion,
          required:d.nodeRequirement?msg('diag.nodeRequired',{requirement:d.nodeRequirement}):'',
          verdict:verdict ? (verdict.translation||verdict.detail):''}),
        suggestion:msg(nodeStatus==='warn'?'diag.nodeWarn':
          !d.nodeRequirement?'diag.nodeNoReq':'diag.nodeChecked'),
        evidence:msg('diag.outputVersion',{value:localizedVersion})
      }));
  }
  if (d.go) {
    if (signal?.aborted) throw new Error('Cancelled');
    const result = await runVersion('go',['version'],t,signal);
    assertActive(signal);
    const localizedVersion=result.ok ? result.value :
      result.value==='Not installed / not on PATH' ? msg('diag.notInstalled') :
      result.value==='Could not inspect runtime' ? msg('diag.runtimeUnavailable') :
      msg('diag.runtimeUnknown');
    const actual = /^go version go([\d.]+)/.exec(result.value)?.[1];
    const verdict = actual ? evaluateVersion(actual,d.goRequirement,'go') : null;
    const goStatus = !result.ok || verdict?.status==='incompatible'?'warn':
      verdict?.status==='compatible'?'pass':'info';
    push(createCheck('go','Runtime','Go',goStatus,
      result.value + (d.goRequirement ? ' — module requirement: '+d.goRequirement : '') +
      (verdict ? '. '+verdict.detail : ''),
      goStatus==='warn'?'Check the declared Go toolchain minimum.':'Only validated constraints are considered compatible.',
      'Runtime output: '+result.value, {
        category:msg('diag.category.Runtime'),
        detail:msg('diag.nodeDetail',{version:localizedVersion,
          required:d.goRequirement?msg('diag.goRequired',{requirement:d.goRequirement}):'',
          verdict:verdict ? (verdict.translation||verdict.detail):''}),
        suggestion:msg(goStatus==='warn'?'diag.goWarn':'diag.goChecked'),
        evidence:msg('diag.outputVersion',{value:localizedVersion})
      }));
  }
  if (d.hasEnvExample) {
    const missing = d.missingEnv;
    push(createCheck('env','Configuration','Environment key presence',missing.length?'warn':'pass',
      missing.length ? 'Missing in .env: ' + missing.join(', ') :
        'Required names present. Secret values were not inspected or validated.',
      'Add required keys manually. Never paste secrets into reports.',
      'Key presence only; secret values not retained', {
        label:msg('diag.label.env'),category:msg('diag.category.Configuration'),
        detail:msg(missing.length?'diag.missingEnv':'diag.envPresent',
          missing.length?{keys:missing.join(', ')}:{}),
        suggestion:msg('diag.envNext'),evidence:msg('diag.envEvidence')
      }));
  }
  for (const port of d.ports) {
    if (signal?.aborted) throw new Error('Cancelled');
    const status = await inspectPort(port,t,signal);
    assertActive(signal);
    const owner = status==='listening' ? await inspectOwner(port,t,signal) : null;
    assertActive(signal);
    const ownerDetail=owner?.owners?.length ?
      ' Listening owner(s): '+owner.owners.map(x=>x.name+' PID '+x.pid).join(', ')+'.' :
      status==='listening' ? ' Process owner not established (tool, permission or namespace limitation).' : '';
    push(createCheck('port-'+port,'Ports','Port '+port,
      ['listening','not-listening'].includes(status)?'info':'warn',
      (status === 'listening' ? 'A TCP listener responded on 127.0.0.1:'+port+
        '. This does not establish a process conflict.' :
        status === 'not-listening' ? 'No local TCP listener responded on 127.0.0.1:'+port+
        '. The application may not be started.' : 'Port status could not be verified.')+ownerDetail,
      'Inspect service startup logs and host bindings; do not terminate processes blindly.',
      'TCP loopback result: '+status+'. '+(owner?.detail || 'Owner inspection not applicable.'), {
        category:msg('diag.category.Ports'),label:msg('diag.label.port',{port}),
        detail:msg(status==='listening'?'diag.portListening':
          status==='not-listening'?'diag.portNotListening':'diag.portUnknown',
          {port,owner:status==='listening'?owner?.owners?.length?
            msg('diag.portOwners',{owners:owner.owners.map(x=>x.name+' PID '+x.pid).join(', ')}):
            msg('diag.portNoOwner'):''}),
        suggestion:msg('diag.portNext'),
        evidence:msg('diag.portEvidence',{status:msg(status==='listening'?'diag.portStateListening':
          status==='not-listening'?'diag.portStateNotListening':
          status==='timeout'?'diag.portStateTimeout':
          status==='cancelled'?'diag.portStateCancelled':'diag.portStateInconclusive'),
          ownership:owner?.i18nDetail||
          (owner?.detail||msg('diag.portOwnerNA'))})
      }));
  }
  assertActive(signal);
  if (!checks.length) push(createCheck('none','Discovery','No applicable checks','info',
    'No supported Node.js/Go configuration or ports found. Add a local service to investigate.','','',{
      label:msg('diag.label.none'),category:msg('diag.category.Discovery'),
      detail:msg('diag.noneDetail')
    }));
  return { id: crypto.randomBytes(8).toString('hex'), project: d.project,
    startedAt:start, completedAt:new Date().toISOString(), host:process.platform,
    state:'completed', checks, discovery:d, serviceChecks:[] };
}
export async function verifyServices(services:ServiceTarget[],timeout:number,signal?:AbortSignal,
 progress?:(checks:DiagnosticCheck[])=>void):Promise<DiagnosticCheck[]> {
  const checks:DiagnosticCheck[] = [];
  for (let i=0;i<services.length;i++) {
    if (signal?.aborted) throw new Error('Cancelled');
    const svc = validateService(services[i]);
    if (!svc) continue;
    const result = await inspectService(svc, Math.max(400, Math.min(10000, timeout)), signal);
    assertActive(signal);
    checks.push(createCheck('service-'+i,'Services',svc.name,
      result.ok?'pass':'warn',result.detail,
      result.ok?'':'Check the service, port and endpoint; no changes were made.',
      'Loopback '+svc.url+' → '+result.detail, {
        category:msg('diag.category.Services'),
        detail:msg(result.detail==='Cancelled'?'diag.cancelled':
          result.detail==='Connection unavailable'?'diag.connectionUnavailable':
          result.detail.startsWith('HTTP ')?'diag.http':'diag.blockedTarget',
          result.detail.startsWith('HTTP ')?{status:result.detail.slice(5)}:{}),
        suggestion:result.ok?undefined:msg('diag.serviceNext'),
        evidence:msg('diag.serviceEvidence',{url:svc.url,
          detail:result.detail==='Cancelled'?msg('diag.cancelled'):
          result.detail==='Connection unavailable'?msg('diag.connectionUnavailable'):
          result.detail.startsWith('HTTP ')?msg('diag.http',{status:result.detail.slice(5)}):
          msg('diag.blockedTarget')})
      }));
    progress?.([...checks]);
  }
  return checks;
}

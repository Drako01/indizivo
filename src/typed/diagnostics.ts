import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as net from 'node:net';
import * as http from 'node:http';
import * as crypto from 'node:crypto';
import {probeTool} from './tool-probes';
import {DiagnosticBudget,DiagnosticBudgetExhausted} from './budget';
import type {ToolName,ToolResult} from './tool-probes';
import {evaluateVersion,parseVersion,compare} from './versions';
import {inspectOwners} from './port-owners';
import type {OwnerInspection} from './port-owners';
import type {FindingTranslation,Descriptor} from './i18n';
import type {CheckStatus,SessionStatus,CheckProvenance,FindingMetadata} from './contracts';
import type {Comparison} from './comparison';
export interface PackageManifest {
 scripts?:Record<string,string>;
 dependencies?:Record<string,string>;
 devDependencies?:Record<string,string>;
 engines?:{node?:string};
 packageManager?:string;
}
export type FileReadState='present'|'missing'|'blocked'|'unreadable';
export interface Discovery {
 project:string;node:boolean;go:boolean;malformedPackage:boolean;
 optionalRuntimes:Record<string,string[]>;
 fileStates:Record<string,FileReadState>;
 lockfiles:string[];packageManager:string;
 nodeRequirement:string;goRequirement:string;goToolchain:string;ports:number[];
 goRequirementOrigin:'declared'|'implicit'|'invalid'|'none';
 goToolchainOrigin:'declared'|'invalid'|'none';
  portOrigins:Record<string,'declared'|'heuristic'>;
 requiredEnv:string[];missingEnv:string[];
 hasEnvExample:boolean;hasEnvFile:boolean;
}
export interface Evidence {id:string;fact:string;observedAt:string}
export interface DiagnosticCheck {
 id:string;category:string;label:string;status:CheckStatus;
 detail:string;suggestion:string;evidence:Evidence[];i18n?:FindingTranslation;
 provenance:CheckProvenance;metadata?:FindingMetadata;
}
export interface DiagnosticSession {
 id:string;project:string;startedAt:string;completedAt:string;
 schemaVersion:number;scopeId?:string;
 host:string;state:SessionStatus;checks:DiagnosticCheck[];discovery:Discovery;
 serviceChecks:DiagnosticCheck[];
 comparison?:Comparison|null;
}
export interface ServiceTarget {name:string;url:string}
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
 detail:string,suggestion='',fact='',i18n?:FindingTranslation,inferred=false):DiagnosticCheck {
  const origin:CheckProvenance['origin']=inferred?'framework-convention':
    category==='Runtime'?'runtime-tool':category==='Ports'?'tcp-loopback':
    category==='Services'?'approved-http':category==='Discovery'?'discovery':'workspace-file';
  const method=category==='Runtime'?'execFile':category==='Ports'?'TCP connect':
    category==='Services'?'HTTP GET':category==='Discovery'?'workspace discovery':'bounded file read';
  const provenance:CheckProvenance={
    origin,method,host:process.platform,target:id,
    confidence:status==='inconclusive'?'inconclusive':inferred?'inferred':'observed',
    limitations:category==='Ports'?'A listener does not prove a process conflict.':
      category==='Runtime'?'A runtime version does not guarantee project compatibility.':
      category==='Services'?'HTTP status does not prove full service health.':
      'Only supported configuration sources were inspected.'
  };
  const checkId=id.startsWith('service-rejected-')?'service-target-validation':
    category==='Services'?'approved-http':category==='Ports'?'tcp-listener':
    category==='Runtime'?'runtime-version':id.startsWith('file-')?'workspace-file-access':id;
  const metadata:FindingMetadata={
    schemaVersion:1,checkId,targetId:id,
    severity:status==='pass'||status==='info'?'none':'unassessed'
  };
  const limitationsKey:Descriptor['key']=category==='Ports'?'diag.limitationPorts':
    category==='Runtime'?'diag.limitationRuntime':
    category==='Services'?'diag.limitationServices':
    category==='Discovery'?'diag.limitationDiscovery':'diag.limitationConfiguration';
  const localized:FindingTranslation={...(i18n||{}),limitations:msg(limitationsKey)};
  return {id,category,label,status,detail,suggestion:suggestion||'',provenance,metadata,
    i18n:localized,
    evidence:[{id:crypto.randomBytes(6).toString('hex'),fact:String(fact||detail),
      observedAt:new Date().toISOString()}]};
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
  if(typeof input!=='string')return '';
  const value=input.trim();
  if(!value)return '';
  // Unsupported declaration is not equivalent to no requirement.
  // Do not retain untrusted input verbatim in history, reports or clipboard.
  return value.length<=80 && /^[0-9v.^~<>=*xX|\s,]{1,80}$/.test(value)
    ?value:'[unrecognized]';
}
interface InputFile {state:FileReadState;data:string}
/** Compare OS-backed identities, not paths, to detect replacement after lstat. */
type FileId=number|bigint;
export function sameFileIdentity(
 before:{dev:FileId;ino:FileId},after:{dev:FileId;ino:FileId}):boolean {
 // NTFS file IDs exceed 2^53: callers pass bigint stats so they stay exact.
 const known=(value:FileId)=>typeof value==='bigint'?value>0n:Number.isSafeInteger(value) && value>0;
 return known(before.ino) && before.dev===after.dev && before.ino===after.ino;
}
function classifiedError(error:unknown):FileReadState {
  const code=error && typeof error==='object' && 'code' in error ? String(error.code) : '';
  return code==='ENOENT'?'missing':'unreadable';
}
async function readBounded(root:string,name:string):Promise<InputFile> {
  let handle:fs.FileHandle|undefined;
  const fail=(state:FileReadState):InputFile=>({state,data:''});
  try {
    const base=await fs.realpath(root);
    const full=path.resolve(root,name);
    if(!full.startsWith(path.resolve(root)+path.sep))return fail('blocked');
    let stat;
    try { stat=await fs.lstat(full,{bigint:true}); } catch(error) {return fail(classifiedError(error));}
    if(!stat.isFile() || stat.isSymbolicLink() || stat.size>262144n)return fail('blocked');
    const real=await fs.realpath(full);
    if(!real.startsWith(base+path.sep))return fail('blocked');
    // No shell, no traversal and no following a replaced final symlink.
    const flags=require('node:fs').constants;
    handle=await fs.open(full,flags.O_RDONLY|(flags.O_NOFOLLOW||0));
    const fileStat=await handle.stat({bigint:true});
    // fstat operates on the opened descriptor. An attacker replacing the
    // filename between lstat() and open() cannot silently change our source.
    if(!fileStat.isFile() || fileStat.size>262144n ||
      !sameFileIdentity(stat,fileStat))return fail('blocked');
    const limit=262145;
    const buffer=Buffer.alloc(limit);
    let total=0;
    while(total<limit) {
      const chunk=await handle.read(buffer,total,limit-total,total);
      if(!chunk.bytesRead)break;
      total+=chunk.bytesRead;
    }
    if(total>262144)return fail('blocked');
    const after=await handle.stat({bigint:true});
    // A concurrent in-place write can invalidate a coherent file snapshot.
    // We do not claim to protect against every nanosecond-scale mutation.
    if(!sameFileIdentity(fileStat,after) || after.size!==fileStat.size ||
      after.mtimeNs!==fileStat.mtimeNs)return fail('blocked');
    return {state:'present',data:buffer.subarray(0,total).toString('utf8')};
  } catch(error) {return fail(classifiedError(error));}
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
/** Only inspect metadata, never read potentially huge lockfiles or follow symlinks. */
async function declaredLockfiles(root:string):Promise<string[]> {
 const known=['package-lock.json','npm-shrinkwrap.json','pnpm-lock.yaml',
   'yarn.lock','bun.lock','bun.lockb'];
 const found:string[]=[];
 for(const name of known){
  try{
   const file=await fs.lstat(path.join(root,name));
   if(file.isFile() && !file.isSymbolicLink())found.push(name);
  }catch{/* unavailable is not equivalent to absence; do not assert package health */}
 }
 return found;
}
function safeManager(value:unknown):string {
 if(typeof value!=='string'||value.length>64)return '';
 return /^(?:npm|pnpm|yarn|bun)@[0-9][0-9A-Za-z.+-]{0,40}$/.test(value)?value:'';
}
/** Bounded go.mod directive inspection: never echo untrusted directive values.
 * Per go.dev/ref/mod: absent go directive means an implicit Go 1.16 minimum,
 * while toolchain is a suggestion, NOT a second hard minimum.
 * This is deliberately not a full go.mod parser: unsupported inputs fail closed.
 */
export function parseGoDirectives(content:string):{
 minimum:string;toolchain:string;
 minimumOrigin:'declared'|'implicit'|'invalid';
 toolchainOrigin:'declared'|'invalid'|'none'
} {
 const lines=content.split(/\r?\n/);
 const directives:{go:string[];toolchain:string[];module:string[]}={
  go:[],toolchain:[],module:[]
 };
 for(const raw of lines){
  const line=raw.trim();
  if(!line||line.startsWith('//'))continue;
  const match=/^(go|toolchain|module)(?=\s|$)/.exec(line);
  if(match){
   const kind=match[1] as keyof typeof directives;
   directives[kind].push(line.slice(kind.length).trim());
  }
 }
 const clean=(value:string):string=>value.replace(/\s+\/\/.*$/,'').trim();
 const goLine=directives.go.length===1?clean(directives.go[0] ?? ''):'';
 const toolLine=directives.toolchain.length===1?clean(directives.toolchain[0] ?? ''):'';
 const validGo=(value:string):boolean=>/^\d{1,3}\.\d{1,3}(?:\.\d{1,3})?$/.test(value);
 const validModule=directives.module.length===1 &&
  (directives.module[0]?.length ?? 0)>0 && directives.module[0]!=='(';
 let minimum='[unrecognized]';
 let minimumOrigin:'declared'|'implicit'|'invalid'='invalid';
 if(validModule && directives.go.length===0){
  minimum='1.16';minimumOrigin='implicit';
 }else if(validModule && directives.go.length===1 && validGo(goLine)){
  minimum=goLine;minimumOrigin='declared';
 }
 let toolchain='';
 let toolchainOrigin:'declared'|'invalid'|'none'='none';
 if(directives.toolchain.length){
  toolchainOrigin='invalid';toolchain='[unrecognized]';
  if(directives.toolchain.length===1 && minimumOrigin!=='invalid'){
   if(toolLine==='default'){
    toolchain='default';toolchainOrigin='declared';
   }else{
    const name=/^go(\d{1,3}\.\d{1,3}(?:\.\d{1,3})?)$/.exec(toolLine)?.[1];
    const v=name?parseVersion(name):null;
    const min=parseVersion(minimum);
    // Go 1.21+ release toolchain names require an explicit patch version.
    if(name && v && min && compare(v,min)>=0 && (v.minor<21 || v.precision===3)){
     toolchain=name;toolchainOrigin='declared';
    }
   }
  }
 }
 return {minimum,toolchain,minimumOrigin,toolchainOrigin};
}
export async function discover(root:string):Promise<Discovery> {
  const fileNames=['package.json','go.mod','.env.example','.env','.nvmrc',
    'pyproject.toml','requirements.txt','Pipfile','.python-version',
    'composer.json','.php-version','pom.xml','build.gradle','build.gradle.kts',
    'Dockerfile','compose.yaml','compose.yml','docker-compose.yml'] as const;
  const files=await Promise.all(fileNames.map(name=>readBounded(root,name)));
  const [packageFile,goFile,exampleFile,envFile,nvmFile]=files;
  const packageText=packageFile?.data||'',goMod=goFile?.data||'';
  const goDirectives=goFile?.state==='present'?parseGoDirectives(goMod):null;
  const example=exampleFile?.data||'',env=envFile?.data||'';
  const nvm=safeVersionRequirement(nvmFile?.data);
  const fileStates:Record<string,FileReadState>={};
  for(const [index,name] of fileNames.entries())
    fileStates[name]=files[index]?.state||'unreadable';
  let pkg:PackageManifest|null=null;
  try {
    const parsed:unknown=packageText?JSON.parse(packageText):null;
    if(parsed && typeof parsed==='object'&&!Array.isArray(parsed))
      pkg=parsed as PackageManifest;
  }catch{pkg=null;}
  const scripts = pkg && typeof pkg.scripts === 'object' ? pkg.scripts : {};
  const packageManager=safeManager(pkg?.packageManager);
  const lockfiles=packageFile?.state==='present'?await declaredLockfiles(root):[];
  const ports = parsePorts(scripts);
  const portOrigins:Record<string,'declared'|'heuristic'>={};
  for(const port of ports)portOrigins[String(port)]='declared';
  const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
  if (!ports.length && deps.next){ports.push(3000);portOrigins['3000']='heuristic';}
  if (!ports.length && deps.vite){ports.push(5173);portOrigins['5173']='heuristic';}
  const required = parseKeys(example);
  const provided = new Set(parseKeys(env));
  const envInspectable=envFile?.state==='present'||envFile?.state==='missing';
  const candidates:Record<string,readonly string[]>={
    python:['pyproject.toml','requirements.txt','Pipfile','.python-version'],
    php:['composer.json','.php-version'],
    java:['pom.xml','build.gradle','build.gradle.kts'],
    docker:['Dockerfile','compose.yaml','compose.yml','docker-compose.yml']
  };
  const optionalRuntimes:Record<string,string[]>={};
  for(const [runtime,names] of Object.entries(candidates))
    optionalRuntimes[runtime]=names.filter(name=>fileStates[name]==='present');
  return { project: path.basename(root), node: packageFile?.state==='present', go: goFile?.state==='present',
    malformedPackage: packageFile?.state==='present' && !pkg, fileStates,optionalRuntimes,
    lockfiles,packageManager,
    nodeRequirement: nvm || safeVersionRequirement(pkg?.engines?.node),
    goRequirement:goDirectives?.minimum||'',
    goToolchain:goDirectives?.toolchain||'',
    goRequirementOrigin:goDirectives?.minimumOrigin||'none',
    goToolchainOrigin:goDirectives?.toolchainOrigin||'none',
    ports,portOrigins, requiredEnv: required, missingEnv: envInspectable?required.filter(key => !provided.has(key)):[],
    hasEnvExample: exampleFile?.state==='present', hasEnvFile: envFile?.state==='present' };
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
    const host=new URL(valid.url).hostname;
    // Never resolve arbitrary DNS; preserve the approved IPv4/IPv6 loopback target.
    const address=host==='[::1]'?'::1':'127.0.0.1';
    const family=address==='::1'?6:4;
    const req = http.get(valid.url, { timeout, agent: false,
      lookup: (_host, _options, callback) => callback(null, address, family),
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
  const t=Math.min(10000,Math.max(400,Number(timeout)||2500));
  const budget=new DiagnosticBudget(Math.min(45000,Math.max(5000,t*6)));
  const timeLeft=()=>budget.remaining(t);
  assertActive(signal);
  const d = await discover(root);
  assertActive(signal);
  const checks:DiagnosticCheck[] = [];
  const push = (c:DiagnosticCheck):void => { checks.push(c); progress?.([...checks]); };
  let finalState:SessionStatus='completed';
  try{
  timeLeft();
  for(const [name,status] of Object.entries(d.fileStates)) {
    if(status!=='blocked' && status!=='unreadable')continue;
    const safeId=name.replace(/[^a-z0-9]/gi,'-');
    push(createCheck('file-'+safeId,'Configuration',name,'inconclusive',
      'Configuration source could not be inspected ('+status+').',
      'Review file permissions, size and symlinks before relying on missing configuration conclusions.',
      'Source '+name+' was '+status+'; contents were not retained.', {
        category:msg('diag.category.Configuration'),
        detail:msg('diag.fileUnavailable',{source:name}),
        suggestion:msg('diag.fileNext'),
        evidence:msg('diag.fileEvidence',{source:name,status})
      }));
  }
  if (d.malformedPackage) push(createCheck('package','Configuration','package.json','warn',
    'Invalid JSON; Node.js project metadata cannot be inspected.','','', {
      category:msg('diag.category.Configuration'),detail:msg('diag.invalidPackage')
    }));
  if(d.node && (d.lockfiles.length || d.packageManager)){
    const names=d.lockfiles.join(', ')||'none';
    const expected=d.packageManager.split('@')[0]||'';
    const matches=(name:string)=>expected==='pnpm'?name==='pnpm-lock.yaml':
      expected==='yarn'?name==='yarn.lock':
      expected==='bun'?name==='bun.lock'||name==='bun.lockb':
      expected==='npm'?name==='package-lock.json'||name==='npm-shrinkwrap.json':true;
    const unexpected=d.lockfiles.length>1 || Boolean(expected && d.lockfiles.some(name=>!matches(name)));
    push(createCheck('package-manager','Configuration','Package manager and lockfiles',
      unexpected?'warn':'info',
      'Declared package manager: '+(d.packageManager||'not declared')+'. Lockfiles: '+names+
      (unexpected?'. Multiple or unexpected root lockfiles require manual verification.':''),
      'Confirm the intended package manager and lockfile before changing dependencies.',
      'File names only; lockfile contents were not read.',{
       category:msg('diag.category.Configuration'),
       detail:msg('diag.lockfilesDetail',{manager:d.packageManager||msg('diag.notDeclared'),
         files:names,warning:unexpected?msg('diag.lockfilesAmbiguous'):''}),
       suggestion:msg('diag.lockfilesNext'),
       evidence:msg('diag.lockfilesEvidence')
      }));
  }
  if (d.node) {
    if (signal?.aborted) throw new Error('Cancelled');
    const result = await probeTool('node', timeLeft(), signal);
    assertActive(signal);
    const localizedVersion=result.ok ? result.value :
      result.value==='Not installed / not on PATH' ? msg('diag.notInstalled') :
      result.value==='Could not inspect runtime' ? msg('diag.runtimeUnavailable') :
      msg('diag.runtimeUnknown');
    const verdict = result.ok ? evaluateVersion(result.value.replace(/^v/,''),d.nodeRequirement,'node') : null;
    const nodeStatus = !result.ok || verdict?.status==='incompatible'?'warn':
      verdict?.status==='compatible'?'pass':
      verdict?.status==='inconclusive'?'inconclusive':'info';
    push(createCheck('node','Runtime','Node.js',nodeStatus,
      result.value + (d.nodeRequirement ? ' — declared requirement: ' + d.nodeRequirement : '') +
      (verdict ? '. '+verdict.detail : ''),
      nodeStatus==='warn'?'Check the configured Node.js runtime version.':
      !d.nodeRequirement?'Declare engines.node in package.json or add .nvmrc to enable compatibility checks.':
      'The declared requirement was evaluated when supported.',
      'Runtime output: '+result.value, {
        category:msg('diag.category.Runtime'),
        detail:msg('diag.nodeDetail',{version:localizedVersion,
          required:d.nodeRequirement==='[unrecognized]'?msg('diag.nodeRequirementUnknown'):
            d.nodeRequirement?msg('diag.nodeRequired',{requirement:d.nodeRequirement}):'',
          verdict:verdict ? (verdict.translation||verdict.detail):''}),
        suggestion:msg(nodeStatus==='warn'?'diag.nodeWarn':
          verdict?.status==='inconclusive'?'diag.nodeUnrecognizedNext':
          !d.nodeRequirement?'diag.nodeNoReq':'diag.nodeChecked'),
        evidence:msg('diag.outputVersion',{value:localizedVersion})
      }));
  }
  if (d.go) {
    if (signal?.aborted) throw new Error('Cancelled');
    const result = await probeTool('go',timeLeft(),signal);
    assertActive(signal);
    const localizedVersion=result.ok ? result.value :
      result.value==='Not installed / not on PATH' ? msg('diag.notInstalled') :
      result.value==='Could not inspect runtime' ? msg('diag.runtimeUnavailable') :
      msg('diag.runtimeUnknown');
    const actual = /^go version go([\d.]+)/.exec(result.value)?.[1];
    const verdict = actual ? evaluateVersion(actual,d.goRequirement,'go') : null;
    const installedGo=actual?parseVersion(actual):null;
    const suggestedGo=d.goToolchainOrigin==='declared'?parseVersion(d.goToolchain):null;
    const prefersNewer=Boolean(installedGo && suggestedGo && compare(installedGo,suggestedGo)<0);
    const unknownDirective=d.goRequirementOrigin==='invalid'||d.goToolchainOrigin==='invalid';
    const goStatus:CheckStatus=!result.ok?'inconclusive':
      verdict?.status==='incompatible'?'warn':
      unknownDirective||verdict?.status==='inconclusive'?'inconclusive':
      prefersNewer||d.goRequirementOrigin==='implicit'?'info':
      verdict?.status==='compatible'?'pass':'info';
    push(createCheck('go','Runtime','Go',goStatus,
      result.value + (d.goRequirement ? ' — module requirement: '+d.goRequirement : '') +
      (d.goToolchain ? ' — suggested toolchain: '+
        (d.goToolchain==='default'?'default':d.goToolchain==='[unrecognized]'?
         '[unrecognized]':'go'+d.goToolchain) : '') +
      (verdict ? '. '+verdict.detail : '') +
      (prefersNewer?' Toolchain selection was not verified; Go may switch automatically.':'') +
      (d.goRequirementOrigin==='implicit'?' No go directive; implicit minimum Go 1.16.':'') +
      (unknownDirective?' go.mod contains unsupported or inconsistent version directives.':''),
      goStatus==='warn'?'Check the declared Go minimum and effective toolchain.':
        unknownDirective?'Inspect go.mod syntax; do not infer compatibility from an unrecognized directive.':
        prefersNewer?'Inspect go env GOTOOLCHAIN and the effective Go version before assuming the suggested toolchain is active.':
        'Only the declared module minimum was checked; suggested toolchain selection was not verified.',
      'Runtime output: '+result.value, {
        category:msg('diag.category.Runtime'),
        detail:msg('diag.goDetail',{version:localizedVersion,
          toolchain:d.goToolchain==='[unrecognized]'?msg('diag.goInvalidToolchain'):
            d.goToolchain==='default'?msg('diag.goDefaultToolchain'):
            d.goToolchain?msg('diag.goToolchain',{version:d.goToolchain}):'',
          required:d.goRequirementOrigin==='invalid'?msg('diag.goInvalidRequirement'):
            d.goRequirementOrigin==='implicit'?msg('diag.goImplicitMinimum'):
            d.goRequirement?msg('diag.goRequired',{requirement:d.goRequirement}):'',
          verdict:verdict?.translation||''}),
        suggestion:msg(goStatus==='warn'?'diag.goWarn':
          unknownDirective?'diag.goInvalidNext':
          prefersNewer?'diag.goSuggestedNext':'diag.goChecked'),
        evidence:msg('diag.outputVersion',{value:localizedVersion})
      }));
  }
  const optional:[string,string,ToolName[]][]=[
    ['python','Python',process.platform==='win32'?['py','python','python3']:['python3','python']],
    ['php','PHP',['php']],['java','Java',['java']],['docker','Docker CLI',['docker']]
  ];
  for(const [id,label,tools] of optional){
    const sources=d.optionalRuntimes[id]||[];
    if(!sources.length)continue;
    let observed:ToolResult={ok:false,missing:true,value:'Not installed / not on PATH'};
    for(const tool of tools){
      observed=await probeTool(tool,timeLeft(),signal);
      assertActive(signal);
      if(!observed.missing)break;
    }
    const status:CheckStatus=observed.ok?'info':observed.missing?'warn':'inconclusive';
    const local=observed.ok?observed.value:
      observed.missing?msg('diag.notInstalled'):msg('diag.runtimeUnavailable');
    push(createCheck(id,'Runtime',label,status,
      label+' markers: '+sources.join(', ')+'. Version probe: '+observed.value+
      '. This does not establish project or dependency compatibility.',
      'Verify toolchain requirements and lockfiles before changing the environment.',
      'Read-only runtime version probe ('+label+'); project scripts were not executed.',{
        category:msg('diag.category.Runtime'),
        detail:msg('diag.optionalDetail',{runtime:label,sources:sources.join(', '),version:local}),
        suggestion:msg('diag.optionalNext'),
        evidence:msg('diag.optionalEvidence',{runtime:label})
      }));
  }
  if (d.hasEnvExample && ['present','missing'].includes(d.fileStates['.env']||'')) {
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
  let ownerSnapshot:Map<number,OwnerInspection>|null=null;
  for (const port of d.ports) {
    if (signal?.aborted) throw new Error('Cancelled');
    const status = await inspectPort(port,timeLeft(),signal);
    assertActive(signal);
    if(status==='listening' && ownerSnapshot===null)
      ownerSnapshot=await inspectOwners(d.ports,timeLeft(),signal);
    const owner=status==='listening'?ownerSnapshot?.get(port)||null:null;
    assertActive(signal);
    const ownerDetail=owner?.owners?.length ?
      ' Listening owner(s): '+owner.owners.map(x=>x.name+' PID '+x.pid).join(', ')+'.' :
      status==='listening' ? ' Process owner not established (tool, permission or namespace limitation).' : '';
    const inferred=d.portOrigins[String(port)]==='heuristic';
    push(createCheck('port-'+port,'Ports','Port '+port,
      ['listening','not-listening'].includes(status)?'info':'warn',
      (status === 'listening' ? 'A TCP listener responded on 127.0.0.1:'+port+
        '. This does not establish a process conflict.' :
        status === 'not-listening' ? 'No local TCP listener responded on 127.0.0.1:'+port+
        '. The application may not be started.' : 'Port status could not be verified.')+ownerDetail+
      (inferred?' Port is a framework convention, not a declared project configuration.':''),
      'Inspect service startup logs and host bindings; do not terminate processes blindly.'+
      (inferred?' Confirm the actual project port.':''),
      'TCP loopback result: '+status+'. '+(owner?.detail || 'Owner inspection not applicable.')+
      (inferred?' Port inferred from a framework default.':''), {
        category:msg('diag.category.Ports'),label:msg('diag.label.port',{port}),
        detail:msg(status==='listening'?'diag.portListening':
          status==='not-listening'?'diag.portNotListening':'diag.portUnknown',
          {port,owner:status==='listening'?owner?.owners?.length?
            msg('diag.portOwners',{owners:owner.owners.map(x=>x.name+' PID '+x.pid).join(', ')}):
            msg('diag.portNoOwner'):''}),
        suggestion:msg(inferred?'diag.portNextInferred':'diag.portNext'),
        evidence:msg(inferred?'diag.portEvidenceInferred':'diag.portEvidence',{status:msg(status==='listening'?'diag.portStateListening':
          status==='not-listening'?'diag.portStateNotListening':
          status==='timeout'?'diag.portStateTimeout':
          status==='cancelled'?'diag.portStateCancelled':'diag.portStateInconclusive'),
          ownership:owner?.i18nDetail||
          (owner?.detail||msg('diag.portOwnerNA'))})
      },inferred));
  }
  assertActive(signal);
  if (!checks.length) push(createCheck('none','Discovery','No applicable checks','info',
    'No supported Node.js/Go configuration or ports found. Add a local service to investigate.','','',{
      label:msg('diag.label.none'),category:msg('diag.category.Discovery'),
      detail:msg('diag.noneDetail')
    }));
  }catch(error){
    if(!(error instanceof DiagnosticBudgetExhausted))throw error;
    finalState='partial';
    push(createCheck('budget','Discovery','Diagnosis time budget','inconclusive',
      'The diagnostic time budget expired. Not all checks were executed.',
      'Inspect completed evidence, then retry when the environment is responsive.',
      'Some checks were not run and are not represented as PASS.',{
        label:msg('diag.budgetLabel'),category:msg('diag.category.Discovery'),
        detail:msg('diag.budgetReached'),suggestion:msg('diag.budgetNext'),
        evidence:msg('diag.budgetEvidence')
      }));
  }
  return { id: crypto.randomBytes(8).toString('hex'), project: d.project,
    schemaVersion:2,startedAt:start, completedAt:new Date().toISOString(), host:process.platform,
    state:finalState, checks, discovery:d, serviceChecks:[] };
}
export async function verifyServices(services:ServiceTarget[],timeout:number,signal?:AbortSignal,
 progress?:(checks:DiagnosticCheck[])=>void):Promise<DiagnosticCheck[]> {
  const checks:DiagnosticCheck[] = [];
  const budget=new DiagnosticBudget(Math.min(45000,Math.max(5000,timeout*5)));
  for (let i=0;i<services.length;i++) {
    if (signal?.aborted) throw new Error('Cancelled');
    const svc = validateService(services[i]);
    if (!svc) {
      // Invalid targets are observed as BLOCKED, not silently omitted. Never
      // include untrusted URL text (which may contain credentials) in evidence.
      const raw=services[i];
      const identifier=typeof raw?.url==='string'?raw.url.slice(0,600):'';
      const id='service-rejected-'+crypto.createHash('sha256').update(identifier).digest('hex').slice(0,24);
      const blocked=createCheck(id,'Services','Rejected service target','blocked',
        'Only explicitly approved loopback HTTP URLs can be checked.',
        'Review the target URL and remove credentials, queries, fragments or non-loopback hosts.',
        'Target failed local URL validation; no HTTP request was sent.',{
          category:msg('diag.category.Services'),detail:msg('diag.blockedTarget'),
          suggestion:msg('diag.serviceNext'),evidence:msg('diag.serviceRejectedEvidence')
        });
      blocked.provenance={...blocked.provenance,origin:'discovery',
        method:'local URL validation (no HTTP request)',target:id};
      checks.push(blocked);
      progress?.([...checks]);
      continue;
    }
    let allowed:number;
    try{allowed=budget.remaining(timeout);}
    catch(error){
      if(!(error instanceof DiagnosticBudgetExhausted))throw error;
      checks.push(createCheck('service-budget','Services','Service time budget','inconclusive',
        'The service verification budget was exhausted. Remaining endpoints were not contacted.',
        'Review completed checks and retry when the service environment is responsive.','No additional HTTP requests were sent.',{
          category:msg('diag.category.Services'),label:msg('diag.budgetLabel'),
          detail:msg('diag.budgetReached'),suggestion:msg('diag.budgetNext'),
          evidence:msg('diag.budgetEvidence')
        }));
      progress?.([...checks]);
      break;
    }
    const result = await inspectService(svc, allowed, signal);
    assertActive(signal);
    const stableId='service-'+crypto.createHash('sha256').update(svc.url).digest('hex').slice(0,24);
    checks.push(createCheck(stableId,'Services',svc.name,
      result.ok?'pass':'warn',result.detail,
      result.ok?'':'Check the service, port and endpoint; no changes were made.',
      'Loopback '+svc.url+' → '+result.detail, {
        category:msg('diag.category.Services'),
        detail:msg(result.detail==='Cancelled'?'diag.cancelled':
          result.detail==='Connection unavailable'?'diag.connectionUnavailable':
          result.detail.startsWith('HTTP ')?'diag.http':'diag.blockedTarget',
          result.detail.startsWith('HTTP ')?{status:result.detail.slice(5)}:{}),
        ...(result.ok ? {} : {suggestion:msg('diag.serviceNext')}),
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

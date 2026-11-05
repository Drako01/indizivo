'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const net = require('node:net');
const http = require('node:http');
const crypto = require('node:crypto');
const { evaluateVersion } = require('./versions');
const { inspectOwner } = require('./port-owners');

function createCheck(id, category, label, status, detail, suggestion, fact) {
  return { id, category, label, status, detail, suggestion: suggestion || '',
    evidence: [{ id: crypto.randomBytes(6).toString('hex'), fact: String(fact || detail),
      observedAt: new Date().toISOString() }] };
}
function parsePorts(scripts) {
  const result = new Set();
  for (const script of Object.values(scripts || {})) {
    if (typeof script !== 'string') continue;
    const match = /(?:--port[= ]|(?:^|\s)PORT\s*=\s*)(\d{2,5})/i.exec(script);
    if (match && +match[1] > 0 && +match[1] < 65536) result.add(+match[1]);
  }
  return [...result].sort((a, b) => a-b).slice(0, 12);
}
function parseKeys(data) {
  return [...new Set((data || '').split(/\r?\n/).map(line =>
    /^\s*(?:export\s+)?([A-Za-z_]\w*)\s*=/.exec(line)?.[1]).filter(Boolean))];
}
async function readBounded(root, name) {
  try {
    const full = path.resolve(root, name);
    if (!full.startsWith(path.resolve(root) + path.sep)) return '';
    const stat = await fs.lstat(full);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 262144) return '';
    return await fs.readFile(full, 'utf8');
  } catch { return ''; }
}
function validateService(input) {
  if (!input || typeof input.name !== 'string' || typeof input.url !== 'string') return null;
  const name = input.name.trim().slice(0, 50);
  if (!name) return null;
  try {
    const url = new URL(input.url);
    if (url.protocol !== 'http:' || !['localhost','127.0.0.1','[::1]'].includes(url.hostname) ||
      url.username || url.password || url.hash || url.search || url.href.length > 600) return null;
    return { name, url: url.href };
  } catch { return null; }
}
async function discover(root) {
  const packageText = await readBounded(root, 'package.json');
  const goMod = await readBounded(root, 'go.mod');
  const example = await readBounded(root, '.env.example');
  const env = await readBounded(root, '.env');
  const nvm = (await readBounded(root, '.nvmrc')).trim();
  let pkg;
  try { pkg = packageText ? JSON.parse(packageText) : null; } catch { pkg = null; }
  const scripts = pkg && typeof pkg.scripts === 'object' ? pkg.scripts : {};
  const ports = parsePorts(scripts);
  const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
  if (!ports.length && deps.next) ports.push(3000);
  if (!ports.length && deps.vite) ports.push(5173);
  const required = parseKeys(example);
  const provided = new Set(parseKeys(env));
  return { project: path.basename(root), node: Boolean(packageText), go: Boolean(goMod),
    malformedPackage: Boolean(packageText && !pkg),
    nodeRequirement: nvm || String(pkg?.engines?.node || '').slice(0, 60),
    goRequirement: /^\s*go\s+([\d.]+)/m.exec(goMod)?.[1] || '',
    ports, requiredEnv: required, missingEnv: required.filter(key => !provided.has(key)),
    hasEnvExample: !!example, hasEnvFile: !!env };
}
function runVersion(command, args, timeout, signal) {
  return new Promise(resolve => {
    if (signal?.aborted) return resolve({ ok: false, value: 'Cancelled' });
    const { execFile } = require('node:child_process');
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
function inspectPort(port, timeout, signal) {
  return new Promise(resolve => {
    if (signal?.aborted) return resolve('cancelled');
    const socket = new net.Socket();
    let done = false;
    function finish(state) { if (done) return; done = true;
      signal?.removeEventListener('abort', cancel); socket.destroy(); resolve(state); }
    function cancel() { finish('cancelled'); }
    signal?.addEventListener('abort', cancel, { once: true });
    socket.setTimeout(timeout);
    socket.once('connect', () => finish('listening'));
    socket.once('timeout', () => finish('timeout'));
    socket.once('error', err => finish(err.code === 'ECONNREFUSED' ? 'not-listening' : 'inconclusive'));
    socket.connect({ host: '127.0.0.1', port });
  });
}
function inspectService(service, timeout, signal) {
  const valid = validateService(service);
  if (!valid) return Promise.resolve({ ok: false, detail: 'Blocked: only local HTTP targets allowed.' });
  return new Promise(resolve => {
    if (signal?.aborted) return resolve({ ok: false, detail: 'Cancelled' });
    let done = false;
    function finish(ok, detail) { if (done) return; done = true;
      signal?.removeEventListener('abort', cancel); resolve({ ok, detail }); }
    const req = http.get(valid.url, { timeout, agent: false,
      lookup: (_host, _options, callback) => callback(null, '127.0.0.1', 4),
      headers: { 'user-agent': 'Indizivo/0.1' } }, res => {
      res.resume(); finish(res.statusCode >= 200 && res.statusCode < 300, 'HTTP ' + res.statusCode);
    });
    const cancel = () => req.destroy(new Error('cancelled'));
    signal?.addEventListener('abort', cancel, { once: true });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', () => finish(false, signal?.aborted ? 'Cancelled' : 'Connection unavailable'));
  });
}
async function diagnose(root, timeout = 2500, signal, progress) {
  const start = new Date().toISOString();
  const d = await discover(root);
  const checks = [];
  const push = c => { checks.push(c); progress?.([...checks]); };
  const t = Math.min(10000, Math.max(400, Number(timeout) || 2500));
  if (d.malformedPackage) push(createCheck('package','Configuration','package.json','warn',
    'Invalid JSON; Node.js project metadata cannot be inspected.'));
  if (d.node) {
    if (signal?.aborted) throw new Error('Cancelled');
    const result = await runVersion('node',['--version'], t, signal);
    const verdict = result.ok ? evaluateVersion(result.value.replace(/^v/,''),d.nodeRequirement,'node') : null;
    const nodeStatus = !result.ok || verdict?.status==='incompatible'?'warn':
      verdict?.status==='compatible'?'pass':'info';
    push(createCheck('node','Runtime','Node.js',nodeStatus,
      result.value + (d.nodeRequirement ? ' — declared requirement: ' + d.nodeRequirement : '') +
      (verdict ? '. '+verdict.detail : ''),
      nodeStatus==='warn'?'Check the configured Node.js runtime version.':'Only validated constraints are considered compatible.',
      'Runtime output: '+result.value));
  }
  if (d.go) {
    if (signal?.aborted) throw new Error('Cancelled');
    const result = await runVersion('go',['version'],t,signal);
    const actual = /^go version go([\d.]+)/.exec(result.value)?.[1];
    const verdict = actual ? evaluateVersion(actual,d.goRequirement,'go') : null;
    const goStatus = !result.ok || verdict?.status==='incompatible'?'warn':
      verdict?.status==='compatible'?'pass':'info';
    push(createCheck('go','Runtime','Go',goStatus,
      result.value + (d.goRequirement ? ' — module requirement: '+d.goRequirement : '') +
      (verdict ? '. '+verdict.detail : ''),
      goStatus==='warn'?'Check the declared Go toolchain minimum.':'Only validated constraints are considered compatible.',
      'Runtime output: '+result.value));
  }
  if (d.hasEnvExample) {
    const missing = d.missingEnv;
    push(createCheck('env','Configuration','Environment key presence',missing.length?'warn':'pass',
      missing.length ? 'Missing in .env: ' + missing.join(', ') :
        'Required names present. Secret values were not inspected or validated.',
      'Add required keys manually. Never paste secrets into reports.',
      'Key presence only; secret values not retained'));
  }
  for (const port of d.ports) {
    if (signal?.aborted) throw new Error('Cancelled');
    const status = await inspectPort(port,t,signal);
    const owner = status==='listening' ? await inspectOwner(port,t,signal) : null;
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
      'TCP loopback result: '+status+'. '+(owner?.detail || 'Owner inspection not applicable.')));
  }
  if (!checks.length) push(createCheck('none','Discovery','No applicable checks','info',
    'No supported Node.js/Go configuration or ports found. Add a local service to investigate.'));
  return { id: crypto.randomBytes(8).toString('hex'), project: d.project,
    startedAt:start, completedAt:new Date().toISOString(), host:process.platform,
    state:'completed', checks, discovery:d, serviceChecks:[] };
}
async function verifyServices(services, timeout, signal, progress) {
  const checks = [];
  for (let i=0;i<services.length;i++) {
    if (signal?.aborted) throw new Error('Cancelled');
    const svc = validateService(services[i]);
    if (!svc) continue;
    const result = await inspectService(svc, Math.max(400, Math.min(10000, timeout)), signal);
    checks.push(createCheck('service-'+i,'Services',svc.name,
      result.ok?'pass':'warn',result.detail,
      result.ok?'':'Check the service, port and endpoint; no changes were made.',
      'Loopback '+svc.url+' → '+result.detail));
    progress?.([...checks]);
  }
  return checks;
}
module.exports = { discover, diagnose, verifyServices, parsePorts, parseKeys, validateService };

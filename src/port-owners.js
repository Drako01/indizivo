'use strict';
const { execFile } = require('node:child_process');

function endpointPort(value) {
  const match= /:(\d{1,5})$/.exec(value || '');
  const port = match && Number(match[1]);
  return port>=1 && port<=65535 ? port : null;
}
function safeLabel(label) {
  return String(label || '').replace(/[^a-zA-Z0-9_.+-]/g,'').slice(0,50) || 'unknown';
}
function parseOwners(platform, output, port) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) return [];
  const owners = [];
  const lines = String(output || '').split(/\r?\n/);
  for (const line of lines) {
    let pid, name;
    const cols=line.trim().split(/\s+/);
    if (platform === 'win32') {
      if (cols[0] !== 'TCP' || cols[3]?.toUpperCase() !== 'LISTENING' || endpointPort(cols[1]) !== port) continue;
      pid=Number(cols[4]);
      name='process';
    } else if (platform === 'linux') {
      if (cols[0] !== 'LISTEN' || endpointPort(cols[3]) !== port) continue;
      pid=Number(/\bpid=(\d+)\b/.exec(line)?.[1]);
      name=safeLabel(/users:\(\("([^"]{1,100})"/.exec(line)?.[1]);
    } else if (platform === 'darwin') {
      if (!line.includes('(LISTEN)') || !line.includes('TCP') || !line.includes(':'+port)) continue;
      pid=Number(cols[1]);
      name=safeLabel(cols[0]);
      if (!/[:\]]\d+\s+\(LISTEN\)$/.test(line) && !line.includes(':'+port+' (LISTEN)')) continue;
    } else continue;
    if (Number.isSafeInteger(pid) && pid>0 && pid<=2147483647 &&
      !owners.some(item=>item.pid===pid)) owners.push({pid, name:safeLabel(name),observed:true});
    if (owners.length===12) break;
  }
  return owners;
}
function inspectionArgs(platform, port) {
  if (platform==='win32') return {command:'netstat',args:['-ano','-p','tcp']};
  if (platform==='linux') return {command:'ss',args:['-ltnp']};
  if (platform==='darwin') return {command:'lsof',args:['-nP','-iTCP:'+port,'-sTCP:LISTEN']};
  return null;
}
function inspectOwner(port, timeoutMs, signal, platform=process.platform) {
  const spec=inspectionArgs(platform,port);
  if (!spec) return Promise.resolve({status:'unsupported',owners:[],detail:'Platform not supported for owner inspection.',i18nDetail:{key:'diag.ownerUnsupported'}});
  return new Promise(resolve=>{
    if (signal?.aborted) return resolve({status:'cancelled',owners:[],detail:'Cancelled',i18nDetail:{key:'diag.cancelled'}});
    let settled=false;
    const child=execFile(spec.command,spec.args,{shell:false,windowsHide:true,
      timeout:Math.min(5000,Math.max(400,timeoutMs||2000)),maxBuffer:131072},
      (err,stdout)=>{
        if (settled) return;
        settled=true;
        signal?.removeEventListener('abort',cancel);
        if (signal?.aborted) return resolve({status:'cancelled',owners:[],detail:'Cancelled'});
        if (err) return resolve({status:'inconclusive',owners:[],detail:'Process ownership unavailable or permission denied.',i18nDetail:{key:'diag.ownerNotAvailable'}});
        const owners=parseOwners(platform,stdout,port);
        resolve({status:owners.length?'observed':'inconclusive',owners,
          detail:owners.length?'Process IDs observed in host tool output.':'No process ID visible; permission or namespace may limit this tool.',
          i18nDetail:{key:owners.length?'diag.ownerObserved':'diag.ownerUnknown'}});
      });
    function cancel(){try{child.kill();}catch{/* best effort */}}
    signal?.addEventListener('abort',cancel,{once:true});
  });
}
module.exports={parseOwners,inspectOwner,endpointPort,inspectionArgs};

'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {discover,diagnose,parsePorts,parseKeys,validateService,parseGoDirectives}=require('../src/diagnostics');
test('ports parse only explicit settings',()=>{
 assert.deepEqual(parsePorts({dev:'next dev --port 3100'}),[3100]);
 assert.deepEqual(parsePorts({dev:'echo 9999'}),[]);
});
test('environment extracts keys, not secret values',()=>{
 assert.deepEqual(parseKeys('TOKEN=secret\nexport PORT=3000\n# COMMENT=hello'),['TOKEN','PORT']);
});
test('service validation limits networking to loopback',()=>{
 assert.equal(validateService({name:'remote',url:'https://example.org'}),null);
 assert.equal(validateService({name:'auth',url:'http://user:pass@localhost:3000'}),null);
 assert.ok(validateService({name:'api',url:'http://127.0.0.1:5000/health'}));
});
test('discovery compares env key presence without retaining values',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-'));
 try {
  await fs.writeFile(path.join(root,'package.json'),JSON.stringify({scripts:{dev:'next dev --port 4000'}}));
  await fs.writeFile(path.join(root,'.env.example'),'SECRET=example\nPORT=4000');
  await fs.writeFile(path.join(root,'.env'),'PORT=4000');
  const result=await discover(root);
  assert.deepEqual(result.ports,[4000]);
  assert.deepEqual(result.missingEnv,['SECRET']);
  assert.equal(JSON.stringify(result).includes('example\n'),false);
 } finally { await fs.rm(root,{recursive:true,force:true}); }
});
test('empty project returns honest limited finding',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-'));
 try {
  const result=await diagnose(root,500);
  assert.equal(result.state,'completed');
  assert.equal(result.checks[0].status,'info');
 } finally {await fs.rm(root,{recursive:true,force:true});}
});

test('framework convention ports are labeled inferred, not declared',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-inferred-'));
 try {
  await fs.writeFile(path.join(root,'package.json'),JSON.stringify({dependencies:{next:'^16.0.0'}}));
  const d=await discover(root);
  assert.equal(d.portOrigins['3000'],'heuristic');
  const session=await diagnose(root,500);
  const finding=session.checks.find(c=>c.id==='port-3000');
  assert.match(finding.detail,/framework convention/);
  assert.equal(finding.i18n.suggestion.key,'diag.portNextInferred');
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('explicit ports and Go toolchain remain separately attributed',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-toolchain-'));
 try {
  await fs.writeFile(path.join(root,'package.json'),JSON.stringify({scripts:{dev:'next dev --port 3301'}}));
  await fs.writeFile(path.join(root,'go.mod'),'module example.org/demo\ngo 1.23\ntoolchain go1.24.5\n');
  const d=await discover(root);
  assert.equal(d.portOrigins['3301'],'declared');
  assert.equal(d.goRequirement,'1.23');
  assert.equal(d.goToolchain,'1.24.5');
 }finally{await fs.rm(root,{recursive:true,force:true});}
});

test('unreadable or blocked config becomes inconclusive, never a false missing-key claim',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-blocked-'));
 try{
  await fs.writeFile(path.join(root,'.env.example'),'API_KEY=placeholder');
  await fs.mkdir(path.join(root,'.env'));
  const d=await discover(root);
  assert.equal(d.fileStates['.env'],'blocked');
  assert.deepEqual(d.missingEnv,[]);
  const run=await diagnose(root,500);
  assert.equal(run.checks.find(c=>c.id==='file--env').status,'inconclusive');
  assert.ok(!run.checks.some(c=>c.id==='env'));
 }finally{await fs.rm(root,{recursive:true,force:true});}
});

test('Python, PHP, Java and Docker workspace markers trigger bounded read-only tool observations',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-adapters-'));
 try{
  await fs.writeFile(path.join(root,'pyproject.toml'),'[project]\nname="demo"\n');
  await fs.writeFile(path.join(root,'composer.json'),'{"require":{"php":"^8.2","token":"DO_NOT_STORE_VALUE"}}');
  await fs.writeFile(path.join(root,'pom.xml'),'<project></project>');
  await fs.writeFile(path.join(root,'Dockerfile'),'FROM scratch\n');
  const d=await discover(root);
  for(const [id,marker] of [['python','pyproject.toml'],['php','composer.json'],
    ['java','pom.xml'],['docker','Dockerfile']])
    assert.ok(d.optionalRuntimes[id].includes(marker),id);
  assert.doesNotMatch(JSON.stringify(d),/DO_NOT_STORE_VALUE/);
  const result=await diagnose(root,1000);
  for(const id of ['python','php','java','docker']){
    const finding=result.checks.find(c=>c.id===id);
    assert.ok(finding,id);
    assert.ok(['info','warn','inconclusive'].includes(finding.status),id);
    assert.equal(finding.provenance.origin,'runtime-tool');
  }
 }finally{await fs.rm(root,{recursive:true,force:true});}
});

test('root lockfile evidence flags ambiguity without reading sensitive lockfile contents',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-lockfiles-'));
 try{
  await fs.writeFile(path.join(root,'package.json'),'{"packageManager":"pnpm@10.2.0"}');
  await fs.writeFile(path.join(root,'pnpm-lock.yaml'),'TOKEN=DO_NOT_INSPECT_THIS_VALUE');
  await fs.writeFile(path.join(root,'package-lock.json'),'TOKEN=DO_NOT_INSPECT_THIS_VALUE');
  const discovery=await discover(root);
  assert.equal(discovery.packageManager,'pnpm@10.2.0');
  assert.deepEqual(discovery.lockfiles,['package-lock.json','pnpm-lock.yaml']);
  const run=await diagnose(root,900);
  const finding=run.checks.find(x=>x.id==='package-manager');
  assert.equal(finding.status,'warn');
  assert.doesNotMatch(JSON.stringify(run),/DO_NOT_INSPECT_THIS_VALUE/);
  assert.equal(finding.i18n.detail.key,'diag.lockfilesDetail');
 }finally{await fs.rm(root,{recursive:true,force:true});}
});

test('Go directives parse exact tokens, preserve implicit semantics and never echo hostile input',()=>{
 const fixtures=[
  ['module example.org/demo\ngo 1.23.0\ntoolchain go1.24.5\n',
   {minimum:'1.23.0',toolchain:'1.24.5',minimumOrigin:'declared',toolchainOrigin:'declared'}],
  ['module example.org/demo\n', {minimum:'1.16',toolchain:'',minimumOrigin:'implicit',toolchainOrigin:'none'}],
  ['module example.org/demo\ngo 1.23\ntoolchain default\n',
   {minimum:'1.23',toolchain:'default',minimumOrigin:'declared',toolchainOrigin:'declared'}],
  ['module example.org/demo\ngo 1.23BAD\n',
   {minimum:'[unrecognized]',toolchain:'',minimumOrigin:'invalid',toolchainOrigin:'none'}],
  ['module example.org/demo\ngo 1.23\ngo 1.24\n',
   {minimum:'[unrecognized]',toolchain:'',minimumOrigin:'invalid',toolchainOrigin:'none'}],
  ['module example.org/demo\ngo 1.23\ntoolchain go1.24.5BAD\n',
   {minimum:'1.23',toolchain:'[unrecognized]',minimumOrigin:'declared',toolchainOrigin:'invalid'}],
  ['module example.org/demo\ngo 1.24\ntoolchain go1.23.1\n',
   {minimum:'1.24',toolchain:'[unrecognized]',minimumOrigin:'declared',toolchainOrigin:'invalid'}],
  ['module example.org/demo\ngo 1.24\ntoolchain go1.25\n',
   {minimum:'1.24',toolchain:'[unrecognized]',minimumOrigin:'declared',toolchainOrigin:'invalid'}],
  ['go 1.24\n', {minimum:'[unrecognized]',toolchain:'',minimumOrigin:'invalid',toolchainOrigin:'none'}]
 ];
 for(const [raw,expected] of fixtures)assert.deepEqual(parseGoDirectives(raw),expected,raw);
 const hostile=parseGoDirectives('module example.org/demo\ngo API_TOKEN=NEVER_EXPORT\n');
 assert.doesNotMatch(JSON.stringify(hostile),/NEVER_EXPORT|API_TOKEN/);
});
test('Go malformed directives cannot generate a PASS from the installed toolchain',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-bad-go-'));
 try {
  await fs.writeFile(path.join(root,'go.mod'),'module example.org/demo\ngo 1.23oops\n');
  const d=await discover(root);
  assert.equal(d.goRequirementOrigin,'invalid');
  const session=await diagnose(root,900);
  const go=session.checks.find(x=>x.id==='go');
  assert.ok(go);
  assert.notEqual(go.status,'pass');
  assert.equal(go.i18n.detail.values.required.key,'diag.goInvalidRequirement');
  assert.doesNotMatch(JSON.stringify(session),/1.23oops/);
 } finally {await fs.rm(root,{recursive:true,force:true});}
});

test('new findings expose stable versioned check and target IDs without invented impact severity',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-finding-v1-'));
 try {
  await fs.writeFile(path.join(root,'package.json'),JSON.stringify({engines:{node:'>=99'}}));
  const first=await diagnose(root,900);
  const found=first.checks.find(check=>check.id==='node');
  assert.ok(found);
  assert.equal(found.metadata.schemaVersion,1);
  assert.equal(found.metadata.checkId,'runtime-version');
  assert.equal(found.metadata.targetId,'node');
  assert.equal(found.metadata.severity,'unassessed');
  const second=await diagnose(root,900);
  assert.equal(second.checks.find(x=>x.id==='node').metadata.targetId,found.metadata.targetId);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});

test('IPv6-only loopback listener is observed instead of reported as not listening',async t=>{
 const net=require('node:net');
 const server=net.createServer();
 try{await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'::1',resolve);});}
 catch{t.skip('IPv6 loopback unavailable on this host');return;}
 const port=server.address().port;
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'indizivo-v6-'));
 try{
  fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({scripts:{dev:'vite --port '+port}}));
  const {diagnose}=require('../dist/typed/diagnostics');
  const session=await diagnose(dir,2000);
  const check=session.checks.find(item=>item.id==='port-'+port);
  assert.ok(check,'port check present');
  assert.match(check.detail,/\[::1\]/);
  assert.equal(check.i18n.detail.key,'diag.portListeningV6');
 }finally{
  server.close();fs.rmSync(dir,{recursive:true,force:true});
 }
});

test('closed port reports both loopback families as unobserved listeners',async()=>{
 const net=require('node:net');
 const probe=net.createServer();
 await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));
 const port=probe.address().port;
 await new Promise(resolve=>probe.close(resolve));
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'indizivo-closed-'));
 try{
  fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({scripts:{dev:'vite --port '+port}}));
  const {diagnose}=require('../dist/typed/diagnostics');
  const check=(await diagnose(dir,2000)).checks.find(item=>item.id==='port-'+port);
  assert.match(check.detail,/127\.0\.0\.1:\d+ or \[::1\]:\d+/);
  assert.equal(check.i18n.detail.key,'diag.portNotListeningBoth');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

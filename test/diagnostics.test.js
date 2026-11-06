'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {discover,diagnose,parsePorts,parseKeys,validateService}=require('../src/diagnostics');
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

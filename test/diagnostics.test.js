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
  await fs.writeFile(path.join(root,'go.mod'),'module example.org/demo\\ngo 1.23\\ntoolchain go1.24.5\\n');
  const d=await discover(root);
  assert.equal(d.portOrigins['3301'],'declared');
  assert.equal(d.goRequirement,'1.23');
  assert.equal(d.goToolchain,'1.24.5');
 }finally{await fs.rm(root,{recursive:true,force:true});}
});

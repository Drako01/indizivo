'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {discover,parseKeys}=require('../src/diagnostics');
test('discovery constrains untrusted version text and does not echo possible secrets',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-config-'));
 try {
  await fs.writeFile(path.join(root,'package.json'),JSON.stringify({engines:{node:'SECRET_API_TOKEN=12345'}}));
  await fs.writeFile(path.join(root,'.nvmrc'),'SENSITIVE_VALUE=topsecret');
  const config=await discover(root);
  assert.equal(config.nodeRequirement,'');
  assert.doesNotMatch(JSON.stringify(config),/topsecret|SECRET_API_TOKEN/);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('env parser caps name count and length',()=>{
 const entries=Array.from({length:250},(_,i)=>'ENV_KEY_'+i+'=value').join('\\n');
 assert.equal(parseKeys(entries).length,100);
 assert.deepEqual(parseKeys('A'.repeat(500)+'=secret'),[]);
});

'use strict';
// Seeded property/fuzz tests for the network allowlist and concurrent file mutation (S-04, S-06).
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {validateService,discover}=require('../dist/typed/diagnostics');

function rng(seed){let x=seed>>>0;return ()=>{x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;return x/4294967296;};}
const pick=(r,list)=>list[Math.floor(r()*list.length)];

test('fuzzed service URLs are accepted only for approved loopback hosts without credentials',()=>{
 const r=rng(20261106);
 const LOOPBACK=new Set(['localhost','127.0.0.1','[::1]']);
 const hosts=['localhost','127.0.0.1','[::1]','127.0.0.2','0.0.0.0','10.0.0.1','169.254.169.254',
  '192.168.1.1','example.com','localhost.evil.com','127.0.0.1.nip.io','[::ffff:7f00:1]','[::]','2130706433',
  '0x7f.1','017700000001','LOCALHOST','local​host','127.1','[fe80::1]','metadata.google.internal'];
 const creds=['','','','user@','user:pw@'];
 const tails=['','/','/health','/a/../b','?token=abc','#frag','/%2e%2e/x'];
 const schemes=['http','https','ftp','file','javascript','HTTP'];
 let accepted=0;
 for(let i=0;i<2000;i++){
  const host=pick(r,hosts);
  const url=`${pick(r,schemes)}://${pick(r,creds)}${host}${r()<0.8?':'+(1+Math.floor(r()*65534)):''}${pick(r,tails)}`;
  const result=validateService({name:'x',url});
  if(!result)continue;
  accepted++;
  const parsed=new URL(result.url);
  assert.equal(parsed.protocol,'http:',url);
  assert.ok(LOOPBACK.has(parsed.hostname),`${url} -> ${result.url}`);
  assert.equal(parsed.username+parsed.password,'',url);
  assert.equal(parsed.search+parsed.hash,'',url);
 }
 assert.ok(accepted>50,'fuzz must exercise the accepting path too');
});

test('concurrent in-place rewrites never yield a torn snapshot of a project file',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-toctou-'));
 const file=path.join(root,'package.json');
 const a=JSON.stringify({name:'aaaa',engines:{node:'>=18'},pad:'a'.repeat(4000)});
 const b=JSON.stringify({name:'bbbb',engines:{node:'>=20'},pad:'b'.repeat(4000)});
 await fs.writeFile(file,a);
 let stop=false;
 const writer=(async()=>{
  let flip=false;
  while(!stop){flip=!flip;await fs.writeFile(file,flip?a:b);await new Promise(r=>setImmediate(r));}
 })();
 try{
  const seen=new Set();
  for(let i=0;i<60;i++){
   const d=await discover(root);
   const state=d.fileStates['package.json'];
   assert.ok(['present','blocked','unreadable'].includes(state),state);
   if(state==='present'&&!d.malformedPackage)seen.add(d.nodeRequirement);
   // A torn read would be malformed JSON; it must be reported as blocked/unreadable, never as a valid mix.
   if(state==='present')assert.ok(['>=18','>=20'].includes(d.nodeRequirement)||d.malformedPackage,d.nodeRequirement);
  }
  assert.ok(seen.size>=1,'some reads must succeed');
 }finally{stop=true;await writer;await fs.rm(root,{recursive:true,force:true});}
});

test('a project file swapped for a symlink outside the workspace is never read',async(t)=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-link-'));
 const outside=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-out-'));
 try{
  await fs.writeFile(path.join(outside,'secret.json'),JSON.stringify({name:'LEAK',engines:{node:'>=99'}}));
  try{await fs.symlink(path.join(outside,'secret.json'),path.join(root,'package.json'));}
  catch(error){t.skip('symlink creation not permitted: '+error.code);return;}
  const d=await discover(root);
  assert.equal(d.fileStates['package.json'],'blocked');
  assert.notEqual(d.nodeRequirement,'>=99');
  assert.doesNotMatch(JSON.stringify(d),/LEAK/);
 }finally{
  await fs.rm(root,{recursive:true,force:true});await fs.rm(outside,{recursive:true,force:true});
 }
});

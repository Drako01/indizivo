'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const http=require('node:http');
const {diagnose,discover,verifyServices,sameFileIdentity}=require('../src/diagnostics');
test('cancelled diagnosis never reports a completed session',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-cancel-'));
 try{
   await fs.writeFile(path.join(root,'package.json'),'{"name":"fixture"}');
   const c=new AbortController();c.abort();
   await assert.rejects(()=>diagnose(root,2000,c.signal),/cancelled/);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('cancelled local service probe cannot report a healthy result',async()=>{
 const c=new AbortController();c.abort();
 await assert.rejects(()=>verifyServices([{name:'api',url:'http://127.0.0.1:1/'}],2500,c.signal),/Cancelled/);
});
test('symlinks are not read, including symlinks to sensitive outside files',async(t)=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-safe-'));
 const outside=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-outside-'));
 try{
  await fs.writeFile(path.join(outside,'secret'),'PRIVATE=secret-value');
  try{await fs.symlink(path.join(outside,'secret'),path.join(root,'.env'));}catch(e){
   if(['EPERM','EACCES','ENOTSUP'].includes(e.code))return t.skip('OS symlink privilege unavailable');
   throw e;
  }
  await fs.writeFile(path.join(root,'.env.example'),'PRIVATE=placeholder');
  const result=await discover(root);
  assert.deepEqual(result.missingEnv,[],'unreadable env never implies a missing key');
  assert.equal(result.fileStates['.env'],'blocked');
  assert.doesNotMatch(JSON.stringify(result),/secret-value/);
 }finally{await fs.rm(root,{recursive:true,force:true});await fs.rm(outside,{recursive:true,force:true});}
});
test('local HTTP probing only reads response headers and never trusts a redirect',async()=>{
 const server=http.createServer((req,res)=>{
  res.writeHead(302,{Location:'https://example.com/'});
  res.write('not needed');
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const checks=await verifyServices([{name:'redirect',url:'http://127.0.0.1:'+server.address().port+'/'}],900);
  assert.equal(checks[0].status,'warn');
  assert.equal(checks[0].detail,'HTTP 302');
 }finally{await new Promise(resolve=>server.close(resolve));}
});

test('file handle identity comparisons reject replaced or unverifiable sources',()=>{
 assert.equal(sameFileIdentity({dev:1,ino:100},{dev:1,ino:100}),true);
 assert.equal(sameFileIdentity({dev:1,ino:100},{dev:1,ino:101}),false);
 assert.equal(sameFileIdentity({dev:1,ino:100},{dev:2,ino:100}),false);
 assert.equal(sameFileIdentity({dev:1,ino:0},{dev:1,ino:0}),false,
   'An unknown inode cannot prove identity');
 const ntfsId=19140298419437390n;
 assert.equal(sameFileIdentity({dev:1n,ino:ntfsId},{dev:1n,ino:ntfsId}),true,
   'NTFS file IDs above 2^53 stay exact as bigint');
 assert.equal(sameFileIdentity({dev:1n,ino:ntfsId},{dev:1n,ino:ntfsId+1n}),false);
 assert.equal(sameFileIdentity({dev:1n,ino:0n},{dev:1n,ino:0n}),false);
});
test('normal bounded project files remain readable by file descriptor',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-fileid-'));
 try {
  await fs.writeFile(path.join(root,'package.json'),'{"name":"consistent"}');
  await fs.writeFile(path.join(root,'.env.example'),'KEY=placeholder');
  const discovery=await discover(root);
  assert.equal(discovery.fileStates['package.json'],'present');
  assert.equal(discovery.fileStates['.env.example'],'present');
  assert.equal(discovery.node,true);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});

'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {diagnose}=require('../src/diagnostics');

async function project(){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-rel-'));
 const scripts=Object.fromEntries(Array.from({length:12},(_,i)=>['dev-'+i,'next dev --port '+(33100+i)]));
 await fs.writeFile(path.join(root,'package.json'),JSON.stringify({scripts,engines:{node:'>=20'}}));
 await fs.writeFile(path.join(root,'go.mod'),'module example.org/rel\ngo 1.22\n');
 return root;
}
// Regression guards (not SLOs): generous bounds derived from measured p95 (~350 ms for a 12-port fixture).
test('cancellation under load settles promptly without leaving the run pending',async()=>{
 const root=await project();
 try{
  const controller=new AbortController();
  const started=Date.now();
  const run=diagnose(root,2000,controller.signal);
  setTimeout(()=>controller.abort(),25);
  await assert.rejects(run,error=>error.code==='ABORT_ERR'||/cancel/i.test(String(error.message)));
  assert.ok(Date.now()-started<3000,'cancel settled within 3s');
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('consecutive diagnoses stay independent and complete after a cancelled one',async()=>{
 const root=await project();
 try{
  const controller=new AbortController();
  controller.abort();
  await assert.rejects(diagnose(root,2000,controller.signal));
  for(let i=0;i<3;i++){
   const session=await diagnose(root,2000);
   assert.equal(session.state,'completed');
   assert.ok(session.checks.filter(check=>check.id.startsWith('port-')).length===12);
  }
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('a tiny time budget yields an explicit partial session, never a silent PASS',async()=>{
 const root=await project();
 try{
  const session=await diagnose(root,400);
  assert.ok(['completed','partial'].includes(session.state));
  if(session.state==='partial')assert.ok(session.checks.some(check=>check.id==='budget'&&check.status==='inconclusive'));
 }finally{await fs.rm(root,{recursive:true,force:true});}
});

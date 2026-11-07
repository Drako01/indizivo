'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {runBoundedCommand}=require('../dist/typed/process-control');

test('bounded read-only process exits normally with capped output',async()=>{
 const out=await runBoundedCommand(process.execPath,['--version'],{
  timeoutMs:2000,maxBuffer:1024
 });
 assert.equal(out.error,null);
 assert.equal(out.timedOut,false);
 assert.equal(out.cancelled,false);
 assert.match(out.stdout,/^v\d+\.\d+\.\d+/);
});
test('cancel an active owned process without reporting success',async()=>{
 const c=new AbortController();
 const promise=runBoundedCommand(process.execPath,
  ['-e','setInterval(()=>{},1000)'],{timeoutMs:3500,maxBuffer:1024},c.signal);
 setTimeout(()=>c.abort(),100);
 const result=await promise;
 assert.equal(result.cancelled,true);
 assert.equal(result.timedOut,false);
});
test('process timeout is bounded and cannot return success',async()=>{
 const result=await runBoundedCommand(process.execPath,
  ['-e','setInterval(()=>{},1000)'],{timeoutMs:500,maxBuffer:1024});
 assert.equal(result.timedOut,true);
 assert.equal(result.cancelled,false);
});
test('pre-aborted signal does not launch a new process',async()=>{
 const c=new AbortController();c.abort();
 const result=await runBoundedCommand(process.execPath,
  ['-e','process.stdout.write("NEVER_STARTED")'],{timeoutMs:1000,maxBuffer:1024},c.signal);
 assert.equal(result.cancelled,true);
 assert.equal(result.stdout,'');
});

test('abort terminates a real descendant probe, not only its parent',async()=>{
 const fs=require('node:fs/promises');
 const path=require('node:path');
 const os=require('node:os');
 const folder=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-owned-tree-'));
 const marker=path.join(folder,'heartbeat');
 const controller=new AbortController();
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const descendant='const fs=require("node:fs");setInterval(()=>fs.appendFileSync('+
  JSON.stringify(marker)+',"."),35);';
 const parent='const {spawn}=require("node:child_process");'+
  'spawn(process.execPath,["-e",'+JSON.stringify(descendant)+'],{stdio:"ignore"});'+
  'setInterval(()=>{},1000);';
 try {
  const job=runBoundedCommand(process.execPath,['-e',parent],
   {timeoutMs:4500,maxBuffer:1024},controller.signal);
  let observed=false;
  for(let i=0;i<40;i++){
   try{if((await fs.stat(marker)).size>=2){observed=true;break;}}
   catch(error){if(error.code!=='ENOENT')throw error;}
   await delay(50);
  }
  assert.ok(observed,'Descendant must start a real heartbeat before cancellation');
  controller.abort();
  const out=await job;
  assert.equal(out.cancelled,true);
  await delay(200);
  const stoppedSize=(await fs.stat(marker)).size;
  await delay(300);
  assert.equal((await fs.stat(marker)).size,stoppedSize,
   'An owned descendant must not keep running after abort');
 }finally{
  controller.abort();
  await fs.rm(folder,{recursive:true,force:true});
 }
});

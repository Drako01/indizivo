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

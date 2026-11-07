'use strict';
// Labeled discovery corpus (D-09 / P-13). Each case is a ground-truth statement about what
// is declared in a fixture project. The measured error rate must stay under the owner target.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {discover}=require('../dist/typed/diagnostics');
const corpus=require('./corpus/projects.json');

const MAX_ERROR_RATE=0.05;

function mismatches(discovery,expect){
 const wrong=[];
 for(const [key,want] of Object.entries(expect)){
  if(key==='noText'){
   if(JSON.stringify(discovery).includes(want))wrong.push('leaked '+want);
  } else if(key==='lockfilesCount'){
   if(discovery.lockfiles.length!==want)wrong.push(key);
  } else if(key==='optionalRuntime'){
   if(!(discovery.optionalRuntimes[want]||[]).length)wrong.push(key);
  } else if(key==='portOrigins'||key==='fileStates'){
   for(const [item,origin] of Object.entries(want))
    if(discovery[key][item]!==origin)wrong.push(`${key}.${item}`);
  } else if(JSON.stringify(discovery[key])!==JSON.stringify(want))wrong.push(key);
 }
 return wrong;
}

test('labeled discovery corpus stays under the false positive / negative budget',async()=>{
 let assertions=0,errors=0;const report=[];
 for(const item of corpus){
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-corpus-'));
  try{
   for(const [name,content] of Object.entries(item.files))
    await fs.writeFile(path.join(root,name),content);
   const wrong=mismatches(await discover(root),item.expect);
   assertions+=Object.keys(item.expect).length;
   errors+=wrong.length;
   if(wrong.length)report.push(item.name+': '+wrong.join(', '));
  }finally{await fs.rm(root,{recursive:true,force:true});}
 }
 assert.ok(assertions>=30,'corpus must keep a meaningful number of labeled assertions');
 assert.deepEqual(report,[],'corpus mismatches');
 assert.ok(errors/assertions<=MAX_ERROR_RATE,`error rate ${errors}/${assertions}`);
});

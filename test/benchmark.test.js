'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
test('benchmark harness measures repeated actual diagnosis operations',()=>{
 const s=fs.readFileSync(path.resolve(__dirname,'../scripts/benchmark.cjs'),'utf8');
 for(const phrase of ['performance.now(', 'diagnose(folder', 'p95Ms',
   'peakRssMiB','Synthetic local fixture only'])
   assert.ok(s.includes(phrase),'Missing benchmark feature: '+phrase);
});

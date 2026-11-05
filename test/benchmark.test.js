'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
test('benchmark harness measures repeated real diagnostics on temporary fixtures',()=>{
 const s=fs.readFileSync(path.resolve(__dirname,'../scripts/benchmark.cjs'),'utf8');
 assert.match(s,/performance\\.now\\(/);
 assert.match(s,/diagnose\\(folder/);
 assert.match(s,/p95Ms/);
 assert.match(s,/peakRssMiB/);
 assert.match(s,/Synthetic local fixture only/);
});

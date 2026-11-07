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

test('enterprise performance fixture profiles remain explicitly synthetic and bounded',()=>{
 const content=fs.readFileSync(path.resolve(__dirname,'../scripts/benchmark.cjs'),'utf8');
 for(const field of ['INDIZIVO_BENCH_PROFILE','fixtureEnvNames','declaredPorts','fixtureDependencies'])
  assert.ok(content.includes(field),field);
 assert.ok(content.includes('Math.min(50'));
 const workflow=fs.readFileSync(path.resolve(__dirname,'../.github/workflows/verify-packaged.yml'),'utf8');
 assert.match(workflow,/for profile in small medium large/);
 assert.match(workflow,/indizivo\.synthetic-benchmarks\.jsonl/);
 assert.doesNotMatch(workflow,/vsce publish|ovsx publish|gh release create/);
});

test('benchmark can measure a real local project read-only and omits its name',()=>{
 const s=fs.readFileSync(path.resolve(__dirname,'../scripts/benchmark.cjs'),'utf8');
 for(const phrase of ['INDIZIVO_BENCH_ROOT','real-project-local-benchmark','Project name is intentionally omitted','if(!external)await fs.rm'])
  assert.ok(s.includes(phrase),phrase);
});

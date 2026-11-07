'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const file=fs.readFileSync(path.resolve(__dirname,'../.github/workflows/verify-packaged.yml'),'utf8');
test('candidate VSIX workflow cannot publish or modify main',()=>{
 assert.match(file,/workflow_dispatch:/);
 assert.match(file,/branches: \[feat\/indizivo-enterprise-aaaa\]/);
 assert.match(file,/docs\/ENTERPRISE_AAAA_RELEASE_CANDIDATE\.md/);
 assert.match(file,/npm run package/);
 assert.match(file,/xvfb-run -a npm run smoke:vsix/);
 assert.match(file,/npm run inspect:vsix/);
 assert.match(file,/sha256sum/);
 assert.doesNotMatch(file,/id-token:\s*write|vsce publish|ovsx publish|gh release create/);
 assert.doesNotMatch(file,/branches: \[main\]/);
});

test('synthetic benchmark evidence is attached only to unreleased candidate, never publish',()=>{
 assert.match(file,/INDIZIVO_BENCH_PROFILE/);
 assert.match(file,/indizivo\.synthetic-benchmarks\.jsonl/);
 assert.match(file,/INDIZIVO_BENCH_RUNS=12/);
 assert.doesNotMatch(file,/id-token:\s*write/);
});

test('publish packages the VSIX without repeating the verify gate that its needs already passed',()=>{
 const publish=fs.readFileSync(path.resolve(__dirname,'../.github/workflows/publish.yml'),'utf8');
 const pkg=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../package.json'),'utf8'));
 assert.match(publish,/needs: \[plan, verify, vscode-e2e\]/);
 assert.match(publish,/run: npm run package:vsix/);
 assert.doesNotMatch(publish,/run: npm run package\s*$/m);
 assert.match(pkg.scripts.package,/^npm run verify && npm run package:vsix$/);
});

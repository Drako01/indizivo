'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {loadRules,validate}=require('../scripts/ruleset-governance.cjs');
test('Indizivo rulesets match source governance but remain disabled',()=>{
 const [main,tags]=validate(loadRules());
 assert.equal(main.enforcement,'disabled');
 assert.equal(tags.enforcement,'disabled');
 assert.equal(main.target,'branch');
 assert.deepEqual(main.conditions.ref_name.include,['~DEFAULT_BRANCH']);
 const pr=main.rules.find(x=>x.type==='pull_request').parameters;
 assert.equal(pr.required_approving_review_count,1);
 assert.equal(pr.require_code_owner_review,true);
 assert.equal(pr.require_last_push_approval,true);
 assert.deepEqual(pr.allowed_merge_methods,['squash']);
 const contexts=main.rules.find(x=>x.type==='required_status_checks').parameters.required_status_checks;
 assert.deepEqual(contexts.map(x=>x.context),[
  'Node tests / ubuntu-latest','Node tests / windows-latest','Node tests / macos-latest']);
 assert.deepEqual(tags.conditions.ref_name.include,['refs/tags/v*']);
 assert.deepEqual(tags.rules.map(x=>x.type),['update','deletion','non_fast_forward']);
 assert.equal(main.bypass_actors[0].bypass_mode,'pull_request');
 assert.equal(tags.bypass_actors[0].bypass_mode,'always');
});
test('repository CODEOWNERS is assigned to the maintainer',()=>{
 const f=fs.readFileSync(path.resolve(__dirname,'../.github/CODEOWNERS'),'utf8');
 assert.match(f,/^\* @Drako01\s*$/m);
});

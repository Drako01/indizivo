'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
test('branch protection matches mandatory Probato review policy but avoids phantom checks',()=>{
 const r=read('config/rulesets/main-development.json');
 assert.equal(r.target,'branch');
 assert.deepEqual(r.conditions.ref_name.include,['~DEFAULT_BRANCH']);
 for(const rule of ['deletion','non_fast_forward','required_linear_history','pull_request'])
  assert.ok(r.rules.some(x=>x.type===rule),rule);
 assert.ok(!r.rules.some(x=>x.type==='required_status_checks'));
 const reviews=r.rules.find(x=>x.type==='pull_request').parameters;
 assert.equal(reviews.required_approving_review_count,1);
 assert.equal(reviews.require_code_owner_review,true);
 assert.equal(reviews.require_last_push_approval,true);
 assert.equal(reviews.dismiss_stale_reviews_on_push,true);
 assert.equal(reviews.required_review_thread_resolution,true);
 assert.deepEqual(reviews.allowed_merge_methods,['squash']);
});
test('release tags protect immutable versions',()=>{
 const r=read('config/rulesets/release-tags.json');
 assert.equal(r.target,'tag');
 assert.deepEqual(r.conditions.ref_name.include,['refs/tags/v*']);
 for(const rule of ['update','deletion','non_fast_forward'])assert.ok(r.rules.some(x=>x.type===rule));
});
test('future required status checks are gated separately from disabled CI',()=>{
 const future=read('config/rulesets/main-with-ci.json');
 assert.ok(future.rules.some(x=>x.type==='required_status_checks'));
 const owners=fs.readFileSync(path.join(root,'.github/CODEOWNERS'),'utf8');
 assert.match(owners,/^\* @Drako01/m);
});

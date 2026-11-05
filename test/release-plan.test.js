'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {compareVersions,getPlan}=require('../scripts/release-plan.cjs');

const base={event:'push',ref:'refs/heads/main',version:'0.1.1',
 previousVersion:'0.1.0',enabled:'true',confirmed:''};
test('merge to main publishes strictly newer versions while release switch is enabled',()=>{
 assert.deepEqual(getPlan(base),{version:'0.1.1',publish:true,reason:'Version increased'});
 assert.equal(compareVersions('0.2.0','0.1.99'),1);
 assert.equal(compareVersions('1.0.0','0.99.99'),1);
});
test('ordinary merges do not republish unchanged version',()=>{
 assert.deepEqual(getPlan({...base,version:'0.1.0'}),{version:'0.1.0',publish:false,reason:'Version unchanged'});
});
test('release switch defaults fail-closed and blocks even a version bump',()=>{
 for(const enabled of [undefined,'false','True','1','']){
  assert.equal(getPlan({...base,enabled}).publish,false);
 }
});
test('manual release needs both opt-in and explicit confirmation',()=>{
 assert.equal(getPlan({...base,event:'workflow_dispatch',confirmed:'true'}).publish,true);
 assert.equal(getPlan({...base,event:'workflow_dispatch',confirmed:'false'}).publish,false);
 assert.equal(getPlan({...base,event:'workflow_dispatch',enabled:'false',confirmed:'true'}).publish,false);
});
test('release planner rejects cross-branch, unsupported trigger, downgrade and invalid versions',()=>{
 for(const q of [
  {...base,ref:'refs/heads/feature'},
  {...base,event:'pull_request'},
  {...base,version:'0.0.9'},
  {...base,version:'0.1.1-rc.1'},
  {...base,previousVersion:null},
  {...base,previousVersion:'0.1.0-beta.1'}
 ]) assert.throws(()=>getPlan(q));
});

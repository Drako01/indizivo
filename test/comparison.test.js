'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {compareSessions}=require('../src/comparison');
test('comparison never upgrades absent evidence to resolved',()=>{
 const older={project:'app',state:'completed',completedAt:'2026-11-01',
  checks:[{id:'node',status:'warn'},{id:'port-3000',status:'info'}]};
 const newer={project:'app',state:'completed',completedAt:'2026-11-02',
  checks:[{id:'node',status:'pass'},{id:'go',status:'info'}]};
 const result=compareSessions(older,newer);
 assert.deepEqual(result.observations.map(c=>c.trend),['status-changed','new-observation','not-reobserved']);
 assert.ok(!JSON.stringify(result).includes('resolved:true'));
});
test('incomparable projects or partial runs return no trend',()=>{
 assert.equal(compareSessions({project:'A',state:'completed'}, {project:'B',state:'completed'}),null);
 assert.equal(compareSessions({project:'A',state:'running'}, {project:'A',state:'completed'}),null);
});

test('observations from different Extension Host platforms cannot be compared',()=>{
 const old={project:'demo',host:'linux',completedAt:'before',state:'completed',checks:[{id:'port-3000',status:'info'}]};
 assert.equal(compareSessions(old,{...old,host:'win32',completedAt:'after'}),null);
});

test('scope IDs prevent cross-workspace comparisons for identical project names',()=>{
 const run={project:'app',host:'linux',scopeId:'workspace-a',state:'completed',completedAt:'before',
  checks:[{id:'node',status:'pass'}]};
 assert.equal(compareSessions(run,{...run,scopeId:'workspace-b'}),null);
 assert.equal(compareSessions(run,{...run,scopeId:undefined}),null);
});

test('remote and local hosts are labelled distinctly so their sessions are never compared',()=>{
 const {hostLabel}=require('../dist/typed/host');
 assert.equal(hostLabel(undefined,'linux'),'linux');
 assert.equal(hostLabel('wsl','linux'),'linux · wsl');
 const base={project:'demo',completedAt:'t',state:'completed',checks:[{id:'a',status:'info'}]};
 assert.equal(compareSessions({...base,host:hostLabel(undefined,'linux')},{...base,host:hostLabel('ssh-remote','linux')}),null);
});

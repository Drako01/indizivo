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

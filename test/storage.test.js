'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {restoreSession,restoreHistory}=require('../dist/typed/storage');
const {localizeFinding}=require('../dist/typed/i18n');
function session(){
 return {schemaVersion:2,id:'123',project:'example',host:'linux',state:'completed',
   startedAt:'2026-11-06T00:00:00Z',completedAt:'2026-11-06T00:00:01Z',
   discovery:{project:'example',node:true,go:false},
   checks:[{id:'node',label:'Node.js',category:'Runtime',status:'pass',detail:'v24',
     suggestion:'No action needed',evidence:[{id:'e1',fact:'v24',observedAt:'2026-11-06T00:00:00Z'}],
     i18n:{detail:{key:'diag.nodeDetail',values:{version:'v24',required:'',verdict:''}}}}],
   serviceChecks:[]};
}
test('valid v2 session and a legacy session with absent schema remain navigable',()=>{
 const current=restoreSession(session());
 assert.equal(current.schemaVersion,2);
 assert.equal(current.checks.length,1);
 assert.ok(localizeFinding(current.checks[0],'es').detail.includes('v24'));
 const older=session();delete older.schemaVersion;
 assert.ok(restoreSession(older));
});
test('corrupt or oversized state cannot masquerade as a complete session',()=>{
 const invalid=[null,'unsafe',{state:'completed'},{...session(),state:'running'},
   {...session(),checks:Array.from({length:151},()=>session().checks[0])},
   {...session(),checks:[{...session().checks[0],detail:'x'.repeat(6000)}]}];
 for(const candidate of invalid)assert.equal(restoreSession(candidate),null);
});
test('history is capped, validates schema and drops malformed translation descriptors',()=>{
 const raw=session();
 raw.checks[0].i18n={detail:{key:'bogus.translation.key'}};
 const history=restoreHistory(Array.from({length:15},(_,i)=>({
   project:'example',completedAt:String(i),checks:[{id:'node',status:'pass'}],snapshot:raw
 })));
 assert.equal(history.length,10);
 const restored=history[0].snapshot;
 assert.ok(restored);
 assert.equal(restored.checks[0].i18n,undefined);
 assert.doesNotThrow(()=>localizeFinding(restored.checks[0],'es'));
});
test('history rejects invalid entries without losing valid ones',()=>{
 const valid={project:'example',completedAt:'2026-11-06',checks:[{id:'node',status:'warn'}],snapshot:session()};
 const found=restoreHistory([{},null,{...valid,project:''},valid]);
 assert.equal(found.length,1);
 assert.equal(found[0].snapshot.schemaVersion,2);
});

'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {ProjectStateStore}=require('../dist/typed/project-state');

function memento(initial={}){
 const map=new Map(Object.entries(initial));
 return {map,get:(key,fallback)=>map.has(key)?map.get(key):fallback,
  update:async(key,value)=>{map.set(key,value);}};
}
const store=storage=>new ProjectStateStore(storage,()=>'es');

test('storage keys are stable, hashed and isolated per project',()=>{
 const s=store(memento());
 assert.equal(s.key('file:///a'),s.key('file:///a'));
 assert.notEqual(s.key('file:///a'),s.key('file:///b'));
 assert.doesNotMatch(s.key('file:///secret/path'),/secret/);
 assert.equal(s.key(null),s.key('none'));
});

test('load clamps timeout, caps services, validates locale and falls back to host language',()=>{
 const s=store(memento());
 const key=s.key('r');
 const services=Array.from({length:30},(_,i)=>({name:'s'+i,url:`http://127.0.0.1:${4000+i}/`}));
 const loaded=store(memento({[key]:{timeoutMs:999999,services,locale:'fr',history:'junk'}})).load('r');
 assert.equal(loaded.data.timeoutMs,10000);
 assert.equal(loaded.data.services.length,20);
 assert.equal(loaded.data.locale,'es');
 assert.deepEqual(loaded.data.history,[]);
 assert.equal(loaded.readFailed,false);
});

test('corrupt or unreadable storage never throws and is reported',()=>{
 const throwing={get(){throw new Error('disk');},update:async()=>{}};
 const loaded=store(throwing).load('r');
 assert.equal(loaded.readFailed,true);
 assert.equal(loaded.data.session,null);
 assert.equal(store(memento({[store(memento()).key('r')]:[1,2]})).load('r').data.timeoutMs,2500);
});

test('save reports failure instead of pretending persistence succeeded',async()=>{
 const ok=memento();
 const data=store(ok).load('r').data;
 assert.equal(await store(ok).save('r',data),true);
 assert.ok(ok.map.has(store(ok).key('r')));
 const failing={get:(k,d)=>d,update:async()=>{throw new Error('quota');}};
 assert.equal(await store(failing).save('r',data),false);
});

'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseVersion,evaluateVersion}=require('../src/versions');
test('versions compare major, minor and patch',()=>{
 assert.deepEqual(parseVersion('v22.16.0'),{major:22,minor:16,patch:0,precision:3});
 assert.equal(evaluateVersion('22.16.0','>=20 <23','node').status,'compatible');
 assert.equal(evaluateVersion('18.17.1','>=20','node').status,'incompatible');
 assert.equal(evaluateVersion('22.16.0','>=22.17','node').status,'incompatible');
});
test('supports common range operators without claiming arbitrary npm semver support',()=>{
 assert.equal(evaluateVersion('20.4.2','^20.1.0','node').status,'compatible');
 assert.equal(evaluateVersion('21.0.0','^20.1.0','node').status,'incompatible');
 assert.equal(evaluateVersion('20.4.2','~20.4.0','node').status,'compatible');
 assert.equal(evaluateVersion('20.5.0','~20.4.0','node').status,'incompatible');
 assert.equal(evaluateVersion('20.4.2','^20 || ^22','node').status,'compatible');
});
test('Go module versions are a minimum',()=>{
 assert.equal(evaluateVersion('1.24.1','1.23','go').status,'compatible');
 assert.equal(evaluateVersion('1.22.9','1.23','go').status,'incompatible');
});


test('npm range precision: major-only tilde and caret zero semantics',()=>{
 for(const [actual,range,expected] of [
   ['1.9.5','~1','compatible'],['2.0.0','~1','incompatible'],
   ['1.2.9','~1.2','compatible'],['1.3.0','~1.2','incompatible'],
   ['0.0.3','^0.0.3','compatible'],['0.0.4','^0.0.3','incompatible'],
   ['0.2.9','^0.2','compatible'],['0.3.0','^0.2','incompatible'],
   ['0.5.1','^0','compatible'],['1.0.0','^0','incompatible'],
   ['22.9.1','22.x','compatible'],['23.0.0','22.x','incompatible'],
   ['22.9.1','22.9.x','compatible'],['22.10.0','22.9.x','incompatible'],
   ['22.9.1','*','compatible'],['22.9.1','>=20 <23','compatible'],
   ['22.9.1','^20 || ^22','compatible'],['18.0.0','^20 || ^22','incompatible']
 ]) assert.equal(evaluateVersion(actual,range,'node').status,expected,actual+' '+range);
});

test('unsupported npm forms and prereleases fail closed rather than guessing',()=>{
 for(const range of ['>=20.0.0-rc.1','1.2.3 - 2.1.0','>=20 || not-semver','>22.x','^0.0.x']){
   assert.equal(evaluateVersion('22.5.1',range,'node').status,'inconclusive',range);
 }
 assert.equal(evaluateVersion('22.0.0-rc.1','>=20','node').status,'inconclusive');
 assert.equal(evaluateVersion('22.5.1','^22 || unknown','node').status,'compatible',
   'known successful disjunct is sufficient');
});

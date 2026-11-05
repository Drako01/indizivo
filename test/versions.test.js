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
 assert.equal(evaluateVersion('20.4.2','^20 || ^22','node').status,'inconclusive');
});
test('Go module versions are a minimum',()=>{
 assert.equal(evaluateVersion('1.24.1','1.23','go').status,'compatible');
 assert.equal(evaluateVersion('1.22.9','1.23','go').status,'incompatible');
});

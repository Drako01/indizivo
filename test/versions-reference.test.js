'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {evaluateVersion}=require('../src/versions');

// Reference expectations evaluated against npm's semver 7.6.3 on 2026-11-06.
// Frozen data: CI does not fetch packages or rely on a second semver implementation.
// This is a supported stable-release subset; prereleases remain
// explicitly INCONCLUSIVE instead of pretending full npm semver coverage.
const npmSemver763=[
 ['1.9.9','~1',true],['2.0.0','~1',false],
 ['1.2.9','~1.2',true],['1.3.0','~1.2',false],
 ['1.9.0','~1.x',true],['2.0.0','~1.x',false],
 ['1.3.0','~1.*',true],
 ['1.2.3','1.2.*',true],['1.3.0','1.2.*',false],
 ['1.99.5','1.*',true],['2.0.0','1.*',false],
 ['0.0.3','^0.0.3',true],['0.0.4','^0.0.3',false],
 ['0.0.4','^0.0.x',true],['0.1.0','^0.0.x',false],
 ['0.2.1','^0.2',true],['0.3.0','^0.2',false],
 ['0.9.1','^0',true],['1.0.0','^0',false],
 ['20.0.0','>=20 <23',true],['23.0.0','>=20 <23',false],
 ['22.0.0','^20 || ^22',true],['21.0.0','^20 || ^22',false],
 ['20.4.2','<=20.4',true],['20.5.0','<=20.4',false],
 ['21.0.0','>20',true],['20.9.9','>20',false],
 ['22.16.0','22.x',true],['23.0.0','22.x',false],
 ['22.16.0','*',true],['0.0.0','~0',true],['0.3.0','~0',true],
 ['0.0.9','^0.0.x',true],['20.5.0','^20.0.0',true],
 ['20.5.0','>=22 || >=20 <21',true],
 // Hyphen ranges: partial upper bound is exclusive of the next minor/major (npm semver).
 ['2.1.0','1.2.3 - 2.1.0',true],['2.1.1','1.2.3 - 2.1.0',false],['1.2.2','1.2.3 - 2.1.0',false],
 ['2.3.9','1.2.3 - 2.3',true],['2.4.0','1.2.3 - 2.3',false],
 ['2.9.9','1 - 2',true],['3.0.0','1 - 2',false],
 ['22.1.0','>=18 <20 || 20 - 22',true]
];
test('npm semver 7.6.3 reference corpus: supported stable ranges',()=>{
 for(const [installed,requirement,satisfies] of npmSemver763){
  const result=evaluateVersion(installed,requirement,'node');
  assert.equal(result.status,satisfies?'compatible':'incompatible',
    installed+' in '+requirement);
 }
});
test('unsupported npm release syntax stays inconclusive, never a false compatibility verdict',()=>{
 for(const [installed,range] of [
  ['20.0.0-rc.1','>=20.0.0'],
  ['20.0.0-rc.1','>=20.0.0-rc.1'],
  ['20.5.0','>20.x']
 ])assert.equal(evaluateVersion(installed,range,'node').status,'inconclusive',
   installed+' in '+range);
});

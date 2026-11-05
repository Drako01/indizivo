'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseVersion, compareVersions, getPlan } = require('../scripts/release-plan.cjs');
const base = { event: 'push', ref: 'refs/heads/main', version: '0.1.1', previousVersion: '0.1.0' };
test('parse strict SemVer 3-integer and compare correctly', () => {
  assert.deepEqual(parseVersion('0.1.1'), [0,1,1]);
  assert.equal(compareVersions('0.2.0', '0.1.99'), 1);
  assert.equal(compareVersions('1.0.0', '0.99.99'), 1);
  assert.equal(compareVersions('0.1.0', '0.1.0'), 0);
  for (const version of ['0.1.1-rc.1','01.2.3','0.1.','0.1','1e2.0.0','99999999999999999999.0.0']) assert.throws(() => parseVersion(version));
});
test('version increase after merge triggers release', () => {
  assert.deepEqual(getPlan(base), { version: '0.1.1', publish: true, reason: 'version-increased' });
});
test('unchanged version stays verification only', () => {
  assert.deepEqual(getPlan({...base, version:'0.1.0'}), { version:'0.1.0', publish:false, reason:'unchanged' });
});
test('manual dispatch requires explicit approval', () => {
  assert.equal(getPlan({...base, event:'workflow_dispatch', confirmed:'true'}).publish,true);
  for (const confirmed of [false, 'false','TRUE','1',undefined]) {
    assert.equal(getPlan({...base, event:'workflow_dispatch', confirmed}).publish,false);
  }
});
test('non-main, event injection, missing history and rollback fail closed', () => {
  for (const options of [
    {...base,ref:'refs/heads/qa'},
    {...base,event:'pull_request'},
    {...base,previousVersion:undefined},
    {...base,version:'0.0.9'},
    {...base,previousVersion:'0.1.0-rc1'},
  ]) assert.throws(() => getPlan(options));
});
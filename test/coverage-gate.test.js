'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCoverage, evaluate } = require('../scripts/coverage-gate.cjs');

const sample = 'ℹ   budget.js           | 100.00 |   100.00 |  100.00 | \nℹ   storage.js          |  80.10 |    73.44 |   64.29 | 28-35\n';

test('coverage report rows are parsed per file', () => {
  const parsed = parseCoverage(sample);
  assert.equal(parsed.get('budget.js'), 100);
  assert.equal(parsed.get('storage.js'), 80.1);
});

test('floors fail on regressions and on missing files', () => {
  const parsed = parseCoverage(sample);
  assert.deepEqual(evaluate(parsed, { 'budget.js': 95 }), []);
  assert.equal(evaluate(parsed, { 'storage.js': 83 }).length, 1);
  assert.equal(evaluate(parsed, { 'gone.js': 50 }).length, 1);
});

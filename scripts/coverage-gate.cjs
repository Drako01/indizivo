'use strict';
// Per-file line-coverage floors for risk-bearing modules (A-05). Floors sit a few points
// below the measured baseline so they block regressions without demanding a global %.
// Parses the built-in Node test runner report; no dependency is added.
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const FLOORS = {
  'budget.js': 95, 'comparison.js': 95, 'diagnostics.js': 90, 'i18n.js': 95,
  'messages.js': 95, 'monorepo.js': 88, 'process-control.js': 75, 'redaction.js': 95,
  'reports.js': 95, 'storage.js': 83, 'tool-probes.js': 95, 'versions.js': 95,
  'extension.js': 70
};

function parseCoverage(report) {
  const lines = new Map();
  for (const row of report.split(/\r?\n/)) {
    const match = /^ℹ\s+([\w.-]+\.js)\s+\|\s+([\d.]+)\s+\|/.exec(row);
    if (match) lines.set(match[1], Number(match[2]));
  }
  return lines;
}

function evaluate(measured, floors = FLOORS) {
  const failures = [];
  for (const [file, floor] of Object.entries(floors)) {
    const actual = measured.get(file);
    if (actual === undefined) failures.push(`${file}: no coverage reported`);
    else if (actual < floor) failures.push(`${file}: ${actual}% < floor ${floor}%`);
  }
  return failures;
}

if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  const tests = fs.readdirSync(path.join(root, 'test'))
    .filter(name => name.endsWith('.test.js')).map(name => path.join('test', name));
  const run = spawnSync(process.execPath, ['--experimental-test-coverage', '--test', ...tests], {
    cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024
  });
  const output = `${run.stdout}\n${run.stderr}`;
  if (run.status !== 0) {
    console.error(output.slice(-4000));
    console.error('Coverage gate: tests failed');
    process.exit(1);
  }
  const failures = evaluate(parseCoverage(output));
  if (failures.length) {
    failures.forEach(failure => console.error(failure));
    console.error(`Coverage gate: FAIL (${failures.length})`);
    process.exit(1);
  }
  console.log('Coverage gate: PASS');
}
module.exports = { parseCoverage, evaluate, FLOORS };

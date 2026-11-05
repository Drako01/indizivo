'use strict';
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

function parseVersion(raw) {
  if (typeof raw !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(raw)) {
    throw new Error('Release requires a plain major.minor.patch version');
  }
  const parts = raw.split('.').map(Number);
  if (!parts.every(Number.isSafeInteger)) throw new Error('Version component exceeds safe integer range');
  return parts;
}
function compareVersions(a, b) {
  const lhs = parseVersion(a);
  const rhs = parseVersion(b);
  for (let i = 0; i < 3; i++) {
    if (lhs[i] !== rhs[i]) return lhs[i] > rhs[i] ? 1 : -1;
  }
  return 0;
}
function getPlan({ event, ref, version, previousVersion, confirmed }) {
  parseVersion(version);
  if (ref !== 'refs/heads/main') throw new Error('Only main may publish');
  if (event === 'push') {
    if (!previousVersion) throw new Error('Push lacks valid previous version');
    const order = compareVersions(version, previousVersion);
    if (order < 0) throw new Error('Version downgrade is not a release');
    return { version, publish: order > 0, reason: order === 0 ? 'unchanged' : 'version-increased' };
  }
  if (event === 'workflow_dispatch') {
    return { version, publish: confirmed === 'true', reason: confirmed === 'true' ? 'manual-confirmed' : 'manual-not-confirmed' };
  }
  throw new Error('Unsupported event for release planning');
}
function main() {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
  if (pkg.name !== 'indizivo' || pkg.publisher !== 'armotusitio') throw new Error('Unexpected VS Code extension identity');
  if (lock.version !== pkg.version || lock.packages?.['']?.version !== pkg.version) throw new Error('Package lock/version mismatch; run npm install --package-lock-only');
  let previousVersion;
  if (process.env.RELEASE_EVENT === 'push') {
    const before = process.env.RELEASE_BEFORE;
    if (!/^[a-f\d]{40}$/i.test(before ?? '') || /^0{40}$/.test(before)) {
      throw new Error('Missing valid github.event.before SHA');
    }
    const previous = execFileSync('git', ['show', `${before}:package.json`], { encoding: 'utf8', timeout: 10000 });
    previousVersion = JSON.parse(previous).version;
  }
  const plan = getPlan({ event: process.env.RELEASE_EVENT, ref: process.env.RELEASE_REF,
    version: pkg.version, previousVersion, confirmed: process.env.RELEASE_CONFIRMED });
  process.stdout.write(`publish=${plan.publish}\nversion=${plan.version}\n`);
  const details = `Indizivo ${plan.version}: publish=${plan.publish}; reason=${plan.reason}; previous=${previousVersion ?? 'none'}`;
  console.error(details);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${details}\n`);
}
if (require.main === module) {
  try { main(); } catch (error) { console.error(`Release plan refused: ${error.message}`); process.exitCode = 1; }
}
module.exports = { parseVersion, compareVersions, getPlan };
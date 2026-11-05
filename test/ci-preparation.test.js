'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const workflow = (filename) => fs.readFileSync(path.join(root,'.github/workflows',filename), 'utf8').replace(/\r\n/g, '\n');

test('quality gates run for PR/main on Linux, Windows and macOS', () => {
 const ci = workflow('verify.yml');
 assert.match(ci,/pull_request:/);
 assert.match(ci,/push:/);
 assert.match(ci,/branches: \[main\]/);
 assert.match(ci,/node-version: 24/);
 assert.match(ci,/os: \[ubuntu-latest, windows-latest, macos-latest\]/);
 assert.match(ci,/npm run verify/);
 assert.match(ci,/npm audit --omit=dev/);
 assert.match(ci,/npm exec --yes --package=@vscode\/vsce@4\.1\.0 -- vsce --version/);
 assert.match(ci,/xvfb-run -a npm run test:e2e/);
 assert.doesNotMatch(ci,/id-token: write|vsce publish|ovsx publish/);
});

test('release planning triggers on main version bump and explicit manual dispatch', () => {
 const ci = workflow('publish.yml');
 assert.match(ci,/^  push:\n    branches: \[main\]/m);
 assert.match(ci,/workflow_dispatch:/);
 assert.match(ci,/confirm_publication:/);
 assert.match(ci,/open_vsx_sync:/);
 assert.match(ci,/schedule:/);
 assert.doesNotMatch(ci,/^  pull_request:/m);
 assert.match(ci,/RELEASE_BEFORE: \$\{\{ github\.event\.before \}\}/);
 assert.match(ci,/node scripts\/release-plan\.cjs/);
 assert.match(ci,/needs\.plan\.outputs\.publish == 'true'/);
 assert.match(ci,/node-version: 24/);
});

test('both registries publish an identical checked VSIX using scoped OIDC', () => {
 const ci = workflow('publish.yml');
 assert.match(ci,/os: \[ubuntu-latest, windows-latest, macos-latest\]/);
 assert.match(ci,/xvfb-run -a npm run test:e2e/);
 assert.match(ci,/xvfb-run -a npm run smoke:vsix/);
 assert.match(ci,/sha256sum --check indizivo\.vsix\.sha256/g);
 assert.match(ci,/name: indizivo-vsix/g);
 assert.match(ci,/name: Publish Visual Studio Marketplace \/ OIDC/);
 assert.match(ci,/--oidc --packagePath/);
 assert.match(ci,/npm exec --yes --package=@vscode\/vsce@4\.1\.0 -- vsce publish --oidc/);
 assert.doesNotMatch(ci,/@vscode\/vsce@4\.0\.[02]/);
 assert.match(ci,/name: Publish same artifact to Open VSX \/ OIDC/);
 assert.match(ci,/node scripts\/open-vsx-publish\.mjs/);
 assert.match(ci,/id-token: write/g);
 assert.match(ci,/environment: marketplace/g);
 assert.doesNotMatch(ci,/VSCE_PAT:\s*\$|OVSX_PAT:\s*\$|--pat /);
 assert.doesNotMatch(ci,/^  push:\n    branches: \[demo\]/m);
});

test('Open VSX can retry slow registry activation without blocking Marketplace release', () => {
 const ci = workflow('publish.yml');
 assert.match(ci,/needs: \[plan, publish-marketplace\]/);
 assert.match(ci,/name: Daily or manual Open VSX reconciliation/);
 assert.match(ci,/gh release download/);
 const script = fs.readFileSync(path.join(root,'scripts/open-vsx-publish.mjs'),'utf8');
 assert.match(script,/--trusted-publishing/);
 assert.match(script,/--skip-duplicate/);
 assert.match(script,/INACTIVE/);
 assert.match(script,/OVSX_PAT/);
});
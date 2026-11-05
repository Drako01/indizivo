'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const live=name=>fs.readFileSync(path.join(root,'.github/workflows',name),'utf8');

test('active CI verifies main and PRs without release credentials',()=>{
 const ci=live('verify.yml');
 assert.match(ci,/pull_request:/);
 assert.match(ci,/push:/);
 assert.match(ci,/branches: \[main\]/);
 assert.match(ci,/node-version: 24/);
 assert.match(ci,/os: \[ubuntu-latest, windows-latest, macos-latest\]/);
 assert.match(ci,/npm run verify/);
 assert.match(ci,/npm audit --omit=dev/);
 assert.match(ci,/xvfb-run -a npm run test:e2e/);
 assert.doesNotMatch(ci,/id-token: write|vsce publish|ovsx publish/);
});

test('Marketplace publisher requires manual approval, main and OIDC',()=>{
 const ci=live('publish.yml');
 assert.match(ci,/workflow_dispatch:/);
 assert.doesNotMatch(ci,/^  push:|^  pull_request:|^  release:/m);
 assert.match(ci,/confirm_publication/);
 assert.match(ci,/INDIZIVO_RELEASE_ENABLED/);
 assert.match(ci,/refs\/heads\/main/);
 assert.match(ci,/environment: marketplace/);
 assert.match(ci,/id-token: write/);
 assert.match(ci,/--oidc --packagePath/);
 assert.match(ci,/--skip-duplicate/);
 assert.match(ci,/needs: \[authorize, verify, vscode-e2e, package\]/);
 assert.match(ci,/sha256sum --check indizivo\.vsix\.sha256/);
 assert.match(ci,/npm run inspect:vsix/);
 assert.doesNotMatch(ci,/VSCE_PAT:|OVSX_PAT:|--pat /);
 assert.doesNotMatch(ci,/gh release create|git push|ovsx publish/);
});

test('Open VSX remains disabled until its trusted publisher is configured',()=>{
 const dir=path.join(root,'.github/workflows');
 const combined=fs.readdirSync(dir).filter(x=>/\.ya?ml$/i.test(x))
  .map(live).join('\n');
 assert.doesNotMatch(combined,/ovsx publish|open-vsx:/);
 assert.ok(fs.existsSync(path.join(root,'.github/workflows-disabled/publish.yml')));
});

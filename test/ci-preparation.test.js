'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const template=rel=>fs.readFileSync(path.join(root,'.github/workflows-disabled',rel),'utf8');
test('CI and publishing workflows are staged outside active GitHub Actions directory',()=>{
 const live=path.join(root,'.github/workflows');
 assert.ok(!fs.existsSync(live) || fs.readdirSync(live).filter(f=>/\.ya?ml$/i.test(f)).length===0,
   'Do not activate workflows without owner approval');
 assert.ok(fs.existsSync(path.join(root,'.github/workflows-disabled/verify.yml')));
 assert.ok(fs.existsSync(path.join(root,'.github/workflows-disabled/publish.yml')));
});
test('publication template requires opt-in gate, OIDC and successful verification',()=>{
 const ci=template('publish.yml');
 assert.match(ci,/INDIZIVO_RELEASE_ENABLED == 'true'/);
 assert.match(ci,/confirm_publication/);
 assert.match(ci,/needs: \[plan, verify, vscode-e2e\]/);
 assert.match(ci,/id-token: write/);
 assert.match(ci,/--oidc/);
 assert.match(ci,/--trusted-publishing/);
 assert.match(ci,/sha256sum --check/);
 assert.doesNotMatch(ci,/VSCE_PAT|OVSX_PAT:|--pat /);
});

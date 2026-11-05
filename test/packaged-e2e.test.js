'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'vsix-e2e/run.js'),'utf8');
const suite=fs.readFileSync(path.resolve(__dirname,'vsix-e2e/suite/index.js'),'utf8');
test('VSIX E2E tests a real installed package rather than the repository source',()=>{
 assert.match(source,/--install-extension/);
 assert.match(source,/--extensions-dir/);
 assert.match(source,/indizivo-.*?\\.vsix/);
 assert.match(source,/extensionDevelopmentPath:testExtension/);
 assert.match(suite,/getExtension\\('armotusitio\\.indizivo'\\)/);
});

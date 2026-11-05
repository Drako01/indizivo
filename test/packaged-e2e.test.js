'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'vsix-e2e/run.js'),'utf8');
const suite=fs.readFileSync(path.resolve(__dirname,'vsix-e2e/suite/index.js'),'utf8');
test('VSIX E2E tests a real installed package rather than the repository source',()=>{
 assert.ok(source.includes('--install-extension'));
 assert.ok(source.includes('--extensions-dir'));
 assert.ok(source.includes("'indizivo-'+pkg.version+'.vsix'"));
 assert.ok(source.includes('extensionDevelopmentPath:testExtension'));
 assert.ok(suite.includes("getExtension('armotusitio.indizivo')"));
});

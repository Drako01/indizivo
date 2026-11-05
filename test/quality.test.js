'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
test('security hygiene gate exists and disallows dynamic shell execution',()=>{
 const code=fs.readFileSync(path.resolve(__dirname,'../scripts/quality-gate.cjs'),'utf8');
 assert.match(code,/shell:true/);
 assert.match(code,/eval\\(\\)/);
 assert.match(code,/innerHTML/);
});

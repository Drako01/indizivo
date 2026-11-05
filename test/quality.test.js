'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
test('security hygiene gate forbids dynamic source execution and HTML injection',()=>{
 const code=fs.readFileSync(path.resolve(__dirname,'../scripts/quality-gate.cjs'),'utf8');
 for(const phrase of ['shell:true','eval()','innerHTML'])
   assert.ok(code.includes(phrase),'Missing hygiene rule: '+phrase);
});

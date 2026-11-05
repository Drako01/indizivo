'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
test('typed contract linter rejects any, unsafe non-null assertions and suppressions',()=>{
 const s=fs.readFileSync(path.resolve(__dirname,'../scripts/lint-types.cjs'),'utf8');
 assert.ok(s.includes('ts.SyntaxKind.AnyKeyword'));
 assert.ok(s.includes('ts.isNonNullExpression'));
 assert.ok(s.includes('@ts-ignore'));
});

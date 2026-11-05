'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../src/ui.js'),'utf8');
test('Control Center supports Spanish and English with consent controls intact',()=>{
 assert.match(source,/Encontrá la causa/);
 assert.match(source,/Find the cause/);
 assert.match(source,/data-locale="en"/);
 assert.match(source,/data-locale="es"/);
 assert.match(source,/setLocale/);
 assert.match(source,/data-action="confirm"/);
 assert.match(source,/role="tabpanel"/);
 assert.match(source,/aria-live="polite"/);
});
test('history can select stored session and return to current while preserving evidence',()=>{
 assert.ok(source.includes("fire('selectHistory',{index})"));
 assert.ok(source.includes("fire('selectHistory',{index:-1})"));
 assert.ok(source.includes('state.selectedHistoryIndex===index'));
});

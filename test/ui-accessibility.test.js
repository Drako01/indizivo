'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../src/typed/ui.ts'),'utf8');
const catalog=fs.readFileSync(path.resolve(__dirname,'../src/typed/i18n.ts'),'utf8');
test('Control Center supports Spanish and English with consent controls intact',()=>{
 assert.match(catalog,/Encontrá la causa/);
 assert.match(catalog,/Find the cause/);
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

test('ARIA tabs have matching panels and keyboard-accessible history',()=>{
 for(const name of ['diagnostics','services','history','settings']) {
  assert.ok(source.includes('id="tab-'+name+'"'));
  assert.ok(source.includes('id="section-'+name+'"'));
  assert.ok(source.includes('aria-controls="section-'+name+'"'));
 }
 assert.ok(source.includes("event.key==='ArrowRight'"));
 assert.ok(source.includes("restore.focus({preventScroll:true})"));
});

test('diagnostic filters and provenance are accessible and localized',()=>{
 for(const key of ['data-filter="all"','data-filter="warn"','data-filter="inconclusive"',
   'role="group"','aria-pressed','findingFilter','provenance','ui.noFilteredResults'])
   assert.ok(source.includes(key),key);
 for(const key of ['ui.filterAll','ui.filterWarnings','ui.filterInconclusive',
   'origin.framework-convention','confidence.inferred','ui.limitations'])
   assert.ok(catalog.includes(key),key);
});

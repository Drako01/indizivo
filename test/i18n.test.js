'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const pkg=require('../package.json');
const en=require('../package.nls.json');
const es=require('../package.nls.es.json');

test('VS Code command and view localization declares exact matching EN/ES keys',()=>{
 const keys=Object.keys(en).sort();
 assert.deepEqual(Object.keys(es).sort(),keys);
 for(const [key,value] of Object.entries(en)){
   assert.ok(value.trim(),key+' EN missing');
   assert.ok(es[key].trim(),key+' ES missing');
 }
 const references=[
   pkg.description,...pkg.contributes.commands.flatMap(c=>[c.title,c.category]),
   pkg.contributes.viewsContainers.activitybar[0].title,
   pkg.contributes.views.indizivo[0].name
 ];
 for(const ref of references){
   assert.match(ref,/^%[^%]+%$/);
   assert.ok(Object.hasOwn(en,ref.slice(1,-1)),'Missing VS Code localization key '+ref);
 }
});

test('Runtime EN/ES dictionaries have identical keys and nonempty translations',()=>{
 const cat=require('../dist/typed/i18n');
 const enKeys=Object.keys(cat.CATALOG.en).sort();
 const esKeys=Object.keys(cat.CATALOG.es).sort();
 assert.deepEqual(esKeys,enKeys);
 assert.ok(enKeys.length>=150);
 for(const key of enKeys) {
  assert.ok(cat.CATALOG.en[key].trim(),key+' en');
  assert.ok(cat.CATALOG.es[key].trim(),key+' es');
  assert.doesNotMatch(cat.CATALOG.es[key],/<script|<iframe/ig);
 }
});

test('Interpolation localizes nested descriptors without changing variable values',()=>{
 const {t,localizeFinding}=require('../dist/typed/i18n');
 assert.equal(t('es','diag.nodeRequired',{requirement:'>=24'}),' — versión declarada: >=24');
 const input={id:'node',label:'Node.js',category:'Runtime',status:'info',detail:'v24',evidence:[],
   i18n:{category:{key:'diag.category.Runtime'},
     detail:{key:'diag.nodeDetail',values:{version:'v24',required:{key:'diag.nodeRequired',values:{requirement:'>=24'}},verdict:{key:'diag.versionNoReq'}}}}};
 const es=localizeFinding(input,'es');
 assert.match(es.detail,/versión declarada: >=24/);
 assert.match(es.detail,/No se declaró una versión requerida/);
 assert.equal(input.detail,'v24','raw diagnostic data must remain canonical');
});

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

test('Spanish port evidence and status are localized without mutating canonical observations',()=>{
 const {localizeFinding}=require('../dist/typed/i18n');
 const raw={
   id:'port-3000',category:'Ports',label:'Port 3000',status:'info',
   detail:'A TCP listener responded.',suggestion:'Inspect startup logs.',
   evidence:[{id:'port-evidence',observedAt:'2026-11-05T00:00:00Z',fact:'TCP loopback result: listening.'}],
   i18n:{
     category:{key:'diag.category.Ports'},
     label:{key:'diag.label.port',values:{port:3000}},
     detail:{key:'diag.portListening',values:{port:3000,owner:{key:'diag.portNoOwner'}}},
     suggestion:{key:'diag.portNext'},
     evidence:{key:'diag.portEvidence',values:{
       status:{key:'diag.portStateListening'},ownership:{key:'diag.portOwnerNA'}}}
   }
 };
 const translated=localizeFinding(raw,'es');
 assert.equal(translated.category,'Puertos');
 assert.ok(translated.detail.includes('127.0.0.1:3000'));
 assert.match(translated.evidence[0].fact,/en escucha/);
 assert.match(translated.suggestion,/Revisá los logs/);
 assert.equal(raw.evidence[0].fact,'TCP loopback result: listening.');
});

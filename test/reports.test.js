'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {renderReport}=require('../dist/typed/reports');
const {t}=require('../dist/typed/i18n');
const translate=locale=>key=>t(locale,key);
function fixture(){
 return {project:'demo',completedAt:'2026-11-06T12:00:00Z',state:'completed',
  host:'linux',scopeId:'workspace-scope',checks:[{
   id:'node',category:'Runtime',label:'Node.js',status:'warn',
   detail:'Authorization: Basic YWxhZGRpbjpvcGVuc2VzYW1l',
   suggestion:'Check Node version.',provenance:{
    origin:'runtime-tool',method:'execFile',host:'linux',target:'node',
    confidence:'observed',limitations:'Not a health guarantee.'},
   evidence:[{id:'e1',observedAt:'2026-11-06T12:00:00Z',fact:'Client_secret=SECRET_SENTINEL_12345'}]
  }],serviceChecks:[]};
}
test('additive JSON version contract redacts credentials without mutating findings',()=>{
 const input=fixture();
 const output=renderReport(input,'json',translate('en'),'2026-11-06T13:00:00Z');
 const report=JSON.parse(output);
 assert.equal(report.schemaVersion,undefined);
 assert.equal(report.reportFormatVersion,1);
 assert.equal(report.reportGeneratedAt,'2026-11-06T13:00:00Z');
 assert.equal(report.checks[0].provenance.origin,'runtime-tool');
 assert.doesNotMatch(output,/YWxhZGRpb|SECRET_SENTINEL_12345/);
 assert.match(input.checks[0].detail,/YWxhZGRpb/);
});
test('Spanish Markdown exports include scope, provenance, limitations and safe redaction',()=>{
 const text=renderReport(fixture(),'md',translate('es'));
 for(const phrase of ['Host de la extensión:', 'Alcance comparable', 'Origen', 'Método',
   'Confianza', 'Limitaciones', 'Evidencia'])
  assert.ok(text.includes(phrase),'Missing '+phrase);
 assert.doesNotMatch(text,/YWxhZGRpb|SECRET_SENTINEL_12345/);
 assert.match(text,/Node.js/);
});

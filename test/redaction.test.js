'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {redactSensitiveText,redactReport}=require('../dist/typed/redaction');
test('redacts common synthetic credentials without erasing environment key names',()=>{
 const input='API_KEY=fictional-secret-123\nAuthorization: Bearer abcdefghijklmnopqrstuvwxyz\n'+
  'password: "fake-secret-123"\nMissing in .env: API_KEY, TOKEN';
 const cleaned=redactSensitiveText(input);
 assert.doesNotMatch(cleaned,/fictional-secret-123|abcdefghijklmnopqrstuvwxyz|fake-secret-123/);
 assert.match(cleaned,/Missing in \.env: API_KEY, TOKEN/);
});
test('redacts private key blocks and JWT-style values',()=>{
 const input='-----BEGIN PRIVATE KEY-----\nFAKE-SENSITIVE-BYTES\n-----END PRIVATE KEY-----'+
 '\neyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
 const cleaned=redactSensitiveText(input);
 assert.doesNotMatch(cleaned,/FAKE-SENSITIVE-BYTES|eyJhbGci/);
});
test('redacts nested exports without changing canonical session evidence',()=>{
 const raw={checks:[{detail:'client_secret=synthetic123'}],project:'test',provenance:{origin:'runtime-tool'}};
 const copy=redactReport(raw);
 assert.doesNotMatch(JSON.stringify(copy),/synthetic123/);
 assert.match(raw.checks[0].detail,/synthetic123/);
 assert.equal(copy.provenance.origin,'runtime-tool');
});

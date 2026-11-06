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

test('redacts synthetic basic-auth, cookie headers, URL userinfo and token identifiers',()=>{
 const sentinels=[
  'Authorization: Basic YWxhZGRpbjpvcGVuc2VzYW1l',
  'Set-Cookie: session=COOKIE_SENTINEL; HttpOnly',
  'Cookie: auth=COOKIE_REQUEST_SENTINEL',
  'http://private-user:URL_PASSWORD_SENTINEL@localhost:7000/health',
  'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  'AKIAABCDEFGHIJKLMNOP'
 ];
 for(const value of sentinels){
  const output=redactSensitiveText(value);
  if(value.startsWith('Authorization:'))assert.doesNotMatch(output,/YWxhZGRp/);
  else if(value.startsWith('Cookie:')||value.startsWith('Set-Cookie:'))
   assert.doesNotMatch(output,/COOKIE_.*SENTINEL/);
  else if(value.startsWith('http:'))
   assert.doesNotMatch(output,/private-user|URL_PASSWORD_SENTINEL/);
  else assert.ok(output.includes('[REDACTED TOKEN]'),value);
 }
 assert.match(redactSensitiveText('http://127.0.0.1:4000/health'),
   /^http:\/\/127\.0\.0\.1:4000\/health$/);
});

'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const {validateService,verifyServices}=require('../src/diagnostics');
test('prevents remote URLs, credentials, hashes and query-string token leakage',()=>{
 for(const url of ['https://example.com/','http://example.com/',
   'http://user:password@localhost:5000/','http://localhost:5000/?token=secret',
   'http://localhost:5000/#private','http://169.254.169.254/latest/meta-data/']) {
   assert.equal(validateService({name:'unsafe',url}),null,url);
 }
});
test('HTTP redirects are observations and are never followed automatically',async()=>{
 const server=http.createServer((req,res)=>{
   res.writeHead(302,{location:'https://example.com/secret'});
   res.end();
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
   const services=[{name:'redirect',url:'http://127.0.0.1:'+server.address().port+'/health'}];
   const result=await verifyServices(services,6000);
   assert.equal(result.length,1);
   assert.equal(result[0].status,'warn');
   assert.equal(result[0].detail,'HTTP 302');
 }finally{await new Promise(resolve=>server.close(resolve));}
});

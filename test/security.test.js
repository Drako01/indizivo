'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const {compareSessions}=require('../src/comparison');
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

test('approved IPv6 endpoint is contacted on the IPv6 loopback',async(t)=>{
 const server=http.createServer((req,res)=>{res.writeHead(200);res.end('ok');});
 try{await new Promise((resolve,reject)=>{
   server.once('error',reject);server.listen(0,'::1',resolve);
 });}catch(error){
  if(['EADDRNOTAVAIL','EAFNOSUPPORT','EPROTONOSUPPORT'].includes(error.code))
    return t.skip('IPv6 loopback unavailable');
  throw error;
 }
 try{
  const url='http://[::1]:'+server.address().port+'/health';
  assert.ok(validateService({name:'IPv6',url}));
  const results=await verifyServices([{name:'IPv6',url}],1500);
  assert.equal(results[0].status,'pass');
  assert.equal(results[0].detail,'HTTP 200');
 }finally{await new Promise(resolve=>server.close(resolve));}
});
test('service finding IDs stay attached to the same URL after reordering',async()=>{
 const server=http.createServer((req,res)=>{res.writeHead(req.url==='/up'?200:503);res.end();});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const base='http://127.0.0.1:'+server.address().port;
  const targets=[{name:'up',url:base+'/up'},{name:'down',url:base+'/down'}];
  const first=await verifyServices(targets,1500);
  const second=await verifyServices([...targets].reverse(),1500);
  assert.notEqual(first[0].id,first[1].id);
  assert.equal(first[0].id,second[1].id);
  assert.equal(first[1].id,second[0].id);
  const session=(checks,date)=>({project:'demo',state:'completed',completedAt:date,checks:[],serviceChecks:checks});
  const diff=compareSessions(session(first,'before'),session(second,'after'));
  assert.equal(diff.observations.filter(c=>c.trend!=='unchanged').length,0);
 }finally{await new Promise(resolve=>server.close(resolve));}
});

'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {validateUiMessage}=require('../src/messages');
test('Webview messages are allowlisted and contain only expected fields',()=>{
 assert.deepEqual(validateUiMessage({type:'diagnose',untrusted:'ignored'}),{type:'diagnose'});
 assert.deepEqual(validateUiMessage({type:'addService',name:'API',url:'http://127.0.0.1:3000/'}),
   {type:'addService',name:'API',url:'http://127.0.0.1:3000/'});
 assert.deepEqual(validateUiMessage({type:'saveTimeout',value:500}),{type:'saveTimeout',value:500});
});
test('Webview messages reject arbitrary commands, huge data, prototypes and malformed shapes',()=>{
 for(const input of [
  null,{},[],{type:'exec',command:'rm -rf /'},
  {type:'saveTimeout',value:'1000'},
  {type:'saveTimeout',value:999999999},
  {type:'export',format:'exe'},
  {type:'copyEvidence',id:'../../secret'},
  {type:'addService',name:'a'.repeat(200),url:'http://localhost:1'},
  {type:'removeService',url:4},
  {type:'diagnose',a:1,b:2,c:3,d:4}
 ])assert.equal(validateUiMessage(input),null,String(input?.type));
});

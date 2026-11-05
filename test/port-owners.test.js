'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseOwners,inspectionArgs}=require('../src/port-owners');
test('Linux ss matches exact LISTEN port and observed PID',()=>{
 const output='State Recv-Q Send-Q Local Address:Port Peer Address:Port Process\n'+
 'LISTEN 0 511 127.0.0.1:3000 0.0.0.0:* users:(("node",pid=4732,fd=18))\n'+
 'LISTEN 0 511 127.0.0.1:30001 0.0.0.0:* users:(("other",pid=1,fd=8))';
 assert.deepEqual(parseOwners('linux',output,3000),[{pid:4732,name:'node',observed:true}]);
});
test('Windows netstat matches listening TCP only',()=>{
 const output='TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    5020\n'+
  'TCP    127.0.0.1:3000    127.0.0.1:4000    ESTABLISHED    9999';
 assert.deepEqual(parseOwners('win32',output,3000),[{pid:5020,name:'process',observed:true}]);
});
test('macOS lsof extracts process and PID',()=>{
 const output='COMMAND   PID USER FD TYPE DEVICE SIZE/OFF NODE NAME\n'+
   'node    3821 dev 20u IPv4 8123 0t0 TCP 127.0.0.1:5000 (LISTEN)';
 assert.deepEqual(parseOwners('darwin',output,5000),[{pid:3821,name:'node',observed:true}]);
});
test('does not make up owners from missing permission/port',()=>{
 assert.deepEqual(parseOwners('linux','LISTEN 0 511 127.0.0.1:3000 0.0.0.0:*',3000),[]);
 assert.deepEqual(parseOwners('win32','TCP 0.0.0.0:3000 0.0.0.0:0 LISTENING 5020',3001),[]);
 assert.equal(inspectionArgs('unknown',3000),null);
});

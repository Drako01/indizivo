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

test('batch inspection uses one bounded OS-specific command per run',()=>{
 const {inspectionBatchArgs}=require('../src/port-owners');
 assert.deepEqual(inspectionBatchArgs('win32'),{command:'netstat',args:['-ano']});
 assert.deepEqual(inspectionBatchArgs('linux'),{command:'ss',args:['-ltnp']});
 assert.deepEqual(inspectionBatchArgs('darwin'),{command:'lsof',args:['-nP','-iTCP','-sTCP:LISTEN']});
 assert.equal(inspectionBatchArgs('unknown'),null);
});
test('macOS process-owner evidence must match the exact requested port',()=>{
 const line='node 3821 dev 20u IPv4 8123 0t0 TCP 127.0.0.1:30001 (LISTEN)';
 assert.deepEqual(parseOwners('darwin',line,3000),[]);
 assert.equal(parseOwners('darwin',line,30001)[0].pid,3821);
});

test('real listening socket: owner is this PID when observed, never invented otherwise',async()=>{
 const net=require('node:net');
 const {inspectOwners}=require('../dist/typed/port-owners');
 const server=net.createServer();
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const port=server.address().port;
 try{
  const result=(await inspectOwners([port,port===65535?65534:port+1],4000)).get(port);
  assert.ok(['observed','inconclusive'].includes(result.status),result.status);
  if(result.status==='observed')
   assert.ok(result.owners.some(owner=>owner.pid===process.pid),
    'the observed owner of our own listener must be this process');
  else assert.deepEqual(result.owners,[]);
 }finally{await new Promise(resolve=>server.close(resolve));}
});

test('IPv6 loopback listeners are attributed on every supported platform',()=>{
 assert.equal(parseOwners('win32','  TCP    [::1]:3000    [::]:0    LISTENING    4242',3000)[0].pid,4242);
 assert.equal(parseOwners('linux','LISTEN 0 511 [::1]:3000 [::]:* users:((\"node\",pid=77,fd=19))',3000)[0].pid,77);
 assert.equal(parseOwners('darwin','node 55 dev 20u IPv6 8123 0t0 TCP [::1]:3000 (LISTEN)',3000)[0].pid,55);
 assert.deepEqual(parseOwners('win32','  UDP    0.0.0.0:3000    *:*    4242',3000),[]);
});

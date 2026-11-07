'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {toolArguments,parseToolVersion,probeTool,toolEnvironment}=require('../dist/typed/tool-probes');
test('allowlisted tools have fixed, non-shell version arguments',()=>{
 assert.deepEqual([...toolArguments('node')],['--version']);
 assert.deepEqual([...toolArguments('java')],['-version']);
 assert.deepEqual([...toolArguments('docker')],['--version']);
});
test('version parsing never returns arbitrary tool output',()=>{
 const examples=[
  ['node','v24.22.1','v24.22.1'],
  ['go','go version go1.24.4 linux/amd64','go version go1.24.4'],
  ['python3','Python 3.13.2','Python 3.13.2'],
  ['py','Python 3.12.4','Python 3.12.4'],
  ['php','PHP 8.3.15 (cli) (built: ...)','PHP 8.3.15'],
  ['java','openjdk version "21.0.3" 2025-04-16','Java 21.0.3'],
  ['java','openjdk 23.0.2 2025-01-21','Java 23.0.2'],
  ['docker','Docker version 28.2.2, build abc','Docker 28.2.2']
 ];
 for(const [tool,raw,expected] of examples)
   assert.equal(parseToolVersion(tool,raw),expected,tool);
 for(const tool of ['node','go','python3','php','java','docker'])
   assert.equal(parseToolVersion(tool,'TOKEN=private-secret\n'+('x'.repeat(100))),null,tool);
});
test('Node version probe executes a fixed read-only command on the extension host',async()=>{
 const result=await probeTool('node',1500);
 assert.equal(result.ok,true);
 assert.match(result.value,/^v\d+\.\d+\.\d+$/);
});
test('aborted probes do not return success',async()=>{
 const c=new AbortController();c.abort();
 const result=await probeTool('node',1500,c.signal);
 assert.equal(result.ok,false);
 assert.equal(result.value,'Cancelled');
});

test('Go version-only observation disables automatic toolchain downloads without mutating caller environment',()=>{
 const source={GOTOOLCHAIN:'auto',UNRELATED:'retained'};
 const go=toolEnvironment('go',source);
 assert.equal(go.GOTOOLCHAIN,'local');
 assert.equal(go.UNRELATED,'retained');
 assert.equal(source.GOTOOLCHAIN,'auto');
 assert.equal(toolEnvironment('node',source),source,
   'Other runtime probes preserve their environment unchanged');
});

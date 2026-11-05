'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {invocation}=require('../scripts/safe-vscode-cli.cjs');

test('Windows VS Code CMD invocation never needs shell:true with unescaped argument array',()=>{
 const command=invocation('C:\\Program Files\\Microsoft VS Code\\bin\\code.cmd',
   ['--install-extension','F:\\indizivo\\indizivo-0.1.0.vsix','--force'],'win32','C:\\Windows\\System32\\cmd.exe');
 assert.equal(command.file,'C:\\Windows\\System32\\cmd.exe');
 assert.deepEqual(command.args.slice(0,3),['/d','/s','/c']);
 assert.equal(command.args[3],
   '""C:\\Program Files\\Microsoft VS Code\\bin\\code.cmd" "--install-extension" "F:\\indizivo\\indizivo-0.1.0.vsix" "--force""');
});
test('CLI arguments containing CMD metacharacters fail closed',()=>{
 for(const arg of ['abc&whoami','foo|bar','foo%PATH%','foo!VAR!', 'foo"bar','foo^bar','foo>log','abc\nfail','']) {
  assert.throws(()=>invocation('code.cmd',[arg],'win32','cmd.exe'),/Unsafe Windows/);
 }
});
test('non-Windows CLI invocations preserve argument arrays without shell',()=>{
 const args=['--list-extensions','/tmp/some profile'];
 const result=invocation('/usr/bin/code',args,'linux');
 assert.equal(result.file,'/usr/bin/code');
 assert.deepEqual(result.args,args);
});

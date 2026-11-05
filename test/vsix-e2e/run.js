'use strict';
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {downloadAndUnzipVSCode,resolveCliArgsFromVSCodeExecutablePath,runTests}=require('@vscode/test-electron');
const {inspect}=require('../../scripts/inspect-vsix.cjs');

function runCli(executable,args) {
 const result=spawnSync(executable,args,{encoding:'utf8',stdio:'pipe',timeout:120000,
  windowsHide:true,shell:process.platform==='win32'&&executable.toLowerCase().endsWith('.cmd')});
 if(result.error)throw result.error;
 if(result.status!==0)throw new Error('VS Code CLI failed: '+String(result.stderr||result.stdout).slice(0,2000));
 return String(result.stdout||'');
}
async function main() {
 const root=path.resolve(__dirname,'../..');
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
 const vsix=path.join(root,'indizivo-'+pkg.version+'.vsix');
 const report=inspect(vsix);
 console.log('Testing packaged VSIX (sha256: '+report.sha256+')');
 const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'indizivo-vsix-e2e-'));
 const user=path.join(scratch,'user');
 const ext=path.join(scratch,'extensions');
 const fixture=path.join(scratch,'fixture');
 const testExtension=path.join(scratch,'test-harness');
 fs.mkdirSync(fixture,{recursive:true});
 fs.mkdirSync(testExtension,{recursive:true});
 fs.writeFileSync(path.join(fixture,'package.json'),JSON.stringify({
  name:'indizivo-packaged-e2e-fixture',engines:{node:'>=20'},scripts:{dev:'next dev --port 32998'}
 }));
 fs.writeFileSync(path.join(fixture,'.env.example'),'API_KEY=synthetic-test-value\n');
 fs.writeFileSync(path.join(testExtension,'package.json'),JSON.stringify({
  name:'indizivo-packaged-test-host',displayName:'Indizivo Packaged Test Host',version:'0.0.1',
  publisher:'indizivo-tests',engines:{vscode:'^1.99.0'},main:'./index.js'
 }));
 fs.writeFileSync(path.join(testExtension,'index.js'),
  "'use strict';exports.activate=function(){};exports.deactivate=function(){};");
 try {
  const vscodeExecutablePath=process.env.INDIZIVO_VSCODE_EXECUTABLE_PATH ||
    await downloadAndUnzipVSCode(process.env.INDIZIVO_VSCODE_TEST_VERSION||'stable');
  const [cli,...cliArgs]=resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath,{reuseMachineInstall:true});
  const profile=['--user-data-dir',user,'--extensions-dir',ext];
  const install=runCli(cli,[...cliArgs,...profile,'--install-extension',vsix,'--force']);
  if(!/successfully installed/i.test(install))
    throw new Error('VS Code CLI did not confirm the VSIX installation');
  const list=runCli(cli,[...cliArgs,...profile,'--list-extensions']);
  if(!list.split(/\r?\n/).some(s=>s.trim()==='armotusitio.indizivo'))
    throw new Error('Indizivo is not visible in the isolated extension profile');
  await runTests({
    vscodeExecutablePath,
    extensionDevelopmentPath:testExtension,
    extensionTestsPath:path.resolve(__dirname,'suite/index.js'),
    reuseMachineInstall:true,
    launchArgs:[fixture,...profile,'--skip-welcome','--skip-release-notes'],
    extensionTestsEnv:{INDIZIVO_PACKAGED_TEST:'true',INDIZIVO_TEST_EXPECTED_VERSION:pkg.version}
  });
  console.log('Indizivo packaged VSIX smoke: PASS');
 }finally{
  fs.rmSync(scratch,{recursive:true,force:true,maxRetries:4,retryDelay:100});
 }
}
main().catch(e=>{console.error('Indizivo packaged VSIX smoke: FAIL',e);process.exitCode=1;});

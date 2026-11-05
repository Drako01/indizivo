'use strict';
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {runTests}=require('@vscode/test-electron');

async function main() {
  const extensionDevelopmentPath=path.resolve(__dirname,'../..');
  const extensionTestsPath=path.resolve(__dirname,'suite/index.js');
  const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'indizivo-e2e-'));
  try {
    fs.writeFileSync(path.join(fixture,'package.json'),JSON.stringify({
      name:'indizivo-e2e-fixture',private:true,
      engines:{node:'>=20'},
      scripts:{dev:'next dev --port 32999'}
    }));
    fs.writeFileSync(path.join(fixture,'.env.example'),'FAKE_KEY=example\nPORT=32999\n');
    fs.writeFileSync(path.join(fixture,'.env'),'PORT=32999\n');
    const options={
      extensionDevelopmentPath,extensionTestsPath,
      launchArgs:[fixture,'--disable-extensions','--skip-welcome','--skip-release-notes']
    };
    if(process.env.INDIZIVO_VSCODE_EXECUTABLE_PATH)
      options.vscodeExecutablePath=process.env.INDIZIVO_VSCODE_EXECUTABLE_PATH;
    await runTests(options);
  } finally {fs.rmSync(fixture,{recursive:true,force:true});}
}
main().catch(error=>{console.error('Indizivo Extension Host E2E failed:',error);process.exitCode=1;});

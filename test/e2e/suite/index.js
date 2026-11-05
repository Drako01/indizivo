'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const http=require('node:http');
const vscode=require('vscode');

exports.run=async function run(){
  const extension=vscode.extensions.getExtension('armotusitio.indizivo');
  assert.ok(extension,'Indizivo must be discovered by the official extension host');
  const api=await extension.activate();
  assert.ok(api?.controller,'The extension must expose a controller to the test host');
  const controller=api.controller;
  assert.ok(vscode.workspace.workspaceFolders?.length===1,'The test fixture must open as a workspace');
  await vscode.commands.executeCommand('indizivo.openHome');
  assert.ok(controller.panel,'Control Center must open');
  await controller.runDiagnosis();
  const session=controller.data.session;
  assert.equal(session.state,'completed');
  assert.ok(session.checks.some(x=>x.id==='node'),'Node runtime check must be present');
  assert.ok(session.checks.some(x=>x.id==='port-32999'),'Declared port must be inspected');
  assert.ok(session.checks.some(x=>x.id==='env'),'Missing environment key must be reported');
  assert.ok(!JSON.stringify(session).includes('FAKE_KEY=example'),'Environment values must not be persisted');
  assert.ok(controller.data.history.length>0,'Diagnosis history must be saved');

  await assert.rejects(()=>controller.addService({name:'unsafe',url:'http://example.org/'}),
    /loopback HTTP/);
  await assert.rejects(()=>controller.addService({name:'credentials',url:'http://user:pass@localhost:5000/'}),
    /loopback HTTP/);
  const server=http.createServer((request,response)=>{
    response.writeHead(200,{'content-type':'text/plain'});response.end('ok');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const url='http://127.0.0.1:'+server.address().port+'/health';
    await controller.addService({name:'Test API',url});
    assert.equal(controller.data.session.serviceChecks.length,0,'Adding endpoint must not trigger a request');
    await controller.prepareServices();
    assert.equal(controller.pendingApproval.length,1,'Plan must require approval');
    await controller.confirmServices();
    assert.equal(controller.data.session.serviceChecks[0].status,'pass');
    assert.match(controller.data.session.serviceChecks[0].detail,/HTTP 200/);
  } finally {await new Promise(resolve=>server.close(resolve));}

  await controller.saveTimeout(700);
  assert.equal(controller.data.timeoutMs,700);
  await controller.runDiagnosis();
  assert.equal(controller.data.session.state,'completed');
  controller.cancel();
  assert.equal(controller.running,false);
  assert.ok(controller.data.history.length>=2);
  assert.ok((await fs.stat(vscode.workspace.workspaceFolders[0].uri.fsPath)).isDirectory());
  controller.panel?.dispose();
  console.log('Indizivo real Extension Host E2E completed successfully');
};

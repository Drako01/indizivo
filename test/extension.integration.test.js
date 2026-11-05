'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const http=require('node:http');
const Module=require('node:module');
function fixture(root,trusted=true) {
  const uri={scheme:'file',fsPath:root,toString:()=>root};
  const folder={name:path.basename(root),uri};
  const state=new Map();
  const commands=new Map();
  let clipboardText='';
  const vscode={
    env:{clipboard:{writeText:async value=>{clipboardText=value;}}},
    Uri:{joinPath:(base,...parts)=>({scheme:'file',fsPath:path.join(base.fsPath||root,...parts),toString:()=>path.join(base.fsPath||root,...parts)})},
    ViewColumn:{One:1},
    workspace:{
      workspaceFolders:[folder],isTrusted:trusted,
      getWorkspaceFolder:()=>folder,
      onDidChangeWorkspaceFolders:()=>({dispose(){}}),
      onDidGrantWorkspaceTrust:()=>({dispose(){}})
    },
    window:{
      registerWebviewViewProvider:()=>({dispose(){}}),
      showSaveDialog:async()=>null,
      showWarningMessage:async()=>undefined,
      showInformationMessage:()=>undefined,
      showErrorMessage:()=>undefined,
      createWebviewPanel:()=>({webview:{asWebviewUri:x=>x.fsPath,postMessage:()=>{},onDidReceiveMessage:()=>({dispose(){}})},reveal(){},onDidDispose:()=>({dispose(){}})})
    },
    commands:{registerCommand:(name,fn)=>{commands.set(name,fn);return{dispose(){}};}}
  };
  const context={extensionUri:uri,subscriptions:[],workspaceState:{
    get:(key,def)=>state.get(key)||def,
    update:async(key,value)=>{state.set(key,value);}
  }};
  return {vscode,context,commands,state,getClipboard:()=>clipboardText};
}
function loadExtension(vscode) {
  const orig=Module._load;
  Module._load=function(name,parent,isMain) {
    if(name==='vscode')return vscode;
    return orig.call(this,name,parent,isMain);
  };
  try {
    delete require.cache[require.resolve('../src/extension')];
    delete require.cache[require.resolve('../dist/typed/extension')];
    return require('../src/extension');
  } finally {
    Module._load=orig;
  }
}
test('extension activates with commands and runs a real Node probe in a trusted local workspace',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-int-'));
 try {
  await fs.writeFile(path.join(root,'package.json'),JSON.stringify({scripts:{dev:'next dev --port 3103'},engines:{node:'>=20'}}));
  const app=fixture(root,true);
  const {controller}=loadExtension(app.vscode).activate(app.context);
  assert.ok(app.commands.has('indizivo.diagnose'));
  await controller.runDiagnosis();
  assert.equal(controller.data.session.state,'completed');
  assert.ok(controller.data.session.checks.some(x=>x.id==='node'));
  assert.ok(controller.data.session.checks.some(x=>x.id==='port-3103'));
  assert.equal(controller.data.history.length,1);
  assert.ok([...app.state.keys()].some(k=>k.startsWith('indizivo:v1:')));
 } finally{await fs.rm(root,{recursive:true,force:true});}
});
test('untrusted workspaces cannot run active diagnostics',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-int-'));
 try {
  const app=fixture(root,false);
  const {controller}=loadExtension(app.vscode).activate(app.context);
  await assert.rejects(()=>controller.runDiagnosis(),/Trust/);
  assert.equal(controller.data.session,null);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('active service probe only executes after explicit plan approval',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-int-'));
 const server=http.createServer((req,res)=>{res.writeHead(200);res.end('ok');});
 try {
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const app=fixture(root,true);
  const {controller}=loadExtension(app.vscode).activate(app.context);
  await controller.runDiagnosis();
  const url='http://127.0.0.1:'+server.address().port+'/health';
  await controller.addService({name:'health',url});
  assert.equal(controller.data.session.serviceChecks.length,0);
  await controller.prepareServices();
  assert.equal(controller.pendingApproval.length,1);
  await controller.confirmServices();
  assert.equal(controller.data.session.serviceChecks.length,1);
  assert.equal(controller.data.session.serviceChecks[0].status,'pass');
 } finally {
  await new Promise(resolve=>server.close(resolve));
  await fs.rm(root,{recursive:true,force:true});
 }
});

test('UI evidence copy is scoped to a current finding; stale workspace is rejected',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-int-'));
 try {
  await fs.writeFile(path.join(root,'package.json'),JSON.stringify({scripts:{dev:'next dev --port 3105'}}));
  const app=fixture(root,true);
  const {controller}=loadExtension(app.vscode).activate(app.context);
  await controller.runDiagnosis();
  await controller.copyEvidence('port-3105');
  assert.match(app.getClipboard(),/Indizivo diagnostic evidence/);
  assert.match(app.getClipboard(),/Port 3105/);
  await assert.rejects(()=>controller.copyEvidence('../package.json'),/Invalid finding/);
  app.vscode.workspace.workspaceFolders=[];
  await assert.rejects(()=>controller.runDiagnosis(),/no longer open/);
 } finally {await fs.rm(root,{recursive:true,force:true});}
});
test('project/service configuration is immutable while probes are running',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-int-'));
 try {
  const app=fixture(root,true);
  const {controller}=loadExtension(app.vscode).activate(app.context);
  controller.running=true;
  await assert.rejects(()=>controller.addService({name:'local',url:'http://127.0.0.1:5000/'}),/Wait/);
  await assert.rejects(()=>controller.saveTimeout(600),/Wait/);
  await assert.rejects(()=>controller.selectProject(),/Cancel/);
  controller.running=false;
 }finally{await fs.rm(root,{recursive:true,force:true});}
});

test('closing editor webview does not access an already disposed panel and allows reopening',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-int-'));
 try{
   const app=fixture(root,true);
   let closed=false;
   let onDispose=()=>{};
   app.vscode.window.createWebviewPanel=()=>{
     const webview={
       cspSource:'vscode-resource:',
       asWebviewUri:uri=>uri.fsPath,
       onDidReceiveMessage:()=>({dispose(){}}),
       postMessage:()=>Promise.resolve(true)
     };
     return {
       get webview(){
         if(closed)throw new Error('Webview is disposed');
         return webview;
       },
       reveal(){},
       onDidDispose(handler){onDispose=handler;return {dispose(){}};},
       dispose(){closed=true;onDispose();}
     };
   };
   const {controller}=loadExtension(app.vscode).activate(app.context);
   await controller.openHome();
   assert.equal(controller.views.size,1);
   controller.panel.dispose();
   assert.equal(controller.panel,null);
   assert.equal(controller.views.size,0);
   closed=false;
   await controller.openHome();
   assert.equal(controller.views.size,1);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('disposing sidebar webview does not read its invalidated getter',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-int-'));
 try{
   const app=fixture(root,true);
   let resolveView;
   app.vscode.window.registerWebviewViewProvider=(name,provider)=>{
     resolveView=provider.resolveWebviewView;
     return {dispose(){}};
   };
   const {controller}=loadExtension(app.vscode).activate(app.context);
   let closed=false,handler;
   const webview={
     cspSource:'vscode-resource:',
     asWebviewUri:uri=>uri.fsPath,
     onDidReceiveMessage:()=>({dispose(){}}),
     postMessage:()=>Promise.resolve(true)
   };
   const view={
     get webview(){
       if(closed)throw new Error('Webview is disposed');
       return webview;
     },
     onDidDispose(fn){handler=fn;return {dispose(){}};}
   };
   resolveView(view);
   assert.equal(controller.views.size,1);
   closed=true;
   assert.doesNotThrow(()=>handler());
   assert.equal(controller.views.size,0);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});

test('Webview controller refuses untrusted or oversized command payloads',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-int-'));
 try {
  const app=fixture(root,true);
  const {controller}=loadExtension(app.vscode).activate(app.context);
  await assert.rejects(()=>controller.message({type:'exec',command:'rm -rf /'}),/Invalid Indizivo UI/);
  await assert.rejects(()=>controller.message({type:'saveTimeout',value:'99999999'}),/Invalid Indizivo UI/);
  await assert.rejects(()=>controller.message({type:'addService',name:'API',url:'a'.repeat(2000)}),/Invalid Indizivo UI/);
  assert.equal(controller.data.services.length,0);
 } finally {await fs.rm(root,{recursive:true,force:true});}
});

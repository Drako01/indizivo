'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const Module=require('node:module');
function host(root) {
 const uri={scheme:'file',fsPath:root,toString:()=>root};
 const folder={uri,name:path.basename(root)};
 const state=new Map();
 const vscode={
  Uri:{joinPath:(base,...names)=>({fsPath:path.join(base.fsPath,...names)})},
  ViewColumn:{One:1},
  env:{language:'es-AR',clipboard:{writeText:async()=>{}}},
  workspace:{workspaceFolders:[folder],isTrusted:true,getWorkspaceFolder:()=>folder,
   onDidChangeWorkspaceFolders:()=>({dispose(){}}),
   onDidGrantWorkspaceTrust:()=>({dispose(){}})},
  commands:{registerCommand:()=>({dispose(){}})},
  window:{registerWebviewViewProvider:()=>({dispose(){}}),
   showWarningMessage:async()=>undefined,showInformationMessage:()=>{},
   showSaveDialog:async()=>null,showErrorMessage:()=>{}}
 };
 const ctx={extensionUri:uri,subscriptions:[],workspaceState:{
  get:(key,def)=>state.get(key)??def,
  update:async(key,value)=>state.set(key,value)
 }};
 return {vscode,ctx,state};
}
function load(vscode) {
 const original=Module._load;
 Module._load=function(request,parent,isMain){
  if(request==='vscode')return vscode;
  return original.call(this,request,parent,isMain);
 };
 try{delete require.cache[require.resolve('../src/extension')];
   delete require.cache[require.resolve('../dist/typed/extension')];return require('../src/extension');}
 finally{Module._load=original;}
}
test('history persists a complete navigable snapshot and exports the selected session state',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-history-'));
 try{
  await fs.writeFile(path.join(root,'package.json'),'{"name":"fixture"}');
  const {vscode,ctx}=host(root);
  const controller=load(vscode).activate(ctx).controller;
  await controller.runDiagnosis();
  assert.equal(controller.data.locale,'es');
  assert.equal(controller.data.history[0].snapshot.state,'completed');
  const current=controller.data.session;
  controller.data.session={project:'other',state:'failed',checks:[]};
  await controller.selectHistory(0);
  assert.equal(controller.snapshot().reviewMode,true);
  assert.equal(controller.viewedSession().id,current.id);
  await controller.copyEvidence('node');
  await controller.selectHistory(-1);
  assert.equal(controller.viewedSession().project,'other');
  await controller.setLocale('en');
  assert.equal(controller.snapshot().locale,'en');
  assert.equal(controller.data.locale,'en');
 }finally{await fs.rm(root,{recursive:true,force:true});}
});

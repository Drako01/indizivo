'use strict';
const vscode = require('vscode');
const fs = require('node:fs/promises');
const crypto = require('node:crypto');
const { diagnose, verifyServices, validateService } = require('./diagnostics');
const { html } = require('./ui');

class ControlCenter {
  constructor(context) {
    this.context = context;
    this.views = new Set();
    this.panel = null;
    this.currentRoot = vscode.workspace.workspaceFolders?.length === 1 ?
      vscode.workspace.workspaceFolders[0].uri : null;
    this.data = { session: null, services: [], history: [], timeoutMs: 2500 };
    this.pendingApproval = null;
    this.error = '';
    this.running = false;
    this.abort = null;
    this.restore();
  }
  scopeKey() {
    return 'indizivo:v1:' + crypto.createHash('sha256').update(this.currentRoot?.toString() || 'none').digest('hex');
  }
  restore() {
    const stored = this.context.workspaceState.get(this.scopeKey(), {});
    this.data = {
      session: stored.session || null,
      services: (stored.services || []).map(validateService).filter(Boolean).slice(0, 20),
      history: (stored.history || []).slice(0, 10),
      timeoutMs: Math.min(10000, Math.max(400, Number(stored.timeoutMs) || 2500))
    };
  }
  async save() {
    await this.context.workspaceState.update(this.scopeKey(), this.data);
  }
  snapshot() {
    return {
      project: this.currentRoot ? vscode.workspace.getWorkspaceFolder(this.currentRoot)?.name : '',
      host: process.platform + ' · extension host',
      trusted: vscode.workspace.isTrusted,
      session: this.data.session,
      services: this.data.services,
      history: this.data.history,
      timeoutMs: this.data.timeoutMs,
      running: this.running,
      pendingApproval: this.pendingApproval,
      error: this.error
    };
  }
  broadcast() {
    const message = { type:'state', state:this.snapshot() };
    for (const view of [...this.views]) {
      try { view.postMessage(message); } catch { this.views.delete(view); }
    }
  }
  attach(webview) {
    webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')]
    };
    webview.html = html(webview, this.context.extensionUri, vscode);
    this.views.add(webview);
    const subscription = webview.onDidReceiveMessage(async m => {
      try { await this.message(m); } catch (e) {
        this.error = e?.message || 'Unexpected error.';
        this.broadcast();
      }
    });
    this.context.subscriptions.push(subscription);
    this.broadcast();
  }
  async openHome() {
    if (this.panel) { this.panel.reveal(); return; }
    const panel = vscode.window.createWebviewPanel('indizivo.home','Indizivo · Control Center',
      vscode.ViewColumn.One,{ enableScripts:true, retainContextWhenHidden:true,
        localResourceRoots:[vscode.Uri.joinPath(this.context.extensionUri,'media')] });
    this.panel=panel;
    this.attach(panel.webview);
    panel.onDidDispose(()=>{
      this.views.delete(panel.webview);
      if (this.panel===panel) this.panel=null;
    }, null, this.context.subscriptions);
  }
  async selectProject() {
    if (this.running) throw new Error('Cancel the active diagnosis before switching projects.');
    const folders = vscode.workspace.workspaceFolders || [];
    if (!folders.length) { this.error='Open a project folder first.'; this.broadcast(); return; }
    const selected = folders.length===1 ? folders[0] : await vscode.window.showQuickPick(
      folders.map(folder=>({label:folder.name,description:folder.uri.fsPath,folder})),
      {placeHolder:'Choose the project to diagnose'});
    if (!selected) return;
    this.currentRoot = selected.folder ? selected.folder.uri : selected.uri;
    this.pendingApproval=null;
    this.error='';
    this.restore();
    this.broadcast();
  }
  ensureReady() {
    if (!vscode.workspace.isTrusted) throw new Error('Trust the workspace before running diagnostics.');
    if (!this.currentRoot) throw new Error('Choose a project first.');
    if (this.currentRoot.scheme !== 'file') throw new Error('This version supports local filesystem workspaces only.');
    if (this.running) throw new Error('A diagnosis is already running.');
  }
  cancel() {
    if (this.abort) this.abort.abort();
    this.pendingApproval=null;
  }
  async runDiagnosis() {
    this.ensureReady();
    this.error='';
    this.data.session=null;
    this.running=true;
    this.pendingApproval=null;
    this.abort=new AbortController();
    const signal=this.abort.signal;
    this.broadcast();
    try {
      const session=await diagnose(this.currentRoot.fsPath,this.data.timeoutMs,signal,checks=>{
        this.data.session = {
          project: vscode.workspace.getWorkspaceFolder(this.currentRoot)?.name || 'Project',
          startedAt:new Date().toISOString(), completedAt:'In progress',
          state:'running', checks, serviceChecks:[]
        };
        this.broadcast();
      });
      if (signal.aborted) throw new Error('Diagnosis cancelled');
      this.data.session=session;
      this.data.history.unshift({ project:session.project, completedAt:session.completedAt,
        checks:session.checks.map(x=>({id:x.id,status:x.status})) });
      this.data.history=this.data.history.slice(0,10);
      await this.save();
    } catch(e) {
      this.error = signal.aborted ? 'Diagnosis cancelled; partial observations may be visible.' :
        'Diagnosis failed: ' + (e?.message || 'unknown error');
      if (this.data.session) this.data.session.state=signal.aborted?'cancelled':'failed';
    } finally {
      this.running=false;
      this.abort=null;
      this.broadcast();
    }
  }
  async prepareServices() {
    this.ensureReady();
    if (!this.data.session) throw new Error('Run a diagnosis before checking services.');
    if (!this.data.services.length) throw new Error('Add a loopback endpoint in Services first.');
    this.pendingApproval=this.data.services.map(s=>({...s}));
    this.error='';
    this.broadcast();
  }
  async confirmServices() {
    this.ensureReady();
    if (!this.pendingApproval || !this.data.session) throw new Error('Approval plan expired; review again.');
    const plan=this.pendingApproval.map(validateService).filter(Boolean);
    if (JSON.stringify(plan)!==JSON.stringify(this.data.services)) throw new Error('Service targets changed; review again.');
    this.pendingApproval=null;
    this.running=true;
    this.abort=new AbortController();
    const signal=this.abort.signal;
    this.broadcast();
    try {
      const result=await verifyServices(plan,this.data.timeoutMs,signal,partial=>{
        this.data.session.serviceChecks=partial;
        this.broadcast();
      });
      if (signal.aborted) throw new Error('Cancelled');
      this.data.session.serviceChecks=result;
      this.data.session.completedAt=new Date().toISOString();
      await this.save();
    } catch(e) {
      this.error=signal.aborted?'Service check cancelled.':'Service check failed: '+(e?.message||'Unknown');
    } finally {
      this.running=false;
      this.abort=null;
      this.broadcast();
    }
  }
  async addService(message) {
    if (this.running) throw new Error('Wait for the active check to finish before editing services.');
    const service=validateService(message);
    if (!service) throw new Error('Use a name and a loopback HTTP URL such as http://127.0.0.1:5000/health.');
    if (this.data.services.length >= 20) throw new Error('Maximum 20 services per project.');
    if (!this.data.services.some(item=>item.url===service.url)) this.data.services.push(service);
    this.pendingApproval=null;
    await this.save();
    this.broadcast();
  }
  async removeService(url) {
    if (this.running) throw new Error('Wait for the active check to finish before editing services.');
    if (typeof url!=='string') return;
    this.data.services=this.data.services.filter(x=>x.url!==url);
    this.pendingApproval=null;
    await this.save();
    this.broadcast();
  }
  async saveTimeout(value) {
    if (this.running) throw new Error('Wait for the active check to finish before editing timeout.');
    if (!Number.isInteger(value) || value<400 || value>10000) throw new Error('Timeout must be between 400 and 10000 ms.');
    this.data.timeoutMs=value;
    this.pendingApproval=null;
    await this.save();
    this.broadcast();
  }
  async clearHistory() {
    if (this.running) throw new Error('Cancel the active diagnosis before deleting history.');
    const result=await vscode.window.showWarningMessage('Permanently delete local Indizivo history for this project?',
      {modal:true},'Delete');
    if (result!=='Delete') return;
    this.data.history=[];
    this.data.session=null;
    await this.save();
    this.broadcast();
  }
  async export(format) {
    if (this.running) throw new Error('Wait for the active diagnosis to finish before exporting.');
    if (!this.data.session || !['json','md'].includes(format)) return;
    const session=this.data.session;
    const name='indizivo-report.'+format;
    const uri=await vscode.window.showSaveDialog({
      defaultUri:vscode.Uri.joinPath(this.currentRoot || this.context.extensionUri,name),
      filters: format==='md'?{'Markdown':['md']}:{'JSON':['json']}
    });
    if (!uri) return;
    let output='';
    if (format==='json') output=JSON.stringify(session,null,2)+'\n';
    else {
      const lines=['# Indizivo diagnosis','', 'Project: '+session.project,
        'Date: '+session.completedAt,'State: '+session.state,
        '', '> Only executed checks are reported. Observations do not prove total project health.',''];
      for (const c of [...(session.checks||[]),...(session.serviceChecks||[])]) {
        lines.push('## '+c.label,'','**'+c.status.toUpperCase()+'** — '+c.detail,
          '',c.suggestion||'','');
        for (const e of c.evidence||[]) lines.push('- Evidence: '+e.fact+' ('+e.observedAt+')');
        lines.push('');
      }
      output=lines.join('\n');
    }
    await fs.writeFile(uri.fsPath,output,'utf8');
    vscode.window.showInformationMessage('Indizivo report exported.');
  }
  async message(m) {
    if (!m || typeof m.type!=='string') return;
    switch(m.type) {
      case 'ready': this.broadcast(); break;
      case 'selectProject': await this.selectProject(); break;
      case 'openHome': await this.openHome(); break;
      case 'diagnose': await this.runDiagnosis(); break;
      case 'cancel': this.cancel(); this.broadcast(); break;
      case 'prepareServices': await this.prepareServices(); break;
      case 'confirmServices': await this.confirmServices(); break;
      case 'declineServices': this.pendingApproval=null; this.broadcast(); break;
      case 'addService': await this.addService(m); break;
      case 'removeService': await this.removeService(m.url); break;
      case 'saveTimeout': await this.saveTimeout(m.value); break;
      case 'clearHistory': await this.clearHistory(); break;
      case 'export': await this.export(m.format); break;
      default: break;
    }
  }
}
function activate(context) {
  const controller=new ControlCenter(context);
  context.subscriptions.push(vscode.window.registerWebviewViewProvider('indizivo.control',{
    resolveWebviewView(view) { controller.attach(view.webview);
      view.onDidDispose(()=>controller.views.delete(view.webview),null,context.subscriptions); }
  }));
  const commands = {
    'indizivo.openHome':()=>controller.openHome(),
    'indizivo.diagnose':()=>controller.runDiagnosis(),
    'indizivo.cancel':()=>controller.cancel(),
    'indizivo.export':()=>controller.export('md'),
    'indizivo.settings':()=>controller.openHome()
  };
  for (const [name,handler] of Object.entries(commands)) {
    context.subscriptions.push(vscode.commands.registerCommand(name, async()=>{
      try {await handler();} catch(e){vscode.window.showErrorMessage('Indizivo: '+(e?.message||'Unexpected error')); }
    }));
  }
  context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(()=>controller.broadcast()));
  if (vscode.workspace.onDidGrantWorkspaceTrust)
    context.subscriptions.push(vscode.workspace.onDidGrantWorkspaceTrust(()=>controller.broadcast()));
  return { controller };
}
function deactivate() {}
module.exports = { activate, deactivate };

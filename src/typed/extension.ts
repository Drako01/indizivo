import * as vscode from 'vscode';
import * as crypto from 'node:crypto';
import * as path from 'node:path';
import {discoverProjectRoots,isInsideWorkspace} from './monorepo';
import {diagnose, verifyServices, validateService} from './diagnostics';
import type {DiagnosticSession, ServiceTarget} from './diagnostics';
import {html} from './ui';
import {redactSensitiveText} from './redaction';
import {hostLabel} from './host';
import {renderReport,renderEvidenceCopy} from './reports';
import {ProjectStateStore} from './project-state';
import type {ProjectData,DisplaySession} from './project-state';
import {compareSessions} from './comparison';
import {validateUiMessage} from './messages';
import {t, localizeFinding, localizeSession} from './i18n';
import type {I18nKey, Locale, Params} from './i18n';

function errorMessage(error:unknown):string {
  return error instanceof Error ? error.message : '';
}

export class ControlCenter {
  readonly context:vscode.ExtensionContext;
  views:Set<vscode.Webview>;
  panel:vscode.WebviewPanel|null;
  currentRoot:vscode.Uri|null;
  data:ProjectData;
  readonly store:ProjectStateStore;
  pendingApproval:ServiceTarget[]|null;
  selectedHistoryIndex:number|null;
  error:string;
  running:boolean;
  abort:AbortController|null;
  constructor(context:vscode.ExtensionContext) {
    this.context = context;
    this.views = new Set<vscode.Webview>();
    this.panel = null;
    const initialFolders=vscode.workspace.workspaceFolders;
    this.currentRoot=initialFolders?.length===1 ? (initialFolders[0]?.uri ?? null) : null;
    this.store = new ProjectStateStore(context.workspaceState,
      ()=>vscode.env?.language?.toLowerCase().startsWith('es') ? 'es' : 'en');
    this.data = { session: null, services: [], history: [], timeoutMs: 2500, locale:'en' };
    this.pendingApproval = null;
    this.selectedHistoryIndex = null;
    this.error = '';
    this.running = false;
    this.abort = null;
    this.restore();
  }
  tr(key:I18nKey,values?:Params) {return t(this.data.locale,key,values);}
  rootKey() {return this.currentRoot?.toString() ?? null;}
  restore() {
    const loaded=this.store.load(this.rootKey());
    this.data=loaded.data;
    if(loaded.readFailed)this.error=this.tr('host.storageReadFailed');
  }
  async save() {
    // Keep actual findings in memory. A storage failure does not turn a
    // completed diagnostic into FAILED, nor imply that data was persisted.
    if(!(await this.store.save(this.rootKey(),this.data)))
      this.error=this.tr('host.storageSaveFailed');
  }
  viewedSession() {
    return this.selectedHistoryIndex===null ? this.data.session :
      (this.data.history[this.selectedHistoryIndex]?.snapshot || null);
  }
  snapshot() {
    return {
      locale: this.data.locale,
      reviewMode: this.selectedHistoryIndex!==null,
      selectedHistoryIndex: this.selectedHistoryIndex,
      project: this.currentRoot ?
        (vscode.workspace.getWorkspaceFolder(this.currentRoot)?.uri.toString()===this.currentRoot.toString() ?
         vscode.workspace.getWorkspaceFolder(this.currentRoot)?.name : path.basename(this.currentRoot.fsPath)):'',

      host: hostLabel(vscode.env.remoteName) + ' · ' + this.tr('ui.hostCurrent'),
      trusted: vscode.workspace.isTrusted,
      session: localizeSession(this.viewedSession(),this.data.locale),
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
  attach(webview:vscode.Webview) {
    webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')]
    };
    webview.html = html(webview, this.context.extensionUri, vscode);
    this.views.add(webview);
    const subscription = webview.onDidReceiveMessage(async (m:unknown) => {
      try { await this.message(m); } catch (e) {
        this.error = errorMessage(e) || this.tr('host.unexpected');
        this.broadcast();
      }
    });
    this.context.subscriptions.push(subscription);
    this.broadcast();
  }
  async openHome() {
    if (this.panel) { this.panel.reveal(); return; }
    const panel = vscode.window.createWebviewPanel('indizivo.home','Indizivo · '+this.tr('ui.panelTitle'),
      vscode.ViewColumn.One,{ enableScripts:true, retainContextWhenHidden:true,
        localResourceRoots:[vscode.Uri.joinPath(this.context.extensionUri,'media')] });
    this.panel=panel;
    const panelWebview=panel.webview;
    this.attach(panelWebview);
    panel.onDidDispose(()=>{
      // VS Code invalidates panel.webview before calling onDidDispose.
      this.views.delete(panelWebview);
      if (this.panel===panel) this.panel=null;
    }, null, this.context.subscriptions);
  }
  async selectProject() {
    if (this.running) throw new Error(this.tr('host.cancelProject'));
    const folders=vscode.workspace.workspaceFolders||[];
    if(!folders.length){this.error=this.tr('host.openFolder');this.broadcast();return;}
    const options:{label:string;description:string;detail?:string;uri:vscode.Uri}[]=[];
    for(const folder of folders){
      options.push({label:folder.name,description:folder.uri.fsPath,uri:folder.uri});
      if(folder.uri.scheme!=='file')continue;
      // Explicit, shallow, bounded user-initiated discovery; never recursively scan.
      for(const project of await discoverProjectRoots(folder.uri.fsPath)){
        options.push({label:project.label,description:folder.name,
          detail:project.marker,uri:vscode.Uri.file(project.path)});
      }
    }
    const selected=options.length===1?options[0]:
      await vscode.window.showQuickPick(options,{placeHolder:this.tr('host.selectProject')});
    if(!selected)return;
    this.currentRoot=selected.uri;
    this.selectedHistoryIndex=null;
    this.pendingApproval=null;
    this.error='';
    this.restore();
    this.broadcast();
  }
  async ensureReady() {
    if (!vscode.workspace.isTrusted) throw new Error(this.tr('host.trust'));
    const selectedRoot=this.currentRoot;
    if (!selectedRoot) throw new Error(this.tr('host.projectFirst'));
    if (selectedRoot.scheme !== 'file') throw new Error(this.tr('host.localOnly'));
    const roots=(vscode.workspace.workspaceFolders||[])
      .filter(folder=>folder.uri.scheme==='file').map(folder=>folder.uri.fsPath);
    if(!(await isInsideWorkspace(selectedRoot.fsPath,roots)))
      throw new Error(this.tr('host.workspaceClosed'));
    if (this.running) throw new Error(this.tr('host.alreadyRunning'));
  }
  /** Marks the controller busy and returns the signal that cancels this run. */
  beginRun():AbortSignal {
    this.running=true;
    this.pendingApproval=null;
    this.abort=new AbortController();
    this.broadcast();
    return this.abort.signal;
  }
  endRun() {
    this.running=false;
    this.abort=null;
    this.broadcast();
  }
  cancel() {
    if (this.abort) this.abort.abort();
    this.pendingApproval=null;
  }
  async runDiagnosis() {
    await this.ensureReady();
    this.error='';
    this.selectedHistoryIndex=null;
    const root=this.currentRoot;
    if(!root)throw new Error(this.tr('host.projectFirst'));
    const previousCompleted = this.data.session && this.data.session.state==='completed' &&
      'discovery' in this.data.session ? this.data.session : null;
    this.data.session=null;
    const signal=this.beginRun();
    try {
      const session=await diagnose(root.fsPath,this.data.timeoutMs,signal,checks=>{
        this.data.session = {
          project: path.basename(root.fsPath) || this.tr('ui.projectDefault'),
          startedAt:new Date().toISOString(), completedAt:this.tr('ui.progress'),
          state:'running', checks, serviceChecks:[]
        };
        this.broadcast();
      });
      if (signal.aborted) throw new Error(this.tr('host.cancelled'));
      // Findings describe the Extension Host's machine: label remote topologies explicitly.
      session.host=hostLabel(vscode.env.remoteName);
      session.scopeId=crypto.createHash('sha256').update(this.store.key(this.rootKey())+'|'+
        (vscode.env.remoteName||'local')).digest('hex');
      session.comparison=compareSessions(previousCompleted,session);
      this.data.session=session;
      this.data.history.unshift({ project:session.project, completedAt:session.completedAt,
        checks:session.checks.map(x=>({id:x.id,status:x.status})),
        snapshot:session });
      this.data.history=this.data.history.slice(0,10);
      await this.save();
    } catch(e) {
      this.error = signal.aborted ? this.tr('host.cancelled') :
        this.tr('host.failed',{reason:errorMessage(e) || this.tr('host.unknown')});
      if (this.data.session) this.data.session.state=signal.aborted?'cancelled':'failed';
    } finally {
      this.endRun();
    }
  }
  async prepareServices() {
    await this.ensureReady();
    if (this.selectedHistoryIndex!==null) throw new Error(this.tr('host.currentSession'));
    if (!this.data.session) throw new Error(this.tr('host.diagnoseFirst'));
    if (!this.data.services.length) throw new Error(this.tr('host.addEndpointFirst'));
    this.pendingApproval=this.data.services.map(s=>({...s}));
    this.error='';
    this.broadcast();
  }
  async confirmServices() {
    await this.ensureReady();
    if (this.selectedHistoryIndex!==null) throw new Error(this.tr('host.currentSession'));
    const session=this.data.session;
    if (!this.pendingApproval || !session) throw new Error(this.tr('host.approvalExpired'));
    const plan=this.pendingApproval.map(validateService).filter((item):item is ServiceTarget=>item!==null);
    if (JSON.stringify(plan)!==JSON.stringify(this.data.services)) throw new Error(this.tr('host.targetsChanged'));
    const signal=this.beginRun();
    try {
      const result=await verifyServices(plan,this.data.timeoutMs,signal,partial=>{
        session.serviceChecks=partial;
        this.broadcast();
      });
      if (signal.aborted) throw new Error(this.tr('host.serviceCancelled'));
      session.serviceChecks=result;
      session.completedAt=new Date().toISOString();
      if(result.some(finding=>finding.id==='service-budget'))session.state='partial';
      if('id' in session && session.state==='completed'){
        // A comparison against the previous completed session is meaningful only
        // after the approved service observations have actually been collected.
        const previous=this.data.history[1]?.snapshot||null;
        session.comparison=compareSessions(previous,session as DiagnosticSession);
      }
      const recent=this.data.history[0];
      if(recent?.snapshot && 'id' in session &&
        recent.snapshot.id===session.id)
        recent.snapshot=structuredClone(session as DiagnosticSession);
      await this.save();
    } catch(e) {
      this.error=signal.aborted?this.tr('host.serviceCancelled'):this.tr('host.serviceFailed',{reason:errorMessage(e)||this.tr('host.unknown')});
    } finally {
      this.endRun();
    }
  }
  async addService(message:unknown) {
    if (this.running) throw new Error(this.tr('host.waitServiceEdit'));
    const service=validateService(message);
    if (!service) throw new Error(this.tr('host.invalidService'));
    if (this.data.services.length >= 20) throw new Error(this.tr('host.maxServices'));
    if (!this.data.services.some(item=>item.url===service.url)) this.data.services.push(service);
    this.pendingApproval=null;
    this.error='';
    await this.save();
    this.broadcast();
  }
  async removeService(url:string) {
    if (this.running) throw new Error(this.tr('host.waitServiceEdit'));
    if (typeof url!=='string') return;
    this.data.services=this.data.services.filter(x=>x.url!==url);
    this.pendingApproval=null;
    this.error='';
    await this.save();
    this.broadcast();
  }
  async copyEvidence(id:string) {
    if (typeof id!=='string' || !/^[a-z0-9-]{1,90}$/i.test(id)) throw new Error(this.tr('host.invalidFinding'));
    const viewed=this.viewedSession();
    const checks=[...(viewed?.checks||[]),...(viewed?.serviceChecks||[])];
    const finding=checks.find(check=>check.id===id);
    if (!finding) throw new Error(this.tr('host.findingUnavailable'));
    await vscode.env.clipboard.writeText(renderEvidenceCopy(
      localizeFinding(finding,this.data.locale),key=>this.tr(key)));
    vscode.window.showInformationMessage(this.tr('host.copied'));
  }
  async selectHistory(index:number) {
    if(this.running)throw new Error(this.tr('host.waitCurrent'));
    if(index===-1) {this.selectedHistoryIndex=null;this.broadcast();return;}
    const item=this.data.history[index];
    if(!Number.isInteger(index)||!item?.snapshot)
      throw new Error(this.tr('host.oldHistory'));
    this.selectedHistoryIndex=index;
    this.pendingApproval=null;
    this.broadcast();
  }
  async setLocale(locale:Locale) {
    if(!['es','en'].includes(locale))throw new Error(this.tr('host.langUnsupported'));
    this.data.locale=locale;
    this.error='';
    await this.save();
    this.broadcast();
  }
  async saveTimeout(value:number) {
    if (this.running) throw new Error(this.tr('host.waitTimeout'));
    if (!Number.isInteger(value) || value<400 || value>10000) throw new Error(this.tr('host.timeoutInvalid'));
    this.data.timeoutMs=value;
    this.pendingApproval=null;
    await this.save();
    this.broadcast();
  }
  async clearHistory() {
    if (this.running) throw new Error(this.tr('host.cancelHistory'));
    const result=await vscode.window.showWarningMessage(this.tr('host.confirmDelete'),
      {modal:true},this.tr('host.delete'));
    if (result!==this.tr('host.delete')) return;
    this.data.history=[];
    this.pendingApproval=null;
    this.data.session=null;
    this.selectedHistoryIndex=null;
    await this.save();
    this.broadcast();
  }
  async export(format:'md'|'json') {
    if (this.running) throw new Error(this.tr('host.waitExport'));
    const session=localizeSession(this.viewedSession(),this.data.locale);
    if (!session || !['json','md'].includes(format)) return;
    const name='indizivo-report.'+format;
    const uri=await vscode.window.showSaveDialog({
      defaultUri:vscode.Uri.joinPath(this.currentRoot || this.context.extensionUri,name),
      filters: format==='md'?{'Markdown':['md']}:{'JSON':['json']}
    });
    if (!uri) return;
    const output=renderReport(session,format,key=>this.tr(key));
    await vscode.workspace.fs.writeFile(uri,Buffer.from(output,'utf8'));
    // VS Code workspace.fs supports user-selected remote and virtual URI schemes.
    vscode.window.showInformationMessage(this.tr('host.reportExported'));
  }
  async message(m:unknown) {
    const request=validateUiMessage(m);
    if(!request)throw new Error(this.tr('host.invalidRequest'));
    switch(request.type) {
      case 'ready': this.broadcast(); break;
      case 'selectProject': await this.selectProject(); break;
      case 'openHome': await this.openHome(); break;
      case 'diagnose': await this.runDiagnosis(); break;
      case 'cancel': this.cancel(); this.broadcast(); break;
      case 'prepareServices': await this.prepareServices(); break;
      case 'confirmServices': await this.confirmServices(); break;
      case 'declineServices': this.pendingApproval=null; this.broadcast(); break;
      case 'addService': await this.addService(request); break;
      case 'removeService': await this.removeService(request.url); break;
      case 'copyEvidence': await this.copyEvidence(request.id); break;
      case 'selectHistory': await this.selectHistory(request.index); break;
      case 'setLocale': await this.setLocale(request.locale); break;
      case 'saveTimeout': await this.saveTimeout(request.value); break;
      case 'clearHistory': await this.clearHistory(); break;
      case 'export': await this.export(request.format); break;
      default: break;
    }
  }
}
export function activate(context:vscode.ExtensionContext) {
  const controller=new ControlCenter(context);
  // VS Code disposes subscriptions on shutdown: never leave a probe we spawned running.
  context.subscriptions.push({dispose:()=>controller.cancel()});
  context.subscriptions.push(vscode.window.registerWebviewViewProvider('indizivo.control',{
    resolveWebviewView(view) {
      const viewWebview=view.webview;
      controller.attach(viewWebview);
      view.onDidDispose(()=>controller.views.delete(viewWebview),null,context.subscriptions);
    }
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
      try {await handler();} catch(e){vscode.window.showErrorMessage('Indizivo: '+(errorMessage(e)||controller.tr('host.unexpected'))); }
    }));
  }
  context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(()=>{
    const folders=vscode.workspace.workspaceFolders || [];
    const selected=controller.currentRoot;
    // A changed workspace invalidates any HTTP plan the user was about to approve.
    controller.pendingApproval=null;
    if(selected && !folders.some(folder=>folder.uri.scheme==='file' &&
       (folder.uri.toString()===selected.toString() ||
        selected.fsPath.startsWith(folder.uri.fsPath+path.sep)))) {
      controller.cancel();
      controller.currentRoot=folders.length===1 ? folders[0]?.uri ?? null : null;
      controller.restore();
      controller.selectedHistoryIndex=null;
      controller.error=controller.tr('host.workspaceWasClosed');
    }
    controller.broadcast();
  }));
  if (vscode.workspace.onDidGrantWorkspaceTrust)
    context.subscriptions.push(vscode.workspace.onDidGrantWorkspaceTrust(()=>controller.broadcast()));
  return { controller };
}
export function deactivate():void {}

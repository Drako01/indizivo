// Indizivo 0.1.3: validate multi-registry release automation; runtime behavior unchanged.
import * as vscode from 'vscode';
import * as fs from 'node:fs/promises';
import * as crypto from 'node:crypto';
import {diagnose, verifyServices, validateService} from './diagnostics';
import type {DiagnosticSession, DiagnosticCheck, ServiceTarget} from './diagnostics';
import {html} from './ui';
import {compareSessions} from './comparison';
import {validateUiMessage} from './messages';
import {t, localizeFinding, localizeSession} from './i18n';
import type {I18nKey, Locale, Params} from './i18n';

type RunningSession=Pick<DiagnosticSession,'project'|'startedAt'|'completedAt'|'state'|'checks'|'serviceChecks'>;
type DisplaySession=DiagnosticSession|RunningSession;
interface HistoryEntry {
  project:string;
  completedAt:string;
  checks:Array<Pick<DiagnosticCheck,'id'|'status'>>;
  snapshot?:DiagnosticSession;
}
interface ProjectData {
  session:DisplaySession|null;
  services:ServiceTarget[];
  history:HistoryEntry[];
  timeoutMs:number;
  locale:Locale;
}
function errorMessage(error:unknown):string {
  return error instanceof Error ? error.message : '';
}

export class ControlCenter {
  readonly context:vscode.ExtensionContext;
  views:Set<vscode.Webview>;
  panel:vscode.WebviewPanel|null;
  currentRoot:vscode.Uri|null;
  data:ProjectData;
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
    this.data = { session: null, services: [], history: [], timeoutMs: 2500, locale:'en' };
    this.pendingApproval = null;
    this.selectedHistoryIndex = null;
    this.error = '';
    this.running = false;
    this.abort = null;
    this.restore();
  }
  tr(key:I18nKey,values?:Params) {return t(this.data.locale,key,values);}
  scopeKey() {
    return 'indizivo:v1:' + crypto.createHash('sha256').update(this.currentRoot?.toString() || 'none').digest('hex');
  }
  restore() {
    const stored = this.context.workspaceState.get<Partial<ProjectData>>(this.scopeKey(), {});
    this.data = {
      session: stored.session || null,
      services: (Array.isArray(stored.services) ? stored.services : []).map(validateService).filter((item):item is ServiceTarget=>item!==null).slice(0, 20),
      history: (Array.isArray(stored.history) ? stored.history : []).slice(0, 10),
      timeoutMs: Math.min(10000, Math.max(400, Number(stored.timeoutMs) || 2500)),
      locale: (stored.locale==='es'||stored.locale==='en') ? stored.locale :
        (vscode.env?.language?.toLowerCase().startsWith('es') ? 'es' : 'en')
    };
  }
  async save() {
    await this.context.workspaceState.update(this.scopeKey(), this.data);
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
      project: this.currentRoot ? vscode.workspace.getWorkspaceFolder(this.currentRoot)?.name : '',
      host: process.platform + ' · ' + this.tr('ui.hostCurrent'),
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
    const folders = vscode.workspace.workspaceFolders || [];
    if (!folders.length) { this.error=this.tr('host.openFolder'); this.broadcast(); return; }
    const selectedFolder = folders.length===1 ? folders[0] :
      (await vscode.window.showQuickPick(
        folders.map(folder=>({label:folder.name,description:folder.uri.fsPath,folder})),
        {placeHolder:this.tr('host.selectProject')}))?.folder;
    if (!selectedFolder) return;
    this.currentRoot = selectedFolder.uri;
    this.selectedHistoryIndex=null;
    this.pendingApproval=null;
    this.error='';
    this.restore();
    this.broadcast();
  }
  ensureReady() {
    if (!vscode.workspace.isTrusted) throw new Error(this.tr('host.trust'));
    if (!this.currentRoot) throw new Error(this.tr('host.projectFirst'));
    const folders = vscode.workspace.workspaceFolders || [];
    const selectedRoot=this.currentRoot;
    if (!folders.some(folder=>folder.uri.toString()===selectedRoot.toString()))
      throw new Error(this.tr('host.workspaceClosed'));
    if (this.currentRoot.scheme !== 'file') throw new Error(this.tr('host.localOnly'));
    if (this.running) throw new Error(this.tr('host.alreadyRunning'));
  }
  cancel() {
    if (this.abort) this.abort.abort();
    this.pendingApproval=null;
  }
  async runDiagnosis() {
    this.ensureReady();
    this.error='';
    this.selectedHistoryIndex=null;
    const root=this.currentRoot;
    if(!root)throw new Error(this.tr('host.projectFirst'));
    const previousCompleted = this.data.session && this.data.session.state==='completed' &&
      'discovery' in this.data.session ? this.data.session : null;
    this.data.session=null;
    this.running=true;
    this.pendingApproval=null;
    this.abort=new AbortController();
    const signal=this.abort.signal;
    this.broadcast();
    try {
      const session=await diagnose(root.fsPath,this.data.timeoutMs,signal,checks=>{
        this.data.session = {
          project: vscode.workspace.getWorkspaceFolder(root)?.name || this.tr('ui.projectDefault'),
          startedAt:new Date().toISOString(), completedAt:this.tr('ui.progress'),
          state:'running', checks, serviceChecks:[]
        };
        this.broadcast();
      });
      if (signal.aborted) throw new Error(this.tr('host.cancelled'));
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
      this.running=false;
      this.abort=null;
      this.broadcast();
    }
  }
  async prepareServices() {
    this.ensureReady();
    if (this.selectedHistoryIndex!==null) throw new Error(this.tr('host.currentSession'));
    if (!this.data.session) throw new Error(this.tr('host.diagnoseFirst'));
    if (!this.data.services.length) throw new Error(this.tr('host.addEndpointFirst'));
    this.pendingApproval=this.data.services.map(s=>({...s}));
    this.error='';
    this.broadcast();
  }
  async confirmServices() {
    this.ensureReady();
    if (this.selectedHistoryIndex!==null) throw new Error(this.tr('host.currentSession'));
    const session=this.data.session;
    if (!this.pendingApproval || !session) throw new Error(this.tr('host.approvalExpired'));
    const plan=this.pendingApproval.map(validateService).filter((item):item is ServiceTarget=>item!==null);
    if (JSON.stringify(plan)!==JSON.stringify(this.data.services)) throw new Error(this.tr('host.targetsChanged'));
    this.pendingApproval=null;
    this.running=true;
    this.abort=new AbortController();
    const signal=this.abort.signal;
    this.broadcast();
    try {
      const result=await verifyServices(plan,this.data.timeoutMs,signal,partial=>{
        session.serviceChecks=partial;
        this.broadcast();
      });
      if (signal.aborted) throw new Error(this.tr('host.serviceCancelled'));
      session.serviceChecks=result;
      session.completedAt=new Date().toISOString();
      const recent=this.data.history[0];
      if(recent?.snapshot && 'id' in session &&
        recent.snapshot.id===session.id)
        recent.snapshot=structuredClone(session as DiagnosticSession);
      await this.save();
    } catch(e) {
      this.error=signal.aborted?this.tr('host.serviceCancelled'):this.tr('host.serviceFailed',{reason:errorMessage(e)||this.tr('host.unknown')});
    } finally {
      this.running=false;
      this.abort=null;
      this.broadcast();
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
    const localized=localizeFinding(finding,this.data.locale);
    const lines=[this.tr('report.copiedTitle'),localized.label,
      this.tr('report.status')+': '+this.tr(`status.${localized.status}`),
      this.tr('report.observation')+': '+localized.detail,
      this.tr('report.next')+': '+(localized.suggestion||this.tr('report.none'))];
    for(const record of localized.evidence||[])
      lines.push(this.tr('report.evidence')+': '+record.fact+' · '+record.observedAt);
    await vscode.env.clipboard.writeText(lines.join('\n'));
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
    let output='';
    if (format==='json') output=JSON.stringify(session,null,2)+'\n';
    else {
      const lines=['# '+this.tr('report.heading'),'',this.tr('report.project')+': '+session.project,
        this.tr('report.date')+': '+session.completedAt,
        this.tr('report.state')+': '+this.tr(`state.${session.state}`),
        '', '> '+this.tr('report.disclaimer'),''];
      for (const c of [...(session.checks||[]),...(session.serviceChecks||[])]) {
        lines.push('## '+c.label,'','**'+this.tr(`status.${c.status}`)+'** — '+c.detail,
          '',c.suggestion||'','');
        for (const e of c.evidence||[]) lines.push('- '+this.tr('report.evidence')+': '+e.fact+' ('+e.observedAt+')');
        lines.push('');
      }
      output=lines.join('\n');
    }
    await fs.writeFile(uri.fsPath,output,'utf8');
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
    const selected=controller.currentRoot?.toString();
    if(selected && !folders.some(folder=>folder.uri.toString()===selected)) {
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

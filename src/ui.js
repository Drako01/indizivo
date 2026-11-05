'use strict';

function browserUI() {
  const vscode = acquireVsCodeApi();
  const $ = id => document.getElementById(id);
  let state = {};
  const el = (tag, cls, content) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (content !== undefined) node.textContent = String(content);
    return node;
  };
  const fire = (type, data = {}) => vscode.postMessage(Object.assign({ type }, data));
  function clear(id) { const node = $(id); while (node.firstChild) node.removeChild(node.firstChild); return node; }
  function set(id,value) { $(id).textContent = value; }
  function renderCheck(node, c) {
    const item = el('article','check');
    const top = el('div','check-top');
    top.append(el('span','check-label',c.label),el('span','status status-'+c.status,c.status));
    item.append(top,el('div','muted',c.detail));
    if (c.suggestion) item.append(el('div','suggestion','Next: '+c.suggestion));
    for (const e of c.evidence || []) {
      const details = el('details','evidence');
      const summary = el('summary',null,'View evidence · '+e.observedAt);
      details.append(summary,el('p',null,e.fact));
      item.append(details);
    }
    node.append(item);
  }
  function render() {
    const root = state.project || '';
    set('project-name',root || 'No project selected');
    set('host',state.host || 'Current extension host');
    set('state-label',state.running ? 'Diagnosing…' : state.session ? state.session.state : 'Ready');
    $('diagnose').disabled = !!state.running || !state.trusted || !root;
    $('recheck').disabled = !!state.running || !state.session || !state.trusted;
    $('cancel').disabled = !state.running;
    $('verify').disabled = !!state.running || !state.services?.length || !state.trusted || !state.session;
    $('export-md').disabled = !state.session;
    $('export-json').disabled = !state.session;
    $('clear-history').disabled = !state.history?.length;
    $('warning').hidden = !!state.trusted;
    $('approval').hidden = !state.pendingApproval;
    $('service-plan').textContent = (state.pendingApproval || []).map(s=>s.name+' → '+s.url).join('\n');
    $('progress').hidden = !state.running;
    $('error').hidden = !state.error;
    set('error', state.error || '');
    if (document.activeElement !== $('timeout')) $('timeout').value = String(state.timeoutMs || 2500);
    const items = (state.session?.checks || []).concat(state.session?.serviceChecks || []);
    set('total',String(items.length));
    set('warnings',String(items.filter(x=>x.status==='warn').length));
    set('observations',String(items.filter(x=>x.status==='info').length));
    set('summary', state.session ? 'Checks performed on '+state.session.completedAt+
      '. Results apply only to the tests that ran.' :
      'Start a diagnosis to inspect your development environment without changing files or processes.');
    const checks = clear('checks');
    if (!items.length) checks.append(el('p','empty','No evidence yet. Run a diagnosis to begin.'));
    for (const item of items) renderCheck(checks,item);
    const services = clear('services');
    for (const s of state.services || []) {
      const row = el('div','service-row');
      row.append(el('div','service-name',s.name+' · '+s.url));
      const remove = el('button','quiet','Remove');
      remove.addEventListener('click',()=>fire('removeService',{url:s.url}));
      row.append(remove);
      services.append(row);
    }
    if (!state.services?.length) services.append(el('p','muted','No local endpoints configured.'));
    const history = clear('history');
    for (const s of state.history || []) {
      const item = el('div','history-row',s.project+' · '+s.completedAt+' · '+s.checks.length+' checks');
      history.append(item);
    }
    if (!state.history?.length) history.append(el('p','muted','No saved sessions.'));
  }
  document.addEventListener('click',event=>{
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.getAttribute('data-action');
    if (action === 'prepare') fire('prepareServices');
    else if (action === 'confirm') fire('confirmServices');
    else if (action === 'decline') fire('declineServices');
    else if (action === 'diagnose') fire('diagnose');
    else if (action === 'recheck') fire('diagnose');
    else if (action === 'cancel') fire('cancel');
    else if (action === 'selectProject') fire('selectProject');
    else if (action === 'export-md') fire('export',{format:'md'});
    else if (action === 'export-json') fire('export',{format:'json'});
    else if (action === 'clear') fire('clearHistory');
    else if (action === 'saveTimeout') fire('saveTimeout',{value: Number($('timeout').value)});
    else if (action === 'addService') {
      fire('addService',{name:$('service-name').value,url:$('service-url').value});
      $('service-name').value=''; $('service-url').value='';
    }
    else if (action === 'tab') {
      const name=button.dataset.tab;
      document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x.dataset.tab===name));
      document.querySelectorAll('[data-section]').forEach(x=>x.hidden=x.dataset.section!==name);
    }
  });
  window.addEventListener('message',e=>{
    if (e.data && e.data.type==='state' && e.data.state) {state=e.data.state;render();}
  });
  fire('ready');
}
const STYLE = [
':root{color-scheme:light dark}*{box-sizing:border-box}body{margin:0;padding:0;background:var(--vscode-editor-background);color:var(--vscode-foreground);font:13px var(--vscode-font-family)}',
'.shell{max-width:980px;margin:auto;padding:18px 22px 48px}.brand{display:flex;align-items:center;gap:16px;margin-bottom:22px}.brand img{width:54px;height:54px}.eyebrow{font-size:11px;letter-spacing:.12em;text-transform:uppercase;opacity:.8}.brand h1{font-size:26px;letter-spacing:.015em;margin:2px 0}.subtitle{opacity:.8;margin:0}.hero{padding:18px 20px;border:1px solid var(--vscode-panel-border);border-radius:12px;background:var(--vscode-sideBar-background);margin:14px 0 22px}.hero h2{margin:0 0 8px;font-size:21px}.hero p{line-height:1.5;max-width:680px}',
'.toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:16px}button{cursor:pointer;background:var(--vscode-button-background);color:var(--vscode-button-foreground);border:1px solid transparent;padding:9px 13px;border-radius:6px;font:inherit}button:hover{background:var(--vscode-button-hoverBackground)}button:disabled{opacity:.45;cursor:not-allowed}.quiet{background:transparent;border-color:var(--vscode-panel-border);color:var(--vscode-foreground)}.quiet:hover{background:var(--vscode-toolbar-hoverBackground)}',
'.tabs{display:flex;gap:6px;flex-wrap:wrap;border-bottom:1px solid var(--vscode-panel-border);padding-bottom:10px;margin-bottom:20px}.tab{background:transparent;color:var(--vscode-foreground)}.tab.active{border-color:var(--vscode-focusBorder);border-bottom:3px solid var(--vscode-focusBorder)}',
'.metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0 20px}.metric{background:var(--vscode-sideBar-background);border:1px solid var(--vscode-panel-border);border-radius:10px;padding:14px}.metric strong{display:block;font-size:27px;margin-top:4px}.muted{opacity:.76;line-height:1.5}.empty{opacity:.8;padding:30px;text-align:center;border:1px dashed var(--vscode-panel-border)}',
'.check{border:1px solid var(--vscode-panel-border);border-radius:9px;padding:14px;margin:0 0 10px;background:var(--vscode-sideBar-background)}.check-top{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:8px}.check-label{font-weight:700}.status{padding:3px 8px;border-radius:10px;background:var(--vscode-badge-background);color:var(--vscode-badge-foreground);text-transform:uppercase;font-size:10px;letter-spacing:.07em}.status-warn{border:1px solid var(--vscode-editorWarning-foreground)}.status-pass{border:1px solid var(--vscode-testing-iconPassed)}.suggestion{margin-top:9px;line-height:1.5}.evidence{margin-top:12px;border-top:1px solid var(--vscode-panel-border);padding-top:10px}.evidence summary{cursor:pointer}.evidence p{white-space:pre-wrap;overflow-wrap:anywhere}',
'.panel{border:1px solid var(--vscode-panel-border);border-radius:10px;padding:15px;margin:10px 0 18px}.panel h3{margin:0 0 12px;font-size:16px}.fields{display:grid;gap:12px}.fields label{display:grid;gap:6px;font-weight:600}.fields input{min-width:0;width:100%;padding:9px 10px;border:1px solid var(--vscode-input-border);border-radius:5px;background:var(--vscode-input-background);color:var(--vscode-input-foreground);font:inherit}.service-row,.history-row{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid var(--vscode-panel-border)}.service-name{overflow-wrap:anywhere}.callout{padding:12px;border-left:3px solid var(--vscode-editorWarning-foreground);background:var(--vscode-sideBar-background);margin:10px 0}.approval{border-color:var(--vscode-focusBorder)}pre{white-space:pre-wrap;overflow-wrap:anywhere}.privacy{font-size:11px;opacity:.75;margin-top:18px}button:focus-visible,input:focus-visible,summary:focus-visible{outline:2px solid var(--vscode-focusBorder);outline-offset:2px}',
'@media(max-width:500px){.shell{padding:14px}.metrics{grid-template-columns:1fr}.brand img{width:42px;height:42px}.brand h1{font-size:23px}.hero{padding:14px}}@media(prefers-reduced-motion:no-preference){button{transition:background .12s ease}}'
].join('');
function html(webview, extensionUri, vscode) {
  const nonce = require('node:crypto').randomBytes(16).toString('base64');
  const logo = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'indizivo-icon.svg'));
  const csp = "default-src 'none'; img-src "+webview.cspSource+
    "; style-src 'nonce-"+nonce+"'; script-src 'nonce-"+nonce+"';";
  const script = '(' + browserUI.toString() + ')();';
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">'+
    '<meta http-equiv="Content-Security-Policy" content="'+csp+'">'+
    '<style nonce="'+nonce+'">'+STYLE+'</style></head><body><main class="shell">'+
    '<header class="brand"><img alt="Indizivo logo" src="'+logo+'"><div><div class="eyebrow">Developer Environment Diagnostics</div><h1>INDIZIVO</h1><p class="subtitle">Find the cause. Fix with confidence.</p></div></header>'+
    '<div class="hero"><div class="eyebrow">CONTROL CENTER · <span id="state-label">Ready</span></div><h2 id="project-name">No project selected</h2><div class="muted" id="host">Extension host</div><p>Diagnose a project without modifying its files or terminating any processes. Every finding includes observations and limitations.</p>'+
    '<div class="toolbar"><button id="diagnose" data-action="diagnose">Diagnose project</button><button class="quiet" id="recheck" data-action="recheck">Recheck</button><button class="quiet" data-action="selectProject">Choose project</button><button class="quiet" id="cancel" data-action="cancel" disabled>Cancel</button></div></div>'+
    '<div id="warning" class="callout" hidden>This workspace is not trusted. Diagnostics are disabled until you trust it in VS Code.</div><div id="progress" class="callout" role="status" hidden>Diagnosis running…</div><div id="error" class="callout" role="alert" hidden></div>'+
    '<nav class="tabs" aria-label="Control center sections"><button class="tab active" data-action="tab" data-tab="diagnostics">Diagnostics</button><button class="tab" data-action="tab" data-tab="services">Services</button><button class="tab" data-action="tab" data-tab="history">History & Reports</button><button class="tab" data-action="tab" data-tab="settings">Settings</button></nav>'+
    '<section data-section="diagnostics"><div class="metrics"><div class="metric"><span class="muted">Checks</span><strong id="total">0</strong></div><div class="metric"><span class="muted">Warnings</span><strong id="warnings">0</strong></div><div class="metric"><span class="muted">Observations</span><strong id="observations">0</strong></div></div><p class="muted" id="summary"></p><div id="checks"></div></section>'+
    '<section data-section="services" hidden><div class="panel"><h3>Local service checks</h3><p class="muted">Add loopback HTTP endpoints only. Requests are never sent until you inspect the plan and approve them.</p><div id="services"></div><div class="fields"><label>Service name<input id="service-name" maxlength="50" placeholder="Local API"></label><label>Loopback URL<input id="service-url" placeholder="http://127.0.0.1:5000/health"></label><button data-action="addService">Add service</button></div></div><button id="verify" data-action="prepare" disabled>Review checks & approve</button><div id="approval" class="panel approval" hidden><h3>Approval required</h3><p>Indizivo will make GET requests to exactly these loopback endpoints:</p><pre id="service-plan"></pre><div class="toolbar"><button data-action="confirm">Approve and run</button><button class="quiet" data-action="decline">Cancel</button></div></div></section>'+
    '<section data-section="history" hidden><div class="panel"><h3>Local review history</h3><div id="history"></div></div><div class="toolbar"><button id="export-md" data-action="export-md">Export Markdown</button><button class="quiet" id="export-json" data-action="export-json">Export JSON</button><button class="quiet" id="clear-history" data-action="clear">Delete history</button></div></section>'+
    '<section data-section="settings" hidden><div class="panel"><h3>Probe settings</h3><p class="muted">All local settings can be managed here. No manual editing of settings.json is required.</p><div class="fields"><label>Timeout per probe (400–10000 ms)<input id="timeout" type="number" min="400" max="10000" step="100" value="2500"></label><button data-action="saveTimeout">Save settings</button></div></div><div class="callout">Privacy: local-first, no telemetry, no AI, no cloud. Indizivo reads key names from .env without retaining values. Repository scripts are never executed.</div></section>'+
    '<footer class="privacy">ArmoTuSitio · MIT License · Designed and developed by Alejandro Daniel Di Stefano</footer></main><script nonce="'+nonce+'">'+script+'</script></body></html>';
}
module.exports = { html };

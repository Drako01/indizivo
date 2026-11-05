'use strict';

function browserUI() {
  const vscode = acquireVsCodeApi();
  const TEXT = {
    en: {
      copy:'Copy evidence',next:'Next:',evidence:'View evidence',noEvidence:'No evidence yet. Run a diagnosis to begin.',
      noServices:'No local endpoints configured.',remove:'Remove',noHistory:'No saved sessions.',
      changes:'Changes since previous diagnosis',current:'Current session',reviewing:'Viewing saved diagnosis',
      done:'Checks performed on',limitations:'Results apply only to the tests that ran.',
      start:'Start a diagnosis to inspect your development environment without changing files or processes.',
      inProgress:'Diagnosing…',ready:'Ready',project:'No project selected',host:'Current extension host',
      section:'Control center sections',brand:'Developer Environment Diagnostics',
      title:'Find the cause. Fix with confidence.',welcome:'Diagnose a project without modifying its files or terminating any processes. Every finding includes observations and limitations.',
      diagnose:'Diagnose project',recheck:'Recheck',choose:'Choose project',full:'Full view',cancel:'Cancel',
      trust:'This workspace is not trusted. Diagnostics are disabled until you trust it in VS Code.',
      loading:'Diagnosis running…',diagnostics:'Diagnostics',services:'Services',history:'History & Reports',settings:'Settings',
      checks:'Checks',warnings:'Warnings',observations:'Observations',serviceTitle:'Local service checks',
      serviceNote:'Add loopback HTTP endpoints only. Requests are never sent until you inspect the plan and approve them.',
      serviceName:'Service name',serviceURL:'Loopback URL',add:'Add service',review:'Review checks & approve',
      approval:'Approval required',approvalText:'Indizivo will make GET requests to exactly these loopback endpoints:',
      confirm:'Approve and run',decline:'Cancel',historyTitle:'Local review history',exportMD:'Export Markdown',
      exportJSON:'Export JSON',clearHistory:'Delete history',settingsTitle:'Probe settings',
      settingsNote:'All local settings can be managed here. No manual editing of settings.json is required.',
      timeout:'Timeout per probe (400–10000 ms)',save:'Save settings',
      privacy:'Privacy: local-first, no telemetry, no AI, no cloud. Indizivo reads key names from .env without retaining values. Repository scripts are never executed.',
      language:'Interface language',english:'English',spanish:'Español',
      selectHistory:'Inspect session',backCurrent:'Back to current session',unavailableHistory:'Summary only — rerun to capture full evidence',
      status:'Status',untrusted:'Untrusted workspace'
    },
    es: {
      copy:'Copiar evidencia',next:'Siguiente paso:',evidence:'Ver evidencia',noEvidence:'Todavía no hay evidencias. Ejecutá un diagnóstico para comenzar.',
      noServices:'No hay servicios locales configurados.',remove:'Eliminar',noHistory:'Todavía no hay sesiones guardadas.',
      changes:'Cambios desde el diagnóstico anterior',current:'Sesión actual',reviewing:'Revisando diagnóstico guardado',
      done:'Comprobaciones realizadas el',limitations:'Los resultados corresponden únicamente a las pruebas ejecutadas.',
      start:'Ejecutá un diagnóstico para revisar tu entorno sin modificar archivos ni procesos.',
      inProgress:'Diagnosticando…',ready:'Listo',project:'No hay proyecto seleccionado',host:'Host de la extensión actual',
      section:'Secciones del centro de control',brand:'Diagnóstico de entornos de desarrollo',
      title:'Encontrá la causa. Resolvé con confianza.',welcome:'Diagnosticá tu proyecto sin modificar archivos ni terminar procesos. Cada resultado incluye evidencias y sus limitaciones.',
      diagnose:'Diagnosticar proyecto',recheck:'Volver a comprobar',choose:'Elegir proyecto',full:'Vista completa',cancel:'Cancelar',
      trust:'Este espacio de trabajo no es confiable. Los diagnósticos están deshabilitados hasta que lo autorices en VS Code.',
      loading:'Diagnóstico en curso…',diagnostics:'Diagnósticos',services:'Servicios',history:'Historial e informes',settings:'Configuración',
      checks:'Comprobaciones',warnings:'Advertencias',observations:'Observaciones',serviceTitle:'Comprobaciones de servicios locales',
      serviceNote:'Solo se permiten endpoints HTTP locales. No se envía ninguna solicitud sin que revises y apruebes el plan.',
      serviceName:'Nombre del servicio',serviceURL:'URL local',add:'Agregar servicio',review:'Revisar y autorizar',
      approval:'Autorización necesaria',approvalText:'Indizivo enviará solicitudes GET exactamente a estos endpoints locales:',
      confirm:'Autorizar y ejecutar',decline:'Cancelar',historyTitle:'Historial de diagnósticos',
      exportMD:'Exportar Markdown',exportJSON:'Exportar JSON',clearHistory:'Eliminar historial',
      settingsTitle:'Configuración de comprobaciones',
      settingsNote:'Configurá todas las opciones locales desde este panel, sin editar settings.json manualmente.',
      timeout:'Tiempo máximo por comprobación (400–10000 ms)',save:'Guardar configuración',
      privacy:'Privacidad: funcionamiento local, sin telemetría, IA ni nube. Indizivo solo examina nombres de variables de .env, no sus valores. Nunca ejecuta scripts del repositorio.',
      language:'Idioma de la interfaz',english:'English',spanish:'Español',
      selectHistory:'Ver sesión',backCurrent:'Volver a la sesión actual',
      unavailableHistory:'Solo resumen — ejecutá otro diagnóstico para guardar la evidencia completa',
      status:'Estado',untrusted:'Espacio no confiable'
    }
  };
  const tr = key => (TEXT[state.locale==='es'?'es':'en'][key] || TEXT.en[key] || key);
  const $ = id => document.getElementById(id);
  let state = {locale:'en'};
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
    const copy=el('button','quiet',tr('copy'));
    copy.setAttribute('type','button');
    copy.addEventListener('click',()=>fire('copyEvidence',{id:c.id}));
    item.append(copy);
    if (c.suggestion) item.append(el('div','suggestion',tr('next')+' '+c.suggestion));
    for (const e of c.evidence || []) {
      const details = el('details','evidence');
      const summary = el('summary',null,tr('evidence')+' · '+e.observedAt);
      details.append(summary,el('p',null,e.fact));
      item.append(details);
    }
    node.append(item);
  }
  function render() {
    const root = state.project || '';
    set('project-name',root || tr('project'));
    document.documentElement.lang=state.locale==='es'?'es':'en';
    set('host',state.host || tr('host'));
    applyStaticTranslations();
    set('state-label',state.running ? tr('inProgress') : state.session ? state.session.state : tr('ready'));
    $('diagnose').disabled = !!state.running || !state.trusted || !root;
    $('select-project').disabled = !!state.running;
    $('recheck').disabled = !!state.running || !state.session || !state.trusted;
    $('cancel').disabled = !state.running;
    $('verify').disabled = !!state.running || !!state.reviewMode || !state.services?.length || !state.trusted || !state.session;
    $('export-md').disabled = !!state.running || !state.session;
    $('export-json').disabled = !!state.running || !state.session;
    $('clear-history').disabled = !!state.running || !state.history?.length;
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
    set('summary', state.session ?
      (state.reviewMode?tr('reviewing')+'. ':'')+
      tr('done')+' '+state.session.completedAt+'. '+tr('limitations') :
      tr('start'));
    const comparison=clear('comparison');
    comparison.hidden=true;
    const trends=state.session?.comparison?.observations || [];
    if (trends.length) {
      comparison.hidden=false;
      comparison.append(el('h3',null,tr('changes')));
      comparison.append(el('p','muted',state.session.comparison.note));
      for (const trend of trends.filter(x=>x.trend!=='unchanged').slice(0,12))
        comparison.append(el('div','history-row',trend.id+' · '+trend.trend+
          (trend.before?' ('+trend.before+' → '+(trend.after||'not checked')+')':'')));
    }
    const checks = clear('checks');
    if (!items.length) checks.append(el('p','empty',tr('noEvidence')));
    for (const item of items) renderCheck(checks,item);
    const services = clear('services');
    for (const s of state.services || []) {
      const row = el('div','service-row');
      row.append(el('div','service-name',s.name+' · '+s.url));
      const remove = el('button','quiet',tr('remove'));
      remove.disabled=!!state.running;
      remove.addEventListener('click',()=>fire('removeService',{url:s.url}));
      row.append(remove);
      services.append(row);
    }
    if (!state.services?.length) services.append(el('p','muted',tr('noServices')));
    const previouslyFocusedHistory=document.activeElement?.dataset?.historyIndex;
    const history = clear('history');
    const showCurrent=el('button','quiet',tr('backCurrent'));
    showCurrent.disabled=!!state.running || !state.reviewMode;
    showCurrent.dataset.historyIndex='-1';
    showCurrent.addEventListener('click',()=>fire('selectHistory',{index:-1}));
    history.append(showCurrent);
    for (const [index, s] of (state.history||[]).entries()) {
      const item=el('div','history-row');
      item.append(el('span','service-name',s.project+' · '+s.completedAt+
        ' · '+(s.checks?.length||0)+' '+tr('checks').toLowerCase()));
      const open=el('button','quiet',s.snapshot?tr('selectHistory'):tr('unavailableHistory'));
      open.disabled=!!state.running || !s.snapshot;
      open.dataset.historyIndex=String(index);
      open.setAttribute('aria-pressed',String(state.selectedHistoryIndex===index));
      open.addEventListener('click',()=>fire('selectHistory',{index}));
      item.append(open);history.append(item);
    }
    if (!state.history?.length) history.append(el('p','muted',tr('noHistory')));
    if(previouslyFocusedHistory!==undefined) {
      const restore=[...history.querySelectorAll('[data-history-index]')]
        .find(node=>node.dataset.historyIndex===previouslyFocusedHistory);
      if(restore && !restore.disabled)restore.focus({preventScroll:true});
    }
    for(const button of document.querySelectorAll('[data-locale]')){
      button.setAttribute('aria-pressed',String(button.dataset.locale===(state.locale||'en')));
    }
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
    else if (action === 'openHome') fire('openHome');
    else if (action === 'locale') fire('setLocale',{locale:button.dataset.locale});
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
      document.querySelectorAll('[data-tab]').forEach(x=>{const active=x.dataset.tab===name;
        x.classList.toggle('active',active);x.setAttribute('aria-selected',String(active));x.tabIndex=active?0:-1;});
      document.querySelectorAll('[data-section]').forEach(x=>x.hidden=x.dataset.section!==name);
    }
  });
  const STATIC={
    '.eyebrow':'brand','.subtitle':'title','.hero p':'welcome',
    '[data-action="diagnose"]':'diagnose','[data-action="recheck"]':'recheck',
    '[data-action="selectProject"]':'choose','[data-action="openHome"]':'full',
    '[data-action="cancel"]':'cancel','#warning':'trust','#progress':'loading',
    '[data-tab="diagnostics"]':'diagnostics','[data-tab="services"]':'services',
    '[data-tab="history"]':'history','[data-tab="settings"]':'settings',
    '.metrics .metric:nth-child(1) .muted':'checks',
    '.metrics .metric:nth-child(2) .muted':'warnings',
    '.metrics .metric:nth-child(3) .muted':'observations',
    '[data-section="services"] h3:first-child':'serviceTitle',
    '[data-section="services"] .panel>p':'serviceNote',
    '[data-section="services"] .fields label:nth-child(1)':'serviceName',
    '[data-section="services"] .fields label:nth-child(2)':'serviceURL',
    '[data-action="addService"]':'add','[data-action="prepare"]':'review',
    '#approval h3':'approval','#approval>p':'approvalText',
    '[data-action="confirm"]':'confirm','[data-action="decline"]':'decline',
    '[data-section="history"] h3':'historyTitle',
    '[data-action="export-md"]':'exportMD','[data-action="export-json"]':'exportJSON',
    '[data-action="clear"]':'clearHistory','[data-section="settings"] h3':'settingsTitle',
    '[data-section="settings"] .panel>p':'settingsNote',
    '[data-action="saveTimeout"]':'save','#settings-privacy':'privacy',
    '#locale-legend':'language'
  };
  function applyStaticTranslations() {
    for(const [selector,key] of Object.entries(STATIC)) {
      const target=document.querySelector(selector);
      if(!target)continue;
      if(target.tagName==='LABEL') {
        const textNode=[...target.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);
        if(textNode)textNode.textContent=tr(key)+' ';
      } else target.textContent=tr(key);
    }
    const cancel=document.querySelector('[data-action="decline"]');
    if(cancel)cancel.textContent=tr('decline');
    const locale=document.querySelector('nav.tabs');
    if(locale)locale.setAttribute('aria-label',tr('section'));
  }
  document.addEventListener('keydown',event=>{
    const current=event.target.closest?.('[data-tab]');
    if(!current)return;
    if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
    const tabs=[...document.querySelectorAll('[data-tab]')];
    const idx=tabs.indexOf(current);
    const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:
      (idx+(event.key==='ArrowRight'?1:tabs.length-1))%tabs.length;
    event.preventDefault();tabs[next]?.focus();tabs[next]?.click();
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
    '<div class="toolbar"><button id="diagnose" data-action="diagnose">Diagnose project</button><button class="quiet" id="recheck" data-action="recheck">Recheck</button><button class="quiet" id="select-project" data-action="selectProject">Choose project</button><button class="quiet" data-action="openHome">Full view</button><button class="quiet" id="cancel" data-action="cancel" disabled>Cancel</button></div></div>'+
    '<div id="warning" class="callout" role="alert" hidden>This workspace is not trusted. Diagnostics are disabled until you trust it in VS Code.</div><div id="progress" class="callout" role="status" hidden>Diagnosis running…</div><div id="error" class="callout" role="alert" hidden></div>'+
    '<nav class="tabs" role="tablist" aria-label="Control center sections"><button class="tab active" role="tab" id="tab-diagnostics" aria-controls="section-diagnostics" aria-selected="true" data-action="tab" data-tab="diagnostics">Diagnostics</button><button class="tab" role="tab" id="tab-services" aria-controls="section-services" aria-selected="false" tabindex="-1" data-action="tab" data-tab="services">Services</button><button class="tab" role="tab" id="tab-history" aria-controls="section-history" aria-selected="false" tabindex="-1" data-action="tab" data-tab="history">History & Reports</button><button class="tab" role="tab" id="tab-settings" aria-controls="section-settings" aria-selected="false" tabindex="-1" data-action="tab" data-tab="settings">Settings</button></nav>'+
    '<section id="section-diagnostics" aria-labelledby="tab-diagnostics" data-section="diagnostics" role="tabpanel"><div class="metrics"><div class="metric"><span class="muted">Checks</span><strong id="total">0</strong></div><div class="metric"><span class="muted">Warnings</span><strong id="warnings">0</strong></div><div class="metric"><span class="muted">Observations</span><strong id="observations">0</strong></div></div><p class="muted" id="summary" role="status" aria-live="polite"></p><div id="comparison" class="panel"></div><div id="checks"></div></section>'+
    '<section id="section-services" aria-labelledby="tab-services" data-section="services" role="tabpanel" hidden><div class="panel"><h3>Local service checks</h3><p class="muted">Add loopback HTTP endpoints only. Requests are never sent until you inspect the plan and approve them.</p><div id="services"></div><div class="fields"><label>Service name<input id="service-name" maxlength="50" placeholder="Local API"></label><label>Loopback URL<input id="service-url" placeholder="http://127.0.0.1:5000/health"></label><button data-action="addService">Add service</button></div></div><button id="verify" data-action="prepare" disabled>Review checks & approve</button><div id="approval" class="panel approval" hidden><h3>Approval required</h3><p>Indizivo will make GET requests to exactly these loopback endpoints:</p><pre id="service-plan"></pre><div class="toolbar"><button data-action="confirm">Approve and run</button><button class="quiet" data-action="decline">Cancel</button></div></div></section>'+
    '<section id="section-history" aria-labelledby="tab-history" data-section="history" role="tabpanel" hidden><div class="panel"><h3>Local review history</h3><div id="history"></div></div><div class="toolbar"><button id="export-md" data-action="export-md">Export Markdown</button><button class="quiet" id="export-json" data-action="export-json">Export JSON</button><button class="quiet" id="clear-history" data-action="clear">Delete history</button></div></section>'+
    '<section id="section-settings" aria-labelledby="tab-settings" data-section="settings" role="tabpanel" hidden><div class="panel"><h3>Probe settings</h3><p class="muted">All local settings can be managed here. No manual editing of settings.json is required.</p><div class="fields"><label>Timeout per probe (400–10000 ms)<input id="timeout" type="number" min="400" max="10000" step="100" value="2500"></label><button data-action="saveTimeout">Save settings</button></div></div><div class="panel"><h3 id="locale-legend">Interface language</h3><div class="toolbar"><button class="quiet" data-action="locale" data-locale="en" aria-pressed="false">English</button><button class="quiet" data-action="locale" data-locale="es" aria-pressed="false">Español</button></div></div><div id="settings-privacy" class="callout">Privacy: local-first, no telemetry, no AI, no cloud. Indizivo reads key names from .env without retaining values. Repository scripts are never executed.</div></section>'+
    '<footer class="privacy">ArmoTuSitio · MIT License · Designed and developed by Alejandro Daniel Di Stefano</footer></main><script nonce="'+nonce+'">'+script+'</script></body></html>';
}
module.exports = { html };

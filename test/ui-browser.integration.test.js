'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {html}=require('../src/ui');

class FakeElement {
 constructor(tag,doc) {
  this.tagName=tag.toUpperCase();
  this.ownerDocument=doc;
  this.children=[];this.parentElement=null;this.dataset={};
  this.attributes=new Map();this.listeners=new Map();
  this.textContent='';this.value='';this.hidden=false;this.disabled=false;this.tabIndex=0;
  this.className='';
  this.classList={toggle:(name,enabled)=>{
   const names=new Set(this.className.split(/\s+/).filter(Boolean));
   if(enabled)names.add(name);else names.delete(name);
   this.className=[...names].join(' ');
  }};
 }
 get firstChild(){return this.children[0]||null;}
 get childNodes(){return this.children;}
 append(...nodes) {
  for(const node of nodes) {
   node.parentElement=this;this.children.push(node);
  }
 }
 removeChild(node){
  const index=this.children.indexOf(node);
  if(index>=0)this.children.splice(index,1);
  node.parentElement=null;return node;
 }
 setAttribute(name,value){
  const text=String(value);this.attributes.set(name,text);
  if(name.startsWith('data-'))this.dataset[name.slice(5).replace(/-([a-z])/g,(_m,x)=>x.toUpperCase())]=text;
 }
 getAttribute(name){return this.attributes.get(name)||null;}
 matches(selector){
  const match=/^\[data-([a-z-]+)(?:="([^"]*)")?\]$/.exec(selector);
  if(!match)return false;
  const key=match[1].replace(/-([a-z])/g,(_m,x)=>x.toUpperCase());
  return this.dataset[key]!==undefined&&(match[2]===undefined||this.dataset[key]===match[2]);
 }
 closest(selector){
  for(let node=this;node;node=node.parentElement)if(node.matches(selector))return node;
  return null;
 }
 querySelectorAll(selector){
  const found=[];
  const visit=node=>{for(const child of node.children){
   if(child.matches(selector))found.push(child);
   visit(child);
  }};
  visit(this);return found;
 }
 addEventListener(type,handler){
  if(!this.listeners.has(type))this.listeners.set(type,[]);
  this.listeners.get(type).push(handler);
 }
 focus(){this.ownerDocument.activeElement=this;}
 click(){
  if(this.disabled)return;
  for(const listener of this.listeners.get('click')||[])listener({target:this});
  this.ownerDocument.emit('click',{target:this});
 }
}
class FakeDocument {
 constructor(){
  this.byId=new Map();this.special=new Map();this.listeners=new Map();
  this.elements=[];this.activeElement=null;this.documentElement={lang:'en'};
  const ids=['control-center-label','project-name','host','state-label',
   'diagnose','select-project','recheck','cancel','verify','export-md',
   'export-json','clear-history','warning','approval','service-plan',
   'progress','error','timeout','total','warnings','observations','summary',
   'comparison','checks','services','history','service-name','service-url',
   'settings-privacy','locale-legend'];
  for(const id of ids){
   const tag=['timeout','service-name','service-url'].includes(id)?'input':
    ['diagnose','select-project','recheck','cancel','verify','export-md','export-json','clear-history'].includes(id)?'button':'div';
   const node=this.createElement(tag);
   this.byId.set(id,node);
  }
  this.tabs=['diagnostics','services','history','settings'].map(name=>{
   const tab=this.createElement('button');
   tab.setAttribute('data-action','tab');tab.setAttribute('data-tab',name);return tab;
  });
  this.sections=['diagnostics','services','history','settings'].map(name=>{
   const section=this.createElement('section');section.setAttribute('data-section',name);return section;
  });
  this.locales=['en','es'].map(locale=>{
   const node=this.createElement('button');node.setAttribute('data-action','locale');
   node.setAttribute('data-locale',locale);return node;
  });
  for(const selector of ['.hero p','nav.tabs','.brand img','footer.privacy']){
   this.special.set(selector,this.createElement(selector==='.brand img'?'img':'div'));
  }
  for(const action of ['diagnose','recheck','selectProject','openHome','cancel',
    'prepare','confirm','decline','export-md','export-json','clear','saveTimeout','addService']){
   const node=this.createElement('button');node.setAttribute('data-action',action);
   this.special.set('[data-action="'+action+'"]',node);
  }
 }
 createElement(tag){const node=new FakeElement(tag,this);this.elements.push(node);return node;}
 getElementById(id){return this.byId.get(id)||null;}
 querySelector(selector){
  if(selector.startsWith('#'))return this.getElementById(selector.slice(1));
  return this.special.get(selector)||null;
 }
 querySelectorAll(selector){return this.elements.filter(node=>node.matches(selector));}
 addEventListener(type,handler){
  if(!this.listeners.has(type))this.listeners.set(type,[]);
  this.listeners.get(type).push(handler);
 }
 emit(type,event){for(const fn of this.listeners.get(type)||[])fn(event);}
}
function createWebviewHarness(){
 const document=new FakeDocument();
 const messages=[];
 const listeners=new Map();
 const window={addEventListener:(type,handler)=>listeners.set(type,handler)};
 const fakeWebview={
  cspSource:'vscode-resource:',
  asWebviewUri:uri=>'vscode-resource:'+uri.path
 };
 const fakeApi={Uri:{joinPath:(_root,...parts)=>({path:parts.join('/')})}};
 const source=html(fakeWebview,{path:'/extension'},fakeApi);
 const scripts=[...source.matchAll(/<script nonce="[^"]+">([\s\S]*?)<\/script>/g)];
 assert.equal(scripts.length,1,'The actual bundled Webview JavaScript must be exercised');
 vm.runInNewContext(scripts[0][1],{
  document,window,Element:FakeElement,HTMLElement:FakeElement,Node:{TEXT_NODE:3},
  acquireVsCodeApi:()=>({postMessage:message=>messages.push(message)})
 },{timeout:1000});
 assert.equal(messages[0].type,'ready');
 const send=state=>{
  const handler=listeners.get('message');assert.ok(handler,'Webview must accept state events');
  handler({data:{type:'state',state}});
 };
 return {document,messages,send,source};
}
function session(){
 return {
  project:'Fixture',completedAt:'2026-11-05T17:00:00Z',state:'completed',
  checks:[{id:'node',label:'Node.js',status:'warn',detail:'Requires update',
   suggestion:'Review version',
   evidence:[{fact:'The declared version differs.',observedAt:'2026-11-05T17:00:00Z'}]}],
  serviceChecks:[],comparison:null
 };
}
function state(overrides={}){
 return {locale:'en',project:'Fixture',host:'win32',trusted:true,running:false,
  session:session(),services:[],history:[{
   project:'Fixture',completedAt:'2026-11-05T17:00:00Z',
   checks:[],snapshot:session()
  }],timeoutMs:750,pendingApproval:null,selectedHistoryIndex:null,reviewMode:false,
  ...overrides};
}
test('actual Webview script renders EN/ES state, accessible evidence and canonical text',()=>{
 const h=createWebviewHarness();
 h.send(state({locale:'es'}));
 const {document:doc,messages}=h;
 assert.equal(doc.documentElement.lang,'es');
 assert.equal(doc.getElementById('total').textContent,'1');
 assert.equal(doc.getElementById('warnings').textContent,'1');
 assert.equal(doc.getElementById('timeout').value,'750');
 assert.equal(doc.special.get('.hero p').textContent.includes('Diagnosticá'),true);
 assert.equal(doc.locales[1].getAttribute('aria-pressed'),'true');
 const checks=doc.getElementById('checks');
 assert.equal(checks.children.length,1);
 const button=checks.children[0].children.find(node=>node.tagName==='BUTTON');
 assert.ok(button.getAttribute('aria-label').includes('Node.js'));
 button.click();
 assert.equal(messages.at(-1).type,'copyEvidence');
 assert.equal(messages.at(-1).id,'node');
 assert.match(h.source,/Content-Security-Policy/);
});
test('actual Webview script activates tabs with keyboard and preserves history focus',()=>{
 const h=createWebviewHarness(),doc=h.document;
 h.send(state());
 assert.equal(doc.sections[0].hidden,false);
 doc.tabs[0].focus();
 let prevented=false;
 doc.emit('keydown',{target:doc.tabs[0],key:'ArrowRight',preventDefault(){prevented=true;}});
 assert.equal(prevented,true);
 assert.equal(doc.activeElement,doc.tabs[1]);
 assert.equal(doc.tabs[1].getAttribute('aria-selected'),'true');
 assert.equal(doc.sections[1].hidden,false);
 assert.equal(doc.sections[0].hidden,true);
 const buttons=doc.getElementById('history').querySelectorAll('[data-history-index]');
 assert.equal(buttons.length,2);
 buttons[1].focus();
 h.send(state({reviewMode:true,selectedHistoryIndex:0}));
 assert.equal(doc.activeElement.dataset.historyIndex,'0');
 const open=doc.getElementById('history').querySelectorAll('[data-history-index]')[1];
 assert.match(open.getAttribute('aria-label'),/Fixture/);
 open.click();
 assert.equal(h.messages.at(-1).type,'selectHistory');
 assert.equal(h.messages.at(-1).index,0);
});
test('actual Webview script blocks commands on untrusted state and requires explicit consent',()=>{
 const h=createWebviewHarness(),doc=h.document;
 h.send(state({trusted:false,pendingApproval:[{name:'API',url:'http://127.0.0.1:5000/health'}]}));
 assert.equal(doc.getElementById('diagnose').disabled,true);
 assert.equal(doc.getElementById('verify').disabled,true);
 assert.equal(doc.getElementById('warning').hidden,false);
 assert.equal(doc.getElementById('approval').hidden,false);
 assert.match(doc.getElementById('service-plan').textContent,/127\.0\.0\.1/);
 h.send(state({trusted:true,pendingApproval:[{name:'API',url:'http://127.0.0.1:5000/health'}],
  services:[{name:'API',url:'http://127.0.0.1:5000/health'}]}));
 assert.equal(doc.getElementById('verify').disabled,false);
 const before=h.messages.length;
 doc.special.get('[data-action="confirm"]').click();
 assert.equal(h.messages.length,before+1);
 assert.equal(h.messages.at(-1).type,'confirmServices');
 doc.locales[1].click();
 assert.equal(h.messages.at(-1).type,'setLocale');
 assert.equal(h.messages.at(-1).locale,'es');
});

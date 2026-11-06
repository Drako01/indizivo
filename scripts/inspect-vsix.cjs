'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const ZIP_EOCD=0x06054b50;
const ZIP_CENTRAL=0x02014b50;
const MANDATORY=[
 '[Content_Types].xml','extension.vsixmanifest','extension/package.json',
 'extension/package.nls.json','extension/package.nls.es.json','extension/src/extension.js','extension/src/diagnostics.js',
 'extension/src/ui.js','extension/src/versions.js','extension/src/port-owners.js',
 'extension/src/comparison.js','extension/src/messages.js','extension/dist/typed/messages.js',
 'extension/dist/typed/versions.js','extension/dist/typed/comparison.js','extension/dist/typed/i18n.js','extension/dist/typed/port-owners.js',
 'extension/dist/typed/diagnostics.js','extension/dist/typed/ui.js','extension/dist/typed/extension.js',
 'extension/dist/typed/storage.js',
 'extension/dist/typed/tool-probes.js',
 'extension/dist/typed/budget.js',
 'extension/media/indizivo-icon-128.png',
 'extension/readme.md','extension/LICENSE.txt','extension/PRIVACY.md'
];
const FORBIDDEN=[
 /(?:^|\/)PLAN\.md$/i,/(?:^|\/)node_modules\//i,
 /(?:^|\/)(?:test|docs|governance|coverage|\.github|\.git|\.vscode-test)\//i,
 /(?:^|\/)package-lock\.json$/i,/(?:^|\/)[^/]*\.log$/i,
 /(?:^|\/)\.env(?:\.|$)/i
];

function listZipEntries(buffer) {
 if(!Buffer.isBuffer(buffer)) throw new TypeError('Expected a ZIP Buffer');
 if(buffer.length<22 || buffer.length>100*1024*1024) throw new Error('Invalid or excessively large VSIX');
 const lower=Math.max(0,buffer.length-22-65535);
 let offset=-1;
 for(let i=buffer.length-22;i>=lower;i--){
   if(buffer.readUInt32LE(i)===ZIP_EOCD && i+22+buffer.readUInt16LE(i+20)===buffer.length) {
     offset=i;break;
   }
 }
 if(offset<0)throw new Error('ZIP end-of-central-directory record is missing');
 if(buffer.readUInt16LE(offset+4)!==0 || buffer.readUInt16LE(offset+6)!==0)
   throw new Error('Multi-disk ZIP is not supported');
 const count=buffer.readUInt16LE(offset+10);
 const length=buffer.readUInt32LE(offset+12);
 const start=buffer.readUInt32LE(offset+16);
 if(count===65535 || length===0xffffffff || start===0xffffffff)
   throw new Error('ZIP64 extension package is not supported');
 if(count>3000 || start+length>offset)throw new Error('Invalid central-directory boundaries');
 const entries=[];
 const seen=new Set();
 let cursor=start;
 let total=0;
 for(let i=0;i<count;i++){
   if(cursor+46>start+length || buffer.readUInt32LE(cursor)!==ZIP_CENTRAL)
     throw new Error('Invalid ZIP central-directory entry');
   const compressed=buffer.readUInt32LE(cursor+20);
   const uncompressed=buffer.readUInt32LE(cursor+24);
   const nameLength=buffer.readUInt16LE(cursor+28);
   const extraLength=buffer.readUInt16LE(cursor+30);
   const commentLength=buffer.readUInt16LE(cursor+32);
   const next=cursor+46+nameLength+extraLength+commentLength;
   if(next>start+length || compressed>40*1024*1024 || uncompressed>40*1024*1024)
     throw new Error('Invalid ZIP entry size');
   const name=buffer.subarray(cursor+46,cursor+46+nameLength).toString('utf8');
   if(!name || name.includes('\\') || name.includes('\0') ||
      name.startsWith('/') || name.split('/').includes('..') || seen.has(name))
     throw new Error('Unsafe or duplicate VSIX entry: '+name);
   seen.add(name);
   entries.push({name,size:uncompressed});
   total+=uncompressed;
   if(total>100*1024*1024)throw new Error('VSIX unpacked content is too large');
   cursor=next;
 }
 if(cursor!==start+length)throw new Error('Invalid ZIP central-directory length');
 return entries;
}
function validateInventory(entries) {
 const names=new Set(entries.map(e=>e.name));
 const missing=MANDATORY.filter(name=>!names.has(name));
 const forbidden=entries.filter(entry=>FORBIDDEN.some(regex=>regex.test(entry.name))).map(x=>x.name);
 if(missing.length || forbidden.length){
   throw new Error('VSIX inventory rejected. Missing: '+(missing.join(', ')||'none')+
     '; forbidden: '+(forbidden.join(', ')||'none'));
 }
 return {files:entries.filter(e=>!e.name.endsWith('/')).length,
   bytes:entries.reduce((sum,e)=>sum+e.size,0)};
}
function inspect(file) {
 const binary=fs.readFileSync(file);
 const entries=listZipEntries(binary);
 const summary=validateInventory(entries);
 return {...summary,path:file,sha256:crypto.createHash('sha256').update(binary).digest('hex')};
}
if(require.main===module) {
 try {
   const pkg=require(path.resolve(__dirname,'../package.json'));
   const file=process.argv[2]||path.resolve(process.cwd(),'indizivo-'+pkg.version+'.vsix');
   const result=inspect(file);
   console.log('Indizivo VSIX inventory: PASS');
   console.log(JSON.stringify(result,null,2));
 }catch(error){
   console.error('Indizivo VSIX inventory: FAIL —',error.message);
   process.exitCode=1;
 }
}
module.exports={listZipEntries,validateInventory,inspect};

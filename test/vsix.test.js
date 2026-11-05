'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {listZipEntries,validateInventory}=require('../scripts/inspect-vsix.cjs');

function centralZip(names) {
 const chunks=[];
 for(const name of names){
   const bytes=Buffer.from(name);
   const header=Buffer.alloc(46+bytes.length);
   header.writeUInt32LE(0x02014b50,0);
   header.writeUInt32LE(0,20);
   header.writeUInt32LE(0,24);
   header.writeUInt16LE(bytes.length,28);
   bytes.copy(header,46);
   chunks.push(header);
 }
 const central=Buffer.concat(chunks);
 const end=Buffer.alloc(22);
 end.writeUInt32LE(0x06054b50,0);
 end.writeUInt16LE(names.length,8);
 end.writeUInt16LE(names.length,10);
 end.writeUInt32LE(central.length,12);
 end.writeUInt32LE(0,16);
 return Buffer.concat([central,end]);
}
test('VSIX parser handles central-directory entries without extracting files',()=>{
 const result=listZipEntries(centralZip(['extension/package.json','extension/src/extension.js']));
 assert.deepEqual(result.map(x=>x.name),['extension/package.json','extension/src/extension.js']);
});
test('VSIX parser rejects duplicate entries and path traversal',()=>{
 assert.throws(()=>listZipEntries(centralZip(['extension/a','extension/a'])),/Unsafe or duplicate/);
 assert.throws(()=>listZipEntries(centralZip(['extension/../secret'])),/Unsafe or duplicate/);
});
test('VSIX inventory denies logs, local test state, node_modules and internal plans',()=>{
 const allowed=[
 '[Content_Types].xml','extension.vsixmanifest','extension/package.json',
 'extension/src/extension.js','extension/src/diagnostics.js','extension/src/ui.js',
 'extension/src/versions.js','extension/src/port-owners.js','extension/src/comparison.js',
 'extension/media/indizivo-icon-128.png','extension/readme.md',
 'extension/LICENSE.txt','extension/PRIVACY.md'
 ];
 assert.equal(validateInventory(listZipEntries(centralZip(allowed))).files,allowed.length);
 for(const path of ['extension/logs.log','extension/PLAN.md','extension/.env',
   'extension/node_modules/cache/index.js','extension/test/foo.js',
   'extension/docs/SECURITY.md','extension/package-lock.json']){
   assert.throws(()=>validateInventory(listZipEntries(centralZip([...allowed,path]))),/forbidden/);
 }
 assert.throws(()=>validateInventory(listZipEntries(centralZip(allowed.slice(1)))),/Missing/);
});
test('VSIX parser rejects tampered directory bounds',()=>{
 const binary=centralZip(['extension/package.json']);
 binary.writeUInt32LE(0xffffffff,binary.length-22+16);
 assert.throws(()=>listZipEntries(binary),/ZIP64|boundaries/);
});

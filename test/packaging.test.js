'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel));
test('manifest, logo and legal files exist before VSIX packaging',()=>{
 const pkg=JSON.parse(read('package.json').toString('utf8'));
 assert.equal(pkg.name,'indizivo');
 assert.equal(pkg.publisher,'armotusitio');
 assert.equal(pkg.license,'MIT');
 assert.equal(pkg.main,'./src/extension.js');
 for(const rel of ['README.md','PLAN.md','LICENSE',pkg.main,
   pkg.icon,pkg.contributes.viewsContainers.activitybar[0].icon,'media/readme-logo.png']) {
   assert.ok(fs.statSync(path.join(root,rel)).size>0,rel);
 }
 assert.match(read('LICENSE').toString('utf8'),/Copyright \(c\) 2026 ArmoTuSitio/);
 assert.match(read('README.md').toString('utf8'),/Alejandro Daniel Di Stefano/);
});
test('Marketplace icon is a 128x128 PNG and the Activity Bar icon is monochrome SVG',()=>{
 const pkg=JSON.parse(read('package.json').toString('utf8'));
 const png=read(pkg.icon);
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(png.readUInt32BE(16),128);
 assert.equal(png.readUInt32BE(20),128);
 const svg=read(pkg.contributes.viewsContainers.activitybar[0].icon).toString('utf8');
 assert.match(svg,/<svg/);
 assert.match(svg,/currentColor/);
});
test('declared entry points and local source modules have no missing files',()=>{
 const sources=['src/extension.js','src/diagnostics.js','src/versions.js',
   'src/port-owners.js','src/comparison.js','src/messages.js','src/ui.js'];
 for(const rel of sources) assert.ok(fs.existsSync(path.join(root,rel)),rel);
});

test('VSIX ignore excludes local logs and downloaded test copies of VS Code',()=>{
 const ignore=read('.vscodeignore').toString('utf8');
 assert.match(ignore,/logs\.log/);
 assert.match(ignore,/\.vscode-test\/\*\*/);
 assert.match(ignore,/coverage\/\*\*/);
});

test('build inventory excludes development-only scripts and private CI material',()=>{
 const ignore=read('.vscodeignore').toString('utf8');
 assert.match(ignore,/scripts\/\*\*/);
 assert.match(ignore,/\.github\/\*\*/);
 assert.match(ignore,/PLAN\.md/);
});

test('runtime adapters use generated strict TypeScript modules',()=>{
 const src=['messages','versions','comparison','port-owners','i18n'];
 for(const unit of src) {
  const code=read('src/'+unit+'.js').toString('utf8');
  assert.match(code,new RegExp('dist/typed/'+unit));
  assert.ok(fs.existsSync(path.join(root,'dist/typed',unit+'.js')),
    'TypeScript build output missing for '+unit);
 }
});

test('internal governance rulesets cannot enter VSIX',()=>{
 const ignore=read('.vscodeignore').toString('utf8');
 assert.ok(ignore.includes('governance/**'));
});

test('governance files are excluded from distributed VSIX',()=>{
 const ignore=read('.vscodeignore').toString('utf8');
 assert.match(ignore,/config\/\*\*/);
});

test('disposable root-level regression script is excluded from VSIX',()=>{
 const content=read('verify-indizivo.ps1').toString('utf8');
 const ignore=read('.vscodeignore').toString('utf8');
 assert.match(content,/release:check/);
 assert.match(content,/test:coverage/);
 assert.match(content,/logs\.log/);
 assert.match(ignore,/verify-indizivo\.ps1/);
});

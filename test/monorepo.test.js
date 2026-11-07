'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {discoverProjectRoots,isInsideWorkspace}=require('../dist/typed/monorepo');
test('bounded monorepo discovery finds only project roots with manifest evidence',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-monorepo-'));
 try{
  for(const [dir,marker] of [['apps/api','package.json'],['packages/sdk','go.mod'],
   ['apps/empty',null]]){
    const folder=path.join(root,dir);
    await fs.mkdir(folder,{recursive:true});
    if(marker)await fs.writeFile(path.join(folder,marker),'fixture');
  }
  const found=await discoverProjectRoots(root);
  assert.deepEqual(found.map(item=>item.label).sort(),['apps/api','packages/sdk']);
  assert.ok(found.some(item=>item.marker==='go.mod'));
  assert.equal(await isInsideWorkspace(path.join(root,'apps/api'),[root]),true);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('symlinked paths escaping workspace are rejected',async(t)=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-scope-'));
 const outside=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-outside-'));
 try{
  await fs.mkdir(path.join(root,'apps'));
  const link=path.join(root,'apps','external');
  try{await fs.symlink(outside,link,'dir');}catch(error){
    if(['EPERM','EACCES','ENOTSUP'].includes(error.code))return t.skip('Symlink permission unavailable');
    throw error;
  }
  await fs.writeFile(path.join(outside,'package.json'),'{"name":"outside"}');
  assert.equal(await isInsideWorkspace(link,[root]),false);
  assert.deepEqual(await discoverProjectRoots(root),[]);
 }finally{await fs.rm(root,{recursive:true,force:true});await fs.rm(outside,{recursive:true,force:true});}
});

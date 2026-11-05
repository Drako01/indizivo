'use strict';
// Remove stale compiler output before every TypeScript build. Never touch user files.
const fs=require('node:fs');
const path=require('node:path');
const outDir=path.resolve(__dirname,'../dist/typed');
fs.rmSync(outDir,{recursive:true,force:true});
console.log('Indizivo: clean generated dist/typed');

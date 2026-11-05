'use strict';
// Dependency-free, deterministic checks for Indizivo runtime source.
// This is a security hygiene gate, not a replacement for ESLint.
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const names=['extension.js','diagnostics.js','port-owners.js','ui.js','messages.js',
 'versions.js','comparison.js'];
const forbidden=[
 {name:'eval()',pattern:/\beval\s*\(/},
 {name:'dynamic Function()',pattern:/\bnew\s+Function\s*\(/},
 {name:'shell:true',pattern:/\bshell\s*:\s*true\b/},
 {name:'exec() shell',pattern:/\brequire\(['"]node:child_process['"]\)\.exec\s*\(/},
 {name:'unsafe HTML injection',pattern:/\.innerHTML\s*=/}
];
let issues=0;
for(const name of names){
 const full=path.join(root,'src',name);
 const code=fs.readFileSync(full,'utf8');
 if(code.length>100000){console.error(name+': file is unexpectedly large');issues++;}
 for(const rule of forbidden) {
  if(rule.pattern.test(code)){console.error(name+': forbidden '+rule.name);issues++;}
 }
}
const pkg=require(path.join(root,'package.json'));
if(Object.keys(pkg.dependencies||{}).length) {
 console.error('Unexpected runtime dependencies; review and allow explicitly');issues++;
}
if(issues){console.error('Indizivo hygiene: FAIL ('+issues+')');process.exitCode=1;}
else console.log('Indizivo security hygiene: PASS');

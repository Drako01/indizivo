'use strict';
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'../src/typed');
const files=fs.readdirSync(root).filter(x=>x.endsWith('.ts'));
let issues=[];
for(const file of files){
 const content=fs.readFileSync(path.join(root,file),'utf8');
 const source=ts.createSourceFile(file,content,ts.ScriptTarget.ES2022,true,ts.ScriptKind.TS);
 if(source.parseDiagnostics.length) {
  for(const d of source.parseDiagnostics)issues.push(file+': '+ts.flattenDiagnosticMessageText(d.messageText,' '));
 }
 if(/@ts-ignore|@ts-nocheck/.test(content))issues.push(file+': unreviewed TypeScript suppression');
 function inspect(node) {
  if(node.kind===ts.SyntaxKind.AnyKeyword)issues.push(file+': explicit any type is forbidden');
  if(ts.isNonNullExpression(node))issues.push(file+': unchecked non-null assertion');
  ts.forEachChild(node,inspect);
 }
 inspect(source);
}
if(issues.length) {
 for(const issue of issues)console.error(issue);
 console.error('Typed contract lint: FAIL '+issues.length);
 process.exitCode=1;
}else console.log('Typed contract lint: PASS ('+files.length+' files)');

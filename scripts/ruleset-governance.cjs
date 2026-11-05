#!/usr/bin/env node
'use strict';
// Dry-run by default. The GitHub connector intentionally cannot edit rulesets.
// Requires GitHub CLI authenticated as a repository administrator for --apply.
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const repo='Drako01/indizivo';
const root=path.resolve(__dirname,'../governance/rulesets');
const files=['protect-main.json','protect-release-tags.json'];
function loadRules() {
  return files.map(file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8')));
}
function validate(rules) {
  if(!Array.isArray(rules)||rules.length!==2)throw new Error('Two rulesets required');
  for(const x of rules){
    if(x.enforcement!=='disabled')throw new Error('Rulesets must be staged disabled');
    if(!['branch','tag'].includes(x.target))throw new Error('Unsupported target');
    if(!Array.isArray(x.rules)||!x.rules.length)throw new Error('Empty ruleset');
  }
  const main=rules.find(x=>x.name==='Protect main');
  const tags=rules.find(x=>x.name==='Protect release tags');
  if(!main || !tags)throw new Error('Ruleset names mismatch');
  if(!main.rules.some(x=>x.type==='pull_request') ||
     !main.rules.some(x=>x.type==='required_status_checks') ||
     !tags.rules.some(x=>x.type==='deletion'))throw new Error('Required protections missing');
  return rules;
}
function runGh(args,input) {
  return execFileSync('gh',args,{encoding:'utf8',input,timeout:20000,windowsHide:true,stdio:['pipe','pipe','pipe']});
}
function main(args=process.argv.slice(2)){
 const rules=validate(loadRules());
 const apply=args.includes('--apply');
 console.log(JSON.stringify({repository:repo,mode:apply?'create disabled rulesets':'dry-run',
   rulesets:rules.map(x=>({name:x.name,target:x.target,enforcement:x.enforcement,
     types:x.rules.map(y=>y.type)}))},null,2));
 if(!apply){console.log('No GitHub API writes. Pass --apply and explicit authorization to stage rulesets.');return;}
 if(process.env.INDIZIVO_RULESETS_APPLY!=='YES')throw new Error('Set INDIZIVO_RULESETS_APPLY=YES and rerun --apply');
 const existing=JSON.parse(runGh(['api','repos/'+repo+'/rulesets']));
 if(!Array.isArray(existing))throw new Error('Unexpected GitHub API response');
 for(const r of rules){
   if(existing.some(item=>item.name===r.name))throw new Error('Ruleset '+r.name+' already exists; inspect before updating');
 }
 // Create disabled rulesets only. Activation must be a separate manual UI/API action.
 for(const rule of rules){
   runGh(['api','--method','POST','repos/'+repo+'/rulesets','--input','-'],JSON.stringify(rule));
   console.log('Created DISABLED ruleset: '+rule.name);
 }
}
if(require.main===module){
 try{main();}catch(error){console.error('Ruleset setup failed:',error.message);process.exitCode=1;}
}
module.exports={loadRules,validate};

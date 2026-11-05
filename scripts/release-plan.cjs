'use strict';
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');

function parseVersion(raw){
 if(typeof raw!=='string'||!/^\d+\.\d+\.\d+$/.test(raw)) throw new Error('Release requires major.minor.patch version');
 return raw.split('.').map(Number);
}

function compareVersions(a,b){
 const lhs=parseVersion(a),rhs=parseVersion(b);
 for(let i=0;i<3;i++){
  if(lhs[i]!==rhs[i]) return lhs[i]>rhs[i]?1:-1;
 }
 return 0;
}

function getPlan({event,ref,version,previousVersion,enabled,confirmed}){
 parseVersion(version);
 if(ref!=='refs/heads/main') throw new Error('Only main may publish');
 if(event!=='push'&&event!=='workflow_dispatch') throw new Error('Unsupported release trigger');
 if(event==='push'){
  if(!previousVersion) throw new Error('Missing first-parent version for push release');
  const order=compareVersions(version,previousVersion);
  if(order<0) throw new Error('Cannot release a version downgrade');
  return {version,publish:enabled==='true'&&order>0,reason:order===0?'Version unchanged':enabled!=='true'?'Release switch disabled':'Version increased'};
 }
 return {version,publish:enabled==='true'&&confirmed==='true',reason:enabled!=='true'?'Release switch disabled':confirmed!=='true'?'Manual confirmation not granted':'Approved manual run'};
}

function main(){
 const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
 const lock=JSON.parse(fs.readFileSync('package-lock.json','utf8'));
 if(pkg.name!=='indizivo'||pkg.publisher!=='armotusitio') throw new Error('Unexpected extension identity');
 if(lock.version!==pkg.version||lock.packages?.['']?.version!==pkg.version) throw new Error('Package lock version does not match extension version');
 const event=process.env.RELEASE_EVENT;
 let previousVersion;
 if(event==='push'){
  const prev=execFileSync('git',['show','HEAD^:package.json'],{encoding:'utf8',timeout:10000});
  previousVersion=JSON.parse(prev).version;
 }
 const plan=getPlan({event,ref:process.env.RELEASE_REF,version:pkg.version,
  previousVersion,enabled:process.env.RELEASE_ENABLED,confirmed:process.env.RELEASE_CONFIRMED});
 process.stdout.write('publish='+String(plan.publish)+'\nversion='+plan.version+'\n');
 process.stderr.write('Indizivo '+plan.version+': publish='+String(plan.publish)+' ('+plan.reason+')\n');
}

if(require.main===module){
 try{main()}catch(error){console.error('Release plan refused: '+error.message);process.exitCode=1}
}
module.exports={parseVersion,compareVersions,getPlan};

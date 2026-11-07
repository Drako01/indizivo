'use strict';
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {performance}=require('node:perf_hooks');
const {diagnose}=require('../src/diagnostics');

function percentile(list,p){
 const sorted=[...list].sort((a,b)=>a-b);
 if(!sorted.length)return 0;
 return sorted[Math.max(0,Math.ceil((p/100)*sorted.length)-1)];
}
async function main(){
 const rounds=Math.max(3,Math.min(50,Number(process.env.INDIZIVO_BENCH_RUNS)||25));
 const profile=['small','medium','large'].includes(process.env.INDIZIVO_BENCH_PROFILE)?
  process.env.INDIZIVO_BENCH_PROFILE:'small';
 // Optional read-only measurement of a real project: only version probes and
 // bounded file reads run; the directory is never modified or deleted.
 const external=process.env.INDIZIVO_BENCH_ROOT?path.resolve(process.env.INDIZIVO_BENCH_ROOT):'';
 const folder=external||await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-benchmark-'));
 let findings=0,count=0,ports=0,deps=0;
 try{
 if(!external){
   count=profile==='large'?100:profile==='medium'?25:2;
   ports=profile==='large'?12:profile==='medium'?5:1;
   deps=profile==='large'?250:profile==='medium'?80:0;
   const scripts=Object.fromEntries(Array.from({length:ports},(_,i)=>[
     'dev-'+i,'next dev --port '+(32940+i)
   ]));
   const dependencies=Object.fromEntries(Array.from({length:deps},(_,i)=>[
     'fixture-package-'+i,'1.0.0'
   ]));
   await fs.writeFile(path.join(folder,'package.json'),JSON.stringify({
     name:'synthetic-indizivo-benchmark',scripts,dependencies,
     engines:{node:'>=20'},packageManager:'npm@11.0.0'
   }));
   const keys=Array.from({length:count},(_,i)=>'SYNTHETIC_KEY_'+i+'=placeholder');
   await fs.writeFile(path.join(folder,'.env.example'),keys.join('\n')+'\n');
   await fs.writeFile(path.join(folder,'.env'),keys.slice(0,Math.max(1,count-2)).join('\n')+'\n');
   if(profile==='large'){
     await fs.writeFile(path.join(folder,'go.mod'),
       'module example.org/indizivo-benchmark\ngo 1.23\ntoolchain go1.24.0\n');
     await fs.writeFile(path.join(folder,'pyproject.toml'),
       '[project]\nname="indizivo-benchmark"\n');
     await fs.writeFile(path.join(folder,'Dockerfile'),'FROM scratch\n');
   }
 }
   const elapsed=[];
   let peakRss=process.memoryUsage().rss;
   for(let i=0;i<rounds;i++){
     const started=performance.now();
     const session=await diagnose(folder,1200);
     elapsed.push(performance.now()-started);
     if(session.state!=='completed')throw new Error('Benchmark diagnosis did not complete');
     findings=session.checks.length;
     peakRss=Math.max(peakRss,process.memoryUsage().rss);
   }
   const result={
     schemaVersion:1,kind:external?'real-project-local-benchmark':'synthetic-local-benchmark',findings,
     platform:process.platform,arch:process.arch,
     node:process.version,rounds,profile:external?'external':profile,
     ...(external?{}:{declaredPorts:ports,fixtureEnvNames:count,fixtureDependencies:deps}),
     minMs:Math.min(...elapsed).toFixed(1),p50Ms:percentile(elapsed,50).toFixed(1),
     p95Ms:percentile(elapsed,95).toFixed(1),
     maxMs:Math.max(...elapsed).toFixed(1),
     peakRssMiB:(peakRss/1048576).toFixed(1),
     limitation:external?'One real local project on one machine; not a customer SLO. Project name is intentionally omitted.':'Synthetic local fixture only, not a customer benchmark; runtime version probe and port check included.'
   };
   console.log(JSON.stringify(result,null,process.env.INDIZIVO_BENCH_JSONL==='1'?0:2));
 }finally{if(!external)await fs.rm(folder,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e);process.exitCode=1;});

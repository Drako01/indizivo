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
 const rounds=Math.max(3,Math.min(50,Number(process.env.INDIZIVO_BENCH_RUNS)||8));
 const folder=await fs.mkdtemp(path.join(os.tmpdir(),'indizivo-benchmark-'));
 try{
   await fs.writeFile(path.join(folder,'package.json'),JSON.stringify({
     name:'synthetic-indizivo-benchmark',scripts:{dev:'next dev --port 32997'},
     engines:{node:'>=20'}
   }));
   await fs.writeFile(path.join(folder,'.env.example'),'API_KEY=synthetic\nPORT=32997');
   await fs.writeFile(path.join(folder,'.env'),'PORT=32997');
   const elapsed=[];
   let peakRss=process.memoryUsage().rss;
   for(let i=0;i<rounds;i++){
     const started=performance.now();
     const session=await diagnose(folder,1200);
     elapsed.push(performance.now()-started);
     if(session.state!=='completed')throw new Error('Synthetic diagnosis did not complete');
     peakRss=Math.max(peakRss,process.memoryUsage().rss);
   }
   const result={
     schemaVersion:1,kind:'synthetic-local-benchmark',
     platform:process.platform,arch:process.arch,
     node:process.version,rounds,
     minMs:Math.min(...elapsed).toFixed(1),p50Ms:percentile(elapsed,50).toFixed(1),
     p95Ms:percentile(elapsed,95).toFixed(1),
     maxMs:Math.max(...elapsed).toFixed(1),
     peakRssMiB:(peakRss/1048576).toFixed(1),
     limitation:'Synthetic local fixture only, not a customer benchmark; runtime version probe and port check included.'
   };
   console.log(JSON.stringify(result,null,2));
 }finally{await fs.rm(folder,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e);process.exitCode=1;});

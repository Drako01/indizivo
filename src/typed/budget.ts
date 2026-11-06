import {performance} from 'node:perf_hooks';

export class DiagnosticBudgetExhausted extends Error {
 constructor(){super('Diagnostic time budget exhausted');this.name='DiagnosticBudgetExhausted';}
}
/**
 * One monotonic deadline for a complete diagnostic run, independent of the
 * number of detected ports, toolchains and optional checks.
 */
export class DiagnosticBudget {
 private readonly until:number;
 private readonly now:()=>number;
 constructor(limitMs:number,now:()=>number=()=>performance.now()){
  this.now=now;
  this.until=now()+Math.min(45000,Math.max(2000,Math.floor(limitMs)));
 }
 remaining(preferredMs:number):number {
  const left=Math.floor(this.until-this.now());
  if(left<400)throw new DiagnosticBudgetExhausted();
  return Math.max(400,Math.min(10000,Math.floor(preferredMs),left));
 }
}

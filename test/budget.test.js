'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {DiagnosticBudget,DiagnosticBudgetExhausted}=require('../dist/typed/budget');
test('a shared monotonic deadline caps the remaining time for every probe',()=>{
 let clock=1000;
 const budget=new DiagnosticBudget(3000,()=>clock);
 assert.equal(budget.remaining(2500),2500);
 clock=2800;
 assert.equal(budget.remaining(2500),1200);
 clock=3650;
 assert.throws(()=>budget.remaining(2500),DiagnosticBudgetExhausted);
});
test('per-probe timeouts are bounded independently from the whole run',()=>{
 const budget=new DiagnosticBudget(60000,()=>0);
 assert.equal(budget.remaining(15000),10000);
 assert.equal(budget.remaining(400),400);
});

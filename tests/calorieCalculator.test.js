import test from 'node:test';import assert from 'node:assert/strict'
import {calcExercise,toKg,fromKg,exerciseKind,upsertRecord,totalKcal,migrateRecord} from '../src/utils/calorieCalculator.js'
import {LIB} from '../src/exercises.js'
const ex=n=>LIB.find(e=>e[0]===n),sets=[13,15,18].map(r=>({r,w:toKg(20,'lb'),done:true}))
const run=(o={})=>calcExercise({name:'Incline Dumbbell Press',kind:'strength',met:5,bwKg:70,sets,perDumbbell:true,...o})
test('A multi-set aggregation',()=>{const r=run();assert.equal(r.reps,46);assert.equal(r.doneSets,3);assert.ok(r.kcal>0)})
test('B body weight changes estimate',()=>assert.ok(run({bwKg:90}).kcal>run({bwKg:60}).kcal))
test('C unit conversion',()=>{assert.ok(Math.abs(toKg(44.0924,'lb')-20)<.01);assert.ok(Math.abs(fromKg(20,'lb')-44.0924)<.01);const a=run({sets:[{r:10,w:20,done:true}]}),b=run({sets:[{r:10,w:toKg(44.0924,'lb'),done:true}]});assert.ok(Math.abs(a.kcal-b.kcal)<.01)})
test('D pathways',()=>{assert.equal(exerciseKind(ex('Incline Dumbbell Press')),'strength');assert.equal(exerciseKind(ex('Plank')),'timed');assert.equal(exerciseKind(ex('Running')),'cardio')
 const p=calcExercise({kind:'timed',met:3.3,bwKg:70,sets:[{sec:60,done:true}]});assert.ok(Math.abs(p.kcal-3.3*3.5*70/200)<1e-9)
 const r=calcExercise({kind:'cardio',met:9.8,bwKg:70,min:30});assert.ok(Math.abs(r.kcal-9.8*3.5*70/200*30)<1e-9)})
test('E incomplete sets ignored',()=>{const x=run({sets:[...sets,{r:20,w:20,done:false}]});assert.equal(x.kcal,run().kcal);assert.equal(x.doneSets,3)})
test('F editing replaces, never duplicates',()=>{const l=[{id:'a',est:{kcal:10}},{id:'b',est:{kcal:5}}],n=upsertRecord(l,{id:'a',est:{kcal:20}});assert.equal(n.length,2);assert.equal(totalKcal(n),25);assert.equal(n[1].est.kcal,5)
 const old=migrateRecord({id:'z',ex:'Push-ups',d:'2026-01-01',sets:[{r:10,w:0}],u:'kg'},ex('Push-ups'),70);assert.equal(old.sets[0].done,true);assert.equal(migrateRecord(old,ex('Push-ups'),99).est.bw,70)})
test('G invalid input',()=>{const x=run({sets:[{r:-5,w:-20,done:true},{r:'abc',w:'x',done:true}]});assert.equal(x.kcal,0);assert.equal(run({bwKg:0}).kcal,null);assert.equal(run({bwKg:0}).status,'no-bodyweight');assert.equal(toKg(-3,'kg'),0);assert.ok(Number.isFinite(run({sets:[{r:1e9,w:1e9,done:true}]}).kcal))})

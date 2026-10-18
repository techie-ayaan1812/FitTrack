// FitTrack calorie estimator. All formulas live here (no calorie maths in components).
// VALIDATED: kcal/min = MET x 3.5 x bodyweight(kg) / 200 (standard MET formula).
// HEURISTIC (not scientifically validated, bounded, easy to calibrate): active time per rep and the load factor below.
export const MODEL_VERSION='2.0'
export const LB_PER_KG=2.20462
export const DEFAULT_SEC_PER_REP=3 // active seconds per rep; override per exercise below
export const SEC_PER_REP={'Jump Squat':2,'Box Jump':2,'Power Clean':2,'Hang Clean':2,'Clean and Jerk':2,'Snatch':2,'Plyometric Push-ups':2,'Kettlebell Swing':2,'Push Press':2.5,'Mountain Climbers':1.5}
export const BW_FRACTION=0.65 // share of body mass assumed moved in bodyweight exercises
export const FACTOR_MIN=0.85,FACTOR_MAX=1.3
const TIMED=/^(Plank|Side Plank|Reverse Plank|Long-Lever Plank|Weighted Plank|Copenhagen Plank|Wall Sit|Dead Hang|Hollow Hold|Superman Hold|Glute Bridge Hold|Cat-Cow)$/
const NOT_DB=/Cable|Machine|Plate|Barbell|Smith|Landmine|Band/
const IS_DB=/Dumbbell|Hammer Curl|Lateral Raise|Front Raise|Arnold|Zottman|Concentration|Reverse Fly|Kickback/
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v))
const num=v=>{v=+v;return Number.isFinite(v)&&v>0?v:0}
export const toKg=(v,u)=>u==='lb'?num(v)/LB_PER_KG:num(v)
export const fromKg=(kg,u)=>u==='lb'?num(kg)*LB_PER_KG:num(kg)
export const isDumbbell=n=>IS_DB.test(n)&&!NOT_DB.test(n)
// e = exercise tuple [name, category, MET, 's'|'c', subgroup, isBodyweight]
export const exerciseKind=e=>e[3]==='c'?'cardio':TIMED.test(e[0])?'timed':'strength'
export const kcalPerMin=(met,bwKg)=>num(met)*3.5*num(bwKg)/200
// Bounded 0.85-1.30 multiplier. Inputs: relative intensity (1RM, else RPE/reps-to-failure estimate) and load relative to body weight.
export function loadFactor({reps,effLoadKg,bwKg,rpe,oneRmKg}){
 const pct=num(oneRmKg)?clamp(effLoadKg/oneRmKg,0,1):1/(1+(reps+(rpe>=5&&rpe<=10?10-rpe:0))/30)
 return clamp(.85+.25*pct+.2*clamp(effLoadKg/bwKg,0,1.5)/1.5,FACTOR_MIN,FACTOR_MAX)}
export function calcExercise({name='',kind,met,bwKg,sets=[],bwExercise=false,perDumbbell=false,min=0,intensity='m',oneRmKg}){
 const bw=num(bwKg),m=num(met),o={kcal:0,doneSets:0,reps:0,volumeKg:0,seconds:0,factor:1,met:m,bw,v:MODEL_VERSION,status:'ok'}
 if(!bw)return{...o,kcal:null,status:'no-bodyweight'}
 if(!m)return{...o,kcal:null,status:'no-met'}
 const pm=kcalPerMin(m,bw)
 if(kind==='cardio'){const mm=num(min);o.seconds=mm*60;o.kcal=pm*mm*({l:.85,m:1,h:1.15}[intensity]||1);return o}
 let fs=0;const spr=SEC_PER_REP[name]||DEFAULT_SEC_PER_REP
 for(const s of sets){if(!s||s.done===false)continue
  if(kind==='timed'){const sec=num(s.sec);if(!sec)continue;o.doneSets++;o.seconds+=sec;o.kcal+=pm*sec/60;continue}
  const r=Math.floor(num(s.r));if(!r)continue
  const ext=num(s.w)*(perDumbbell?2:1),f=loadFactor({reps:r,effLoadKg:ext+(bwExercise?BW_FRACTION*bw:0),bwKg:bw,rpe:+s.rpe,oneRmKg})
  o.kcal+=pm*(r*spr/60)*f;o.seconds+=r*spr;o.reps+=r;o.volumeKg+=ext*r;fs+=f;o.doneSets++}
 if(kind==='strength'&&o.doneSets)o.factor=fs/o.doneSets
 return o}
export const upsertRecord=(list,rec)=>list.some(x=>x.id===rec.id)?list.map(x=>x.id===rec.id?rec:x):[...list,rec]
export const totalKcal=list=>list.reduce((a,k)=>a+(k?.est?.kcal||0),0)
// Backward-compatible migration: keeps original fields, adds est (audit snapshot) once. Never recomputed on load.
export function migrateRecord(k,e,bwKg){
 if(k.est)return k
 const kind=exerciseKind(e),bwEx=!!e[5]
 if(Array.isArray(k.sets)&&kind==='strength'){const sets=k.sets.map(s=>({...s,done:s.done!==false}));return{...k,kind,sets,u:k.u||'kg',wmode:'total',bwEx,est:calcExercise({name:k.ex,kind,met:e[2],bwKg,sets,bwExercise:bwEx})}}
 return{...k,kind:'cardio',est:{...calcExercise({kind:'cardio',met:e[2],bwKg,min:k.min,intensity:k.i}),status:'legacy'}}}

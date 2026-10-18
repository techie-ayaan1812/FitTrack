// Builds a clean PDF from the user's saved data only. Nothing is invented; empty sections say so.
import {fromKg,LB_PER_KG} from './calorieCalculator.js'
const hm=m=>Math.floor(m/60)+'h '+String(Math.round(m%60)).padStart(2,'0')+'m'
const sdur=s=>{const[a,b]=[s.b,s.e].map(t=>+t.slice(0,2)*60+ +t.slice(3));return(b-a+1440)%1440}
const det=k=>k.kind!=='cardio'&&k.sets?.length?k.sets.map(x=>(x.sec?x.sec+'s':x.r+' x '+(x.w?Math.round(fromKg(x.w,k.u))+k.u:'BW'))+(x.done===false?' (planned)':'')).join(', '):`${k.min||0} min${k.di?' · '+k.di+' km':''}`
const byDesc=(a,b)=>a.d<b.d?1:-1
export async function buildReport(S,save=true){
 const {jsPDF}=await import('jspdf'),at=(await import('jspdf-autotable')).default
 const doc=new jsPDF({unit:'pt',format:'a4'}),W=doc.internal.pageSize.getWidth(),H=doc.internal.pageSize.getHeight(),p=S.p,u=p.u
 const NAVY=[26,51,74],TEAL=[24,163,183],GREY=[100,116,130],wt=kg=>fromKg(kg,u).toFixed(1)+' '+u,diff=d=>(d>0?'+':'')+(u==='lb'?d*LB_PER_KG:d).toFixed(1)+' '+u
 const now=new Date(),today=now.toLocaleDateString('en-CA'),b=new Date(p.dob+'T00:00')
 let ay=now.getFullYear()-b.getFullYear(),am=now.getMonth()-b.getMonth();if(now.getDate()<b.getDate())am--;if(am<0){ay--;am+=12}
 const fd=Math.floor((new Date(today+'T00:00')-new Date(p.d0+'T00:00'))/864e5)
 const sw=[...S.w].sort((a,b)=>a.d<b.d?-1:1),cw=sw.length?sw.at(-1).kg:p.w0
 const kcal=S.k.reduce((a,k)=>a+(k.est?.kcal||0),0),sets=S.k.reduce((a,k)=>a+(k.est?.doneSets||0),0)
 const days={};S.st.forEach(x=>days[x.d]=(days[x.d]||0)+x.n);const stDays=Object.entries(days).map(([d,n])=>({d,n})).sort(byDesc),stTotal=stDays.reduce((a,x)=>a+x.n,0)
 const nights=S.s.filter(s=>!s.nap),avgSl=nights.length?nights.reduce((a,s)=>a+sdur(s),0)/nights.length:0
 // header
 doc.setFillColor(...NAVY);doc.rect(0,0,W,118,'F');doc.setFillColor(39,230,236);doc.rect(0,118,W,4,'F')
 doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(39,230,236);doc.text('FITTRACK',40,40)
 doc.setTextColor(255);doc.setFontSize(26);doc.text(p.name,40,78);doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(190,215,230)
 doc.text(`Personal fitness report  ·  Fitness Day ${fd}  ·  Age ${ay}y ${am}m`,40,100);doc.text('Generated '+now.toLocaleDateString('en',{day:'numeric',month:'long',year:'numeric'}),W-40,40,{align:'right'})
 // stat boxes
 const boxes=[[S.k.length,'Workouts logged'],[Math.round(kcal).toLocaleString(),'Est. exercise kcal'],[stTotal.toLocaleString(),`Steps (${stDays.length} days)`],[avgSl?hm(avgSl):'—','Avg. sleep']],bw=(W-80-30)/4
 boxes.forEach(([v,l],i)=>{const x=40+i*(bw+10);doc.setFillColor(238,246,250);doc.setDrawColor(24,163,183);doc.roundedRect(x,142,bw,58,8,8,'FD');doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(18);doc.text(String(v),x+bw/2,168,{align:'center'});doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(...GREY);doc.text(l,x+bw/2,186,{align:'center'})})
 const opt={margin:{left:40,right:40,bottom:50},styles:{fontSize:9,cellPadding:5,textColor:[30,45,60]},headStyles:{fillColor:NAVY,textColor:255},alternateRowStyles:{fillColor:[243,248,251]}}
 let y=222
 const title=t=>{if(y>H-120){doc.addPage();y=50}doc.setFont('helvetica','bold');doc.setFontSize(13);doc.setTextColor(...NAVY);doc.text(t,40,y);doc.setDrawColor(...TEAL);doc.setLineWidth(1.5);doc.line(40,y+5,70,y+5);y+=16}
 const table=(t,head,body,o={})=>{title(t);if(!body.length){doc.setFont('helvetica','italic');doc.setFontSize(9);doc.setTextColor(...GREY);doc.text('No entries recorded yet.',40,y+12);y+=34;return}at(doc,{...opt,...o,startY:y,head:[head],body});y=doc.lastAutoTable.finalY+24}
 table('Profile',['Item','Value'],[['Date of birth',p.dob+`  (age ${ay}y ${am}m)`],['Fitness Day 0',`${p.d0}  (today is Day ${fd})`],['Day 0 weight',wt(p.w0)],['Current weight',wt(cw)+`  (${diff(cw-p.w0)} since Day 0)`],['Height',p.h+' cm'],['Preferred unit',u],['Daily targets',`${p.goal||300} kcal · ${(p.stepGoal||10000).toLocaleString()} steps`]],{columnStyles:{0:{fontStyle:'bold',cellWidth:130}}})
 table('Weight history',['Date','Weight','Change vs Day 0'],[[p.d0+' (Day 0)',wt(p.w0),'—'],...sw.map(w=>[w.d,wt(w.kg),diff(w.kg-p.w0)])])
 table(`Workouts (${S.k.length}, ${sets} completed sets)`,['Date','Exercise','Details','Est. kcal'],[...S.k].sort(byDesc).map(k=>[k.d,k.ex,det(k),k.est?.kcal==null?'—':Math.round(k.est.kcal)]),{columnStyles:{2:{cellWidth:215},3:{halign:'right',cellWidth:55}}})
 table('Steps by day',['Date','Steps'],stDays.map(x=>[x.d,x.n.toLocaleString()]),{columnStyles:{1:{halign:'right'}}})
 table('Sleep and naps',['Date','Type','Time','Duration','Quality'],[...S.s].sort(byDesc).map(s=>[s.d,s.nap?'Nap':'Sleep',s.b+' – '+s.e,hm(sdur(s)),s.q+'/5'])) 
 const n=doc.getNumberOfPages();for(let i=1;i<=n;i++){doc.setPage(i);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(...GREY);doc.text('Calories and recovery are estimates, not measurements. Data is stored only in your browser.',40,H-24);doc.text(`Page ${i} of ${n}`,W-40,H-24,{align:'right'})}
 if(save)doc.save(`FitTrack-Report-${today}.pdf`);return doc}

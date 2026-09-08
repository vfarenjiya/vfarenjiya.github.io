/* ============ GATE-PATTERN MOCK TEST ENGINE v3 (clean) ============ */
(function(){
if(typeof state==='undefined') return;
if(window.__MOCK_V3) return; window.__MOCK_V3=true;
state.mock = state.mock || {best:0,bestRatio:0,plays:0,history:[],saved:null};
let MK=null;
const MCQ_SRC=(typeof MCQS!=='undefined'&&Array.isArray(MCQS))?MCQS:[];
const NAT_SRC=(typeof NATS!=='undefined'&&Array.isArray(NATS))?NATS:[];

window.pool=function(){
  const c=[];
  const F=(typeof FORMULAS!=='undefined'?FORMULAS:[]);
  const FL=(typeof FLASH!=='undefined'?FLASH:[]);
  F.forEach((f,i)=>c.push({type:'formula',s:f.s,title:f.t,tex:f.f,note:f.n,id:'F'+i}));
  TOPICS.forEach(t=>{if(t.f)c.push({type:'formula',s:t.s,title:t.t,tex:t.f,id:'T'+t.id})});
  FL.forEach((f,i)=>c.push({type:'flash',s:SUBJ[f.s],q:f.q,a:f.a,id:'R'+i}));
  MCQ_SRC.forEach((m,i)=>c.push({type:'quiz',s:SUBJ[m.s],q:m.q,opts:m.o,a:m.a,id:'Q'+i}));
  NAT_SRC.forEach((n,i)=>c.push({type:'nat',s:SUBJ[n.s],q:n.q,a:n.a,id:'N'+i}));
  return c;
};

(function inject(){
  if(document.getElementById('view-mock')) return;
  const svg='<svg viewBox="0 0 24 24"><path d="M4 19.5V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13.5"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M9 8h6M9 12h4"/></svg>';
  document.querySelectorAll('.bottomnav, .sidebar').forEach(nav=>{
    const b=document.createElement('button');
    b.className='navitem'; b.dataset.tab='mock';
    b.innerHTML=svg+(nav.classList.contains('sidebar')?'<span>Mock</span>':'');
    nav.appendChild(b);
    b.onclick=()=>showTab('mock');
  });
  const sec=document.createElement('section');
  sec.id='view-mock'; sec.className='tabview hidden';
  document.querySelector('.main').appendChild(sec);
  if(typeof window.showTab==='function'){
    const _st=window.showTab;
    window.showTab=function(t){
      const mv=document.getElementById('view-mock');
      if(t==='mock'){ showMock(); return; }
      if(mv) mv.classList.add('hidden');
      return _st(t);
    };
  }
})();

function showMock(){
  ['home','search','arena','reels','profile'].forEach(v=>{const e=document.getElementById('view-'+v);if(e)e.classList.add('hidden')});
  document.getElementById('view-mock').classList.remove('hidden');
  document.querySelectorAll('.navitem').forEach(b=>b.classList.toggle('on',b.dataset.tab==='mock'));
  renderMockHome(); window.scrollTo(0,0);
}

/* FIX: subject stored as CODE (SUBJ[m.s]) so results/drill/radar all agree */
function buildMock(full){
  const mcq=shuffle(MCQ_SRC.map(m=>({nat:false,q:m.q,o:m.o,a:m.a,s:SUBJ[m.s]})));
  const nat=shuffle(NAT_SRC.map(n=>({nat:true,q:n.q,a:n.a,s:SUBJ[n.s]})));
  const tgt=full?{n1:25,n2:30,t:180}:{n1:15,n2:10,t:40};
  const qs=[]; let mi=0,ni=0;
  const take=()=>{if(mi<mcq.length&&(qs.length%2===0||ni>=nat.length))return mcq[mi++];if(ni<nat.length)return nat[ni++];if(mi<mcq.length)return mcq[mi++];return null};
  for(let i=0;i<tgt.n1;i++){const b=take();if(b)qs.push(Object.assign({},b,{marks:1}))}
  for(let i=0;i<tgt.n2;i++){const b=take();if(b)qs.push(Object.assign({},b,{marks:2}))}
  shuffle(qs);
  qs.forEach(q=>{q.answered=false;q.marked=false;q.visited=false;q.resp=null});
  return {qs,secs:tgt.t*60,i:0,secsUsed:0,full:full,iv:null};
}
const fmtSecs=s=>{const m=Math.floor(s/60),ss=s%60;return (m<10?'0':'')+m+':'+(ss<10?'0':'')+ss};
function runTimer(){
  clearInterval(MK.iv);
  MK.iv=setInterval(()=>{
    MK.secs--; MK.secsUsed++;
    const t=document.getElementById('mkTimer');
    if(t){t.textContent=fmtSecs(MK.secs);t.classList.toggle('low',MK.secs<300)}
    if(MK.secs%10===0)persistMock();
    if(MK.secs<=0){clearInterval(MK.iv);submitMock(true)}
  },1000);
}
function persistMock(){if(!MK)return;state.mock.saved={qs:MK.qs,secs:MK.secs,i:MK.i,full:MK.full,secsUsed:MK.secsUsed};saveState()}
function resumeMock(){const s=state.mock.saved;if(!s||!s.qs||!s.qs.length){state.mock.saved=null;saveState();renderMockHome();return}MK={qs:s.qs,secs:s.secs,i:s.i,full:s.full,secsUsed:s.secsUsed||0,iv:null};runTimer();renderMockRun()}
function startMock(full){
  const test=buildMock(full);
  if(!test.qs.length){toast('Question pool empty — check MCQS/NATS in data.js','⚠️');return}
  MK=test; runTimer(); renderMockRun();
}
const palClass=(x,k)=>(k===MK.i?'cur ':'')+(x.answered&&x.marked?'ansmark':x.marked?'mark':x.answered?'ans':x.visited?'vis':'');
function renderMockRun(){
  const v=document.getElementById('view-mock');
  const q=MK.qs[MK.i];
  if(!q){toast('No question at this index','⚠️');return}
  q.visited=true;
  v.innerHTML='<div class="acard" style="max-width:720px;margin:12px auto">'
    +'<div class="mockbar"><span class="mocktimer" id="mkTimer">'+fmtSecs(MK.secs)+'</span>'
    +'<span class="hint">Q '+(MK.i+1)+'/'+MK.qs.length+' · '+q.marks+' mark'+(q.marks>1?'s':'')+(q.nat?' · NAT (no negative)':' · MCQ (−⅓/−⅔)')+'</span>'
    +'<span style="flex:1"></span><button class="btn ghost" id="mkPalette">Palette</button> <button class="btn" id="mkSubmit">Submit</button></div>'
    +'<div class="palette hidden" id="mkPal">'+MK.qs.map((x,k)=>'<button class="pbtn '+palClass(x,k)+'" data-k="'+k+'">'+(k+1)+'</button>').join('')+'</div>'
    +'<div class="bigq" style="text-align:left">'+parseMathText(q.q)+'</div>'
    +(q.nat?'<div class="natrow"><input id="mkIn" inputmode="decimal" placeholder="numeric answer" value="'+(q.resp==null?'':q.resp)+'"></div>'
           :'<div class="optlist">'+q.o.map((o,k)=>'<button class="qopt'+(q.resp===k?' yes':'')+'" data-k="'+k+'">'+parseMathText(o)+'</button>').join('')+'</div>')
    +'<div class="frow"><button class="btn ghost" id="mkClear">Clear</button> <button class="btn ghost" id="mkMark">Mark & Next</button> <button class="btn" id="mkSave">Save & Next</button></div></div>';
  document.querySelectorAll('#mkPal .pbtn').forEach(b=>b.onclick=()=>{MK.i=+b.dataset.k;renderMockRun()});
  $('mkPalette').onclick=()=>$('mkPal').classList.toggle('hidden');
  $('mkSubmit').onclick=()=>{if(confirm('Submit mock now?'))submitMock(false)};
  document.querySelectorAll('#view-mock .optlist .qopt').forEach(b=>{b.onclick=()=>{q.resp=+b.dataset.k;renderMockRun()}});
  const inp=$('mkIn'); if(inp)inp.addEventListener('input',()=>{q.resp=inp.value});
  $('mkClear').onclick=()=>{q.resp=null;q.answered=false;renderMockRun()};
  $('mkMark').onclick=()=>{if(q.resp!==null&&q.resp!=='')q.answered=true;q.marked=true;goNext()};
  $('mkSave').onclick=()=>{if(q.resp!==null&&q.resp!=='')q.answered=true;goNext()};
}
function goNext(){if(MK.i<MK.qs.length-1){MK.i++;renderMockRun()}else toast('Last question — use palette or Submit','📌')}
function grade(){
  let score=0,max=0,correct=0,wrong=0,unattempt=0; const per={},list=[];
  MK.qs.forEach(q=>{
    max+=q.marks;
    const p=per[q.s]||(per[q.s]={c:0,w:0,u:0,score:0,max:0}); p.max+=q.marks;
    let ok=null;
    if(q.resp===null||q.resp===''){unattempt++;p.u++}
    else if(q.nat){const v=parseFloat(q.resp);ok=!isNaN(v)&&Math.abs(v-q.a)<=0.05}
    else ok=(+q.resp)===q.a;
    if(ok===true){score+=q.marks;p.score+=q.marks;correct++;p.c++}
    else if(ok===false){if(!q.nat){score-=q.marks/3;p.score-=q.marks/3}wrong++;p.w++;list.push(q);state.wrong[q.s]=(state.wrong[q.s]||0)+1}
  });
  return {score:Math.round(score*100)/100,max,correct,wrong,unattempt,per,list};
}
function submitMock(auto){
  clearInterval(MK.iv);
  const g=grade();
  state.mock.plays=(state.mock.plays||0)+1;
  const ratio=g.max?g.score/g.max:0;
  if(ratio>(state.mock.bestRatio||0)){state.mock.bestRatio=ratio;state.mock.best=g.score}
  state.mock.history=(state.mock.history||[]);
  state.mock.history.unshift({d:todayISO(),s:g.score,m:g.max,a:Math.round(g.correct/Math.max(1,g.correct+g.wrong)*100),t:MK.secsUsed});
  state.mock.history=state.mock.history.slice(0,8);
  state.mock.saved=null;
  const xp=Math.max(5,Math.round(Math.max(0,g.score)/2))+(ratio>=0.8?25:0);
  saveState();
  if(typeof openSheet==='function')openSheet(resultsHTML(g,auto),'Mock result');
  const rd=$('resDrill'); if(rd)rd.onclick=()=>{closeSheet();if(typeof startMix==='function'){const w=Object.keys(g.per).sort((a,b)=>(g.per[a].max?g.per[a].score/g.per[a].max:0)-(g.per[b].max?g.per[b].score/g.per[b].max:0))[0];if(w)startMix(w)}};
  const rc=$('resClose'); if(rc)rc.onclick=closeSheet;
  gainXP(xp);
  MK=null;
}
function resultsHTML(g,auto){
  let h='<div class="fs-title">'+(auto?'⏰ Time up!':'📝 Mock result')+'</div>'
    +'<div style="text-align:center;padding:8px 0 14px"><div style="font-size:40px;font-weight:800">'+g.score+' <span class="hint"> / '+g.max+'</span></div>'
    +'<div class="hint">'+Math.round(g.correct/Math.max(1,g.correct+g.wrong)*100)+'% accuracy · '+g.correct+' correct · '+g.wrong+' wrong · '+g.unattempt+' skipped</div></div>';
  h+=Object.keys(g.per).map(s=>{
    const p=g.per[s];
    const meta=SUBJECT_META[s]||{name:'Mixed'};
    const pct=p.max?Math.round(Math.max(0,p.score)/p.max*100):0;
    return '<div class="resrow"><span>'+(EMO[s]||'📌')+'</span><span style="width:110px;font-size:12px">'+meta.name.split(',')[0]+'</span><span class="bar"><i style="width:'+pct+'%"></i></span><span class="hint">'+(Math.round(p.score*10)/10)+'/'+p.max+'</span></div>';
  }).join('');
  h+='<div class="hint" style="margin:12px 0 6px;font-weight:700">Wrong answers</div>';
  h+=g.list.length?g.list.slice(0,8).map(q=>'<div class="def-box" style="font-size:13px"><b>'+q.q+'</b><div class="hint">Correct: '+(q.nat?q.a:q.o[q.a])+'</div></div>').join(''):'<div class="hint">None — clean sheet! 🎉</div>';
  h+='<div class="frow"><button class="btn" id="resDrill">🎯 Drill weakest</button> <button class="btn ghost" id="resClose">Done</button></div>';
  return h;
}
function renderMockHome(){
  const v=document.getElementById('view-mock');
  const best=state.mock.bestRatio?Math.round(state.mock.bestRatio*100):0;
  const last=(state.mock.history||[])[0];
  v.innerHTML='<div class="acard" style="max-width:720px;margin:12px auto"><h3>📝 GATE-pattern Mock Tests</h3>'
    +'<p class="hint">Real marking scheme: MCQ −⅓ (1-mark) / −⅔ (2-mark); NAT no negative. Palette, mark-for-review, auto-save & resume.</p>'
    +'<div class="statgrid" style="margin:10px 0"><div><b>'+best+'%</b><span>best score</span></div><div><b>'+(state.mock.plays||0)+'</b><span>attempts</span></div><div><b>'+(last?last.a+'%':'—')+'</b><span>last accuracy</span></div></div>'
    +(state.mock.saved?'<div class="frow"><button class="btn good" id="mkResume">▶ Resume saved mock</button></div>':'')
    +'<div class="frow"><button class="btn" id="mkQuick">⚡ Quick · 25 Q · 40 min</button> <button class="btn ghost" id="mkFull">📄 Full · 55 Q · 180 min</button></div>'
    +'<div class="hint" style="margin:14px 0 6px;font-weight:700">History</div>'
    +((state.mock.history||[]).length?state.mock.history.map(hh=>'<div class="resrow"><span class="hint">'+hh.d+'</span><span style="flex:1"></span><span>'+hh.s+'/'+hh.m+'</span><span class="hint">'+hh.a+'%</span></div>').join(''):'<div class="hint">No attempts yet.</div>')
    +'</div>';
  const r=$('mkResume'); if(r)r.onclick=resumeMock;
  const qk=$('mkQuick'); if(qk)qk.onclick=()=>startMock(false);
  const fu=$('mkFull'); if(fu)fu.onclick=()=>startMock(true);
}
setTimeout(()=>{const h=document.getElementById('view-home');if(h&&!h.classList.contains('hidden')&&typeof renderHomeMore==='function')renderHomeMore(true)},0);
})();
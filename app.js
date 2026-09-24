/* ================= utils ================= */
const $=id=>document.getElementById(id);
function todayISO(d){ d=d||new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function addDaysISO(iso,n){ const d=new Date(iso+'T00:00:00'); d.setDate(d.getDate()+n); return todayISO(d); }
function fmtShort(d){ return d.toLocaleDateString(undefined,{month:'short',day:'numeric'}); }
function computeStreak(dates){
  if(!dates.length) return 0;
  const set=new Set(dates); let streak=0; let cursor=new Date();
  if(!set.has(todayISO())) cursor.setDate(cursor.getDate()-1);
  while(true){ const iso=todayISO(cursor); if(set.has(iso)){ streak++; cursor.setDate(cursor.getDate()-1); } else break; }
  return streak;
}
const shuffle=a=>{ a=[...a]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const rnd=a=>a[Math.floor(Math.random()*a.length)];

/* ================= state ================= */
let currentFontSize=1, isLightTheme=false, searchQuery='';
let state={
  mode:'track', view:'subject', done:{}, logDates:[], examDate:'', planStart:'',
  openSections:{}, openStudyPanels:{}, isLight:false, fontScale:1, pwaDismissed:false,
  xp:0, coins:0, earned:0, bestStreak:0, mute:false, freeze:false, revive:false,
  quests:{ d:todayISO(), topics:0, reels:0, boss:0, claimed:{} },
  review:[], slain:[], ach:[], formulas:{}, xpHistory:{},
  stats:{ knew:0, bosses:0, nats:0, freezes:0, revives:0 }
};
function loadState(){
  try{
    const res=localStorage.getItem('gate-da-stable-v1');
    if(res){ const p=JSON.parse(res); state={...state,...p}; isLightTheme=!!state.isLight; currentFontSize=state.fontScale||1; }
  }catch(e){}
}
function saveState(){ try{ localStorage.setItem('gate-da-stable-v1', JSON.stringify(state)); }catch(e){} }

/* ================= KaTeX ================= */
function parseMathText(text){
  if(!text) return '';
  if(typeof katex==='undefined') return text;
  text=text.replace(/\$\$([\s\S]*?)\$\$/g,(m,p)=>{ try{ return katex.renderToString(p,{displayMode:true,throwOnError:false}); }catch(e){ return m; } });
  text=text.replace(/\$([^$\n]+?)\$/g,(m,p)=>{ try{ return katex.renderToString(p,{displayMode:false,throwOnError:false}); }catch(e){ return m; } });
  return text;
}
function hashTopic(str){ let h=0; for(let i=0;i<str.length;i++) h=Math.imul(31,h)+str.charCodeAt(i)|0; return Math.abs(h); }
const MATH_DB={};
Object.keys(MATH_DATABASE).forEach(k=>{ MATH_DB[k.toLowerCase().trim()]=MATH_DATABASE[k]; });

function getMathematicalContent(t){
  const title=t.t.toLowerCase().trim();
  const plainTopic=t.t;
  const baseEquation=t.f?'$'+t.f+'$':'the framework metric $f(X)$';
  let def=' ',thm=' ',sub=' ',ctr=' ',viz=' ',ex=' ';
  if(MATH_DB[title]){
    def=MATH_DB[title].def; thm=MATH_DB[title].thm; ctr=MATH_DB[title].ctr; ex=MATH_DB[title].ex;
    sub='<li>Advanced Analytical Edge Cases</li><li>GATE Examination Optimization Rules</li><li>Variational Scope Structures</li>';
  } else {
    const h=hashTopic(title);
    const var1=(h%5)+2, var2=((h>>2)%4)+3, var3=((h>>4)%10)+10, scenario=h%3;
    if(t.s==='ps'){
      def='In stochastic modelling, <strong>'+plainTopic+'</strong> bounds probability mass via: $$'+(t.f||'P(A\\cup B)=P(A)+P(B)-P(A\\cap B)')+'$$';
      thm='<h5>Bounded Variational Limits</h5><p>Under uniform convergence, metrics built on '+plainTopic+' stabilize their means at infinity.</p>';
      ctr='<span class="counter-title">Independence Axiom Collapse</span>Blindly applying '+baseEquation+' with non-zero cross-covariance compounds errors.';
      viz='<table class="math-table"><tr><th>Domain</th><th>Support</th><th>Operator</th></tr><tr><td>Discrete PMF</td><td>$x\\in\\mathbb{Z}$</td><td>$\\Sigma$</td></tr><tr><td>Continuous PDF</td><td>$x\\in\\mathbb{R}$</td><td>$\\int$</td></tr></table>';
      ex='<p><strong>Problem:</strong> Let $X$ have density $f(x)='+var1+'x^{'+(var1-1)+'}$ on $[0,1]$. Compute $\\text{Var}(X)$.</p><p><strong>Solution:</strong> $E[X]=\\frac{'+var1+'}{'+(var1+1)+'}$, $E[X^2]=\\frac{'+var1+'}{'+(var1+2)+'}$, so $\\text{Var}(X)=\\frac{'+var1+'}{'+(var1+2)+'}-\\left(\\frac{'+var1+'}{'+(var1+1)+'}\\right)^2$.</p>';
    } else if(t.s==='la'){
      def='<strong>'+plainTopic+'</strong> maps an operator within $\\mathbb{R}^n$ with structural stability under: $$'+(t.f||'A\\mathbf{x}=\\mathbf{b}')+'$$';
      thm='<h5>Dimension Partition Theorem</h5><p>The row structure mapped by '+plainTopic+' satisfies strict geometric closure.</p>';
      ctr='<span class="counter-title">Nullspace Singularity</span>Assuming invertibility under '+baseEquation+' when rows are rank-deficient collapses dimensions.';
      viz='<table class="math-table"><tr><th>Matrix Type</th><th>Determinant</th><th>Eigenvalues</th></tr><tr><td>Orthogonal</td><td>$\\pm1$</td><td>$|\\lambda|=1$</td></tr><tr><td>Sym. Pos. Def.</td><td>$>0$</td><td>all $\\lambda>0$</td></tr></table>';
      ex='<p><strong>Problem:</strong> A matrix has eigenvalues $\\lambda_1='+var1+'$, $\\lambda_2='+var2+'$. Compute $\\det(A^2)$.</p><p><strong>Solution:</strong> $\\det(A)='+(var1*var2)+'$; $\\det(A^2)='+((var1*var2)**2)+'$.</p>';
    } else if(t.s==='ml'){
      def='<strong>'+plainTopic+'</strong> minimizes a penalty operator: $$'+(t.f||'\\arg\\min_w \\mathcal{L}(y,f(x;w))')+'$$';
      thm='<h5>Loss Boundary Condensation</h5><p>Updates via '+plainTopic+' have convergence bounds controlled by learning constraints.</p>';
      ctr='<span class="counter-title">Overfitting</span>Ignoring regularization when computing '+baseEquation+' pushes parameters into validation failure.';
      viz='<table class="math-table"><tr><th>Penalty</th><th>Formula</th><th>Effect</th></tr><tr><td>L1 (Lasso)</td><td>$\\lambda\\sum|w_i|$</td><td>Sparsity</td></tr><tr><td>L2 (Ridge)</td><td>$\\lambda\\sum w_i^2$</td><td>Shrinkage</td></tr></table>';
      ex='<p><strong>Problem:</strong> Gradient step with $\\eta=0.1$, gradient $[-'+var1+', '+var2+']^T$. Find the weight shift.</p><p><strong>Solution:</strong> $\\Delta w=-\\eta\\nabla J=['+(var1*0.1).toFixed(1)+', -'+(var2*0.1).toFixed(1)+']^T$.</p>';
    } else {
      def='<strong>'+plainTopic+'</strong> is governed by structural complexity criteria: $$'+(t.f||'T(n)=aT(n/b)+\\Theta(n^d)')+'$$';
      thm='<h5>Asymptotic Containment</h5><p>Algorithms around '+plainTopic+' exhibit rigorous execution bounds.</p>';
      ctr='<span class="counter-title">Adversarial Edge Cases</span>Assuming best-case behavior for '+baseEquation+' under adversarial inputs degrades throughput.';
      viz='<table class="math-table"><tr><th>Profile</th><th>Average</th><th>Worst</th></tr><tr><td>Divide &amp; Conquer</td><td>$\\Theta(n \\log n)$</td><td>$O(n^2)$</td></tr><tr><td>Hash Mapping</td><td>$\\Theta(1)$</td><td>$O(n)$</td></tr></table>';
      ex='<p><strong>Problem:</strong> Solve $T(n)='+var1+'T(n/'+var1+')+\\Theta(n)$.</p><p><strong>Solution:</strong> Master theorem: $a=b='+var1+'$, $d=1$, $\\log_b a=1=d$ → Case 2 → $\\Theta(n \\log n)$.</p>';
    }
  }
  const html='<div class="module-header"><h3>'+t.t+'</h3><div class="module-tag">'+SUBJECT_META[t.s].name+'</div></div>'
    +'<div class="study-section"><h4>Formal Definition &amp; Notation</h4><div class="def-box">'+def+'</div></div>'
    +'<div class="study-section"><h4>Theorems &amp; Properties</h4><div class="theorem-box">'+thm+'</div></div>'
    +'<div class="study-section"><h4>Critical Counter-Examples</h4><div class="counter-box">'+ctr+'</div></div>'
    +(viz.trim()!==' '?'<div class="study-section"><h4>Visualizations &amp; Structures</h4>'+viz+'</div>':'')
    +'<div class="study-section"><h4>Advanced Application</h4><div class="example-box">'+ex+'</div></div>'
    +'<div class="study-section"><h4>Extended Scope</h4><ul>'+sub+'</ul></div>';
  return parseMathText(html);
}

/* ================= FX ================= */
const fx=$('fx'); let fctx=null, parts=[], fxOn=false;
function initFx(){ fx.width=innerWidth; fx.height=innerHeight; fctx=fx.getContext('2d'); }
addEventListener('resize',()=>{ if(fctx) initFx(); });
function confetti(n=80){
  if(!fctx) return;
  const cols=['#e8a23d','#35d07f','#5aa9e6','#c792ea','#ff6b46','#f6c445'];
  for(let i=0;i<n;i++) parts.push({x:Math.random()*fx.width,y:-12-Math.random()*40,vx:(Math.random()-.5)*3,vy:2+Math.random()*3.5,s:3+Math.random()*4,c:rnd(cols),r:Math.random()*6.28,vr:(Math.random()-.5)*.3});
  if(!fxOn){ fxOn=true; requestAnimationFrame(fxLoop); }
}
function fxLoop(){
  fctx.clearRect(0,0,fx.width,fx.height);
  parts=parts.filter(p=>p.y<fx.height+20);
  parts.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=.03; p.r+=p.vr; fctx.save(); fctx.translate(p.x,p.y); fctx.rotate(p.r); fctx.fillStyle=p.c; fctx.fillRect(-p.s/2,-p.s/2,p.s,p.s*.6); fctx.restore(); });
  if(parts.length) requestAnimationFrame(fxLoop); else fxOn=false;
}
function toast(msg,icon='🎉'){
  const t=document.createElement('div'); t.className='toast';
  t.innerHTML='<span>'+icon+'</span><b>'+msg+'</b>';
  $('toasts').appendChild(t);
  setTimeout(()=>{ t.classList.add('out'); setTimeout(()=>t.remove(),400); },2600);
}
function floatXP(txt){ const t=document.createElement('div'); t.className='fxp'; t.textContent=txt; document.body.appendChild(t); setTimeout(()=>t.remove(),1200); }
let AC=null;
function tone(f,d,type='sine',v=.15,w=0){
  try{ AC=AC||new (window.AudioContext||window.webkitAudioContext)();
    const o=AC.createOscillator(),g=AC.createGain(); o.type=type; o.frequency.value=f;
    g.gain.setValueAtTime(v,AC.currentTime+w); g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+w+d);
    o.connect(g); g.connect(AC.destination); o.start(AC.currentTime+w); o.stop(AC.currentTime+w+d+.02);
  }catch(e){}
}
function sfx(k){
  if(state.mute) return;
  if(k==='xp') tone(880,.09,'triangle',.12);
  else if(k==='coin'){ tone(1175,.07,'square',.07); tone(1568,.1,'square',.07,.07); }
  else if(k==='wrong') tone(150,.28,'sawtooth',.12);
  else if(k==='level') [523,659,784,1047].forEach((f,i)=>tone(f,.2,'triangle',.14,i*.11));
  else if(k==='ach') [784,988,1319].forEach((f,i)=>tone(f,.16,'sine',.14,i*.1));
  else if(k==='hit'){ tone(320,.08,'square',.1); tone(210,.1,'square',.08,.05); }
  else if(k==='flip') tone(520,.05,'sine',.06);
}

/* ================= XP engine ================= */
const xpNeed=l=>100+(l-1)*60;
function lvlOf(xp){ let l=1,r=xp; while(r>=xpNeed(l)){ r-=xpNeed(l); l++; } return {level:l,rem:r,need:xpNeed(l)}; }
const titleOf=l=>TITLES[Math.min(l-1,TITLES.length-1)];
function touchDay(){ const t=todayISO(); if(!state.logDates.includes(t)) state.logDates.push(t); }
function addCoins(n){ state.coins+=n; state.earned+=n; }
function gainXP(n){
  const before=lvlOf(state.xp).level;
  state.xp+=n; touchDay();
  const t=todayISO(); state.xpHistory[t]=(state.xpHistory[t]||0)+n;
  const after=lvlOf(state.xp).level;
  floatXP('+'+n+' XP');
  if(after>before){ addCoins(20*after); sfx('level'); confetti(150); toast('LEVEL '+after+' — '+titleOf(after)+' · +'+(20*after)+' 🪙',''); }
  else sfx('xp');
  state.bestStreak=Math.max(state.bestStreak||0,computeStreak(state.logDates));
  saveState(); updateHeader(); scanAch();
}
function applyFreeze(){
  const t=todayISO(), y=addDaysISO(t,-1), yy=addDaysISO(t,-2);
  const set=new Set(state.logDates);
  if(!set.has(y)&&set.has(yy)&&state.freeze){
    state.logDates.push(y); state.freeze=false; state.stats.freezes++;
    toast('Streak Freeze consumed — yesterday bridged!','🧊'); saveState();
  }
}

/* quests & shop */
const QUESTS=[
  {id:'topics',icon:'📚',label:'Punch 5 syllabus topics',target:5},
  {id:'reels',icon:'⚡',label:'Ace 5 concept reels',target:5},
  {id:'boss',icon:'⚔️',label:'Land 5 boss hits',target:5}
];
function ensureDay(){ const t=todayISO(); if(state.quests.d!==t){ state.quests={d:t,topics:0,reels:0,boss:0,claimed:{}}; saveState(); } }
function bumpQuest(k){ ensureDay(); state.quests[k]++; saveState(); }
function claimQuest(id){
  ensureDay(); const q=QUESTS.find(x=>x.id===id);
  if(state.quests[id]>=q.target&&!state.quests.claimed[id]){
    state.quests.claimed[id]=true; addCoins(25); gainXP(15); sfx('coin');
    toast('Quest complete! +25 🪙','✅'); saveState(); renderArena();
  }
}
function buyFreeze(){ if(state.freeze)return; if(state.coins>=150){ state.coins-=150; state.freeze=true; sfx('coin'); toast('Streak Freeze armed!','🧊'); saveState(); renderArena(); updateHeader(); } else toast('Not enough coins — keep grinding!','🪙'); }
function buyRevive(){ if(state.revive)return; if(state.coins>=100){ state.coins-=100; state.revive=true; sfx('coin'); toast('Boss Revive armed!','💖'); saveState(); renderArena(); updateHeader(); } else toast('Not enough coins — keep grinding!','🪙'); }

/* achievements */
const doneAll=()=>TOPICS.filter(t=>state.done[t.id]).length;
const knownFormulas=()=>Object.keys(state.formulas).length;
const ACH=[
  {id:'first',i:'✨',n:'First Punch',d:'Check off your first topic',c:()=>doneAll()>=1},
  {id:'t25',i:'📚',n:'Momentum',d:'Complete 25 topics',c:()=>doneAll()>=25},
  {id:'t60',i:'🚛',n:'Freight Train',d:'Complete 60 topics',c:()=>doneAll()>=60},
  {id:'tall',i:'🎓',n:'Syllabus Speedrun',d:'Complete every topic',c:()=>doneAll()>=TOPICS.length},
  {id:'s3',i:'🔥',n:'On Fire',d:'3-day study streak',c:()=>(state.bestStreak||0)>=3},
  {id:'s7',i:'☄️',n:'Unstoppable',d:'7-day study streak',c:()=>(state.bestStreak||0)>=7},
  {id:'l5',i:'🚀',n:'Rising Star',d:'Reach level 5',c:()=>lvlOf(state.xp).level>=5},
  {id:'l10',i:'👑',n:'Royalty',d:'Reach level 10',c:()=>lvlOf(state.xp).level>=10},
  {id:'r50',i:'⚡',n:'Reel Addict',d:'Ace 50 reels',c:()=>state.stats.knew>=50},
  {id:'b1',i:'⚔️',n:'Boss Slayer',d:'Defeat your first boss',c:()=>state.stats.bosses>=1},
  {id:'b7',i:'🏆',n:'Champion of DA',d:'Defeat all 7 bosses',c:()=>state.slain.length>=7},
  {id:'nat5',i:'🔢',n:'Number Cruncher',d:'Solve 5 NAT questions',c:()=>state.stats.nats>=5},
  {id:'x1k',i:'💎',n:'1K Club',d:'Earn 1000 XP',c:()=>state.xp>=1000},
  {id:'rich',i:'🤑',n:'Money Moves',d:'Earn 500 coins lifetime',c:()=>state.earned>=500},
  {id:'frz',i:'🧊',n:'Cold Blooded',d:'Use a Streak Freeze',c:()=>state.stats.freezes>=1},
  {id:'rvv',i:'💖',n:'Second Wind',d:'Use a Boss Revive',c:()=>state.stats.revives>=1},
  {id:'fk25',i:'📐',n:'Formula Rookie',d:'Master 25 formulas',c:()=>knownFormulas()>=25},
  {id:'fk50',i:'🧮',n:'Equation Machine',d:'Master 50 formulas',c:()=>knownFormulas()>=50}
];
function scanAch(){
  let hit=false;
  ACH.forEach(a=>{ if(!state.ach.includes(a.id)&&a.c()){ state.ach.push(a.id); hit=true; toast('Achievement: '+a.n,a.i); sfx('ach'); confetti(60); } });
  if(hit) saveState();
}

/* ================= TRACK ================= */
function matchesSearch(item){
  if(!searchQuery) return true;
  const q=searchQuery.toLowerCase();
  return item.t.toLowerCase().includes(q)||(item.f&&item.f.toLowerCase().includes(q))||(item.tip&&item.tip.toLowerCase().includes(q));
}
function rowTemplate(t,groupKey){
  const isStudyOpen=state.openStudyPanels[t.id];
  return `
  <li class="topic-item-container">
    <div class="topic-row ${state.done[t.id]?'on':''}" data-id="${t.id}" data-group="${groupKey}" onclick="toggleTopic('${t.id}','${groupKey}')">
      <div class="punch ${state.done[t.id]?'on':''}"></div>
      <div class="topic-main">
        <div class="topic-text">${t.t}</div>
        <div class="topic-formula">${t.f?parseMathText('$'+t.f+'$'):parseMathText(t.tip||'')}</div>
      </div>
      <button class="study-btn" onclick="toggleStudyPanel('${t.id}', event)">${isStudyOpen?'Close Module':'Study Math'}</button>
    </div>
    <div class="study-panel ${isStudyOpen?'open':''}" id="study-${t.id}">
      ${isStudyOpen?getMathematicalContent(t):''}
    </div>
  </li>`;
}
function ticketHTML(headInner,items,key,doneCount,totalCount,barGrad){
  const pct=totalCount?Math.round(doneCount/totalCount*100):0;
  const isOpen=searchQuery?true:!!state.openSections[key];
  return '<div class="ticket"><div class="ticket-head '+(searchQuery?'search-lock':'')+'" data-toggle="'+key+'">'
    +headInner
    +'<div class="ticket-meta"><span class="ticket-frac">'+doneCount+'/'+totalCount+'</span>'
    +'<div class="bar-track"><div class="bar-fill" style="width:'+pct+'%;background:'+barGrad+'"></div></div></div></div>'
    +'<div class="ticket-body-wrapper '+(isOpen?'open':'')+'"><div class="ticket-body"><div class="ticket-body-inner">'
    +'<ul class="topic-list">'+items.map(t=>rowTemplate(t,key)).join('')+'</ul>'
    +'</div></div></div></div>';
}
function renderSubjectView(container){
  let any=false;
  SUBJECT_ORDER.forEach((sid,sIdx)=>{
    const meta=SUBJECT_META[sid];
    const all=TOPICS.filter(t=>t.s===sid);
    const items=all.filter(matchesSearch);
    if(!items.length) return;
    any=true;
    const doneCount=all.reduce((a,t)=>a+(state.done[t.id]?1:0),0);
    const head='<div class="ticket-index">'+String(sIdx+1).padStart(2,'0')+'</div><div class="ticket-title">'+meta.name+'</div>';
    container.insertAdjacentHTML('beforeend',ticketHTML(head,items,'subj-'+sid,doneCount,all.length,'linear-gradient(90deg, '+meta.color+', var(--green))'));
  });
  return any;
}
function renderWeekView(container){
  let any=false;
  const start=state.planStart||todayISO();
  for(let w=1;w<=12;w++){
    const all=TOPICS.filter(t=>t.w===w);
    const items=all.filter(matchesSearch);
    if(!items.length) continue;
    any=true;
    const doneCount=all.reduce((a,t)=>a+(state.done[t.id]?1:0),0);
    const wkStart=addDaysISO(start,(w-1)*7);
    const wkEnd=addDaysISO(start,(w-1)*7+6);
    const subjects=[...new Set(all.map(i=>i.s))].map(s=>SUBJECT_META[s].name).join(' · ');
    const head='<div class="ticket-index">W'+w+'</div><div class="ticket-title">Week '+w+'<span class="ticket-sub">'+fmtShort(wkStart)+' – '+fmtShort(wkEnd)+' · '+subjects+'</span></div>';
    container.insertAdjacentHTML('beforeend',ticketHTML(head,items,'week-'+w,doneCount,all.length,'linear-gradient(90deg, var(--amber), var(--green))'));
  }
  return any;
}
function renderTrack(){
  const container=$('ticketContainer');
  container.innerHTML='';
  const any=state.view==='week'?renderWeekView(container):renderSubjectView(container);
  if(!any) container.innerHTML='<div class="empty">No topics match "'+searchQuery+'". Try a different word.</div>';
  $('matchCount').textContent=searchQuery?(TOPICS.filter(matchesSearch).length+' of '+TOPICS.length+' topics match'):'';
  container.querySelectorAll('[data-toggle]').forEach(el=>{
    el.addEventListener('click',()=>{
      if(searchQuery) return;
      const id=el.getAttribute('data-toggle');
      state.openSections[id]=!state.openSections[id];
      renderTrack(); saveState();
    });
  });
  updateHeader();
}
function toggleTopic(id,groupKey){
  const wasOn=!!state.done[id];
  state.done[id]=!wasOn;
  state.openSections[groupKey]=true;
  if(!wasOn){ gainXP(10); bumpQuest('topics'); }
  renderTrack(); saveState();
}
function toggleStudyPanel(id,ev){ if(ev)ev.stopPropagation(); state.openStudyPanels[id]=!state.openStudyPanels[id]; renderTrack(); saveState(); }

/* ================= ARENA ================= */
let reelQ=[], curFlash=null, flipped=false, reelLock=false, B=null, rageIv=null;
function heatHTML(){
  let out='';
  for(let i=27;i>=0;i--){
    const d=addDaysISO(todayISO(),-i); const x=state.xpHistory[d]||0;
    out+='<div class="hc '+(x===0?'h0':x<40?'h1':x<90?'h2':'h3')+'" title="'+d+': '+x+' XP"></div>';
  }
  return out;
}
function drawFlashIdx(){
  if(state.review.length&&Math.random()<0.4) return rnd(state.review);
  if(!reelQ.length) reelQ=shuffle(FLASH.map((f,i)=>i));
  return reelQ.pop();
}
function advanceReel(knew){
  if(reelLock) return; reelLock=true;
  const card=$('fcard'); if(!card){ reelLock=false; return; }
  if(knew){ gainXP(10); state.stats.knew++; bumpQuest('reels'); state.review=state.review.filter(i=>i!==curFlash); }
  else{ if(!state.review.includes(curFlash)) state.review.push(curFlash); sfx('wrong'); }
  saveState();
  card.style.transition='transform .25s, opacity .25s';
  card.style.transform='translateX('+(knew?80:-80)+'px) rotate('+(knew?5:-5)+'deg)';
  card.style.opacity='0';
  setTimeout(()=>{ flipped=false; curFlash=drawFlashIdx(); reelLock=false; renderArena(); scanAch(); },240);
}
function bossPool(idx){ return MCQS.filter(m=>m.s===idx).length+NATS.filter(n=>n.s===idx).length; }
function startBoss(idx){
  const mcq=shuffle(MCQS.filter(m=>m.s===idx)).map(m=>({nat:false,q:m.q,o:m.o,a:m.a}));
  const nat=shuffle(NATS.filter(n=>n.s===idx)).map(n=>({nat:true,q:n.q,a:n.a}));
  B={ sec:idx, hp:3, php:3, qi:0, order:shuffle(mcq.concat(nat)), cur:null, result:null, correct:0, lock:false, rageOn:state.slain.includes(idx), rage:30 };
  nextQ(); renderArena();
  if(B.rageOn) startRage();
}
function nextQ(){
  const item=B.order[B.qi%B.order.length]; B.qi++;
  B.cur=item.nat?item:{nat:false,q:item.q,opts:shuffle(item.o.map((t,k)=>({t,ok:k===item.a})))};
}
function startRage(){
  clearInterval(rageIv);
  rageIv=setInterval(()=>{
    if(!B||B.result||B.lock) return;
    B.rage--;
    const el=$('rageTime');
    if(el) el.textContent='⏰ '+B.rage+'s';
    if(B.rage<=0) rageTimeout();
  },1000);
}
function rageTimeout(){
  if(!B||B.result||B.lock) return;
  B.lock=true;
  if(B.cur.nat){ const inp=$('natIn'); if(inp) inp.classList.add('no'); }
  else document.querySelectorAll('.opt').forEach((b,bi)=>{ b.disabled=true; if(B.cur.opts[bi].ok) b.classList.add('yes'); });
  toast("Time's up!",'⏰');
  finishTurn(false,B.cur.nat);
}
function finishTurn(ok,isNat){
  if(ok){ B.hp--; B.correct++; if(isNat) state.stats.nats++; gainXP(10); bumpQuest('boss'); sfx('hit'); }
  else{ B.php--; sfx('wrong'); }
  saveState();
  setTimeout(()=>{
    if(!B) return;
    if(B.hp<=0){
      B.result='win';
      if(!state.slain.includes(B.sec)) state.slain.push(B.sec);
      state.stats.bosses++; addCoins(40); gainXP(60); confetti(160); sfx('level'); saveState(); scanAch();
    } else if(B.php<=0){
      if(state.revive){ state.revive=false; state.stats.revives++; B.php=1; toast('Boss Revive consumed — back in the fight!','💖'); saveState(); }
      else B.result='lose';
    } else nextQ();
    B.lock=false; renderArena();
    if(B&&!B.result&&B.rageOn){ B.rage=30; startRage(); }
  },900);
}
function answer(k){
  if(!B||B.result||B.lock) return; B.lock=true;
  document.querySelectorAll('.opt').forEach((b,bi)=>{ b.disabled=true; if(B.cur.opts[bi].ok) b.classList.add('yes'); else if(bi===k) b.classList.add('no'); });
  finishTurn(B.cur.opts[k].ok,false);
}
function answerNat(){
  if(!B||B.result||B.lock) return;
  const inp=$('natIn');
  const v=parseFloat(String(inp.value).replace(',','.'));
  if(isNaN(v)){ inp.classList.add('no'); setTimeout(()=>inp.classList.remove('no'),400); return; }
  B.lock=true; inp.disabled=true; $('natGo').disabled=true;
  const ok=Math.abs(v-B.cur.a)<=0.05;
  inp.classList.add(ok?'ok':'no');
  if(!ok){ const d=document.createElement('div'); d.className='hint'; d.style.margin='6px 0'; d.textContent='correct answer: '+B.cur.a; inp.insertAdjacentElement('afterend',d); }
  finishTurn(ok,true);
}
function renderArena(){
  clearInterval(rageIv);
  ensureDay();
  const C=$('arenaContainer');
  const L=lvlOf(state.xp), pct=Math.round(L.rem/L.need*100);
  let html='';
  html+='<div class="ticket"><div class="arena-hero">'
    +'<div class="ring"><svg width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" fill="none" stroke="var(--surface-2)" stroke-width="6"/><circle cx="32" cy="32" r="27" fill="none" stroke="var(--purple)" stroke-width="6" stroke-linecap="round" stroke-dasharray="169.6" stroke-dashoffset="'+(169.6-169.6*pct/100)+'"/></svg><div class="ring-pct">'+L.level+'</div></div>'
    +'<div class="arena-hero-txt"><b style="color:var(--purple);font-family:\'Space Grotesk\',sans-serif">'+titleOf(L.level)+'</b>'
    +'<div class="bar-track xp-track"><div class="bar-fill xp-fill" style="width:'+pct+'%"></div></div>'
    +'<span class="hint">'+L.rem+' / '+L.need+' XP · '+state.xp+' total</span></div></div></div>';
  html+='<div class="ticket"><div class="ticket-head-static"><div class="ticket-title">🗓️ Last 28 days</div></div><div class="ticket-body-static"><div class="hm">'+heatHTML()+'</div></div></div>';
  html+='<div class="ticket"><div class="ticket-head-static"><div class="ticket-title">📜 Daily Quests <span class="ticket-sub">resets at midnight · each pays 25🪙 + 15 XP</span></div></div><div class="ticket-body-static">';
  QUESTS.forEach(q=>{
    const p=Math.min(state.quests[q.id],q.target), done=p>=q.target, cl=!!state.quests.claimed[q.id];
    html+='<div class="qrow"><span class="qico">'+q.icon+'</span><div class="qtxt"><b>'+q.label+'</b><div class="bar-track"><div class="bar-fill" style="width:'+(p/q.target*100)+'%"></div></div></div>'
      +'<button class="claim" '+(done&&!cl?'':'disabled')+' onclick="claimQuest(\''+q.id+'\')">'+(cl?'✓':(done?'+25🪙':p+'/'+q.target))+'</button></div>';
  });
  html+='</div></div>';
  html+='<div class="ticket"><div class="ticket-head-static"><div class="ticket-title">🛒 Power-Up Shop</div></div><div class="ticket-body-static">'
    +'<div class="qrow"><span class="qico">🧊</span><div class="qtxt"><b>Streak Freeze</b><span class="hint">Auto-bridges one missed day</span></div><button class="claim" '+(state.freeze?'disabled':'')+' onclick="buyFreeze()">'+(state.freeze?'OWNED':'150 🪙')+'</button></div>'
    +'<div class="qrow"><span class="qico">💖</span><div class="qtxt"><b>Boss Revive</b><span class="hint">One free resurrection per battle</span></div><button class="claim" '+(state.revive?'disabled':'')+' onclick="buyRevive()">'+(state.revive?'ARMED':'100 🪙')+'</button></div>'
    +'</div></div>';
  if(curFlash===null) curFlash=drawFlashIdx();
  const f=FLASH[curFlash], sec=SUBJECT_META[ARENA_SUBJECTS[f.s]];
  html+='<div class="ticket"><div class="ticket-head-static"><div class="ticket-title">⚡ Concept Reels <span class="ticket-sub">tap to flip · knew it = +10 XP · weak cards return</span></div></div><div class="ticket-body-static">'
    +'<div class="fcard" id="fcard"><div class="fin'+(flipped?' flip':'')+'" id="fin">'
    +'<div class="fface ffront"><span class="tagchip" style="color:'+sec.color+'">'+sec.name+'</span><div class="fq">'+f.q+'</div><div class="hint">👆 tap to reveal</div></div>'
    +'<div class="fface fback"><span class="tagchip" style="color:'+sec.color+'">'+sec.name+'</span><div class="fa">'+f.a+'</div>'
    +'<div class="rbtns"><button class="btn bad" onclick="advanceReel(false)">😵 Still<br>learning</button><button class="btn good" onclick="advanceReel(true)">🔥 Knew it<br>+10 XP</button></div></div>'
    +'</div></div>'
    +'<div class="hint center">'+(state.review.length?'🃏 '+state.review.length+' card(s) in your review pile':'🃏 Review pile empty — clean sweep!')+'</div>'
    +'</div></div>';
  html+='<div class="ticket"><div class="ticket-head-static"><div class="ticket-title">👾 Boss Battles <span class="ticket-sub">MCQs + GATE NAT · slain bosses return in 😡 RAGE MODE (30s/question)</span></div></div><div class="ticket-body-static">';
  if(!B){
    html+='<div class="bgrid">';
    ARENA_SUBJECTS.forEach((sid,i)=>{
      const m=SUBJECT_META[sid], slain=state.slain.includes(i);
      html+='<button class="bcard'+(slain?' slain':'')+'" onclick="startBoss('+i+')"><b>'+(slain?'✅ ':'')+m.name+(slain?' 😡':'')+'</b><span class="hint">❤️❤️❤️ · '+bossPool(i)+' attack patterns'+(slain?' · RAGE MODE':'')+'</span></button>';
    });
    html+='</div>';
  } else if(B.result){
    const win=B.result==='win';
    html+='<div class="center bigpad"><div class="bigem">'+(win?'🏆':'')+'</div><h3>'+(win?'BOSS DEFEATED!':'You fainted…')+'</h3>'
      +'<p class="hint">'+(win?'+60 XP · +40 🪙 · '+B.correct+' clean hits'+(B.rageOn?' · RAGE MODE cleared!':''):'Hit the Reels & Study Math modules, then rematch.')+'</p>'
      +'<div class="brow"><button class="btn" onclick="startBoss('+B.sec+')">'+(win?'⚔️ Fight again':'🔁 Rematch')+'</button><button class="btn ghost" onclick="B=null;renderArena()">🗺️ Boss list</button></div></div>';
  } else {
    const m=SUBJECT_META[ARENA_SUBJECTS[B.sec]];
    html+='<div class="fight"><div class="brow2"><span>BOSS HP</span><div class="hp"><i class="boss" style="width:'+(B.hp/3*100)+'%"></i></div></div>'
      +'<div class="brow2"><span>YOUR HP</span><div class="hp"><i class="you" style="width:'+(B.php/3*100)+'%"></i></div></div></div>'
      +(B.rageOn?'<div class="rage" id="rageTime">⏰ '+B.rage+'s</div>':'')
      +'<div class="fightq" style="border-left:3px solid '+m.color+';padding-left:12px">';
    if(B.cur.nat){
      html+='<div class="fq-sm">'+B.cur.q+'</div><input class="nat" id="natIn" type="text" inputmode="decimal" placeholder="numeric answer…" autocomplete="off"><div class="hint">GATE NAT · tolerance ±0.05</div><button class="btn" id="natGo" style="width:100%;margin-top:8px" onclick="answerNat()">⚔️ Attack</button>';
    } else {
      html+='<div class="fq-sm">'+B.cur.q+'</div>'+B.cur.opts.map((o,k)=>'<button class="opt" onclick="answer('+k+')">'+o.t+'</button>').join('');
    }
    html+='</div><div class="center" style="margin-top:12px"><button class="btn ghost" onclick="B=null;renderArena()">🏃 Flee battle</button></div>';
  }
  html+='</div></div>';
  html+='<div class="ticket"><div class="ticket-head-static"><div class="ticket-title">🏆 Achievements <span class="ticket-sub">'+state.ach.length+'/'+ACH.length+'</span></div></div><div class="ticket-body-static"><div class="agrid">'
    +ACH.map(a=>'<div class="at'+(state.ach.includes(a.id)?' on':'')+'"><div class="ai">'+a.i+'</div><b>'+a.n+'</b><span>'+a.d+'</span></div>').join('')
    +'</div></div></div>';
  C.innerHTML=html;
  const card=$('fcard'), fin=$('fin');
  if(card){
    card.onclick=e=>{ if(e.target.closest('button')) return; if(!flipped){ flipped=true; fin.classList.add('flip'); sfx('flip'); } };
    let sx=null;
    card.addEventListener('touchstart',e=>{ sx=e.touches[0].clientX; },{passive:true});
    card.addEventListener('touchend',e=>{ if(sx===null||!flipped) return; const dx=e.changedTouches[0].clientX-sx; sx=null; if(dx>60) advanceReel(true); else if(dx<-60) advanceReel(false); },{passive:true});
  }
  const ni=$('natIn');
  if(ni){ ni.focus(); ni.addEventListener('keydown',e=>{ if(e.key==='Enter') answerNat(); }); }
  if(B&&!B.result&&B.rageOn&&!B.lock) startRage();
}

/* ================= FORMULA VAULT ================= */
let fFilter='all';
function setFFilter(s){ fFilter=s; renderFormulas(); }
function renderFormulas(){
  const C=$('formulasContainer');
  const known=knownFormulas();
  let html='<div class="ticket"><div class="ticket-head-static"><div class="ticket-title">📐 Formula Vault <span class="ticket-sub">'+known+'/'+FORMULAS.length+' mastered</span></div></div><div class="ticket-body-static">'
    +'<div class="chiprow"><button class="fchip'+(fFilter==='all'?' on':'')+'" onclick="setFFilter(\'all\')">All</button>'
    +ARENA_SUBJECTS.map(s=>'<button class="fchip'+(fFilter===s?' on':'')+'" onclick="setFFilter(\''+s+'\')">'+SUBJECT_META[s].name.split(',')[0].split(' &')[0]+'</button>').join('')
    +'</div>'
    +FORMULAS.map((fm,i)=>{
      if(fFilter!=='all'&&fm.s!==fFilter) return '';
      const isKnown=state.formulas[i]; const m=SUBJECT_META[fm.s];
      return '<div class="fmcard'+(isKnown?' known':'')+'">'
        +'<div class="fmhead" onclick="this.parentElement.classList.toggle(\'open\')">'
        +'<span class="tagchip" style="color:'+m.color+'">'+m.name.split(',')[0].split(' &')[0]+'</span><b>'+fm.t+'</b><span class="chev">'+(isKnown?'✅':'▾')+'</span></div>'
        +'<div class="fmbody"><div class="fmtext">'+parseMathText('$$'+fm.f+'$$')+'</div>'
        +(fm.n?'<div class="hint fmn">💡 '+fm.n+'</div>':'')
        +(isKnown?'':'<button class="btn tiny" onclick="knowFormula('+i+',event)">✅ I know this (+5 XP)</button>')
        +'</div></div>';
    }).join('')
    +'</div></div>';
  C.innerHTML=html;
}
function knowFormula(i,ev){
  if(ev) ev.stopPropagation();
  if(state.formulas[i]) return;
  state.formulas[i]=1;
  gainXP(5); saveState(); renderFormulas(); scanAch();
}

/* ================= header ================= */
function updateHeader(){
  const done=doneAll();
  const pct=Math.round((done/TOPICS.length)*100);
  $('ringPct').textContent=pct+'%';
  $('ringFrac').textContent=done+' / '+TOPICS.length;
  $('ringFill').setAttribute('stroke-dashoffset',169.6-(169.6*pct/100));
  const streak=computeStreak(state.logDates);
  state.bestStreak=Math.max(state.bestStreak||0,streak);
  $('streakNum').textContent=streak;
  const L=lvlOf(state.xp);
  $('lvlLabel').textContent='LVL '+L.level+' · '+titleOf(L.level);
  $('xpFill').style.width=Math.round(L.rem/L.need*100)+'%';
  $('xpLabel').textContent=L.rem+' / '+L.need+' XP';
  $('coinsNum').textContent=state.coins;
  $('muteBtn').textContent=state.mute?'🔇':'';
  const loggedToday=state.logDates.includes(todayISO());
  const btn=$('logBtn');
  if(loggedToday){ btn.textContent='✓ Logged today'; btn.classList.add('done'); }
  else{ btn.textContent="Log today's lecture"; btn.classList.remove('done'); }
  $('examDate').value=state.examDate||'';
  const hint=$('daysLeftHint');
  if(state.examDate){
    const diff=Math.ceil((new Date(state.examDate)-new Date(todayISO()))/86400000);
    hint.textContent=diff>=0?diff+' day'+(diff===1?'':'s')+' until exam day':'Exam day has passed';
  } else hint.textContent='Set your exam date';
}

/* ================= backup ================= */
function exportProgress(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='gate-quest-backup-'+todayISO()+'.json';
  a.click(); URL.revokeObjectURL(a.href);
  toast('Backup downloaded','💾');
}
function importProgress(ev){
  const f=ev.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      const p=JSON.parse(r.result);
      if(typeof p.xp!=='number'||!p.done) throw 0;
      state={...state,...p}; saveState(); location.reload();
    }catch(e){ toast('Invalid backup file','⚠️'); }
  };
  r.readAsText(f);
}

/* ================= events ================= */
$('logBtn').addEventListener('click',()=>{ gainXP(5); toast("Lecture logged! +5 XP",'📖'); });
$('muteBtn').addEventListener('click',()=>{ state.mute=!state.mute; saveState(); updateHeader(); });
$('examDate').addEventListener('change',e=>{ state.examDate=e.target.value; saveState(); updateHeader(); });
$('planStart').addEventListener('change',e=>{ state.planStart=e.target.value; saveState(); renderTrack(); });
$('resetBtn').addEventListener('click',()=>{
  if(confirm('Wipe ALL progress (topics, XP, coins, streaks)?')){ localStorage.removeItem('gate-da-stable-v1'); location.reload(); }
});
$('exportBtn').addEventListener('click',exportProgress);
$('importBtn').addEventListener('click',()=>$('importFile').click());
$('importFile').addEventListener('change',importProgress);
$('themeToggleBtn').addEventListener('click',()=>{
  isLightTheme=!isLightTheme;
  document.body.classList.toggle('light-theme',isLightTheme);
  state.isLight=isLightTheme; saveState();
});
$('fontMinusBtn').addEventListener('click',()=>{
  if(currentFontSize>0.8){ currentFontSize-=0.1; document.documentElement.style.setProperty('--font-scale',currentFontSize); state.fontScale=currentFontSize; saveState(); }
});
$('fontPlusBtn').addEventListener('click',()=>{
  if(currentFontSize<1.6){ currentFontSize+=0.1; document.documentElement.style.setProperty('--font-scale',currentFontSize); state.fontScale=currentFontSize; saveState(); }
});
$('expandAllBtn').addEventListener('click',()=>{
  const keys=state.view==='week'?Array.from({length:12},(_,i)=>'week-'+(i+1)):SUBJECT_ORDER.map(s=>'subj-'+s);
  keys.forEach(k=>state.openSections[k]=true); saveState(); renderTrack();
});
$('collapseAllBtn').addEventListener('click',()=>{
  const keys=state.view==='week'?Array.from({length:12},(_,i)=>'week-'+(i+1)):SUBJECT_ORDER.map(s=>'subj-'+s);
  keys.forEach(k=>state.openSections[k]=false); saveState(); renderTrack();
});
$('searchBox').addEventListener('input',e=>{ searchQuery=e.target.value.trim(); renderTrack(); });
$('viewSwitch').addEventListener('click',e=>{
  const btn=e.target.closest('button[data-view]'); if(!btn) return;
  state.view=btn.getAttribute('data-view');
  document.querySelectorAll('#viewSwitch button').forEach(b=>b.classList.toggle('active',b===btn));
  $('planStartRow').style.display=state.view==='week'?'flex':'none';
  saveState(); renderTrack();
});
$('modeSwitch').addEventListener('click',e=>{
  const btn=e.target.closest('button[data-mode]'); if(!btn) return;
  state.mode=btn.getAttribute('data-mode');
  document.querySelectorAll('#modeSwitch button').forEach(b=>b.classList.toggle('active',b===btn));
  $('trackView').classList.toggle('hidden',state.mode!=='track');
  $('arenaView').classList.toggle('hidden',state.mode!=='arena');
  $('formulasView').classList.toggle('hidden',state.mode!=='formulas');
  if(state.mode==='arena') renderArena();
  if(state.mode==='formulas') renderFormulas();
  saveState();
});

/* ================= boot ================= */
(function(){
  initFx();
  loadState();
  applyFreeze();
  ensureDay();
  document.body.classList.toggle('light-theme',isLightTheme);
  document.documentElement.style.setProperty('--font-scale',currentFontSize);
  document.querySelectorAll('#viewSwitch button').forEach(b=>b.classList.toggle('active',b.getAttribute('data-view')===state.view));
  $('planStartRow').style.display=state.view==='week'?'flex':'none';
  if(!state.planStart) state.planStart=todayISO();
  $('planStart').value=state.planStart;
  if(state.mode==='arena'||state.mode==='formulas'){
    document.querySelectorAll('#modeSwitch button').forEach(b=>b.classList.toggle('active',b.getAttribute('data-mode')===state.mode));
    $('trackView').classList.add('hidden');
    $('arenaView').classList.toggle('hidden',state.mode!=='arena');
    $('formulasView').classList.toggle('hidden',state.mode!=='formulas');
    if(state.mode==='arena') renderArena(); else renderFormulas();
  }
  renderTrack();
  updateHeader();
})();

/* ================= PWA ================= */
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(e=>console.warn('SW failed:',e)));
}
let deferredInstallPrompt=null;
const pwaBanner=$('pwaBanner');
window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault(); deferredInstallPrompt=e;
  if(!state.pwaDismissed) setTimeout(()=>pwaBanner.classList.remove('hidden'),2500);
});
$('pwaInstall').addEventListener('click',async()=>{
  pwaBanner.classList.add('hidden');
  if(!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt=null;
});
$('pwaDismiss').addEventListener('click',()=>{ pwaBanner.classList.add('hidden'); state.pwaDismissed=true; saveState(); });
window.addEventListener('appinstalled',()=>{ pwaBanner.classList.add('hidden'); deferredInstallPrompt=null; });

'use strict';
/* ================================================================
   ENVIRONMENT — portrait Cliff Walking (Sutton & Barto, rotated)
   Grid 6×11. Start=(0,0) top-left, Goal=(0,10) bottom-left.
   Cliff = column 0, rows 1..9.  Rewards: step −1, cliff −100, goal 0.
   Optimal route: right, 10×down, left  →  12 steps  →  return −12.
   ================================================================ */
const COLS=6, ROWS=11, STATES=COLS*ROWS;
const GOAL={c:0,r:ROWS-1}, MAX_STEPS=60;
const DR=[-1,0,1,0], DC=[0,1,0,-1];          // up,right,down,left
const cellType=(c,r)=>(c===0&&r>0&&r<ROWS-1)?'cliff':(c===GOAL.c&&r===GOAL.r)?'goal':'floor';
const idxOf=(c,r)=>r*COLS+c;

/* ================= BRAIN ================= */
let Q=new Float64Array(STATES*4);
let algo='qlearn';
const params={alpha:0.5,gamma:0.95,epsStart:1.0,epsEnd:0.02,halfLife:80};
let episodes=0, returns=[], okHist=[], bestAvg=null, congrat=false;
const curEps=()=>params.epsEnd+(params.epsStart-params.epsEnd)*Math.exp(-episodes/params.halfLife);
function maxQ(s){const b=s*4;return Math.max(Q[b],Q[b+1],Q[b+2],Q[b+3]);}
function chooseAction(s,eps){                 // ε-greedy, ties broken randomly
  if(Math.random()<eps)return (Math.random()*4)|0;
  const b=s*4;let best=-Infinity,picks=[];
  for(let a=0;a<4;a++){const q=Q[b+a];
    if(q>best+1e-9){best=q;picks=[a];}
    else if(Math.abs(q-best)<=1e-9)picks.push(a);}
  return picks[(Math.random()*picks.length)|0];
}

/* ================= RUNTIME STATE ================= */
let mode='train', running=false;
const env={c:0,r:0,steps:0,ret:0,a:0};
let respawnT=0, acc=0, agentHidden=false, lastDir=2, trail=[];
const view={x:0,y:0,ready:false};
let playRuns=0, playLast='—';
const SPEEDS=[1,2,4,8,15,30,60,150,400,1200];
let speedIdx=4;
const curSps=()=>mode==='play'?5:SPEEDS[speedIdx];
const flags={pol:true,heat:false,trail:true};
let soundOn=false, particles=[], floaters=[], chartDirty=true;

/* ================= DOM ================= */
const $=s=>document.querySelector(s);
const stage=$('#stage'), cv=$('#cv'), chartCv=$('#chartCv');
const epVal=$('#epVal'),epsVal=$('#epsVal'),lastVal=$('#lastVal'),okVal=$('#okVal');
const bestVal=$('#bestVal'),runsVal=$('#runsVal'),playLastEl=$('#playLast'),playHint=$('#playHint');
const btnStart=$('#btnStart'),toastEl=$('#toast');
let DPR=1,L={cell:10,ox:0,oy:0,w:0,h:0};

/* ================= AUDIO (tiny synth) ================= */
let actx=null;
function S(){ if(!soundOn)return null; if(!actx){try{actx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}} return actx; }
function tone(f0,f1,dur,type,g){const a=S();if(!a)return;
  const o=a.createOscillator(),v=a.createGain(),t=a.currentTime;
  o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(f1,1),t+dur);
  v.gain.setValueAtTime(g,t);v.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(v);v.connect(a.destination);o.start(t);o.stop(t+dur+.02);}
const sTick=()=>tone(320,300,.045,'square',.04);
const sSplash=()=>tone(190,42,.38,'sawtooth',.22);
const sWin=()=>{tone(660,660,.12,'triangle',.16);setTimeout(()=>tone(920,920,.2,'triangle',.16),110);};

/* ================= EPISODES & LEARNING ================= */
function beginEpisode(){
  env.c=0;env.r=0;env.steps=0;env.ret=0;
  env.a=algo==='sarsa'?chooseAction(0,curEps()):0;
  trail.length=0;agentHidden=false;
}
function doStep(greedy){
  const s=idxOf(env.c,env.r);
  const eps=greedy?0:curEps();
  const a=(algo==='sarsa'&&!greedy)?env.a:chooseAction(s,eps);
  let nc=env.c+DC[a],nr=env.r+DR[a];
  if(nc<0||nc>=COLS||nr<0||nr>=ROWS){nc=env.c;nr=env.r;}       // wall bump
  let reward=-1;
  const t=cellType(nc,nr);
  if(t==='cliff')reward=-100; else if(t==='goal')reward=0;
  const terminal=t==='cliff'||t==='goal';
  const ns=idxOf(nc,nr);
  /* ---- the TD update (the heart of the app) ----
     Q-learning (off-policy): target = r + γ·max_a′ Q(s′,a′)
     SARSA      (on-policy) : target = r + γ·Q(s′,a′), a′ actually chosen */
  let target;
  if(terminal)target=reward;
  else if(algo==='qlearn'||greedy)target=reward+params.gamma*maxQ(ns);
  else{const na=chooseAction(ns,eps);target=reward+params.gamma*Q[ns*4+na];env.a=na;}
  Q[s*4+a]+=params.alpha*(target-Q[s*4+a]);

  if(nc!==env.c||nr!==env.r){trail.push({c:env.c,r:env.r});if(trail.length>110)trail.shift();}
  env.c=nc;env.r=nr;env.steps++;env.ret+=reward;lastDir=a;
  if(curSps()<=30)sTick();

  if(t==='cliff'){spawnSplash(nc,nr);floater(nc,nr,'-100','#ff6a3a');sSplash();endEpisode('cliff',greedy);}
  else if(t==='goal'){spawnConfetti(nc,nr);floater(nc,nr,'GOAL!','#ffc857');sWin();endEpisode('goal',greedy);}
  else if(env.steps>=MAX_STEPS)endEpisode('timeout',greedy);
}
function endEpisode(result,greedy){
  if(!greedy){
    returns.push(env.ret);if(returns.length>900)returns.splice(0,returns.length-600);
    episodes++;
    okHist.push(result==='goal');if(okHist.length>25)okHist.shift();
    if(returns.length>=20){
      const a=avg(returns.slice(-30));
      if(bestAvg==null||a>bestAvg)bestAvg=a;
      if(!congrat&&a>=-14){congrat=true;toast('≈ OPTIMAL POLICY! BEST IS −12');}
    }
    chartDirty=true;
    if(episodes%25===0)saveBrain();
  }else{
    playRuns++;playLast=result==='goal'?'GOAL ✓':'CLIFF ✗';
    playHint.textContent=episodes===0?'Wanders randomly? The brain is untrained — switch to TRAIN first.'
      :'Brain trained on '+episodes+' episodes ('+(algo==='qlearn'?'Q-learning':'SARSA')+').';
  }
  respawnT=greedy?0.85:(curSps()<=30?0.45:0.02);
  agentHidden=result==='cliff';
}
const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;

/* ================= EFFECTS ================= */
function cellCenter(c,r){return{x:L.ox+(c+.5)*L.cell,y:L.oy+(r+.5)*L.cell};}
function spawnSplash(c,r){if(particles.length>220)return;const p=cellCenter(c,r);
  for(let i=0;i<26;i++){const an=Math.random()*Math.PI*2,sp=40+Math.random()*150;
    particles.push({x:p.x,y:p.y,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp-90,life:.6+Math.random()*.5,age:0,
      size:2+Math.random()*3,col:Math.random()<.5?'#ff7a2f':'#ffc857',grav:260});}}
function spawnConfetti(c,r){if(particles.length>220)return;const p=cellCenter(c,r);
  for(let i=0;i<30;i++){const an=Math.random()*Math.PI*2,sp=50+Math.random()*170;
    particles.push({x:p.x,y:p.y,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp-60,life:.7+Math.random()*.6,age:0,
      size:2+Math.random()*3,col:['#35e0c8','#ffc857','#e9f0fa'][(Math.random()*3)|0],grav:180});}}
function floater(c,r,txt,col){const p=cellCenter(c,r);floaters.push({x:p.x,y:p.y,txt,col,age:0});}
const embers=Array.from({length:24},()=>({x:Math.random(),y:Math.random(),sp:.02+Math.random()*.05,ph:Math.random()*6,sz:1+Math.random()*2}));

/* ================= PERSISTENCE ================= */
const KEY='cliff-walker-v1';
function saveBrain(manual){
  try{localStorage.setItem(KEY,JSON.stringify({v:1,algo,params:{...params},episodes,
    returns:returns.slice(-300),bestAvg,Q:Array.from(Q),flags,soundOn}));
    if(manual)toast('BRAIN SAVED');}catch(e){}
}
function loadBrain(){
  try{const d=JSON.parse(localStorage.getItem(KEY));
    if(!d||d.v!==1||!Array.isArray(d.Q)||d.Q.length!==STATES*4)return false;
    Q=Float64Array.from(d.Q);algo=d.algo||'qlearn';Object.assign(params,d.params||{});
    episodes=d.episodes|0;returns=d.returns||[];bestAvg=(d.bestAvg==null?null:d.bestAvg);
    Object.assign(flags,d.flags||{});soundOn=!!d.soundOn;return true;}catch(e){return false;}
}
function resetBrain(){
  Q.fill(0);episodes=0;returns.length=0;okHist.length=0;bestAvg=null;congrat=false;
  playRuns=0;playLast='—';try{localStorage.removeItem(KEY)}catch(e){}
  beginEpisode();chartDirty=true;toast('BRAIN WIPED');
}

/* ================= LAYOUT ================= */
function layout(){
  const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;
  DPR=Math.min(window.devicePixelRatio||1,2);
  cv.width=w*DPR;cv.height=h*DPR;
  L.cell=Math.min((w-22)/COLS,(h-22)/ROWS);
  L.ox=(w-L.cell*COLS)/2;L.oy=(h-L.cell*ROWS)/2;L.w=w;L.h=h;
  if(!view.ready){const p=cellCenter(0,0);view.x=p.x;view.y=p.y;view.ready=true;}
}
new ResizeObserver(layout).observe(stage);

/* ================= RENDER ================= */
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
const ANG=[-Math.PI/2,0,Math.PI/2,Math.PI];
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);
  g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}

function render(dt,t){
  const g=cv.getContext('2d');g.setTransform(DPR,0,0,DPR,0,0);
  g.clearRect(0,0,L.w,L.h);
  /* ambient embers */
  for(const e of embers){
    e.y-=e.sp*dt;e.ph+=dt;if(e.y<-.05){e.y=1.05;e.x=Math.random();}
    g.globalAlpha=.06+.05*(1+Math.sin(e.ph));
    g.fillStyle='#ff9a4d';g.beginPath();g.arc(e.x*L.w,e.y*L.h,e.sz,0,7);g.fill();
  }
  g.globalAlpha=1;
  /* lava glow behind cliff column */
  const gc=cellCenter(0,5.5);
  const gl=g.createRadialGradient(gc.x,gc.y,L.cell,gc.x,gc.y,L.cell*4.2);
  gl.addColorStop(0,'rgba(255,110,40,.14)');gl.addColorStop(1,'rgba(255,110,40,0)');
  g.fillStyle=gl;g.fillRect(0,0,L.w,L.h);
  const cs=L.cell,pad=Math.max(1,cs*.045);
  /* cells */
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    const x=L.ox+c*cs,y=L.oy+r*cs,ty=cellType(c,r);
    if(ty==='cliff'){
      rr(g,x+pad,y+pad,cs-2*pad,cs-2*pad,cs*.14);
      const lg=g.createLinearGradient(0,y,0,y+cs);
      lg.addColorStop(0,'#2a0a06');lg.addColorStop(1,'#1a0503');g.fillStyle=lg;g.fill();
      const inset=cs*.14,wob=Math.sin(t*2.1+c*3+r*1.7)*cs*.03;
      const pool=g.createLinearGradient(0,y+inset,0,y+cs-inset);
      const hot=.72+.28*Math.sin(t*2.4+r*.9);
      pool.addColorStop(0,`rgba(255,196,62,${.95*hot})`);
      pool.addColorStop(.55,`rgba(255,110,42,${.95*hot})`);
      pool.addColorStop(1,`rgba(214,48,20,${.95*hot})`);
      g.save();g.shadowColor='rgba(255,120,40,.8)';g.shadowBlur=cs*.28;
      rr(g,x+inset,y+inset+wob*.3,cs-2*inset,cs-2*inset,cs*.12);g.fillStyle=pool;g.fill();g.restore();
      const nb=1+((cs/26)|0);
      for(let b=0;b<nb;b++){
        const h1=hash(c*7+b,r*13+3),h2=hash(c*3+1,r*17+b);
        const bxp=x+inset+h1*(cs-2*inset);
        const cyc=((t*(.25+h2*.35))+h1)%1;
        const byp=y+cs-inset-cyc*(cs-2*inset);
        g.fillStyle=`rgba(255,230,150,${(1-cyc)*.65*hot})`;
        g.beginPath();g.arc(bxp,byp,cs*.045*(1-cyc*.4)+.6,0,7);g.fill();
      }
    }else{
      rr(g,x+pad,y+pad,cs-2*pad,cs-2*pad,cs*.14);
      g.fillStyle=(c+r)%2?'#182136':'#1a2440';g.fill();
      g.strokeStyle='#26314f';g.lineWidth=1;g.stroke();
    }
  }
  /* heatmap overlay */
  if(flags.heat){
    let lo=Infinity,hi=-Infinity;
    for(let s=0;s<STATES;s++){const v=maxQ(s);if(v<lo)lo=v;if(v>hi)hi=v;}
    if(hi-lo>1e-6)for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
      if(cellType(c,r)==='cliff')continue;
      const v=(maxQ(idxOf(c,r))-lo)/(hi-lo);
      g.fillStyle=`rgba(${(60+195*v)|0},${(90+110*v)|0},${(160-20*v)|0},${.14+.3*v})`;
      rr(g,L.ox+c*cs+pad,L.oy+r*cs+pad,cs-2*pad,cs-2*pad,cs*.14);g.fill();
    }
  }
  /* start & goal marks */
  {const p=cellCenter(0,0);g.strokeStyle='rgba(53,224,200,.85)';g.lineWidth=2;
   g.setLineDash([4,4]);g.beginPath();g.arc(p.x,p.y,cs*.3,0,7);g.stroke();g.setLineDash([]);
   g.fillStyle='rgba(53,224,200,.85)';g.font=`700 ${Math.max(8,cs*.17)}px "Space Grotesk"`;
   g.textAlign='center';g.textBaseline='middle';g.fillText('START',p.x,p.y+cs*.52);}
  {const p=cellCenter(GOAL.c,GOAL.r);
   g.save();g.shadowColor='rgba(255,200,87,.9)';g.shadowBlur=cs*.3*(1+.3*Math.sin(t*3));
   g.strokeStyle='#ffc857';g.lineWidth=2.5;g.setLineDash([6,6]);g.lineDashOffset=-t*24;
   g.beginPath();g.arc(p.x,p.y,cs*.32,0,7);g.stroke();g.restore();g.setLineDash([]);
   g.fillStyle='#ffc857';g.beginPath();g.arc(p.x,p.y,cs*.1*(1+.15*Math.sin(t*3)),0,7);g.fill();}
  /* policy arrows */
  if(flags.pol){
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
      if(cellType(c,r)==='cliff')continue;
      const s=idxOf(c,r),b=s*4;
      let mx=-Infinity,mn=Infinity,me=0,ai=0;
      for(let a=0;a<4;a++){const q=Q[b+a];if(q>mx){mx=q;ai=a;}if(q<mn)mn=q;me+=q;}
      me/=4;if(mx-mn<1e-9)continue;
      const p=cellCenter(c,r),conf=Math.min(1,(mx-me)/(mx-mn+1e-9)+.35);
      g.save();g.translate(p.x,p.y);g.rotate(ANG[ai]);
      g.strokeStyle=`rgba(53,224,200,${.15+.55*conf})`;g.lineWidth=2;g.lineCap='round';
      const k=cs*.2;g.beginPath();g.moveTo(-k*.6,-k*.7);g.lineTo(k*.55,0);g.lineTo(-k*.6,k*.7);g.stroke();
      g.restore();
    }
  }
  /* trail */
  if(flags.trail){const n=trail.length;
    for(let i=0;i<n;i++){const p=cellCenter(trail[i].c,trail[i].r);
      g.fillStyle=`rgba(53,224,200,${(i/n)*.3})`;
      g.beginPath();g.arc(p.x,p.y,cs*.09,0,7);g.fill();}}
  /* agent */
  const tgt=cellCenter(env.c,env.r);
  const rate=curSps()<=30?14:40,k=1-Math.exp(-dt*rate);
  view.x+=(tgt.x-view.x)*k;view.y+=(tgt.y-view.y)*k;
  if(!agentHidden){
    const R=cs*.33,vx=tgt.x-view.x,vy=tgt.y-view.y,moving=Math.hypot(vx,vy)>1.5;
    const bob=moving?Math.sin(t*11)*cs*.04:0;
    const ax=view.x,ay=view.y+bob;
    g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(ax,view.y+R*.95,R*.8,R*.28,0,0,7);g.fill();
    g.strokeStyle='#35e0c8';g.lineWidth=1.5;
    g.beginPath();g.moveTo(ax,ay-R);g.lineTo(ax,ay-R*1.45);g.stroke();
    g.fillStyle='#ffc857';g.beginPath();g.arc(ax,ay-R*1.45,2.2,0,7);g.fill();
    const bg2=g.createRadialGradient(ax-R*.35,ay-R*.35,R*.15,ax,ay,R);
    bg2.addColorStop(0,'#8ff5e2');bg2.addColorStop(1,'#14b3a0');
    g.fillStyle=bg2;g.strokeStyle='#083f38';g.lineWidth=2;
    g.beginPath();g.arc(ax,ay,R,0,7);g.fill();g.stroke();
    let dx=0,dy=1;if(moving){const m=Math.hypot(vx,vy)||1;dx=vx/m;dy=vy/m;}else{dx=DC[lastDir];dy=DR[lastDir];}
    for(const s2 of[-1,1]){
      const ex=ax+dx*R*.3-dy*s2*R*.34,ey=ay+dy*R*.3+dx*s2*R*.34;
      g.fillStyle='#fff';g.beginPath();g.arc(ex,ey,R*.2,0,7);g.fill();
      g.fillStyle='#0a2a26';g.beginPath();g.arc(ex+dx*R*.07,ey+dy*R*.07,R*.1,0,7);g.fill();
    }
  }
  /* particles */
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.age+=dt;
    if(p.age>=p.life){particles.splice(i,1);continue;}
    p.vy+=p.grav*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
    g.globalAlpha=1-p.age/p.life;g.fillStyle=p.col;
    g.beginPath();g.arc(p.x,p.y,p.size,0,7);g.fill();}
  g.globalAlpha=1;
  /* floating labels */
  g.textAlign='center';g.font=`${Math.max(11,cs*.3)}px Bungee`;
  for(let i=floaters.length-1;i>=0;i--){const f=floaters[i];f.age+=dt;
    if(f.age>1){floaters.splice(i,1);continue;}
    g.globalAlpha=1-f.age;g.fillStyle=f.col;g.fillText(f.txt,f.x,f.y-cs*.5-f.age*cs*.6);}
  g.globalAlpha=1;
}

/* ================= CHART ================= */
const YMIN=-160,YMAX=10;
function drawChart(){
  const W=chartCv.clientWidth,H=chartCv.clientHeight;if(!W)return;
  chartCv.width=W*DPR;chartCv.height=H*DPR;
  const g=chartCv.getContext('2d');g.setTransform(DPR,0,0,DPR,0,0);
  const pl=30,pr=6,pt=6,pb=4,y=v=>pt+(1-(v-YMIN)/(YMAX-YMIN))*(H-pt-pb);
  g.font='8.5px "Space Grotesk"';g.textBaseline='middle';
  for(const gv of[-150,-100,-50]){
    g.strokeStyle='rgba(120,140,180,.13)';g.beginPath();g.moveTo(pl,y(gv));g.lineTo(W-pr,y(gv));g.stroke();
    g.fillStyle='#5c7196';g.textAlign='right';g.fillText(gv,pl-4,y(gv));}
  g.setLineDash([4,4]);g.strokeStyle='rgba(53,224,200,.8)';
  g.beginPath();g.moveTo(pl,y(-12));g.lineTo(W-pr,y(-12));g.stroke();g.setLineDash([]);
  g.fillStyle='#35e0c8';g.textAlign='right';g.fillText('optimal −12',W-pr,y(-12)-5);
  const N=Math.min(returns.length,400);
  if(N<2){g.fillStyle='#5c7196';g.textAlign='center';g.font='10px "Space Grotesk"';
    g.fillText('no episodes yet — press ▶ TRAIN',W/2,H/2);return;}
  const data=returns.slice(-N),x=i=>pl+i/(N-1)*(W-pl-pr);
  const cy=v=>Math.max(pt,Math.min(H-pb,y(Math.max(YMIN+2,Math.min(YMAX-2,v)))));
  g.strokeStyle='rgba(108,139,212,.5)';g.lineWidth=1;g.beginPath();
  data.forEach((v,i)=>i?g.lineTo(x(i),cy(v)):g.moveTo(x(i),cy(v)));g.stroke();
  const pre=[0];for(const v of data)pre.push(pre[pre.length-1]+v);
  g.strokeStyle='#ffc857';g.lineWidth=2;g.beginPath();g.moveTo(x(0),cy(data[0]));
  for(let i=1;i<N;i++){const w=Math.min(i+1,30);g.lineTo(x(i),cy((pre[i+1]-pre[i+1-w])/w));}
  g.stroke();
}

/* ================= HUD ================= */
let hudT=0;
function updateHud(){
  epVal.textContent=episodes;
  const e=mode==='play'?0:curEps();
  epsVal.textContent=e.toFixed(2);
  epsVal.style.color=e>.3?'var(--lava)':'var(--teal)';
  lastVal.textContent=returns.length?returns[returns.length-1]:'—';
  okVal.textContent=okHist.length?Math.round(100*okHist.filter(Boolean).length/okHist.length)+'%':'—';
  bestVal.textContent=bestAvg==null?'BEST —':'BEST '+bestAvg.toFixed(1);
  if(mode==='play'){runsVal.textContent=playRuns;playLastEl.textContent=playLast;
    playLastEl.style.color=playLast.startsWith('G')?'var(--teal)':'var(--red)';}
}

/* ================= MAIN LOOP ================= */
let lastT=performance.now();
function frame(now){
  const dt=Math.min(.05,(now-lastT)/1000);lastT=now;
  if(running){
    if(respawnT>0){respawnT-=dt;if(respawnT<=0)beginEpisode();}
    else{
      acc+=dt*curSps();
      let n=Math.min(acc|0,6000);acc-=n;
      while(n-->0){doStep(mode==='play');if(respawnT>0)break;}
    }
  }
  render(dt,now/1000);
  if(chartDirty){drawChart();chartDirty=false;}
  hudT+=dt;if(hudT>.12){hudT=0;updateHud();}
  requestAnimationFrame(frame);
}

/* ================= UI ================= */
function toast(msg){toastEl.textContent=msg;toastEl.classList.add('show');
  clearTimeout(toast._t);toast._t=setTimeout(()=>toastEl.classList.remove('show'),2200);}
function setSeg(el,i){el.querySelector('.thumb').style.transform=`translateX(${i*100}%)`;
  [...el.querySelectorAll('button')].forEach((b,j)=>b.classList.toggle('on',j===i));}
function updateTransport(){
  btnStart.textContent=running?'⏸ PAUSE':(mode==='train'?'▶ TRAIN':'▶ PLAY');
  btnStart.classList.toggle('running',running);}
function setMode(m){
  if(m===mode)return;
  saveBrain();mode=m;
  setSeg($('#segMode'),m==='train'?0:1);
  $('#trainBody').hidden=m!=='train';$('#playBody').hidden=m!=='play';
  if(m==='play')running=true;
  acc=0;respawnT=0;beginEpisode();updateTransport();updateHud();
}

$('#segMode').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setMode(b.dataset.m);});
$('#segAlgo').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  algo=b.dataset.a;setSeg($('#segAlgo'),algo==='qlearn'?0:1);
  if(algo==='sarsa')env.a=chooseAction(idxOf(env.c,env.r),curEps());});
btnStart.addEventListener('click',()=>{
  S();running=!running;
  if(!running&&mode==='train')saveBrain(true);
  updateTransport();});
$('#btnReset').addEventListener('click',resetBrain);
$('#btnFold').addEventListener('click',()=>$('#panel').classList.toggle('collapsed'));
$('#speed').addEventListener('input',e=>{speedIdx=+e.target.value;
  $('#spdVal').textContent=SPEEDS[speedIdx]<=30?SPEEDS[speedIdx]+' st/s':'TURBO ×'+SPEEDS[speedIdx];});

/* param sliders generated from config */
const SLIDERS=[
  ['alpha','α · LEARNING RATE',.05,1,.01,v=>v.toFixed(2)],
  ['gamma','γ · DISCOUNT',.80,1,.01,v=>v.toFixed(2)],
  ['epsStart','ε · EXPLORE START',0,1,.01,v=>v.toFixed(2)],
  ['epsEnd','ε · EXPLORE FLOOR',0,.5,.01,v=>v.toFixed(2)],
  ['halfLife','ε · HALF-LIFE (EPISODES)',5,400,1,v=>v|0,true],
];
{const grid=$('#paramGrid');
 for(const[key,label,min,max,step,fmt,full]of SLIDERS){
   const d=document.createElement('div');d.className='pm'+(full?' full':'');
   d.innerHTML=`<div class="cap"><span>${label}</span><b id="pv_${key}"></b></div>
     <input type="range" id="pr_${key}" min="${min}" max="${max}" step="${step}">`;
   grid.appendChild(d);
   const inp=d.querySelector('input'),out=d.querySelector('b');
   inp.value=params[key];out.textContent=fmt(params[key]);
   inp.addEventListener('input',()=>{params[key]=+inp.value;out.textContent=fmt(params[key]);});
 }}
for(const[id,key]of[['tglPol','pol'],['tglHeat','heat'],['tglTrail','trail']]){
  const b=document.getElementById(id);b.classList.toggle('on',flags[key]);
  b.addEventListener('click',()=>{flags[key]=!flags[key];b.classList.toggle('on',flags[key]);});}
$('#btnSound').addEventListener('click',function(){soundOn=!soundOn;this.classList.toggle('on',soundOn);S();});
$('#btnFS').addEventListener('click',async()=>{
  try{await document.documentElement.requestFullscreen();
      await screen.orientation.lock('portrait');}catch(e){}});
let deferredPrompt=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('#btnInstall').hidden=false;});
$('#btnInstall').addEventListener('click',async()=>{
  if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;
  deferredPrompt=null;$('#btnInstall').hidden=true;});
function checkOri(){document.body.classList.toggle('blocked',
  matchMedia('(orientation:landscape)').matches&&innerHeight<560&&('ontouchstart'in window));}
addEventListener('resize',checkOri);addEventListener('orientationchange',checkOri);
addEventListener('pagehide',()=>saveBrain());
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveBrain();});

/* ================= INIT ================= */
const hadSave=loadBrain();
setSeg($('#segAlgo'),algo==='qlearn'?0:1);
setSeg($('#segMode'),0);
$('#btnSound').classList.toggle('on',soundOn);
for(const[key]of SLIDERS){const i=$('#pr_'+key);if(i){i.value=params[key];$('#pv_'+key).textContent=(+params[key]).toFixed(key==='halfLife'?0:2);}}
if(hadSave&&episodes>0)toast('SAVED BRAIN LOADED · EP '+episodes);
layout();beginEpisode();updateTransport();updateHud();checkOri();
requestAnimationFrame(frame);

if('serviceWorker'in navigator)
  addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
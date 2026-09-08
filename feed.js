/* ================= QUEST FEED (v2 — fixed & hardened) ================= */
(function(){
'use strict';
if(typeof state==='undefined'||typeof gainXP==='undefined'){ console.warn('feed.js loaded too early or core missing'); return; }

/* ---- FIX #1: ARENA_SUBJECTS was used everywhere but never defined.
   app.js names the same array SUBJ. Map numeric card indices -> subject codes. */
const ARENA_SUBJECTS=(typeof SUBJ!=='undefined'&&Array.isArray(SUBJ))
  ? SUBJ
  : ['ps','la','co','pdsa','dbms','ml','ai'];

const EMO={ps:'🎲',la:'🧮',co:'📈',pdsa:'💻',dbms:'🗄️',ml:'🤖',ai:'🧠'};
const HANDLE={ps:'prob.stats',la:'lin.algebra',co:'calc.opt',pdsa:'dsa.dev',dbms:'db.ware',ml:'ml.lab',ai:'ai.search'};

/* ---- daily XP economy ---- */
const DAILY_FEED_CAP=120;
let deck=[],pos=0,seen=0,sessionXP=0,filter='all',ready=false,restedToasted=false;

let FM=state.feedMeta||(state.feedMeta={liked:[],saved:[],day:todayISO(),dayXP:0,seen:0});
if(FM.day!==todayISO()){ FM.day=todayISO(); FM.dayXP=0; FM.seen=0; restedToasted=false; }

const capLeft=()=>Math.max(0,DAILY_FEED_CAP-FM.dayXP);

/* FIX #2: reset restedToasted once XP resumes so the "rested" toast isn't sticky */
function award(n){
  const give=Math.min(n,capLeft());
  FM.dayXP+=give; sessionXP+=give;
  if(give>0){ restedToasted=false; gainXP(give); }
  else if(!restedToasted){ restedToasted=true; toast('Daily feed bonus rested — XP resumes at midnight 😴',''); }
  hud(); saveState();
}

function hud(){ const el=document.getElementById('feedHud'); if(el) el.textContent='⚡ '+sessionXP+' XP · 👁 '+seen; }

/* ---- build the card pool from every bank ---- */
function cardPool(){
  const c=[];
  if(typeof FORMULAS!=='undefined') FORMULAS.forEach((f,i)=>c.push({type:'formula',s:f.s,title:f.t,tex:f.f,note:f.n,id:'F'+i}));
  TOPICS.forEach(t=>{ if(t.f) c.push({type:'formula',s:t.s,title:t.t,tex:t.f,id:'T'+t.id}); });
  if(typeof FLASH!=='undefined') FLASH.forEach((f,i)=>c.push({type:'flash',s:ARENA_SUBJECTS[f.s],q:f.q,a:f.a,id:'R'+i}));
  if(typeof MCQS!=='undefined')  MCQS.forEach((m,i)=>c.push({type:'quiz',s:ARENA_SUBJECTS[m.s],q:m.q,opts:m.o,a:m.a,id:'Q'+i}));
  if(typeof NATS!=='undefined')  NATS.forEach((n,i)=>c.push({type:'nat',s:ARENA_SUBJECTS[n.s],q:n.q,a:n.a,id:'N'+i}));
  return c;
}

/* ---- shuffle + sprinkle golden cards ---- */
function buildDeck(){
  let pool=cardPool();
  if(filter!=='all') pool=pool.filter(c=>c.s===filter);
  deck=shuffle(pool);
  if(deck.length>8){
    for(let i=14;i<deck.length;i+=16+Math.floor(Math.random()*12))
      deck.splice(i,0,{type:'golden',s:filter==='all'?rnd(ARENA_SUBJECTS):filter,id:'G'+i+'_'+Math.random().toString(36).slice(2,6)});
  }
  pos=0;
}

/* ---- render one post ---- */
function postHTML(c,idx){
  const m=SUBJECT_META[c.s]||SUBJECT_META.ps;
  const liked=FM.liked.includes(c.id), saved=FM.saved.includes(c.id);
  let media='';
  if(c.type==='formula') media='<div class="bigq">'+parseMathText('$$'+c.tex+'$$')+'</div><div class="ans">'+(c.note||'double-tap ❤️ if you know this by heart')+'</div>';
  else if(c.type==='flash') media='<div class="bigq">'+c.q+'</div><div class="ans">'+c.a+'</div><div class="tapnote">tap card to reveal</div>';
  else if(c.type==='quiz') media='<div class="bigq">'+c.q+'</div><div class="optlist">'+c.opts.map((o,k)=>'<button class="qopt" data-k="'+k+'">'+o+'</button>').join('')+'</div>';
  else if(c.type==='nat') media='<div class="bigq">'+c.q+'</div><div class="natrow"><input inputmode="decimal" placeholder="numeric answer…" autocomplete="off"><button class="qopt natgo">Check</button></div><div class="ans">answer: '+c.a+'</div>';
  else media='<div class="goldenwrap"><div class="coin">🪙</div><b>GOLDEN CARD</b><span>tap to claim +50 XP</span></div>';

  return '<article class="post" data-id="'+c.id+'" data-type="'+c.type+'">'
    +'<header class="post-head"><span class="post-ava" style="background:'+m.color+'33">'+EMO[c.s]+'</span>'
    +'<div class="post-user"><b>'+(HANDLE[c.s]||'gate.quest')+'</b><span>'+c.type+' · card #'+(idx+1)+'</span></div>'
    +'<span class="post-tag" style="color:'+m.color+'">'+m.name.split(',')[0]+'</span></header>'
    +'<div class="post-media">'+media+'<div class="heart-burst">♥</div></div>'
    +'<div class="post-actions">'
    +'<button class="act like'+(liked?' on':'')+'">♥</button>'
    +'<button class="act hint">💬</button>'
    +'<button class="act save'+(saved?' on':'')+'">🔖</button>'
    +'<button class="act copy">📤</button>'
    +'<span class="post-xp">'+(c.type==='golden'?'+50':c.type==='nat'?'+20':c.type==='quiz'?'+15':'+10')+' XP</span></div>'
    +'<div class="post-cap"><b style="color:'+m.color+'">'+(c.title||c.q||'').slice(0,90)+'</b></div></article>';
}

function appendCards(n){
  const sc=document.getElementById('feedScroll'); if(!sc) return;
  for(let i=0;i<n;i++){
    if(pos>=deck.length) buildDeck();
    const c=deck[pos];
    const wrap=document.createElement('div');
    wrap.innerHTML=postHTML(c,pos);
    const el=wrap.firstElementChild; if(!el) continue;
    el._card=c;
    sc.appendChild(el); wirePost(el); pos++;
  }
}

/* ---- attach interactions to a post ---- */
function wirePost(el){
  const c=el._card, media=el.querySelector('.post-media'), burst=el.querySelector('.heart-burst');
  const heart=()=>{ burst.classList.remove('go'); void burst.offsetWidth; burst.classList.add('go'); };

  function claimGolden(){
    if(el.dataset.done) return; el.dataset.done='1';
    const gw=media.querySelector('.goldenwrap');
    if(gw) gw.innerHTML='<div class="coin">✅</div><b>CLAIMED</b><span>+50 XP banked</span>';
    confetti(120); sfx('level'); award(50); saveState();
  }

  function doLike(){
    if(FM.liked.includes(c.id)) return;
    FM.liked.push(c.id);
    el.querySelector('.like').classList.add('on');
    heart(); sfx('xp');
    if(c.type==='formula'&&/^F\d+$/.test(c.id)) state.formulas[+c.id.slice(1)]=1;
    if(c.type==='flash') state.stats.knew++;
    bumpQuest('reels');
    award(c.type==='nat'?20:c.type==='quiz'?15:10);
    scanAch(); saveState();
  }

  /* double-tap = like; single tap reveals flash / claims golden */
  let last=0;
  media.addEventListener('pointerdown',()=>{
    const now=Date.now();
    if(now-last<300) doLike();
    last=now;
    if(c.type==='flash'){ media.classList.toggle('revealed'); sfx('flip'); }
    if(c.type==='golden') claimGolden();
  });

  el.querySelector('.like').onclick=doLike;
  el.querySelector('.hint').onclick=()=>{
    if(c.type==='quiz') el.querySelectorAll('.qopt').forEach((b,k)=>{ b.disabled=true; if(k===c.a) b.classList.add('yes'); });
    else media.classList.add('revealed');
    sfx('flip');
  };
  el.querySelector('.save').onclick=e=>{
    const i=FM.saved.indexOf(c.id);
    if(i<0){ FM.saved.push(c.id); e.currentTarget.classList.add('on'); toast('Saved to review pile 🔖',''); }
    else{ FM.saved.splice(i,1); e.currentTarget.classList.remove('on'); }
    saveState();
  };
  el.querySelector('.copy').onclick=()=>{
    const txt=c.tex||((c.q||'')+' → '+(c.a||''));
    if(navigator.clipboard) navigator.clipboard.writeText(txt).then(()=>toast('Copied 📤','📋'));
  };

  if(c.type==='quiz'){
    el.querySelectorAll('.qopt').forEach((b,k)=>{
      b.onclick=()=>{
        if(el.dataset.done) return; el.dataset.done='1';
        el.querySelectorAll('.qopt').forEach((x,j)=>{ x.disabled=true; if(j===c.a) x.classList.add('yes'); });
        if(k===c.a){ heart(); sfx('hit'); bumpQuest('reels'); award(15); if(!FM.liked.includes(c.id)){FM.liked.push(c.id); el.querySelector('.like').classList.add('on');} }
        else{ b.classList.add('no'); media.classList.add('shake'); sfx('wrong'); if(!FM.saved.includes(c.id)) FM.saved.push(c.id); }
        scanAch(); saveState();
      };
    });
  }

  if(c.type==='nat'){
    const go=el.querySelector('.natgo'), inp=el.querySelector('.natrow input');
    const check=()=>{
      if(el.dataset.done) return;
      const v=parseFloat(String(inp.value).replace(',','.'));
      if(isNaN(v)){ inp.classList.add('shake'); setTimeout(()=>inp.classList.remove('shake'),400); return; }
      el.dataset.done='1'; inp.disabled=true; go.disabled=true;
      if(Math.abs(v-c.a)<=0.05){ media.classList.add('revealed'); heart(); sfx('hit'); bumpQuest('reels'); award(20); state.stats.nats++; }
      else{ media.classList.add('revealed','shake'); sfx('wrong'); if(!FM.saved.includes(c.id)) FM.saved.push(c.id); }
      scanAch(); saveState();
    };
    go.onclick=check; inp.addEventListener('keydown',e=>{ if(e.key==='Enter') check(); });
  }
}

/* ---- stories (subject filter rings) ---- */
function storiesHTML(){
  return ['all'].concat(ARENA_SUBJECTS).map(s=>{
    const p=s==='all'
      ? Math.round(doneAll()/TOPICS.length*100)
      : Math.round(TOPICS.filter(t=>t.s===s&&state.done[t.id]).length/Math.max(1,TOPICS.filter(t=>t.s===s).length)*100);
    return '<div class="story'+(filter===s?' on':'')+'" data-s="'+s+'"><div class="story-ring" style="--p:'+p+'"><div class="story-ava">'+(s==='all'?'⚡':EMO[s])+'</div></div><b>'+(s==='all'?'fyp':HANDLE[s].split('.')[0])+'</b></div>';
  }).join('');
}

function resetScroll(){
  const sc=document.getElementById('feedScroll'); if(!sc) return;
  sc.innerHTML='<div class="ptr" id="ptr">⟳</div>';
  buildDeck(); appendCards(3);
}

/* ---- build the whole feed view ---- */
function initFeed(){
  const V=document.getElementById('feedView'); if(!V) return;
  V.innerHTML='<div class="feed-top"><button class="back" id="feedBack">✕</button><div class="feed-title">⚡ Quest Feed</div><div class="feed-hud" id="feedHud"></div></div>'
    +'<div class="stories" id="stories">'+storiesHTML()+'</div>'
    +'<div id="feedScroll"><div class="ptr" id="ptr">⟳</div></div>';

  document.getElementById('feedBack').onclick=()=>{
    const back=document.querySelector('#modeSwitch button[data-mode="track"]');
    if(back) back.click(); else closeFeed();
  };

  document.getElementById('stories').addEventListener('click',e=>{
    const s=e.target.closest('.story'); if(!s) return;
    filter=s.dataset.s;
    document.getElementById('stories').innerHTML=storiesHTML();
    resetScroll();
    toast(filter==='all'?'Back to For-You-Page 📱':'Filter: '+SUBJECT_META[filter].name,'🎯');
  });

  const sc=document.getElementById('feedScroll');
  sc.addEventListener('scroll',()=>{ if(sc.scrollTop+sc.clientHeight>sc.scrollHeight-900) appendCards(4); });

  /* count a card as "seen" once 60% of it is on screen */
  const io=new IntersectionObserver(es=>{
    es.forEach(en=>{ if(en.isIntersecting&&!en.target.dataset.seen){ en.target.dataset.seen='1'; seen++; FM.seen++; hud(); saveState(); } });
  },{threshold:0.6});
  new MutationObserver(()=>sc.querySelectorAll('.post:not([data-seen-bind])').forEach(p=>{ p.setAttribute('data-seen-bind','1'); io.observe(p); })).observe(sc,{childList:true});

  /* pull-to-refresh shuffles a new deck */
  let sy=null;
  sc.addEventListener('touchstart',e=>{ sy=sc.scrollTop<6?e.touches[0].clientY:null; },{passive:true});
  sc.addEventListener('touchmove',e=>{
    if(sy===null) return;
    const dy=e.touches[0].clientY-sy, ptr=document.getElementById('ptr');
    if(ptr){ ptr.classList.toggle('show',dy>50); ptr.style.transform='translateX(-50%) translateY('+Math.min(dy*0.4,60)+'px)'; }
  },{passive:true});
  sc.addEventListener('touchend',()=>{
    const ptr=document.getElementById('ptr');
    if(ptr&&ptr.classList.contains('show')){ resetScroll(); toast('Fresh deck shuffled 🃏','✨'); }
    if(ptr){ ptr.classList.remove('show'); ptr.style.transform='translateX(-50%)'; }
    sy=null;
  },{passive:true});

  ready=true; resetScroll(); hud();
}

function openFeed(){
  const V=document.getElementById('feedView'); if(!V) return;
  V.classList.remove('hidden');
  const T=document.getElementById('trackView'); if(T) T.classList.add('hidden');
  if(!ready) initFeed();
}
function closeFeed(){ const V=document.getElementById('feedView'); if(V) V.classList.add('hidden'); }

/* FIX #3: guard the mode-switch wiring so a missing #modeSwitch can't throw */
const ms=document.getElementById('modeSwitch');
if(ms){
  ms.addEventListener('click',e=>{
    const btn=e.target.closest('button[data-mode]'); if(!btn) return;
    if(btn.getAttribute('data-mode')==='feed') openFeed(); else closeFeed();
  });
}
if(state.mode==='feed') openFeed();

window.__FEED_LOADED=true;
})();
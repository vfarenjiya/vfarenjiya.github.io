let currentFontSize = 1;
let isLightTheme = false;
let state = { view:'subject', done:{}, logDates:[], examDate:'', planStart:'', openSections:{}, openStudyPanels:{}, isLight:false, fontScale:1, pwaDismissed:false };
let searchQuery = '';

function todayISO(d){ d=d||new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function addDays(iso, n){ const d = new Date(iso+'T00:00:00'); d.setDate(d.getDate()+n); return d; }
function fmtShort(d){ return d.toLocaleDateString(undefined,{month:'short',day:'numeric'}); }
function computeStreak(dates){
  if(!dates.length) return 0;
  const set = new Set(dates); let streak = 0; let cursor = new Date();
  if(!set.has(todayISO())) cursor.setDate(cursor.getDate()-1);
  while(true){ const iso = todayISO(cursor); if(set.has(iso)){ streak++; cursor.setDate(cursor.getDate()-1); } else break; }
  return streak;
}
function loadState(){
  try{
    const res = localStorage.getItem('gate-da-stable-v1');
    if(res){ const parsed = JSON.parse(res); state = { ...state, ...parsed }; isLightTheme = !!state.isLight; currentFontSize = state.fontScale || 1; }
  }catch(e){}
}
function saveState(){ try{ localStorage.setItem('gate-da-stable-v1', JSON.stringify(state)); }catch(e){} }

/* FIXED regex: escaped $ + correct capture groups + throwOnError off */
function parseMathText(text){
  if(!text) return '';
  if(typeof katex === 'undefined') return text;
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (m,p)=>{ try{ return katex.renderToString(p,{displayMode:true,throwOnError:false}); }catch(e){ return m; } });
  text = text.replace(/\$([^$\n]+?)\$/g, (m,p)=>{ try{ return katex.renderToString(p,{displayMode:false,throwOnError:false}); }catch(e){ return m; } });
  return text;
}
function hashTopic(str){ let h=0; for(let i=0;i<str.length;i++) h = Math.imul(31,h)+str.charCodeAt(i)|0; return Math.abs(h); }

/* normalized lookup — trailing spaces can never break matching */
const MATH_DB = {};
Object.keys(MATH_DATABASE).forEach(k => { MATH_DB[k.toLowerCase().trim()] = MATH_DATABASE[k]; });

function getMathematicalContent(t){
  const title = t.t.toLowerCase().trim();
  const plainTopic = t.t;
  const baseEquation = t.f ? ('$'+t.f+'$') : 'the framework metric $f(X)$';
  let def=' ',thm=' ',sub=' ',ctr=' ',viz=' ',ex=' ';
  if(MATH_DB[title]){
    def = MATH_DB[title].def; thm = MATH_DB[title].thm; ctr = MATH_DB[title].ctr; ex = MATH_DB[title].ex;
    sub = '<li>Advanced Analytical Edge Cases</li><li>GATE Examination Optimization Rules</li><li>Variational Scope Structures</li>';
  } else {
    const h = hashTopic(title);
    const var1 = (h % 5) + 2;
    const var2 = ((h >> 2) % 4) + 3;      // FIXED bit-shift
    const var3 = ((h >> 4) % 10) + 10;    // FIXED bit-shift
    const scenario = h % 3;
    if(t.s === 'ps'){
      sub = '<li>Asymptotic Convergence Measures</li><li>Moment Analysis of '+plainTopic+'</li>';
      def = 'In stochastic modelling, <strong>'+plainTopic+'</strong> bounds probability mass via: $$'+(t.f || 'P(A \\cup B) = P(A) + P(B) - P(A \\cap B)')+'$$';
      thm = '<h5>Bounded Variational Limits</h5><p>Under uniform convergence, metrics built on '+plainTopic+' stabilize their means at infinity.</p>';
      ctr = '<span class="counter-title">Independence Axiom Collapse</span>Blindly applying '+baseEquation+' with non-zero cross-covariance compounds errors.';
      viz = '<table class="math-table"><tr><th>Domain</th><th>Support</th><th>Operator</th></tr><tr><td>Discrete PMF</td><td>$x \\in \\mathbb{Z}$</td><td>$\\Sigma$</td></tr><tr><td>Continuous PDF</td><td>$x \\in \\mathbb{R}$</td><td>$\\int$</td></tr></table>';
      ex = '<p><strong>Problem:</strong> Let $X$ have density $f(x)='+var1+'x^{'+(var1-1)+'}$ on $[0,1]$. Compute $\\text{Var}(X)$.</p><p><strong>Solution:</strong> $E[X]=\\frac{'+var1+'}{'+(var1+1)+'}$, $E[X^2]=\\frac{'+var1+'}{'+(var1+2)+'}$, so $\\text{Var}(X)=\\frac{'+var1+'}{'+(var1+2)+'}-\\left(\\frac{'+var1+'}{'+(var1+1)+'}\\right)^2$.</p>';
    } else if(t.s === 'la'){
      sub = '<li>Subspace Transformations</li><li>Spectral Analysis of '+plainTopic+'</li>';
      def = '<strong>'+plainTopic+'</strong> maps an operator within $\\mathbb{R}^n$ with structural stability under: $$'+(t.f || 'A\\mathbf{x} = \\mathbf{b}')+'$$';
      thm = '<h5>Dimension Partition Theorem</h5><p>The row structure mapped by '+plainTopic+' satisfies strict geometric closure.</p>';
      ctr = '<span class="counter-title">Nullspace Singularity</span>Assuming invertibility under '+baseEquation+' when rows are rank-deficient collapses dimensions.';
      viz = '<table class="math-table"><tr><th>Matrix Type</th><th>Determinant</th><th>Eigenvalues</th></tr><tr><td>Orthogonal</td><td>$\\pm1$</td><td>$|\\lambda|=1$</td></tr><tr><td>Sym. Pos. Def.</td><td>$>0$</td><td>all $\\lambda>0$</td></tr></table>';
      ex = '<p><strong>Problem:</strong> A matrix has eigenvalues $\\lambda_1='+var1+'$, $\\lambda_2='+var2+'$. Compute $\\det(A^2)$.</p><p><strong>Solution:</strong> $\\det(A)='+(var1*var2)+'$; $\\det(A^2)='+((var1*var2)**2)+'$.</p>';
    } else if(t.s === 'ml'){
      sub = '<li>Empirical Risk Minimization</li><li>Regularized Forms of '+plainTopic+'</li>';
      def = '<strong>'+plainTopic+'</strong> minimizes a penalty operator: $$'+(t.f || '\\arg\\min_w \\mathcal{L}(y,f(x;w))')+'$$';
      thm = '<h5>Loss Boundary Condensation</h5><p>Updates via '+plainTopic+' have convergence bounds controlled by learning constraints.</p>';
      ctr = '<span class="counter-title">Overfitting</span>Ignoring regularization when computing '+baseEquation+' pushes parameters into validation failure.';
      viz = '<table class="math-table"><tr><th>Penalty</th><th>Formula</th><th>Effect</th></tr><tr><td>L1 (Lasso)</td><td>$\\lambda\\sum|w_i|$</td><td>Sparsity</td></tr><tr><td>L2 (Ridge)</td><td>$\\lambda\\sum w_i^2$</td><td>Shrinkage</td></tr></table>';
      ex = '<p><strong>Problem:</strong> Gradient step with $\\eta=0.1$, gradient $[-'+var1+', '+var2+']^T$. Find the weight shift.</p><p><strong>Solution:</strong> $\\Delta w=-\\eta\\nabla J=['+(var1*0.1).toFixed(1)+', -'+(var2*0.1).toFixed(1)+']^T$.</p>';
    } else {
      sub = '<li>Complexity Class Restrictions</li><li>Relational Bounds for '+plainTopic+'</li>';
      def = '<strong>'+plainTopic+'</strong> is governed by structural complexity criteria: $$'+(t.f || 'T(n)=aT(n/b)+\\Theta(n^d)')+'$$';
      thm = '<h5>Asymptotic Containment</h5><p>Algorithms around '+plainTopic+' exhibit rigorous execution bounds.</p>';
      ctr = '<span class="counter-title">Adversarial Edge Cases</span>Assuming best-case behavior for '+baseEquation+' under adversarial inputs degrades throughput.';
      viz = '<table class="math-table"><tr><th>Profile</th><th>Average</th><th>Worst</th></tr><tr><td>Divide &amp; Conquer</td><td>$\\Theta(n \\log n)$</td><td>$O(n^2)$</td></tr><tr><td>Hash Mapping</td><td>$\\Theta(1)$</td><td>$O(n)$</td></tr></table>';
      ex = '<p><strong>Problem:</strong> Solve $T(n)='+var1+'T(n/'+var1+')+\\Theta(n)$.</p><p><strong>Solution:</strong> Master theorem: $a=b='+var1+'$, $d=1$, $\\log_b a=1=d$ → Case 2 → $\\Theta(n \\log n)$.</p>';
    }
  }
  const html = '<div class="module-header"><h3>'+t.t+'</h3><div class="module-tag">'+SUBJECT_META[t.s].name+'</div></div>'
    +'<div class="study-section"><h4>Formal Definition &amp; Notation</h4><div class="def-box">'+def+'</div></div>'
    +'<div class="study-section"><h4>Theorems &amp; Properties</h4><div class="theorem-box">'+thm+'</div></div>'
    +'<div class="study-section"><h4>Critical Counter-Examples</h4><div class="counter-box">'+ctr+'</div></div>'
    +(viz.trim()!==' ' ? '<div class="study-section"><h4>Visualizations &amp; Structures</h4>'+viz+'</div>' : '')
    +'<div class="study-section"><h4>Advanced Application</h4><div class="example-box">'+ex+'</div></div>'
    +'<div class="study-section"><h4>Extended Scope</h4><ul>'+sub+'</ul></div>';
  return parseMathText(html);
}

function matchesSearch(item){
  if(!searchQuery) return true;
  const q = searchQuery.toLowerCase();
  return item.t.toLowerCase().includes(q) || (item.f && item.f.toLowerCase().includes(q)) || (item.tip && item.tip.toLowerCase().includes(q));
}

/* FIXED: clean class names / closing tags */
function rowTemplate(t, groupKey){
  const isStudyOpen = state.openStudyPanels[t.id];
  return `
  <li class="topic-item-container">
    <div class="topic-row ${state.done[t.id]?'on':''}" data-id="${t.id}" data-group="${groupKey}" onclick="toggleTopic('${t.id}','${groupKey}')">
      <div class="punch ${state.done[t.id]?'on':''}"></div>
      <div class="topic-main">
        <div class="topic-text">${t.t}</div>
        <div class="topic-formula">${t.f ? parseMathText('$'+t.f+'$') : parseMathText(t.tip||'')}</div>
      </div>
      <button class="study-btn" onclick="toggleStudyPanel('${t.id}', event)">${isStudyOpen ? 'Close Module' : 'Study Math'}</button>
    </div>
    <div class="study-panel ${isStudyOpen ? 'open' : ''}" id="study-${t.id}">
      ${isStudyOpen ? getMathematicalContent(t) : ''}
    </div>
  </li>`;
}

function renderSubjectView(container){
  let anyRendered = false;
  SUBJECT_ORDER.forEach((sid, sIdx)=>{
    const meta = SUBJECT_META[sid];
    const all = TOPICS.filter(t=>t.s===sid);
    const items = all.filter(matchesSearch);
    if(!items.length) return;
    anyRendered = true;
    const doneCount = all.reduce((a,t)=> a+(state.done[t.id]?1:0), 0);
    const pct = Math.round((doneCount/all.length)*100);
    const key = 'subj-'+sid;
    const isOpen = searchQuery ? true : !!state.openSections[key];
    const ticket = document.createElement('div');
    ticket.className = 'ticket';
    ticket.innerHTML = `
      <div class="ticket-head ${searchQuery ? 'search-lock' : ''}" data-toggle="${key}">
        <div class="ticket-index">${String(sIdx+1).padStart(2,'0')}</div>
        <div class="ticket-title">${meta.name}</div>
        <div class="ticket-meta">
          <span class="ticket-frac" style="font-size:12px;color:var(--muted);font-family:monospace">${doneCount}/${all.length}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:linear-gradient(90deg, ${meta.color}, var(--green))"></div></div>
        </div>
      </div>
      <div class="ticket-body-wrapper ${isOpen?'open':''}">
        <div class="ticket-body">
          <div class="ticket-body-inner">
            <ul class="topic-list">${items.map(t=>rowTemplate(t, key)).join('')}</ul>
          </div>
        </div>
      </div>`;
    container.appendChild(ticket);
  });
  return anyRendered;
}

function renderWeekView(container){
  let anyRendered = false;
  const start = state.planStart || todayISO();
  for(let w=1; w<=12; w++){
    const allItems = TOPICS.filter(t=>t.w===w);
    const items = allItems.filter(matchesSearch);
    if(!items.length) continue;
    anyRendered = true;
    const doneCount = allItems.reduce((a,t)=> a+(state.done[t.id]?1:0), 0);
    const pct = Math.round((doneCount/allItems.length)*100);
    const key = 'week-'+w;
    const isOpen = searchQuery ? true : !!state.openSections[key];
    const wkStart = addDays(start, (w-1)*7);
    const wkEnd = addDays(start, (w-1)*7+6);
    const subjects = [...new Set(allItems.map(i=>i.s))].map(s=>SUBJECT_META[s].name).join(' · ');
    const ticket = document.createElement('div');
    ticket.className = 'ticket';
    ticket.innerHTML = `
      <div class="ticket-head ${searchQuery ? 'search-lock' : ''}" data-toggle="${key}">
        <div class="ticket-index">W${w}</div>
        <div class="ticket-title">Week ${w}<span class="ticket-sub">${fmtShort(wkStart)} – ${fmtShort(wkEnd)} · ${subjects}</span></div>
        <div class="ticket-meta">
          <span class="ticket-frac" style="font-size:12px;color:var(--muted);font-family:monospace">${doneCount}/${allItems.length}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:linear-gradient(90deg, var(--amber), var(--green))"></div></div>
        </div>
      </div>
      <div class="ticket-body-wrapper ${isOpen?'open':''}">
        <div class="ticket-body">
          <div class="ticket-body-inner">
            <ul class="topic-list">${items.map(t=>rowTemplate(t, key)).join('')}</ul>
          </div>
        </div>
      </div>`;
    container.appendChild(ticket);
  }
  return anyRendered;
}

function render(){
  const container = document.getElementById('ticketContainer');
  container.innerHTML = '';
  const anyRendered = state.view==='week' ? renderWeekView(container) : renderSubjectView(container);
  if(!anyRendered){
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty';
    emptyDiv.textContent = 'No topics match "'+searchQuery+'". Try a different word.';
    container.appendChild(emptyDiv);
  }
  const matchCountEl = document.getElementById('matchCount');
  if(searchQuery){ matchCountEl.textContent = TOPICS.filter(matchesSearch).length+' of '+TOPICS.length+' topics match'; }
  else { matchCountEl.textContent = ''; }
  container.querySelectorAll('[data-toggle]').forEach(el=>{
    el.addEventListener('click', ()=>{
      if(searchQuery) return;
      const id = el.getAttribute('data-toggle');
      state.openSections[id] = !state.openSections[id];
      render(); saveState();
    });
  });
  updateHeader();
}

function toggleTopic(id, groupKey){ state.done[id] = !state.done[id]; state.openSections[groupKey] = true; render(); saveState(); }
function toggleStudyPanel(id, ev){ if(ev) ev.stopPropagation(); state.openStudyPanels[id] = !state.openStudyPanels[id]; render(); saveState(); }

function updateHeader(){
  const done = TOPICS.reduce((acc,t)=> acc+(state.done[t.id]?1:0), 0);
  const pct = Math.round((done/TOPICS.length)*100);                       // FIXED: added *
  document.getElementById('ringPct').textContent = pct+'%';
  document.getElementById('ringFrac').textContent = done+' / '+TOPICS.length;
  document.getElementById('ringFill').setAttribute('stroke-dashoffset', 169.6-(169.6*pct/100));  // FIXED: added *
  document.getElementById('streakNum').textContent = computeStreak(state.logDates);
  const loggedToday = state.logDates.includes(todayISO());
  const btn = document.getElementById('logBtn');
  if(loggedToday){ btn.textContent = '✓ Logged today'; btn.classList.add('done'); }
  else { btn.textContent = "Log today's lecture"; btn.classList.remove('done'); }
  document.getElementById('examDate').value = state.examDate || '';
  const hint = document.getElementById('daysLeftHint');
  if(state.examDate){
    const diff = Math.ceil((new Date(state.examDate) - new Date(todayISO())) / 86400000);
    hint.textContent = diff >= 0 ? diff+' day'+(diff===1?'':'s')+' until exam day' : 'Exam day has passed';
  } else { hint.textContent = 'Set your exam date to see a countdown'; }
}

/* events — FIXED arrows, getElementById; studyRedirectBtn guarded */
document.getElementById('logBtn').addEventListener('click', ()=>{
  const t = todayISO();
  if(!state.logDates.includes(t)){ state.logDates.push(t); saveState(); updateHeader(); }
});
document.getElementById('examDate').addEventListener('change', (e)=>{ state.examDate = e.target.value; saveState(); updateHeader(); });
document.getElementById('planStart').addEventListener('change', (e)=>{ state.planStart = e.target.value; saveState(); render(); });
document.getElementById('resetBtn').addEventListener('click', ()=>{
  if(confirm('This clears all checked topics and your streak. Continue?')){
    state = { view:state.view, done:{}, logDates:[], examDate:state.examDate, planStart:state.planStart, openSections:{}, openStudyPanels:{}, isLight:state.isLight, fontScale:state.fontScale, pwaDismissed:state.pwaDismissed };
    saveState(); render(); updateHeader();
  }
});
document.getElementById('themeToggleBtn').addEventListener('click', ()=>{
  isLightTheme = !isLightTheme;
  document.body.classList.toggle('light-theme', isLightTheme);
  state.isLight = isLightTheme; saveState();
});
document.getElementById('fontMinusBtn').addEventListener('click', ()=>{
  if(currentFontSize > 0.8){ currentFontSize -= 0.1; document.documentElement.style.setProperty('--font-scale', currentFontSize); state.fontScale = currentFontSize; saveState(); }
});
document.getElementById('fontPlusBtn').addEventListener('click', ()=>{
  if(currentFontSize < 1.6){ currentFontSize += 0.1; document.documentElement.style.setProperty('--font-scale', currentFontSize); state.fontScale = currentFontSize; saveState(); }
});
document.getElementById('expandAllBtn').addEventListener('click', ()=>{
  const keys = state.view==='week' ? Array.from({length:12},(_,i)=>'week-'+(i+1)) : SUBJECT_ORDER.map(s=>'subj-'+s);
  keys.forEach(k=> state.openSections[k] = true);
  saveState(); render();
});
document.getElementById('collapseAllBtn').addEventListener('click', ()=>{
  const keys = state.view==='week' ? Array.from({length:12},(_,i)=>'week-'+(i+1)) : SUBJECT_ORDER.map(s=>'subj-'+s);
  keys.forEach(k=> state.openSections[k] = false);
  saveState(); render();
});
document.getElementById('searchBox').addEventListener('input', (e)=>{ searchQuery = e.target.value.trim(); render(); });
document.getElementById('viewSwitch').addEventListener('click', (e)=>{
  const btn = e.target.closest('button[data-view]');
  if(!btn) return;
  state.view = btn.getAttribute('data-view');
  document.querySelectorAll('#viewSwitch button').forEach(b=>b.classList.toggle('active', b===btn));
  document.getElementById('planStartRow').style.display = state.view==='week' ? 'flex' : 'none';
  saveState(); render();
});
const studyRedirectBtn = document.getElementById('studyRedirectBtn');
if(studyRedirectBtn) studyRedirectBtn.addEventListener('click', ()=>{ window.location.href = 'study/index.html'; });

/* boot */
(function(){
  loadState();
  document.body.classList.toggle('light-theme', isLightTheme);
  document.documentElement.style.setProperty('--font-scale', currentFontSize);
  document.querySelectorAll('#viewSwitch button').forEach(b=>b.classList.toggle('active', b.getAttribute('data-view')===state.view));
  document.getElementById('planStartRow').style.display = state.view==='week' ? 'flex' : 'none';
  if(!state.planStart) state.planStart = todayISO();
  document.getElementById('planStart').value = state.planStart;
  render();
  updateHeader();
})();

/* PWA */
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').then(()=>console.log('SW registered')).catch(err=>console.log('SW failed:', err));
  });
}
let deferredInstallPrompt = null;
const pwaBanner = document.getElementById('pwaBanner');
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault(); deferredInstallPrompt = e;
  if(!state.pwaDismissed) setTimeout(()=> pwaBanner.classList.remove('hidden'), 2500);
});
document.getElementById('pwaInstall').addEventListener('click', async ()=>{
  pwaBanner.classList.add('hidden');
  if(!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
});
document.getElementById('pwaDismiss').addEventListener('click', ()=>{ pwaBanner.classList.add('hidden'); state.pwaDismissed = true; saveState(); });
window.addEventListener('appinstalled', ()=>{ pwaBanner.classList.add('hidden'); deferredInstallPrompt = null; });

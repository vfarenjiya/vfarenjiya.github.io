let currentFontSize = 1;
let isLightTheme = false;
let state = { view: 'subject', done:{}, logDates:[], examDate:'', planStart:'', openSections:{}, openStudyPanels:{}, isLight: false, fontScale: 1, pwaDismissed: false };
let searchQuery = '';

function todayISO(d){
  d = d || new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function addDays(iso, n){ const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return d; }
function fmtShort(d){ return d.toLocaleDateString(undefined, {month:'short', day:'numeric'}); }
function computeStreak(dates){
  if(!dates.length) return 0;
  const set = new Set(dates);
  let streak = 0;
  let cursor = new Date();
  if(!set.has(todayISO())) cursor.setDate(cursor.getDate()-1);
  while(true){
    const iso = todayISO(cursor);
    if(set.has(iso)){ streak++; cursor.setDate(cursor.getDate()-1); } else break;
  }
  return streak;
}
function loadState(){
  try{
    const res = localStorage.getItem('gate-da-stable-v1');
    if(res){
      const parsed = JSON.parse(res);
      state = { ...state, ...parsed };
      isLightTheme = !!state.isLight;
      currentFontSize = state.fontScale || 1;
    }
  }catch(e){}
}
function saveState(){ try{ localStorage.setItem('gate-da-stable-v1', JSON.stringify(state)); }catch(e){} }

/* FIXED: properly escaped $, correct capture groups, throwOnError off */
function parseMathText(text){
  if(!text) return '';
  if(typeof katex === 'undefined') return text;
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (m,p1)=>{ try{ return katex.renderToString(p1,{displayMode:true,throwOnError:false}); }catch(e){ return m; } });
  text = text.replace(/\$([^$\n]+?)\$/g, (m,p1)=>{ try{ return katex.renderToString(p1,{displayMode:false,throwOnError:false}); }catch(e){ return m; } });
  return text;
}
function hashTopic(str){
  let hash = 0;
  for(let i=0;i<str.length;i++) hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  return Math.abs(hash);
}

/* FIXED: normalized lookup map — trims/normalizes keys so trailing spaces can never break matching */
const MATH_DB = {};
Object.keys(MATH_DATABASE).forEach(k => { MATH_DB[k.toLowerCase().trim()] = MATH_DATABASE[k]; });

function getMathematicalContent(t){
  let title = t.t.toLowerCase().trim();
  let plainTopic = t.t;
  let baseEquation = t.f ? ('$' + t.f + '$') : 'the framework metric $f(X)$';
  let def = ' ', thm = ' ', sub = ' ', ctr = ' ', viz = ' ', ex = ' ';

  if(MATH_DB[title]){
    def = MATH_DB[title].def;
    thm = MATH_DB[title].thm;
    ctr = MATH_DB[title].ctr;
    ex  = MATH_DB[title].ex;
    sub = '<li>Advanced Analytical Edge Cases</li><li>GATE Examination Optimization Rules</li><li>Variational Scope Structures</li>';
  } else {
    let topicHash = hashTopic(title);
    let var1 = (topicHash % 5) + 2;
    let var2 = ((topicHash >> 2) % 4) + 3;      // FIXED: was ">> " broken
    let var3 = ((topicHash >> 4) % 10) + 10;    // FIXED
    let scenario = topicHash % 3;

    if(t.s === 'ps'){
      sub = '<li>Asymptotic Convergence Measures</li><li>Moment Analysis of ' + plainTopic + '</li>';
      def = 'In mathematical stochastics, <strong>' + plainTopic + '</strong> models a mapped probability space. Its canonical behavior bounds constraints via the identity: $$' + (t.f ? t.f : 'P(A \\cup B) = P(A) + P(B) - P(A \\cap B)') + '$$';
      thm = '<h5>Theorem of Bounded Variational Limits</h5><p>Under uniform convergence laws, metrics using ' + plainTopic + ' stabilize their mean metrics at infinity.</p>';
      ctr = '<span class="counter-title">Independent Axiom Collapse</span>Blindly using ' + baseEquation + ' when cross-covariance terms are non-zero creates compounding errors during system updates.';
      viz = '<table class="math-table"><tr><th>Domain Context</th><th>Support Range</th><th>Key Operator</th></tr><tr><td>Discrete PMF</td><td>$x \\in \\mathbb{Z}$</td><td>$\\Sigma$ (Summation)</td></tr><tr><td>Continuous PDF</td><td>$x \\in \\mathbb{R}$</td><td>$\\int$ (Integration)</td></tr></table>';
      if(scenario === 0){
        ex = '<p><strong>Advanced Problem (' + plainTopic + '):</strong> A randomized data pipeline relies on a system obeying ' + baseEquation + '. Given a performance variable tracking parameter $\\alpha = ' + var1 + '$, the joint loss space bounds density uniformly over $f(x) = ' + var1 + 'x^{' + (var1-1) + '}$ for $x \\in [0,1]$. Evaluate the exact system variance.</p>' +
             '<p><strong>Step-by-Step Solution:</strong><br>' +
             '1. First raw moment: $E[X] = \\int_0^1 ' + var1 + 'x^{' + var1 + '}\\, dx = \\frac{' + var1 + '}{' + (var1+1) + '}$.<br>' +
             '2. Second raw moment: $E[X^2] = \\int_0^1 ' + var1 + 'x^{' + (var1+1) + '}\\, dx = \\frac{' + var1 + '}{' + (var1+2) + '}$.<br>' +
             '3. Variance identity: $\\text{Var}(X) = \\frac{' + var1 + '}{' + (var1+2) + '} - \\left(\\frac{' + var1 + '}{' + (var1+1) + '}\\right)^2$.</p>';
      } else if(scenario === 1){
        ex = '<p><strong>Advanced Problem (' + plainTopic + '):</strong> A protocol uses ' + baseEquation + ' to bound phase shifts. If the shift parameter is $\\lambda = ' + var2 + '$, evaluate $\\int_{0}^{\\infty} x^{' + var2 + '} e^{-x}\\, dx$.</p>' +
             '<p><strong>Step-by-Step Solution:</strong><br>' +
             '1. Gamma identity: $\\Gamma(n) = \\int_0^\\infty x^{n-1} e^{-x}\\, dx = (n-1)!$.<br>' +
             '2. Match: $n-1 = ' + var2 + '$ so $n = ' + (var2+1) + '$.<br>' +
             '3. Exact value: $\\Gamma(' + (var2+1) + ') = ' + var2 + '!$.</p>';
      } else {
        ex = '<p><strong>Advanced Problem (' + plainTopic + '):</strong> A risk model relies on ' + baseEquation + '. Default occurs if a shock $Z \\sim N(0,1)$ exceeds $z = ' + (var1/2) + '$. Bound this tail probability using Markov on $Z^2$.</p>' +
             '<p><strong>Step-by-Step Solution:</strong><br>' +
             '1. Apply Markov to $Z^2 \\sim \\chi^2_1$: $P(Z^2 \\ge ' + Math.pow(var1/2, 2) + ') \\le \\frac{E[Z^2]}{' + Math.pow(var1/2, 2) + '}$.<br>' +
             '2. Since $E[Z^2]=1$, the risk ceiling is $\\frac{1}{' + Math.pow(var1/2, 2) + '}$.</p>';
      }
    } else if(t.s === 'la'){
      sub = '<li>Subspace Transformations</li><li>Spectral Analysis for ' + plainTopic + '</li>';
      def = 'In linear algebraic operations, <strong>' + plainTopic + '</strong> explicitly maps an operator within $\\mathbb{R}^n$. The system holds structural stability under: $$' + (t.f ? t.f : 'A\\mathbf{x} = \\mathbf{b}') + '$$';
      thm = '<h5>Dimension Partition Theorem</h5><p>The matrix row structure mapped during actions of ' + plainTopic + ' satisfies strict geometric closure criteria.</p>';
      ctr = '<span class="counter-title">Nullspace Singularity</span>Assuming invertibility under ' + baseEquation + ' when structural rows maintain zero-rank combinations collapses dimensions.';
      viz = '<table class="math-table"><tr><th>Matrix Type</th><th>Determinant</th><th>Eigenvalue Properties</th></tr><tr><td>Orthogonal</td><td>$\\pm 1$</td><td>$|\\lambda| = 1$</td></tr><tr><td>Symmetric Positive Definite</td><td>$> 0$</td><td>All $\\lambda > 0$</td></tr></table>';
      if(scenario === 0){
        ex = '<p><strong>Advanced Problem (' + plainTopic + '):</strong> A matrix has eigenvalues $\\lambda_1 = ' + var1 + '$ and $\\lambda_2 = ' + var2 + '$. Calculate $\\det(A^2)$.</p>' +
             '<p><strong>Step-by-Step Solution:</strong><br>' +
             '1. $\\det(A) = \\lambda_1 \\lambda_2 = ' + (var1*var2) + '$.<br>' +
             '2. $\\det(A^2) = (\\det A)^2 = ' + Math.pow(var1*var2, 2) + '$.</p>';
      } else if(scenario === 1){
        ex = '<p><strong>Advanced Problem (' + plainTopic + '):</strong> A scaling matrix $S$ has trace ' + var3 + '. Two eigenvalues equal ' + var1 + '. Find the third.</p>' +
             '<p><strong>Step-by-Step Solution:</strong><br>' +
             '1. Trace = sum of eigenvalues: $' + var3 + ' = ' + var1 + ' + ' + var1 + ' + \\lambda_3$.<br>' +
             '2. $\\lambda_3 = ' + (var3 - var1*2) + '$.</p>';
      } else {
        ex = '<p><strong>Advanced Problem (' + plainTopic + '):</strong> A Markov matrix $M$ satisfies $M^T M = ' + var1 + ' I$. Is $M$ a pure isometric rotation?</p>' +
             '<p><strong>Step-by-Step Solution:</strong><br>' +
             '1. Isometry requires $M^T M = I$.<br>' +
             '2. Since ' + var1 + ' \\ne 1$, $M$ scales lengths by $\\sqrt{' + var1 + '}$ — a scaled rotation, not a pure isometry.</p>';
      }
    } else if(t.s === 'ml'){
      sub = '<li>Empirical Risk Minimization</li><li>Regularized Footprints of ' + plainTopic + '</li>';
      def = 'For <strong>' + plainTopic + '</strong>, optimization maps an empirical trajectory designed to minimize a penalty operator: $$' + (t.f ? t.f : '\\arg\\min_w \\mathcal{L}(y, f(x; w))') + '$$';
      thm = '<h5>Structural Loss Boundary Condensation</h5><p>Guarantees that models updating weights via ' + plainTopic + ' have convergence bounds controlled by learning constraints.</p>';
      ctr = '<span class="counter-title">Overfitting Over-parameterization</span>Ignoring regularization boundaries when calculating ' + baseEquation + ' shifts parameters into extreme validation failure profiles.';
      viz = '<table class="math-table"><tr><th>Regularization</th><th>Formula</th><th>Effect on Weights</th></tr><tr><td>L1 (Lasso)</td><td>$\\lambda \\sum |w_i|$</td><td>Sparsity (drives to exactly 0)</td></tr><tr><td>L2 (Ridge)</td><td>$\\lambda \\sum w_i^2$</td><td>Shrinkage (drives near 0)</td></tr></table>';
      if(scenario === 0){
        ex = '<p><strong>Advanced Problem (' + plainTopic + '):</strong> A classifier uses step size $\\eta = 0.1$ with gradient $[-' + var1 + ', ' + var2 + ']^T$. Find the weight update.</p>' +
             '<p><strong>Step-by-Step Solution:</strong><br>' +
             '1. $w^{(t+1)} = w^{(t)} - \\eta \\nabla J(w)$.<br>' +
             '2. $\\Delta w = -0.1 \\begin{pmatrix} -' + var1 + ' \\\\ ' + var2 + ' \\end{pmatrix} = \\begin{pmatrix} ' + (var1*0.1).toFixed(1) + ' \\\\ -' + (var2*0.1).toFixed(1) + ' \\end{pmatrix}$.</p>';
      } else if(scenario === 1){
        ex = '<p><strong>Advanced Problem (' + plainTopic + '):</strong> An SVM uses polynomial kernel $K(x,y) = (x^T y + ' + var1 + ')^{' + var2 + '}$. With $x=[1,0]^T$, $y=[0,1]^T$, find $\\phi(x)^T \\phi(y)$.</p>' +
             '<p><strong>Step-by-Step Solution:</strong><br>' +
             '1. Kernel trick: $\\phi(x)^T \\phi(y) = K(x,y)$.<br>' +
             '2. $x^T y = 0$.<br>' +
             '3. $K = ' + var1 + '^{' + var2 + '} = ' + Math.pow(var1, var2) + '$.</p>';
      } else {
        ex = '<p><strong>Advanced Problem (' + plainTopic + '):</strong> In k-means, point $P(' + var1 + ', ' + var2 + ')$ vs centroids $C_1(0,0)$ and $C_2(' + var3 + ', 0)$. Verify the assignment.</p>' +
             '<p><strong>Step-by-Step Solution:</strong><br>' +
             '1. $d_1^2 = ' + (var1*var1) + ' + ' + (var2*var2) + ' = ' + (var1*var1 + var2*var2) + '$.<br>' +
             '2. $d_2^2 = ' + Math.pow(var1-var3, 2) + ' + ' + (var2*var2) + ' = ' + (Math.pow(var1-var3, 2) + var2*var2) + '$.<br>' +
             '3. Assign to the smaller; otherwise the allocation is sub-optimal.</p>';
      }
    } else {
      sub = '<li>Complexity Class Restrictions</li><li>Relational Bounds for ' + plainTopic + '</li>';
      def = 'The module <strong>' + plainTopic + '</strong> evaluates computational patterns governed by structural complexity criteria: $$' + (t.f ? t.f : 'T(n) = aT(n/b) + \\Theta(n^d)') + '$$';
      thm = '<h5>Asymptotic Containment Principle</h5><p>Maps processing ' + plainTopic + ' exhibit rigorous execution-behavior constraints.</p>';
      ctr = '<span class="counter-title">Adversarial Edge-Case Degradation</span>Assuming best-case operations for ' + baseEquation + ' under adversarial input profiles degrades throughput to worst-case limits.';
      viz = '<table class="math-table"><tr><th>Algorithm Profile</th><th>Average Case</th><th>Worst Case</th></tr><tr><td>Divide and Conquer</td><td>$\\Theta(n \\log n)$</td><td>$O(n^2)$</td></tr><tr><td>Hash Mapping</td><td>$\\Theta(1)$</td><td>$O(n)$</td></tr></table>';
      if(scenario === 0){
        ex = '<p><strong>Advanced Problem (' + plainTopic + '):</strong> Solve the recurrence $T(n) = ' + var1 + 'T(n/' + var1 + ') + \\Theta(n)$.</p>' +
             '<p><strong>Step-by-Step Solution:</strong><br>' +
             '1. Master theorem: $a=' + var1 + '$, $b=' + var1 + '$, $d=1$.<br>' +
             '2. $\\log_b a = 1 = d$ → Case 2.<br>' +
             '3. Tight bound: $\\Theta(n \\log n)$.</p>';
      } else if(scenario === 1){
        ex = '<p><strong>Advanced Problem (' + plainTopic + '):</strong> Block nested loop join: table A $N=' + var3 + '$ pages, table B $M=' + var1 + '$ pages, ' + var2 + ' buffer blocks. Minimum block transfers?</p>' +
             '<p><strong>Step-by-Step Solution:</strong><br>' +
             '1. $T = N + \\lceil N/(B-2) \\rceil \\times M$.<br>' +
             '2. $\\lceil ' + var3 + '/' + (var2-2) + ' \\rceil = ' + Math.ceil(var3/(var2-2)) + '$.<br>' +
             '3. Total: ' + var3 + ' + ' + (Math.ceil(var3/(var2-2))*var1) + ' = ' + (var3 + Math.ceil(var3/(var2-2))*var1) + '$.</p>';
      } else {
        ex = '<p><strong>Advanced Problem (' + plainTopic + '):</strong> Dijkstra with Fibonacci heap on $|V|=' + var3 + '$, $|E|=' + (var1*var3) + '$. Dominant asymptotic term?</p>' +
             '<p><strong>Step-by-Step Solution:</strong><br>' +
             '1. Bound: $O(|E| + |V| \\log |V|)$.<br>' +
             '2. $|V| \\log |V|$ dominates the linear term.<br>' +
             '3. Bottleneck: $O(|V| \\log |V|)$ from priority-queue extractions.</p>';
      }
    }
  }

  let htmlString =
    '<div class="module-header"><h3>' + t.t + '</h3><div class="module-tag">' + SUBJECT_META[t.s].name + '</div></div>' +
    '<div class="study-section"><h4>Formal Definition & Structural Notation</h4><div class="def-box">' + def + '</div></div>' +
    '<div class="study-section"><h4>Theorems, Conditions & Properties</h4><div class="theorem-box">' + thm + '</div></div>' +
    '<div class="study-section"><h4>Critical Counter-Examples</h4><div class="counter-box">' + ctr + '</div></div>' +
    (viz.trim() !== ' ' ? '<div class="study-section"><h4>Visualizations & Data Structures</h4>' + viz + '</div>' : '') +
    '<div class="study-section"><h4>Advanced Application (Word Problem)</h4><div class="example-box">' + ex + '</div></div>' +
    '<div class="study-section"><h4>Subtopics & Extended Scope</h4><ul>' + sub + '</ul></div>';
  return parseMathText(htmlString);
}

function matchesSearch(item){
  if(!searchQuery) return true;
  const q = searchQuery.toLowerCase();
  return item.t.toLowerCase().includes(q) || (item.f && item.f.toLowerCase().includes(q)) || (item.tip && item.tip.toLowerCase().includes(q));
}

/* FIXED: clean class names and closing tags */
function rowTemplate(t, groupKey){
  const isStudyOpen = state.openStudyPanels[t.id];
  return `
  <li class="topic-item-container">
    <div class="topic-row ${state.done[t.id]?'on':''}" data-id="${t.id}" data-group="${groupKey}" onclick="toggleTopic('${t.id}', '${groupKey}')">
      <div class="punch ${state.done[t.id]?'on':''}"></div>
      <div class="topic-main">
        <div class="topic-text">${t.t}</div>
        <div class="topic-formula">${t.f ? parseMathText('$'+t.f+'$') : parseMathText(t.tip || '')}</div>
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
    const doneCount = all.reduce((a,t)=> a + (state.done[t.id]?1:0), 0);
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
    const doneCount = allItems.reduce((a,t)=> a + (state.done[t.id]?1:0), 0);
    const pct = Math.round((doneCount/allItems.length)*100);
    const key = 'week-'+w;
    const isOpen = searchQuery ? true : !!state.openSections[key];
    const wkStart = addDays(start, (w-1)*7);
    const wkEnd = addDays(start, (w-1)*7 + 6);
    const subjectsInWeek = [...new Set(allItems.map(i=>i.s))].map(s=>SUBJECT_META[s].name).join(' · ');
    const ticket = document.createElement('div');
    ticket.className = 'ticket';
    ticket.innerHTML = `
      <div class="ticket-head ${searchQuery ? 'search-lock' : ''}" data-toggle="${key}">
        <div class="ticket-index">W${w}</div>
        <div class="ticket-title">Week ${w}<span class="ticket-sub">${fmtShort(wkStart)} – ${fmtShort(wkEnd)} · ${subjectsInWeek}</span></div>
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
  const anyRendered = state.view === 'week' ? renderWeekView(container) : renderSubjectView(container);
  if(!anyRendered){
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty';
    emptyDiv.textContent = 'No topics match "' + searchQuery + '". Try a different word.';
    container.appendChild(emptyDiv);
  }
  const matchCountEl = document.getElementById('matchCount');
  if(searchQuery){
    const n = TOPICS.filter(matchesSearch).length;
    matchCountEl.textContent = n + ' of ' + TOPICS.length + ' topics match';
  } else {
    matchCountEl.textContent = '';
  }
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

function toggleTopic(id, groupKey){
  state.done[id] = !state.done[id];
  state.openSections[groupKey] = true;
  render(); saveState();
}
function toggleStudyPanel(id, ev){
  if(ev) ev.stopPropagation();
  state.openStudyPanels[id] = !state.openStudyPanels[id];
  render(); saveState();
}

function updateHeader(){
  const done = TOPICS.reduce((acc,t)=> acc + (state.done[t.id] ? 1 : 0), 0);
  const pct = Math.round((done/TOPICS.length)*100);          // FIXED: was missing *
  document.getElementById('ringPct').textContent = pct + '%';
  document.getElementById('ringFrac').textContent = done + ' / ' + TOPICS.length;
  document.getElementById('ringFill').setAttribute('stroke-dashoffset', 169.6 - (169.6*pct/100));  // FIXED: was 169.6pct
  const streak = computeStreak(state.logDates);
  document.getElementById('streakNum').textContent = streak;
  const loggedToday = state.logDates.includes(todayISO());
  const btn = document.getElementById('logBtn');
  if(loggedToday){ btn.textContent = '✓ Logged today'; btn.classList.add('done'); }
  else { btn.textContent = "Log today's lecture"; btn.classList.remove('done'); }
  document.getElementById('examDate').value = state.examDate || '';
  const hint = document.getElementById('daysLeftHint');
  if(state.examDate){
    const diff = Math.ceil((new Date(state.examDate) - new Date(todayISO())) / 86400000);
    hint.textContent = diff >= 0 ? diff + ' day' + (diff===1?'':'s') + ' until exam day' : 'Exam day has passed';
  } else {
    hint.textContent = 'Set your exam date to see a countdown';
  }
}

/* ---------- events (all FIXED: arrows, getElementById, removed dead studyRedirectBtn) ---------- */
document.getElementById('logBtn').addEventListener('click', ()=>{
  const t = todayISO();
  if(!state.logDates.includes(t)){ state.logDates.push(t); saveState(); updateHeader(); }
});
document.getElementById('examDate').addEventListener('change', (e)=>{
  state.examDate = e.target.value; saveState(); updateHeader();
});
document.getElementById('planStart').addEventListener('change', (e)=>{
  state.planStart = e.target.value; saveState(); render();
});
document.getElementById('resetBtn').addEventListener('click', ()=>{
  if(confirm('This clears all checked topics and your streak. Continue?')){
    state = { view: state.view, done:{}, logDates:[], examDate: state.examDate, planStart: state.planStart, openSections:{}, openStudyPanels:{}, isLight: state.isLight, fontScale: state.fontScale, pwaDismissed: state.pwaDismissed };
    saveState(); render(); updateHeader();
  }
});
document.getElementById('themeToggleBtn').addEventListener('click', ()=>{
  isLightTheme = !isLightTheme;
  document.body.classList.toggle('light-theme', isLightTheme);
  state.isLight = isLightTheme;
  saveState();
});
document.getElementById('fontMinusBtn').addEventListener('click', ()=>{
  if(currentFontSize > 0.8){
    currentFontSize -= 0.1;
    document.documentElement.style.setProperty('--font-scale', currentFontSize);
    state.fontScale = currentFontSize;
    saveState();
  }
});
document.getElementById('fontPlusBtn').addEventListener('click', ()=>{
  if(currentFontSize < 1.6){
    currentFontSize += 0.1;
    document.documentElement.style.setProperty('--font-scale', currentFontSize);
    state.fontScale = currentFontSize;
    saveState();
  }
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

/* ---------- boot ---------- */
(()=>{
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

/* ---------- PWA ---------- */
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker Registered!'))
      .catch(err => console.log('Registration failed:', err));
  });
}
let deferredInstallPrompt = null;
const pwaBanner = document.getElementById('pwaBanner');
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredInstallPrompt = e;
  if(!state.pwaDismissed){
    setTimeout(()=> pwaBanner.classList.remove('hidden'), 2500);
  }
});
document.getElementById('pwaInstall').addEventListener('click', async ()=>{
  pwaBanner.classList.add('hidden');
  if(!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
});
document.getElementById('pwaDismiss').addEventListener('click', ()=>{
  pwaBanner.classList.add('hidden');
  state.pwaDismissed = true;
  saveState();
});
window.addEventListener('appinstalled', ()=>{
  pwaBanner.classList.add('hidden');
  deferredInstallPrompt = null;
});

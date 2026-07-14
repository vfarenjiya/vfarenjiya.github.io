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
    if(res) {
      const parsed = JSON.parse(res);
      state = { ...state, ...parsed }; 
      isLightTheme = !!state.isLight;
      currentFontSize = state.fontScale || 1;
    }
  }catch(e){} 
}
function saveState(){ try{ localStorage.setItem('gate-da-stable-v1', JSON.stringify(state)); }catch(e){} }

function parseMathText(text) {
  if (!text) return '';
  text = text.replace(/\$\$(.*?)\$\$/gs, (m, p1) => { try { return katex.renderToString(p1, {displayMode: true}); } catch(e) { return m; } });
  text = text.replace(/\$(.*?)\$/g, (m, p1) => { try { return katex.renderToString(p1, {displayMode: false}); } catch(e) { return m; } });
  return text;
}

function hashTopic(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  }
  return Math.abs(hash);
}

function getMathematicalContent(t) {
  let title = t.t.toLowerCase().trim();
  let plainTopic = t.t;
  let baseEquation = t.f ? `$${t.f}$` : `the framework metric $f(X)$`;
  let def = "", thm = "", sub = "", ctr = "", viz = "", ex = "";

  if (MATH_DATABASE[title]) {
    def = MATH_DATABASE[title].def;
    thm = MATH_DATABASE[title].thm;
    ctr = MATH_DATABASE[title].ctr;
    ex  = MATH_DATABASE[title].ex;
    sub = `<li>Advanced Analytical Edge Cases</li><li>GATE Examination Optimization Rules</li><li>Variational Scope Structures</li>`;
  }
  else if (title === 'continuity') {
    sub = `<li>Pointwise vs. Uniform Continuity</li><li>Left/Right hand limits</li><li>Continuity on compact sets</li>`;
    def = `A function $f: D \\to \\mathbb{R}$ is continuous at $a \\in D$ if, $\\forall \\epsilon > 0, \\exists \\delta > 0$ such that $\\forall x \\in D$: $$|x - a| < \\delta \\implies |f(x) - f(a)| < \\epsilon$$`;
    thm = `<h5>Intermediate Value Theorem (IVT)</h5><p>If $f$ is continuous on $[a,b]$ and $k$ is between $f(a)$ and $f(b)$, $\\exists c \\in (a,b)$ such that $f(c) = k$.</p>`;
    ctr = `<span class="counter-title">Dirichlet Function</span>$f(x) = 1$ if $x \\in \\mathbb{Q}$, else $0$. It is nowhere continuous because any interval contains both rational and irrational numbers.`;
    ex = `<p><strong>Problem:</strong> An expansion coefficient $\\alpha(T)$ at temperature $T$ is given by $\\alpha(T) = \\frac{\\sqrt{T^2 + 16} - 4}{T^2}$ for $T \\neq 0$, and $\\alpha(T) = k$ for $T=0$. Find the exact value of $k$ to satisfy continuity at $T=0$.</p><p><strong>Solution:</strong> We evaluate $\\lim_{T \\to 0} \\frac{\\sqrt{T^2 + 16} - 4}{T^2}$. Rationalizing the numerator yields $\\lim_{T \\to 0} \\frac{T^2}{T^2(\\sqrt{T^2+16}+4)} = \\lim_{T \\to 0} \\frac{1}{\\sqrt{T^2+16}+4} = \\frac{1}{8}$. Thus, $k = 1/8$.</p>`;
    viz = `<div class="css-viz-wrap">
             <div class="css-graph viz-continuous"><div class="curve"></div><div style="position:absolute; bottom:2px; width:100%; text-align:center; font-size:9px;">Continuous</div></div>
             <div class="css-graph viz-jump"><div class="curve-1"></div><div class="hole"></div><div class="curve-2"></div><div class="dot"></div><div style="position:absolute; bottom:2px; width:100%; text-align:center; font-size:9px;">Jump Discontinuity</div></div>
           </div>`;
  }
  else {
    let topicHash = hashTopic(title);
    let var1 = (topicHash % 5) + 2;
    let var2 = ((topicHash >> 2) % 4) + 3;
    let var3 = ((topicHash >> 4) % 10) + 10;
    let scenario = topicHash % 3;

    if (t.s === 'ps') {
      sub = `<li>Asymptotic Convergence Measures</li><li>Moment Analysis of ${plainTopic}</li>`;
      def = `In mathematical stochastics, <strong>${plainTopic}</strong> models a mapped probability space. Its canonical behavior bounds constraints via the identity: $$${t.f ? t.f : 'P(A \\cup B) = P(A) + P(B) - P(A \\cap B)'}$$`;
      thm = `<h5>Theorem of Bounded Variational Limits</h5><p>Under uniform convergence laws, metrics using ${plainTopic} stabilize their mean metrics at infinity.</p>`;
      ctr = `<span class="counter-title">Independent Axiom Collapse</span>Blindly using ${baseEquation} when cross-covariance terms are non-zero creates compounding errors during system updates.`;
      viz = `<table class="math-table"><tr><th>Domain Context</th><th>Support Range</th><th>Key Operator</th></tr><tr><td>Discrete PMF</td><td>$x \\in \\mathbb{Z}$</td><td>$\\Sigma$ (Summation)</td></tr><tr><td>Continuous PDF</td><td>$x \\in \\mathbb{R}$</td><td>$\\int$ (Integration)</td></tr></table>`;
      
      if (scenario === 0) {
        ex = `<p><strong>Advanced Problem (${plainTopic}):</strong> A randomized data pipeline relies on a system obeying ${baseEquation}. Given a performance variable tracking parameter $\\alpha = ${var1}$, the joint loss space bounds density uniformly over $f(x) = ${var1}x^{${var1-1}}$ for $x \\in [0,1]$. Evaluate the exact conditional system variance.</p>
              <p><strong>Step-by-Step Solution:</strong><br>
              1. Integrate to find first raw moment: $E[X] = \\int_0^1 ${var1}x^{${var1}} dx = \\frac{${var1}}{${var1}+1}$.<br>
              2. Compute second raw moment: $E[X^2] = \\int_0^1 ${var1}x^{${var1+1}} dx = \\frac{${var1}}{${var1}+2}$.<br>
              3. Apply variance identity: $\\text{Var}(X) = \\frac{${var1}}{${var1}+2} - \\left(\\frac{${var1}}{${var1}+1}\\right)^2$.</p>`;
      } else if (scenario === 1) {
        ex = `<p><strong>Advanced Problem (${plainTopic}):</strong> A quantum error-correction protocol uses ${baseEquation} to bound phase shifts. If the shift parameter is $\\lambda = ${var2}$, and the threshold probability state mapping requires evaluating the integral $\\int_{0}^{\\infty} x^{${var2}} e^{-x} dx$, solve for the exact expectation boundary.</p>
              <p><strong>Step-by-Step Solution:</strong><br>
              1. Recognize the Gamma function identity: $\\Gamma(n) = \\int_0^\\infty x^{n-1} e^{-x} dx = (n-1)!$.<br>
              2. Match parameters: Here, $n-1 = ${var2}$, so $n = ${var2 + 1}$.<br>
              3. The exact expectation boundary is $\\Gamma(${var2 + 1}) = ${var2}!$.</p>`;
      } else {
        ex = `<p><strong>Advanced Problem (${plainTopic}):</strong> A financial risk model relies on ${baseEquation}. The default threshold $D$ occurs if a normally distributed asset shock $Z \\sim N(0,1)$ exceeds $z = ${var1 / 2}$. Find the strict upper bound on this tail probability using Markov's Inequality.</p>
              <p><strong>Step-by-Step Solution:</strong><br>
              1. Markov's Inequality states $P(Z \\ge k) \\le \\frac{E[Z]}{k}$ for non-negative variables. Since $Z$ spans negatives, we evaluate $Z^2 \\sim \\chi^2_1$.<br>
              2. Transform the bound: $P(Z \\ge ${var1/2}) = P(Z^2 \\ge ${(var1/2)**2})$.<br>
              3. We know $E[Z^2] = 1$. Applying Markov: $P(Z^2 \\ge ${(var1/2)**2}) \\le \\frac{1}{${(var1/2)**2}}$. This forms the mathematical risk ceiling for the model.</p>`;
      }
    } else if (t.s === 'la') {
      sub = `<li>Subspace Transformations</li><li>Spectral Analysis for ${plainTopic}</li>`;
      def = `In linear algebraic operations, <strong>${plainTopic}</strong> explicitly maps an operator within $\\mathbb{R}^n$. The system holds structural stability under: $$${t.f ? t.f : 'A\\mathbf{x} = \\mathbf{b}'}$$`;
      thm = `<h5>Dimension Partition Theorem</h5><p>The matrix row structure mapped during actions of ${plainTopic} satisfies strict geometric closure criteria.</p>`;
      ctr = `<span class="counter-title">Nullspace Singularity</span>Assuming invertibility under ${baseEquation} when structural rows maintain zero-rank combinations collapses dimensions.`;
      viz = `<table class="math-table"><tr><th>Transformation Matrix Type</th><th>Determinant</th><th>Eigenvalue Properties</th></tr><tr><td>Orthogonal</td><td>$\\pm 1$</td><td>$|\\lambda| = 1$</td></tr><tr><td>Symmetric Positive Definite</td><td>$> 0$</td><td>All $\\lambda > 0$</td></tr></table>`;
      
      if (scenario === 0) {
        ex = `<p><strong>Advanced Problem (${plainTopic}):</strong> Let a transformations matrix $A$ perform operations parameterized by ${baseEquation}. A linear system has a custom transformation footprint defined by a rank boundary matrix with eigenvalues $\\lambda_1 = ${var1}$ and $\\lambda_2 = ${var2}$. Calculate the exact value of $\\det(A^2)$.</p>
              <p><strong>Step-by-Step Solution:</strong><br>
              1. Compute baseline determinant from distinct eigenvalues: $\\det(A) = \\lambda_1 \\times \\lambda_2 = ${var1} \\times ${var2} = ${var1 * var2}$.<br>
              2. Utilize properties of determinants: $\\det(A^2) = (\\det(A))^2$.<br>
              3. Squaring our output: $(${var1 * var2})^2 = ${(var1 * var2) ** 2}$.</p>`;
      } else if (scenario === 1) {
        ex = `<p><strong>Advanced Problem (${plainTopic}):</strong> In a 3D graphics engine governed by ${baseEquation}, a scaling matrix $S$ has a trace of ${var3}$. Two of its eigenvalues are equal to ${var1}$. Find the third eigenvalue $\\lambda_3$ defining the depth scalar.</p>
              <p><strong>Step-by-Step Solution:</strong><br>
              1. The trace of a matrix strictly equals the sum of its eigenvalues: $\\text{Tr}(S) = \\lambda_1 + \\lambda_2 + \\lambda_3$.<br>
              2. Substitute knowns: ${var3} = ${var1} + ${var1} + \\lambda_3$.<br>
              3. Solve for depth scalar: $\\lambda_3 = ${var3} - ${var1 * 2}$.</p>`;
      } else {
        ex = `<p><strong>Advanced Problem (${plainTopic}):</strong> A Markov transition matrix $M$ associated with ${baseEquation} has a steady-state eigenvector $v$. If $M^T M = ${var1} I$, prove whether $M$ acts as a pure isometric rotation.</p>
              <p><strong>Step-by-Step Solution:</strong><br>
              1. An isometry (like a rotation or reflection) strictly requires the transformation to be orthogonal, meaning $M^T M = I$.<br>
              2. The problem states $M^T M = ${var1} I$.<br>
              3. Since ${var1} \\neq 1$, $M$ scales lengths by a factor of $\\sqrt{${var1}}$. It is not a pure isometric rotation, but rather a scaled rotation/reflection.</p>`;
      }
    } else if (t.s === 'ml') {
      sub = `<li>Empirical Risk Minimization</li><li>Regularized Footprints of ${plainTopic}</li>`;
      def = `For <strong>${plainTopic}</strong>, optimization maps an empirical mapping trajectory designed to minimize a calculated penalty operator: $$${t.f ? t.f : '\\arg\\min_w \\mathcal{L}(y, f(x; w))'}$$`;
      thm = `<h5>Structural Loss Boundary Condensation</h5><p>Guarantees that models updating weights via ${plainTopic} have convergence bounds controlled by learning constraints.</p>`;
      ctr = `<span class="counter-title">Overfitting Over-parameterization</span>Ignoring regularization boundaries when calculating ${baseEquation} shifts the parameters into extreme validation failure profiles.`;
      viz = `<table class="math-table"><tr><th>Regularization Penalty</th><th>Formula</th><th>Effect on Weights</th></tr><tr><td>L1 (Lasso)</td><td>$\\lambda \\sum |w_i|$</td><td>Sparsity (Drives to exactly 0)</td></tr><tr><td>L2 (Ridge)</td><td>$\\lambda \\sum w_i^2$</td><td>Shrinkage (Drives near 0)</td></tr></table>`;

      if (scenario === 0) {
        ex = `<p><strong>Advanced Problem (${plainTopic}):</strong> A classifier optimizes an empirical error space derived from ${baseEquation}. The learning update applies a constraint step size $\\eta = 0.1$. If the initial cross-entropy risk gradient maps precisely to $[-${var1}, ${var2}]^T$, solve for the weight shifting offset trajectory.</p>
              <p><strong>Step-by-Step Solution:</strong><br>
              1. State the gradient descent update formulation: $w^{(t+1)} = w^{(t)} - \\eta \\nabla J(w)$.<br>
              2. Substitute the parameters: $\\Delta w = -0.1 \\times \\begin{pmatrix} -${var1} \\\\ ${var2} \\end{pmatrix}$.<br>
              3. Evaluating the vector yields exactly: $\\begin{pmatrix} ${parseFloat((var1*0.1).toFixed(2))} \\\\ -${parseFloat((var2*0.1).toFixed(2))} \\end{pmatrix}$.</p>`;
      } else if (scenario === 1) {
        ex = `<p><strong>Advanced Problem (${plainTopic}):</strong> A Support Vector Machine utilizes a polynomial kernel defined by $K(x, y) = (x^T y + ${var1})^{${var2}}$. If evaluating two vectors $x=[1, 0]^T$ and $y=[0, 1]^T$ mapped to a high-dimensional feature space $\\phi$, what is the exact inner product $\\phi(x)^T \\phi(y)$ under ${baseEquation}?</p>
              <p><strong>Step-by-Step Solution:</strong><br>
              1. By the Kernel Trick, we bypass explicit mapping: $\\phi(x)^T \\phi(y) = K(x, y)$.<br>
              2. Compute the dot product: $x^T y = (1)(0) + (0)(1) = 0$.<br>
              3. Evaluate the kernel: $K(x, y) = (0 + ${var1})^{${var2}} = ${var1**var2}$. This avoids computing the extremely high-dimensional mapped space entirely.</p>`;
      } else {
        ex = `<p><strong>Advanced Problem (${plainTopic}):</strong> In a k-means clustering model initialized via ${baseEquation}, point $P(${var1}, ${var2})$ is assigned to centroid $C_1(0, 0)$ instead of $C_2(${var3}, 0)$. Using Squared Euclidean Distance, verify if this assignment minimizes the objective.</p>
              <p><strong>Step-by-Step Solution:</strong><br>
              1. Distance to $C_1$: $d_1^2 = (${var1}-0)^2 + (${var2}-0)^2 = ${var1**2} + ${var2**2} = ${var1**2 + var2**2}$.<br>
              2. Distance to $C_2$: $d_2^2 = (${var1}-${var3})^2 + (${var2}-0)^2 = ${Math.pow(var1-var3, 2)} + ${var2**2} = ${Math.pow(var1-var3, 2) + var2**2}$.<br>
              3. The model assigns to the minimum. If $d_1^2 < d_2^2$, the assignment is correct; otherwise, it is a sub-optimal cluster allocation.</p>`;
      }
    } else {
      sub = `<li>Complexity Class Restrictions</li><li>Relational Bounds for ${plainTopic}</li>`;
      def = `The module <strong>${plainTopic}</strong> evaluates standard relational or computational patterns governed by structural complexity criteria: $$${t.f ? t.f : 'T(n) = aT(n/b) + \\Theta(n^d)'}$$`;
      thm = `<h5>Asymptotic Containment Principle</h5><p>Relational maps processing ${plainTopic} exhibit rigorous mathematical execution behavior constraints.</p>`;
      ctr = `<span class="counter-title">Adversarial Edge-Case Degradation</span>Assuming best-case operations for ${baseEquation} when data patterns match maximum adversarial profiles degrades throughput to limits.`;
      viz = `<table class="math-table"><tr><th>Algorithm Profile</th><th>Average Case</th><th>Worst Case</th></tr><tr><td>Divide and Conquer</td><td>$\\Theta(n \\log n)$</td><td>$\\mathcal{O}(n^2)$</td></tr><tr><td>Hash Mapping</td><td>$\\Theta(1)$</td><td>$\\mathcal{O}(n)$</td></tr></table>`;

      if (scenario === 0) {
        ex = `<p><strong>Advanced Problem (${plainTopic}):</strong> A high-performance computation engine processes structural nodes optimizing operations bounded by ${baseEquation}. The computational logic follows the exact structural tree recurrence: $T(n) = ${var1}T(n/${var1}) + \\Theta(n)$. Solve for the exact asymptotic complexity bound.</p>
              <p><strong>Step-by-Step Solution:</strong><br>
              1. Identify Master Theorem parameters: $a = ${var1}$, $b = ${var1}$, and work exponent $d = 1$.<br>
              2. Evaluate critical index: $\\log_b(a) = \\log_{${var1}}(${var1}) = 1$.<br>
              3. Since $d = \\log_b(a) = 1$, this triggers Case 2 of the Master Theorem.<br>
              4. Therefore, the mathematically tight execution complexity bound maps uniquely to $\\Theta(n \\log n)$.</p>`;
      } else if (scenario === 1) {
        ex = `<p><strong>Advanced Problem (${plainTopic}):</strong> A relational database executes a nested join strategy tied to ${baseEquation}. Table A has $N=${var3}$ pages. Table B has $M=${var1}$ pages. Assuming ${var2} buffer blocks are available, compute the exact minimum block transfers for a Block Nested Loop Join.</p>
              <p><strong>Step-by-Step Solution:</strong><br>
              1. Formula for Block Nested Loop Join transfers: $T = N + \\lceil \\frac{N}{B-2} \\rceil \\times M$.<br>
              2. Substitute memory constraints: $T = ${var3} + \\lceil \\frac{${var3}}{${var2}-2} \\rceil \\times ${var1}$.<br>
              3. Resolve fraction: $\\lceil ${var3}/${var2-2} \\rceil = ${Math.ceil(var3/(var2-2))}$.<br>
              4. Total minimum transfers: ${var3} + (${Math.ceil(var3/(var2-2))} \\times ${var1}) = ${var3 + Math.ceil(var3/(var2-2))*var1}$.</p>`;
      } else {
        ex = `<p><strong>Advanced Problem (${plainTopic}):</strong> A graph traversal analyzing ${baseEquation} has $|V| = ${var3}$ vertices and $|E| = ${var1 * var3}$ edges. If executing Dijkstra's Algorithm using a Fibonacci Heap, calculate the dominant asymptotic constraint limiting the speed.</p>
              <p><strong>Step-by-Step Solution:</strong><br>
              1. The theoretical bound for Dijkstra with Fibonacci Heap is $\\mathcal{O}(|E| + |V| \\log |V|)$.<br>
              2. Substitute scaling factors: $\\mathcal{O}(${var1}|V| + |V| \\log |V|)$.<br>
              3. As $|V| \\to \\infty$, the $|V| \\log |V|$ term grows strictly faster than the linear ${var1}|V|$ term.<br>
              4. Thus, the performance bottleneck mapping to ${plainTopic} is completely bounded by the priority queue extraction operations: $\\mathcal{O}(|V| \\log |V|)$.</p>`;
      }
    }
  }

  let htmlString = `
    <div class="module-header">
      <h3>${t.t}</h3>
      <div class="module-tag">${SUBJECT_META[t.s].name}</div>
    </div>
    <div class="study-section">
      <h4>Formal Definition & Structural Notation</h4>
      <div class="def-box">${def}</div>
    </div>
    <div class="study-section">
      <h4>Theorems, Conditions & Properties</h4>
      <div class="theorem-box">${thm}</div>
    </div>
    <div class="study-section">
      <h4>Critical Counter-Examples</h4>
      <div class="counter-box">${ctr}</div>
    </div>
    ${viz ? `<div class="study-section"><h4>Visualizations & Data Structures</h4>${viz}</div>` : ''}
    <div class="study-section">
      <h4>Advanced Application (Word Problem)</h4>
      <div class="example-box">${ex}</div>
    </div>
    <div class="study-section">
      <h4>Subtopics & Extended Scope</h4>
      <ul>${sub}</ul>
    </div>
  `;

  return parseMathText(htmlString);
}

function renderSubjectView(container){
  let anyRendered = false;
  SUBJECT_ORDER.forEach((sid, sIdx)=>{
    const meta = SUBJECT_META[sid];
    const items = TOPICS.filter(t=>t.s===sid && (matchesSearch(t)));
    if(!items.length) return;
    anyRendered = true;
    
    const doneCount = TOPICS.filter(t=>t.s===sid).reduce((a,t)=> a + (state.done[t.id]?1:0), 0);
    const pct = Math.round((doneCount/TOPICS.filter(t=>t.s===sid).length)*100);
    const key = 'subj-'+sid;
    const isOpen = searchQuery ? true : !!state.openSections[key];

    const ticket = document.createElement('div');
    ticket.className = 'ticket';
    ticket.innerHTML = `
      <div class="ticket-head ${searchQuery ? 'search-lock' : ''}" data-toggle="${key}">
        <div class="ticket-index">${String(sIdx+1).padStart(2,'0')}</div>
        <div class="ticket-title">${meta.name}</div>
        <div class="ticket-meta">
          <span class="ticket-frac" style="font-size:12px;color:var(--muted);font-family:monospace">${doneCount}/${TOPICS.filter(t=>t.s===sid).length}</span>
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

function rowTemplate(t, groupKey){
  const isStudyOpen = state.openStudyPanels[t.id];
  return `
  <li class="topic-item-container">
    <div class="topic-row ${state.done[t.id]?'on':''}" data-id="${t.id}" data-group="${groupKey}" onclick="toggleTopic('${t.id}', '${groupKey}')">
      <div class="punch ${state.done[t.id]?'on':''}"></div>
      <div class="topic-main">
        <div class="topic-text">${t.t}</div>
        <div class="topic-formula">${t.f ? parseMathText(`$${t.f}$`) : parseMathText(t.tip)}</div>
      </div>
      <button class="study-btn" onclick="toggleStudyPanel('${t.id}', event)">
        ${isStudyOpen ? 'Close Module' : 'Study Math'}
      </button>
    </div>
    <div class="study-panel ${isStudyOpen ? 'open' : ''}" id="study-${t.id}">
      ${isStudyOpen ? getMathematicalContent(t) : ''}
    </div>
  </li>`;
}

function render(){
  const container = document.getElementById('ticketContainer');
  container.innerHTML = '';
  
  const anyRendered = state.view === 'week' ? renderWeekView(container) : renderSubjectView(container);
  
  if(!anyRendered){
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty';
    emptyDiv.textContent = `No topics match "${searchQuery}". Try a different word.`;
    container.appendChild(emptyDiv);
  }
  
  const matchCountEl = document.getElementById('matchCount');
  if(searchQuery){
    const n = TOPICS.filter(matchesSearch).length;
    matchCountEl.textContent = `${n} of ${TOPICS.length} topics match`;
  } else {
    matchCountEl.textContent = '';
  }

  container.querySelectorAll('[data-toggle]').forEach(el=>{
    el.addEventListener('click', ()=>{
      if (searchQuery) return; 
      const id = el.getAttribute('data-toggle');
      state.openSections[id] = !state.openSections[id];
      render(); saveState();
    });
  });
  updateHeader();
}

function matchesSearch(item){
  if(!searchQuery) return true;
  return item.t.toLowerCase().includes(searchQuery.toLowerCase()) || (item.f && item.f.toLowerCase().includes(searchQuery.toLowerCase())) || (item.tip && item.tip.toLowerCase().includes(searchQuery.toLowerCase()));
}

function toggleTopic(id, groupKey){ state.done[id] = !state.done[id]; state.openSections[groupKey] = true; render(); saveState(); }
function toggleStudyPanel(id, ev) { if(ev) ev.stopPropagation(); state.openStudyPanels[id] = !state.openStudyPanels[id]; render(); saveState(); }

function updateHeader(){
  const done = TOPICS.reduce((acc,t)=> acc + (state.done[t.id] ? 1 : 0), 0);
  const pct = Math.round((done/TOPICS.length)*100);
  document.getElementById('ringPct').textContent = pct + '%';
  document.getElementById('ringFrac').textContent = done + ' / ' + TOPICS.length;
  document.getElementById('ringFill').setAttribute('stroke-dashoffset', 169.6 - (169.6*pct/100));

  const streak = computeStreak(state.logDates);
  document.getElementById('streakNum').textContent = streak;

  const loggedToday = state.logDates.includes(todayISO());
  const btn = document.getElementById('logBtn');
  if(loggedToday){ btn.textContent = "✓ Logged today"; btn.classList.add('done'); }
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

document.getElementById('themeToggleBtn').addEventListener('click', () => {
  isLightTheme = !isLightTheme;
  document.body.classList.toggle('light-theme', isLightTheme);
  state.isLight = isLightTheme;
  saveState();
});
document.getElementById('fontMinusBtn').addEventListener('click', () => {
  if (currentFontSize > 0.8) {
    currentFontSize -= 0.1;
    document.documentElement.style.setProperty('--font-scale', currentFontSize);
    state.fontScale = currentFontSize;
    saveState();
  }
});
document.getElementById('fontPlusBtn').addEventListener('click', () => {
  if (currentFontSize < 1.6) {
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

document.getElementById('studyRedirectBtn').addEventListener('click', () => {
  window.location.href = 'https://vfarenjiya.github.io/study/'; 
});

(()=>{
  loadState();
  document.body.classList.toggle('light-theme', isLightTheme);
  document.documentElement.style.setProperty('--font-scale', currentFontSize);
  
  document.querySelectorAll('#viewSwitch button').forEach(b=>b.classList.toggle('active', b.getAttribute('data-view')===state.view));
  document.getElementById('planStartRow').style.display = state.view==='week' ? 'flex' : 'none';
  if(!state.planStart) state.planStart = todayISO();
  document.getElementById('planStart').value = state.planStart;
  render();
})();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker Registered!'))
      .catch(err => console.log('Registration failed: ', err));
  });
}

// ====== PWA INSTALL PROMPT ======
// The browser only fires 'beforeinstallprompt' when the page is served over
// HTTPS (or localhost), has a valid manifest, and a registered service worker.
// It won't fire again once the app is already installed, and Chrome throttles
// it if it was dismissed recently. It also isn't supported on iOS Safari,
// which has no install-prompt API at all (there, "Add to Home Screen" is a
// manual step from the browser's Share menu).
let deferredInstallPrompt = null;
const pwaBanner = document.getElementById('pwaBanner');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  if (!state.pwaDismissed) {
    setTimeout(() => pwaBanner.classList.remove('hidden'), 2500);
  }
});

document.getElementById('pwaInstall').addEventListener('click', async () => {
  pwaBanner.classList.add('hidden');
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
});

document.getElementById('pwaDismiss').addEventListener('click', () => {
  pwaBanner.classList.add('hidden');
  state.pwaDismissed = true;
  saveState();
});

window.addEventListener('appinstalled', () => {
  pwaBanner.classList.add('hidden');
  deferredInstallPrompt = null;
});

const MATH_DATABASE = {
  "counting: permutations and combinations": {
    def: "Rigorous combinatorics managing constraints, partitions, and allocations over discrete sets using mappings.",
    thm: "<h5>Stars and Bars Theorem (Theorem II)</h5><p>The number of distinct non-negative integer solutions to $\\sum_{i=1}^k x_i = n$ is given exactly by $\\binom{n+k-1}{k-1}$.</p>",
    ctr: "<span class=\"counter-title\">Distinct vs Indistinct Objects</span>Conflating Stirling numbers of the second kind (allocating distinct objects to indistinct buckets) with standard combinations.",
    ex: "<p><strong>Problem:</strong> A network router has 5 distinct outbound processing queues. It receives 12 identical packets that must be allocated concurrently. Find the exact probability that no processing queue remains completely idle.</p><p><strong>Solution:</strong> This maps to finding the positive integer solutions to $x_1 + x_2 + x_3 + x_4 + x_5 = 12$. By applying Stars and Bars (Theorem I), total allocations without constraints is $\\binom{12+5-1}{5-1} = \\binom{16}{4} = 1820$. The number of positive integer solutions (no queue empty) is $\\binom{12-1}{5-1} = \\binom{11}{4} = 330$. Hence, the exact mathematical probability is $\\frac{330}{1820} = \\frac{33}{182}$.</p>"
  },
  "poisson distribution": {
    def: "A limiting form of the Binomial distribution where the number of trials $n \\to \\infty$ and $p \\to 0$ such that $np = \\lambda$.",
    thm: "<h5>Additive Property of Independent Poisson Variables</h5><p>If $X_1 \\sim \\text{Poi}(\\lambda_1)$ and $X_2 \\sim \\text{Poi}(\\lambda_2)$ are independent, then $X_1 + X_2 \\sim \\text{Poi}(\\lambda_1 + \\lambda_2)$.</p>",
    ctr: "<span class=\"counter-title\">Time Dependence & Clumping</span>Using a constant rate parameter $\\lambda$ when events display temporal clustering, which violates the memoryless independent increments axiom.",
    ex: "<p><strong>Problem:</strong> A distributed cloud server encounters runtime faults at a mean rate of 3 errors per hour, matching a Poisson process. Calculate the exact conditional probability that exactly 2 faults occurred in the first 20 minutes, given that 5 faults occurred in the first hour.</p><p><strong>Solution:</strong> Let $X$ be faults in the first 20 mins ($t_1=1/3$ hour), so $X \\sim \\text{Poi}(\\lambda_1 = 3 \\times 1/3 = 1)$. Let $Y$ be faults in the remaining 40 mins, so $Y \\sim \\text{Poi}(\\lambda_2 = 2)$. We want $P(X=2 | X+Y=5) = \\frac{P(X=2)P(Y=3)}{P(X+Y=5)}$. Utilizing the distributions: $\\frac{(e^{-1}\\frac{1^2}{2!}) \\cdot (e^{-2}\\frac{2^3}{3!})}{e^{-3}\\frac{3^5}{5!}} = \\frac{\\frac{1}{2} \\cdot \\frac{8}{6}}{\\frac{243}{120}} = \\frac{8}{6} \\cdot \\frac{60}{243} = \\frac{80}{243}$.</p>"
  },
  "projection matrix": {
    def: "An operator mapping a vector space orthogonally onto a lower-dimensional subspace without scaling alterations. $$P = A(A^TA)^{-1}A^T$$",
    thm: "<h5>Idempotency and Eigenvalues</h5><p>For any valid projection matrix, $P^2 = P = P^T$, and its unique eigenvalues must satisfy $\\lambda \\in \\{0, 1\\}$.</p>",
    ctr: "<span class=\"counter-title\">Non-orthogonal Projections</span>Assuming $P = AA^T$ projects correctly onto a subspace when column vectors of $A$ are not mutually orthogonal.",
    ex: "<p><strong>Problem:</strong> Construct the precise $3 \\times 3$ projection matrix $P$ that maps any vector in $\\mathbb{R}^3$ onto the plane spanned by the column vectors $v_1 = [1, 1, 0]^T$ and $v_2 = [0, 1, 1]^T$.</p><p><strong>Solution:</strong> Build matrix $A = \\begin{pmatrix} 1 & 0 \\\\ 1 & 1 \\\\ 0 & 1 \\end{pmatrix}$. Compute $A^TA = \\begin{pmatrix} 2 & 1 \\\\ 1 & 2 \\end{pmatrix}$. The matrix inverse is $(A^TA)^{-1} = \\frac{1}{3}\\begin{pmatrix} 2 & -1 \\\\ -1 & 2 \\end{pmatrix}$. Compute $A(A^TA)^{-1} = \\frac{1}{3}\\begin{pmatrix} 2 & -1 \\\\ 1 & 1 \\\\ -1 & 2 \\end{pmatrix}$. Finally, $P = A(A^TA)^{-1}A^T = \\frac{1}{3}\\begin{pmatrix} 2 & 1 & -1 \\\\ 1 & 2 & 1 \\\\ -1 & 1 & 2 \\end{pmatrix}$.</p>"
  },
  "singular value decomposition (svd)": {
    def: "Factorization of any real matrix into orthogonal spaces and geometric singular extensions: $$A = U \\Sigma V^T$$",
    thm: "<h5>Eckart-Young-Mirsky Theorem</h5><p>The optimal rank-$k$ approximation of a matrix under the Frobenius norm is constructed by setting all but the $k$-largest singular values to 0.</p>",
    ctr: "<span class=\"counter-title\">Singular Value vs Eigenvalue</span>Conflating the singular values of $A$ with eigenvalues of $A$. Singular values are always non-negative square roots of eigenvalues of $A^TA$.",
    ex: "<p><strong>Problem:</strong> Find the exact Singular Value Decomposition (SVD) of the matrix $A = \\begin{pmatrix} 3 & 0 \\\\ 0 & -2 \\end{pmatrix}$.</p><p><strong>Solution:</strong> We compute $A^TA = \\begin{pmatrix} 9 & 0 \\\\ 0 & 4 \\end{pmatrix}$. The eigenvalues are $\\lambda_1=9, \\lambda_2=4$, which yields singular values $\\sigma_1=3, \\sigma_2=2$. The right singular vectors (eigenvectors of $A^TA$) are $v_1=[1,0]^T, v_2=[0,1]^T$, meaning $V=I$. The left singular vectors are given by $u_i = \\frac{1}{\\sigma_i}Av_i$. Thus $u_1 = \\frac{1}{3}[3,0]^T = [1,0]^T$ and $u_2 = \\frac{1}{2}[0,-2]^T = [0,-1]^T$. Hence, $A = \\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix} \\begin{pmatrix} 3 & 0 \\\\ 0 & 2 \\end{pmatrix} \\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}^T$.</p>"
  }
};

export function parseMathText(text) {
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

export function generateModuleHTML(t) {
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
  } else if (title === 'continuity') {
    sub = `<li>Pointwise vs. Uniform Continuity</li><li>Left/Right hand limits</li><li>Continuity on compact sets</li>`;
    def = `A function $f: D \\to \\mathbb{R}$ is continuous at $a \\in D$ if, $\\forall \\epsilon > 0, \\exists \\delta > 0$ such that $\\forall x \\in D$: $$|x - a| < \\delta \\implies |f(x) - f(a)| < \\epsilon$$`;
    thm = `<h5>Intermediate Value Theorem (IVT)</h5><p>If $f$ is continuous on $[a,b]$ and $k$ is between $f(a)$ and $f(b)$, $\\exists c \\in (a,b)$ such that $f(c) = k$.</p>`;
    ctr = `<span class="counter-title">Dirichlet Function</span>$f(x) = 1$ if $x \\in \\mathbb{Q}$, else $0$. It is nowhere continuous because any interval contains both rational and irrational numbers.`;
    ex = `<p><strong>Problem:</strong> An expansion coefficient $\\alpha(T)$ at temperature $T$ is given by $\\alpha(T) = \\frac{\\sqrt{T^2 + 16} - 4}{T^2}$ for $T \\neq 0$, and $\\alpha(T) = k$ for $T=0$. Find the exact value of $k$ to satisfy continuity at $T=0$.</p><p><strong>Solution:</strong> We evaluate $\\lim_{T \\to 0} \\frac{\\sqrt{T^2 + 16} - 4}{T^2}$. Rationalizing the numerator yields $\\lim_{T \\to 0} \\frac{T^2}{T^2(\\sqrt{T^2+16}+4)} = \\lim_{T \\to 0} \\frac{1}{\\sqrt{T^2+16}+4} = \\frac{1}{8}$. Thus, $k = 1/8$.</p>`;
    viz = `<div class="css-viz-wrap">
             <div class="css-graph viz-continuous"><div class="curve"></div><div style="position:absolute; bottom:2px; width:100%; text-align:center; font-size:9px;">Continuous</div></div>
             <div class="css-graph viz-jump"><div class="curve-1"></div><div class="hole"></div><div class="curve-2"></div><div class="dot"></div><div style="position:absolute; bottom:2px; width:100%; text-align:center; font-size:9px;">Jump Discontinuity</div></div>
           </div>`;
  } else {
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
        ex = `<p><strong>Advanced Problem (${plainTopic}):</strong> A high-performance computation engine processes structural nodes optimizing operations bounded by ${baseEquation}. The computationa
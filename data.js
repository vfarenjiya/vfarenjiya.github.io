const SUBJECT_META = {
  ps:   { name:'Probability & Statistics', color:'#e8a23d' },
  la:   { name:'Linear Algebra', color:'#5aa9e6' },
  co:   { name:'Calculus & Optimization', color:'#c792ea' },
  pdsa: { name:'Programming, Data Structures & Algorithms', color:'#35d07f' },
  dbms: { name:'Database Management & Warehousing', color:'#ff8a5c' },
  ml:   { name:'Machine Learning', color:'#ff6b46' },
  ai:   { name:'Artificial Intelligence', color:'#f6c445' },
  rev:  { name:'Full Revision & Mock Tests', color:'#8a8fa0' }
};
const SUBJECT_ORDER = ['ps','la','co','pdsa','dbms','ml','ai','rev'];

const TOPICS = [
/* ---------- Probability & Statistics ---------- */
{s:'ps', w:1, t:'Counting: permutations and combinations', f:'nPr = \\dfrac{n!}{(n-r)!},\\quad nCr = \\dfrac{n!}{r!(n-r)!}'},
{s:'ps', w:1, t:'Probability axioms', f:'P(\\Omega)=1,\\ P(A)\\ge 0,\\ P\\left(\\bigcup_i A_i\\right)=\\sum_i P(A_i)'},
{s:'ps', w:1, t:'Sample space', f:'P(A)=\\dfrac{n(A)}{n(\\Omega)}'},
{s:'ps', w:1, t:'Events', f:'P(A^c) = 1-P(A)'},
{s:'ps', w:1, t:'Independent events', f:'P(A\\cap B) = P(A)\\,P(B)'},
{s:'ps', w:1, t:'Mutually exclusive events', f:'P(A\\cap B)=0 \\Rightarrow P(A\\cup B)=P(A)+P(B)'},
{s:'ps', w:1, t:'Marginal probability', f:'P(A) = \\sum_j P(A \\cap B_j)'},
{s:'ps', w:1, t:'Conditional probability', f:'P(A|B) = \\dfrac{P(A\\cap B)}{P(B)}'},
{s:'ps', w:1, t:'Joint probability', f:'P(A\\cap B) = P(A|B)P(B) = P(B|A)P(A)'},
{s:'ps', w:1, t:"Bayes' theorem", f:'P(A_i|B) = \\dfrac{P(B|A_i)P(A_i)}{\\sum_j P(B|A_j)P(A_j)}'},
{s:'ps', w:1, t:'Conditional expectation', f:'E[X|Y{=}y] = \\sum_x x\\,P(X{=}x|Y{=}y)'},
{s:'ps', w:1, t:'Conditional variance', f:'Var(X) = E[Var(X|Y)] + Var(E[X|Y])'},
{s:'ps', w:1, t:'Mean', f:'E[X] = \\sum_x x\\,p(x)\\quad \\text{or}\\quad \\int x f(x)\\,dx'},
{s:'ps', w:2, t:'Median', f:'\\text{value } m:\\ P(X\\le m)\\ge \\tfrac12,\\ P(X\\ge m)\\ge \\tfrac12'},
{s:'ps', w:2, t:'Mode', f:'\\text{value with max } p(x) \\text{ or } f(x)'},
{s:'ps', w:2, t:'Standard deviation', f:'\\sigma = \\sqrt{Var(X)},\\quad Var(X)=E[X^2]-(E[X])^2'},
{s:'ps', w:2, t:'Correlation', f:'\\rho_{XY} = \\dfrac{Cov(X,Y)}{\\sigma_X \\sigma_Y},\\ -1\\le \\rho \\le 1'},
{s:'ps', w:2, t:'Covariance', f:'Cov(X,Y) = E[XY]-E[X]E[Y]'},
{s:'ps', w:2, t:'Random variables', f:'X:\\Omega \\to \\mathbb{R}'},
{s:'ps', w:2, t:'Discrete random variables & probability mass functions', f:'p(x)=P(X{=}x),\\quad \\sum_x p(x)=1'},
{s:'ps', w:2, t:'Uniform distribution (discrete)', f:'p(x)=\\dfrac1n,\\ E[X]=\\dfrac{n+1}{2}'},
{s:'ps', w:2, t:'Bernoulli distribution', f:'P(X{=}1)=p,\\ E[X]=p,\\ Var(X)=p(1-p)'},
{s:'ps', w:2, t:'Binomial distribution', f:'P(X{=}k)=\\binom{n}{k}p^k(1-p)^{n-k},\\ E[X]=np'},
{s:'ps', w:2, t:'Continuous random variables & probability distribution function', f:'P(a\\le X\\le b)=\\int_a^b f(x)\\,dx,\\ \\int f(x)\\,dx=1'},
{s:'ps', w:2, t:'Uniform distribution (continuous)', f:'f(x)=\\dfrac{1}{b-a},\\ E[X]=\\dfrac{a+b}{2}'},
{s:'ps', w:3, t:'Exponential distribution', f:'f(x)=\\lambda e^{-\\lambda x},\\ E[X]=\\dfrac1\\lambda'},
{s:'ps', w:3, t:'Poisson distribution', f:'P(X{=}k)=\\dfrac{e^{-\\lambda}\\lambda^k}{k!},\\ E[X]=Var(X)=\\lambda'},
{s:'ps', w:3, t:'Normal distribution', f:'f(x)=\\dfrac{1}{\\sigma\\sqrt{2\\pi}}e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}'},
{s:'ps', w:3, t:'Standard normal distribution', f:'Z=\\dfrac{X-\\mu}{\\sigma}\\sim N(0,1)'},
{s:'ps', w:3, t:'t-distribution', f:'T=\\dfrac{Z}{\\sqrt{\\chi^2_\\nu/\\nu}}'},
{s:'ps', w:3, t:'Chi-squared distribution', f:'\\chi^2=\\sum_{i=1}^{\\nu} Z_i^2'},
{s:'ps', w:3, t:'Cumulative distribution function (CDF)', f:'F(x)=P(X\\le x)=\\int_{-\\infty}^{x} f(t)\\,dt'},
{s:'ps', w:3, t:'Conditional PDF', f:'f(x|y)=\\dfrac{f(x,y)}{f_Y(y)}'},
{s:'ps', w:3, t:'Central limit theorem', f:'\\dfrac{\\bar X-\\mu}{\\sigma/\\sqrt n}\\ \\xrightarrow{d}\\ N(0,1)'},
{s:'ps', w:3, t:'Confidence interval', f:'\\bar X \\pm z_{\\alpha/2}\\dfrac{\\sigma}{\\sqrt n}'},
{s:'ps', w:3, t:'z-test', f:'z=\\dfrac{\\bar X-\\mu_0}{\\sigma/\\sqrt n}'},
{s:'ps', w:3, t:'t-test', f:'t=\\dfrac{\\bar X-\\mu_0}{s/\\sqrt n},\\ df=n-1'},
{s:'ps', w:3, t:'Chi-squared test', f:'\\chi^2=\\sum \\dfrac{(O_i-E_i)^2}{E_i}'},
/* ---------- Linear Algebra ---------- */
{s:'la', w:4, t:'Vector space', tip:'A set closed under vector addition and scalar multiplication'},
{s:'la', w:4, t:'Subspaces', f:'W\\subseteq V:\\ 0\\in W,\\ \\text{closed under }+,\\cdot'},
{s:'la', w:4, t:'Linear dependence and independence of vectors', f:'c_1v_1+\\dots+c_nv_n=0 \\Rightarrow \\text{all }c_i=0'},
{s:'la', w:4, t:'Matrices: fundamentals', f:'(AB)^T=B^TA^T,\\quad (AB)^{-1}=B^{-1}A^{-1}'},
{s:'la', w:4, t:'Projection matrix', f:'P=A(A^TA)^{-1}A^T,\\quad P^2=P=P^T'},
{s:'la', w:4, t:'Orthogonal matrix', f:'Q^TQ=I,\\quad Q^{-1}=Q^T,\\quad \\det(Q)=\\pm1'},
{s:'la', w:4, t:'Idempotent matrix', f:'A^2=A'},
{s:'la', w:4, t:'Partition matrix and its properties', tip:'Block matrices multiply block-by-block'},
{s:'la', w:4, t:'Quadratic forms', f:'Q(x)=x^TAx;\\ \\text{PD if } x^TAx>0'},
{s:'la', w:5, t:'Systems of linear equations and their solutions', f:'Ax=b \\text{ consistent} \\iff rank(A)=rank([A|b])'},
{s:'la', w:5, t:'Gaussian elimination', tip:'Row-reduce [A|b] to echelon form'},
{s:'la', w:5, t:'Eigenvalues and eigenvectors', f:'Av=\\lambda v \\iff \\det(A-\\lambda I)=0'},
{s:'la', w:5, t:'Determinant', f:'\\det(AB)=\\det(A)\\det(B)'},
{s:'la', w:5, t:'Rank', f:'rank(A)=\\dim(\\text{column space of }A)'},
{s:'la', w:5, t:'Nullity', f:'rank(A)+nullity(A)=n'},
{s:'la', w:5, t:'Projections', f:'\\text{proj}_u(v)=\\dfrac{u\\cdot v}{u\\cdot u}\\,u'},
{s:'la', w:5, t:'LU decomposition', f:'A=LU\\ \\text{(}L\\text{ lower, }U\\text{ upper)}'},
{s:'la', w:5, t:'Singular value decomposition (SVD)', f:'A=U\\Sigma V^T'},
/* ---------- Calculus & Optimization ---------- */
{s:'co', w:6, t:'Functions of a single variable', f:'f:\\mathbb R \\to \\mathbb R'},
{s:'co', w:6, t:'Limits', f:'\\lim_{x \\to a} f(x) = L \\iff \\forall \\epsilon >0, \\exists \\delta >0: |x-a| <\\delta \\Rightarrow |f(x)-L| <\\epsilon'},
{s:'co', w:6, t:'Continuity', f:'f \\text{ continuous at } a \\iff \\lim_{x\\to a} f(x)=f(a)'},
{s:'co', w:6, t:'Differentiability', f:"f'(a)=\\lim_{h\\to 0}\\dfrac{f(a+h)-f(a)}{h}"},
{s:'co', w:6, t:'Chain rule', f:"(f \\circ g)'(x) = f'(g(x))\\cdot g'(x)"},
{s:'co', w:6, t:'Product rule', f:"(fg)'(x)=f'(x)g(x)+f(x)g'(x)"},
{s:'co', w:6, t:'Quotient rule', f:"\\left(\\dfrac{f}{g}\\right)'(x)=\\dfrac{f'(x)g(x)-f(x)g'(x)}{(g(x))^2}"},
{s:'co', w:6, t:'Critical points and extrema', f:"f'(a)=0 \\text{ or undefined}"},
{s:'co', w:7, t:'Concavity and inflection points', f:'f\'\'(x) >0 \\text{ (convex)}, \\quad f\'\'(x) <0 \\text{ (concave)}'},
{s:'co', w:7, t:'Integration (Riemann)', f:'\\int_a^b f(x)\\,dx = \\lim_{n\\to\\infty}\\sum_{i=1}^{n} f(x_i^*)\\Delta x'},
{s:'co', w:7, t:'Fundamental theorem of calculus', f:'\\dfrac{d}{dx}\\int_a^x f(t)\\,dt = f(x)'},
{s:'co', w:7, t:'Integration by parts', f:'\\int u\\,dv = uv - \\int v\\,du'},
{s:'co', w:7, t:'Substitution rule', f:"\\int f(g(x))g'(x)\\,dx = \\int f(u)\\,du"},
{s:'co', w:7, t:'Partial derivatives', f:'\\dfrac{\\partial f}{\\partial x_i} = \\lim_{h\\to 0} \\dfrac{f(x_1,\\dots,x_i+h,\\dots,x_n)-f(x)}{h}'},
{s:'co', w:7, t:'Gradient', f:'\\nabla f = \\left(\\dfrac{\\partial f}{\\partial x_1}, \\ldots, \\dfrac{\\partial f}{\\partial x_n}\\right)'},
{s:'co', w:7, t:'Hessian matrix', f:'H = \\begin{pmatrix} \\frac{\\partial^2 f}{\\partial x_1^2} & \\cdots & \\frac{\\partial^2 f}{\\partial x_1 \\partial x_n} \\\\ \\vdots & \\ddots & \\vdots \\\\ \\frac{\\partial^2 f}{\\partial x_n \\partial x_1} & \\cdots & \\frac{\\partial^2 f}{\\partial x_n^2} \\end{pmatrix}'},
{s:'co', w:8, t:'Convexity and convex functions', f:'f(\\lambda x + (1-\\lambda)y) \\le \\lambda f(x) + (1-\\lambda)f(y)'},
{s:'co', w:8, t:'Lagrange multipliers', f:'\\nabla f = \\lambda \\nabla g \\text{ at constrained optimum}'},
{s:'co', w:8, t:'KKT conditions', f:'\\nabla f(x^*) + \\sum_i \\lambda_i \\nabla g_i(x^*) + \\sum_j \\mu_j \\nabla h_j(x^*) = 0'},
{s:'co', w:8, t:'Gradient descent', f:'x_{t+1} = x_t - \\alpha \\nabla f(x_t)'},
{s:'co', w:8, t:"Newton's method", f:'x_{t+1} = x_t - [H(x_t)]^{-1}\\nabla f(x_t)'},
/* ---------- PDSA ---------- */
{s:'pdsa', w:9, t:'Arrays and linked lists', tip:'Basic sequential data structures'},
{s:'pdsa', w:9, t:'Stacks and queues', tip:'LIFO and FIFO data structures'},
{s:'pdsa', w:9, t:'Trees and binary trees', tip:'Hierarchical data structures'},
{s:'pdsa', w:9, t:'Graphs and graph traversal', tip:'BFS, DFS, topological sort'},
{s:'pdsa', w:9, t:'Sorting algorithms', f:'\\text{Quicksort, Mergesort, Heapsort } O(n \\log n)'},
{s:'pdsa', w:9, t:'Binary search', f:'\\log_2 n \\text{ time complexity on sorted arrays}'},
{s:'pdsa', w:10, t:'Hash tables', tip:'Average O(1) insertion, deletion, search'},
{s:'pdsa', w:10, t:'Asymptotic analysis: Big O, Theta, Omega', f:'O(f(n)), \\Theta(f(n)), \\Omega(f(n))'},
{s:'pdsa', w:10, t:'Dynamic programming', tip:'Optimal substructure and overlapping subproblems'},
{s:'pdsa', w:10, t:'Greedy algorithms', tip:'Make locally optimal choices'},
/* ---------- DBMS ---------- */
{s:'dbms', w:11, t:'Relational data model', tip:'Tables, rows, columns, keys'},
{s:'dbms', w:11, t:'SQL: SELECT, WHERE, JOIN', tip:'Fundamental query operations'},
{s:'dbms', w:11, t:'Normalization: 1NF, 2NF, 3NF', tip:'Eliminating redundancy'},
{s:'dbms', w:11, t:'Transactions and ACID properties', f:'\\text{Atomicity, Consistency, Isolation, Durability}'},
{s:'dbms', w:11, t:'Indexing', tip:'B-tree and hash indices'},
{s:'dbms', w:11, t:'Query optimization', tip:'Cost models and execution plans'},
{s:'dbms', w:12, t:'Measures: computations', tip:'Aggregate functions: SUM, COUNT, AVG, MIN, MAX'},
/* ---------- Machine Learning ---------- */
{s:'ml', w:9, t:'Regression and classification problems', f:'y=f(x)+\\epsilon\\ \\text{(regression)};\\quad y\\in\\{1,\\dots,K\\}\\ \\text{(classification)}'},
{s:'ml', w:9, t:'Simple linear regression', f:'\\hat\\beta_1=\\dfrac{Cov(X,Y)}{Var(X)},\\quad \\hat\\beta_0=\\bar y-\\hat\\beta_1\\bar x'},
{s:'ml', w:9, t:'Multiple linear regression', f:'\\hat\\beta=(X^TX)^{-1}X^Ty'},
{s:'ml', w:9, t:'Ridge regression', f:'\\hat\\beta=(X^TX+\\lambda I)^{-1}X^Ty'},
{s:'ml', w:9, t:'Logistic regression', f:'p=\\dfrac{1}{1+e^{-(\\beta_0+\\beta_1 x)}}'},
{s:'ml', w:9, t:'k-nearest neighbour', tip:'Classify by majority vote among the k nearest points'},
{s:'ml', w:9, t:'Naive Bayes classifier', f:'P(y|x)\\propto P(y)\\prod_i P(x_i|y)'},
{s:'ml', w:9, t:'Linear discriminant analysis', f:'\\max \\dfrac{(\\mu_1-\\mu_2)^2}{\\sigma_1^2+\\sigma_2^2}'},
{s:'ml', w:9, t:'Support vector machine', f:'\\max \\dfrac{2}{\\|w\\|}\\quad \\text{s.t. } y_i(w\\cdot x_i+b)\\ge1'},
{s:'ml', w:9, t:'Decision trees', tip:'Split on the feature giving maximum information gain'},
{s:'ml', w:9, t:'Bias-variance trade-off', f:'E[(y-\\hat y)^2] = Bias^2+Variance+\\sigma^2'},
{s:'ml', w:10, t:'Leave-one-out (LOO) cross-validation', f:'n \\text{ folds — train on } n{-}1,\\ \\text{test on the } 1'},
{s:'ml', w:10, t:'k-fold cross-validation', f:'k \\text{ folds — train on } k{-}1,\\ \\text{test on the remaining fold}'},
{s:'ml', w:10, t:'Multi-layer perceptron', f:'a^{(l)}=\\sigma\\!\\left(W^{(l)}a^{(l-1)}+b^{(l)}\\right)'},
{s:'ml', w:10, t:'Feed-forward neural network', f:'\\hat y = \\sigma(W_2\\,\\sigma(W_1x+b_1)+b_2)'},
{s:'ml', w:10, t:'Clustering algorithms (overview)', tip:'Group unlabelled data by similarity'},
{s:'ml', w:10, t:'k-means clustering', f:'\\min \\sum_k\\sum_{x\\in C_k}\\|x-\\mu_k\\|^2'},
{s:'ml', w:10, t:'k-medoid clustering', tip:'Like k-means, but each cluster centre is an actual data point'},
{s:'ml', w:10, t:'Hierarchical clustering: divisive (top-down)', tip:'Start with one cluster and recursively split it'},
{s:'ml', w:10, t:'Hierarchical clustering: agglomerative, single-linkage', f:'d(A,B)=\\min_{a\\in A,\\,b\\in B}\\|a-b\\|'},
{s:'ml', w:10, t:'Hierarchical clustering: complete/multiple-linkage', f:'d(A,B)=\\max_{a\\in A,\\,b\\in B}\\|a-b\\|'},
{s:'ml', w:10, t:'Dimensionality reduction', tip:'Reduce feature count while preserving information'},
{s:'ml', w:10, t:'Principal component analysis (PCA)', tip:'Eigenvectors of the covariance matrix, sorted by eigenvalue'},
/* ---------- AI ---------- */
{s:'ai', w:11, t:'Search: uninformed', tip:'BFS, DFS, uniform-cost search — no heuristic used'},
{s:'ai', w:11, t:'Search: informed', f:'f(n)=g(n)+h(n)\\ \\text{(A* search)}'},
{s:'ai', w:11, t:'Search: adversarial', tip:'Minimax search, with alpha-beta pruning'},
{s:'ai', w:11, t:'Logic: propositional', f:'\\wedge,\\ \\vee,\\ \\neg,\\ \\rightarrow,\\ \\leftrightarrow'},
{s:'ai', w:11, t:'Logic: predicate', f:'\\forall x\\,P(x),\\quad \\exists x\\,P(x)'},
{s:'ai', w:11, t:'Reasoning under uncertainty: conditional independence', f:'P(X,Y|Z)=P(X|Z)\\,P(Y|Z)'},
{s:'ai', w:11, t:'Exact inference: variable elimination', tip:'Sum out variables one at a time via factor marginalization'},
{s:'ai', w:11, t:'Approximate inference: sampling', tip:'Monte Carlo methods — likelihood weighting, Gibbs sampling'},
/* ---------- Revision ---------- */
{s:'rev', w:12, t:'Full revision — Probability, Linear Algebra, Calculus', tip:'Redo your formula sheet; work 10 mixed problems per topic'},
{s:'rev', w:12, t:'Full revision — PDSA, DBMS, ML, AI', tip:'Redo your formula sheet; work 10 mixed problems per topic'},
{s:'rev', w:12, t:'Previous year GATE DA paper — attempt 1', tip:'Simulate full 3-hour test conditions, no notes'},
{s:'rev', w:12, t:'Previous year GATE DA paper — attempt 2', tip:'Simulate full 3-hour test conditions, no notes'},
{s:'rev', w:12, t:'Full-length mock test 1', tip:'Analyze section-wise accuracy and timing right after'},
{s:'rev', w:12, t:'Full-length mock test 2', tip:'Analyze section-wise accuracy and timing right after'},
{s:'rev', w:12, t:'Rework mistakes from mocks & weak topics', tip:'Keep a running error log — revisit it the night before the exam'},
{s:'rev', w:12, t:'Final formula & concept sheet pass', tip:'One page per subject — glance through on exam morning only'}
];

// IDs derived from subject+title so reordering doesn't reassign saved progress
function _stableTopicId(subject, title) {
  const str = subject + '|' + title;
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  return 't' + Math.abs(hash).toString(36);
}
TOPICS.forEach(topic => topic.id = _stableTopicId(topic.s, topic.t));

const MATH_DATABASE = {
"counting: permutations and combinations": {
  def: "Rigorous combinatorics managing constraints, partitions, and allocations over discrete sets using mappings.",
  thm: "<h5>Stars and Bars Theorem</h5><p>The number of distinct non-negative integer solutions to $\\sum_{i=1}^k x_i = n$ is given exactly by $\\binom{n+k-1}{k-1}$. For positive integer solutions: $\\binom{n-1}{k-1}$.</p>",
  ctr: "<span class=\"counter-title\">Distinct vs Indistinct Objects</span>Conflating Stirling numbers of the second kind (allocating distinct objects to indistinct buckets) with standard combinations.",
  ex: "<p><strong>Problem:</strong> A network router has 5 distinct outbound processing queues. It receives 12 identical packets that must be allocated concurrently. Find the exact probability that no processing queue remains completely idle.</p><p><strong>Solution:</strong> This maps to finding the positive integer solutions to $x_1 + x_2 + x_3 + x_4 + x_5 = 12$. By Stars and Bars, total allocations without constraints is $\\binom{12+5-1}{5-1} = \\binom{16}{4} = 1820$. The number of positive integer solutions (no queue empty) is $\\binom{12-1}{5-1} = \\binom{11}{4} = 330$. Hence the exact probability is $\\frac{330}{1820} = \\frac{33}{182}$.</p>"
},
"probability axioms": {
  def: "A formal framework satisfying three fundamental postulates: non-negativity, normalisation, and countable additivity for disjoint events.",
  thm: "<h5>Boole's Inequality (Union Bound)</h5><p>For any countable collection of events $\\{A_i\\}$: $$P\\left(\\bigcup_i A_i\\right) \\le \\sum_i P(A_i)$$ Equality holds if and only if the events are mutually disjoint.</p>",
  ctr: "<span class=\"counter-title\">Negating Axiom Assumptions</span>Treating probability as additive when events overlap: $P(A \\cup B) \\ne P(A) + P(B)$ unless $A \\cap B = \\emptyset$.",
  ex: "<p><strong>Problem:</strong> The probability that a chip passes test A is 0.95, and test B is 0.92. The probability of passing both is 0.88. What is the probability that the chip fails at least one test?</p><p><strong>Solution:</strong> We want $P(A^c \\cup B^c) = P((A \\cap B)^c) = 1 - P(A \\cap B) = 1 - 0.88 = 0.12$.</p>"
},
"conditional probability": {
  def: "The probability of event $A$ given that $B$ has occurred, denoted $P(A|B)$ — a restricted sample space.",
  thm: "<h5>Chain Rule</h5><p>$P(A_1 \\cap \\cdots \\cap A_n) = P(A_1)P(A_2|A_1)\\cdots P(A_n|A_1 \\cap \\cdots \\cap A_{n-1})$</p>",
  ctr: "<span class=\"counter-title\">Reversing Conditioning Direction</span>Assuming $P(A|B) = P(B|A)$ without Bayes' theorem leads to systematic bias in diagnostic problems.",
  ex: "<p><strong>Problem:</strong> A test has 99% sensitivity and 98% specificity; disease prevalence is 0.1%. If a person tests positive, what is the probability they have the disease?</p><p><strong>Solution:</strong> $P(T) = 0.99 \\cdot 0.001 + 0.02 \\cdot 0.999 = 0.02097$. Thus $P(D|T) = \\frac{0.00099}{0.02097} \\approx 0.0472$ — about 4.72%.</p>"
},
"bayes' theorem": {
  def: "A rule for updating probability beliefs based on new evidence, enabling inference from prior knowledge and observed data.",
  thm: "<h5>Partition Form</h5><p>If $\\{B_1, \\ldots, B_n\\}$ partition the sample space: $$P(B_i|A) = \\frac{P(A|B_i)P(B_i)}{\\sum_{j=1}^n P(A|B_j)P(B_j)}$$</p>",
  ctr: "<span class=\"counter-title\">Prior Neglect Error</span>Ignoring the prior $P(B_i)$ when updating with evidence, treating all hypotheses as equally likely.",
  ex: "<p><strong>Problem:</strong> Urn 1: 3 red, 2 black; Urn 2: 2 red, 3 black; Urn 3: 1 red, 4 black. An urn is chosen uniformly and a red ball is drawn. Posterior probability it was Urn 1?</p><p><strong>Solution:</strong> $P(R) = \\frac{1}{3}(\\frac{3}{5}+\\frac{2}{5}+\\frac{1}{5}) = \\frac{2}{5}$. $P(U_1|R) = \\frac{\\frac{3}{5}\\cdot\\frac{1}{3}}{\\frac{2}{5}} = \\frac{1}{2}$.</p>"
},
"poisson distribution": {
  def: "Limiting form of Binomial with $n \\to \\infty$, $p \\to 0$, $np = \\lambda$ — models rare events in fixed intervals.",
  thm: "<h5>Additive Property</h5><p>If $X_1 \\sim \\text{Poi}(\\lambda_1)$, $X_2 \\sim \\text{Poi}(\\lambda_2)$ independent, then $X_1+X_2 \\sim \\text{Poi}(\\lambda_1+\\lambda_2)$.</p>",
  ctr: "<span class=\"counter-title\">Time Dependence & Clumping</span>Using a constant $\\lambda$ when events cluster temporally violates the memoryless independent-increments axiom.",
  ex: "<p><strong>Problem:</strong> A server encounters faults at mean rate 3/hour (Poisson). Find the probability exactly 2 faults occurred in the first 20 minutes, given 5 faults in the first hour.</p><p><strong>Solution:</strong> $X \\sim \\text{Poi}(1)$ for 20 min, $Y \\sim \\text{Poi}(2)$ for the rest. $P(X=2|X+Y=5) = \\frac{P(X=2)P(Y=3)}{P(X+Y=5)} = \\frac{(e^{-1}\\frac{1}{2})(e^{-2}\\frac{8}{6})}{e^{-3}\\frac{243}{120}} = \\frac{80}{243}$.</p>"
},
"normal distribution": {
  def: "The bell curve, fully characterized by mean $\\mu$ and standard deviation $\\sigma$.",
  thm: "<h5>Central Limit Theorem</h5><p>For i.i.d. variables with finite mean $\\mu$ and variance $\\sigma^2$: $$\\frac{\\bar{X}_n - \\mu}{\\sigma/\\sqrt{n}} \\xrightarrow{d} N(0,1)$$</p>",
  ctr: "<span class=\"counter-title\">Forgetting Non-Normality</span>Assuming normality without verifying via Shapiro-Wilk, Anderson-Darling, or Q-Q plots.",
  ex: "<p><strong>Problem:</strong> Test scores are $N(500, 100^2)$. What proportion score between 400 and 650?</p><p><strong>Solution:</strong> $Z_1 = -1$, $Z_2 = 1.5$. $P(-1 \\le Z \\le 1.5) = \\Phi(1.5) - \\Phi(-1) \\approx 0.9332 - 0.1587 = 0.7745$.</p>"
},
"vector space": {
  def: "An algebraic structure closed under vector addition and scalar multiplication with the standard axioms.",
  thm: "<h5>Basis and Dimension Theorem</h5><p>Every vector space has a basis; all bases have the same cardinality — the dimension.</p>",
  ctr: "<span class=\"counter-title\">Confusing Span and Independence</span>A dependent set can still span; an independent set may span only a subspace.",
  ex: "<p><strong>Problem:</strong> Do $v_1=[1,0,1]^T$, $v_2=[0,1,1]^T$, $v_3=[1,1,2]^T$ form a basis for $\\mathbb{R}^3$?</p><p><strong>Solution:</strong> $v_3 = v_1 + v_2$, so the set is linearly dependent (rank 2) — not a basis; it spans a 2-D subspace.</p>"
},
"eigenvalues and eigenvectors": {
  def: "For matrix $A$, scalars $\\lambda$ and vectors $v \\ne 0$ satisfying $Av = \\lambda v$ — intrinsic stretching directions.",
  thm: "<h5>Spectral Theorem</h5><p>A symmetric matrix diagonalizes as $A = QDQ^T$ with orthonormal eigenvectors.</p>",
  ctr: "<span class=\"counter-title\">Not All Matrices Diagonalize</span>Defective matrices (algebraic > geometric multiplicity) require Jordan normal form.",
  ex: "<p><strong>Problem:</strong> Find eigenvalues/eigenvectors of $A = \\begin{pmatrix} 3 & 1 \\\\ 1 & 3 \\end{pmatrix}$.</p><p><strong>Solution:</strong> $\\det(A-\\lambda I) = (3-\\lambda)^2 - 1 = 0 \\Rightarrow \\lambda_1=2, \\lambda_2=4$. Eigenvectors: $[1,-1]^T$ and $[1,1]^T$.</p>"
},
"singular value decomposition (svd)": {
  def: "Factorization of any real matrix: $A = U \\Sigma V^T$.",
  thm: "<h5>Eckart–Young–Mirsky Theorem</h5><p>The optimal rank-$k$ approximation (Frobenius norm) keeps only the $k$ largest singular values.</p>",
  ctr: "<span class=\"counter-title\">Singular Value ≠ Eigenvalue</span>Singular values are non-negative square roots of eigenvalues of $A^TA$, not of $A$.",
  ex: "<p><strong>Problem:</strong> Find the SVD of $A = \\begin{pmatrix} 3 & 0 \\\\ 0 & -2 \\end{pmatrix}$.</p><p><strong>Solution:</strong> $A^TA = \\text{diag}(9,4)$ gives $\\sigma_1=3, \\sigma_2=2$. $U = \\text{diag}(1,-1)$, $V = I$, so $A = U\\Sigma V^T$.</p>"
},
"projection matrix": {
  def: "Orthogonal projection onto a subspace: $$P = A(A^TA)^{-1}A^T$$",
  thm: "<h5>Idempotency</h5><p>$P^2 = P = P^T$, and eigenvalues satisfy $\\lambda \\in \\{0,1\\}$.</p>",
  ctr: "<span class=\"counter-title\">Non-orthogonal Projections</span>$P = AA^T$ is wrong when columns of $A$ are not orthonormal.",
  ex: "<p><strong>Problem:</strong> Build the $3\\times3$ projection onto the plane spanned by $[1,1,0]^T$ and $[0,1,1]^T$.</p><p><strong>Solution:</strong> $A^TA = \\begin{pmatrix}2&1\\\\1&2\\end{pmatrix}$, $(A^TA)^{-1} = \\frac{1}{3}\\begin{pmatrix}2&-1\\\\-1&2\\end{pmatrix}$, giving $P = \\frac{1}{3}\\begin{pmatrix}2&1&-1\\\\1&2&1\\\\-1&1&2\\end{pmatrix}$.</p>"
},
"limits": {
  def: "$\\lim_{x \\to a} f(x) = L$ means $\\forall \\epsilon > 0, \\exists \\delta > 0: |x-a| < \\delta \\Rightarrow |f(x)-L| < \\epsilon$.",
  thm: "<h5>Limit Laws</h5><p>Sum, product and quotient (denominator $\\ne 0$) of convergent limits converge to the corresponding combination.</p>",
  ctr: "<span class=\"counter-title\">One-sided vs Two-sided</span>The two-sided limit exists only if both one-sided limits coincide.",
  ex: "<p><strong>Problem:</strong> Evaluate $\\lim_{x \\to 2} \\frac{x^2-4}{x-2}$.</p><p><strong>Solution:</strong> Factor: $\\frac{(x-2)(x+2)}{x-2} = x+2 \\to 4$.</p>"
},
"continuity": {
  def: "$f$ is continuous at $a$ if $\\lim_{x \\to a} f(x) = f(a)$ — no jumps or breaks.",
  thm: "<h5>Intermediate Value Theorem</h5><p>If $f$ is continuous on $[a,b]$ and $k$ lies between $f(a)$ and $f(b)$, $\\exists c \\in (a,b)$ with $f(c)=k$.</p>",
  ctr: "<span class=\"counter-title\">Dirichlet Function</span>$f(x)=1$ on $\\mathbb{Q}$, else $0$ — nowhere continuous.",
  ex: "<p><strong>Problem:</strong> $\\alpha(T) = \\frac{\\sqrt{T^2+16}-4}{T^2}$ for $T \\ne 0$, $\\alpha(0)=k$. Find $k$ for continuity.</p><p><strong>Solution:</strong> Rationalize: $\\lim_{T\\to 0} \\frac{1}{\\sqrt{T^2+16}+4} = \\frac{1}{8}$. So $k = 1/8$.</p>"
},
"chain rule": {
  def: "If $y = f(u)$, $u = g(x)$: $\\frac{dy}{dx} = \\frac{dy}{du}\\cdot\\frac{du}{dx}$.",
  thm: "<h5>Multivariable Form</h5><p>$D(f \\circ g) = Df \\cdot Dg$ (Jacobian multiplication).</p>",
  ctr: "<span class=\"counter-title\">Forgetting the Inner Derivative</span>$\\frac{d}{dx}\\sin(x^2) = \\cos(x^2)\\cdot 2x$, not $\\cos(x^2)$.",
  ex: "<p><strong>Problem:</strong> Differentiate $e^{-x^2}$.</p><p><strong>Solution:</strong> $u=-x^2 \\Rightarrow \\frac{dy}{dx} = e^u \\cdot (-2x) = -2x e^{-x^2}$.</p>"
},
"gradient descent": {
  def: "Iterative minimization: $x_{t+1} = x_t - \\alpha \\nabla f(x_t)$.",
  thm: "<h5>Convergence Rate</h5><p>For strongly convex $f$ with Lipschitz gradient: $f(x_t)-f^* \\le (1-2\\alpha\\mu)^t(f(x_0)-f^*)$.</p>",
  ctr: "<span class=\"counter-title\">Fixed Learning Rate Fallacy</span>Constant $\\alpha$ on poorly scaled gradients causes oscillation in steep directions, stagnation in shallow ones.",
  ex: "<p><strong>Problem:</strong> Minimize $f(x,y)=x^2+4y^2$ from $[2,1]^T$ with $\\alpha=0.1$, two iterations.</p><p><strong>Solution:</strong> $\\nabla f = [2x, 8y]^T$. It.1: $[2,1] - 0.1[4,8] = [1.6, 0.2]$. It.2: $[1.6,0.2] - 0.1[3.2,1.6] = [1.28, 0.04]$.</p>"
},
"convexity and convex functions": {
  def: "$f$ is convex if $f(\\lambda x + (1-\\lambda)y) \\le \\lambda f(x) + (1-\\lambda)f(y)$ for $\\lambda \\in [0,1]$.",
  thm: "<h5>Second-Order Characterization</h5><p>$f$ convex $\\iff$ Hessian $H(x)$ positive semidefinite everywhere.</p>",
  ctr: "<span class=\"counter-title\">Convex vs Concave</span>Convexity guarantees global optima for minimization; concave objectives need sign reversal.",
  ex: "<p><strong>Problem:</strong> Is $f(x,y) = x^2 + xy + y^2$ convex?</p><p><strong>Solution:</strong> $H = \\begin{pmatrix}2&1\\\\1&2\\end{pmatrix}$, eigenvalues $1, 3 > 0$ → positive definite → strictly convex.</p>"
},
"regression and classification problems": {
  def: "Regression predicts continuous $y = f(x) + \\epsilon$; classification assigns labels from $\\{1,\\ldots,K\\}$.",
  thm: "<h5>Bias-Variance Decomposition</h5><p>$E[(y-\\hat y)^2] = \\text{Bias}^2 + \\text{Var} + \\sigma^2$.</p>",
  ctr: "<span class=\"counter-title\">Ignoring Class Imbalance</span>Accuracy is misleading under imbalance; use precision, recall, F1, or AUC-ROC.",
  ex: "<p><strong>Problem:</strong> With 95% class 0 / 5% class 1, an all-zero classifier scores 95% accuracy. Why is this bad?</p><p><strong>Solution:</strong> Recall for class 1 is 0; F1 = 0. Use weighted loss, oversampling (SMOTE), or cost-sensitive learning.</p>"
},
"logistic regression": {
  def: "Models log-odds linearly: $\\log\\frac{p}{1-p} = \\beta_0 + \\beta_1 x$, giving $p = \\frac{1}{1+e^{-(\\beta_0+\\beta_1 x)}}$.",
  thm: "<h5>Maximum Likelihood</h5><p>$\\ell = \\sum_i [y_i \\log \\hat p_i + (1-y_i)\\log(1-\\hat p_i)]$, maximized via gradient ascent.</p>",
  ctr: "<span class=\"counter-title\">OLS on Binary Targets</span>Linear regression on binary outcomes can predict probabilities outside $[0,1]$.",
  ex: "<p><strong>Problem:</strong> With $\\log\\frac{p}{1-p} = -2 + 0.5x$, find $p$ at $x=4$.</p><p><strong>Solution:</strong> Odds $= e^0 = 1 \\Rightarrow p = 0.5$.</p>"
},
"support vector machine": {
  def: "Maximizes the margin: $\\max \\frac{2}{\\|w\\|}$ s.t. $y_i(w \\cdot x_i + b) \\ge 1$.",
  thm: "<h5>Kernel Trick</h5><p>Replace $x_i \\cdot x_j$ with $K(x_i, x_j)$ to operate in high-dimensional feature spaces implicitly.</p>",
  ctr: "<span class=\"counter-title\">Ignoring Feature Scaling</span>SVM margins are scale-sensitive; standardize features first.",
  ex: "<p><strong>Problem:</strong> Class 1: $(1,1),(2,2)$; Class 0: $(1,2),(2,1)$. Find a separating hyperplane.</p><p><strong>Solution:</strong> $x_1 + x_2 = 2.5$ separates the classes with margin $\\frac{1}{\\sqrt{2}}$ (after checking all four points).</p>"
},
"k-means clustering": {
  def: "Partitions data into $k$ clusters minimizing within-cluster variance: $\\min \\sum_k \\sum_{x \\in C_k} \\|x-\\mu_k\\|^2$.",
  thm: "<h5>Convergence Guarantee</h5><p>The objective decreases monotonically → finite convergence to a local minimum.</p>",
  ctr: "<span class=\"counter-title\">Initialization Sensitivity</span>Results depend heavily on initial centroids; use multiple restarts or k-means++.",
  ex: "<p><strong>Problem:</strong> Cluster $\\{[0,0],[0,2],[3,3],[3,5]\\}$ with $k=2$, initial centroids $[0,0]$, $[3,3]$.</p><p><strong>Solution:</strong> Assignment → $C_1=\\{[0,0],[0,2]\\}$, $C_2=\\{[3,3],[3,5]\\}$; new centroids $[0,1]$, $[3,4]$; assignments stable → converged.</p>"
},
"principal component analysis (pca)": {
  def: "Finds directions of maximum variance — eigenvectors of the covariance matrix sorted by eigenvalue.",
  thm: "<h5>Optimal Reconstruction</h5><p>The first $k$ components minimize squared reconstruction error over all $k$-dimensional subspaces.</p>",
  ctr: "<span class=\"counter-title\">Unscaled Features</span>Large-scale features dominate; standardize to zero mean, unit variance first.",
  ex: "<p><strong>Problem:</strong> Covariance $\\Sigma = \\begin{pmatrix}4&1\\\\1&2\\end{pmatrix}$. Find the first principal component.</p><p><strong>Solution:</strong> $\\lambda^2 - 6\\lambda + 7 = 0 \\Rightarrow \\lambda_1 = 3+\\sqrt{2} \\approx 4.414$. Eigenvector $v_1 \\propto [1, \\lambda_1 - 4]^T \\approx [1, 0.414]^T$ (normalized).</p>"
}
};

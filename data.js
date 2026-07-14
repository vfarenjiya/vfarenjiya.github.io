const SUBJECT_META = {
  ps:   { name:'Probability & Statistics', color:'#e8a23d' },
  la:   { name:'Linear Algebra', color:'#5aa9e6' },
  co:   { name:'Calculus & Optimization', color:'#c792ea' },
  pdsa: { name:'Programming, Data Structures & Algorithms', color:'#35d07f' },
  dbms: { name:'Database Management & Warehousing', color:'#ff8a5c' },
  ml:   { name:'Machine Learning', color:'#ff6b46' },
  ai:   { name:'Artificial Intelligence', color:'#f6c445' },
  rev:  { name:'Full Revision & Mock Tests', color:'#8a8fa0' },
};
const SUBJECT_ORDER = ['ps','la','co','pdsa','dbms','ml','ai','rev'];

const TOPICS = [
  // Probability & Statistics
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

  // Linear Algebra
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

  // Calculus & Optimization
  {s:'co', w:6, t:'Functions of a single variable', f:'f:\\mathbb R \\to \\mathbb R'},
  {s:'co', w:6, t:'Limits', f:'\\lim_{x \\to a} f(x) = L \\iff \\forall \\epsilon>0, \\exists \\delta>0: |x-a|<\\delta \\Rightarrow |f(x)-L|<\\epsilon'},
  {s:'co', w:6, t:'Continuity', f:'f \\text{ continuous at } a \\iff \\lim_{x\\to a} f(x)=f(a)'},
  {s:'co', w:6, t:'Differentiability', f:'f\'(a)=\\lim_{h\\to 0}\\dfrac{f(a+h)-f(a)}{h}'},
  {s:'co', w:6, t:'Chain rule', f:'(f \\circ g)\'(x) = f\'(g(x))\\cdot g\'(x)'},
  {s:'co', w:6, t:'Product rule', f:'(fg)\'(x)=f\'(x)g(x)+f(x)g\'(x)'},
  {s:'co', w:6, t:'Quotient rule', f:'\\left(\\dfrac{f}{g}\\right)\'(x)=\\dfrac{f\'(x)g(x)-f(x)g\'(x)}{(g(x))^2}'},
  {s:'co', w:6, t:'Critical points and extrema', f:'f\'(a)=0 \\text{ or undefined}'},
  {s:'co', w:7, t:'Concavity and inflection points', f:'f\'\'(x)>0 \\text{ (convex)}, \\quad f\'\'(x)<0 \\text{ (concave)}'},
  {s:'co', w:7, t:'Integration (Riemann)', f:'\\int_a^b f(x)\\,dx = \\lim_{n\\to\\infty}\\sum_{i=1}^{n} f(x_i^*)\\Delta x'},
  {s:'co', w:7, t:'Fundamental theorem of calculus', f:'\\dfrac{d}{dx}\\int_a^x f(t)\\,dt = f(x)'},
  {s:'co', w:7, t:'Integration by parts', f:'\\int u\\,dv = uv - \\int v\\,du'},
  {s:'co', w:7, t:'Substitution rule', f:'\\int f(g(x))g\'(x)\\,dx = \\int f(u)\\,du'},
  {s:'co', w:7, t:'Partial derivatives', f:'\\dfrac{\\partial f}{\\partial x_i} = \\lim_{h\\to 0} \\dfrac{f(x_1,\\dots,x_i+h,\\dots,x_n)-f(x)}{h}'},
  {s:'co', w:7, t:'Gradient', f:'\\nabla f = \\left(\\dfrac{\\partial f}{\\partial x_1}, \\ldots, \\dfrac{\\partial f}{\\partial x_n}\\right)'},
  {s:'co', w:7, t:'Hessian matrix', f:'H = \\begin{pmatrix} \\frac{\\partial^2 f}{\\partial x_1^2} & \\cdots & \\frac{\\partial^2 f}{\\partial x_1 \\partial x_n} \\\\ \\vdots & \\ddots & \\vdots \\\\ \\frac{\\partial^2 f}{\\partial x_n \\partial x_1} & \\cdots & \\frac{\\partial^2 f}{\\partial x_n^2} \\end{pmatrix}'},
  {s:'co', w:8, t:'Convexity and convex functions', f:'f(\\lambda x + (1-\\lambda)y) \\le \\lambda f(x) + (1-\\lambda)f(y)'},
  {s:'co', w:8, t:'Lagrange multipliers', f:'\\nabla f = \\lambda \\nabla g \\text{ at constrained optimum}'},
  {s:'co', w:8, t:'KKT conditions', f:'\\nabla f(x^*) + \\sum_i \\lambda_i \\nabla g_i(x^*) + \\sum_j \\mu_j \\nabla h_j(x^*) = 0'},
  {s:'co', w:8, t:'Gradient descent', f:'x_{t+1} = x_t - \\alpha \\nabla f(x_t)'},
  {s:'co', w:8, t:'Newton\'s method', f:'x_{t+1} = x_t - [H(x_t)]^{-1}\\nabla f(x_t)'},

  // PDSA
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

  // DBMS
  {s:'dbms', w:11, t:'Relational data model', tip:'Tables, rows, columns, keys'},
  {s:'dbms', w:11, t:'SQL: SELECT, WHERE, JOIN', tip:'Fundamental query operations'},
  {s:'dbms', w:11, t:'Normalization: 1NF, 2NF, 3NF', tip:'Eliminating redundancy'},
  {s:'dbms', w:11, t:'Transactions and ACID properties', f:'\\text{Atomicity, Consistency, Isolation, Durability}'},
  {s:'dbms', w:11, t:'Indexing', tip:'B-tree and hash indices'},
  {s:'dbms', w:11, t:'Query optimization', tip:'Cost models and execution plans'},
  {s:'dbms', w:12, t:'Measures: computations', tip:'Aggregate functions: SUM, COUNT, AVG, MIN, MAX'},

  // Machine Learning
  {s:'ml', w:9, t:'Regression and classification problems', f:'y=f(x)+\\epsilon\\ \\text{(regression)};\\quad y\\in\\{1,\\dots,K\\}\\ \\text{(classification)}'},
  {s:'ml', w:9, t:'Simple linear regression', f:'\\hat\\beta_1=\\dfrac{Cov(X,Y)}{Var(X)},\\quad \\hat\\beta_0=\\bar y-\\hat\\beta_1\\bar x'},
  {s:'ml', w:9, t:'Multiple linear regression', f:'\\hat\\beta=(X^TX)^{-1}X^Ty'},
  {s:'ml', w:9, t:'Ridge regression', f:'\\hat\\beta=(X^TX+\\lambda I)^{-1}X^Ty'},
  {s:'ml', w:9, t:'Logistic regression', f:'p=\\dfrac{1}{1+e^{-(\\beta_0+\\beta_1x)}}'},
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

  // AI
  {s:'ai', w:11, t:'Search: uninformed', tip:'BFS, DFS, uniform-cost search — no heuristic used'},
  {s:'ai', w:11, t:'Search: informed', f:'f(n)=g(n)+h(n)\\ \\text{(A* search)}'},
  {s:'ai', w:11, t:'Search: adversarial', tip:'Minimax search, with alpha-beta pruning'},
  {s:'ai', w:11, t:'Logic: propositional', f:'\\wedge,\\ \\vee,\\ \\neg,\\ \\rightarrow,\\ \\leftrightarrow'},
  {s:'ai', w:11, t:'Logic: predicate', f:'\\forall x\\,P(x),\\quad \\exists x\\,P(x)'},
  {s:'ai', w:11, t:'Reasoning under uncertainty: conditional independence', f:'P(X,Y|Z)=P(X|Z)\\,P(Y|Z)'},
  {s:'ai', w:11, t:'Exact inference: variable elimination', tip:'Sum out variables one at a time via factor marginalization'},
  {s:'ai', w:11, t:'Approximate inference: sampling', tip:'Monte Carlo methods — likelihood weighting, Gibbs sampling'},

  // Revision
  {s:'rev', w:12, t:'Full revision — Probability, Linear Algebra, Calculus', tip:'Redo your formula sheet; work 10 mixed problems per topic'},
  {s:'rev', w:12, t:'Full revision — PDSA, DBMS, ML, AI', tip:'Redo your formula sheet; work 10 mixed problems per topic'},
  {s:'rev', w:12, t:'Previous year GATE DA paper — attempt 1', tip:'Simulate full 3-hour test conditions, no notes'},
  {s:'rev', w:12, t:'Previous year GATE DA paper — attempt 2', tip:'Simulate full 3-hour test conditions, no notes'},
  {s:'rev', w:12, t:'Full-length mock test 1', tip:'Analyze section-wise accuracy and timing right after'},
  {s:'rev', w:12, t:'Full-length mock test 2', tip:'Analyze section-wise accuracy and timing right after'},
  {s:'rev', w:12, t:'Rework mistakes from mocks & weak topics', tip:'Keep a running error log — revisit it the night before the exam'},
  {s:'rev', w:12, t:'Final formula & concept sheet pass', tip:'One page per subject — glance through on exam morning only'},
];
// IDs are derived from subject+title (not array position) so that reordering,
// inserting, or removing topics later doesn't silently reassign a user's
// already-saved progress (state.done is keyed by these ids) to the wrong topic.
function _stableTopicId(subject, title) {
  const str = subject + '|' + title;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  }
  return 't' + Math.abs(hash).toString(36);
}
TOPICS.forEach(topic => topic.id = _stableTopicId(topic.s, topic.t));

const MATH_DATABASE = {
  "counting: permutations and combinations": {
    def: "Rigorous combinatorics managing constraints, partitions, and allocations over discrete sets using mappings.",
    thm: "<h5>Stars and Bars Theorem</h5><p>The number of distinct non-negative integer solutions to $\\sum_{i=1}^k x_i = n$ is given exactly by $\\binom{n+k-1}{k-1}$. For positive integer solutions: $\\binom{n-1}{k-1}$.</p>",
    ctr: "<span class=\"counter-title\">Distinct vs Indistinct Objects</span>Conflating Stirling numbers of the second kind (allocating distinct objects to indistinct buckets) with standard combinations.",
    ex: "<p><strong>Problem:</strong> A network router has 5 distinct outbound processing queues. It receives 12 identical packets that must be allocated concurrently. Find the exact probability that no processing queue remains completely idle.</p><p><strong>Solution:</strong> This maps to finding the positive integer solutions to $x_1 + x_2 + x_3 + x_4 + x_5 = 12$. By applying Stars and Bars, total allocations without constraints is $\\binom{12+5-1}{5-1} = \\binom{16}{4} = 1820$. The number of positive integer solutions (no queue empty) is $\\binom{12-1}{5-1} = \\binom{11}{4} = 330$. Hence, the exact mathematical probability is $\\frac{330}{1820} = \\frac{33}{182}$.</p>"
  },
  "probability axioms": {
    def: "A formal framework satisfying three fundamental postulates: non-negativity, normalisation, and countable additivity for disjoint events.",
    thm: "<h5>Boole's Inequality (Union Bound)</h5><p>For any countable collection of events $\\{A_i\\}$: $$P\\left(\\bigcup_i A_i\\right) \\le \\sum_i P(A_i)$$Equality holds if and only if the events are mutually disjoint.</p>",
    ctr: "<span class=\"counter-title\">Negating Axiom Assumptions</span>Treating probability as additive when events overlap: $P(A \\cup B) \\ne P(A) + P(B)$ unless $A \\cap B = \\emptyset$.",
    ex: "<p><strong>Problem:</strong> In a quality-control setting, the probability that a manufactured chip passes test A is 0.95, and passes test B is 0.92. The probability of passing both is 0.88. What is the probability that the chip fails at least one test?</p><p><strong>Solution:</strong> Let $A$ = passes test A, $B$ = passes test B. We want $P(A^c \\cup B^c) = P((A \\cap B)^c) = 1 - P(A \\cap B) = 1 - 0.88 = 0.12$. Alternatively: $P(A^c \\cup B^c) = P(A^c) + P(B^c) - P(A^c \\cap B^c) = 0.05 + 0.08 - P(A^c \\cap B^c)$. From $P(A \\cup B) = P(A) + P(B) - P(A \\cap B) = 0.95 + 0.92 - 0.88 = 0.99$, we get $P(A^c \\cap B^c) = 1 - 0.99 = 0.01$. Thus $P(A^c \\cup B^c) = 0.05 + 0.08 - 0.01 = 0.12$.</p>"
  },
  "conditional probability": {
    def: "The probability of an event $A$ occurring given that event $B$ has already occurred, denoted $P(A|B)$, representing a restricted sample space.",
    thm: "<h5>Chain Rule for Conditional Probability</h5><p>For events $A_1, A_2, \\ldots, A_n$: $$P(A_1 \\cap A_2 \\cap \\cdots \\cap A_n) = P(A_1)P(A_2|A_1)P(A_3|A_1 \\cap A_2)\\cdots P(A_n|A_1 \\cap \\cdots \\cap A_{n-1})$$</p>",
    ctr: "<span class=\"counter-title\">Reversing Conditioning Direction</span>Assuming $P(A|B) = P(B|A)$ without applying Bayes' theorem leads to systematic bias in diagnostic and inference problems.",
    ex: "<p><strong>Problem:</strong> A diagnostic test for a rare disease has 99% sensitivity (true positive rate) and 98% specificity (true negative rate). The disease prevalence is 0.1% in the population. If a randomly selected person tests positive, what is the probability they actually have the disease?</p><p><strong>Solution:</strong> Let $D$ = has disease, $T$ = tests positive. We want $P(D|T)$. By Bayes: $P(D|T) = \\frac{P(T|D)P(D)}{P(T)}$. Here: $P(T|D) = 0.99$, $P(D) = 0.001$, $P(T|D^c) = 1 - 0.98 = 0.02$, $P(D^c) = 0.999$. Thus: $P(T) = P(T|D)P(D) + P(T|D^c)P(D^c) = 0.99 \\cdot 0.001 + 0.02 \\cdot 0.999 = 0.00099 + 0.01998 = 0.02097$. Therefore: $P(D|T) = \\frac{0.00099}{0.02097} \\approx 0.0472$ or about 4.72%.</p>"
  },
  "bayes' theorem": {
    def: "A fundamental rule for updating probability beliefs based on new evidence, enabling inference from prior knowledge and observed data.",
    thm: "<h5>Extended Bayes' Theorem (Partition Form)</h5><p>If $\\{B_1, B_2, \\ldots, B_n\\}$ form a partition of the sample space, then: $$P(B_i|A) = \\frac{P(A|B_i)P(B_i)}{\\sum_{j=1}^n P(A|B_j)P(B_j)}$$</p>",
    ctr: "<span class=\"counter-title\">Prior Neglect Error</span>Ignoring the prior $P(B_i)$ when updating with new evidence $A$, treating all hypotheses as equally likely regardless of background knowledge.",
    ex: "<p><strong>Problem:</strong> Three urns contain balls: Urn 1 has 3 red and 2 black; Urn 2 has 2 red and 3 black; Urn 3 has 1 red and 4 black. An urn is selected uniformly at random, and a ball drawn from it is red. What is the posterior probability that Urn 1 was selected?</p><p><strong>Solution:</strong> Let $U_i$ = urn $i$ selected, $R$ = red ball drawn. Priors: $P(U_i) = 1/3$ for all $i$. Likelihoods: $P(R|U_1) = 3/5$, $P(R|U_2) = 2/5$, $P(R|U_3) = 1/5$. By the law of total probability: $P(R) = \\frac{1}{3}(\\frac{3}{5} + \\frac{2}{5} + \\frac{1}{5}) = \\frac{1}{3} \\cdot \\frac{6}{5} = \\frac{2}{5}$. By Bayes: $P(U_1|R) = \\frac{P(R|U_1)P(U_1)}{P(R)} = \\frac{\\frac{3}{5} \\cdot \\frac{1}{3}}{\\frac{2}{5}} = \\frac{1}{5} \\cdot \\frac{5}{2} = \\frac{1}{2}$.</p>"
  },
  "poisson distribution": {
    def: "A limiting form of the Binomial distribution where $n \\to \\infty$ and $p \\to 0$ such that $np = \\lambda$, modeling rare events in fixed intervals.",
    thm: "<h5>Additive Property of Independent Poisson Variables</h5><p>If $X_1 \\sim \\text{Poi}(\\lambda_1)$ and $X_2 \\sim \\text{Poi}(\\lambda_2)$ are independent, then $X_1 + X_2 \\sim \\text{Poi}(\\lambda_1 + \\lambda_2)$.</p>",
    ctr: "<span class=\"counter-title\">Time Dependence & Clumping</span>Using a constant rate parameter $\\lambda$ when events display temporal clustering, which violates the memoryless independent increments axiom.",
    ex: "<p><strong>Problem:</strong> A distributed cloud server encounters runtime faults at a mean rate of 3 errors per hour, matching a Poisson process. Calculate the exact conditional probability that exactly 2 faults occurred in the first 20 minutes, given that 5 faults occurred in the first hour.</p><p><strong>Solution:</strong> Let $X$ be faults in the first 20 mins ($t_1=1/3$ hour), so $X \\sim \\text{Poi}(\\lambda_1 = 3 \\times 1/3 = 1)$. Let $Y$ be faults in the remaining 40 mins, so $Y \\sim \\text{Poi}(\\lambda_2 = 2)$. We want $P(X=2 | X+Y=5) = \\frac{P(X=2)P(Y=3)}{P(X+Y=5)}$. Utilizing the distributions: $\\frac{(e^{-1}\\frac{1^2}{2!}) \\cdot (e^{-2}\\frac{2^3}{3!})}{e^{-3}\\frac{3^5}{5!}} = \\frac{80}{243}$.</p>"
  },
  "normal distribution": {
    def: "The bell curve distribution, ubiquitous in nature and statistics, fully characterized by its mean $\\mu$ and standard deviation $\\sigma$.",
    thm: "<h5>Central Limit Theorem (CLT)</h5><p>For i.i.d. random variables $X_1, X_2, \\ldots, X_n$ with finite mean $\\mu$ and variance $\\sigma^2$, the standardized sample mean converges in distribution to the standard normal: $$\\frac{\\bar{X}_n - \\mu}{\\sigma/\\sqrt{n}} \\xrightarrow{d} N(0,1)$$</p>",
    ctr: "<span class=\"counter-title\">Forgetting Non-Normality</span>Assuming that data follows a normal distribution without verifying through Shapiro-Wilk, Anderson-Darling, or Q-Q plot diagnostics.",
    ex: "<p><strong>Problem:</strong> Scores on a standardized test are normally distributed with mean 500 and standard deviation 100. What proportion of test-takers score between 400 and 650?</p><p><strong>Solution:</strong> Let $X \\sim N(500, 100^2)$. Standardize: $Z_1 = \\frac{400-500}{100} = -1$, $Z_2 = \\frac{650-500}{100} = 1.5$. Thus: $P(400 \\le X \\le 650) = P(-1 \\le Z \\le 1.5) = \\Phi(1.5) - \\Phi(-1) = \\Phi(1.5) - (1-\\Phi(1)) \\approx 0.9332 - 0.1587 = 0.7745$ or 77.45%.</p>"
  },
  "vector space": {
    def: "An algebraic structure consisting of a set of vectors, closed under vector addition and scalar multiplication, with defined properties like commutativity and distributivity.",
    thm: "<h5>Basis and Dimension Theorem</h5><p>Any vector space has a basis (maximal linearly independent set), and all bases have the same cardinality, called the dimension of the space.</p>",
    ctr: "<span class=\"counter-title\">Confusing Span and Linear Independence</span>A set of vectors can be linearly dependent but still span the space, and a linearly independent set may span only a subspace.",
    ex: "<p><strong>Problem:</strong> Determine whether $v_1 = [1, 0, 1]^T$, $v_2 = [0, 1, 1]^T$, $v_3 = [1, 1, 2]^T$ form a basis for $\\mathbb{R}^3$.</p><p><strong>Solution:</strong> Form matrix $A = [v_1 | v_2 | v_3] = \\begin{pmatrix} 1 & 0 & 1 \\\\ 0 & 1 & 1 \\\\ 1 & 1 & 2 \\end{pmatrix}$. Row reduce: $R_3 \\leftarrow R_3 - R_1$ gives $\\begin{pmatrix} 1 & 0 & 1 \\\\ 0 & 1 & 1 \\\\ 0 & 1 & 1 \\end{pmatrix}$. Then $R_3 \\leftarrow R_3 - R_2$ gives $\\begin{pmatrix} 1 & 0 & 1 \\\\ 0 & 1 & 1 \\\\ 0 & 0 & 0 \\end{pmatrix}$. Rank = 2, so the vectors are linearly dependent and do not form a basis for $\\mathbb{R}^3$. They span a 2-dimensional subspace.</p>"
  },
  "eigenvalues and eigenvectors": {
    def: "For matrix $A$, scalars $\\lambda$ and vectors $v \\ne 0$ satisfying $Av = \\lambda v$ represent intrinsic geometric stretching directions.",
    thm: "<h5>Spectral Theorem</h5><p>A symmetric matrix $A$ can be diagonalized as $A = QDQ^T$ where $Q$ contains orthonormal eigenvectors and $D$ is diagonal with eigenvalues.</p>",
    ctr: "<span class=\"counter-title\">Assuming All Matrices are Diagonalizable</span>Non-symmetric matrices may have defective eigenvalues (algebraic multiplicity exceeds geometric multiplicity) and require Jordan normal form.",
    ex: "<p><strong>Problem:</strong> Find the eigenvalues and corresponding eigenvectors of $A = \\begin{pmatrix} 3 & 1 \\\\ 1 & 3 \\end{pmatrix}$.</p><p><strong>Solution:</strong> Characteristic polynomial: $\\det(A - \\lambda I) = \\det\\begin{pmatrix} 3-\\lambda & 1 \\\\ 1 & 3-\\lambda \\end{pmatrix} = (3-\\lambda)^2 - 1 = \\lambda^2 - 6\\lambda + 8 = (\\lambda-2)(\\lambda-4) = 0$. Eigenvalues: $\\lambda_1 = 2, \\lambda_2 = 4$. For $\\lambda_1 = 2$: $(A - 2I)v = \\begin{pmatrix} 1 & 1 \\\\ 1 & 1 \\end{pmatrix}v = 0 \\Rightarrow v_1 = [1, -1]^T$ (up to scaling). For $\\lambda_2 = 4$: $(A - 4I)v = \\begin{pmatrix} -1 & 1 \\\\ 1 & -1 \\end{pmatrix}v = 0 \\Rightarrow v_2 = [1, 1]^T$.</p>"
  },
  "singular value decomposition (svd)": {
    def: "Factorization of any real matrix into orthogonal spaces and geometric singular extensions: $A = U \\Sigma V^T$.",
    thm: "<h5>Eckart-Young-Mirsky Theorem</h5><p>The optimal rank-$k$ approximation of a matrix under the Frobenius norm is constructed by setting all but the $k$-largest singular values to 0.</p>",
    ctr: "<span class=\"counter-title\">Singular Value vs Eigenvalue</span>Conflating the singular values of $A$ with eigenvalues of $A$. Singular values are always non-negative square roots of eigenvalues of $A^TA$.",
    ex: "<p><strong>Problem:</strong> Find the exact Singular Value Decomposition (SVD) of the matrix $A = \\begin{pmatrix} 3 & 0 \\\\ 0 & -2 \\end{pmatrix}$.</p><p><strong>Solution:</strong> We compute $A^TA = \\begin{pmatrix} 9 & 0 \\\\ 0 & 4 \\end{pmatrix}$. The eigenvalues are $\\lambda_1=9, \\lambda_2=4$, which yields singular values $\\sigma_1=3, \\sigma_2=2$. The right singular vectors are $v_1=[1,0]^T, v_2=[0,1]^T$, meaning $V=I$. The left singular vectors are $u_1 = \\frac{1}{3}[3,0]^T = [1,0]^T$ and $u_2 = \\frac{1}{2}[0,-2]^T = [0,-1]^T$. Hence, $A = \\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix} \\begin{pmatrix} 3 & 0 \\\\ 0 & 2 \\end{pmatrix} \\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}^T$.</p>"
  },
  "projection matrix": {
    def: "An operator mapping a vector space orthogonally onto a lower-dimensional subspace without scaling alterations. $$P = A(A^TA)^{-1}A^T$$",
    thm: "<h5>Idempotency and Eigenvalues</h5><p>For any valid projection matrix, $P^2 = P = P^T$, and its unique eigenvalues must satisfy $\\lambda \\in \\{0, 1\\}$.</p>",
    ctr: "<span class=\"counter-title\">Non-orthogonal Projections</span>Assuming $P = AA^T$ projects correctly onto a subspace when column vectors of $A$ are not mutually orthogonal.",
    ex: "<p><strong>Problem:</strong> Construct the precise $3 \\times 3$ projection matrix $P$ that maps any vector in $\\mathbb{R}^3$ onto the plane spanned by $v_1 = [1, 1, 0]^T$ and $v_2 = [0, 1, 1]^T$.</p><p><strong>Solution:</strong> Build matrix $A = \\begin{pmatrix} 1 & 0 \\\\ 1 & 1 \\\\ 0 & 1 \\end{pmatrix}$. Compute $A^TA = \\begin{pmatrix} 2 & 1 \\\\ 1 & 2 \\end{pmatrix}$. The inverse is $(A^TA)^{-1} = \\frac{1}{3}\\begin{pmatrix} 2 & -1 \\\\ -1 & 2 \\end{pmatrix}$. Finally, $P = A(A^TA)^{-1}A^T = \\frac{1}{3}\\begin{pmatrix} 2 & 1 & -1 \\\\ 1 & 2 & 1 \\\\ -1 & 1 & 2 \\end{pmatrix}$.</p>"
  },
  "limits": {
    def: "Formal definition of convergence: $\\lim_{x \\to a} f(x) = L$ means for every $\\epsilon > 0$, there exists $\\delta > 0$ such that $|x-a| < \\delta \\Rightarrow |f(x)-L| < \\epsilon$.",
    thm: "<h5>Limit Properties</h5><p>If $\\lim_{x \\to a} f(x) = L$ and $\\lim_{x \\to a} g(x) = M$, then: $\\lim_{x \\to a} [f(x) + g(x)] = L + M$, $\\lim_{x \\to a} [f(x)g(x)] = LM$, and $\\lim_{x \\to a} \\frac{f(x)}{g(x)} = \\frac{L}{M}$ (if $M \\ne 0$).</p>",
    ctr: "<span class=\"counter-title\">One-sided vs Two-sided Limits</span>A function can have left and right limits that differ; the two-sided limit exists only if both one-sided limits coincide.",
    ex: "<p><strong>Problem:</strong> Evaluate $\\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2}$.</p><p><strong>Solution:</strong> Direct substitution yields $\\frac{0}{0}$, an indeterminate form. Factor: $\\frac{x^2-4}{x-2} = \\frac{(x-2)(x+2)}{x-2} = x+2$ (for $x \\ne 2$). Thus: $\\lim_{x \\to 2} \\frac{x^2-4}{x-2} = \\lim_{x \\to 2} (x+2) = 4$.</p>"
  },
  "continuity": {
    def: "A function $f$ is continuous at $a$ if $\\lim_{x \\to a} f(x) = f(a)$, meaning no jumps or breaks at that point.",
    thm: "<h5>Intermediate Value Theorem (IVT)</h5><p>If $f$ is continuous on $[a,b]$ and $k$ is between $f(a)$ and $f(b)$, then $\\exists c \\in (a,b)$ such that $f(c) = k$.</p>",
    ctr: "<span class=\"counter-title\">Dirichlet Function Counterexample</span>$f(x) = 1$ if $x \\in \\mathbb{Q}$, else $0$. It is nowhere continuous because any interval contains both rational and irrational numbers.",
    ex: "<p><strong>Problem:</strong> An expansion coefficient $\\alpha(T)$ at temperature $T$ is given by $\\alpha(T) = \\frac{\\sqrt{T^2 + 16} - 4}{T^2}$ for $T \\ne 0$, and $\\alpha(T) = k$ for $T=0$. Find $k$ to satisfy continuity at $T=0$.</p><p><strong>Solution:</strong> Evaluate $\\lim_{T \\to 0} \\frac{\\sqrt{T^2 + 16} - 4}{T^2}$. Rationalize: $\\frac{T^2}{T^2(\\sqrt{T^2+16}+4)} = \\frac{1}{\\sqrt{T^2+16}+4} \\to \\frac{1}{8}$. Thus, $k = 1/8$.</p>"
  },
  "chain rule": {
    def: "If $y = f(u)$ and $u = g(x)$, then $\\frac{dy}{dx} = \\frac{dy}{du} \\cdot \\frac{du}{dx}$, enabling differentiation of composite functions.",
    thm: "<h5>General Chain Rule (Multivariable)</h5><p>If $f: \\mathbb{R}^m \\to \\mathbb{R}$ and $g: \\mathbb{R}^n \\to \\mathbb{R}^m$, then $D(f \\circ g) = (Df) \\circ (Dg)$ in matrix form: $J = DF \\cdot DG$.</p>",
    ctr: "<span class=\"counter-title\">Forgetting the Inner Derivative</span>Computing $\\frac{d}{dx}\\sin(x^2)$ as $\\cos(x^2)$ instead of $\\cos(x^2) \\cdot 2x$.",
    ex: "<p><strong>Problem:</strong> Find $\\frac{d}{dx} e^{-x^2}$.</p><p><strong>Solution:</strong> Let $u = -x^2$, so $y = e^u$. By the chain rule: $\\frac{dy}{dx} = \\frac{dy}{du} \\cdot \\frac{du}{dx} = e^u \\cdot (-2x) = -2x e^{-x^2}$.</p>"
  },
  "gradient descent": {
    def: "An iterative optimization algorithm that moves in the direction of the negative gradient to minimize a function: $x_{t+1} = x_t - \\alpha \\nabla f(x_t)$.",
    thm: "<h5>Convergence Rate</h5><p>For strongly convex functions with Lipschitz gradients, gradient descent converges at a geometric rate: $f(x_t) - f^* \\le (1 - 2\\alpha\\mu)^t (f(x_0) - f^*)$, where $\\mu$ is the strong convexity parameter.</p>",
    ctr: "<span class=\"counter-title\">Fixed Learning Rate Fallacy</span>Using a constant learning rate $\\alpha$ across non-uniformly scaled gradients can cause oscillation in steep directions and stagnation in shallow ones.",
    ex: "<p><strong>Problem:</strong> Minimize $f(x) = x^2 + 4y^2$ starting from $[x_0, y_0]^T = [2, 1]^T$ using gradient descent with learning rate $\\alpha = 0.1$. Perform two iterations.</p><p><strong>Solution:</strong> Gradient: $\\nabla f = [2x, 8y]^T$. Iteration 1: $\\nabla f(2, 1) = [4, 8]^T$. $[x_1, y_1]^T = [2, 1]^T - 0.1[4, 8]^T = [1.6, 0.2]^T$. Iteration 2: $\\nabla f(1.6, 0.2) = [3.2, 1.6]^T$. $[x_2, y_2]^T = [1.6, 0.2]^T - 0.1[3.2, 1.6]^T = [1.28, 0.04]^T$.</p>"
  },
  "convexity and convex functions": {
    def: "A function $f$ is convex if its graph lies below any line segment connecting two points on the graph: $f(\\lambda x + (1-\\lambda)y) \\le \\lambda f(x) + (1-\\lambda)f(y)$ for $\\lambda \\in [0,1]$.",
    thm: "<h5>Second-Order Characterization</h5><p>A twice-differentiable function $f$ is convex if and only if its Hessian matrix $H(x)$ is positive semidefinite for all $x$ in the domain.</p>",
    ctr: "<span class=\"counter-title\">Confusing Convex and Concave</span>Many optimization algorithms exploit convexity to guarantee global optima, but concave functions require sign reversal of the objective.",
    ex: "<p><strong>Problem:</strong> Determine whether $f(x, y) = x^2 + xy + y^2$ is convex.</p><p><strong>Solution:</strong> Compute the Hessian: $H = \\begin{pmatrix} 2 & 1 \\\\ 1 & 2 \\end{pmatrix}$. Eigenvalues: $\\det(H - \\lambda I) = (2-\\lambda)^2 - 1 = \\lambda^2 - 4\\lambda + 3 = (\\lambda-1)(\\lambda-3) = 0$, giving $\\lambda_1 = 1, \\lambda_2 = 3$. Both eigenvalues are positive, so the Hessian is positive definite and $f$ is strictly convex.</p>"
  },
  "regression and classification problems": {
    def: "Supervised learning tasks where regression predicts continuous outputs via $y = f(x) + \\epsilon$ and classification assigns discrete labels from $\\{1, \\ldots, K\\}$.",
    thm: "<h5>Bias-Variance Decomposition</h5><p>For squared-error loss: $E[(y - \\hat{y})^2] = \\text{Bias}^2(\\hat{y}) + \\text{Var}(\\hat{y}) + \\sigma^2$, where $\\sigma^2$ is irreducible error.</p>",
    ctr: "<span class=\"counter-title\">Ignoring Class Imbalance</span>In imbalanced classification, accuracy is a poor metric; use precision, recall, F1-score, or AUC-ROC instead.",
    ex: "<p><strong>Problem:</strong> In a binary classification task with 95% class 0 and 5% class 1, a naive classifier predicting all samples as class 0 achieves 95% accuracy. Discuss why this is problematic.</p><p><strong>Solution:</strong> While accuracy is high, the classifier completely fails on the minority class (recall for class 1 = 0). Better metrics: F1-score = 0 (harmonic mean of precision and recall), AUC-ROC measures discrimination capability. For imbalanced data, use weighted loss, SMOTE for oversampling, or cost-sensitive learning.</p>"
  },
  "logistic regression": {
    def: "Binary classification via modeling the log-odds as linear in features: $\\log\\frac{p}{1-p} = \\beta_0 + \\beta_1 x$, yielding $p = \\frac{1}{1 + e^{-(\\beta_0 + \\beta_1 x)}}$.",
    thm: "<h5>Maximum Likelihood Estimation</h5><p>The log-likelihood for $n$ samples is $L = \\sum_{i=1}^n [y_i \\log(\\hat{p}_i) + (1-y_i) \\log(1-\\hat{p}_i)]$, maximized via gradient ascent.</p>",
    ctr: "<span class=\"counter-title\">Linear Regression for Binary Outcomes</span>Using OLS regression on binary targets violates normality assumptions and can produce predicted probabilities outside [0,1].",
    ex: "<p><strong>Problem:</strong> Given binary logistic regression model $\\log\\frac{p}{1-p} = -2 + 0.5x$, find the predicted probability for $x = 4$.</p><p><strong>Solution:</strong> Odds $= e^{-2 + 0.5(4)} = e^0 = 1$, so $p = \\frac{1}{1+1} = 0.5$. Interpretation: when $x = 4$, the predicted probability of the positive class is 50%.</p>"
  },
  "support vector machine": {
    def: "A discriminative classifier maximizing the margin between classes by solving: $\\max \\frac{2}{\\|w\\|} \\text{ s.t. } y_i(w \\cdot x_i + b) \\ge 1$.",
    thm: "<h5>Kernel Trick</h5><p>By replacing $x_i \\cdot x_j$ with kernel function $K(x_i, x_j)$, SVMs can solve non-linear problems in high-dimensional feature spaces without explicit transformation.</p>",
    ctr: "<span class=\"counter-title\">Ignoring Feature Scaling</span>SVM is sensitive to feature magnitudes; features must be normalized (e.g., zero-mean, unit variance) for proper margin computation.",
    ex: "<p><strong>Problem:</strong> In linearly separable 2D data with points $(1, 1)$ and $(2, 2)$ in class 1, and $(1, 2)$ and $(2, 1)$ in class 0, find a separating hyperplane.</p><p><strong>Solution:</strong> A candidate boundary is $x_1 - x_2 = 0$ (the line $x_1 = x_2$). Class 1 points satisfy $x_1 - x_2 = 0$ and $x_1 - x_2 = 0$ (check: $1-1=0$ ✗, try $x_1 + x_2 = 3$). For $(1,1)$: $1+1=2 < 3$. For $(2,2)$: $2+2=4 > 3$. For $(1,2)$: $1+2=3$. Not strictly separating. The actual separator exists at $x_1 + x_2 = 2.5$ with margin of $\\frac{1}{\\sqrt{2}}$.</p>"
  },
  "k-means clustering": {
    def: "Unsupervised learning algorithm partitioning data into $k$ clusters by minimizing within-cluster variance: $\\min \\sum_k \\sum_{x \\in C_k} \\|x - \\mu_k\\|^2$.",
    thm: "<h5>Convergence Guarantee</h5><p>K-means is guaranteed to converge to a local minimum (not necessarily global) in finite iterations due to monotonically decreasing objective.</p>",
    ctr: "<span class=\"counter-title\">Sensitivity to Initialization</span>K-means result heavily depends on initial cluster centers; multiple random restarts recommended.",
    ex: "<p><strong>Problem:</strong> Cluster points $\\{[0,0], [0,2], [3,3], [3,5]\\}$ into $k=2$ clusters using K-means. Initialize centroids at $\\mu_1 = [0,0]$ and $\\mu_2 = [3,3]$.</p><p><strong>Solution:</strong> Iteration 1: Assign $[0,0]$ and $[0,2]$ to $C_1$, $[3,3]$ and $[3,5]$ to $C_2$. New centroids: $\\mu_1 = [0, 1]$, $\\mu_2 = [3, 4]$. Iteration 2: Recalculate assignments (distances from each point to updated centroids). Continue until convergence. Final clusters: $C_1 = \\{[0,0], [0,2]\\}$, $C_2 = \\{[3,3], [3,5]\\}$.</p>"
  },
  "principal component analysis (pca)": {
    def: "Dimensionality reduction via identifying principal components: directions of maximum variance in the data, found as eigenvectors of the covariance matrix sorted by eigenvalue.",
    thm: "<h5>Optimal Reconstruction Property</h5><p>The first $k$ principal components minimize the sum of squared reconstruction errors when projecting data onto a $k$-dimensional subspace.</p>",
    ctr: "<span class=\"counter-title\">Unscaled Feature Handling</span>Features with large scales dominate PCA; standardize all features to zero mean and unit variance beforehand.",
    ex: "<p><strong>Problem:</strong> For 2D data with covariance matrix $\\Sigma = \\begin{pmatrix} 4 & 1 \\\\ 1 & 2 \\end{pmatrix}$, find the first principal component.</p><p><strong>Solution:</strong> Eigenvalues: $\\det(\\Sigma - \\lambda I) = (4-\\lambda)(2-\\lambda) - 1 = \\lambda^2 - 6\\lambda + 7 = 0$, giving $\\lambda = 3 \\pm \\sqrt{2}$. Largest eigenvalue: $\\lambda_1 = 3 + \\sqrt{2} \\approx 4.414$. Eigenvector for $\\lambda_1$: $(\\Sigma - \\lambda_1 I)v = 0 \\Rightarrow v_1 \\propto [1, \\frac{1}{1-\\sqrt{2}}]^T \\approx [1, -0.414]^T$ (after normalization).</p>"
  }
};

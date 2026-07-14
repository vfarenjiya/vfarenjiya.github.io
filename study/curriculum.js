const CURRICULUM = {
  PS: {
    name: 'Probability & Statistics',
    color: '#e8a23d',
    lessons: [
      {
        id: 'ps-01',
        title: 'Sample Space & Basic Probabilities',
        content: `
          <p>Every probability question starts here. This is your foundation.</p>
          
          <div class="def-box">
            <h4>Sample Space & Events</h4>
            <p>A <strong>sample space</strong> $\\Omega$ is the set of all possible outcomes of an experiment.</p>
            <p>An <strong>event</strong> A is any subset of $\\Omega$.</p>
            <p><strong>Probability:</strong> For a finite sample space with equally likely outcomes: $$P(A) = \\frac{n(A)}{n(\\Omega)}$$</p>
          </div>

          <div class="example-box">
            <h4>Example: Rolling a Die</h4>
            <p>Sample space: $\\Omega = \\{1, 2, 3, 4, 5, 6\\}$</p>
            <p>Event A = "roll is even" = $\\{2, 4, 6\\}$</p>
            <p>$P(A) = 3/6 = 1/2$</p>
          </div>
        `
      },
      {
        id: 'ps-02',
        title: 'Conditional Probability & Bayes Theorem',
        content: `
          <div class="def-box">
            <h4>Conditional Probability</h4>
            <p>The probability of A given B has occurred is: $$P(A|B) = \\frac{P(A \\cap B)}{P(B)}$$</p>
            <p>This is the probability of A "restricted" to the sample space where B is true.</p>
          </div>

          <div class="theorem-box">
            <h5>Bayes' Theorem (Most Important!)</h5>
            <p>$$P(A_i|B) = \\frac{P(B|A_i)P(A_i)}{\\sum_j P(B|A_j)P(A_j)}$$</p>
            <p><strong>Intuition:</strong> Update your belief about $A_i$ after observing B.</p>
          </div>

          <div class="example-box">
            <h4>Classic: Disease Testing</h4>
            <p>Disease prevalence: 1% of population has it. Test accuracy: 95% (detects disease when present), 90% specificity (correctly says "no disease" when negative).</p>
            <p>If you test positive, what's the probability you actually have the disease?</p>
            <p><strong>Solution:</strong> Let D = have disease, T+ = test positive.</p>
            <p>$P(D|T+) = \\frac{P(T+|D)P(D)}{P(T+|D)P(D) + P(T+|\\neg D)P(\\neg D)}$</p>
            <p>$= \\frac{0.95 \\times 0.01}{0.95 \\times 0.01 + 0.1 \\times 0.99} \\approx 8.76\\%$</p>
          </div>
        `
      },
      {
        id: 'ps-03',
        title: 'Probability Distributions',
        content: `
          <p>Real-world data generation processes are modeled using standard distributions.</p>
          
          <div class="theorem-box">
            <h5>Discrete: Binomial & Poisson</h5>
            <p><strong>Binomial:</strong> Number of successes in $n$ independent trials. $$P(X=k) = \\binom{n}{k}p^k(1-p)^{n-k}$$</p>
            <p><strong>Poisson:</strong> Number of events occurring in a fixed interval of time. $$P(X=k) = \\frac{\\lambda^k e^{-\\lambda}}{k!}$$</p>
          </div>

          <div class="theorem-box">
            <h5>Continuous: Normal Distribution</h5>
            <p>Bell-shaped curve defined by mean $\\mu$ and variance $\\sigma^2$.</p>
            <p><strong>Standard Normal (Z):</strong> $\\mu=0, \\sigma=1$. Conversion: $$Z = \\frac{X - \\mu}{\\sigma}$$</p>
          </div>
        `
      }
    ],
    quiz: [
      {
        q: 'A coin is flipped twice. What is P(at least one head)?',
        opts: ['1/2', '3/4', '1/4', '1/3'],
        ans: 1,
        exp: 'Sample space: {HH, HT, TH, TT}. At least one H: {HH, HT, TH} = 3 outcomes. P = 3/4.'
      },
      {
        q: 'If P(A) = 0.4, P(B) = 0.5, P(A∩B) = 0.2, find P(A|B).',
        opts: ['0.4', '0.5', '0.2', '0.1'],
        ans: 0,
        exp: '$P(A|B) = P(A\\cap B) / P(B) = 0.2 / 0.5 = 0.4$'
      },
      {
        q: 'For a Normal Distribution, approximately what percentage of data falls within 2 standard deviations of the mean?',
        opts: ['68%', '90%', '95%', '99.7%'],
        ans: 2,
        exp: 'According to the Empirical Rule (68-95-99.7 rule), approximately 95% of the data falls within 2 standard deviations.'
      }
    ]
  },

  LA: {
    name: 'Linear Algebra',
    color: '#5aa9e6',
    lessons: [
      {
        id: 'la-01',
        title: 'Vectors & Vector Spaces',
        content: `
          <div class="def-box">
            <h4>Vector & Vector Space</h4>
            <p>A <strong>vector space</strong> V is a set closed under vector addition and scalar multiplication:</p>
            <p>• If $u, v \\in V$, then $u + v \\in V$</p>
            <p>• If $v \\in V$ and $c$ is scalar, then $c\\cdot v \\in V$</p>
          </div>

          <p><strong>Linear Independence:</strong> Vectors $v_1, v_2, ..., v_n$ are linearly independent if the only solution to $c_1v_1 + ... + c_nv_n = 0$ is $c_1 = ... = c_n = 0$.</p>
        `
      },
      {
        id: 'la-02',
        title: 'Eigenvalues & Eigenvectors',
        content: `
          <div class="def-box">
            <h4>Eigenvalues & Eigenvectors</h4>
            <p>For a square matrix A, a scalar $\\lambda$ is an <strong>eigenvalue</strong> and vector $v$ is an <strong>eigenvector</strong> if:</p>
            <p>$$Av = \\lambda v$$</p>
            <p><strong>How to find:</strong> Solve $\\det(A - \\lambda I) = 0$ for $\\lambda$.</p>
          </div>

          <div class="example-box">
            <h4>2×2 Example</h4>
            <p>$$A = \\begin{pmatrix} 3 & 1 \\\\ 0 & 2 \\end{pmatrix}$$</p>
            <p>Characteristic polynomial: $\\det(A - \\lambda I) = (3-\\lambda)(2-\\lambda) = 0$</p>
            <p>Eigenvalues: $\\lambda_1 = 3, \\lambda_2 = 2$</p>
          </div>
        `
      },
      {
        id: 'la-03',
        title: 'Matrix Decompositions (SVD)',
        content: `
          <div class="theorem-box">
            <h5>Singular Value Decomposition (SVD)</h5>
            <p>Any $m \\times n$ matrix A can be factored into: $$A = U \\Sigma V^T$$</p>
            <p>• U: Orthogonal matrix ($m \\times m$, left singular vectors)</p>
            <p>• $\\Sigma$: Diagonal matrix (singular values, $\\sigma_i \\ge 0$)</p>
            <p>• $V^T$: Orthogonal matrix ($n \\times n$, right singular vectors)</p>
          </div>
        `
      }
    ],
    quiz: [
      {
        q: 'Are vectors [1,2] and [2,4] linearly independent?',
        opts: ['Yes', 'No', 'Cannot determine', 'Depends on context'],
        ans: 1,
        exp: '$[2,4] = 2\\cdot[1,2]$, so they are linearly dependent. Only the trivial combination gives zero if one vector is 0.'
      },
      {
        q: 'If Av = 5v, then 5 is:',
        opts: ['Determinant of A', 'Eigenvalue of A', 'Trace of A', 'Rank of A'],
        ans: 1,
        exp: 'By definition, if $Av = \\lambda v$, then $\\lambda$ is an eigenvalue. Here $\\lambda = 5$.'
      },
      {
        q: 'What is the maximum possible rank of a 4 × 7 matrix?',
        opts: ['4', '7', '11', '28'],
        ans: 0,
        exp: 'The rank of an $m \\times n$ matrix is bounded by $\\min(m, n)$. Thus, $\\min(4, 7) = 4$.'
      }
    ]
  },

  CO: {
    name: 'Calculus & Optimization',
    color: '#c792ea',
    lessons: [
      {
        id: 'co-01',
        title: 'Limits & Continuity',
        content: `
          <div class="def-box">
            <h4>Limit Definition</h4>
            <p>$$\\lim_{x \\to a} f(x) = L$$</p>
            <p>means: for every $\\epsilon > 0$, there exists $\\delta > 0$ such that $|x - a| < \\delta \\implies |f(x) - L| < \\epsilon$.</p>
          </div>

          <div class="theorem-box">
            <h5>Continuity</h5>
            <p>f is continuous at $a$ if: $$\\lim_{x \\to a} f(x) = f(a)$$</p>
          </div>
        `
      },
      {
        id: 'co-02',
        title: 'Gradient Descent',
        content: `
          <div class="theorem-box">
            <h5>Gradient Descent</h5>
            <p>To minimize f(x), iterate: $$x_{t+1} = x_t - \\alpha \\nabla f(x_t)$$</p>
            <p>where $\\alpha$ is the learning rate and $\\nabla f$ is the gradient.</p>
          </div>

          <div class="example-box">
            <h4>1D Example</h4>
            <p>$f(x) = x^2 - 4x + 5$. Start $x_0 = 0$, learning rate $\\alpha = 0.1$.</p>
            <p>$\\nabla f = 2x - 4$. At $x_0 = 0$: $\\nabla f = -4$.</p>
            <p>$x_1 = 0 - 0.1\\cdot(-4) = 0.4$</p>
          </div>
        `
      },
      {
        id: 'co-03',
        title: 'Hessians',
        content: `
          <div class="def-box">
            <h4>The Hessian Matrix</h4>
            <p>The Hessian H is the matrix of second-order partial derivatives. It describes local curvature.</p>
            <p>• If H is <strong>Positive Definite</strong> at a critical point, it is a local minimum.</p>
            <p>• If H is <strong>Negative Definite</strong>, it is a local maximum.</p>
          </div>
        `
      }
    ],
    quiz: [
      {
        q: 'What is lim(x→0) (x²/x)?',
        opts: ['0', '1', 'undefined', '∞'],
        ans: 0,
        exp: 'For $x \\ne 0$, $x^2/x = x$. As $x\\to 0$, $x\\to 0$. The limit is 0 (the function is continuous there).'
      },
      {
        q: 'In gradient descent, if you increase learning rate α, what happens?',
        opts: ['Always converges faster', 'May diverge or oscillate', 'No change in convergence', 'Always converges slower'],
        ans: 1,
        exp: 'Too large $\\alpha$ causes overshooting. Too small $\\alpha$ converges slowly. There is an optimal range.'
      },
      {
        q: 'If the Hessian matrix evaluated at a critical point is positive definite, the point is a:',
        opts: ['Local Maximum', 'Local Minimum', 'Saddle Point', 'Cannot be determined'],
        ans: 1,
        exp: 'A positive definite Hessian implies the function curves upwards in all directions, confirming a local minimum.'
      }
    ]
  },

  PDSA: {
    name: 'Programming, DSA',
    color: '#35d07f',
    lessons: [
      {
        id: 'pdsa-01',
        title: 'Time & Space Complexity',
        content: `
          <div class="def-box">
            <h4>Big-O Notation</h4>
            <p>f(n) is O(g(n)) if there exist constants c, n₀ such that $f(n) \\le c\\cdot g(n)$ for all $n \\ge n_0$.</p>
          </div>
        `
      },
      {
        id: 'pdsa-02',
        title: 'Trees & Graphs',
        content: `
          <div class="def-box">
            <h4>Tree Definitions</h4>
            <p>A <strong>tree</strong> is a connected, acyclic graph with n nodes and n-1 edges.</p>
            <p><strong>Height:</strong> maximum distance from root to leaf.</p>
          </div>
        `
      },
      {
        id: 'pdsa-03',
        title: 'Dynamic Programming',
        content: `
          <div class="theorem-box">
            <h5>Core Concepts</h5>
            <p>Dynamic Programming (DP) simplifies complex problems by breaking them down into simpler sub-problems.</p>
            <p>Requires two properties:</p>
            <p>1. <strong>Optimal Substructure:</strong> Optimal solution to the problem contains optimal solutions to sub-problems.</p>
            <p>2. <strong>Overlapping Subproblems:</strong> Subproblems are repeated multiple times.</p>
          </div>
        `
      }
    ],
    quiz: [
      {
        q: 'Binary search on sorted array has complexity:',
        opts: ['O(n)', 'O(log n)', 'O(n log n)', 'O(n²)'],
        ans: 1,
        exp: 'Each iteration halves search space: $n \\to n/2 \\to n/4 \\to ... \\to 1$. That is $\\log_2 n$ steps.'
      },
      {
        q: 'How many edges in a tree with 7 nodes?',
        opts: ['6', '7', '8', 'Depends on shape'],
        ans: 0,
        exp: 'By definition, a tree with n nodes has exactly n-1 edges. So $7-1 = 6$.'
      },
      {
        q: 'The standard recursive Fibonacci function calculates fib(n) in O(2ⁿ) time. What is the time complexity when using Dynamic Programming?',
        opts: ['O(n)', 'O(n log n)', 'O(n²)', 'O(1)'],
        ans: 0,
        exp: 'By storing the results (memoization/tabulation), each Fibonacci number from 1 to n is computed exactly once, making it $\\mathcal{O}(n)$.'
      }
    ]
  },

  ML: {
    name: 'Machine Learning',
    color: '#ff6b46',
    lessons: [
      {
        id: 'ml-01',
        title: 'Supervised Learning',
        content: `
          <div class="theorem-box">
            <h5>Loss Functions</h5>
            <p><strong>Regression:</strong> Mean Squared Error = $$\\frac{1}{n}\\sum (y_i - \\hat{y}_i)^2$$</p>
            <p><strong>Classification:</strong> Cross-entropy = $$-\\sum y_i \\log(\\hat{y}_i)$$</p>
          </div>

          <p><strong>Bias-Variance tradeoff:</strong> MSE = Bias² + Variance + Irreducible Error</p>
        `
      },
      {
        id: 'ml-02',
        title: 'Logistic Regression & SVM',
        content: `
          <div class="def-box">
            <h4>Logistic Regression</h4>
            <p>Model probability of class 1: $$p = \\frac{1}{1 + e^{-(\\beta_0 + \\beta_1 x)}}$$</p>
            <p>Decision boundary at $p = 0.5$.</p>
          </div>

          <div class="def-box">
            <h4>Support Vector Machine (SVM)</h4>
            <p>Find hyperplane with maximum <strong>margin</strong> between classes.</p>
            <p>Kernel trick allows non-linear decision boundaries.</p>
          </div>
        `
      },
      {
        id: 'ml-03',
        title: 'Clustering',
        content: `
          <div class="theorem-box">
            <h5>K-Means Clustering</h5>
            <p>Goal: Partition data into K distinct, non-overlapping clusters by minimizing the Within-Cluster Sum of Squares (WCSS).</p>
          </div>
        `
      }
    ],
    quiz: [
      {
        q: 'In logistic regression, P(y=1|x) = 1/(1+e^(-z)). When z = 0, P(y=1) =',
        opts: ['0', '0.5', '1', 'undefined'],
        ans: 1,
        exp: '$P = 1/(1+e^0) = 1/(1+1) = 1/2 = 0.5$'
      },
      {
        q: 'SVM finds a hyperplane. Its key advantage is:',
        opts: ['Always fast', 'Maximizes margin (robustness)', 'Works only for 2D data', 'No overfitting possible'],
        ans: 1,
        exp: 'Large margin = more robust to noise. The margin is central to SVM generalization.'
      },
      {
        q: 'Which of the following describes the objective of the K-Means algorithm?',
        opts: ['Maximize distance between data points within a cluster', 'Find the hyperplane with the largest margin', 'Minimize the variance within each cluster (WCSS)', 'Estimate the probability of a data point belonging to a class'],
        ans: 2,
        exp: 'K-Means aims to minimize the Within-Cluster Sum of Squares (WCSS), effectively minimizing the variance inside each cluster.'
      }
    ]
  },

  AI: {
    name: 'Artificial Intelligence',
    color: '#f6c445',
    lessons: [
      {
        id: 'ai-01',
        title: 'Search Algorithms',
        content: `
          <div class="theorem-box">
            <h5>Informed Search</h5>
            <p><strong>A* Search:</strong> uses heuristic h(n) to guide exploration.</p>
            <p>$$f(n) = g(n) + h(n)$$</p>
            <p>where g(n) = cost so far, h(n) = estimated cost to goal.</p>
            <p><strong>Admissibility:</strong> $h(n) \\le \\text{actual cost}$ guarantees optimality.</p>
          </div>
        `
      },
      {
        id: 'ai-02',
        title: 'Logic',
        content: `
          <div class="def-box">
            <h4>First-Order Logic (FOL)</h4>
            <p>Extends propositional with objects and relations.</p>
            <p>$\\forall x, \\exists x$ quantifiers for "for all" and "there exists"</p>
          </div>
        `
      },
      {
        id: 'ai-03',
        title: 'Bayesian Networks',
        content: `
          <div class="theorem-box">
            <h5>The Markov Condition</h5>
            <p>In a Bayesian Network, a node is conditionally independent of its non-descendants, given its parents.</p>
            <p>Joint Probability Factorization: $$P(X_1, ..., X_n) = \\prod_{i=1}^n P(X_i | \\text{Parents}(X_i))$$</p>
          </div>
        `
      }
    ],
    quiz: [
      {
        q: 'In BFS, nodes are explored in order of:',
        opts: ['Cost', 'Distance from start', 'Heuristic value', 'Random order'],
        ans: 1,
        exp: 'BFS explores all nodes at distance d before d+1. Order is purely by distance.'
      },
      {
        q: 'A* is optimal if heuristic h(n) is:',
        opts: ['Always > 0', 'Admissible (h(n) ≤ actual cost)', 'Consistent', 'Equal to actual cost'],
        ans: 1,
        exp: 'Admissibility guarantees optimality of A*. Consistency (monotonicity) is stronger but also sufficient.'
      },
      {
        q: 'In a Bayesian Network, a node is conditionally independent of its non-descendants given its:',
        opts: ['Children', 'Markov Blanket', 'Parents', 'Ancestors'],
        ans: 2,
        exp: 'By the local Markov property in Bayesian Networks, a node is conditionally independent of all its non-descendants given its parents.'
      }
    ]
  }
};

const SUBJECTS_ORDER = ['PS', 'LA', 'CO', 'PDSA', 'ML', 'AI'];

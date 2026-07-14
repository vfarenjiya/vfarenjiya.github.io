# GATE DA Interactive Coaching Platform

A **free, offline-ready, self-contained learning hub** for preparing for the GATE Data Science & AI (DA) exam.

## What's Inside

✅ **6 Subjects Covered**
- Probability & Statistics (PS)
- Linear Algebra (LA)
- Calculus & Optimization (CO)
- Programming, Data Structures & Algorithms (PDSA)
- Machine Learning (ML)
- Artificial Intelligence (AI)

✅ **Interactive Learning Path**
- Structured lessons with mathematical formulas (rendered via KaTeX)
- Real-world examples and intuition, not just definitions
- Quiz after each subject to check understanding
- Progress tracking across all topics

✅ **Zero Dependencies**
- Single `index.html` page + `curriculum.js` (content) + `app.js` (logic)
- All styling inline, no external CSS files needed
- KaTeX for math rendering (loaded from CDN, works offline via cache)
- Data stored locally in `localStorage` — no server, no account

## How to Use

### Local Setup
1. Drop the `study/` folder into your GATE DA tracker directory (same level as `index.html` and `styles.css`)
2. In your tracker's main `app.js`, the "Study" button already points to `study/` (we fixed this)
3. Click **Study** from the tracker, or open `study/index.html` directly

### Mobile-Friendly
- Responsive design works on phone, tablet, desktop
- All content is touch-friendly
- Offline-capable (works with service worker if you add it)

### How to Navigate
1. **Dashboard:** See all 6 subjects, your overall progress bar
2. **Select a subject:** Pick one to start learning
3. **Lessons:** Read through theory, examples, formulas
   - Previous / Next buttons to move through lessons
   - Progress bar shows where you are
4. **Quiz:** After all lessons, take a short quiz on that subject
   - Immediate feedback on correct/wrong answers
   - See the explanation after each answer
5. **Success:** Complete screen shows you finished
   - Data is saved automatically in `localStorage`
   - Your progress persists across sessions

## What Each File Does

- **`index.html`** — The page structure, UI panels, styling
- **`curriculum.js`** — All lesson content + quiz questions (6 subjects, ~12 lessons, ~12 quizzes total)
- **`app.js`** — The logic: navigation, progress tracking, quiz scoring, state management

## Content Quality

Each subject includes:
- **2 core lessons** covering the most-tested GATE DA topics
- **Real examples** with step-by-step solutions
- **Theorem boxes** for key mathematical definitions
- **2-3 quiz questions** per subject with detailed explanations

Example topics:
- PS: Sample spaces, Bayes' theorem
- LA: Vectors, eigenvalues
- CO: Limits, gradient descent
- PDSA: Complexity, trees & graphs
- ML: Supervised learning, SVM, logistic regression
- AI: BFS/A* search, propositional logic

## Customization

### Add More Lessons
Edit `curriculum.js`:
```javascript
const CURRICULUM = {
  PS: {
    lessons: [
      { id: 'ps-01', title: 'Your lesson', content: '<p>Your HTML</p>' },
      // ...add more
    ]
  }
}

// App Controller for GATE DA Interactive Coaching

let state = {
  currentSubject: null,
  currentLessonIdx: 0,
  currentQuizIdx: 0,
  mode: 'dashboard', // dashboard, lesson, quiz, success
  progress: {}, // subject -> { lessonsCompleted, quizzesCompleted }
  answers: {} // quiz answers
};

function initProgress() {
  SUBJECTS_ORDER.forEach(s => {
    state.progress[s] = { lessonsCompleted: 0, quizzesCompleted: 0 };
  });
}

function loadState() {
  try {
    const saved = localStorage.getItem('gate-da-coaching');
    if (saved) {
      state = JSON.parse(saved);
    } else {
      initProgress();
    }
  } catch (e) {
    initProgress();
  }
}

function saveState() {
  try {
    localStorage.setItem('gate-da-coaching', JSON.stringify(state));
  } catch (e) {}
}

function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = '';

  const h3 = document.createElement('h3');
  h3.textContent = 'Subjects';
  sidebar.appendChild(h3);

  SUBJECTS_ORDER.forEach(code => {
    const subject = CURRICULUM[code];
    const item = document.createElement('div');
    item.className = 'sidebar-item' + (state.currentSubject === code ? ' active' : '');
    
    const prog = state.progress[code];
    const total = subject.lessons.length + 1; // lessons + quiz
    const done = prog.lessonsCompleted + (prog.quizzesCompleted > 0 ? 1 : 0);
    
    item.textContent = `${code} (${done}/${total})`;
    item.onclick = () => selectSubject(code);
    sidebar.appendChild(item);
  });
}

function selectSubject(code) {
  state.currentSubject = code;
  state.currentLessonIdx = 0;
  state.mode = 'lesson';
  state.answers = {};
  saveState();
  render();
}

function showDashboard() {
  state.currentSubject = null;
  state.mode = 'dashboard';
  render();
}

function render() {
  renderSidebar();

  const dash = document.getElementById('dashboard');
  const lessonPanel = document.getElementById('lessonPanel');
  const quizPanel = document.getElementById('quizPanel');
  const successPanel = document.getElementById('successPanel');

  // Hide all
  [dash, lessonPanel, quizPanel, successPanel].forEach(p => p.classList.add('hidden'));

  if (state.mode === 'dashboard') {
    dash.classList.remove('hidden');
    renderDashboard();
  } else if (state.mode === 'lesson') {
    lessonPanel.classList.remove('hidden');
    renderLesson();
  } else if (state.mode === 'quiz') {
    quizPanel.classList.remove('hidden');
    renderQuiz();
  } else if (state.mode === 'success') {
    successPanel.classList.remove('hidden');
    renderSuccess();
  }
}

function renderDashboard() {
  const statsDiv = document.getElementById('stats');
  let totalLessons = 0, totalQuizzes = 0, done = 0;

  SUBJECTS_ORDER.forEach(code => {
    const subject = CURRICULUM[code];
    totalLessons += subject.lessons.length;
    totalQuizzes += 1; // one quiz per subject
    const prog = state.progress[code];
    done += prog.lessonsCompleted + prog.quizzesCompleted;
  });

  const totalAll = totalLessons + totalQuizzes;
  const pct = totalAll > 0 ? Math.round((done / totalAll) * 100) : 0;

  statsDiv.innerHTML = `
    <div class="stat-card">
      <div class="num">${pct}%</div>
      <div class="label">Overall</div>
    </div>
    <div class="stat-card">
      <div class="num">${done}</div>
      <div class="label">Completed</div>
    </div>
    <div class="stat-card">
      <div class="num">${totalLessons}</div>
      <div class="label">Lessons</div>
    </div>
    <div class="stat-card">
      <div class="num">${SUBJECTS_ORDER.length}</div>
      <div class="label">Subjects</div>
    </div>
  `;

  const grid = document.getElementById('subjectGrid');
  grid.innerHTML = '';

  SUBJECTS_ORDER.forEach(code => {
    const subject = CURRICULUM[code];
    const prog = state.progress[code];
    const card = document.createElement('div');
    card.className = 'subject-card';
    card.style.borderLeftColor = subject.color;
    
    card.innerHTML = `
      <div class="code">${code}</div>
      <h3>${subject.name}</h3>
      <div class="topics">
        <strong>${subject.lessons.length}</strong> lessons<br>
        <strong>1</strong> quiz<br>
        <strong>${prog.lessonsCompleted}</strong> done
      </div>
    `;
    card.onclick = () => selectSubject(code);
    grid.appendChild(card);
  });
}

function renderLesson() {
  const subject = CURRICULUM[state.currentSubject];
  const lessons = subject.lessons;

  if (state.currentLessonIdx >= lessons.length) {
    // Move to quiz
    state.mode = 'quiz';
    state.currentQuizIdx = 0;
    render();
    return;
  }

  const lesson = lessons[state.currentLessonIdx];
  document.getElementById('lessonTitle').textContent = lesson.title;
  document.getElementById('lessonSubtitle').textContent = `Lesson ${state.currentLessonIdx + 1} of ${lessons.length}`;

  const pct = ((state.currentLessonIdx + 1) / lessons.length) * 100;
  document.getElementById('lessonProgress').style.width = pct + '%';

  // Render content with KaTeX
  const content = document.getElementById('lessonContent');
  content.innerHTML = lesson.content;
  renderMath();

  document.getElementById('prevBtn').disabled = state.currentLessonIdx === 0;
  document.getElementById('nextBtn').textContent = state.currentLessonIdx === lessons.length - 1 ? 'Next: Quiz →' : 'Next Lesson →';
}

function previousLesson() {
  if (state.currentLessonIdx > 0) {
    state.currentLessonIdx--;
    render();
  }
}

function nextLesson() {
  const subject = CURRICULUM[state.currentSubject];
  if (state.currentLessonIdx < subject.lessons.length - 1) {
    state.currentLessonIdx++;
    render();
  } else {
    // Mark lessons as done, move to quiz
    state.progress[state.currentSubject].lessonsCompleted = subject.lessons.length;
    state.mode = 'quiz';
    state.currentQuizIdx = 0;
    saveState();
    render();
  }
}

function renderQuiz() {
  const subject = CURRICULUM[state.currentSubject];
  const quiz = subject.quiz;

  if (state.currentQuizIdx >= quiz.length) {
    // Quiz complete
    state.progress[state.currentSubject].quizzesCompleted = 1;
    state.mode = 'success';
    saveState();
    render();
    return;
  }

  const q = quiz[state.currentQuizIdx];
  document.getElementById('quizTitle').textContent = `${subject.name} Quiz`;
  
  const pct = ((state.currentQuizIdx + 1) / quiz.length) * 100;
  document.getElementById('quizProgress').style.width = pct + '%';

  const container = document.getElementById('quizContainer');
  container.innerHTML = `
    <div class="quiz-q">
      <div class="q-text">${q.q}</div>
      <div class="quiz-opts" id="quizOpts"></div>
    </div>
  `;

  const optsDiv = document.getElementById('quizOpts');
  q.opts.forEach((opt, i) => {
    const label = document.createElement('label');
    label.className = 'quiz-opt';
    label.innerHTML = `
      <input type="radio" name="answer" value="${i}">
      <span>${opt}</span>
    `;
    optsDiv.appendChild(label);
  });

  document.getElementById('submitBtn').disabled = false;
  document.getElementById('submitBtn').textContent = 'Submit Answer';
}

function submitQuiz() {
  const quiz = CURRICULUM[state.currentSubject].quiz;
  const q = quiz[state.currentQuizIdx];

  const selected = document.querySelector('input[name="answer"]:checked');
  if (!selected) {
    alert('Please select an answer');
    return;
  }

  const ansIdx = parseInt(selected.value);
  const isCorrect = ansIdx === q.ans;

  // Show feedback
  const feedback = document.createElement('div');
  feedback.className = 'quiz-feedback ' + (isCorrect ? 'correct' : 'wrong');
  feedback.innerHTML = `
    <strong>${isCorrect ? '✓ Correct!' : '✗ Incorrect'}</strong><br>
    ${q.exp}
  `;
  document.getElementById('quizContainer').appendChild(feedback);

  // Disable submit, enable skip
  document.getElementById('submitBtn').disabled = true;
  document.getElementById('skipBtn').textContent = state.currentQuizIdx === quiz.length - 1 ? 'Finish →' : 'Next Question →';
  document.getElementById('skipBtn').onclick = () => nextQuestion();
}

function skipQuestion() {
  nextQuestion();
}

function nextQuestion() {
  state.currentQuizIdx++;
  render();
}

function renderSuccess() {
  const subject = CURRICULUM[state.currentSubject];
  document.getElementById('successTitle').textContent = `${subject.name} Complete!`;
  document.getElementById('successText').textContent = `You've learned all the key concepts and completed the quiz. Great job! Pick another subject or review.`;
}

function renderMath() {
  document.querySelectorAll('.katex-display, .lesson-text, .quiz-container').forEach(el => {
    try {
      el.querySelectorAll('script[type="math/tex"]').forEach(script => {
        const math = script.textContent;
        const span = document.createElement('span');
        katex.render(math, span, { displayMode: true });
        script.replaceWith(span);
      });
    } catch (e) {}
  });

  // Handle inline $..$ and display $$..$$
  try {
    const elements = document.querySelectorAll('.lesson-text, .example-box, .theorem-box, .quiz-container');
    elements.forEach(el => {
      let html = el.innerHTML;
      html = html.replace(/\$\$(.*?)\$\$/gs, (m, math) => {
        try {
          const div = document.createElement('div');
          katex.render(math, div, { displayMode: true });
          return div.innerHTML;
        } catch (e) { return m; }
      });
      html = html.replace(/\$(.*?)\$/g, (m, math) => {
        if (math.includes('\\')) {
          try {
            const span = document.createElement('span');
            katex.render(math, span, { displayMode: false });
            return span.innerHTML;
          } catch (e) { return m; }
        }
        return m;
      });
      el.innerHTML = html;
    });
  } catch (e) {}
}

// Initialize
loadState();
render();

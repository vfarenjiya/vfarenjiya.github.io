// Inherit Theme from Main Tracker Application
function syncTheme() {
  try {
    const mainTrackerState = localStorage.getItem('gate-da-stable-v1');
    if (mainTrackerState) {
      const parsed = JSON.parse(mainTrackerState);
      document.body.classList.toggle('light-theme', !!parsed.isLight);
      document.documentElement.style.setProperty('--font-scale', parsed.fontScale || 1);
    }
  } catch (e) {}
}

let state = {
  currentSubject: null,
  currentLessonIdx: 0,
  currentQuizIdx: 0,
  mode: 'dashboard', 
  progress: {}, 
  answers: {} 
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
  sidebar.innerHTML = '<h3>Modules</h3>';

  SUBJECTS_ORDER.forEach(code => {
    const subject = CURRICULUM[code];
    const item = document.createElement('div');
    item.className = 'hub-sidebar-item' + (state.currentSubject === code ? ' active' : '');
    
    const prog = state.progress[code];
    const total = subject.lessons.length + subject.quiz.length; 
    const done = prog.lessonsCompleted + prog.quizzesCompleted;
    
    item.innerHTML = `<span>${code}</span> <span class="prog">${done}/${total}</span>`;
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

  const dash = document.getElementById('dashboardPanel');
  const lessonPanel = document.getElementById('lessonPanel');
  const quizPanel = document.getElementById('quizPanel');
  const successPanel = document.getElementById('successPanel');

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
    totalQuizzes += subject.quiz.length; 
    const prog = state.progress[code];
    done += prog.lessonsCompleted + prog.quizzesCompleted;
  });

  const totalAll = totalLessons + totalQuizzes;
  const pct = totalAll > 0 ? Math.round((done / totalAll) * 100) : 0;

  statsDiv.innerHTML = `
    <div class="stat-box"><div class="num">${pct}%</div><div class="lbl">Mastery</div></div>
    <div class="stat-box"><div class="num" style="color:var(--amber)">${done}</div><div class="lbl">Completed</div></div>
    <div class="stat-box"><div class="num" style="color:var(--blue)">${SUBJECTS_ORDER.length}</div><div class="lbl">Subjects</div></div>
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
      <h4>${subject.name}</h4>
      <div class="meta">
        <strong>${subject.lessons.length}</strong> modules<br>
        <strong>${subject.quiz.length}</strong> assessments<br>
        <strong>${prog.lessonsCompleted + prog.quizzesCompleted}</strong> finished
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
    state.mode = 'quiz';
    state.currentQuizIdx = 0;
    render();
    return;
  }

  const lesson = lessons[state.currentLessonIdx];
  document.getElementById('lessonTitle').textContent = lesson.title;
  document.getElementById('lessonTag').textContent = subject.name;
  document.getElementById('lessonTag').style.color = subject.color;
  document.getElementById('lessonTag').style.background = subject.color + '22'; 
  document.getElementById('lessonSubtitle').textContent = `Module ${state.currentLessonIdx + 1} of ${lessons.length}`;

  const pct = ((state.currentLessonIdx + 1) / lessons.length) * 100;
  document.getElementById('lessonProgress').style.width = pct + '%';

  const content = document.getElementById('lessonContent');
  content.innerHTML = lesson.content;
  renderMath();

  document.getElementById('prevBtn').disabled = state.currentLessonIdx === 0;
  document.getElementById('nextBtn').textContent = state.currentLessonIdx === lessons.length - 1 ? 'Start Assessment →' : 'Next Module →';
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
    state.mode = 'success';
    saveState();
    render();
    return;
  }

  const q = quiz[state.currentQuizIdx];
  document.getElementById('quizSubtitle').textContent = `Question ${state.currentQuizIdx + 1} of ${quiz.length}`;
  
  const pct = ((state.currentQuizIdx) / quiz.length) * 100;
  document.getElementById('quizProgress').style.width = pct + '%';

  document.getElementById('qText').textContent = q.q;

  const optsDiv = document.getElementById('quizOpts');
  optsDiv.innerHTML = '';
  q.opts.forEach((opt, i) => {
    const label = document.createElement('label');
    label.className = 'quiz-option';
    label.id = `opt-${i}`;
    label.innerHTML = `
      <input type="radio" name="answer" value="${i}">
      <span>${opt}</span>
    `;
    optsDiv.appendChild(label);
  });

  const feedbackBox = document.getElementById('quizFeedback');
  feedbackBox.className = 'quiz-feedback';
  feedbackBox.innerHTML = '';

  document.getElementById('submitBtn').disabled = false;
  document.getElementById('submitBtn').textContent = 'Submit Answer';
  document.getElementById('submitBtn').style.display = 'block';
  document.getElementById('skipBtn').textContent = 'Skip';
  
  renderMath();
}

function submitQuiz() {
  const subject = CURRICULUM[state.currentSubject];
  const quiz = subject.quiz;
  const q = quiz[state.currentQuizIdx];

  const selected = document.querySelector('input[name="answer"]:checked');
  if (!selected) {
    alert('Please select an answer');
    return;
  }

  const ansIdx = parseInt(selected.value);
  const isCorrect = ansIdx === q.ans;

  document.getElementById(`opt-${ansIdx}`).classList.add(isCorrect ? 'correct' : 'wrong');
  if (!isCorrect) {
    document.getElementById(`opt-${q.ans}`).classList.add('correct');
  }

  const feedback = document.getElementById('quizFeedback');
  feedback.className = 'quiz-feedback show ' + (isCorrect ? 'correct' : 'wrong');
  feedback.innerHTML = `
    <strong style="color: ${isCorrect ? 'var(--green)' : 'var(--flame)'}">${isCorrect ? '✓ Correct!' : '✗ Incorrect'}</strong><br><br>
    ${q.exp}
  `;

  if (isCorrect && state.progress[state.currentSubject].quizzesCompleted < quiz.length) {
    state.progress[state.currentSubject].quizzesCompleted++;
    saveState();
  }

  document.getElementById('submitBtn').style.display = 'none';
  document.getElementById('skipBtn').textContent = state.currentQuizIdx === quiz.length - 1 ? 'Finish Assessment →' : 'Next Question →';
  document.getElementById('skipBtn').onclick = () => nextQuestion();
  
  renderMath();
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
}

function renderMath() {
  document.querySelectorAll('.katex-display, .hub-panel').forEach(el => {
    try {
      el.querySelectorAll('script[type="math/tex"]').forEach(script => {
        const math = script.textContent;
        const span = document.createElement('span');
        katex.render(math, span, { displayMode: true });
        script.replaceWith(span);
      });
    } catch (e) {}
  });

  try {
    const elements = document.querySelectorAll('#lessonContent, .example-box, .theorem-box, .def-box, .quiz-feedback, #qText, .quiz-option');
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

syncTheme();
loadState();
render();

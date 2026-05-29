const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

let state = null;
let selectedLanguageId = localStorage.getItem('ditz:selectedLanguageId') || '';
let selectedLessonId = localStorage.getItem('ditz:selectedLessonId') || '';
let currentQuiz = null;

const progressKey = langId => `ditz:progress:${langId}`;
const completeKey = lessonId => `ditz:complete:${lessonId}`;

function escapeHTML(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function toast(message) {
  const box = $('#toast');
  box.textContent = message;
  box.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => box.classList.remove('show'), 2600);
}

function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso || '';
  }
}

function getProgress(langId) {
  const lessons = state.lessons.filter(l => l.languageId === langId);
  if (!lessons.length) return 0;
  const done = lessons.filter(l => localStorage.getItem(completeKey(l.id)) === '1').length;
  return Math.round((done / lessons.length) * 100);
}

function applySettings() {
  const s = state.settings;
  document.title = s.brandName || 'DiTz LINGUA';
  document.documentElement.style.setProperty('--accent', s.accent || '#7c3aed');
  $('#brandName').textContent = s.brandName || 'DiTz LINGUA';
  $('#heroTitle').textContent = s.heroTitle || '';
  $('#heroSubtitle').textContent = s.heroSubtitle || '';
  $('#announcement').textContent = s.announcement || '';
  $('#primaryCTA').textContent = s.primaryCTA || 'Mulai Belajar';
  $('#secondaryCTA').textContent = s.secondaryCTA || 'Lihat Bahasa';
  $('#footerText').textContent = s.footerText || '';
  $('#supportLine').textContent = `Support: ${s.supportEmail || '-'} · WhatsApp: ${s.whatsapp || '-'}`;
  $('#statLanguages').textContent = state.languages.length;
  $('#statLessons').textContent = state.lessons.length;
  $('#statVocab').textContent = state.vocabulary.length;
  $('#statQuiz').textContent = state.quizzes.length;
}

function languageMatches(lang, query, level) {
  const q = query.toLowerCase().trim();
  const hay = `${lang.name} ${lang.nativeName} ${lang.country} ${lang.description}`.toLowerCase();
  const okQuery = !q || hay.includes(q);
  const okLevel = level === 'all' || lang.level === level;
  return okQuery && okLevel;
}

function renderLanguages() {
  const grid = $('#languageGrid');
  const query = $('#searchInput').value;
  const level = $('#levelFilter').value;
  const languages = state.languages.filter(lang => languageMatches(lang, query, level));
  if (!languages.length) {
    grid.innerHTML = '<div class="card empty">Bahasa belum ditemukan. Admin bisa menambah bahasa baru di admin panel.</div>';
    return;
  }
  grid.innerHTML = languages.map(lang => {
    const progress = getProgress(lang.id);
    return `
      <button class="card lang-card" data-lang-id="${escapeHTML(lang.id)}" style="--card-color:${escapeHTML(lang.color || state.settings.accent)}">
        <div class="lang-top">
          <span class="flag">${escapeHTML(lang.flag || '🌍')}</span>
          <span class="pill">${escapeHTML(lang.level || 'Pemula')} · ${progress}%</span>
        </div>
        <h3>${escapeHTML(lang.name)}</h3>
        <div class="native">${escapeHTML(lang.nativeName || lang.country || '')}</div>
        <p>${escapeHTML(lang.description || '')}</p>
        <div class="progressbar"><i style="--progress:${progress}%"></i></div>
      </button>`;
  }).join('');
  $$('.lang-card').forEach(card => {
    card.addEventListener('click', () => selectLanguage(card.dataset.langId));
  });
}

function selectLanguage(langId) {
  selectedLanguageId = langId;
  localStorage.setItem('ditz:selectedLanguageId', langId);
  const lessons = state.lessons.filter(l => l.languageId === langId).sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  selectedLessonId = lessons[0]?.id || '';
  if (selectedLessonId) localStorage.setItem('ditz:selectedLessonId', selectedLessonId);
  renderLearning();
  renderComments();
  document.getElementById('learn').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function selectLesson(lessonId) {
  selectedLessonId = lessonId;
  localStorage.setItem('ditz:selectedLessonId', lessonId);
  renderLearning();
}

function getSelectedLanguage() {
  return state.languages.find(l => l.id === selectedLanguageId) || state.languages[0];
}

function getSelectedLesson() {
  if (!selectedLessonId) return null;
  return state.lessons.find(l => l.id === selectedLessonId) || null;
}

function renderLearning() {
  const lang = getSelectedLanguage();
  if (!lang) return;
  selectedLanguageId = lang.id;
  const lessons = state.lessons.filter(l => l.languageId === lang.id).sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  if (!selectedLessonId || !lessons.some(l => l.id === selectedLessonId)) selectedLessonId = lessons[0]?.id || '';

  $('#selectedLanguageTitle').textContent = `${lang.flag || '🌍'} ${lang.name}`;
  $('#selectedLanguageInfo').textContent = `${lang.country || ''} · ${lang.level || ''}`;
  $('#languageProgress').style.setProperty('--progress', `${getProgress(lang.id)}%`);
  $('#learnLead').textContent = lang.description || 'Materi dinamis dari admin panel.';

  const lessonList = $('#lessonList');
  if (!lessons.length) {
    lessonList.innerHTML = '<div class="empty">Belum ada materi untuk bahasa ini.</div>';
  } else {
    lessonList.innerHTML = lessons.map(lesson => `
      <button class="lesson-item ${lesson.id === selectedLessonId ? 'active' : ''}" data-lesson-id="${escapeHTML(lesson.id)}">
        <strong>${escapeHTML(lesson.title)}</strong>
        <span>${escapeHTML(lesson.level || 'Pemula')} ${localStorage.getItem(completeKey(lesson.id)) === '1' ? '· ✅ selesai' : ''}</span>
      </button>
    `).join('');
    $$('.lesson-item').forEach(btn => btn.addEventListener('click', () => selectLesson(btn.dataset.lessonId)));
  }

  const lesson = getSelectedLesson();
  const main = $('#lessonMain');
  if (!lesson) {
    main.innerHTML = '<div class="empty">Materi belum tersedia. Admin bisa tambah materi, kosakata, dan quiz.</div>';
    return;
  }

  const vocab = state.vocabulary.filter(v => v.languageId === lang.id && (!v.lessonId || v.lessonId === lesson.id));
  const quizPool = state.quizzes.filter(q => q.languageId === lang.id);
  currentQuiz = quizPool.length ? quizPool[Math.floor(Math.random() * quizPool.length)] : null;

  main.innerHTML = `
    <div class="lesson-content">
      <span class="pill">${escapeHTML(lesson.level || 'Pemula')}</span>
      <h2 style="margin:14px 0 8px">${escapeHTML(lesson.title)}</h2>
      <p class="lead">${escapeHTML(lesson.content || '')}</p>
      ${lesson.example ? `<div class="practice-box"><strong>Contoh:</strong><p>${escapeHTML(lesson.example)}</p><button class="audio-btn" data-speak="${escapeHTML(lesson.example)}" title="Dengarkan">🔊</button></div>` : ''}
      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:16px">
        <button class="btn primary" id="completeLesson">Tandai Selesai</button>
        <button class="btn" id="shuffleQuiz">Quiz Acak</button>
      </div>
    </div>
    <div style="margin-top:24px">
      <h3>Kosakata</h3>
      <div class="grid vocab-grid" id="vocabGrid">
        ${vocab.length ? vocab.map(v => `
          <div class="card vocab-card">
            <div style="display:flex;justify-content:space-between;gap:10px;align-items:start">
              <div>
                <h4>${escapeHTML(v.word)}</h4>
                <p><strong>Arti:</strong> ${escapeHTML(v.meaning)}</p>
                ${v.pronunciation ? `<p><strong>Baca:</strong> ${escapeHTML(v.pronunciation)}</p>` : ''}
              </div>
              <button class="audio-btn" data-speak="${escapeHTML(v.word)}" title="Dengarkan">🔊</button>
            </div>
            ${v.example ? `<p><strong>Contoh:</strong> ${escapeHTML(v.example)}</p>` : ''}
          </div>
        `).join('') : '<div class="empty">Kosakata belum ada untuk materi ini.</div>'}
      </div>
    </div>
    <div class="card quiz-card" id="quizBox"></div>
    <div class="practice-box">
      <h3>AI Practice Offline</h3>
      <p class="lead">Simulasi tutor ringan tanpa internet. Sistem mengambil kosakata dari bahasa yang dipilih dan memberi latihan random.</p>
      <div class="chat-log" id="chatLog"></div>
      <form class="chat-form" id="chatForm">
        <input class="input" id="chatInput" placeholder="Balas latihan di sini..." autocomplete="off" />
        <button class="btn primary" type="submit">Kirim</button>
      </form>
    </div>
  `;

  $$('.audio-btn', main).forEach(btn => btn.addEventListener('click', () => speak(btn.dataset.speak, lang)));
  $('#completeLesson').addEventListener('click', () => {
    localStorage.setItem(completeKey(lesson.id), '1');
    toast('Progress tersimpan. Materi ditandai selesai.');
    renderLanguages();
    renderLearning();
  });
  $('#shuffleQuiz').addEventListener('click', () => {
    currentQuiz = quizPool.length ? quizPool[Math.floor(Math.random() * quizPool.length)] : null;
    renderQuiz();
  });
  renderQuiz();
  setupPractice(lang, vocab);
}

function speak(text, lang) {
  if (!('speechSynthesis' in window)) {
    toast('Browser belum mendukung text-to-speech.');
    return;
  }
  const codeMap = {
    english: 'en-US', japanese: 'ja-JP', korean: 'ko-KR', mandarin: 'zh-CN', chinese: 'zh-CN', arabic: 'ar-SA', spanish: 'es-ES', german: 'de-DE', french: 'fr-FR', indonesian: 'id-ID', indonesia: 'id-ID', russian: 'ru-RU', italian: 'it-IT', turkish: 'tr-TR', thai: 'th-TH'
  };
  const key = String(lang.name || '').toLowerCase();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = codeMap[key] || 'en-US';
  utterance.rate = 0.88;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function shuffle(items) {
  return [...items].map(value => ({ value, sort: Math.random() })).sort((a, b) => a.sort - b.sort).map(item => item.value);
}

function renderQuiz() {
  const box = $('#quizBox');
  if (!box) return;
  if (!currentQuiz) {
    box.innerHTML = '<h3>Quiz</h3><div class="empty">Quiz belum ada. Admin bisa tambah pertanyaan training dari admin panel.</div>';
    return;
  }
  const options = shuffle((currentQuiz.options || []).map((text, originalIndex) => ({ text, originalIndex })));
  box.innerHTML = `
    <span class="pill">${escapeHTML(currentQuiz.difficulty || 'Easy')}</span>
    <h3>${escapeHTML(currentQuiz.question)}</h3>
    <div class="options">
      ${options.map(opt => `<button class="option" data-quiz-id="${escapeHTML(currentQuiz.id)}" data-answer-index="${opt.originalIndex}">${escapeHTML(opt.text)}</button>`).join('')}
    </div>
    <div class="feedback" id="quizFeedback"></div>
  `;
  $$('.option', box).forEach(btn => btn.addEventListener('click', async () => {
    const response = await fetch('/api/check-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId: btn.dataset.quizId, answerIndex: Number(btn.dataset.answerIndex) })
    });
    const result = await response.json();
    $$('.option', box).forEach(opt => {
      opt.disabled = true;
      if (Number(opt.dataset.answerIndex) === Number(result.answerIndex)) opt.classList.add('correct');
    });
    if (result.correct) {
      btn.classList.add('correct');
      $('#quizFeedback').textContent = `Benar. ${result.explanation || ''}`;
      toast('Jawaban benar!');
    } else {
      btn.classList.add('wrong');
      $('#quizFeedback').textContent = `Belum tepat. ${result.explanation || ''}`;
    }
  }));
}

function setupPractice(lang, vocab) {
  const log = $('#chatLog');
  const form = $('#chatForm');
  const input = $('#chatInput');
  let challenge = null;

  function addBubble(type, text) {
    const div = document.createElement('div');
    div.className = `bubble ${type}`;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }
  function ask() {
    if (!vocab.length) {
      addBubble('bot', 'Belum ada kosakata untuk latihan. Admin bisa menambahkan kosakata dahulu.');
      return;
    }
    challenge = vocab[Math.floor(Math.random() * vocab.length)];
    addBubble('bot', `Latihan ${lang.name}: apa arti dari “${challenge.word}”?`);
  }
  log.innerHTML = '';
  ask();
  form.addEventListener('submit', event => {
    event.preventDefault();
    const answer = input.value.trim();
    if (!answer || !challenge) return;
    addBubble('user', answer);
    const expected = challenge.meaning.toLowerCase();
    const ok = expected.includes(answer.toLowerCase()) || answer.toLowerCase().includes(expected.split('/')[0].trim());
    addBubble('bot', ok ? `Mantap! “${challenge.word}” artinya ${challenge.meaning}.` : `Hampir. Jawaban yang dicari: ${challenge.meaning}. Coba latihan berikutnya.`);
    input.value = '';
    setTimeout(ask, 500);
  }, { once: false });
}

function renderComments() {
  const list = $('#commentList');
  const selected = selectedLanguageId;
  const comments = state.comments.filter(c => c.scope === 'global' || c.targetId === selected).slice(0, 80);
  if (!comments.length) {
    list.innerHTML = '<div class="card empty">Belum ada komentar public. Jadilah yang pertama.</div>';
    return;
  }
  list.innerHTML = comments.map(c => {
    const target = state.languages.find(l => l.id === c.targetId);
    return `
      <article class="card comment-card">
        <div class="comment-meta"><strong>${escapeHTML(c.name)}</strong><span>${formatDate(c.createdAt)}</span></div>
        <span class="pill">${c.scope === 'global' ? 'Global' : escapeHTML(target?.name || 'Bahasa')}</span>
        <p>${escapeHTML(c.text)}</p>
        ${c.reply ? `<div class="reply"><strong>Balasan Admin:</strong><br>${escapeHTML(c.reply)}</div>` : ''}
      </article>
    `;
  }).join('');
}

async function submitComment(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const scope = formData.get('scope') === 'language' && selectedLanguageId ? 'language' : 'global';
  const payload = {
    name: formData.get('name'),
    text: formData.get('text'),
    scope,
    targetId: scope === 'language' ? selectedLanguageId : 'global'
  };
  const res = await fetch('/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    toast(error.error || 'Komentar gagal dikirim.');
    return;
  }
  form.reset();
  toast('Komentar masuk public.');
  await loadState();
}

async function loadState() {
  const res = await fetch('/api/public', { cache: 'no-store' });
  state = await res.json();
  applySettings();
  if (!selectedLanguageId || !state.languages.some(l => l.id === selectedLanguageId)) selectedLanguageId = state.languages[0]?.id || '';
  if (selectedLanguageId) localStorage.setItem('ditz:selectedLanguageId', selectedLanguageId);
  renderLanguages();
  renderLearning();
  renderComments();
}

function setupEvents() {
  $('#searchInput').addEventListener('input', renderLanguages);
  $('#levelFilter').addEventListener('change', renderLanguages);
  $('#commentForm').addEventListener('submit', submitComment);
  $('#themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('light');
    localStorage.setItem('ditz:theme', document.body.classList.contains('light') ? 'light' : 'dark');
  });
  if (localStorage.getItem('ditz:theme') === 'light') document.body.classList.add('light');

  if ('EventSource' in window) {
    const events = new EventSource('/api/events');
    events.onmessage = () => loadState();
  } else {
    setInterval(loadState, 5000);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  setupEvents();
  await loadState();
});

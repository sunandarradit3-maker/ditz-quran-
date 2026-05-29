const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const PIN_KEY = 'ditz:adminPin';
let state = null;

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
  toast._timer = setTimeout(() => box.classList.remove('show'), 2500);
}

function pin() { return localStorage.getItem(PIN_KEY) || ''; }
function headers(json = true) {
  const h = { 'X-Admin-Pin': pin() };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { ...headers(options.body !== undefined), ...(options.headers || {}) }
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request gagal.');
  return data;
}

function showApp(isLogged) {
  $('#loginScreen').classList.toggle('hidden', isLogged);
  $('#adminApp').classList.toggle('hidden', !isLogged);
}

async function loadAdmin() {
  try {
    state = await api('/api/admin');
    showApp(true);
    renderAll();
  } catch (error) {
    showApp(false);
  }
}

function setFormValues(form, values) {
  Object.entries(values).forEach(([key, value]) => {
    const input = form.elements[key];
    if (!input) return;
    if (input.type === 'checkbox') input.checked = Boolean(value);
    else if (Array.isArray(value)) input.value = value.join('|');
    else input.value = value ?? '';
  });
}

function getFormValues(form) {
  const data = {};
  [...new FormData(form).entries()].forEach(([key, value]) => data[key] = value);
  [...form.querySelectorAll('input[type="checkbox"]')].forEach(input => data[input.name] = input.checked);
  return data;
}

function clearForm(form) {
  form.reset();
  const idInput = form.elements.id;
  if (idInput) idInput.value = '';
  const active = form.elements.active;
  if (active) active.checked = true;
}

function languageName(id) {
  const lang = state.languages.find(l => l.id === id);
  return lang ? `${lang.flag || '🌍'} ${lang.name}` : id;
}

function lessonName(id) {
  const lesson = state.lessons.find(l => l.id === id);
  return lesson ? lesson.title : id || 'Tidak terikat';
}

function fillSelects() {
  const languageOptions = state.languages.map(l => `<option value="${escapeHTML(l.id)}">${escapeHTML((l.flag || '🌍') + ' ' + l.name)}</option>`).join('');
  $$('select[name="languageId"]').forEach(select => { select.innerHTML = languageOptions || '<option value="">Belum ada bahasa</option>'; });
  const lessonOptions = '<option value="">Semua materi / tidak terikat</option>' + state.lessons.map(l => `<option value="${escapeHTML(l.id)}">${escapeHTML(languageName(l.languageId))} · ${escapeHTML(l.title)}</option>`).join('');
  $$('select[name="lessonId"]').forEach(select => { select.innerHTML = lessonOptions; });
}

function renderDashboard() {
  $('#dashLanguages').textContent = state.languages.length;
  $('#dashLessons').textContent = state.lessons.length;
  $('#dashVocab').textContent = state.vocabulary.length;
  $('#dashQuiz').textContent = state.quizzes.length;
}

function renderSettings() {
  setFormValues($('#settingsForm'), state.settings);
  document.documentElement.style.setProperty('--accent', state.settings.accent || '#7c3aed');
}

function row(title, description, buttons) {
  return `<div class="row"><div><strong>${title}</strong>${description ? `<p>${description}</p>` : ''}</div><div class="row-actions">${buttons}</div></div>`;
}

function renderLanguages() {
  const table = $('#languageTable');
  table.innerHTML = state.languages.map(item => row(
    `${escapeHTML(item.flag || '🌍')} ${escapeHTML(item.name)} <span class="pill">${escapeHTML(item.active ? 'Aktif' : 'Hidden')}</span>`,
    `${escapeHTML(item.nativeName || '')} · ${escapeHTML(item.country || '')}<br>${escapeHTML(item.description || '')}`,
    `<button class="btn small" data-edit-lang="${escapeHTML(item.id)}">Edit</button><button class="btn small danger" data-delete-lang="${escapeHTML(item.id)}">Hapus</button>`
  )).join('') || '<div class="card empty">Belum ada bahasa.</div>';

  $$('[data-edit-lang]').forEach(btn => btn.addEventListener('click', () => {
    const item = state.languages.find(x => x.id === btn.dataset.editLang);
    setFormValues($('#languageForm'), item);
    location.hash = '#languages';
    toast('Data bahasa dimasukkan ke form. Edit lalu simpan.');
  }));
  $$('[data-delete-lang]').forEach(btn => btn.addEventListener('click', async () => {
    if (!confirm('Hapus bahasa beserta materi, kosakata, dan quiz terkait?')) return;
    await api(`/api/languages/${btn.dataset.deleteLang}`, { method: 'DELETE' });
    toast('Bahasa dihapus.');
    await loadAdmin();
  }));
}

function renderLessons() {
  const table = $('#lessonTable');
  const sorted = [...state.lessons].sort((a, b) => languageName(a.languageId).localeCompare(languageName(b.languageId)) || Number(a.order || 0) - Number(b.order || 0));
  table.innerHTML = sorted.map(item => row(
    `${escapeHTML(item.title)} <span class="pill">${escapeHTML(item.level || 'Pemula')}</span>`,
    `${escapeHTML(languageName(item.languageId))} · Urutan ${escapeHTML(item.order || 0)}<br>${escapeHTML(item.content || '')}`,
    `<button class="btn small" data-edit-lesson="${escapeHTML(item.id)}">Edit</button><button class="btn small danger" data-delete-lesson="${escapeHTML(item.id)}">Hapus</button>`
  )).join('') || '<div class="card empty">Belum ada materi.</div>';

  $$('[data-edit-lesson]').forEach(btn => btn.addEventListener('click', () => {
    const item = state.lessons.find(x => x.id === btn.dataset.editLesson);
    setFormValues($('#lessonForm'), item);
    toast('Materi masuk ke form.');
  }));
  $$('[data-delete-lesson]').forEach(btn => btn.addEventListener('click', async () => {
    if (!confirm('Hapus materi ini?')) return;
    await api(`/api/lessons/${btn.dataset.deleteLesson}`, { method: 'DELETE' });
    toast('Materi dihapus.');
    await loadAdmin();
  }));
}

function renderVocab() {
  const table = $('#vocabTable');
  table.innerHTML = state.vocabulary.map(item => row(
    `${escapeHTML(item.word)} → ${escapeHTML(item.meaning)}`,
    `${escapeHTML(languageName(item.languageId))} · ${escapeHTML(lessonName(item.lessonId))}<br>Cara baca: ${escapeHTML(item.pronunciation || '-')}<br>${escapeHTML(item.example || '')}`,
    `<button class="btn small" data-edit-vocab="${escapeHTML(item.id)}">Edit</button><button class="btn small danger" data-delete-vocab="${escapeHTML(item.id)}">Hapus</button>`
  )).join('') || '<div class="card empty">Belum ada kosakata.</div>';

  $$('[data-edit-vocab]').forEach(btn => btn.addEventListener('click', () => {
    const item = state.vocabulary.find(x => x.id === btn.dataset.editVocab);
    setFormValues($('#vocabForm'), item);
    toast('Kosakata masuk ke form.');
  }));
  $$('[data-delete-vocab]').forEach(btn => btn.addEventListener('click', async () => {
    if (!confirm('Hapus kosakata ini?')) return;
    await api(`/api/vocabulary/${btn.dataset.deleteVocab}`, { method: 'DELETE' });
    toast('Kosakata dihapus.');
    await loadAdmin();
  }));
}

function renderQuizzes() {
  const table = $('#quizTable');
  table.innerHTML = state.quizzes.map(item => row(
    `${escapeHTML(item.question)} <span class="pill">${escapeHTML(item.difficulty || 'Easy')}</span>`,
    `${escapeHTML(languageName(item.languageId))}<br>Opsi: ${escapeHTML((item.options || []).join(' | '))}<br>Jawaban benar index: ${escapeHTML(item.answerIndex)} · ${escapeHTML(item.explanation || '')}`,
    `<button class="btn small" data-edit-quiz="${escapeHTML(item.id)}">Edit</button><button class="btn small danger" data-delete-quiz="${escapeHTML(item.id)}">Hapus</button>`
  )).join('') || '<div class="card empty">Belum ada quiz training.</div>';

  $$('[data-edit-quiz]').forEach(btn => btn.addEventListener('click', () => {
    const item = state.quizzes.find(x => x.id === btn.dataset.editQuiz);
    setFormValues($('#quizForm'), { ...item, options: item.options.join('|') });
    toast('Quiz masuk ke form.');
  }));
  $$('[data-delete-quiz]').forEach(btn => btn.addEventListener('click', async () => {
    if (!confirm('Hapus quiz ini?')) return;
    await api(`/api/quizzes/${btn.dataset.deleteQuiz}`, { method: 'DELETE' });
    toast('Quiz dihapus.');
    await loadAdmin();
  }));
}

function renderComments() {
  const table = $('#commentTable');
  table.innerHTML = state.comments.map(item => {
    const target = item.scope === 'global' ? 'Global' : languageName(item.targetId);
    return `
      <div class="card">
        <div class="comment-meta"><strong>${escapeHTML(item.name)}</strong><span>${escapeHTML(new Date(item.createdAt).toLocaleString('id-ID'))}</span></div>
        <span class="pill">${escapeHTML(target)} · ${escapeHTML(item.status || 'published')}</span>
        <p>${escapeHTML(item.text)}</p>
        <textarea class="textarea" data-reply-input="${escapeHTML(item.id)}" placeholder="Balasan admin...">${escapeHTML(item.reply || '')}</textarea>
        <div class="row-actions" style="margin-top:10px">
          <button class="btn small primary" data-save-reply="${escapeHTML(item.id)}">Simpan Balasan</button>
          <button class="btn small" data-toggle-comment="${escapeHTML(item.id)}">${item.status === 'hidden' ? 'Publikasikan' : 'Sembunyikan'}</button>
          <button class="btn small danger" data-delete-comment="${escapeHTML(item.id)}">Hapus</button>
        </div>
      </div>`;
  }).join('') || '<div class="card empty">Belum ada komentar.</div>';

  $$('[data-save-reply]').forEach(btn => btn.addEventListener('click', async () => {
    const id = btn.dataset.saveReply;
    const reply = $(`[data-reply-input="${CSS.escape(id)}"]`).value;
    await api(`/api/comments/${id}`, { method: 'PUT', body: JSON.stringify({ reply }) });
    toast('Balasan admin tersimpan dan tampil public.');
    await loadAdmin();
  }));
  $$('[data-toggle-comment]').forEach(btn => btn.addEventListener('click', async () => {
    const item = state.comments.find(c => c.id === btn.dataset.toggleComment);
    await api(`/api/comments/${item.id}`, { method: 'PUT', body: JSON.stringify({ status: item.status === 'hidden' ? 'published' : 'hidden' }) });
    toast('Status komentar diubah.');
    await loadAdmin();
  }));
  $$('[data-delete-comment]').forEach(btn => btn.addEventListener('click', async () => {
    if (!confirm('Hapus komentar ini?')) return;
    await api(`/api/comments/${btn.dataset.deleteComment}`, { method: 'DELETE' });
    toast('Komentar dihapus.');
    await loadAdmin();
  }));
}

function renderAll() {
  renderDashboard();
  renderSettings();
  fillSelects();
  renderLanguages();
  renderLessons();
  renderVocab();
  renderQuizzes();
  renderComments();
}

function setupTabs() {
  $$('#adminNav button').forEach(btn => btn.addEventListener('click', () => {
    $$('#adminNav button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    $$('.admin-section').forEach(section => section.classList.toggle('active', section.dataset.section === btn.dataset.tab));
  }));
}

function setupForms() {
  $('#loginForm').addEventListener('submit', async event => {
    event.preventDefault();
    const pinValue = new FormData(event.currentTarget).get('pin');
    const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: pinValue }) });
    if (!res.ok) return toast('PIN salah.');
    localStorage.setItem(PIN_KEY, pinValue);
    toast('Login berhasil.');
    await loadAdmin();
  });

  $('#logoutBtn').addEventListener('click', () => {
    localStorage.removeItem(PIN_KEY);
    showApp(false);
  });

  $('#settingsForm').addEventListener('submit', async event => {
    event.preventDefault();
    await api('/api/settings', { method: 'PUT', body: JSON.stringify(getFormValues(event.currentTarget)) });
    toast('Tulisan website disimpan.');
    await loadAdmin();
  });

  $('#languageForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = getFormValues(form);
    const editId = values.id;
    delete values.id;
    await api(editId ? `/api/languages/${editId}` : '/api/languages', { method: editId ? 'PUT' : 'POST', body: JSON.stringify(values) });
    toast(editId ? 'Bahasa diperbarui.' : 'Bahasa ditambahkan.');
    clearForm(form);
    await loadAdmin();
  });
  $('#resetLanguageForm').addEventListener('click', () => clearForm($('#languageForm')));

  $('#lessonForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = getFormValues(form);
    values.order = Number(values.order || 0);
    const editId = values.id;
    delete values.id;
    await api(editId ? `/api/lessons/${editId}` : '/api/lessons', { method: editId ? 'PUT' : 'POST', body: JSON.stringify(values) });
    toast(editId ? 'Materi diperbarui.' : 'Materi ditambahkan.');
    clearForm(form);
    await loadAdmin();
  });
  $('#resetLessonForm').addEventListener('click', () => clearForm($('#lessonForm')));

  $('#vocabForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = getFormValues(form);
    const editId = values.id;
    delete values.id;
    await api(editId ? `/api/vocabulary/${editId}` : '/api/vocabulary', { method: editId ? 'PUT' : 'POST', body: JSON.stringify(values) });
    toast(editId ? 'Kosakata diperbarui.' : 'Kosakata ditambahkan.');
    clearForm(form);
    await loadAdmin();
  });
  $('#resetVocabForm').addEventListener('click', () => clearForm($('#vocabForm')));

  $('#quizForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = getFormValues(form);
    values.options = String(values.options || '').split('|').map(x => x.trim()).filter(Boolean);
    values.answerIndex = Number(values.answerIndex || 0);
    const editId = values.id;
    delete values.id;
    if (values.options.length < 2) return toast('Minimal 2 pilihan jawaban.');
    if (values.answerIndex < 0 || values.answerIndex >= values.options.length) return toast('Index jawaban benar harus sesuai urutan opsi.');
    await api(editId ? `/api/quizzes/${editId}` : '/api/quizzes', { method: editId ? 'PUT' : 'POST', body: JSON.stringify(values) });
    toast(editId ? 'Quiz diperbarui.' : 'Quiz ditambahkan.');
    clearForm(form);
    await loadAdmin();
  });
  $('#resetQuizForm').addEventListener('click', () => clearForm($('#quizForm')));
}

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupForms();
  loadAdmin();
});

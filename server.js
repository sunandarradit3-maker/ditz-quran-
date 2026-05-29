const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3000);
const ADMIN_PIN = process.env.ADMIN_PIN || '082009';
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_FILE = path.join(ROOT, 'data.json');

const sseClients = new Set();

function nowISO() {
  return new Date().toISOString();
}

function id(prefix) {
  return `${prefix}_${crypto.randomBytes(5).toString('hex')}`;
}

function defaultData() {
  const langEn = 'lang_en';
  const langJp = 'lang_jp';
  const langKr = 'lang_kr';
  const lessonEn = 'lesson_en_greet';
  const lessonJp = 'lesson_jp_greet';
  const lessonKr = 'lesson_kr_greet';

  return {
    meta: {
      version: '1.0.0',
      updatedAt: nowISO()
    },
    settings: {
      brandName: 'DiTz LINGUA',
      heroTitle: 'Belajar Semua Bahasa Negara Dari Nol Sampai Lancar',
      heroSubtitle: 'Materi, kosakata, quiz acak, audio pronunciation, progress belajar, dan komentar public yang bisa dibalas admin.',
      announcement: 'Mode belajar 2026 aktif: quiz acak, AI practice offline, progress lokal, dan komentar public real-time.',
      supportEmail: 'ditzstoreofficial@gmail.com',
      whatsapp: '087739435496',
      primaryCTA: 'Mulai Belajar',
      secondaryCTA: 'Lihat Bahasa',
      footerText: 'Dibuat untuk belajar bahasa dunia secara fleksibel, modern, dan bisa diedit dari admin panel.',
      accent: '#7c3aed'
    },
    languages: [
      {
        id: langEn,
        name: 'English',
        nativeName: 'English',
        country: 'United States / United Kingdom',
        flag: '🇺🇸',
        level: 'Pemula',
        description: 'Bahasa internasional untuk sekolah, kerja, travel, dan komunikasi global.',
        color: '#7c3aed',
        active: true,
        createdAt: nowISO()
      },
      {
        id: langJp,
        name: 'Japanese',
        nativeName: '日本語',
        country: 'Japan',
        flag: '🇯🇵',
        level: 'Pemula',
        description: 'Belajar salam, kosakata dasar, dan percakapan harian Jepang.',
        color: '#ef4444',
        active: true,
        createdAt: nowISO()
      },
      {
        id: langKr,
        name: 'Korean',
        nativeName: '한국어',
        country: 'South Korea',
        flag: '🇰🇷',
        level: 'Pemula',
        description: 'Mulai dari sapaan Korea, frasa sehari-hari, dan latihan arti kata.',
        color: '#0ea5e9',
        active: true,
        createdAt: nowISO()
      }
    ],
    lessons: [
      {
        id: lessonEn,
        languageId: langEn,
        title: 'Salam Dasar',
        level: 'Pemula',
        content: 'Mulai dengan salam paling umum: Hello, Good morning, Thank you, dan How are you?',
        example: 'Hello, how are you today?',
        order: 1,
        createdAt: nowISO()
      },
      {
        id: lessonJp,
        languageId: langJp,
        title: 'Aisatsu / Salam',
        level: 'Pemula',
        content: 'Sapaan penting: Konnichiwa, Ohayou, Arigatou, dan Sayounara.',
        example: 'Konnichiwa, ogenki desu ka?',
        order: 1,
        createdAt: nowISO()
      },
      {
        id: lessonKr,
        languageId: langKr,
        title: 'Salam Korea',
        level: 'Pemula',
        content: 'Sapaan dasar: Annyeonghaseyo, Kamsahamnida, dan Jal jinaeyo?',
        example: 'Annyeonghaseyo, jal jinaeyo?',
        order: 1,
        createdAt: nowISO()
      }
    ],
    vocabulary: [
      { id: 'voc_en_hello', languageId: langEn, lessonId: lessonEn, word: 'Hello', meaning: 'Halo', pronunciation: 'heh-loh', example: 'Hello, my friend!', createdAt: nowISO() },
      { id: 'voc_en_thanks', languageId: langEn, lessonId: lessonEn, word: 'Thank you', meaning: 'Terima kasih', pronunciation: 'thengk yu', example: 'Thank you for your help.', createdAt: nowISO() },
      { id: 'voc_jp_hello', languageId: langJp, lessonId: lessonJp, word: 'こんにちは', meaning: 'Halo / Selamat siang', pronunciation: 'konnichiwa', example: 'こんにちは、元気ですか？', createdAt: nowISO() },
      { id: 'voc_jp_thanks', languageId: langJp, lessonId: lessonJp, word: 'ありがとう', meaning: 'Terima kasih', pronunciation: 'arigatou', example: 'ありがとうございます。', createdAt: nowISO() },
      { id: 'voc_kr_hello', languageId: langKr, lessonId: lessonKr, word: '안녕하세요', meaning: 'Halo', pronunciation: 'annyeonghaseyo', example: '안녕하세요, 반갑습니다.', createdAt: nowISO() },
      { id: 'voc_kr_thanks', languageId: langKr, lessonId: lessonKr, word: '감사합니다', meaning: 'Terima kasih', pronunciation: 'gamsahamnida', example: '감사합니다!', createdAt: nowISO() }
    ],
    quizzes: [
      { id: 'quiz_en_hello', languageId: langEn, question: 'Apa arti dari “Hello”?', options: ['Halo', 'Sampai jumpa', 'Maaf', 'Makan'], answerIndex: 0, explanation: 'Hello berarti Halo.', difficulty: 'Easy', createdAt: nowISO() },
      { id: 'quiz_en_thanks', languageId: langEn, question: 'Kalimat “Thank you” artinya?', options: ['Selamat malam', 'Terima kasih', 'Apa kabar', 'Tolong'], answerIndex: 1, explanation: 'Thank you digunakan untuk mengucapkan terima kasih.', difficulty: 'Easy', createdAt: nowISO() },
      { id: 'quiz_jp_hello', languageId: langJp, question: 'こんにちは dibaca?', options: ['Kamsahamnida', 'Konnichiwa', 'Bonjour', 'Gracias'], answerIndex: 1, explanation: 'こんにちは dibaca Konnichiwa.', difficulty: 'Easy', createdAt: nowISO() },
      { id: 'quiz_kr_hello', languageId: langKr, question: '안녕하세요 artinya?', options: ['Halo', 'Terima kasih', 'Selamat tidur', 'Saya lapar'], answerIndex: 0, explanation: '안녕하세요 adalah sapaan formal dalam bahasa Korea.', difficulty: 'Easy', createdAt: nowISO() }
    ],
    comments: [
      {
        id: 'comment_welcome',
        scope: 'global',
        targetId: 'global',
        name: 'DiTz Admin',
        text: 'Selamat datang di komentar public. Tulis pertanyaan bahasa yang ingin kamu pelajari.',
        reply: 'Admin bisa membalas komentar dari admin panel.',
        status: 'published',
        createdAt: nowISO()
      }
    ]
  };
}

function ensureData() {
  if (!fs.existsSync(DATA_FILE)) {
    writeData(defaultData());
  }
}

function readData() {
  ensureData();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (error) {
    const fresh = defaultData();
    writeData(fresh);
    return fresh;
  }
}

function writeData(data) {
  data.meta = data.meta || {};
  data.meta.updatedAt = nowISO();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  broadcast({ type: 'update', updatedAt: data.meta.updatedAt });
}

function broadcast(payload) {
  const body = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of [...sseClients]) {
    try {
      res.write(body);
    } catch (error) {
      sseClients.delete(res);
    }
  }
}

function send(res, status, payload, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(JSON.stringify(payload));
}

function noContent(res) {
  res.writeHead(204);
  res.end();
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 2_000_000) {
        reject(new Error('Payload terlalu besar'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error('JSON tidak valid'));
      }
    });
  });
}

function isAdmin(req) {
  return req.headers['x-admin-pin'] === ADMIN_PIN;
}

function requireAdmin(req, res) {
  if (!isAdmin(req)) {
    send(res, 401, { ok: false, error: 'PIN admin salah atau belum dikirim.' });
    return false;
  }
  return true;
}

function sanitizePublic(data) {
  return {
    meta: data.meta,
    settings: data.settings,
    languages: data.languages.filter(item => item.active !== false),
    lessons: data.lessons,
    vocabulary: data.vocabulary,
    quizzes: data.quizzes.map(q => ({ ...q, answerIndex: undefined })),
    comments: data.comments.filter(c => c.status !== 'hidden')
  };
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon'
  }[ext] || 'application/octet-stream';
}

function serveStatic(req, res, pathname) {
  let requested = pathname === '/' ? '/index.html' : pathname;
  requested = decodeURIComponent(requested);
  const filePath = path.normalize(path.join(PUBLIC_DIR, requested));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.readFile(filePath, (err, file) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType(filePath),
      'Cache-Control': 'no-cache'
    });
    res.end(file);
  });
}

function upsertFields(target, body, allowed) {
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, key)) target[key] = body[key];
  }
}

function reorder(items, field = 'order') {
  return items.sort((a, b) => Number(a[field] || 0) - Number(b[field] || 0));
}

async function handleApi(req, res, urlObj) {
  const pathname = urlObj.pathname;
  const method = req.method;

  if (method === 'GET' && pathname === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write('event: ready\n');
    res.write(`data: ${JSON.stringify({ ok: true, at: nowISO() })}\n\n`);
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  if (method === 'GET' && pathname === '/api/public') {
    return send(res, 200, sanitizePublic(readData()));
  }

  if (method === 'POST' && pathname === '/api/login') {
    const body = await readBody(req);
    return send(res, body.pin === ADMIN_PIN ? 200 : 401, { ok: body.pin === ADMIN_PIN });
  }

  if (method === 'GET' && pathname === '/api/admin') {
    if (!requireAdmin(req, res)) return;
    return send(res, 200, readData());
  }

  const data = readData();
  const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await readBody(req) : {};

  if (method === 'PUT' && pathname === '/api/settings') {
    if (!requireAdmin(req, res)) return;
    upsertFields(data.settings, body, ['brandName', 'heroTitle', 'heroSubtitle', 'announcement', 'supportEmail', 'whatsapp', 'primaryCTA', 'secondaryCTA', 'footerText', 'accent']);
    writeData(data);
    return send(res, 200, data.settings);
  }

  if (method === 'POST' && pathname === '/api/languages') {
    if (!requireAdmin(req, res)) return;
    const item = {
      id: id('lang'),
      name: String(body.name || 'Bahasa Baru'),
      nativeName: String(body.nativeName || ''),
      country: String(body.country || ''),
      flag: String(body.flag || '🌍'),
      level: String(body.level || 'Pemula'),
      description: String(body.description || ''),
      color: String(body.color || data.settings.accent || '#7c3aed'),
      active: body.active !== false,
      createdAt: nowISO()
    };
    data.languages.push(item);
    writeData(data);
    return send(res, 201, item);
  }

  let match = pathname.match(/^\/api\/languages\/([^/]+)$/);
  if (match) {
    if (!requireAdmin(req, res)) return;
    const index = data.languages.findIndex(item => item.id === match[1]);
    if (index < 0) return send(res, 404, { error: 'Bahasa tidak ditemukan.' });
    if (method === 'PUT') {
      upsertFields(data.languages[index], body, ['name', 'nativeName', 'country', 'flag', 'level', 'description', 'color', 'active']);
      writeData(data);
      return send(res, 200, data.languages[index]);
    }
    if (method === 'DELETE') {
      data.languages.splice(index, 1);
      data.lessons = data.lessons.filter(item => item.languageId !== match[1]);
      data.vocabulary = data.vocabulary.filter(item => item.languageId !== match[1]);
      data.quizzes = data.quizzes.filter(item => item.languageId !== match[1]);
      data.comments = data.comments.filter(item => item.targetId !== match[1]);
      writeData(data);
      return noContent(res);
    }
  }

  if (method === 'POST' && pathname === '/api/lessons') {
    if (!requireAdmin(req, res)) return;
    if (!data.languages.some(item => item.id === body.languageId)) return send(res, 400, { error: 'languageId tidak valid.' });
    const item = {
      id: id('lesson'),
      languageId: String(body.languageId),
      title: String(body.title || 'Materi Baru'),
      level: String(body.level || 'Pemula'),
      content: String(body.content || ''),
      example: String(body.example || ''),
      order: Number(body.order || data.lessons.length + 1),
      createdAt: nowISO()
    };
    data.lessons.push(item);
    writeData(data);
    return send(res, 201, item);
  }

  match = pathname.match(/^\/api\/lessons\/([^/]+)$/);
  if (match) {
    if (!requireAdmin(req, res)) return;
    const index = data.lessons.findIndex(item => item.id === match[1]);
    if (index < 0) return send(res, 404, { error: 'Materi tidak ditemukan.' });
    if (method === 'PUT') {
      upsertFields(data.lessons[index], body, ['languageId', 'title', 'level', 'content', 'example', 'order']);
      data.lessons[index].order = Number(data.lessons[index].order || 0);
      writeData(data);
      return send(res, 200, data.lessons[index]);
    }
    if (method === 'DELETE') {
      data.lessons.splice(index, 1);
      data.vocabulary = data.vocabulary.map(item => item.lessonId === match[1] ? { ...item, lessonId: '' } : item);
      writeData(data);
      return noContent(res);
    }
  }

  if (method === 'POST' && pathname === '/api/vocabulary') {
    if (!requireAdmin(req, res)) return;
    if (!data.languages.some(item => item.id === body.languageId)) return send(res, 400, { error: 'languageId tidak valid.' });
    const item = {
      id: id('voc'),
      languageId: String(body.languageId),
      lessonId: String(body.lessonId || ''),
      word: String(body.word || 'Kata Baru'),
      meaning: String(body.meaning || ''),
      pronunciation: String(body.pronunciation || ''),
      example: String(body.example || ''),
      createdAt: nowISO()
    };
    data.vocabulary.push(item);
    writeData(data);
    return send(res, 201, item);
  }

  match = pathname.match(/^\/api\/vocabulary\/([^/]+)$/);
  if (match) {
    if (!requireAdmin(req, res)) return;
    const index = data.vocabulary.findIndex(item => item.id === match[1]);
    if (index < 0) return send(res, 404, { error: 'Kosakata tidak ditemukan.' });
    if (method === 'PUT') {
      upsertFields(data.vocabulary[index], body, ['languageId', 'lessonId', 'word', 'meaning', 'pronunciation', 'example']);
      writeData(data);
      return send(res, 200, data.vocabulary[index]);
    }
    if (method === 'DELETE') {
      data.vocabulary.splice(index, 1);
      writeData(data);
      return noContent(res);
    }
  }

  if (method === 'POST' && pathname === '/api/quizzes') {
    if (!requireAdmin(req, res)) return;
    if (!data.languages.some(item => item.id === body.languageId)) return send(res, 400, { error: 'languageId tidak valid.' });
    const options = Array.isArray(body.options) ? body.options.map(String).slice(0, 6) : String(body.options || '').split('|').map(s => s.trim()).filter(Boolean);
    const item = {
      id: id('quiz'),
      languageId: String(body.languageId),
      question: String(body.question || 'Pertanyaan Baru'),
      options: options.length >= 2 ? options : ['Opsi A', 'Opsi B'],
      answerIndex: Number(body.answerIndex || 0),
      explanation: String(body.explanation || ''),
      difficulty: String(body.difficulty || 'Easy'),
      createdAt: nowISO()
    };
    if (item.answerIndex < 0 || item.answerIndex >= item.options.length) item.answerIndex = 0;
    data.quizzes.push(item);
    writeData(data);
    return send(res, 201, item);
  }

  match = pathname.match(/^\/api\/quizzes\/([^/]+)$/);
  if (match) {
    if (!requireAdmin(req, res)) return;
    const index = data.quizzes.findIndex(item => item.id === match[1]);
    if (index < 0) return send(res, 404, { error: 'Quiz tidak ditemukan.' });
    if (method === 'PUT') {
      upsertFields(data.quizzes[index], body, ['languageId', 'question', 'options', 'answerIndex', 'explanation', 'difficulty']);
      if (typeof data.quizzes[index].options === 'string') data.quizzes[index].options = data.quizzes[index].options.split('|').map(s => s.trim()).filter(Boolean);
      data.quizzes[index].answerIndex = Number(data.quizzes[index].answerIndex || 0);
      if (data.quizzes[index].answerIndex < 0 || data.quizzes[index].answerIndex >= data.quizzes[index].options.length) data.quizzes[index].answerIndex = 0;
      writeData(data);
      return send(res, 200, data.quizzes[index]);
    }
    if (method === 'DELETE') {
      data.quizzes.splice(index, 1);
      writeData(data);
      return noContent(res);
    }
  }

  if (method === 'POST' && pathname === '/api/comments') {
    const name = String(body.name || '').trim().slice(0, 80);
    const text = String(body.text || '').trim().slice(0, 1000);
    const scope = ['global', 'language', 'lesson'].includes(body.scope) ? body.scope : 'global';
    const targetId = String(body.targetId || 'global');
    if (!name || !text) return send(res, 400, { error: 'Nama dan komentar wajib diisi.' });
    const item = {
      id: id('comment'),
      scope,
      targetId,
      name,
      text,
      reply: '',
      status: 'published',
      createdAt: nowISO()
    };
    data.comments.unshift(item);
    writeData(data);
    return send(res, 201, item);
  }

  match = pathname.match(/^\/api\/comments\/([^/]+)$/);
  if (match) {
    if (!requireAdmin(req, res)) return;
    const index = data.comments.findIndex(item => item.id === match[1]);
    if (index < 0) return send(res, 404, { error: 'Komentar tidak ditemukan.' });
    if (method === 'PUT') {
      upsertFields(data.comments[index], body, ['reply', 'status']);
      writeData(data);
      return send(res, 200, data.comments[index]);
    }
    if (method === 'DELETE') {
      data.comments.splice(index, 1);
      writeData(data);
      return noContent(res);
    }
  }

  if (method === 'POST' && pathname === '/api/check-answer') {
    const { quizId, answerIndex } = body;
    const quiz = data.quizzes.find(item => item.id === quizId);
    if (!quiz) return send(res, 404, { error: 'Quiz tidak ditemukan.' });
    const correct = Number(answerIndex) === Number(quiz.answerIndex);
    return send(res, 200, { correct, answerIndex: quiz.answerIndex, explanation: quiz.explanation || '' });
  }

  return send(res, 404, { error: 'Endpoint tidak ditemukan.' });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Pin');
  if (req.method === 'OPTIONS') return noContent(res);

  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (urlObj.pathname.startsWith('/api/')) {
      await handleApi(req, res, urlObj);
    } else {
      serveStatic(req, res, urlObj.pathname);
    }
  } catch (error) {
    console.error(error);
    send(res, 500, { error: error.message || 'Server error.' });
  }
});

ensureData();
server.listen(PORT, () => {
  console.log(`DiTz LINGUA running at http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
});

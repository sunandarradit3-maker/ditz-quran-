# DiTz LINGUA

Website belajar semua bahasa negara dengan backend + frontend, admin panel, komentar public, quiz training dinamis, audio pronunciation, progress belajar, dan AI practice offline.

## Cara Menjalankan

1. Pastikan Node.js sudah terinstall.
2. Buka terminal di folder project.
3. Jalankan:

```bash
node server.js
```

atau:

```bash
npm start
```

4. Buka website:

```text
http://localhost:3000
```

5. Buka admin panel:

```text
http://localhost:3000/admin.html
```

PIN admin default:

```text
082009
```

## Fitur

- Semua tulisan homepage bisa diedit dari admin panel.
- Tambah, edit, hapus bahasa negara.
- Tambah, edit, hapus materi belajar.
- Tambah, edit, hapus kosakata.
- Tambah, edit, hapus pertanyaan quiz training.
- Quiz diacak dan pilihan jawaban ikut diacak.
- Komentar public bisa dikirim user dan dibalas admin.
- Komentar public realtime memakai Server-Sent Events.
- Text-to-speech / pronunciation memakai fitur browser.
- Progress belajar tersimpan di browser user.
- Mode AI Practice Offline dari data kosakata.
- Dark/light mode.

## Catatan

Data disimpan di `data.json`. Untuk produksi sungguhan, ganti penyimpanan JSON menjadi database seperti PostgreSQL, MySQL, MongoDB, atau SQLite dan gunakan auth yang lebih kuat dari PIN.

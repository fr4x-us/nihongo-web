# Laporan Tugas 3 — SRS, review, dashboard

Repo: fr4x-us/nihongo-web
Branch: tugas-3-srs
Dasar: cec2cfab48f5ed76d530277275558f24046b9e39 (tugas-2-kana lokal).
Tanggal pemeriksaan: 22 November 2026 UTC.
Prompt: nihongo-tugas-3-brief-codex.txt, folder Nihongo Tugas 3 di Google Drive (1BLrxIDj4hAWS5VBOBG7oFejOz8H4EVUj).
Tidak push atau membuka PR. Tidak mengubah/menambah migrasi.

## Hasil tiap kriteria

1. LULUS — clone bersih /workspace/nihongo-srs-clean dibuat dari branch lokal, awalnya tanpa node_modules, .next dan next-env.d.ts. npm ci, npm run lint, npm run typecheck, npm run build dan npm run test exit 0. Verifikasi akhir diulang setelah membersihkan .next/next-env.d.ts/typecheck cache dan menjalankan npm ci. Next 15.5.29, Node 24.22.3. Ada peringatan deprecation ESLint/cache webpack, bukan error.
2. LULUS — 18 unit test pada 4 berkas: 8 data/kuis kana, 9 SRS, 1 registry. Semua vektor wajib terpenuhi: grade 4 tiga kali interval 1/6/15, ease 2.5; grade 5 interval 1/6/16, ease 2.6/2.7/2.8; grade 3 baru ease 2.36 dan interval 1; grade 1 dari rep 5/interval 30 menghasilkan rep 0/lapse 1/interval 0/ease 2.3/due +10 menit; batas ease 1.3; formatInterval/preview konsisten. Ada pemeriksaan durasi 24 jam, kenaikan interval minimum, tidak memutasi input, determinisme, dan presisi grade 1 tanpa pembulatan tambahan.
3. LULUS — npm run test:review menggunakan Chromium dan Supabase lokal. Enam seed sesuai brief: 3 kana jatuh tempo, 1 kana masa depan, 1 vocab, 1 kana ID tak dikenal. Dashboard menghitung 3 jatuh tempo/4 total valid dan streak 7. Review menyajikan hanya 3 kartu, terurut due_at. Grade [5,4,1] terverifikasi lewat query cards/review_logs; Lagi kembali ke akhir antrean dengan state terbaru. Setelah kartu Lagi diberi Sulit (3), log tepat [5,4,1,3], ringkasan 4 penilaian dan masing-masing grade 1 kali. Dashboard kembali 0 dan halaman review menampilkan keadaan kosong. Kartu masa depan/vocab/ID tak dikenal serta xp, streak dan last_study_date tidak berubah. Enter/Spasi membalik dan Tab mengakses tombol nilai. Tidak ada pageerror.
4. LULUS — simulasi route abort PATCH cards: pesan error, kartu tidak maju, tidak ada log, database tetap sama; retry berhasil dengan satu log. Tambahan: INSERT log gagal setelah UPDATE sukses -> retry hanya log dan tidak mengulang UPDATE. Respons INSERT hilang sesudah commit -> readback menemukan log, retry tidak membuat log ganda. Klik ganda menghasilkan satu penilaian. Query dashboard gagal menampilkan pesan dan dapat dimuat ulang.
5. LULUS — npm run test:kana dan npm run test:integration tetap lolos. Tes regresi lama tidak diubah; role group pada soal QuizCard tetap ditemukan selektor berbasis label. Signup, profil otomatis, pembatasan plan, RLS, login/logout dan navigasi tetap berfungsi.
6. LULUS — git diff cec2cfa..HEAD -- supabase/ kosong. Skema sudah dibaca sebelum implementasi: review_logs.grade smallint CHECK (grade between 0 and 5), jadi grade 3/4 sah. Tidak ada service-role key pada kode aplikasi; helper klien memakai getSession dan seluruh akses aplikasi memakai sesi user/RLS.
7. LULUS — screenshot dashboard, review, ringkasan dan keadaan kosong dibuat di 375px/1280px. Dashboard/review diperiksa visual pada kedua ukuran, ringkasan mobile dan keadaan kosong desktop diperiksa juga. Tidak ada overflow horizontal dalam pemeriksaan browser. Konten dapat digulir untuk mengakses tombol di atas navigasi bawah pada mobile; tombol dapat dioperasikan keyboard.
8. LULUS — batas sesi: dengan 21 kartu valid jatuh tempo dan ID tak dikenal di urutan pertama, dashboard menghitung 21 dan review hanya memuat 20 valid; ID tidak dikenal tidak memakan slot sesi.

## Readback database utama

- hira:a, grade 5: ease 2.6, interval_days 1, repetitions 1, lapses 0, due_at +24 jam.
- hira:ka (interval 6, rep 2), grade 4: ease 2.5, interval_days 15, repetitions 3, lapses 0, due_at +15 × 24 jam.
- hira:sa (interval 30, rep 5), grade 1: ease 2.3, interval_days 0, repetitions 0, lapses 1, due_at +10 menit.
- hira:sa berikutnya grade 3: ease 2.16, interval_days 1, repetitions 1, lapses 1, due_at +24 jam.
- Empat log sesi utama persis grade [5,4,1,3]. Pengujian tambahan respons log hilang menambah satu log saja.
- Profil tetap streak=7, xp=42, last_study_date=2026-11-20. Tiga kartu pengecualian sama dengan seed.

## Keputusan implementasi dan batas

Tidak ada fitur di luar brief. Penyelesaian kecil Tugas 2 dibuat sebagai commit pertama terpisah. Flashcard tidak diubah API-nya; registry membuat front berlang=ja/font-japanese. Dashboard dan sesi memakai filter supportedItemTypes dan resolver ID yang sama. Total kartu mengecualikan ID tak dikenal. Dashboard menghitung seluruh kartu jatuh tempo valid; batas 20 hanya berlaku pada sesi. Paginasi menghindari batas respons server dan tetap melewati ID tidak dikenal.

Ringkasan menggunakan istilah jumlah penilaian dan menampilkan jumlah kartu awal secara terpisah agar pengulangan Lagi tidak menyesatkan. Grade 1 memakai max(1.3, ease-0.2) tanpa pembulatan tambahan; grade 3/4/5 membulatkan ease dua desimal sesuai brief.

Retry menyimpan objek pending di memori berisi state hasil/waktu tetap dan status langkah. Sebelum INSERT, readback memeriksa pemilik/item/grade/reviewed_at untuk menangani respons hilang. Dua penulisan tetap bukan transaksi database. Pemulihan pending setelah reload, konkurensi beberapa tab, serta exactly-once lintas sesi tidak disediakan/diuji; ini bukan klaim jaminan transaksional. Tidak menambah migrasi demi mekanisme tersebut.

Tes memakai PostgreSQL 17, GoTrue, PostgREST dan proxy lokal dari lingkungan Tugas 1/2, bukan proyek Supabase hosted. Akun/data tes dibersihkan pada akhir runner. Service role hanya pada runner pengujian lokal melalui environment; tidak dicetak atau dikemas. Tidak menguji Safari/Firefox, perangkat pembaca layar fisik, atau deployment produksi. Pengujian visual memakai Chromium headless. Tidak ada fitur wajib brief yang ditinggalkan.

## File dibuat/diubah dibanding cec2cfa

- `README.md`
- `package.json`
- `src/app/(app)/dashboard/page.tsx`
- `src/app/(app)/review/page.tsx`
- `src/components/dashboard.tsx`
- `src/components/quiz-card.tsx`
- `src/components/review/review-session.tsx`
- `src/lib/kana/progress.ts`
- `src/lib/review/items.test.ts`
- `src/lib/review/items.ts`
- `src/lib/review/progress.ts`
- `src/lib/srs.test.ts`
- `src/lib/srs.ts`
- `src/lib/supabase/session.ts`
- `tests/review-integration.mjs`
- `docs/verifikasi-tugas-3.md`

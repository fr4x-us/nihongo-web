# Laporan Tugas 2 — Modul kana

Repo: fr4x-us/nihongo-web
Branch: tugas-2-kana
Dasar: a67a979c5a2a6d89a1fdcadfae5ff113fbe0fbfd (tugas-1-kerangka lokal).
Tanggal verifikasi: 22 November 2026.
Tidak melakukan push, membuka PR, atau mengubah supabase/migrations/0001_init.sql.

## Hasil setiap kriteria

1. **LULUS — clone bersih:** clone lokal terpisah `/workspace/nihongo-kana-clean`, awalnya tanpa node_modules, .next, dan next-env.d.ts. `npm ci`, `npm run typecheck`, `npm run lint`, `npm run build`, dan `npm run test` selesai dengan exit 0. Next 15.5.29; Node 24.22.3. `.env.local` hanya konfigurasi Supabase pengujian lokal dan tidak masuk Git. Delapan unit test pada dua berkas lolos. Peringatan deprecation dependensi/cache build bukan error.
2. **LULUS — data dan pengecoh:** 208 entri; setiap jenis kana mempunyai basic 46, dakuten 20, handakuten 5, yoon 33 (11 baris × 3). ID unik, karakter unik per jenis, romaji tidak kosong. Seluruh 208 jawaban diuji dengan tiga urutan pengacakan deterministik; empat opsi unik, tidak ada pengecoh beromaji sama. Cakupan kecil tetap mendapat empat opsi.
3. **LULUS — bacaan khusus:** diperiksa pada data dan tabel browser: し=shi, つ=tsu, ふ=fu, を=wo, ぢ=ji, づ=zu, しゃ=sha, ちゅ=chu, じょ=jo. Tidak ada ヴ atau ファ.
4. **LULUS — belajar → kuis → database:** akun sementara login, menyelesaikan lima kartu baris ka memakai Enter/Spasi, kemudian membuka kuis baris yang sama. Query Supabase lokal membaca lima cards: hira:ka, hira:ki, hira:ku, hira:ke, hira:ko. Semua kartu baru memiliki ease=2.5, interval_days=0, repetitions=0, lapses=0 dan due_at terisi. Kuis dengan satu jawaban salah menghasilkan skor 4/5 dan lima review_logs (empat grade 5, satu grade 1). Tombol ulang hanya memunculkan satu soal salah; jawaban benar menghasilkan total enam log (lima grade 5, satu grade 1).
5. **LULUS — tanpa duplikasi/penimpaan:** setelah kartu hira:ka diberi ease=3, interval_days=14, repetitions=7, lapses=2, due_at=2030-01-02T03:04:05Z, baris ka diselesaikan lagi. Query tetap mengembalikan lima kartu dan seluruh nilai lama tersebut tetap sama. Upsert hanya mengirim kunci, dengan onConflict='user_id,item_type,item_id' dan ignoreDuplicates=true.
6. **LULUS — regresi Tugas 1:** `TEST_BASE_URL=http://localhost:3000 npm run test:integration` lolos. Tes lama tidak diubah: signup/profil otomatis, redirect privat, pembatasan UPDATE/upsert plan dari klien, RLS, login, logout dan navigasi tetap bekerja.
7. **LULUS — tampilan 375px/1280px:** screenshot tabel, belajar dan kuis ditinjau pada kedua ukuran; panel kana dan yoon juga ditinjau di mobile. Tabel tidak overflow horizontal. Native button dapat dipakai keyboard; Flashcard/QuizCard memakai label, fieldset/legend, status dan feedback yang tidak bergantung warna saja. Tidak ada pageerror selama tes kana. Tidak dilakukan audit dengan perangkat pembaca layar fisik.

## Bukti dan batas lingkungan

Tes browser memakai Chromium dan layanan lokal PostgreSQL 17, Supabase GoTrue serta PostgREST. Karena keterbatasan disk, pengujian memakai layanan tersebut dengan proxy lokal, bukan keseluruhan stack Supabase CLI. Proxy uji mengizinkan origin localhost dan header Supabase; perubahan proxy berada di luar repo. Migrasi asli tidak diedit. Hasil database berasal dari query SDK terhadap database lokal, bukan mock. Akun dan data yang dibuat runner dibersihkan pada akhir tes.

`npm run test:kana` adalah runner browser tambahan khusus modul ini. Test memeriksa penanda baris dipelajari, cakupan seluruh progres sesuai jenis kana, cakupan kosong, skor, pengulangan soal salah dan pengabaian soal ji/zu. Web Speech API diuji untuk parameter teks dan `ja-JP`; kualitas/keluaran audio nyata bergantung suara yang tersedia pada perangkat dan tidak dinilai dari browser headless.

Screenshot tersimpan sebagai hasil pengujian di test-results/ (diabaikan Git). Laporan pengiriman mencantumkan hash final, ukuran artefak, dan output git bundle verify.

## Keputusan implementasi

- Tidak menambah fitur di luar Tugas 2 dan tidak memulai modul SRS/review.
- Arah romaji → kana melewati semua soal ji/zu (termasuk jika cakupan hanya memuat satu variannya), sehingga tidak ada pertanyaan ambigu. Arah kana → romaji tetap memuat semuanya.
- ID `hira:di`, `hira:du`, `kata:di`, `kata:du` membedakan karakter yang bacaannya tetap ji/zu.
- Pengecoh boleh berasal dari baris lain dalam jenis kana yang sama agar baris pendek tetap memiliki empat opsi. Bentuk mirip/keluarga baris diprioritaskan; romaji opsi selalu berbeda.
- Progres baru ditandai selesai setelah seluruh kartu dibalik dan penyimpanan berhasil. Soal berikutnya menunggu log tersimpan; kegagalan ditampilkan dengan tombol coba lagi.
- Flashcard dan QuizCard generik, tidak mengimpor data kana. Tidak memakai library UI besar.

## Yang belum dikerjakan

Tidak ada fitur wajib Tugas 2 yang tersisa. Deploy/tes Supabase hosted, kualitas suara perangkat nyata, dan audit pembaca layar fisik tidak dilakukan. Push/PR sengaja tidak dilakukan sesuai instruksi. Bundle incremental membutuhkan commit dasar a67a979 sudah tersedia pada repo penerima; ZIP tidak membawa riwayat Git.

## File dibuat/diubah dibanding a67a979

- `README.md`
- `package-lock.json`
- `package.json`
- `src/app/(app)/kana/learn/page.tsx`
- `src/app/(app)/kana/page.tsx`
- `src/app/(app)/kana/quiz/page.tsx`
- `src/app/globals.css`
- `src/components/flashcard.tsx`
- `src/components/kana/kana-catalog.tsx`
- `src/components/kana/kana-learn.tsx`
- `src/components/kana/kana-quiz.tsx`
- `src/components/kana/kana-selectors.tsx`
- `src/components/kana/use-kana-progress.ts`
- `src/components/quiz-card.tsx`
- `src/lib/data/kana.test.ts`
- `src/lib/data/kana.ts`
- `src/lib/kana/progress.ts`
- `src/lib/kana/quiz.test.ts`
- `src/lib/kana/quiz.ts`
- `tests/kana-integration.mjs`
- `vitest.config.mts`
- `docs/verifikasi-tugas-2.md`

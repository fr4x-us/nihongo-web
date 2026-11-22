# Verifikasi Tugas 1

Tanggal: 22 November 2026. Branch: `tugas-1-kerangka`. Lingkup: kerangka, autentikasi, skema, landing dan layout placeholder. Tidak ada fitur belajar tambahan atau deployment produksi.

## Kriteria selesai

| Kriteria | Hasil dan bukti |
| --- | --- |
| `npm run build` | Lulus, Next.js 15.5.29, build produksi; halaman privat dirender dinamis. |
| `npm run lint` | Lulus, nol error dan nol warning. `next-env.d.ts` hasil generator Next diabaikan lint. |
| Daftar dan profil otomatis | Lulus melalui formulir browser ke Supabase Auth lokal. Query SDK memastikan profil milik akun baru, nama sesuai, `plan = free`. Metadata `plan: premium` tidak mengubah nilai default profil. |
| `/dashboard` tanpa login | Lulus, diarahkan ke `/login`; enam halaman privat lain juga diperiksa. |
| Logout | Lulus melalui tombol Keluar; kunjungan ulang dashboard kembali ke login. Masuk ulang dan reload sesi juga lulus. |
| User tidak dapat mengubah plan | SDK klien dengan anon key dan sesi pengguna melakukan UPDATE `plan`, UPDATE `plan_expires_at`, UPDATE gabungan nama+plan, serta upsert plan. Semua ditolak, HTTP 403 / SQLSTATE `42501`; nilai plan tetap `free`. UPDATE nama sendiri berhasil, UPDATE plan dengan service role berhasil. |
| Landing/layout 375px dan 1280px | Lulus pemeriksaan browser dan inspeksi empat screenshot. Tidak ada overflow horizontal; semua tujuh menu tampil dan target sentuh setidaknya 44px. Desktop sidebar, mobile navigasi bawah dua baris. |
| Secret/env | Pemindaian berkas tidak menemukan JWT, private key, atau service key. Hanya `.env.example` tanpa nilai dilacak. `.env.local`, `.env.production`, dan `.envcustom` diabaikan Git. |

Tambahan: `npm run typecheck` dan `git diff --check` lulus. Migrasi SQL dieksekusi sukses. Query katalog PostgreSQL memastikan RLS aktif pada 9 tabel. Pengujian SDK membuktikan pemisahan pemilik pada profiles/cards/review_logs/question_attempts/quiz_attempts serta larangan tulis katalog dari klien.

## Lingkungan dan batas verifikasi

- Chromium headless, build Next.js produksi lokal.
- PostgreSQL 17, Supabase GoTrue v2.198.0, PostgREST v16.5. Layanan nyata lokal, bukan mock.
- Supabase CLI standar gagal mengunduh/mengekstrak image PostgreSQL besar karena kapasitas disk. Verifikasi memakai PostgreSQL Alpine dan komponen Auth/PostgREST yang sama, dengan proxy lokal untuk rute/CORS. SQL `auth.uid()` dan role `anon/authenticated/service_role` dipersiapkan di harness lokal; migrasi aplikasi diterapkan tanpa perubahan. Harness tidak menjadi bagian aplikasi.
- Pengujian signup memakai konfirmasi email lokal nonaktif. Pengiriman email nyata dan callback konfirmasi pada proyek Supabase hosted belum diuji karena proyek/kredensial hosted tidak diberikan. Implementasi callback PKCE disediakan.
- Tidak ada migrasi ke database hosted, publikasi web, atau push ke main. Akun dan record uji dibersihkan oleh runner.
- Screenshot lokal: `test-results/landing-375.png`, `landing-1280.png`, `layout-375.png`, `layout-1280.png`; tidak di-commit.

## Keputusan implementasi yang tidak dirinci dalam brief

- Next.js 15.5.29 untuk dukungan `middleware.ts`; Node.js 22+.
- Fontsource menyajikan Inter dan Noto Sans JP secara lokal.
- Navigasi mobile dua baris agar tujuh label terbaca.
- `question_attempts` menggunakan PK gabungan `(user_id, question_id, answered_at)` agar riwayat percobaan tidak tertimpa.
- Hak UPDATE profil dibatasi ke nama, XP, streak, dan tanggal belajar; `plan_expires_at` turut dilindungi. Profil tidak dapat dibuat/dihapus melalui klien; trigger mengelola pembuatan.
- Callback konfirmasi email, halaman 404 berbahasa Indonesia, konfigurasi Supabase lokal, dan runner integrasi merupakan dukungan teknis untuk brief, bukan fitur belajar tambahan.
- Logout hanya mengakhiri sesi perangkat/browser saat ini.

## Belum dikerjakan

Tidak ada implementasi Tugas 1 yang ditunda. Verifikasi hosted/email nyata dan penerapan migrasi ke proyek hosted belum dilakukan. Halaman belajar dan `srs.ts` sengaja tetap placeholder/kosong sesuai instruksi.

## Daftar berkas dibuat/diubah terhadap main

- `.env.example`
- `.gitignore`
- `README.md`
- `docs/verifikasi-tugas-1.md`
- `eslint.config.mjs`
- `next-env.d.ts`
- `package-lock.json`
- `package.json`
- `postcss.config.mjs`
- `src/app/(app)/dashboard/page.tsx`
- `src/app/(app)/grammar/page.tsx`
- `src/app/(app)/jlpt/page.tsx`
- `src/app/(app)/kana/page.tsx`
- `src/app/(app)/kanji/page.tsx`
- `src/app/(app)/layout.tsx`
- `src/app/(app)/review/page.tsx`
- `src/app/(app)/vocab/page.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/auth/callback/route.ts`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/not-found.tsx`
- `src/app/page.tsx`
- `src/components/app-navigation.tsx`
- `src/components/auth-form.tsx`
- `src/components/logout-button.tsx`
- `src/data/.gitkeep`
- `src/lib/data/.gitkeep`
- `src/lib/srs.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/config.ts`
- `src/lib/supabase/server.ts`
- `src/middleware.ts`
- `supabase/.gitignore`
- `supabase/config.toml`
- `supabase/migrations/0001_init.sql`
- `tests/integration.mjs`
- `tsconfig.json`

## Status pengiriman

Empat commit implementasi/verifikasi dibuat pada branch lokal `tugas-1-kerangka`, disusul commit dokumentasi status pengiriman. Pengiriman melalui HTTPS Git ditolak HTTP 403. Pembuatan branch melalui connector GitHub juga ditolak HTTP 403 `Resource not accessible by integration`. Karena branch belum dapat dibuat di remote, Pull Request ke `main` belum dibuka. Tidak ada perubahan pada `main`.

Koneksi/integrasi GitHub memerlukan izin Contents read/write untuk mengirim branch dan Pull requests read/write untuk membuka PR. Ini penolakan akses dari GitHub, bukan kegagalan build atau pengujian aplikasi. Patch, bundle Git, dan ZIP sumber disiapkan dari HEAD lokal tanpa `.env.local`, dependensi terpasang, atau hasil build.

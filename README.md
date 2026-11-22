# Nihongo Wakaranai

Kerangka aplikasi belajar bahasa Jepang untuk penutur bahasa Indonesia. Next.js App Router, TypeScript, Tailwind CSS, dan Supabase. Halaman belajar masih berupa judul placeholder; belum ada konten pelajaran, SRS, pembayaran, atau fitur kuis.

## Menjalankan

Gunakan Node.js 22+ dan npm.

```sh
npm ci
cp .env.example .env.local
```

Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` di `.env.local` dari proyek Supabase. Keduanya merupakan konfigurasi klien; **jangan** gunakan service-role key sebagai `NEXT_PUBLIC_*`. Semua `.env*` diabaikan Git kecuali `.env.example` yang kosong. Isi konfigurasi sebelum `npm run build` karena Next.js memasukkan variabel publik saat build.

```sh
npm run dev
# http://localhost:3000
npm run lint
npm run build
npm start
```

Font Inter dan Noto Sans JP disediakan lokal melalui paket Fontsource, tanpa permintaan Google Fonts saat build. Slot ilustrasi masih kotak abu-abu; tidak menggunakan aset ilustrasi eksternal.

## Database dan autentikasi

Untuk proyek Supabase yang baru/kosong, jalankan isi `supabase/migrations/0001_init.sql` melalui SQL Editor. Alternatif menggunakan Supabase CLI:

```sh
npx supabase login
npx supabase link --project-ref ID_PROYEK
npx supabase db push
```

Migrasi membuat sembilan tabel, trigger profil, grants, dan RLS. Jangan menerapkan ulang SQL secara manual jika migrasi sudah tercatat; gunakan migrasi lanjutan untuk perubahan. Tidak ada migrasi produksi yang dijalankan otomatis oleh aplikasi.

Di Authentication → URL Configuration, set **Site URL** ke origin aplikasi dan tambahkan **Redirect URL** `http://localhost:3000/auth/callback` (serta origin deployment jika ada). Aktifkan provider email/password. Jika konfirmasi email aktif, pengguna harus membuka tautan email pada browser yang sama saat mendaftar (alur PKCE), lalu sesi ditukar melalui `/auth/callback`. Atur minimal kata sandi 8 karakter di Supabase. Konfigurasi CLI lokal memakai konfirmasi email nonaktif untuk pengujian; pengaturan proyek hosted terpisah.

`profiles` dibuat oleh trigger dari `auth.users`; hanya `display_name` diambil dari metadata pengguna. `plan` selalu default `free`. Klien hanya boleh memperbarui `display_name`, `xp`, `streak`, dan `last_study_date` miliknya. `plan` dan `plan_expires_at` hanya dapat diperbarui lewat backend tepercaya dengan service role (atau administrasi database), tidak melalui klien biasa. Tidak ada service-role key dalam aplikasi.

Katalog `vocab`, `kanji`, `grammar`, dan `questions` hanya dapat dibaca pengguna login. Flag `is_premium` disimpan sesuai skema, belum dipakai untuk pembatasan konten. Catatan belajar hanya dapat diakses pemilik. PK `question_attempts` adalah `(user_id, question_id, answered_at)` agar pertanyaan dapat dicoba lebih dari sekali.

## Supabase lokal dan pemeriksaan integrasi

Dengan Docker berjalan:

```sh
npx supabase start
# Hanya jika perlu membangun ulang database LOKAL (menghapus data lokal):
npx supabase db reset --local
```

Salin API URL dan anon key lokal dari `npx supabase status` ke `.env.local`. Untuk uji saja, set `SUPABASE_TEST_SERVICE_ROLE_KEY` ke service-role key **lokal** dalam environment shell atau `.env.local`. Key ini tidak dipakai aplikasi; runner menolak URL Supabase nonlokal. Jangan menyalin nilai key ke laporan atau commit.

```sh
npm run build
npm start
# Terminal lain:
CHROMIUM_PATH=/path/to/chromium npm run test:integration
```

Runner default memakai `/usr/bin/chromium`. Pasang Chromium atau atur `CHROMIUM_PATH` sesuai mesin. `TEST_BASE_URL` default `http://127.0.0.1:3000`. Runner membuat akun sementara lewat UI, memeriksa profil otomatis, percobaan UPDATE/upsert paket dari SDK klien, akses lintas pemilik, hak baca katalog, redirect, login/logout, serta viewport 375/1280. Akun dan data uji dibersihkan di akhir. Screenshot ada di `test-results/` (diabaikan Git). Konfirmasi email hosted dan pengiriman email nyata perlu diuji lagi saat proyek hosted tersedia.

## Struktur

- `src/app/page.tsx`: landing publik.
- `src/app/(auth)/login`: masuk sekaligus daftar.
- `src/app/(app)`: layout terproteksi, dashboard/kana/review/vocab/kanji/grammar/jlpt.
- `src/app/auth/callback`: penyelesaian konfirmasi email PKCE.
- `src/components`: form akun, navigasi, tombol keluar.
- `src/lib/supabase`: klien browser/server dan konfigurasi.
- `src/lib/srs.ts`: sengaja kosong; `src/lib/data/` dan `src/data/` disiapkan.
- `supabase/migrations/0001_init.sql`: skema, trigger, grants, dan RLS.

Navigasi mobile memakai dua baris supaya tujuh menu tetap terbaca di 375px; desktop memakai sidebar. Semua halaman belajar hanya menampilkan judul. Keluar mengakhiri sesi perangkat/browser saat ini.

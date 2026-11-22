'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
export function AuthForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email')).trim();
    const password = String(form.get('password'));
    try {
      const supabase = createClient();
      const { data, error } = register
        ? await supabase.auth.signUp({ email, password, options: { data: { display_name: String(form.get('display_name')).trim() }, emailRedirectTo: `${window.location.origin}/auth/callback` } })
        : await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const messages: Record<string, string> = { invalid_credentials: 'Email atau kata sandi tidak sesuai.', email_not_confirmed: 'Konfirmasi emailmu terlebih dahulu.', user_already_exists: 'Email sudah terdaftar. Silakan masuk.', weak_password: 'Kata sandi terlalu lemah. Gunakan kombinasi yang lebih kuat.', over_email_send_rate_limit: 'Terlalu banyak permintaan. Coba lagi beberapa saat.', over_request_rate_limit: 'Terlalu banyak percobaan. Coba lagi beberapa saat.' };
        setMessage(messages[error.code ?? ''] ?? 'Permintaan belum berhasil. Periksa isianmu dan coba lagi.');
      } else if (data.session) { router.replace('/dashboard'); router.refresh(); }
      else { setMessage('Periksa emailmu untuk mengonfirmasi pendaftaran, lalu masuk.'); }
    } catch { setMessage('Layanan belum dapat dihubungi. Coba lagi nanti.'); }
    finally { setBusy(false); }
  }
  return <>
    <div className="mb-7 grid grid-cols-2 gap-2 rounded-xl bg-aqua p-1" aria-label="Pilihan akun">{[false, true].map(mode => <button key={String(mode)} type="button" aria-pressed={register === mode} disabled={busy} onClick={() => { setRegister(mode); setMessage(''); }} className={`rounded-lg px-4 py-3 font-semibold ${register === mode ? 'bg-white shadow-sm' : ''}`}>{mode ? 'Daftar' : 'Masuk'}</button>)}</div>
    <h1 className="text-2xl font-bold">{register ? 'Mulai langkah pertamamu' : 'Selamat datang kembali'}</h1><p className="mt-2 mb-6 text-[#45666a]">{register ? 'Buat akun untuk mulai belajar bahasa Jepang.' : 'Masuk dan lanjutkan perjalanan belajarmu.'}</p>
    {!configured && <p role="status" className="mb-5 rounded-xl bg-orange/20 p-4">Layanan akun belum tersedia. Silakan kembali nanti.</p>}
    <form onSubmit={submit} className="space-y-5">
      {register && <div><label htmlFor="display_name">Nama panggilan</label><input id="display_name" name="display_name" autoComplete="nickname" maxLength={80} required disabled={busy}/></div>}
      <div><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required disabled={busy}/></div>
      <div><label htmlFor="password">Kata sandi</label><input id="password" name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 8 : undefined} maxLength={128} required disabled={busy} aria-describedby={register ? 'password-help' : undefined}/>{register && <p id="password-help" className="mt-2 text-sm text-[#45666a]">Gunakan minimal 8 karakter.</p>}</div>
      <p role="status" aria-live="polite" className="text-sm leading-relaxed">{message}</p>
      <button className="button w-full" disabled={busy || !configured}>{busy ? 'Sebentar, ya…' : register ? 'Buat Akun' : 'Masuk'}</button>
    </form>
  </>;
}

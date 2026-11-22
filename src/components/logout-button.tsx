'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
export function LogoutButton() {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function logout() {
    setBusy(true); setError('');
    try {
      const { error } = await createClient().auth.signOut({ scope: 'local' });
      if (error) throw error;
      router.replace('/login'); router.refresh();
    } catch { setError('Gagal keluar. Coba lagi.'); setBusy(false); }
  }
  return <div><button onClick={logout} disabled={busy} className="rounded-xl border border-[#93bfc3] px-4 py-3 text-sm font-semibold">{busy ? 'Sebentar…' : 'Keluar'}</button>{error && <p role="alert" className="mt-2 text-sm">{error}</p>}</div>;
}

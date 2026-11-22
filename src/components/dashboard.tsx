'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { loadDashboard } from '@/lib/review/progress';
type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;
export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let current = true;
    setLoading(true); setError('');
    loadDashboard(new Date()).then(result => { if (current) setData(result); })
      .catch(() => { if (current) setError('Dashboard belum dapat dimuat. Silakan coba lagi.'); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [revision]);
  return <div className="mx-auto max-w-4xl"><h1 className="text-3xl font-bold">Dashboard</h1>
    {loading ? <p className="mt-6" role="status">Memuat progres…</p> : error ? <section className="card mt-6 p-6"><p role="status">{error}</p><button type="button" className="button mt-4" onClick={() => setRevision(n => n + 1)}>Coba lagi</button></section>
      : data && <><p className="mt-3 text-xl">{data.displayName?.trim() ? `Halo, ${data.displayName}!` : 'Halo, teman belajar!'}</p><p className="mt-2 text-[#45666a]">Sedikit latihan hari ini membantu kamu mengingat lebih lama.</p>
        <div className="my-6 grid gap-4 sm:grid-cols-3"><section className="card p-6"><h2 className="text-xl font-bold">Jatuh tempo: {data.due}</h2><p className="mt-2 text-sm text-[#45666a]">Kartu yang siap diulang.</p></section><section className="card p-6"><h2 className="text-xl font-bold">Total kartu: {data.total}</h2><p className="mt-2 text-sm text-[#45666a]">Kana yang sudah kamu pelajari.</p></section><section className="card p-6"><h2 className="text-xl font-bold">Streak: {data.streak} hari</h2><p className="mt-2 text-sm text-[#45666a]">Catatan hari belajar pada profilmu.</p></section></div>
        <section className="card p-7"><h2 className="text-xl font-bold">Waktunya mengingat kembali</h2><p className="mt-3 text-[#45666a]">{data.due ? 'Mulai dengan maksimal 20 kartu dalam satu sesi.' : 'Belum ada kartu jatuh tempo. Kamu bisa belajar kana sambil menunggu jadwal berikutnya.'}</p><div className="mt-6 flex flex-wrap gap-4">{data.due ? <Link href="/review" className="button">Mulai review</Link> : <button type="button" className="button" disabled>Mulai review</button>}<Link href="/kana" className="inline-flex min-h-12 items-center rounded-xl border border-[#93bfc3] px-5 font-semibold">Belajar kana</Link></div></section>
      </>}
  </div>;
}

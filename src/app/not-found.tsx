import Link from 'next/link';
export default function NotFound() {
  return <main className="mx-auto max-w-lg px-5 py-20"><div className="card p-8"><h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1><Link href="/" className="button mt-6">Kembali ke beranda</Link></div></main>;
}

import Link from 'next/link';
import { AuthForm } from '@/components/auth-form';
import { getSupabaseConfig } from '@/lib/supabase/config';
export default function Login() {
  return <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-5 py-10"><Link href="/" className="mb-8 text-center text-xl font-bold">Nihongo Wakaranai<span className="text-orange">.</span></Link><div className="card p-6 sm:p-9"><AuthForm configured={Boolean(getSupabaseConfig())}/></div><Link href="/" className="mt-7 text-center text-sm underline">Kembali ke beranda</Link></main>;
}

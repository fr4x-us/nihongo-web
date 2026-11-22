import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { AppNavigation } from '@/components/app-navigation';
import { LogoutButton } from '@/components/logout-button';
export const dynamic = 'force-dynamic';
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!getSupabaseConfig()) redirect('/login');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <div className="min-h-dvh md:grid md:grid-cols-[250px_1fr]"><a href="#konten" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-4">Lewati navigasi</a><aside className="md:sticky md:top-0 md:h-dvh md:border-r md:border-[#bedfe1] md:bg-white md:p-6"><Link href="/" className="hidden text-xl leading-snug font-bold md:mb-10 md:block">Nihongo<br/>Wakaranai<span className="text-orange">.</span></Link><AppNavigation/></aside><div className="min-w-0"><header className="flex items-center justify-between gap-4 px-5 py-5 md:px-10"><Link href="/" className="text-base font-bold md:text-lg">Nihongo Wakaranai</Link><LogoutButton/></header><main id="konten" className="px-5 pt-5 pb-[calc(11rem+env(safe-area-inset-bottom))] md:px-10 md:pb-10">{children}</main></div></div>;
}

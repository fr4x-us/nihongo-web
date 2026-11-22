'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
const items = [['/dashboard', 'Dashboard', '⌂'], ['/kana', 'Kana', 'あ'], ['/review', 'Review', '↻'], ['/vocab', 'Kotoba', '言'], ['/kanji', 'Kanji', '字'], ['/grammar', 'Bunpou', '文'], ['/jlpt', 'Latihan JLPT', '✓']];
export function AppNavigation() {
  const pathname = usePathname();
  return <nav aria-label="Navigasi utama" className="fixed inset-x-0 bottom-0 z-20 border-t border-[#bedfe1] bg-white pb-[env(safe-area-inset-bottom)] md:static md:border-0 md:bg-transparent md:p-0"><ul className="grid grid-cols-4 gap-1 p-2 md:block md:space-y-2 md:p-0">{items.map(([href, label, icon]) => { const active = pathname === href || pathname.startsWith(href + '/'); return <li key={href}><Link href={href} aria-current={active ? 'page' : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-sm font-semibold md:flex-row md:justify-start md:gap-3 md:px-4 md:text-base ${active ? 'bg-aqua text-[#216c74]' : 'text-[#45666a] hover:bg-aqua'}`}><span aria-hidden="true" className="font-japanese text-xl md:w-6 md:text-center">{icon}</span><span>{label}</span></Link></li>; })}</ul></nav>;
}

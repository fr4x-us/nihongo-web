import type { Metadata } from 'next';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/noto-sans-jp/400.css';
import './globals.css';
export const metadata: Metadata = { title: 'Nihongo Wakaranai', description: 'Belajar bahasa Jepang dari nol, selangkah demi selangkah, dalam bahasa Indonesia.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}

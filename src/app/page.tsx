import Link from 'next/link';
const features = [
  ['ことば', 'Kotoba', 'Kenali kosakata yang dipakai dalam percakapan sehari-hari.'],
  ['漢字', 'Kanji', 'Mulai mengenal karakter Jepang, bacaan, dan maknanya.'],
  ['文法', 'Bunpou', 'Pahami pola kalimat dengan penjelasan bahasa Indonesia.'],
  ['日本語', 'Latihan JLPT', 'Kenali jenis soal ujian kemampuan bahasa Jepang.'],
];
export default function Home() {
  return <div className="mx-auto max-w-6xl px-5 md:px-10">
    <header className="flex items-center justify-between gap-4 py-7"><Link href="/" className="text-lg font-bold">Nihongo<span className="text-[#267780]"> Wakaranai</span></Link><Link href="/login" className="font-semibold underline-offset-4 hover:underline">Masuk</Link></header>
    <main>
      <section className="grid items-center gap-10 py-10 md:grid-cols-2 md:py-20">
        <div><p className="mb-5 text-sm font-bold tracking-widest text-[#267780]">BAHASA JEPANG, DARI NOL</p><h1 className="text-5xl leading-[1.12] font-bold tracking-tight md:text-6xl">Nihongo<br/>Wakaranai<span className="text-orange">.</span></h1><p className="mt-6 max-w-md text-lg leading-relaxed text-[#45666a]">Belum mengerti? Tidak apa-apa. Mulai langkah kecilmu belajar bahasa Jepang, dengan panduan bahasa Indonesia yang ramah untuk pemula.</p><Link href="/login" className="button mt-8">Mulai Gratis</Link><p className="mt-4 text-sm text-[#45666a]">Pelan-pelan, dari tidak paham jadi paham.</p></div>
        <div className="flex aspect-[5/4] items-center justify-center rounded-[2rem] border-2 border-dashed border-gray-300 bg-gray-200 p-8 text-center text-gray-600" role="img" aria-label="Tempat ilustrasi belajar bahasa Jepang"><div><span className="font-japanese block text-6xl" lang="ja">あ</span><span className="mt-5 block text-sm">Ilustrasi akan hadir di sini</span></div></div>
      </section>
      <section className="pb-16"><div className="mb-7"><h2 className="text-2xl font-bold">Kenalan dulu, yuk.</h2><p className="mt-2 text-[#45666a]">Empat bagian untuk menemani perjalanan belajarmu.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{features.map(([jp, title, description]) => <article key={title} className="card p-6"><span lang="ja" className="font-japanese mb-5 inline-flex h-12 min-w-12 items-center justify-center rounded-xl bg-aqua px-3 text-xl text-[#267780]">{jp}</span><h3 className="text-lg font-bold">{title}</h3><p className="mt-3 leading-relaxed text-[#45666a]">{description}</p></article>)}</div></section>
    </main><footer className="border-t border-[#bedfe1] py-6 text-sm text-[#45666a]">Nihongo Wakaranai · Belajar satu langkah setiap hari.</footer>
  </div>;
}

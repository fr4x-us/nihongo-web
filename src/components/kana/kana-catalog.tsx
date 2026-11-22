'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { kanaRows, rowKana, type Kana, type KanaScript } from '@/lib/data/kana';
import { useKanaProgress } from './use-kana-progress';
function KanaPanel({ entry, close }: { entry: Kana; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [speech, setSpeech] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    dialog.current?.showModal();
    setSpeech('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);
    return () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); };
  }, []);
  function play() {
    setError('');
    try {
      const utterance = new SpeechSynthesisUtterance(entry.char);
      utterance.lang = 'ja-JP'; utterance.rate = 0.8;
      const voice = window.speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith('ja'));
      if (voice) utterance.voice = voice;
      utterance.onerror = event => { if (!['canceled','interrupted'].includes(event.error)) setError('Suara belum tersedia di perangkat ini.'); };
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance);
    } catch { setError('Suara belum tersedia di perangkat ini.'); }
  }
  return <dialog ref={dialog} onCancel={close} onClose={close} aria-labelledby="kana-detail-title" className="card fixed inset-0 m-auto w-[calc(100%_-_2.5rem)] max-w-sm p-7 text-center text-[#183f43] backdrop:bg-[#183f43]/40">
    <h2 id="kana-detail-title" className="text-lg font-bold">Kenali kana</h2><p lang="ja" className="font-japanese my-7 text-7xl">{entry.char}</p><p className="text-2xl font-semibold">{entry.romaji}</p>
    <div className="mt-6 flex flex-wrap justify-center gap-3">{speech && <button type="button" onClick={play} className="button">Putar suara</button>}<button type="button" onClick={close} className="rounded-xl border border-[#93bfc3] px-5 py-3 font-semibold">Tutup</button></div><p role="status" className="mt-3 text-sm">{error}</p>
  </dialog>;
}
export function KanaCatalog() {
  const [script, setScript] = useState<KanaScript>('hiragana');
  const [view, setView] = useState<'basic' | 'dakuten' | 'yoon'>('basic');
  const [selected, setSelected] = useState<Kana | null>(null);
  const progress = useKanaProgress();
  const rows = kanaRows.filter(r => r.group === view || (view === 'dakuten' && r.group === 'handakuten'));
  return <div className="mx-auto max-w-4xl">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-bold">Kana</h1><p className="mt-2 text-[#45666a]">Kenali hurufnya, pelajari per baris, lalu coba kuis.</p></div><Link href="/kana/quiz" className="button">Mulai kuis</Link></div>
    <div className="mb-5 flex rounded-xl bg-white p-1" role="tablist" aria-label="Jenis kana">{(['hiragana','katakana'] as const).map((s,i) => <button type="button" role="tab" id={`tab-${s}`} aria-selected={script === s} aria-controls="kana-table-panel" tabIndex={script === s ? 0 : -1} key={s} onClick={() => setScript(s)} onKeyDown={e => { if (['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) { e.preventDefault(); const next = e.key === 'Home' ? 'hiragana' : e.key === 'End' ? 'katakana' : i === 0 ? 'katakana' : 'hiragana'; setScript(next); document.getElementById(`tab-${next}`)?.focus(); } }} className={`min-h-12 flex-1 rounded-lg px-3 font-semibold ${script === s ? 'bg-teal text-[#102f32]' : ''}`}>{s === 'hiragana' ? 'Hiragana' : 'Katakana'}</button>)}</div>
    <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Pilihan tampilan">{(['basic','dakuten','yoon'] as const).map(v => <button type="button" key={v} aria-pressed={view === v} onClick={() => setView(v)} className={`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold ${view === v ? 'border-[#267780] bg-white' : 'border-[#bedfe1]'}`}>{{basic:'Dasar',dakuten:'Dakuten',yoon:'Yoon'}[v]}</button>)}</div>
    {view === 'dakuten' && <p className="mb-4 text-sm text-[#45666a]">Dakuten dan handakuten. じ / ぢ dibaca ji; ず / づ dibaca zu.</p>}
    <div role="status" className="mb-4 text-sm">{progress.loading ? 'Memuat progres…' : progress.error || 'Ketuk karakter untuk melihat bacaan dan mendengarkan suara.'}</div>{progress.error && <button type="button" className="button mb-4" onClick={progress.reload}>Muat ulang progres</button>}
    <div id="kana-table-panel" role="tabpanel" aria-labelledby={`tab-${script}`} className="space-y-4">{rows.map(({row}) => {
      const entries = rowKana(script,row); const learned = !progress.loading && !progress.error && entries.every(k => progress.learned.has(k.id));
      const slots: (Kana | null)[] = row === 'ya' ? [entries[0],null,entries[1],null,entries[2]] : row === 'wa' ? [entries[0],null,null,null,entries[1]] : row === 'n' ? [entries[0],null,null,null,null] : entries;
      return <section key={row} aria-label={`Baris ${row}`} className="card p-3 sm:p-5"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">Baris {row}</h2>{learned && <span className="rounded-full bg-[#e6f6eb] px-3 py-1 text-sm text-[#207343]">✓ Dipelajari</span>}<Link href={`/kana/learn?script=${script}&row=${row}`} className="rounded-lg px-2 py-2 text-sm font-semibold text-[#216c74] underline">Pelajari baris {row}</Link></div>
        <div className={`grid gap-1.5 sm:gap-3 ${view === 'yoon' ? 'grid-cols-3' : 'grid-cols-5'}`} role="group" aria-label={`Karakter baris ${row}`}>{slots.map((entry,i) => entry ? <button type="button" key={entry.id} onClick={() => setSelected(entry)} aria-label={`${entry.char}, ${entry.romaji}`} className="flex min-h-20 min-w-0 flex-col items-center justify-center rounded-xl bg-aqua px-1 py-3 hover:bg-[#cfedf0]"><span lang="ja" className={`font-japanese ${view === 'yoon' ? 'text-3xl' : 'text-2xl sm:text-3xl'}`}>{entry.char}</span><span className="mt-1 text-sm">{entry.romaji}</span></button> : <div key={`empty-${i}`} aria-hidden="true"/>)}</div>
      </section>;
    })}</div>{selected && <KanaPanel entry={selected} close={() => setSelected(null)}/>}
  </div>;
}

'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { Flashcard } from '@/components/flashcard';
import { rowKana, type KanaScript } from '@/lib/data/kana';
import { saveLearnedRow } from '@/lib/kana/progress';
import { RowSelect, ScriptSelect } from './kana-selectors';
export function KanaLearn({ initialScript, initialRow }: { initialScript: KanaScript; initialRow: string }) {
  const [script, setScript] = useState(initialScript); const [row, setRow] = useState(initialRow);
  const [stage, setStage] = useState<'setup' | 'study' | 'done'>('setup');
  const [index, setIndex] = useState(0); const [seen, setSeen] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const saveLock = useRef(false);
  const entries = rowKana(script,row); const entry = entries[index];
  function start() { setIndex(0); setSeen(new Set()); setError(''); setStage('study'); }
  async function finish() {
    if (saveLock.current || seen.size !== entries.length) return;
    saveLock.current = true; setSaving(true); setError('');
    try { await saveLearnedRow(entries); setStage('done'); }
    catch { setError('Progres belum tersimpan. Coba simpan lagi sebelum melanjutkan.'); }
    finally { setSaving(false); saveLock.current = false; }
  }
  return <div className="mx-auto max-w-2xl"><Link href="/kana" prefetch={false} className="text-sm underline">Kembali ke tabel kana</Link><h1 className="mt-4 mb-3 text-3xl font-bold">Belajar kana</h1>
    {stage === 'setup' && <div className="card mt-6 space-y-5 p-6"><p className="text-[#45666a]">Pilih satu baris. Balik setiap kartu untuk melihat bacaannya.</p><ScriptSelect value={script} onChange={setScript}/><RowSelect value={row} onChange={setRow}/><button type="button" className="button w-full" onClick={start}>Mulai belajar</button></div>}
    {stage === 'study' && <><div className="my-5 flex justify-between gap-3 text-sm"><p>{script === 'hiragana' ? 'Hiragana' : 'Katakana'} · Baris {row}</p><p role="status">Kartu {index+1} dari {entries.length}</p></div>
      <Flashcard key={entry.id} front={<span lang="ja" className="font-japanese">{entry.char}</span>} back={entry.romaji} onReveal={() => setSeen(previous => new Set([...previous,entry.id]))}/>
      <div className="mt-5 flex flex-wrap justify-between gap-3"><button type="button" disabled={index === 0 || saving} onClick={() => setIndex(n => n-1)} className="min-h-12 rounded-xl border border-[#93bfc3] px-4 py-3 font-semibold">Sebelumnya</button>{index < entries.length-1 ? <button type="button" className="button" disabled={!seen.has(entry.id)} onClick={() => setIndex(n => n+1)}>Kartu berikutnya</button> : <button type="button" className="button" disabled={seen.size !== entries.length || saving} onClick={finish}>{saving ? 'Menyimpan…' : error ? 'Coba simpan lagi' : 'Selesaikan baris'}</button>}</div>
      <p role="status" className="mt-4 text-sm">{error || (!seen.has(entry.id) ? 'Balik kartu dahulu untuk melihat romaji.' : '')}</p>
    </>}
    {stage === 'done' && <section className="card mt-6 p-7"><p className="text-sm font-semibold text-[#267780]">✓ Progres tersimpan</p><h2 className="mt-3 text-2xl font-bold">Baris {row} selesai!</h2><p className="mt-3 text-[#45666a]">Kamu sudah melihat {entries.length} kartu. Sekarang coba ingat tanpa melihat jawabannya.</p><Link className="button mt-6" href={`/kana/quiz?script=${script}&row=${row}`}>Kuis baris ini</Link><button type="button" className="mt-4 block min-h-11 text-sm underline" onClick={() => setStage('setup')}>Pilih baris lain</button></section>}
  </div>;
}

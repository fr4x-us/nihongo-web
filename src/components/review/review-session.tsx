'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Flashcard } from '@/components/flashcard';
import { grades, previewIntervals, type Grade } from '@/lib/srs';
import { resolveItem } from '@/lib/review/items';
import { cardState, loadReviewSession, prepareRating, saveRating, type PendingRating, type ReviewCard } from '@/lib/review/progress';
const gradeLabels: Record<Grade, string> = { 1: 'Lagi', 3: 'Sulit', 4: 'Baik', 5: 'Mudah' };
export function ReviewSession() {
  const [queue, setQueue] = useState<ReviewCard[]>([]);
  const [initialCount, setInitialCount] = useState(0);
  const [counts, setCounts] = useState<Record<Grade, number>>({ 1: 0, 3: 0, 4: 0, 5: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [revision, setRevision] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const pending = useRef<PendingRating | null>(null);
  const lock = useRef(false);
  const lastRatingTime = useRef(0);
  useEffect(() => {
    let current = true;
    setLoading(true); setLoadError('');
    loadReviewSession(new Date()).then(cards => {
      if (current) { setQueue(cards); setInitialCount(cards.length); }
    }).catch(() => { if (current) setLoadError('Review belum dapat dimuat. Silakan coba lagi.'); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [revision]);
  const completed = grades.reduce((sum, grade) => sum + counts[grade], 0);
  const card = queue[0];
  const item = card && resolveItem(card.item_type, card.item_id);
  const intervals = card ? previewIntervals(cardState(card), new Date()) : null;

  async function persist() {
    if (lock.current || !pending.current) return;
    lock.current = true; setSaving(true); setSaveError('');
    const rating = pending.current;
    try {
      await saveRating(rating);
      setCounts(previous => ({ ...previous, [rating.grade]: previous[rating.grade] + 1 }));
      setQueue(previous => rating.grade === 1 ? [...previous.slice(1), rating.card] : previous.slice(1));
      setRevealed(false); pending.current = null;
    } catch {
      setSaveError('Penilaian belum selesai disimpan. Coba lagi untuk melanjutkan kartu ini.');
    } finally { lock.current = false; setSaving(false); }
  }
  function rate(grade: Grade) {
    if (!card || !revealed || lock.current || pending.current) return;
    const time = Math.max(Date.now(), lastRatingTime.current + 1);
    lastRatingTime.current = time;
    pending.current = prepareRating(card, grade, new Date(time));
    void persist();
  }
  return <div className="mx-auto max-w-2xl">
    <h1 className="text-3xl font-bold">Review</h1>
    <p className="mt-2 mb-6 text-[#45666a]">Ingat kembali sedikit demi sedikit. Balik kartu, lalu nilai seberapa mudah kamu mengingatnya.</p>
    {loading ? <p role="status">Memuat kartu…</p> : loadError ? <section className="card p-6"><p role="status">{loadError}</p><button type="button" className="button mt-4" onClick={() => setRevision(n => n + 1)}>Coba lagi</button></section>
      : !initialCount ? <section className="card p-7"><h2 className="text-xl font-bold">Belum ada kartu jatuh tempo</h2><p className="mt-3">Kamu sudah selesai untuk saat ini. Yuk, pelajari baris kana berikutnya.</p><Link href="/kana" className="button mt-6">Belajar kana</Link></section>
      : !card ? <section className="card p-7"><h2 className="text-2xl font-bold">Review selesai</h2><p role="status" className="mt-4 text-lg font-semibold">Jumlah penilaian: {completed}</p><p className="mt-2 text-sm text-[#45666a]">Dari {initialCount} kartu. Kartu yang diulang dihitung pada setiap penilaian.</p><dl className="my-6 grid grid-cols-2 gap-3">{grades.map(grade => <div key={grade} className="rounded-xl bg-aqua p-4"><dt>{gradeLabels[grade]}</dt><dd className="mt-1 text-2xl font-bold">{counts[grade]}</dd></div>)}</dl><Link href="/dashboard" className="button">Kembali ke dashboard</Link></section>
      : item && <><p role="status" className="mb-5 text-sm">{initialCount} kartu dalam sesi · {queue.length} tersisa · {completed} penilaian selesai</p>
        <Flashcard key={`${card.item_type}:${card.item_id}:${completed}`} front={item.front} back={item.back} onReveal={() => setRevealed(true)}/>
        {revealed && intervals ? <div role="group" aria-label="Nilai ingatanmu" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{grades.map(grade => <button type="button" key={grade} disabled={saving || Boolean(saveError)} onClick={() => rate(grade)} className={`min-h-20 rounded-xl border-2 px-3 py-3 font-bold ${grade === 1 ? 'border-orange bg-[#fff0e0]' : 'border-[#85bdc2] bg-white hover:bg-[#d2edef]'}`}><span className="block">{gradeLabels[grade]}</span><span className="mt-1 block text-sm font-normal">{intervals[grade]}</span></button>)}</div> : <p className="mt-5 text-sm">Balik kartu untuk melihat jawaban dan tombol penilaian.</p>}
        <p role="status" className="mt-4 text-sm">{saving ? 'Menyimpan penilaian…' : saveError}</p>
        {saveError && <button type="button" className="button mt-3" disabled={saving} onClick={() => void persist()}>Coba lagi</button>}
      </>}
  </div>;
}

'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { QuizCard } from '@/components/quiz-card';
import { kana, rowKana, type Kana, type KanaScript } from '@/lib/data/kana';
import { makeQuiz, type KanaQuestion, type QuizDirection } from '@/lib/kana/quiz';
import { saveKanaAnswer } from '@/lib/kana/progress';
import { RowSelect, ScriptSelect } from './kana-selectors';
import { useKanaProgress } from './use-kana-progress';
export function KanaQuiz({ initialScript, initialRow }: { initialScript: KanaScript; initialRow: string }) {
  const [script, setScript] = useState(initialScript); const [scope, setScope] = useState(initialRow);
  const [direction, setDirection] = useState<QuizDirection>('kana-romaji');
  const [stage, setStage] = useState<'setup' | 'playing' | 'done'>('setup');
  const [questions, setQuestions] = useState<KanaQuestion[]>([]); const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null); const [score, setScore] = useState(0); const [wrong, setWrong] = useState<Kana[]>([]);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [setupError, setSetupError] = useState(''); const answerLock = useRef(false); const saveLock = useRef(false);
  const progress = useKanaProgress(); const question = questions[index];
  const pool = scope === 'learned' ? kana.filter(k => k.script === script && progress.learned.has(k.id)) : rowKana(script,scope);
  function start(entries: readonly Kana[]) {
    const nextQuestions = makeQuiz(entries,direction);
    if (!nextQuestions.length) { setSetupError('Belum ada kana yang bisa ditanyakan. Pelajari satu baris dahulu atau ganti cakupan.'); return; }
    setQuestions(nextQuestions); setIndex(0); setScore(0); setWrong([]); setSelected(null); setSaveState('idle'); setSetupError(''); answerLock.current = false; setStage('playing');
  }
  async function persist(answerId: string) {
    if (saveLock.current) return;
    saveLock.current = true; setSaveState('saving');
    try { await saveKanaAnswer(question.answer,answerId === question.answer.id); setSaveState('saved'); }
    catch { setSaveState('error'); }
    finally { saveLock.current = false; }
  }
  function answer(id: string) {
    if (answerLock.current) return;
    answerLock.current = true; setSelected(id);
    if (id === question.answer.id) setScore(n => n+1); else setWrong(previous => [...previous,question.answer]);
    void persist(id);
  }
  function next() {
    if (saveState !== 'saved') return;
    if (index === questions.length-1) { setStage('done'); return; }
    setIndex(n => n+1); setSelected(null); setSaveState('idle'); answerLock.current = false;
  }
  const label = (k: Kana) => direction === 'kana-romaji' ? k.romaji : <span lang="ja" className="font-japanese">{k.char}</span>;
  return <div className="mx-auto max-w-2xl"><Link href="/kana" prefetch={false} className="text-sm underline">Kembali ke tabel kana</Link><h1 className="mt-4 mb-3 text-3xl font-bold">Kuis kana</h1>
    {stage === 'setup' && <div className="card mt-6 space-y-5 p-6"><ScriptSelect value={script} onChange={setScript}/><RowSelect value={scope} onChange={setScope} learnedOption/><div><label className="label" htmlFor="quiz-direction">Arah soal</label><select id="quiz-direction" className="input" value={direction} onChange={e => setDirection(e.target.value as QuizDirection)}><option value="kana-romaji">Kana ke romaji</option><option value="romaji-kana">Romaji ke kana</option></select></div>
      {direction === 'romaji-kana' && <p className="rounded-xl bg-aqua p-4 text-sm">Soal ji dan zu dilewati karena masing-masing punya dua karakter yang benar.</p>}
      {scope === 'learned' && <p role="status" className="text-sm">{progress.loading ? 'Memuat progres…' : progress.error || `${pool.length} kana sudah dipelajari untuk script ini.`}</p>}{scope === 'learned' && progress.error && <button type="button" className="button" onClick={progress.reload}>Muat ulang progres</button>}
      <p role="status" className="text-sm">{setupError}</p><button type="button" className="button w-full" disabled={scope === 'learned' && (progress.loading || Boolean(progress.error))} onClick={() => start(pool)}>Mulai kuis</button>
    </div>}
    {stage === 'playing' && question && <><p className="my-5 text-sm">Soal {index+1} dari {questions.length} · {direction === 'kana-romaji' ? 'Pilih romaji yang sesuai' : 'Pilih kana yang sesuai'}</p>
      <QuizCard prompt={direction === 'kana-romaji' ? <span lang="ja" className="font-japanese">{question.answer.char}</span> : question.answer.romaji} options={question.options.map(k => ({id:k.id,label:label(k)}))} selectedId={selected} correctId={selected ? question.answer.id : null} locked={selected !== null} onAnswer={answer} feedback={!selected ? '' : selected === question.answer.id ? 'Benar! Bagus sekali.' : `Belum tepat. ${question.answer.char} dibaca ${question.answer.romaji}.`}/>
      <p role="status" className="mt-4 text-sm">{saveState === 'saving' ? 'Menyimpan jawaban…' : saveState === 'error' ? 'Jawaban belum tersimpan. Coba simpan lagi sebelum melanjutkan.' : ''}</p>
      {saveState === 'error' && selected && <button type="button" className="button mt-3" onClick={() => persist(selected)}>Coba simpan jawaban</button>}
      <button type="button" className="button mt-4 w-full" disabled={saveState !== 'saved'} onClick={next}>{index === questions.length-1 ? 'Lihat hasil' : 'Soal berikutnya'}</button>
    </>}
    {stage === 'done' && <section className="card mt-6 p-7"><h2 className="text-2xl font-bold">Kuis selesai</h2><p className="my-6 text-4xl font-bold" role="status">Skor {score} / {questions.length}</p><p className="text-[#45666a]">{wrong.length ? `${wrong.length} soal bisa kamu coba lagi.` : 'Semua jawaban benar. Kerja bagus!'}</p>{wrong.length > 0 && <button type="button" className="button mt-6 w-full" onClick={() => start(wrong)}>Ulangi soal yang salah</button>}<button type="button" className="mt-5 min-h-11 underline" onClick={() => setStage('setup')}>Atur kuis baru</button></section>}
  </div>;
}

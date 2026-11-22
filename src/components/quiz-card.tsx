'use client';
import type { ReactNode } from 'react';
export type QuizOption = { id: string; label: ReactNode };
export type QuizCardProps = { prompt: ReactNode; options: readonly QuizOption[]; selectedId: string | null; correctId: string | null; feedback: string; locked?: boolean; onAnswer: (id: string) => void };
export function QuizCard({ prompt, options, selectedId, correctId, feedback, locked = false, onAnswer }: QuizCardProps) {
  return <section className="card p-6 sm:p-8">
    <div className="mb-8 text-center text-6xl font-semibold" aria-label="Soal">{prompt}</div>
    <fieldset><legend className="mb-4 font-semibold">Pilih satu jawaban</legend><div className="grid grid-cols-2 gap-3">{options.map(option => {
      const correct = correctId === option.id;
      const wrong = selectedId === option.id && correctId !== null && !correct;
      return <button type="button" key={option.id} aria-pressed={selectedId === option.id} aria-disabled={locked} onClick={() => { if (!locked) onAnswer(option.id); }} className={`min-h-20 rounded-xl border-2 px-3 py-4 text-xl ${correct ? 'border-[#207343] bg-[#e6f6eb]' : wrong ? 'border-[#ae422f] bg-[#fff0e9]' : 'border-[#bedfe1] hover:bg-aqua'}`}>
        {option.label}{correct && <span className="mt-1 block text-sm">✓ Jawaban benar</span>}{wrong && <span className="mt-1 block text-sm">Jawabanmu</span>}
      </button>;
    })}</div></fieldset><p role="status" aria-live="polite" className="mt-5 min-h-6 font-semibold">{feedback}</p>
  </section>;
}

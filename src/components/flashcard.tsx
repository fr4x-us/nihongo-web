'use client';
import { useState, type ReactNode } from 'react';
export type FlashcardProps = { front: ReactNode; back: ReactNode; onReveal?: () => void };
export function Flashcard({ front, back, onReveal }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);
  function flip() { if (!flipped) onReveal?.(); setFlipped(!flipped); }
  return <button type="button" onClick={flip} aria-pressed={flipped} className="card flex min-h-64 w-full flex-col items-center justify-center gap-6 p-8 text-center">
    <span className="sr-only">{flipped ? 'Jawaban. Balik untuk melihat soal.' : 'Soal. Balik untuk melihat jawaban.'}</span>
    <span className="text-6xl font-semibold">{flipped ? back : front}</span>
    <span className="text-sm text-[#45666a]">Ketuk atau tekan Enter / Spasi untuk membalik</span>
  </button>;
}

import { expect, it } from 'vitest';
import { kana } from '../data/kana';
import { makeQuestion, makeQuiz, isAmbiguous } from './quiz';
it('setiap soal memiliki empat opsi unik tanpa pengecoh beromaji sama', () => {
  for (const answer of kana) for (const random of [() => 0, () => 0.49, () => 0.99]) {
    const q = makeQuestion(answer, random);
    expect(q.options).toHaveLength(4);
    expect(q.options.filter(o => o.id === answer.id)).toHaveLength(1);
    expect(new Set(q.options.map(o => o.romaji)).size).toBe(4);
    expect(new Set(q.options.map(o => o.char)).size).toBe(4);
    for (const o of q.options) { expect(o.script).toBe(answer.script); if (o.id !== answer.id) expect(o.romaji).not.toBe(answer.romaji); }
  }
});
it('melewati semua ji/zu ambigu pada romaji ke kana termasuk pool satu baris', () => {
  expect(makeQuiz(kana,'kana-romaji')).toHaveLength(208);
  expect(makeQuiz(kana,'romaji-kana')).toHaveLength(200);
  for (const q of makeQuiz(kana.filter(k => k.row === 'da'),'romaji-kana')) expect(isAmbiguous(q.answer)).toBe(false);
});
it('pool kecil tetap mendapat empat opsi dan pool kosong aman', () => {
  const n = kana.find(k => k.id === 'hira:n')!;
  expect(makeQuiz([n],'kana-romaji')[0].options).toHaveLength(4);
  expect(makeQuiz([],'kana-romaji')).toEqual([]);
});
it('memprioritaskan bentuk mirip', () => {
  const q = makeQuestion(kana.find(k => k.id === 'kata:shi')!, () => 0.5);
  expect(q.options.some(k => k.id === 'kata:tsu')).toBe(true);
});

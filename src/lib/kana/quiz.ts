import { kana, type Kana } from '../data/kana';
export type QuizDirection = 'kana-romaji' | 'romaji-kana';
export type KanaQuestion = { answer: Kana; options: Kana[] };
export function shuffled<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function isAmbiguous(entry: Kana): boolean {
  return kana.some(k => k.script === entry.script && k.id !== entry.id && k.romaji === entry.romaji);
}
// Prioritas: bentuk serupa, keluarga baris, baris sama, kelompok sama, lalu script sama.
const similar = [['shi','tsu'],['so','n'],['nu','me'],['ru','ro'],['wa','re','ne']];
const families = [['ka','ga'],['sa','za'],['ta','da'],['ha','ba','pa'],['kya','gya'],['sha','ja'],['hya','bya','pya']];
function proximity(a: Kana, b: Kana): number {
  const key = (k: Kana) => k.id.split(':')[1];
  if (similar.some(set => set.includes(key(a)) && set.includes(key(b)))) return 0;
  if (families.some(set => set.includes(a.row) && set.includes(b.row)) && a.romaji.at(-1) === b.romaji.at(-1)) return 1;
  if (a.row === b.row) return 2;
  return a.group === b.group ? 3 : 4;
}
export function makeQuestion(answer: Kana, random: () => number = Math.random): KanaQuestion {
  const candidates = shuffled(kana.filter(k => k.script === answer.script && k.romaji !== answer.romaji), random)
    .sort((a, b) => proximity(answer, a) - proximity(answer, b));
  const used = new Set([answer.romaji]);
  const distractors: Kana[] = [];
  for (const candidate of candidates) {
    if (!used.has(candidate.romaji)) { distractors.push(candidate); used.add(candidate.romaji); }
    if (distractors.length === 3) break;
  }
  return { answer, options: shuffled([answer, ...distractors], random) };
}
export function makeQuiz(pool: readonly Kana[], direction: QuizDirection, random: () => number = Math.random): KanaQuestion[] {
  // ji/zu sengaja dilewati pada arah romaji → kana, dihitung terhadap seluruh script.
  return shuffled(pool.filter(k => direction === 'kana-romaji' || !isAmbiguous(k)), random).map(k => makeQuestion(k, random));
}

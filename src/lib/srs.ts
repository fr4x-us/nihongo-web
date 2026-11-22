export type SrsState = {
  ease: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
};
export type Grade = 1 | 3 | 4 | 5;
export const grades: readonly Grade[] = [1, 3, 4, 5];
export type GradedState = SrsState & { dueAt: Date };
const dayMs = 24 * 60 * 60 * 1000;
const roundedEase = (value: number) => Math.max(1.3, Math.round(value * 100) / 100);

export function gradeCard(state: SrsState, grade: Grade, now: Date): GradedState {
  if (grade === 1) {
    return { ease: Math.max(1.3, state.ease - 0.2), intervalDays: 0,
      repetitions: 0, lapses: state.lapses + 1, dueAt: new Date(now.getTime() + 10 * 60 * 1000) };
  }
  const repetitions = state.repetitions + 1;
  const intervalDays = repetitions === 1 ? 1 : repetitions === 2 ? 6
    : Math.max(state.intervalDays + 1, Math.round(state.intervalDays * state.ease));
  const distance = 5 - grade;
  const ease = roundedEase(state.ease + 0.1 - distance * (0.08 + distance * 0.02));
  return { ease, intervalDays, repetitions, lapses: state.lapses,
    dueAt: new Date(now.getTime() + intervalDays * dayMs) };
}

export function formatInterval(days: number): string {
  if (days === 0) return '10 menit';
  return days < 30 ? `${days} hari` : `${Math.round(days / 30)} bulan`;
}
export function previewIntervals(state: SrsState, now: Date): Record<Grade, string> {
  return Object.fromEntries(grades.map(grade => [grade, formatInterval(gradeCard(state, grade, now).intervalDays)])) as Record<Grade, string>;
}

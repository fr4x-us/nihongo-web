import { describe, expect, it } from 'vitest';
import { formatInterval, gradeCard, grades, previewIntervals, type SrsState } from './srs';
const fresh: SrsState = { ease: 2.5, intervalDays: 0, repetitions: 0, lapses: 0 };
const now = new Date('2026-11-22T23:55:00Z');
describe('SM-2 dengan waktu eksplisit', () => {
  it('grade 4: interval 1, 6, 15 dan ease tetap 2.5', () => {
    let state = fresh;
    for (const [i, days] of [1, 6, 15].entries()) {
      state = gradeCard(state, 4, now);
      expect(state).toMatchObject({ intervalDays: days, ease: 2.5, repetitions: i + 1, lapses: 0 });
    }
  });
  it('grade 5 memakai ease lama: interval 1, 6, 16', () => {
    let state = fresh;
    for (const [i, days] of [1, 6, 16].entries()) {
      state = gradeCard(state, 5, now);
      expect(state).toMatchObject({ intervalDays: days, ease: [2.6, 2.7, 2.8][i] });
    }
  });
  it('grade 3 menghasilkan ease 2.36 dan interval satu hari', () => {
    expect(gradeCard(fresh, 3, now)).toMatchObject({ ease: 2.36, intervalDays: 1, repetitions: 1 });
  });
  it('Lagi mereset pengulangan dan jatuh tempo tepat sepuluh menit', () => {
    expect(gradeCard({ ...fresh, repetitions: 5, intervalDays: 30 }, 1, now)).toEqual({
      ease: 2.3, repetitions: 0, intervalDays: 0, lapses: 1, dueAt: new Date('2026-11-23T00:05:00Z'),
    });
  });
  it('ease tidak melewati batas bawah 1.3', () => {
    let state = { ...fresh, ease: 1.4 };
    for (let i = 0; i < 20; i++) {
      state = gradeCard(state, 1, now);
      expect(state.ease).toBe(1.3);
      expect(state.lapses).toBe(i + 1);
    }
  });
  it('interval terus naik dan dueAt menggunakan kelipatan 24 jam', () => {
    const result = gradeCard({ ...fresh, repetitions: 2, ease: 1.3, intervalDays: 1 }, 3, now);
    expect(result.intervalDays).toBe(2);
    expect(result.dueAt.getTime() - now.getTime()).toBe(2 * 86400000);
  });
  it('format batas hari/bulan dan preview konsisten', () => {
    for (const [days, label] of [[0,'10 menit'],[1,'1 hari'],[29,'29 hari'],[30,'1 bulan'],[44,'1 bulan'],[45,'2 bulan'],[90,'3 bulan']] as const) expect(formatInterval(days)).toBe(label);
    for (const state of [fresh, { ...fresh, repetitions: 5, intervalDays: 30 }]) {
      const labels = previewIntervals(state, now);
      for (const grade of grades) expect(labels[grade]).toBe(formatInterval(gradeCard(state, grade, now).intervalDays));
    }
  });
  it('tidak memutasi state atau now dan hasil deterministik', () => {
    const state = Object.freeze({ ...fresh });
    const timestamp = now.getTime();
    expect(gradeCard(state, 5, now)).toEqual(gradeCard(state, 5, now));
    expect(state).toEqual(fresh); expect(now.getTime()).toBe(timestamp);
  });
});

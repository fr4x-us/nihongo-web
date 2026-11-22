import { describe, expect, it } from 'vitest';
import { kana, rowKana } from './kana';
describe('data kana', () => {
  for (const script of ['hiragana', 'katakana'] as const) {
    it(`${script}: jumlah dan identitas`, () => {
      const entries = kana.filter(k => k.script === script);
      expect(entries).toHaveLength(104);
      for (const [group, total] of Object.entries({basic:46,dakuten:20,handakuten:5,yoon:33})) expect(entries.filter(k => k.group === group)).toHaveLength(total);
      const yoon = entries.filter(k => k.group === 'yoon');
      expect(new Set(yoon.map(k => k.row)).size).toBe(11);
      for (const row of new Set(yoon.map(k => k.row))) expect(rowKana(script,row)).toHaveLength(3);
      expect(new Set(entries.map(k => k.char)).size).toBe(104);
    });
  }
  it('id unik dan romaji terisi', () => {
    expect(new Set(kana.map(k => k.id)).size).toBe(208);
    for (const k of kana) { expect(k.id).toMatch(/^(hira|kata):[a-z]+$/); expect(k.romaji.trim()).not.toBe(''); }
    expect(kana.find(k => k.char === 'ぢ')?.id).toBe('hira:di');
    expect(kana.find(k => k.char === 'づ')?.id).toBe('hira:du');
  });
  it('bacaan Hepburn dan tidak menambah kana ekstensi', () => {
    for (const [char,romaji] of Object.entries({'し':'shi','つ':'tsu','ふ':'fu','を':'wo','ぢ':'ji','づ':'zu','しゃ':'sha','ちゅ':'chu','じょ':'jo'})) expect(kana.find(k => k.char === char)?.romaji).toBe(romaji);
    expect(kana.some(k => ['ヴ','ファ'].includes(k.char))).toBe(false);
  });
});

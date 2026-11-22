import { expect, it } from 'vitest';
import { resolveItem, supportedItemTypes } from './items';
it('registry hanya mendukung kana valid dan aman untuk ID/tipe tak dikenal', () => {
  expect(supportedItemTypes).toEqual(['kana']);
  expect(resolveItem('kana', 'hira:shi')?.back).toBe('shi');
  expect(resolveItem('kana', 'kata:di')?.back).toBe('ji');
  expect(resolveItem('kana', 'missing')).toBeNull();
  for (const type of ['vocab', 'kanji', 'grammar', 'toString', '__proto__']) expect(resolveItem(type, 'hira:a')).toBeNull();
});

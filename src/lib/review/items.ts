import { createElement, type ReactNode } from 'react';
import { kana } from '../data/kana';

export type ReviewItem = { front: ReactNode; back: ReactNode };
type Resolver = (id: string) => ReviewItem | null;
const kanaById = new Map(kana.map(entry => [entry.id, entry]));
export const itemRegistry: Readonly<Record<string, Resolver>> = {
  kana: id => {
    const entry = kanaById.get(id);
    return entry ? { front: createElement('span', { lang: 'ja', className: 'font-japanese' }, entry.char), back: entry.romaji } : null;
  },
};
export const supportedItemTypes = Object.keys(itemRegistry);
export function resolveItem(type: string, id: string): ReviewItem | null {
  return Object.hasOwn(itemRegistry, type) ? itemRegistry[type](id) : null;
}

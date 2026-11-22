import { authenticatedClient } from '../supabase/session';
import { gradeCard, type Grade, type SrsState } from '../srs';
import { resolveItem, supportedItemTypes } from './items';

export type ReviewCard = {
  user_id: string; item_type: string; item_id: string;
  ease: number; interval_days: number; repetitions: number; lapses: number; due_at: string;
};
type SessionClient = Awaited<ReturnType<typeof authenticatedClient>>;
const cardColumns = 'user_id,item_type,item_id,ease,interval_days,repetitions,lapses,due_at';
export function cardState(card: ReviewCard): SrsState {
  return { ease: card.ease, intervalDays: card.interval_days, repetitions: card.repetitions, lapses: card.lapses };
}

// Satu filter dukungan untuk dashboard dan sesi; paginasi tetap melewati ID lama/tidak dikenal.
async function loadSupportedCards({ client, userId }: SessionClient, dueBefore?: Date, limit?: number) {
  const cards: ReviewCard[] = [];
  const pageSize = limit ?? 500;
  for (let from = 0; ; from += pageSize) {
    let query = client.from('cards').select(cardColumns).eq('user_id', userId)
      .in('item_type', supportedItemTypes).order('due_at').order('item_type').order('item_id');
    if (dueBefore) query = query.lte('due_at', dueBefore.toISOString());
    const { data, error } = await query.range(from, from + pageSize - 1);
    if (error) throw new Error('Kartu belum dapat dimuat. Silakan coba lagi.');
    for (const row of data) {
      if (resolveItem(row.item_type, row.item_id)) cards.push(row);
      if (limit && cards.length === limit) return cards;
    }
    if (data.length < pageSize) return cards;
  }
}
export async function loadReviewSession(now: Date): Promise<ReviewCard[]> {
  return loadSupportedCards(await authenticatedClient(), now, 20);
}
export async function loadDashboard(now: Date) {
  const session = await authenticatedClient();
  const [cards, profile] = await Promise.all([
    loadSupportedCards(session),
    session.client.from('profiles').select('display_name,streak').eq('id', session.userId).single(),
  ]);
  if (profile.error) throw new Error('Profil belum dapat dimuat. Silakan coba lagi.');
  return { displayName: profile.data.display_name as string | null, streak: profile.data.streak as number,
    total: cards.length, due: cards.filter(card => Date.parse(card.due_at) <= now.getTime()).length };
}

export type PendingRating = {
  card: ReviewCard; grade: Grade; reviewedAt: string;
  updated: boolean; logged: boolean;
};
export function prepareRating(card: ReviewCard, grade: Grade, now: Date): PendingRating {
  const next = gradeCard(cardState(card), grade, now);
  return { card: { ...card, ease: next.ease, interval_days: next.intervalDays, repetitions: next.repetitions,
    lapses: next.lapses, due_at: next.dueAt.toISOString() }, grade, reviewedAt: now.toISOString(), updated: false, logged: false };
}

// Objek pending dipertahankan sepanjang retry: waktu/nilai sama, langkah sukses tidak diulang.
export async function saveRating(pending: PendingRating): Promise<void> {
  const { client, userId } = await authenticatedClient();
  if (userId !== pending.card.user_id) throw new Error('Sesi berubah. Silakan masuk kembali.');
  const card = pending.card;
  if (!pending.updated) {
    const { error } = await client.from('cards').update({ ease: card.ease, interval_days: card.interval_days,
      repetitions: card.repetitions, lapses: card.lapses, due_at: card.due_at })
      .eq('user_id', userId).eq('item_type', card.item_type).eq('item_id', card.item_id).select('item_id').single();
    if (error) throw new Error('Jadwal kartu belum tersimpan. Silakan coba lagi.');
    pending.updated = true;
  }
  if (!pending.logged) {
    // Readback juga menangani respons INSERT yang hilang setelah server menyimpan log.
    const { data, error: readError } = await client.from('review_logs').select('id')
      .eq('user_id', userId).eq('item_type', card.item_type).eq('item_id', card.item_id)
      .eq('grade', pending.grade).eq('reviewed_at', pending.reviewedAt).limit(1);
    if (readError) throw new Error('Catatan review belum dapat diperiksa. Silakan coba lagi.');
    if (!data.length) {
      const { error } = await client.from('review_logs').insert({ user_id: userId, item_type: card.item_type,
        item_id: card.item_id, grade: pending.grade, reviewed_at: pending.reviewedAt });
      if (error) throw new Error('Catatan review belum tersimpan. Silakan coba lagi.');
    }
    pending.logged = true;
  }
}

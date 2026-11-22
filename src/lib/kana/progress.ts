import { createClient } from '../supabase/client';
import type { Kana } from '../data/kana';
async function authenticatedClient() {
  const client = createClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error('Silakan masuk kembali untuk menyimpan progres.');
  return { client, userId: data.user.id };
}
export async function loadKanaProgress(): Promise<string[]> {
  const { client, userId } = await authenticatedClient();
  // Paginasi agar tidak terpotong oleh batas respons server.
  const ids: string[] = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await client.from('cards').select('item_id').eq('user_id', userId).eq('item_type', 'kana').order('item_id').range(from, from + 499);
    if (error) throw new Error('Progres belum dapat dimuat. Coba lagi.');
    ids.push(...data.map(row => row.item_id));
    if (data.length < 500) return ids;
  }
}
export async function saveLearnedRow(entries: readonly Kana[]): Promise<void> {
  const { client, userId } = await authenticatedClient();
  const { error } = await client.from('cards').upsert(entries.map(entry => ({ user_id: userId, item_type: 'kana', item_id: entry.id })), { onConflict: 'user_id,item_type,item_id', ignoreDuplicates: true });
  if (error) throw new Error('Progres belum tersimpan. Coba simpan lagi sebelum melanjutkan.');
}
export async function saveKanaAnswer(entry: Kana, correct: boolean): Promise<void> {
  const { client, userId } = await authenticatedClient();
  const { error } = await client.from('review_logs').insert({ user_id: userId, item_type: 'kana', item_id: entry.id, grade: correct ? 5 : 1 });
  if (error) throw new Error('Jawaban belum tersimpan. Coba simpan lagi sebelum melanjutkan.');
}

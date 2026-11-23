import { createClient } from './client';

// Identitas di klien berasal dari sesi; otorisasi tetap ditegakkan RLS di server.
export async function authenticatedClient() {
  const client = createClient();
  const { data, error } = await client.auth.getSession();
  if (error || !data.session) throw new Error('Silakan masuk kembali untuk menyimpan progres.');
  return { client, userId: data.session.user.id };
}

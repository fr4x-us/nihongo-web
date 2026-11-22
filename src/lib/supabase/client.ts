import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseConfig } from './config';
export function createClient() {
  const config = getSupabaseConfig();
  if (!config) throw new Error('Konfigurasi Supabase belum tersedia.');
  return createBrowserClient(config.url, config.key);
}

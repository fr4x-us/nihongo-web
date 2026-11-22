import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseConfig } from '@/lib/supabase/config';
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (code && getSupabaseConfig()) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch { /* Kegagalan jaringan/pertukaran kode ditangani oleh pesan tetap di login. */ }
  }
  return NextResponse.redirect(new URL('/login?pesan=konfirmasi', request.url));
}

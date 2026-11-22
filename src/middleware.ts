import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig } from '@/lib/supabase/config';
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set('Cache-Control', 'private, no-store');
  const isLogin = request.nextUrl.pathname === '/login';
  const config = getSupabaseConfig();
  if (!config) return isLogin ? response : NextResponse.redirect(new URL('/login', request.url));
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        response.headers.set('Cache-Control', 'private, no-store');
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // getUser memvalidasi sesi ke server Auth, bukan mempercayai cookie mentah.
  const { data: { user } } = await supabase.auth.getUser();
  if ((!user && !isLogin) || (user && isLogin)) {
    const redirect = NextResponse.redirect(new URL(user ? '/dashboard' : '/login', request.url));
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
    redirect.headers.set('Cache-Control', 'private, no-store');
    return redirect;
  }
  return response;
}
export const config = { matcher: ['/login', '/dashboard/:path*', '/kana/:path*', '/review/:path*', '/vocab/:path*', '/kanji/:path*', '/grammar/:path*', '/jlpt/:path*'] };

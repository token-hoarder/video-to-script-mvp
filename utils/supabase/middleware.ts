import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname;
  console.log(`DEBUG_AUTH: middleware — pathname: "${pathname}" | user: ${user ? user.id : 'none'} | is_anonymous: ${user?.is_anonymous ?? 'n/a'}`);

  // Safety net: non-anonymous user with no profile row = orphaned pre-trigger
  // dev account or a corrupted session. Sign them out server-side so the client
  // lands fresh and useGuestAuth creates a proper anonymous session.
  if (user && !user.is_anonymous) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile) {
      console.log(`DEBUG_AUTH: middleware — ORPHAN ACCOUNT detected (${user.id}), signing out and redirecting → /`);
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  if (
    !user &&
    !pathname.startsWith('/login') &&
    !pathname.startsWith('/auth')
  ) {
    console.log(`DEBUG_AUTH: middleware — no user on "${pathname}", redirecting → /login`);
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in, redirect away from the login page
  if (
    user &&
    pathname.startsWith('/login')
  ) {
    console.log(`DEBUG_AUTH: middleware — authenticated user (${user.id}) on /login, redirecting → /`);
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  console.log(`DEBUG_AUTH: middleware — allowing "${pathname}" to proceed`);

  return supabaseResponse
}

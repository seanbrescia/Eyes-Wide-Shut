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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Protected routes - require authentication
  const protectedRoutes = ['/venue-portal', '/admin', '/tickets', '/profile']
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', path)
    // Preserve referral code through auth redirects
    const ref = request.nextUrl.searchParams.get('ref')
    if (ref) {
      url.searchParams.set('ref', ref)
    }
    return NextResponse.redirect(url)
  }

  // Admin routes - require admin role
  if (path.startsWith('/admin') && user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Venue portal routes (except apply) - require venue_owner role
  if (path.startsWith('/venue-portal') && !path.startsWith('/venue-portal/apply') && user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'venue_owner' && userData?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Redirect logged-in users away from auth pages
  if ((path === '/login' || path === '/signup') && user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

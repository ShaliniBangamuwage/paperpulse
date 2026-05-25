import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Allow admin login page without auth
  if (pathname === '/admin/login') {
    if (user) {
      // Already logged in — check if admin
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }
    return supabaseResponse
  }

  // Protected user routes
  const protectedRoutes = [
    '/dashboard', '/paper', '/saved', '/discover',
    '/library', '/upgrade', '/roadmap', '/chat',
    '/tracker', '/reading', '/collections', '/citations',
    '/profile', '/compare'
  ]
  const isProtected = protectedRoutes.some(r => pathname.startsWith(r))
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Admin routes — check role
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|signup|forgot-password|auth|admin/accept-invite|$).*)'],
}
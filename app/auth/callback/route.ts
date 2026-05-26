import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login`)
  }

  // Collect cookies set by Supabase during the exchange so we can
  // attach them explicitly to the redirect response. This avoids
  // race conditions where the Set-Cookie headers were not applied
  // to the redirect response on the first OAuth redirect.
  let cookiesToApply: unknown[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(items: unknown[]) {
            cookiesToApply = items
          },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data?.user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  let { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle()

  if (!profile) {
    await supabase.from('profiles').insert({
      id: data.user.id,
      email: data.user.email,
      role: 'user',
    })

    profile = { role: 'user' }
  }

  // Create redirect and attach any cookies Supabase requested.
  const target = profile.role === 'admin' ? '/admin' : '/dashboard'
  const response = NextResponse.redirect(`${origin}${target}`)

  if (cookiesToApply && cookiesToApply.length) {
    try {
      cookiesToApply.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options)
      )
    } catch (e) {
      console.error('Failed to attach auth cookies to redirect', e)
    }
  }

  return response
}
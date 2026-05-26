import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {}
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  console.log('AUTH RESULT:', { user: data?.user?.email, error: error?.message })

  if (error || !data?.user) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  const { data: profile } = await supabase
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
  }

  const role = profile?.role ?? 'user'
  const redirectTo = role === 'admin' ? '/admin' : '/dashboard'

  // ✅ Use absolute URL with no extra params
  const finalUrl = new URL(redirectTo, origin)
  return NextResponse.redirect(finalUrl.toString())
}
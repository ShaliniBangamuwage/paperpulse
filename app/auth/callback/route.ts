import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()

    const {
      data,
      error,
    } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {

      // Check profile safely
      let { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle()

      // Create profile if missing
      if (!profile) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email,
          role: 'user',
        })

        profile = { role: 'user' }
      }

      // Redirect user
      if (profile.role === 'admin') {
        return NextResponse.redirect(
          `${origin}/admin`
        )
      }

      return NextResponse.redirect(
        `${origin}/dashboard`
      )
    }

    console.error(error)
  }

  return NextResponse.redirect(
    `${origin}/login`
  )
}
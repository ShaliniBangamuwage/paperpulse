import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { email, invitedBy } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const supabase = createAdminClient()

    // Check if user already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('email', email)
      .single()

    if (existing) {
      // User exists — just make them admin
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('email', email)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ message: `${email} is now an admin` })
    }

    // User doesn't exist — send invite via Supabase Auth
    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { role: 'admin' }
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ message: `Invite sent to ${email}` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
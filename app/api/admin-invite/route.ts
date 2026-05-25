import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, invitedBy } = await request.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const supabase = createAdminClient()

    // Check if already an admin
    const { data: existing } = await supabase
      .from('profiles').select('role, email').eq('email', email).single()
    if (existing?.role === 'admin') {
      return NextResponse.json({ error: 'This email is already an admin' }, { status: 400 })
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')

    // Save invite
    const { error: inviteError } = await supabase.from('admin_invites').insert({
      email,
      token,
      invited_by: invitedBy,
      used: false,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })
    if (inviteError) throw inviteError

    // Send email
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/accept-invite?token=${token}`

    const { error: emailError } = await resend.emails.send({
      from: 'PaperPulse <onboarding@resend.dev>',
      to: email,
      subject: 'You have been invited as a PaperPulse Admin',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <div style="background: #f97316; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">PaperPulse</h1>
            <p style="color: #fed7aa; margin: 8px 0 0;">Admin Invitation</p>
          </div>

          <h2 style="color: #111827;">You've been invited!</h2>
          <p style="color: #6b7280; line-height: 1.6;">
            You have been invited to join PaperPulse as an administrator.
            Click the button below to accept your invitation and set up your admin account.
          </p>

          <a href="${inviteUrl}"
            style="display: block; background: #f97316; color: white; text-align: center;
            padding: 14px 24px; border-radius: 10px; text-decoration: none;
            font-weight: 600; margin: 24px 0;">
            Accept Admin Invitation →
          </a>

          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            This link expires in 24 hours.<br/>
            If you didn't expect this email, you can safely ignore it.
          </p>

          <div style="border-top: 1px solid #f3f4f6; margin-top: 24px; padding-top: 16px;">
            <p style="color: #d1d5db; font-size: 11px; text-align: center;">
              PaperPulse · Turn research papers into project ideas
            </p>
          </div>
        </div>
      `
    })

    if (emailError) throw emailError

    return NextResponse.json({ success: true, message: `Invite sent to ${email}` })
  } catch (error: any) {
    console.error('Invite error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
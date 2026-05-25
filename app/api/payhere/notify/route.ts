import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()
    const orderId = body.get('order_id')?.toString() || ''
    const statusCode = body.get('status_code')?.toString()
    const email = body.get('email')?.toString() || ''
    const amount = parseFloat(body.get('payhere_amount')?.toString() || '9.00')

    console.log('PayHere notify received:', { orderId, statusCode, email })

    if (statusCode !== '2') {
      return NextResponse.json({ received: true })
    }

    // ✅ orderId format: PP-{uuid}-{timestamp}
    // UUID is 36 chars: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const match = orderId.match(/^PP-([0-9a-f-]{36})-\d+$/i)
    if (!match) {
      console.error('Could not extract userId from orderId:', orderId)
      return NextResponse.json({ error: 'Invalid order' }, { status: 400 })
    }

    const userId = match[1]
    console.log('Activating Pro for userId:', userId)

    const supabase = createAdminClient()

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ is_pro: true, pro_since: new Date().toISOString() })
      .eq('id', userId)

    if (profileError) console.error('Profile update error:', profileError)

    const { data: existing } = await supabase
      .from('payments')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!existing) {
      const { error: paymentError } = await supabase.from('payments').insert({
        user_id: userId,
        email,
        plan: 'pro',
        amount,
        status: 'active'
      })
      if (paymentError) console.error('Payment insert error:', paymentError)
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('PayHere notify error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
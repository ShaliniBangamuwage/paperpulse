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

    // status_code 2 = success in PayHere
    if (statusCode !== '2') {
      console.log('Payment not successful, status:', statusCode)
      return NextResponse.json({ received: true })
    }

    // Extract user_id from order_id (format: PP-{userId}-{timestamp})
    const parts = orderId.split('-')
    // Remove first element 'PP' and last element (timestamp)
    const userId = parts.slice(1, parts.length - 1).join('-')

    if (!userId) {
      console.error('Could not extract userId from orderId:', orderId)
      return NextResponse.json({ error: 'Invalid order' }, { status: 400 })
    }

    console.log('Activating Pro for userId:', userId)

    const supabase = createAdminClient()

    // Update user to Pro
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ is_pro: true, pro_since: new Date().toISOString() })
      .eq('id', userId)

    if (profileError) console.error('Profile update error:', profileError)

    // Check if payment already recorded
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
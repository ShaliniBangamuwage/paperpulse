import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()

    const merchantId = body.get('merchant_id')?.toString() || ''
    const orderId = body.get('order_id')?.toString() || ''
    const payhereAmount = body.get('payhere_amount')?.toString() || ''
    const payhereCurrency = body.get('payhere_currency')?.toString() || ''
    const statusCode = body.get('status_code')?.toString() || ''
    const md5sig = body.get('md5sig')?.toString() || ''
    const email = body.get('email')?.toString() || ''

    console.log('PayHere notify:', {
      merchantId,
      orderId,
      payhereAmount,
      payhereCurrency,
      statusCode,
    })

    // SUCCESS ONLY
    if (statusCode !== '2') {
      console.log('Payment not successful')
      return NextResponse.json({ received: true })
    }

    // VERIFY HASH
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET

    if (!merchantSecret) {
      console.error('Missing PAYHERE_MERCHANT_SECRET')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const hashedSecret = crypto
      .createHash('md5')
      .update(merchantSecret)
      .digest('hex')
      .toUpperCase()

    const localMd5sig = crypto
      .createHash('md5')
      .update(
        merchantId +
          orderId +
          payhereAmount +
          payhereCurrency +
          statusCode +
          hashedSecret
      )
      .digest('hex')
      .toUpperCase()

    if (localMd5sig !== md5sig) {
      console.error('Invalid payment signature')

      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // ORDER FORMAT:
    // PP-userId-timestamp

    if (!orderId.startsWith('PP-')) {
      return NextResponse.json(
        { error: 'Invalid order format' },
        { status: 400 }
      )
    }

    const parts = orderId.split('-')

    if (parts.length < 3) {
      return NextResponse.json(
        { error: 'Malformed order id' },
        { status: 400 }
      )
    }

    // remove PP and timestamp
    const userId = parts.slice(1, -1).join('-')

    console.log('Activating Pro for:', userId)

    const supabase = createAdminClient()

    // ACTIVATE PRO
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        is_pro: true,
        pro_since: new Date().toISOString(),
      })
      .eq('id', userId)

    if (profileError) {
      console.error('Profile update error:', profileError)
    }

    // CHECK EXISTING PAYMENT
    const { data: existingPayments, error: existingError } = await supabase
      .from('payments')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (existingError) {
      console.error('Existing payment check error:', existingError)
    }

    if (!existingPayments || existingPayments.length === 0) {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          email,
          plan: 'pro',
          amount: parseFloat(payhereAmount),
          status: 'active',
        })

      if (paymentError) {
        console.error('Payment insert error:', paymentError)
      }
    }

    console.log('Payment processed successfully')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Notify route error:', error)

    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()

    const merchantId = formData.get('merchant_id') as string
    const orderId = formData.get('order_id') as string
    const paymentId = formData.get('payment_id') as string
    const amount = (formData.get('amount') || formData.get('payhere_amount')) as string
    const currency = (formData.get('currency') || formData.get('payhere_currency')) as string
    const status = formData.get('status') as string
    const hash = formData.get('hash') as string

    console.log('PayHere Notify received:', { merchantId, orderId, paymentId, amount, currency, status })

    if (!merchantId || !orderId || !paymentId || !amount || !currency || !status || !hash) {
      console.error('PayHere Notify: Missing required fields', { merchantId, orderId, paymentId, amount, currency, status, hash })
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const expectedMerchantId = process.env.PAYHERE_MERCHANT_ID
    if (merchantId !== expectedMerchantId) {
      console.error('PayHere Notify: Merchant ID mismatch', { provided: merchantId, expected: expectedMerchantId })
      return NextResponse.json({ success: false, error: 'Invalid merchant' }, { status: 400 })
    }

    const merchantSecret = process.env.PAYHERE_SECRET
    if (!merchantSecret) {
      console.error('PayHere Notify: Missing merchant secret')
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 })
    }

    const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase()
    const normalizedAmount = Number(amount).toFixed(2)
    const hashCandidates = [
      merchantId + orderId + paymentId + normalizedAmount + currency + status + hashedSecret,
      merchantId + orderId + paymentId + status + normalizedAmount + currency + hashedSecret,
    ]

    const expectedHash = hashCandidates.map(candidate =>
      crypto.createHash('md5').update(candidate).digest('hex').toUpperCase()
    )

    if (!expectedHash.includes(hash.toUpperCase())) {
      console.error('PayHere Notify: Hash verification failed', { provided: hash, expectedHash, merchantId, orderId, paymentId, normalizedAmount, currency, status })
      return NextResponse.json({ success: false, error: 'Invalid hash' }, { status: 400 })
    }

    const paymentStatus = Number(status)
    if (paymentStatus !== 2) {
      console.log('PayHere Notify: Payment not successful, status:', paymentStatus)
      return NextResponse.json({ success: true })
    }

    console.log('PayHere Notify: Payment verified successfully', { orderId, paymentId, amount, currency, status })

    // Update user's Pro status and create payment record
    try {
      const supabase = await createClient()
      
      // Find payment record by order_id (order format: PP-{userId}-{timestamp})
      const orderParts = orderId.split('-')
      const userId = orderParts.length > 1 ? orderParts[1] : null

      if (!userId) {
        console.warn('PayHere Notify: Could not extract user ID from order_id:', orderId)
        return NextResponse.json({ success: true })
      }

      // Update user profile to Pro
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_pro: true, pro_since: new Date().toISOString() })
        .eq('id', userId)

      if (updateError) {
        console.error('PayHere Notify: Failed to update user profile:', updateError)
        return NextResponse.json({ success: true })
      }

      // Create payment record for admin tracking
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          order_id: orderId,
          payment_id: paymentId,
          amount: normalizedAmount,
          currency,
          status: 'completed',
          created_at: new Date().toISOString()
        })

      if (paymentError) {
        console.error('PayHere Notify: Failed to create payment record:', paymentError)
        // Don't fail the webhook if payment record creation fails
        return NextResponse.json({ success: true })
      }

      console.log('PayHere Notify: User Pro status updated and payment recorded', { userId, orderId, paymentId })
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('PayHere Notify: Failed to process payment update:', error)
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('PayHere Notify error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

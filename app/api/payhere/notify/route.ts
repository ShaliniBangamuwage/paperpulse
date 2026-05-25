import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()

    // PayHere sends data as form fields, not JSON
    const merchantId = formData.get('merchant_id') as string
    const orderId = formData.get('order_id') as string
    const paymentId = formData.get('payment_id') as string
    const amount = formData.get('amount') as string
    const currency = formData.get('currency') as string
    const status = formData.get('status') as string
    const hash = formData.get('hash') as string

    console.log('PayHere Notify received:', {
      merchant_id: merchantId,
      order_id: orderId,
      payment_id: paymentId,
      amount,
      currency,
      status,
    })

    // Validate required fields
    if (!merchantId || !orderId || !amount || !currency || !status || !hash) {
      console.error('PayHere Notify: Missing required fields', {
        merchantId,
        orderId,
        amount,
        currency,
        status,
        hash,
      })
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Verify merchant ID
    const expectedMerchantId = process.env.PAYHERE_MERCHANT_ID
    if (merchantId !== expectedMerchantId) {
      console.error('PayHere Notify: Merchant ID mismatch', {
        provided: merchantId,
        expected: expectedMerchantId,
      })
      return NextResponse.json({ success: false, error: 'Invalid merchant' }, { status: 400 })
    }

    // Verify hash to ensure request is authentic
    // PayHere hash format: merchant_id + order_id + payment_id + amount + currency + hashed_secret
    const merchantSecret = process.env.PAYHERE_SECRET
    if (!merchantSecret) {
      console.error('PayHere Notify: Missing merchant secret')
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 })
    }

    // Hash the secret first
    const hashedSecret = crypto
      .createHash('md5')
      .update(merchantSecret)
      .digest('hex')
      .toUpperCase()

    // Create hash string: merchant_id + order_id + payment_id + amount + currency + hashed_secret
    const hashString = merchantId + orderId + (paymentId || '') + amount + currency + hashedSecret
    const expectedHash = crypto
      .createHash('md5')
      .update(hashString)
      .digest('hex')
      .toUpperCase()

    if (hash !== expectedHash) {
      console.error('PayHere Notify: Hash verification failed', {
        provided: hash,
        expected: expectedHash,
        hashString,
      })
      return NextResponse.json({ success: false, error: 'Invalid hash' }, { status: 400 })
    }

    // Only process successful payments
    const paymentStatus = Number(status)
    if (paymentStatus !== 2) {
      console.log('PayHere Notify: Payment not successful, status:', paymentStatus)
      // Still return success to PayHere to acknowledge receipt
      return NextResponse.json({ success: true })
    }

    // Extract user ID from order ID (format: PP-{timestamp})
    // Since we don't have user ID in order ID, we need to find the user by email
    // But PayHere doesn't send email in notify, so we need a different approach
    // For now, we'll just log the payment and let the frontend handle activation via success=true redirect

    console.log('PayHere Notify: Payment successful verified', {
      order_id: orderId,
      payment_id: paymentId,
      amount,
    })

    // Return success to PayHere
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('PayHere Notify error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

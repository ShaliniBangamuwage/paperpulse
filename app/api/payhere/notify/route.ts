import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()

    const merchantId = formData.get('merchant_id') as string
    const orderId = formData.get('order_id') as string
    const paymentId = formData.get('payment_id') as string
    const amount = formData.get('amount') as string
    const currency = formData.get('currency') as string
    const status = formData.get('status') as string
    const hash = formData.get('hash') as string

    console.log('PayHere Notify received:', { merchantId, orderId, paymentId, amount, currency, status })

    if (!merchantId || !orderId || !amount || !currency || !status || !hash) {
      console.error('PayHere Notify: Missing required fields', { merchantId, orderId, amount, currency, status, hash })
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
    const hashString = merchantId + orderId + (paymentId || '') + normalizedAmount + currency + hashedSecret
    const expectedHash = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase()

    if (hash !== expectedHash) {
      console.error('PayHere Notify: Hash verification failed', { provided: hash, expected: expectedHash, hashString })
      return NextResponse.json({ success: false, error: 'Invalid hash' }, { status: 400 })
    }

    const paymentStatus = Number(status)
    if (paymentStatus !== 2) {
      console.log('PayHere Notify: Payment not successful, status:', paymentStatus)
      return NextResponse.json({ success: true })
    }

    console.log('PayHere Notify: Payment verified successfully', { orderId, paymentId, amount })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PayHere Notify error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

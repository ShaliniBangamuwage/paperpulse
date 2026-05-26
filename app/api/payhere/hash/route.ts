import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { order_id, amount, currency } = await request.json()

    const merchant_id = process.env.PAYHERE_MERCHANT_ID
    const merchant_secret = process.env.PAYHERE_MERCHANT_SECRET

    // ✅ Log what Vercel sees
    console.log('PAYHERE_MERCHANT_ID:', merchant_id)
    console.log('PAYHERE_MERCHANT_SECRET exists:', !!merchant_secret)
    console.log('PAYHERE_MERCHANT_SECRET length:', merchant_secret?.length)

    if (!merchant_id || !merchant_secret) {
      console.error('Missing env vars:', { merchant_id: !!merchant_id, merchant_secret: !!merchant_secret })
      return NextResponse.json(
        { error: 'Missing config', merchant_id: !!merchant_id, secret: !!merchant_secret },
        { status: 500 }
      )
    }

    const hashedSecret = crypto
      .createHash('md5')
      .update(merchant_secret)
      .digest('hex')
      .toUpperCase()

    const hash = crypto
      .createHash('md5')
      .update(merchant_id + order_id + amount + currency + hashedSecret)
      .digest('hex')
      .toUpperCase()

    return NextResponse.json({ hash, merchant_id })

  } catch (error: any) {
    console.error('Hash route error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
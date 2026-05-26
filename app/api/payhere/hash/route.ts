import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { order_id, amount, currency } = await request.json()

    const merchant_id = process.env.PAYHERE_MERCHANT_ID
    const merchant_secret = process.env.PAYHERE_MERCHANT_SECRET

    if (!merchant_id || !merchant_secret) {
      return NextResponse.json(
        { error: 'Missing config' },
        { status: 500 }
      )
    }

    const formattedAmount = Number(amount).toFixed(2)

    const hashedSecret = crypto
      .createHash('md5')
      .update(merchant_secret)
      .digest('hex')
      .toUpperCase()

    const hash = crypto
      .createHash('md5')
      .update(merchant_id + order_id + formattedAmount + currency + hashedSecret)
      .digest('hex')
      .toUpperCase()

    return NextResponse.json({ hash, merchant_id })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
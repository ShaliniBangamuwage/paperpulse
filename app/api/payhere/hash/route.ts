import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { order_id, amount, currency } = await req.json()

    const merchantId = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID!
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET!

    const hashedSecret = crypto
      .createHash('md5')
      .update(merchantSecret)
      .digest('hex')
      .toUpperCase()

    const hash = crypto
      .createHash('md5')
      .update(
        merchantId +
        order_id +
        parseFloat(amount).toFixed(2) +
        currency +
        hashedSecret
      )
      .digest('hex')
      .toUpperCase()

    return NextResponse.json({
      hash,
      merchant_id: merchantId
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Hash generation failed' },
      { status: 500 }
    )
  }
}
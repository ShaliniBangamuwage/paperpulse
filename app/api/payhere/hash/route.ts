import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const merchantId = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID!
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET!

    const amount = Number(body.amount).toFixed(2)

    const hashedSecret = crypto
      .createHash('md5')
      .update(merchantSecret)
      .digest('hex')
      .toUpperCase()

    const hash = crypto
      .createHash('md5')
      .update(
        merchantId +
          body.order_id +
          amount +
          body.currency +
          hashedSecret
      )
      .digest('hex')
      .toUpperCase()

    return NextResponse.json({ hash })
  } catch (error) {
    return NextResponse.json(
      { error: 'Hash generation failed' },
      { status: 500 }
    )
  }
}
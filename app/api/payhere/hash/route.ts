import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { order_id, amount, currency } =
      await req.json()

    const merchantId =
      process.env
        .NEXT_PUBLIC_PAYHERE_MERCHANT_ID

    const merchantSecret =
      process.env.PAYHERE_MERCHANT_SECRET

    if (!merchantId || !merchantSecret) {
      return NextResponse.json(
        {
          error:
            'Missing PayHere environment variables',
        },
        { status: 500 }
      )
    }

    const formattedAmount = Number(
      amount
    ).toFixed(2)

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
          formattedAmount +
          currency +
          hashedSecret
      )
      .digest('hex')
      .toUpperCase()

    return NextResponse.json({
      hash,
      merchant_id: merchantId,
    })
  } catch (error) {
    console.error(
      'PayHere hash error:',
      error
    )

    return NextResponse.json(
      {
        error: 'Hash generation failed',
      },
      { status: 500 }
    )
  }
}
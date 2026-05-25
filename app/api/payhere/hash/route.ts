import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))

    if (!body.merchant_id || !body.order_id || !body.amount || !body.currency) {
      console.error('PayHere Hash: Missing required fields', {
        merchant_id: body.merchant_id,
        order_id: body.order_id,
        amount: body.amount,
        currency: body.currency,
      })
      return NextResponse.json({ error: 'Missing required payment fields' }, { status: 400 })
    }

    const merchantId = process.env.PAYHERE_MERCHANT_ID
    const merchantSecret = process.env.PAYHERE_SECRET

    if (!merchantId || !merchantSecret) {
      console.error('PayHere Hash: Missing environment variables')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    if (body.merchant_id !== merchantId) {
      console.error('PayHere Hash: Merchant ID mismatch', {
        provided: body.merchant_id,
        expected: merchantId,
      })
      return NextResponse.json({ error: 'Invalid merchant ID' }, { status: 400 })
    }

    const amount = Number(body.amount).toFixed(2)
    const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase()
    const hashString = merchantId + body.order_id + amount + body.currency + hashedSecret
    const hash = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase()

    console.log('PayHere Hash generated successfully', {
      order_id: body.order_id,
      amount,
      currency: body.currency,
    })

    return NextResponse.json({ hash })
  } catch (error) {
    console.error('PayHere Hash error:', error)
    return NextResponse.json({ error: 'Hash generation failed' }, { status: 500 })
  }
}
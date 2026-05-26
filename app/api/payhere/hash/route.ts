import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { order_id, amount, currency } = body

    // Always read merchant_id and secret from environment
    const merchant_id = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID
    const merchant_secret = process.env.PAYHERE_MERCHANT_SECRET

    if (!merchant_id || !merchant_secret) {
      console.error('Missing env vars:', { 
        has_merchant_id: !!merchant_id, 
        has_merchant_secret: !!merchant_secret 
      })
      return NextResponse.json({ error: 'Payment config missing' }, { status: 500 })
    }

    // Format amount to 2 decimals
    const formattedAmount = parseFloat(amount).toFixed(2)

    // PayHere hash: MD5(merchant_id + order_id + amount + currency + MD5(merchant_secret))
    const hashedSecret = crypto
      .createHash('md5')
      .update(merchant_secret)
      .digest('hex')
      .toUpperCase()

    const hashString = `${merchant_id}${order_id}${formattedAmount}${currency}${hashedSecret}`
    
    const hash = crypto
      .createHash('md5')
      .update(hashString)
      .digest('hex')
      .toUpperCase()

    console.log('Hash generated:', { 
      merchant_id, 
      order_id, 
      amount: formattedAmount, 
      currency, 
      hash 
    })

    return NextResponse.json({ hash, merchant_id })
  } catch (error) {
    console.error('Hash generation error:', error)
    return NextResponse.json({ error: 'Hash generation failed' }, { status: 500 })
  }
}
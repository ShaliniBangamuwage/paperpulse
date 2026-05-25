import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { merchant_id, order_id, amount, currency } = body

    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET

    // Debug log — remove after fixing
    console.log('PAYHERE_MERCHANT_SECRET exists:', !!merchantSecret, 'length:', merchantSecret?.length)

    if (!merchantSecret) {
      console.error('PAYHERE_MERCHANT_SECRET is not set in environment variables')
      return NextResponse.json({ error: 'Merchant secret not configured' }, { status: 500 })
    }

    if (!merchant_id || !order_id || !amount || !currency) {
      console.error('Missing required fields:', { merchant_id, order_id, amount, currency })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Format amount to 2 decimal places
    const formattedAmount = parseFloat(amount).toFixed(2)

    // PayHere hash formula: MD5(merchant_id + order_id + amount + currency + MD5(merchant_secret))
    const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase()
    const hashString = `${merchant_id}${order_id}${formattedAmount}${currency}${hashedSecret}`
    const hash = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase()

    console.log('Hash generated successfully for order:', order_id)

    return NextResponse.json({ hash })
  } catch (error) {
    console.error('Hash generation error:', error)
    return NextResponse.json({ error: 'Failed to generate hash' }, { status: 500 })
  }
}
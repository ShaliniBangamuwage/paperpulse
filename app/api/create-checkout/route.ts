import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  const { userId } = await request.json()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: 'PaperPulse Pro' },
        unit_amount: 900,
        recurring: { interval: 'month' },
      },
      quantity: 1,
    }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/upgrade?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/upgrade`,
    metadata: { userId },
  })

  return NextResponse.json({ url: session.url })
}
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.text()
  const sig = (await headers()).get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId

    // Get user email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()

    // Update profile to Pro
    await supabase
      .from('profiles')
      .update({
        is_pro: true,
        stripe_customer_id: session.customer as string,
        pro_since: new Date().toISOString(),
      })
      .eq('id', userId)

    // Insert payment record
    await supabase.from('payments').insert({
      user_id: userId,
      email: profile?.email || session.customer_email || '',
      plan: 'pro',
      amount: 9.00,
      status: 'active',
      stripe_customer_id: session.customer as string,
    })

    console.log('✅ Payment recorded for user:', userId)
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription

    await supabase
      .from('profiles')
      .update({ is_pro: false })
      .eq('stripe_customer_id', subscription.customer as string)

    await supabase
      .from('payments')
      .update({ status: 'cancelled' })
      .eq('stripe_customer_id', subscription.customer as string)
  }

  return NextResponse.json({ received: true })
}

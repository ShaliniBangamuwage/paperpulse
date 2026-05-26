'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ThemeToggle'
import { toast } from 'sonner'

declare global {
  interface Window {
    payhere: any
  }
}

type PayHerePayment = {
  sandbox: boolean
  merchant_id: string
  return_url: string
  cancel_url: string
  notify_url: string
  order_id: string
  items: string
  amount: string
  currency: string
  hash: string
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  city: string
  country: string
}

function UpgradePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const isSuccess = searchParams.get('success') === 'true'

  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function checkUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('is_pro')
          .eq('id', user.id)
          .single()

        if (isSuccess && !profile?.is_pro) {
          await supabase
            .from('profiles')
            .update({
              is_pro: true,
              pro_since: new Date().toISOString(),
            })
            .eq('id', user.id)

          // avoid duplicate payments
          const { data: existing } = await supabase
            .from('payments')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)

          if (!existing || existing.length === 0) {
            await supabase.from('payments').insert({
              user_id: user.id,
              email: user.email || '',
              plan: 'pro',
              amount: 9.0,
              status: 'active',
            })
          }

          setIsPro(true)

          toast.success('🎉 Pro activated successfully!')
        } else {
          setIsPro(profile?.is_pro || false)
        }
      } catch (error) {
        console.error(error)
      }
    }

    checkUser()
  }, [isSuccess, supabase])
async function handleUpgrade() {
  try {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please login first')
      return
    }

    const orderId = `PP-${user.id}-${Date.now()}`
    const amount = '9.00'
    const currency = 'USD'

    const hashRes = await fetch('/api/payhere/hash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, amount, currency }),
    })

    const hashData = await hashRes.json()

    if (!hashRes.ok || !hashData.hash) {
      toast.error('Failed to generate payment hash')
      return
    }

    const isSandbox = process.env.NEXT_PUBLIC_PAYHERE_SANDBOX === 'true'

    const fields: Record<string, string> = {
      merchant_id: hashData.merchant_id,
      return_url: `${window.location.origin}/upgrade?success=true`,
      cancel_url: `${window.location.origin}/upgrade`,
      notify_url: `${window.location.origin}/api/payhere/notify`,
      order_id: orderId,
      items: 'PaperPulse Pro',
      amount,
      currency,
      hash: hashData.hash,
      first_name: user.email?.split('@')[0] || 'PaperPulse',
      last_name: 'User',
      email: user.email || '',
      phone: '0771234567',
      address: 'Colombo',
      city: 'Colombo',
      country: 'Sri Lanka',
    }

    // ✅ Form submit — no SDK needed
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = isSandbox
      ? 'https://sandbox.payhere.lk/pay/checkout'
      : 'https://www.payhere.lk/pay/checkout'

    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = key
      input.value = value
      form.appendChild(input)
    })

    document.body.appendChild(form)
    form.submit()

  } catch (error) {
    console.error('Upgrade error:', error)
    toast.error('Something went wrong')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <div className="max-w-4xl mx-auto px-8 py-16">

        <div className="flex items-center justify-between mb-12">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-orange-500 transition-colors"
          >
            ← Back
          </button>

          <ThemeToggle />
        </div>

        {isPro ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">⚡</div>

            <h1 className="text-3xl font-bold mb-4 text-orange-500">
              You're on Pro!
            </h1>

            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Enjoy unlimited papers and ideas.
            </p>

            <button
              onClick={() => router.push('/dashboard')}
              className="bg-orange-500 hover:bg-orange-400 text-white px-8 py-3 rounded-xl font-medium transition-colors"
            >
              Back to Dashboard →
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-12">
              <span className="bg-orange-500/20 text-orange-500 text-sm px-4 py-2 rounded-full font-medium">
                Upgrade
              </span>

              <h1 className="text-4xl font-bold mt-4 mb-4">
                Unlock full access
              </h1>

              <p className="text-lg text-gray-500 dark:text-gray-400">
                Keep generating ideas without limits
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">

              {/* FREE */}
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Current plan
                </p>

                <h2 className="text-2xl font-bold mb-1">
                  Free
                </h2>

                <p className="text-3xl font-bold mb-6">
                  $0
                  <span className="text-base font-normal text-gray-500 dark:text-gray-400">
                    /mo
                  </span>
                </p>

                <ul className="space-y-3 mb-6">
                  {[
                    '5 papers total',
                    '15 ideas total',
                    'Basic library access',
                    'Save ideas',
                  ].map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-500"
                    >
                      <span className="text-orange-400">
                        ✓
                      </span>

                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="w-full bg-gray-200 dark:bg-gray-800 text-center py-2.5 rounded-xl text-sm text-gray-400 dark:text-gray-500 font-medium">
                  Current plan
                </div>
              </div>

              {/* PRO */}
              <div className="bg-orange-500 rounded-2xl p-6 relative overflow-hidden">

                <div className="absolute top-4 right-4 bg-white/20 text-white text-xs px-3 py-1 rounded-full font-medium">
                  Popular
                </div>

                <p className="text-orange-100 text-sm mb-1">
                  Upgrade to
                </p>

                <h2 className="text-2xl font-bold text-white mb-1">
                  Pro
                </h2>

                <p className="text-3xl font-bold text-white mb-6">
                  $9
                  <span className="text-base font-normal text-orange-100">
                    /mo
                  </span>
                </p>

                <ul className="space-y-3 mb-6">
                  {[
                    'Unlimited papers',
                    'Unlimited ideas',
                    'Priority processing',
                    'Share to library',
                    'Pro badge on profile',
                    'Early access to features',
                  ].map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-white"
                    >
                      ✓ {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full bg-white text-orange-500 font-semibold py-3 rounded-xl hover:bg-orange-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading
                    ? 'Processing...'
                    : 'Get Pro →'}
                </button>
              </div>
            </div>

            {isSuccess && (
              <p className="text-center text-green-500 text-sm mt-8 font-medium">
                🎉 Payment received! Activating your Pro account...
              </p>
            )}

            <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-8">
              Sandbox payment testing enabled
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function UpgradePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <UpgradePageInner />
    </Suspense>
  )
}

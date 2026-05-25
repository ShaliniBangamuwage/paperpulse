'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ThemeToggle'
import { toast } from 'sonner'

function UpgradePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSuccess = searchParams.get('success') === 'true'
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(false)
  const [signedInWithGoogle, setSignedInWithGoogle] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function checkAndActivate() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Detect if the user signed in via Google (Supabase stores identities)
      const identities = (user as any)?.identities
      setSignedInWithGoogle(Array.isArray(identities) && identities.some((i: any) => i.provider === 'google'))

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', user.id)
        .single()

      if (isSuccess && !profile?.is_pro) {
        await supabase
          .from('profiles')
          .update({ is_pro: true, pro_since: new Date().toISOString() })
          .eq('id', user.id)

        setIsPro(true)
        toast.success('🎉 Pro activated successfully!')
      } else {
        setIsPro(profile?.is_pro || false)
      }
    }

    checkAndActivate()
  }, [isSuccess, supabase])

  async function handleUpgrade() {
    // Check if PayHere script is loaded
    if (!scriptLoaded || !(window as any).payhere) {
      toast.error('Payment system is loading. Please try again in a moment.')
      console.error('PayHere not loaded:', { scriptLoaded, payhere: (window as any).payhere })
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Please login first')
        setLoading(false)
        return
      }

      const orderId = `PP-${Date.now()}`
      let hashData: any = null

      // Payment object for PayHere - only include fields needed for hash
      const payment = {
        sandbox: true,
        merchant_id: process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID!,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/upgrade?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/upgrade`,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/payhere/notify`,
        order_id: orderId,
        items: 'PaperPulse Pro',
        amount: '9.00',
        currency: 'USD',
        first_name: user.email?.split('@')[0] || 'PaperPulse',
        last_name: 'User',
        email: user.email || '',
        phone: '0771234567',
        address: 'Colombo',
        city: 'Colombo',
        country: 'Sri Lanka',
      }

      // Generate hash from server with timeout
      console.log('Requesting hash for order:', orderId)
      
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        const hashRes = await fetch('/api/payhere/hash', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            merchant_id: payment.merchant_id,
            order_id: payment.order_id,
            amount: payment.amount,
            currency: payment.currency,
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!hashRes.ok) {
          const errorData = await hashRes.json().catch(() => ({}))
          console.error('Hash generation failed:', { status: hashRes.status, error: errorData })
          toast.error(`Hash generation failed (${hashRes.status}): ${errorData.error || 'Unknown error'}`)
          setLoading(false)
          return
        }

        hashData = await hashRes.json()

        if (!hashData.hash) {
          console.error('No hash returned from server:', hashData)
          toast.error('Hash generation failed: No hash in response')
          setLoading(false)
          return
        }

        console.log('Hash generated successfully')
      } catch (hashError: any) {
        console.error('Hash API error:', hashError)
        
        if (hashError.name === 'AbortError') {
          toast.error('Hash generation timeout (10s). Check your internet connection.')
        } else {
          toast.error('Hash generation error: ' + (hashError?.message || 'Network error'))
        }
        
        setLoading(false)
        return
      }

      console.log('Hash generated successfully, starting payment')

      // Setup PayHere callbacks using stable global references to avoid runtime issues
      try {
        const w = window as any

        w.__payhere_onCompleted = function (orderId: string) {
          console.log('Payment completed:', orderId)
          window.location.href = '/upgrade?success=true'
        }

        w.__payhere_onDismissed = function () {
          console.log('Payment dismissed by user')
          toast.info('Payment cancelled')
          setLoading(false)
        }

        w.__payhere_onError = function (error: any) {
          console.error('Payment error:', error)
          toast.error('Payment failed: ' + (error?.message || 'Unknown error'))
          setLoading(false)
        }

        if (w.payhere) {
          w.payhere.onCompleted = w.__payhere_onCompleted
          w.payhere.onDismissed = w.__payhere_onDismissed
          w.payhere.onError = w.__payhere_onError
        }
      } catch (cbError) {
        console.error('Error setting PayHere callbacks:', cbError)
      }

      // Debug: show what we will send to PayHere and ensure `payhere` exists
      console.log('Starting PayHere payment', {
        payhere: (window as any).payhere,
        payment,
        hash: hashData?.hash,
      })

      try {
        const result = (window as any).payhere.startPayment({
          ...payment,
          hash: hashData.hash,
        })

        console.log('payhere.startPayment result:', result)

        // Some browsers or CSPs may prevent popups — startPayment returns false in that case
        if (result === false) {
          console.error('PayHere popup failed to open (startPayment returned false)')
          toast.error('Payment popup blocked. Please allow popups and try again.')
          setLoading(false)
        }
      } catch (startError) {
        console.error('payhere.startPayment threw an error:', startError)
        toast.error('Failed to start payment: ' + (startError as any)?.message || 'Unknown error')
        setLoading(false)
      }

    } catch (error) {
      console.error('Upgrade error:', error)
      toast.error('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <Script
        src="https://www.payhere.lk/lib/payhere.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('PayHere script loaded')
          setScriptLoaded(true)
          try {
            // Ensure stable global callback references so PayHere can call them
            const w = window as any
            if (w.payhere) {
              w.__payhere_onCompleted = w.__payhere_onCompleted || function (orderId: string) {
                console.log('Default payhere onCompleted:', orderId)
              }

              w.__payhere_onDismissed = w.__payhere_onDismissed || function () {
                console.log('Default payhere onDismissed')
              }

              w.__payhere_onError = w.__payhere_onError || function (err: any) {
                console.error('Default payhere onError:', err)
              }

              // Assign stable globals to the payhere callbacks
              w.payhere.onCompleted = w.__payhere_onCompleted
              w.payhere.onDismissed = w.__payhere_onDismissed
              w.payhere.onError = w.__payhere_onError
            }
          } catch (e) {
            console.error('Error setting default PayHere callbacks', e)
          }
        }}
        onError={() => {
          console.error('Failed to load PayHere script')
          toast.error('Failed to load payment system')
        }}
      />

      <div className="min-h-screen dark:bg-gray-950 bg-white text-gray-900 dark:text-white">
        <div className="max-w-4xl mx-auto px-8 py-16">

          <div className="flex items-center justify-between mb-12">
            <button
              onClick={() => router.back()}
              className="dark:text-gray-400 text-gray-500 hover:text-orange-500 text-sm transition-colors">
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

              <p className="dark:text-gray-400 text-gray-500 mb-8">
                Enjoy unlimited papers and ideas.
              </p>

              <button
                onClick={() => router.push('/dashboard')}
                className="bg-orange-500 hover:bg-orange-400 text-white px-8 py-3 rounded-xl font-medium transition-colors">
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

                <p className="dark:text-gray-400 text-gray-500 text-lg">
                  Keep generating ideas without limits
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">

                {/* Free plan */}
                <div className="dark:bg-gray-900 bg-gray-50 border dark:border-gray-800 border-gray-200 rounded-2xl p-6">
                  <p className="text-sm dark:text-gray-400 text-gray-500 mb-1">
                    Current plan
                  </p>

                  <h2 className="text-2xl font-bold mb-1">
                    Free
                  </h2>

                  <p className="text-3xl font-bold mb-6">
                    $0
                    <span className="text-base font-normal dark:text-gray-400 text-gray-500">
                      /mo
                    </span>
                  </p>

                  <ul className="space-y-3 mb-6">
                    {[
                      '5 papers total',
                      '15 ideas total',
                      'Basic library access',
                      'Save ideas',
                    ].map(f => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-sm dark:text-gray-600 text-gray-600">
                        <span className="text-orange-400">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="w-full bg-gray-200 dark:bg-gray-800 text-center py-2.5 rounded-xl text-sm dark:text-gray-500 text-gray-400 font-medium">
                    Current plan
                  </div>
                </div>

                {/* Pro plan */}
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
                    ].map(f => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-sm text-white">
                        <span>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={handleUpgrade}
                    disabled={loading || !scriptLoaded}
                    className={`w-full ${signedInWithGoogle ? 'bg-orange-500 hover:bg-orange-400 text-white' : 'bg-pink-500 hover:bg-pink-400 text-white'} font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2`}>
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : !scriptLoaded ? (
                      'Loading...'
                    ) : (
                      'Get Pro →'
                    )}
                  </button>
                </div>
              </div>

              {isSuccess && (
                <p className="text-center text-green-500 text-sm mt-8 font-medium">
                  🎉 Payment received! Activating your Pro account...
                </p>
              )}

              <p className="text-center dark:text-gray-600 text-gray-400 text-xs mt-8">
                Sandbox payment testing enabled
              </p>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default function UpgradePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen dark:bg-gray-950 bg-white flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
        </div>
      }>
      <UpgradePageInner />
    </Suspense>
  )
}
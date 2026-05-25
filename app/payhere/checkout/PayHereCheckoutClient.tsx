'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { useSearchParams } from 'next/navigation'

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

type PayHereClient = {
  onCompleted?: (orderId: string) => void
  onDismissed?: () => void
  onError?: (error: unknown) => void
  startPayment: (payment: PayHerePayment) => boolean
}

declare global {
  interface Window {
    payhere?: PayHereClient
  }
}

export default function PayHereCheckoutClient() {
  const searchParams = useSearchParams()
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [origin, setOrigin] = useState('')
  const [status, setStatus] = useState('Preparing your PayHere checkout...')
  const [error, setError] = useState<string | null>(null)
  const [started, setStarted] = useState(false)

  const merchantId = searchParams.get('merchant_id') || ''
  const orderId = searchParams.get('order_id') || ''
  const items = searchParams.get('items') || 'PaperPulse Pro'
  const amount = searchParams.get('amount') || '9.00'
  const currency = searchParams.get('currency') || 'USD'
  const firstName = searchParams.get('first_name') || 'PaperPulse'
  const lastName = searchParams.get('last_name') || 'User'
  const email = searchParams.get('email') || ''
  const phone = searchParams.get('phone') || '0771234567'
  const address = searchParams.get('address') || 'Colombo'
  const city = searchParams.get('city') || 'Colombo'
  const country = searchParams.get('country') || 'Sri Lanka'
  const returnUrl = searchParams.get('return_url') || `${origin}/upgrade?success=true`
  const cancelUrl = searchParams.get('cancel_url') || `${origin}/upgrade`
  const notifyUrl = searchParams.get('notify_url') || `${origin}/api/payhere/notify`

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  useEffect(() => {
    if (!scriptLoaded || started) {
      return
    }

    if (!origin) {
      return
    }

    if (!merchantId || !orderId) {
      setError('Missing payment information.')
      setStatus('Unable to start PayHere checkout.')
      return
    }

    async function startCheckout() {
      setStatus('Requesting payment authorization...')

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch('/api/payhere/hash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchant_id: merchantId,
            order_id: orderId,
            amount,
            currency,
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          const message = payload?.error || `Hash request failed (${response.status})`
          setError(message)
          setStatus('Payment authorization failed.')
          return
        }

        const payload = await response.json()
        if (!payload?.hash) {
          setError('Server did not return a valid payment hash.')
          setStatus('Payment authorization failed.')
          return
        }

        if (!window.payhere) {
          setError('PayHere SDK did not initialize.')
          setStatus('Unable to start payment.')
          return
        }

        window.payhere.onCompleted = function () {
          setStatus('Payment completed. Redirecting...')
          window.location.href = returnUrl
        }

        window.payhere.onDismissed = function () {
          setStatus('Payment cancelled. Close this window or return to the app.')
        }

        window.payhere.onError = function (error: any) {
          console.error('PayHere error:', error)
          setError('Payment failed. Please try again.')
          setStatus('Payment error occurred.')
        }

        const success = window.payhere.startPayment({
          sandbox: true,
          merchant_id: merchantId,
          return_url: returnUrl,
          cancel_url: cancelUrl,
          notify_url: notifyUrl,
          order_id: orderId,
          items,
          amount,
          currency,
          hash: payload.hash,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          address,
          city,
          country,
        })

        if (success === false) {
          setError('Payment popup blocked. Please allow popups and try again.')
          setStatus('Popup blocked.')
          return
        }

        setStarted(true)
        setStatus('Opening PayHere checkout...')
      } catch (caughtError: any) {
        if (caughtError?.name === 'AbortError') {
          setError('Authorization timed out. Please try again.')
          setStatus('Payment authorization timed out.')
        } else {
          setError(caughtError?.message || 'Network error')
          setStatus('Unable to start payment.')
        }
      }
    }

    startCheckout()
  }, [scriptLoaded, started, origin, merchantId, orderId, amount, currency, returnUrl, cancelUrl, notifyUrl, firstName, lastName, email, phone, address, city, country])

  return (
    <>
      <Script
        src="https://www.payhere.lk/lib/payhere.js"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
        onError={() => {
          setError('Failed to load PayHere SDK. Please refresh the page.')
          setStatus('Unable to initialize PayHere.')
        }}
      />

      <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
        <div className="max-w-xl mx-auto px-8 py-20 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-6 rounded-full bg-orange-500 text-white">
            ⚡
          </div>

          <h1 className="text-3xl font-bold mb-4">PayHere Checkout</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
            {status}
          </p>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 p-4 text-left text-sm text-red-700 dark:text-red-200">
              <p className="font-semibold">Error</p>
              <p>{error}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span>Starting PayHere checkout...</span>
            </div>
          )}

          <p className="mt-8 text-xs text-gray-500 dark:text-gray-400">
            If the PayHere popup does not appear, allow popups for this site or refresh this page.
          </p>
        </div>
      </div>
    </>
  )
}

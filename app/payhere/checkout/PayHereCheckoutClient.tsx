'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function PayHereCheckoutClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function initPayment() {
      try {
        const order_id = searchParams.get('order_id')
        const items = searchParams.get('items')
        const amount = searchParams.get('amount')
        const currency = searchParams.get('currency')
        const first_name = searchParams.get('first_name')
        const last_name = searchParams.get('last_name')
        const email = searchParams.get('email')
        const phone = searchParams.get('phone')
        const address = searchParams.get('address')
        const city = searchParams.get('city')
        const country = searchParams.get('country')
        const return_url = searchParams.get('return_url')
        const cancel_url = searchParams.get('cancel_url')
        const notify_url = searchParams.get('notify_url')

        if (!order_id || !amount || !currency || !email) {
          setError('Missing payment parameters')
          return
        }

        // Generate hash from backend
        const hashResponse = await fetch('/api/payhere/hash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id, amount, currency })
        })

        if (!hashResponse.ok) {
          const errorData = await hashResponse.json()
          console.error('Hash error:', errorData)
          setError('Failed to initialize payment')
          return
        }

        const { hash, merchant_id } = await hashResponse.json()

        console.log('Submitting to PayHere:', { merchant_id, order_id, amount, currency })

        // Submit to PayHere sandbox
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = 'https://sandbox.payhere.lk/pay/checkout'

        const fields = {
          merchant_id,
          return_url: return_url || '',
          cancel_url: cancel_url || '',
          notify_url: notify_url || '',
          order_id,
          items: items || '',
          currency,
          amount,
          first_name: first_name || '',
          last_name: last_name || '',
          email,
          phone: phone || '',
          address: address || '',
          city: city || '',
          country: country || '',
          hash,
        }

        Object.entries(fields).forEach(([key, value]) => {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = value
          form.appendChild(input)
        })

        document.body.appendChild(form)
        form.submit()
      } catch (err) {
        console.error('Payment init error:', err)
        setError('Failed to initialize payment')
      }
    }

    initPayment()
  }, [searchParams])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/upgrade')}
            className="text-orange-500 hover:underline text-sm">
            ← Back to upgrade
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Redirecting to PayHere...</p>
      </div>
    </div>
  )
}
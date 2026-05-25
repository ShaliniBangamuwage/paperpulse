import { Suspense } from 'react'
import PayHereCheckoutClient from './PayHereCheckoutClient'

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
        </div>
      }>
      <PayHereCheckoutClient />
    </Suspense>
  )
}

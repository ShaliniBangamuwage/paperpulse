'use client'
import { useRouter } from 'next/navigation'

interface Props {
  papersCount: number
  isPro: boolean
  limit: number
}

export function LimitBanner({ papersCount, isPro, limit }: Props) {
  const router = useRouter()
  const remaining = limit - papersCount
  const percentage = (papersCount / limit) * 100

  if (isPro) return null
  if (papersCount < limit * 0.6) return null

  return (
    <div className={`rounded-2xl p-4 mb-6 border ${
      remaining <= 0
        ? 'dark:bg-red-500/10 dark:border-red-500/30 bg-red-50 border-red-200'
        : 'dark:bg-orange-500/10 dark:border-orange-500/30 bg-orange-50 border-orange-200'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className={`font-medium text-sm ${remaining <= 0 ? 'dark:text-red-400 text-red-600' : 'dark:text-orange-400 text-orange-600'}`}>
            {remaining <= 0 ? 'Free limit reached' : `${remaining} papers remaining`}
          </p>
          <p className="dark:text-gray-400 text-gray-500 text-xs mt-0.5">
            {remaining <= 0
              ? 'Upgrade to Pro to continue uploading papers'
              : `You have used ${papersCount} of ${limit} free papers`}
          </p>
        </div>
        <button
          onClick={() => router.push('/upgrade')}
          className="bg-orange-500 hover:bg-orange-400 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors shrink-0 ml-4">
          Upgrade to Pro
        </button>
      </div>
      <div className="w-full dark:bg-gray-800 bg-orange-100 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${remaining <= 0 ? 'bg-red-500' : 'bg-orange-500'}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}
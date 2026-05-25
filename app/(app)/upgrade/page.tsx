'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ThemeToggle'
import { toast } from 'sonner'
import { Zap } from 'lucide-react'

function UpgradePageInner() {
  const router = useRouter()
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function checkPro() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', user.id)
        .single()

      setIsPro(data?.is_pro ?? false)
      setLoading(false)
    }
    checkPro()
  }, [supabase, router])

  async function handleUpgrade() {
    setUpgrading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please login first')
      setUpgrading(false)
      return
    }

    // Demo mode - instant Pro activation
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_pro: true, 
        pro_since: new Date().toISOString() 
      })
      .eq('id', user.id)

    if (error) {
      toast.error('Something went wrong')
      setUpgrading(false)
      return
    }

    setIsPro(true)
    toast.success('🎉 Pro activated! (Demo mode)')
    setUpgrading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen dark:bg-gray-950 bg-white flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
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
            <Zap size={64} className="mx-auto mb-6 text-orange-500" />
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
                <h2 className="text-2xl font-bold mb-1">Free</h2>
                <p className="text-3xl font-bold mb-6">
                  $0
                  <span className="text-base font-normal dark:text-gray-400 text-gray-500">/mo</span>
                </p>
                <ul className="space-y-3 mb-6">
                  {['5 papers total', '15 ideas total', 'Basic library access', 'Save ideas'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm dark:text-gray-400 text-gray-600">
                      <span className="text-orange-400">✓</span> {f}
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
                <p className="text-orange-100 text-sm mb-1">Upgrade to</p>
                <h2 className="text-2xl font-bold text-white mb-1">Pro</h2>
                <p className="text-3xl font-bold text-white mb-6">
                  $9
                  <span className="text-base font-normal text-orange-100">/mo</span>
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
                    <li key={f} className="flex items-center gap-2 text-sm text-white">
                      <span>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="w-full bg-white text-orange-500 font-semibold py-3 rounded-xl hover:bg-orange-50 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {upgrading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      Activating...
                    </>
                  ) : (
                    'Get Pro →'
                  )}
                </button>
              </div>
            </div>

            <p className="text-center dark:text-gray-600 text-gray-400 text-xs mt-8">
              This is a portfolio demo. Click "Get Pro" to instantly activate Pro features.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen dark:bg-gray-950 bg-white flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    }>
      <UpgradePageInner />
    </Suspense>
  )
}
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import { Mail, ArrowLeft, FileText } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  async function handleReset() {
    if (!email) { toast.error('Enter your email'); return }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    if (error) {
      toast.error(error.message)
    } else {
      setSent(true)
      toast.success('Reset email sent!')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <FileText size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl">PaperPulse</span>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
              <p className="text-gray-400 text-sm mb-6">
                We sent a password reset link to <span className="text-white">{email}</span>
              </p>
              <Link href="/login"
                className="text-orange-500 hover:underline text-sm flex items-center justify-center gap-2">
                <ArrowLeft size={14} /> Back to login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-2">Forgot password?</h2>
                <p className="text-gray-400 text-sm">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <div className="mb-4">
                <label className="text-gray-300 text-sm font-medium mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleReset()}
                    placeholder="you@example.com"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors placeholder:text-gray-600" />
                </div>
              </div>

              <button
                onClick={handleReset}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mb-6">
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</>
                ) : 'Send reset link'}
              </button>

              <Link href="/login"
                className="flex items-center justify-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors">
                <ArrowLeft size={14} /> Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
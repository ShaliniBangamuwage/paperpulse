'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Lock, Eye, EyeOff, FileText, Shield, CheckCircle } from 'lucide-react'

export default function AcceptInvitePage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [invite, setInvite] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const token = searchParams.get('token')

  useEffect(() => {
    async function validateToken() {
      if (!token) { setError('Invalid invite link'); setValidating(false); return }

      const { data, error } = await supabase
        .from('admin_invites')
        .select('*')
        .eq('token', token)
        .eq('used', false)
        .single()

      if (error || !data) { setError('This invite link is invalid or has already been used'); setValidating(false); return }
      if (new Date(data.expires_at) < new Date()) { setError('This invite link has expired'); setValidating(false); return }

      setInvite(data)
      setValidating(false)
    }
    validateToken()
  }, [token, supabase])

  async function handleAccept() {
    if (!password) { toast.error('Enter a password'); return }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    if (!name.trim()) { toast.error('Enter your name'); return }

    setLoading(true)
    try {
      // Sign up the new admin
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invite.email,
        password,
        options: { data: { display_name: name } }
      })

      if (signUpError) throw signUpError
      if (!authData.user) throw new Error('Failed to create account')

      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update profile to admin role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'admin', display_name: name })
        .eq('id', authData.user.id)

      if (profileError) throw profileError

      // Mark invite as used
      await supabase
        .from('admin_invites')
        .update({ used: true })
        .eq('token', token)

      setSuccess(true)
      toast.success('Admin account created!')

      setTimeout(() => router.push('/admin/login'), 2000)
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    }
    setLoading(false)
  }

  if (validating) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield size={28} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Invalid Invite</h2>
        <p className="text-gray-400 text-sm mb-6">{error}</p>
        <a href="/login" className="text-orange-500 hover:underline text-sm">← Back to login</a>
      </div>
    </div>
  )

  if (success) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Admin account created!</h2>
        <p className="text-gray-400 text-sm">Redirecting to admin login...</p>
      </div>
    </div>
  )

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
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Shield size={20} className="text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Accept Admin Invitation</h2>
              <p className="text-gray-400 text-xs">{invite?.email}</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="text-gray-300 text-sm font-medium mb-1.5 block">Your name</label>
              <input
                type="text" value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Smith"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors" />
            </div>

            <div>
              <label className="text-gray-300 text-sm font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-10 pr-12 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors" />
                <button onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-gray-300 text-sm font-medium mb-1.5 block">Confirm password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password" value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAccept()}
                  placeholder="••••••••"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors" />
              </div>
            </div>
          </div>

          <button
            onClick={handleAccept}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating account...</>
            ) : 'Accept & Create Admin Account'}
          </button>
        </div>
      </div>
    </div>
  )
}
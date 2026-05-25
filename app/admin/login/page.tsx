'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Shield } from 'lucide-react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleAdminLogin() {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    const userId = data.user?.id
    if (!userId) {
      toast.error('Login failed. Please try again.')
      setLoading(false)
      return
    }
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    if (profileError || profile?.role !== 'admin') {
      await supabase.auth.signOut()
      toast.error('Access denied. Admin accounts only.')
      setLoading(false)
      return
    }
    toast.success('Welcome, Admin!')
    window.location.href = '/admin'
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Admin Portal</h1>
          <p className="text-gray-500 text-sm">Restricted access — authorized personnel only</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-gray-400 text-sm mb-1.5 block">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          <button
            onClick={handleAdminLogin}
            disabled={loading || !email || !password}
            className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </>
            ) : 'Sign in to Admin Panel'}
          </button>

          <div className="mt-6 pt-6 border-t border-gray-800 text-center">
            <a href="/login" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
              ← Back to user login
            </a>
          </div>
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">
          Unauthorized access attempts are logged and monitored
        </p>
      </div>
    </div>
  )
}
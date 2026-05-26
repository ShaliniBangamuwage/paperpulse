'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ThemeToggle'
import { toast } from 'sonner'
import { Upload, CheckCircle, Clock, XCircle } from 'lucide-react'

function UpgradePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSuccess = searchParams.get('success') === 'true'

  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'info' | 'apply'>('info')
  const [existingRequest, setExistingRequest] = useState<any>(null)

  const [universityName, setUniversityName] = useState('')
  const [universityEmail, setUniversityEmail] = useState('')
  const [idFront, setIdFront] = useState<File | null>(null)
  const [idBack, setIdBack] = useState<File | null>(null)
  const [idFrontPreview, setIdFrontPreview] = useState('')
  const [idBackPreview, setIdBackPreview] = useState('')
  const [verifying, setVerifying] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('is_pro')
          .eq('id', user.id)
          .maybeSingle()

        setIsPro(profile?.is_pro || false)

        // FIX: avoid 406 crash
        const { data: request } = await supabase
          .from('pro_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (request) setExistingRequest(request)
      } catch (error) {
        console.error(error)
      }
    }
    checkUser()
  }, [supabase])

  function handleFileChange(file: File, side: 'front' | 'back') {
    const url = URL.createObjectURL(file)
    if (side === 'front') {
      setIdFront(file)
      setIdFrontPreview(url)
    } else {
      setIdBack(file)
      setIdBackPreview(url)
    }
  }

  async function handleApply() {
    if (!universityName || !universityEmail || !idFront || !idBack) {
      toast.error('Please fill all fields and upload both ID photos')
      return
    }

    if (!universityEmail.includes('@')) {
      toast.error('Please enter a valid university email')
      return
    }

    setVerifying(true)
    toast.info('Uploading your ID...')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please login first')
        return
      }

      // FIX: single timestamp
      const timestamp = Date.now()

      const frontPath = `${user.id}/${timestamp}-front.${idFront.name.split('.').pop()}`
      const backPath = `${user.id}/${timestamp}-back.${idBack.name.split('.').pop()}`

      const { error: frontError } = await supabase.storage
        .from('id-photos')
        .upload(frontPath, idFront)
      if (frontError) throw frontError

      const { error: backError } = await supabase.storage
        .from('id-photos')
        .upload(backPath, idBack)
      if (backError) throw backError

      // keep storing paths (OK)
      const { data: requestData, error: requestError } = await supabase
        .from('pro_requests')
        .insert({
          user_id: user.id,
          email: user.email || '',
          university_name: universityName,
          university_email: universityEmail,
          id_front_url: frontPath,
          id_back_url: backPath,
          status: 'pending'
        })
        .select()
        .single()

      if (requestError) throw requestError

      toast.info('AI is verifying your student ID...')

      // FIX: replace signed URL with public URL
      const { data: frontUrlData } = supabase.storage
        .from('id-photos')
        .getPublicUrl(frontPath)

      const { data: backUrlData } = supabase.storage
        .from('id-photos')
        .getPublicUrl(backPath)

      const frontUrl = frontUrlData.publicUrl
      const backUrl = backUrlData.publicUrl

      const res = await fetch('/api/verify-student-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: requestData.id,
          idFrontUrl: frontUrl,
          idBackUrl: backUrl,
          universityName,
          universityEmail
        })
      })

      const result = await res.json()

      if (result.status === 'approved') {
        setIsPro(true)
        toast.success('🎉 Verified! Pro access granted automatically!')
      } else {
        setExistingRequest({ ...requestData, status: 'pending' })
        toast.success('Submitted! Admin will review your ID shortly.')
        setTab('info')
      }

    } catch (error: any) {
      toast.error(error.message || 'Something went wrong')
    } finally {
      setVerifying(false)
    }
  }

  const requestStatus = existingRequest?.status
  const statusMeta = requestStatus === 'approved'
    ? { label: 'Approved', icon: CheckCircle, tone: 'emerald' }
    : requestStatus === 'pending'
      ? { label: 'Pending review', icon: Clock, tone: 'amber' }
      : requestStatus === 'rejected'
        ? { label: 'Needs attention', icon: XCircle, tone: 'rose' }
        : null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-5xl mx-auto px-8 py-16 bg-white/90 dark:bg-slate-950/90 rounded-[2rem] border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-slate-900/10 dark:shadow-black/20">

        <div className="flex items-center justify-between mb-12 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
          <button onClick={() => router.back()} className="text-sm font-medium text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-white">
            ← Back
          </button>
          <ThemeToggle />
        </div>

        {isPro ? (
          <div className="rounded-[1.75rem] border border-slate-200/80 bg-slate-50 p-12 text-center shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
              <span className="text-5xl">⚡</span>
            </div>
            <h1 className="text-4xl font-semibold mb-4 text-slate-950 dark:text-white">You're on Pro!</h1>
            <p className="text-slate-600 mb-8 dark:text-slate-400">Enjoy unlimited papers and ideas with premium access and faster workflows.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-orange-500 text-white px-8 py-3 rounded-3xl font-semibold transition hover:bg-orange-600"
            >
              Back to Dashboard →
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-12">
              <span className="inline-flex rounded-full bg-orange-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-orange-700 dark:bg-orange-500/15 dark:text-orange-200">
                Upgrade to Pro
              </span>
              <h1 className="text-5xl font-semibold mt-4 text-slate-950 dark:text-white">Unlock full academic power.</h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-400">
                Submit your student ID for verified access to premium research tools, full paper capacity, and priority summaries.
              </p>
            </div>

            {/* existing request */}
            {existingRequest && (
              <div className="mb-8 rounded-[1.75rem] border border-slate-200/80 bg-slate-50 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-950">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Request status</p>
                <div className="mt-3 text-lg font-semibold text-slate-950 dark:text-white">
                  {existingRequest.status === 'approved' && 'Approved'}
                  {existingRequest.status === 'pending' && 'Pending review'}
                  {existingRequest.status === 'rejected' && 'Needs attention'}
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Your verification request is being processed. We will email you when the review is complete.
                </p>
              </div>
            )}

            <div className="mb-10 rounded-[1.75rem] bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 p-8 text-white shadow-lg shadow-orange-500/20">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-orange-100/90">Pro Student</p>
                  <h2 className="mt-3 text-3xl font-semibold">Student upgrade</h2>
                </div>
                <div className="rounded-full bg-white/15 px-4 py-2 text-sm text-white/90">Fast review</div>
              </div>
              <p className="mt-5 text-sm leading-6 text-orange-100/90">
                Use your university credentials and student ID to claim pro benefits with a secure verification flow.
              </p>
              <button
                onClick={() => setTab('apply')}
                className="mt-8 w-full rounded-3xl bg-white px-5 py-3 text-sm font-semibold text-orange-600 transition hover:bg-slate-100"
              >
                Apply with Student ID
              </button>
            </div>

            {/* FORM */}
            {tab === 'apply' && (
              <div className="mt-10 rounded-[1.75rem] border border-slate-200/80 bg-slate-50 p-8 shadow-sm dark:border-slate-800/80 dark:bg-slate-950">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Verify your student status</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                      Upload your university ID photos and supply your official university email address.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-4 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <Upload className="h-4 w-4" /> Secure upload
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    placeholder="University Name"
                    value={universityName}
                    onChange={e => setUniversityName(e.target.value)}
                    className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-orange-400 dark:focus:ring-orange-500/20"
                  />

                  <input
                    placeholder="University Email"
                    value={universityEmail}
                    onChange={e => setUniversityEmail(e.target.value)}
                    className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-orange-400 dark:focus:ring-orange-500/20"
                  />
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className="group rounded-3xl border border-dashed border-slate-300 bg-white p-5 text-center transition hover:border-orange-500 dark:border-slate-700 dark:bg-slate-950">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/10 text-orange-600">
                      <Upload className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-slate-900 dark:text-white">Upload ID Front</p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">PNG, JPG, or PDF</p>
                    <input
                      type="file"
                      className="sr-only"
                      onChange={e => e.target.files && handleFileChange(e.target.files[0], 'front')}
                    />
                  </label>

                  <label className="group rounded-3xl border border-dashed border-slate-300 bg-white p-5 text-center transition hover:border-orange-500 dark:border-slate-700 dark:bg-slate-950">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/10 text-orange-600">
                      <Upload className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-slate-900 dark:text-white">Upload ID Back</p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">PNG, JPG, or PDF</p>
                    <input
                      type="file"
                      className="sr-only"
                      onChange={e => e.target.files && handleFileChange(e.target.files[0], 'back')}
                    />
                  </label>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {idFrontPreview && (
                    <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                      <p className="font-semibold">Front preview</p>
                      <img src={idFrontPreview} alt="ID front preview" className="mt-4 h-40 w-full rounded-2xl object-cover" />
                    </div>
                  )}
                  {idBackPreview && (
                    <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                      <p className="font-semibold">Back preview</p>
                      <img src={idBackPreview} alt="ID back preview" className="mt-4 h-40 w-full rounded-2xl object-cover" />
                    </div>
                  )}
                </div>

                <button
                  onClick={handleApply}
                  disabled={verifying}
                  className="mt-8 w-full rounded-3xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {verifying ? 'Verifying...' : 'Submit application'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="p-10">Loading...</div>}>
      <UpgradePageInner />
    </Suspense>
  )
}
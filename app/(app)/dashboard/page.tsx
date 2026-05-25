'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Paper } from '@/types'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, FileText, Zap, Ban } from 'lucide-react'

export default function DashboardPage() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [search, setSearch] = useState('')
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

 const fetchPapers = useCallback(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // ✅ Explicitly filter by user_id — don't rely on RLS alone
  const { data } = await supabase
    .from('papers')
    .select('*')
    .eq('user_id', user.id)          // <-- ADD THIS LINE
    .order('created_at', { ascending: false })

  const { data: prof } = await supabase
    .from('profiles')
    .select('role, is_pro, papers_count')
    .eq('id', user.id)
    .single()

  setPapers(data || [])
  setUserProfile(prof)
  setLoading(false)
}, [supabase])
  useEffect(() => {
    const isOAuth = searchParams.get('oauth') === 'true'

    if (isOAuth) {
      // After Google OAuth, force session refresh before fetching
      supabase.auth.refreshSession().then(() => {
        window.history.replaceState({}, '', '/dashboard')
        fetchPapers()
      })
    } else {
      fetchPapers()
    }
  }, [fetchPapers, searchParams])

  async function extractText(file: File): Promise<string> {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString()
    const buffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
    let text = ''
    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map((item: any) => item.str).join(' ') + '\n'
    }
    return text
  }

  async function handleUpload(file: File) {
    if (!file || file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file')
      return
    }

    const LIMIT = 5
    const isPro = userProfile?.is_pro === true
    const usedCount = userProfile?.papers_count || 0

    if (!isPro && usedCount >= LIMIT) {
      toast.error('Free limit reached! Upgrade to Pro to continue.')
      router.push('/upgrade')
      return
    }

    setUploading(true)
    toast.info('Reading your paper...')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const text = await extractText(file)
      const fileName = `${user.id}/${Date.now()}.pdf`

      const { error: uploadError } = await supabase.storage
        .from('papers').upload(fileName, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('papers').getPublicUrl(fileName)

      const { data: paper, error: paperError } = await supabase
        .from('papers')
        .insert({
          user_id: user.id,
          title: file.name.replace('.pdf', ''),
          abstract: text.slice(0, 500),
          file_url: publicUrl,
          status: 'processing'
        })
        .select().single()

      if (paperError) throw paperError

      await supabase.rpc('increment_paper_count', { user_id: user.id })

      toast.info('AI is generating ideas...')

      const response = await fetch('/api/process-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, paperId: paper.id })
      })

      if (!response.ok) throw new Error('Processing failed')

      toast.success('Ideas generated!')
      router.push(`/paper/${paper.id}`)
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong')
    }

    setUploading(false)
  }

  const LIMIT = 5
  const isPro = userProfile?.is_pro === true
  const usedCount = userProfile?.papers_count || 0
  const remaining = LIMIT - usedCount

  const filteredPapers = papers.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase())
  )

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    processing: 'bg-blue-500/20 text-blue-400',
    done: 'bg-green-500/20 text-green-400',
    failed: 'bg-red-500/20 text-red-400'
  }

  return (
    <div className="min-h-screen dark:bg-gray-950 bg-white text-gray-900 dark:text-white p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          {userProfile?.role === 'admin' && (
            <button
              onClick={() => router.push('/admin')}
              className="text-xs bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/30 transition-colors">
              Admin panel →
            </button>
          )}
        </div>
        <p className="dark:text-gray-400 text-gray-500 mb-6">
          Upload a research paper and get 3 project ideas instantly
        </p>

        {/* Usage bar */}
        {!loading && (
          <>
            {isPro ? (
              <div className="dark:bg-orange-500/10 dark:border-orange-500/20 bg-orange-50 border-orange-200 border rounded-2xl px-4 py-3 mb-6 flex items-center gap-2">
                <Zap size={15} className="text-orange-500" />
                <p className="text-sm text-orange-500 font-medium">
                  Pro plan — unlimited papers
                </p>
              </div>
            ) : (
              <div className={`rounded-2xl p-4 mb-6 border ${
                remaining <= 0
                  ? 'dark:bg-red-500/10 dark:border-red-500/30 bg-red-50 border-red-200'
                  : remaining <= 2
                  ? 'dark:bg-orange-500/10 dark:border-orange-500/30 bg-orange-50 border-orange-200'
                  : 'dark:bg-gray-900 dark:border-gray-800 bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium dark:text-white text-gray-900 flex items-center gap-1.5">
                    {remaining <= 0
                      ? <><Ban size={14} className="text-red-500" /> Free limit reached</>
                      : <><FileText size={14} className="text-orange-500" /> {usedCount} of {LIMIT} free papers used</>
                    }
                  </p>
                  {remaining <= 2 && (
                    <button
                      onClick={() => router.push('/upgrade')}
                      className="text-xs bg-orange-500 hover:bg-orange-400 text-white px-3 py-1.5 rounded-lg transition-colors">
                      Upgrade to Pro
                    </button>
                  )}
                </div>
                <div className="w-full dark:bg-gray-800 bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${remaining <= 0 ? 'bg-red-500' : 'bg-orange-500'}`}
                    style={{ width: `${Math.min((usedCount / LIMIT) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Upload zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault()
            setDragOver(false)
            if (e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0])
          }}
          className={`border-2 border-dashed rounded-2xl p-12 text-center mb-10 transition-colors ${
            dragOver
              ? 'border-orange-500 bg-orange-500/10'
              : 'dark:border-gray-700 dark:bg-gray-900 border-gray-200 bg-gray-50'
          }`}>
          {uploading ? (
            <div>
              <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="dark:text-gray-300 text-gray-600">Processing your paper...</p>
            </div>
          ) : (
            <div>
              <FileText size={36} className="mx-auto mb-4 dark:text-gray-600 text-gray-400" />
              <p className="dark:text-gray-300 text-gray-600 mb-2">Drag and drop your PDF here</p>
              <p className="dark:text-gray-500 text-gray-400 text-sm mb-4">or</p>
              <label className={`px-6 py-2.5 rounded-lg cursor-pointer transition-colors text-white text-sm font-medium ${
                !isPro && remaining <= 0
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-400'
              }`}>
                {!isPro && remaining <= 0 ? 'Limit reached' : 'Browse file'}
                <input
                  type="file" accept=".pdf" className="hidden"
                  disabled={!isPro && remaining <= 0}
                  onChange={e => e.target.files && handleUpload(e.target.files[0])}
                />
              </label>
              {!isPro && remaining <= 0 && (
                <p className="mt-4">
                  <button
                    onClick={() => router.push('/upgrade')}
                    className="text-orange-500 hover:underline text-sm">
                    Upgrade to Pro to continue uploading →
                  </button>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-gray-400 text-gray-400" />
            <input
              type="text"
              placeholder="Search your papers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full dark:bg-gray-900 bg-gray-50 border dark:border-gray-800 border-gray-200 dark:text-white text-gray-900 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          <span className="text-sm dark:text-gray-400 text-gray-500 shrink-0">
            {filteredPapers.length} papers
          </span>
        </div>

        {/* Papers list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full dark:bg-gray-800 bg-gray-100" />
            ))}
          </div>
        ) : filteredPapers.length === 0 && search ? (
          <p className="dark:text-gray-500 text-gray-400 text-center py-8">
            No papers matching "{search}"
          </p>
        ) : papers.length === 0 ? (
          <p className="dark:text-gray-500 text-gray-400 text-center py-8">
            No papers yet. Upload your first one above.
          </p>
        ) : (
          <div className="space-y-3">
            {filteredPapers.map(paper => (
              <div
                key={paper.id}
                onClick={() => paper.status === 'done' && router.push(`/paper/${paper.id}`)}
                className={`dark:bg-gray-900 bg-gray-50 border dark:border-gray-800 border-gray-200 rounded-xl p-4 flex items-center justify-between ${
                  paper.status === 'done' ? 'cursor-pointer dark:hover:border-orange-500 hover:border-orange-400' : ''
                } transition-colors`}>
                <div>
                  <p className="font-medium dark:text-white text-gray-900">{paper.title}</p>
                  <p className="dark:text-gray-500 text-gray-400 text-sm">
                    {new Date(paper.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColor[paper.status]}`}>
                  {paper.status}
                </span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
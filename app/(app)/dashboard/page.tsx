'use client'

export const dynamic = 'force-dynamic'

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
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        router.push('/login')
        return
      }

      const { data: papersData, error: papersError } = await supabase
        .from('papers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (papersError) {
        console.error(papersError)
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_pro, papers_count')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error(profileError)
      }

      setPapers(papersData || [])
      setUserProfile(profileData)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [router, supabase])

  useEffect(() => {
    const isOAuth = searchParams.get('oauth') === 'true'

    if (isOAuth) {
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

    const pdf = await pdfjsLib.getDocument({
      data: buffer,
    }).promise

    let text = ''

    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()

      text +=
        content.items.map((item: any) => item.str).join(' ') + '\n'
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
      toast.error(
        'Free limit reached! Upgrade to Pro to continue.'
      )
      router.push('/upgrade')
      return
    }

    setUploading(true)

    toast.info('Reading your paper...')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Please login first')
        return
      }

      const text = await extractText(file)

      const fileName = `${user.id}/${Date.now()}.pdf`

      const { error: uploadError } = await supabase.storage
        .from('papers')
        .upload(fileName, file)

      if (uploadError) {
        throw uploadError
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from('papers')
        .getPublicUrl(fileName)

      const {
        data: paper,
        error: paperError,
      } = await supabase
        .from('papers')
        .insert({
          user_id: user.id,
          title: file.name.replace('.pdf', ''),
          abstract: text.slice(0, 500),
          file_url: publicUrl,
          status: 'processing',
        })
        .select()
        .single()

      if (paperError) {
        throw paperError
      }

      await supabase.rpc('increment_paper_count', {
        user_id: user.id,
      })

      toast.info('AI is generating ideas...')

      const response = await fetch(
        '/api/process-paper',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            paperId: paper.id,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Processing failed')
      }

      toast.success('Ideas generated successfully!')

      router.push(`/paper/${paper.id}`)
    } catch (error: any) {
      console.error(error)

      toast.error(
        error.message || 'Something went wrong'
      )
    } finally {
      setUploading(false)
    }
  }

  const LIMIT = 5
  const isPro = userProfile?.is_pro === true
  const usedCount = userProfile?.papers_count || 0
  const remaining = LIMIT - usedCount

  const filteredPapers = papers.filter((paper) =>
    paper.title
      ?.toLowerCase()
      .includes(search.toLowerCase())
  )

  const statusColor: Record<string, string> = {
    pending:
      'bg-yellow-500/20 text-yellow-400',
    processing:
      'bg-blue-500/20 text-blue-400',
    done:
      'bg-green-500/20 text-green-400',
    failed:
      'bg-red-500/20 text-red-400',
  }

  return (
    <div className="min-h-screen dark:bg-gray-950 bg-white text-gray-900 dark:text-white p-6">
      <div className="max-w-4xl mx-auto">

        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-semibold">
            Dashboard
          </h1>

          {userProfile?.role === 'admin' && (
            <button
              onClick={() => router.push('/admin')}
              className="text-xs bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Admin panel →
            </button>
          )}
        </div>

        <p className="dark:text-gray-400 text-gray-500 mb-6">
          Upload a research paper and get
          3 project ideas instantly
        </p>

        {!loading && (
          <>
            {isPro ? (
              <div className="dark:bg-orange-500/10 dark:border-orange-500/20 bg-orange-50 border-orange-200 border rounded-2xl px-4 py-3 mb-6 flex items-center gap-2">
                <Zap
                  size={15}
                  className="text-orange-500"
                />

                <p className="text-sm text-orange-500 font-medium">
                  Pro plan — unlimited papers
                </p>
              </div>
            ) : (
              <div
                className={`rounded-2xl p-4 mb-6 border ${
                  remaining <= 0
                    ? 'dark:bg-red-500/10 dark:border-red-500/30 bg-red-50 border-red-200'
                    : remaining <= 2
                    ? 'dark:bg-orange-500/10 dark:border-orange-500/30 bg-orange-50 border-orange-200'
                    : 'dark:bg-gray-900 dark:border-gray-800 bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium dark:text-white text-gray-900 flex items-center gap-1.5">
                    {remaining <= 0 ? (
                      <>
                        <Ban
                          size={14}
                          className="text-red-500"
                        />
                        Free limit reached
                      </>
                    ) : (
                      <>
                        <FileText
                          size={14}
                          className="text-orange-500"
                        />
                        {usedCount} of {LIMIT} free papers used
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
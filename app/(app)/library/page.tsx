'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Search, Lightbulb, Loader2, BookOpen } from 'lucide-react'

export default function LibraryPage() {
  const [papers, setPapers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function fetchPapers() {
      const { data } = await supabase
        .from('papers')
        .select('*, ideas(count)')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
      setPapers(data || [])
      setLoading(false)
    }
    fetchPapers()
  }, [])

  const filtered = papers.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen dark:bg-gray-950 bg-white text-gray-900 dark:text-white p-6">
      <div className="max-w-5xl mx-auto">

        <div className="mb-6">
          <h1 className="text-3xl font-semibold dark:text-white text-gray-900 mb-1">Library</h1>
          <p className="dark:text-gray-400 text-gray-500 text-sm">Browse publicly shared research papers</p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-gray-500 text-gray-400" />
          <input
            type="text"
            placeholder="Search papers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full dark:bg-gray-900 bg-orange-50 border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-colors placeholder:dark:text-gray-600 placeholder:text-gray-400"
          />
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <Loader2 size={28} className="animate-spin text-orange-500" />
            <p className="dark:text-gray-500 text-gray-400 text-sm">Loading papers...</p>
          </div>

        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <div className="w-12 h-12 rounded-2xl dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 flex items-center justify-center">
              <BookOpen size={20} className="dark:text-gray-600 text-gray-400" />
            </div>
            <p className="dark:text-gray-500 text-gray-400 text-sm">
              {search ? 'No papers match your search.' : 'No public papers yet.'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs text-orange-500 hover:underline">
                Clear search
              </button>
            )}
          </div>

        ) : (
          <>
            <p className="text-xs dark:text-gray-500 text-gray-400 mb-4">
              {filtered.length} {filtered.length === 1 ? 'paper' : 'papers'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(paper => (
                <div
                  key={paper.id}
                  onClick={() => router.push(`/paper/${paper.id}`)}
                  className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 hover:border-orange-500 dark:hover:border-orange-500 rounded-2xl p-5 cursor-pointer transition-colors group">

                  <h3 className="font-medium dark:text-white text-gray-900 mb-2 leading-snug group-hover:text-orange-500 transition-colors">
                    {paper.title}
                  </h3>

                  <p className="dark:text-gray-500 text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {paper.abstract}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t dark:border-gray-800 border-orange-100">
                    <span className="text-xs dark:text-gray-500 text-gray-400">
                      {new Date(paper.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs bg-orange-500/20 text-orange-500 px-2.5 py-1 rounded-full font-medium">
                      <Lightbulb size={11} />
                      {paper.ideas?.[0]?.count || 0} ideas
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
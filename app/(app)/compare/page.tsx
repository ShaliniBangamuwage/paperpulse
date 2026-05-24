'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Paper {
  id: string
  title: string
  abstract: string
  created_at: string
  status: string
}

interface Idea {
  id: string
  title: string
  difficulty: string
  estimated_weeks: number
  tech_stack: string[]
  description: string
}

const difficultyColor: Record<string, string> = {
  Beginner: 'bg-green-500/20 text-green-400',
  Intermediate: 'bg-yellow-500/20 text-yellow-400',
  Advanced: 'bg-red-500/20 text-red-400',
}

export default function ComparePage() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [paperA, setPaperA] = useState<Paper | null>(null)
  const [paperB, setPaperB] = useState<Paper | null>(null)
  const [ideasA, setIdeasA] = useState<Idea[]>([])
  const [ideasB, setIdeasB] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [comparing, setComparing] = useState(false)
  const [aiComparison, setAiComparison] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('papers')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'done')
        .order('created_at', { ascending: false })
      setPapers(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function loadIdeas(paperId: string, side: 'A' | 'B') {
    const { data } = await supabase
      .from('ideas')
      .select('*')
      .eq('paper_id', paperId)
    if (side === 'A') setIdeasA(data || [])
    else setIdeasB(data || [])
  }

  async function selectPaper(paper: Paper, side: 'A' | 'B') {
    if (side === 'A') { setPaperA(paper); setIdeasA([]) }
    else { setPaperB(paper); setIdeasB([]) }
    await loadIdeas(paper.id, side)
    setAiComparison('')
  }

  async function generateComparison() {
    if (!paperA || !paperB) { toast.error('Select both papers first'); return }
    setComparing(true)
    try {
      const res = await fetch('/api/compare-papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperA: { title: paperA.title, abstract: paperA.abstract },
          paperB: { title: paperB.title, abstract: paperB.abstract },
        })
      })
      const { comparison } = await res.json()
      setAiComparison(comparison)
    } catch {
      toast.error('Failed to generate comparison')
    }
    setComparing(false)
  }

  return (
    <div className="min-h-screen dark:bg-gray-950 bg-white text-gray-900 dark:text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Compare Papers</h1>
          <p className="dark:text-gray-400 text-gray-500">Select two papers to compare their ideas side by side</p>
        </div>

        {/* Paper selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {(['A', 'B'] as const).map(side => (
            <div key={side} className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-5">
              <p className="text-xs dark:text-gray-500 text-gray-400 uppercase tracking-wide mb-3">Paper {side}</p>
              {side === 'A' && paperA ? (
                <div>
                  <p className="font-medium dark:text-white text-gray-900 mb-1">{paperA.title}</p>
                  <p className="text-xs dark:text-gray-500 text-gray-400 mb-3">{new Date(paperA.created_at).toLocaleDateString()}</p>
                  <button onClick={() => { setPaperA(null); setIdeasA([]) }}
                    className="text-xs text-orange-500 hover:underline">Change paper</button>
                </div>
              ) : side === 'B' && paperB ? (
                <div>
                  <p className="font-medium dark:text-white text-gray-900 mb-1">{paperB.title}</p>
                  <p className="text-xs dark:text-gray-500 text-gray-400 mb-3">{new Date(paperB.created_at).toLocaleDateString()}</p>
                  <button onClick={() => { setPaperB(null); setIdeasB([]) }}
                    className="text-xs text-orange-500 hover:underline">Change paper</button>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {loading ? (
                    <p className="text-sm dark:text-gray-500 text-gray-400">Loading...</p>
                  ) : papers.filter(p => side === 'A' ? p.id !== paperB?.id : p.id !== paperA?.id).map(paper => (
                    <button key={paper.id} onClick={() => selectPaper(paper, side)}
                      className="w-full text-left p-3 dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-100 rounded-xl text-sm hover:border-orange-500 transition-colors">
                      <p className="dark:text-white text-gray-900 font-medium line-clamp-2">{paper.title}</p>
                      <p className="text-xs dark:text-gray-500 text-gray-400 mt-1">{new Date(paper.created_at).toLocaleDateString()}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* AI Compare button */}
        {paperA && paperB && (
          <div className="flex justify-center mb-8">
            <button onClick={generateComparison} disabled={comparing}
              className="bg-orange-500 hover:bg-orange-400 text-white px-8 py-3 rounded-xl font-medium transition-colors disabled:opacity-60 flex items-center gap-2">
              {comparing ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Comparing...</> : '🤖 AI Compare'}
            </button>
          </div>
        )}

        {/* AI Comparison result */}
        {aiComparison && (
          <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-6 mb-8">
            <p className="text-xs text-orange-500 font-medium uppercase tracking-wide mb-3">AI Analysis</p>
            <p className="dark:text-gray-300 text-gray-700 text-sm leading-relaxed whitespace-pre-line">{aiComparison}</p>
          </div>
        )}

        {/* Side by side ideas */}
        {(ideasA.length > 0 || ideasB.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[{ ideas: ideasA, paper: paperA, side: 'A' }, { ideas: ideasB, paper: paperB, side: 'B' }].map(({ ideas, paper, side }) => (
              <div key={side}>
                <h3 className="font-medium dark:text-white text-gray-900 mb-4">
                  {paper?.title} — {ideas.length} ideas
                </h3>
                <div className="space-y-3">
                  {ideas.map(idea => (
                    <div key={idea.id} className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium dark:text-white text-gray-900 text-sm">{idea.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ml-2 shrink-0 ${difficultyColor[idea.difficulty]}`}>{idea.difficulty}</span>
                      </div>
                      <p className="text-xs dark:text-gray-400 text-gray-500 mb-3 line-clamp-2">{idea.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {idea.tech_stack?.slice(0, 3).map(t => (
                            <span key={t} className="text-xs bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded-full">{t}</span>
                          ))}
                        </div>
                        <span className="text-xs dark:text-gray-500 text-gray-400">~{idea.estimated_weeks}w</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!paperA && !paperB && !loading && (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">⚖️</p>
            <p className="dark:text-gray-500 text-gray-400">Select two papers above to compare them</p>
          </div>
        )}
      </div>
    </div>
  )
}
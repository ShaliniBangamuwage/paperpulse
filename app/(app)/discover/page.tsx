'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  Search, SlidersHorizontal, Sparkles, FileText, ChevronUp,
  ChevronDown, Loader2, ArrowLeft, Bot, Flame, Star, TrendingUp,
  Brain, Eye, Gamepad2, Stethoscope, Shield, Bot as RobotIcon,
  Leaf, Atom, Network, Lock, Palette, MessageSquare, Zap, Car,
  Dna, Link
} from 'lucide-react'

const TOPICS = [
  { label: 'Large Language Models', icon: Brain, query: 'large language models GPT' },
  { label: 'Computer Vision', icon: Eye, query: 'computer vision deep learning' },
  { label: 'Reinforcement Learning', icon: Gamepad2, query: 'reinforcement learning policy' },
  { label: 'Medical AI', icon: Stethoscope, query: 'AI medical diagnosis healthcare' },
  { label: 'Cybersecurity', icon: Shield, query: 'cybersecurity machine learning detection' },
  { label: 'Robotics', icon: RobotIcon, query: 'robotics autonomous systems' },
  { label: 'Climate & AI', icon: Leaf, query: 'AI climate change prediction' },
  { label: 'Quantum Computing', icon: Atom, query: 'quantum computing algorithms' },
  { label: 'Graph Neural Networks', icon: Network, query: 'graph neural networks' },
  { label: 'Federated Learning', icon: Link, query: 'federated learning privacy' },
  { label: 'Generative AI', icon: Palette, query: 'generative adversarial networks diffusion' },
  { label: 'Natural Language Processing', icon: MessageSquare, query: 'natural language processing NLP' },
  { label: 'Edge Computing', icon: Zap, query: 'edge computing IoT inference' },
  { label: 'Autonomous Vehicles', icon: Car, query: 'autonomous vehicles self-driving deep learning' },
  { label: 'Bioinformatics', icon: Dna, query: 'bioinformatics genomics machine learning' },
  { label: 'Blockchain & AI', icon: Lock, query: 'blockchain decentralized AI' },
]

interface Paper {
  paperId: string
  title: string
  abstract: string
  year: number
  authors: { name: string }[]
  openAccessPdf?: { url: string }
  citationCount: number
  summary?: string
}

const SORT_OPTIONS = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Most Cited', value: 'citations' },
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
]

function CitationBadge({ count }: { count: number }) {
  if (!count) return null
  const tier = count > 5000
    ? { color: 'bg-orange-500/20 text-orange-500', label: 'Highly Cited', icon: Flame }
    : count > 1000
    ? { color: 'bg-yellow-500/20 text-yellow-500', label: 'Well Cited', icon: Star }
    : count > 100
    ? { color: 'bg-blue-500/20 text-blue-400', label: 'Cited', icon: TrendingUp }
    : null
  if (!tier) return null
  const Icon = tier.icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${tier.color}`}>
      <Icon size={10} />
      {tier.label}
    </span>
  )
}

export default function DiscoverPage() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [papers, setPapers] = useState<Paper[]>([])
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [importingId, setImportingId] = useState<string | null>(null)
  const [summarizingId, setSummarizingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [openAccessOnly, setOpenAccessOnly] = useState(false)
  const [yearFrom, setYearFrom] = useState<number>(2000)
  const [yearTo, setYearTo] = useState<number>(new Date().getFullYear())
  const [sortBy, setSortBy] = useState('relevance')
  const [showFilters, setShowFilters] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function searchPapers(query: string) {
    setSearching(true)
    setPapers([])
    try {
      const res = await fetch(`/api/search-papers?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setPapers(data.papers || [])
    } catch {
      toast.error('Failed to fetch papers')
    }
    setSearching(false)
  }

  async function handleTopicClick(topic: typeof TOPICS[0]) {
    setSelectedTopic(topic.label)
    setSearchQuery(topic.query)
    await searchPapers(topic.query)
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSelectedTopic(null)
    await searchPapers(searchQuery)
  }

  async function summarizePaper(paper: Paper) {
    if (paper.summary) { setExpandedId(paper.paperId); return }
    setSummarizingId(paper.paperId)
    try {
      const res = await fetch('/api/summarize-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: paper.title, abstract: paper.abstract }),
      })
      const { summary } = await res.json()
      setPapers(prev => prev.map(p => p.paperId === paper.paperId ? { ...p, summary } : p))
      setExpandedId(paper.paperId)
    } catch {
      toast.error('Failed to summarize')
    }
    setSummarizingId(null)
  }

  async function importPaper(paper: Paper) {
    if (importingId) return
    setImportingId(paper.paperId)
    toast.info('Importing paper and generating ideas...')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const res = await fetch('/api/import-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: paper.title, abstract: paper.abstract, userId: user.id }),
      })
      if (!res.ok) throw new Error('Import failed')
      const { paperId } = await res.json()
      toast.success('Ideas generated!')
      router.push(`/paper/${paperId}`)
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
      setImportingId(null)
    }
  }

  const filteredPapers = useMemo(() => {
    let result = papers.filter(p => {
      if (openAccessOnly && !p.openAccessPdf?.url) return false
      if (p.year && (p.year < yearFrom || p.year > yearTo)) return false
      return true
    })
    if (sortBy === 'citations') result = [...result].sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
    else if (sortBy === 'newest') result = [...result].sort((a, b) => (b.year || 0) - (a.year || 0))
    else if (sortBy === 'oldest') result = [...result].sort((a, b) => (a.year || 0) - (b.year || 0))
    return result
  }, [papers, openAccessOnly, yearFrom, yearTo, sortBy])

  return (
    <div className="min-h-screen dark:bg-gray-950 bg-gray-50 text-gray-900 dark:text-white">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-1">Discover Research</h1>
          <p className="dark:text-gray-400 text-gray-500 text-sm">
            Browse 450M+ research papers and generate project ideas instantly
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-gray-500 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search any research topic..."
              className="w-full dark:bg-gray-900 bg-white border dark:border-gray-700 border-gray-200 dark:text-white text-gray-900 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-colors placeholder:dark:text-gray-600 placeholder:text-gray-400"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-colors ${
              showFilters
                ? 'bg-orange-500 text-white border-orange-500'
                : 'dark:bg-gray-900 bg-white dark:border-gray-700 border-gray-200 dark:text-gray-400 text-gray-500 hover:border-orange-500'
            }`}>
            <SlidersHorizontal size={15} />
            <span>Filters</span>
          </button>
          <button
            type="submit"
            disabled={searching || !searchQuery.trim()}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
            {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            <span>{searching ? 'Searching...' : 'Search'}</span>
          </button>
        </form>

        {/* Filters panel */}
        {showFilters && (
          <div className="dark:bg-gray-900 bg-white border dark:border-gray-800 border-gray-200 rounded-2xl p-5 mb-5">
            <div className="flex flex-wrap gap-6 items-center">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div
                  onClick={() => setOpenAccessOnly(v => !v)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${openAccessOnly ? 'bg-orange-500' : 'dark:bg-gray-700 bg-gray-200'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${openAccessOnly ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm dark:text-gray-300 text-gray-700">Open Access only</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-sm dark:text-gray-400 text-gray-500">Year</span>
                <input
                  type="number" value={yearFrom} min={1900} max={yearTo}
                  onChange={e => setYearFrom(Number(e.target.value))}
                  className="w-20 dark:bg-gray-800 bg-gray-50 border dark:border-gray-700 border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-orange-500 text-center" />
                <span className="dark:text-gray-600 text-gray-400">—</span>
                <input
                  type="number" value={yearTo} min={yearFrom} max={new Date().getFullYear()}
                  onChange={e => setYearTo(Number(e.target.value))}
                  className="w-20 dark:bg-gray-800 bg-gray-50 border dark:border-gray-700 border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-orange-500 text-center" />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm dark:text-gray-400 text-gray-500">Sort</span>
                <div className="flex gap-1">
                  {SORT_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setSortBy(opt.value)}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                        sortBy === opt.value
                          ? 'bg-orange-500 text-white'
                          : 'dark:bg-gray-800 bg-gray-100 dark:text-gray-400 text-gray-600 hover:text-orange-500'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Topic cards */}
        {papers.length === 0 && !searching && (
          <div>
            <p className="text-xs dark:text-gray-500 text-gray-400 uppercase tracking-wider font-medium mb-4">Popular topics</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
              {TOPICS.map(topic => {
                const Icon = topic.icon
                return (
                  <button
                    key={topic.label}
                    onClick={() => handleTopicClick(topic)}
                    className={`dark:bg-gray-900 bg-white border rounded-xl p-4 text-left transition-all hover:border-orange-500 hover:shadow-sm group ${
                      selectedTopic === topic.label
                        ? 'border-orange-500 dark:bg-orange-500/10 bg-orange-50'
                        : 'dark:border-gray-800 border-gray-200'
                    }`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                      selectedTopic === topic.label
                        ? 'bg-orange-500 text-white'
                        : 'dark:bg-gray-800 bg-gray-100 dark:text-gray-400 text-gray-500 group-hover:bg-orange-500/20 group-hover:text-orange-500'
                    }`}>
                      <Icon size={16} />
                    </div>
                    <p className="text-sm font-medium dark:text-white text-gray-900 leading-snug">{topic.label}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Loading */}
        {searching && (
          <div className="flex flex-col items-center py-24 gap-3">
            <Loader2 size={32} className="animate-spin text-orange-500" />
            <p className="dark:text-gray-400 text-gray-500 text-sm">Fetching papers from Semantic Scholar...</p>
          </div>
        )}

        {/* Results */}
        {filteredPapers.length > 0 && !searching && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <p className="text-sm dark:text-gray-400 text-gray-500">
                  {filteredPapers.length} of {papers.length} papers
                </p>
                {openAccessOnly && (
                  <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">Open Access</span>
                )}
              </div>
              <button
                onClick={() => { setPapers([]); setSelectedTopic(null); setSearchQuery('') }}
                className="flex items-center gap-1.5 text-xs text-orange-500 hover:underline">
                <ArrowLeft size={12} /> Back to topics
              </button>
            </div>

            <div className="space-y-3">
              {filteredPapers.map(paper => (
                <div key={paper.paperId}
                  className="dark:bg-gray-900 bg-white border dark:border-gray-800 border-gray-200 rounded-2xl p-5 hover:border-orange-500/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">

                      <div className="flex items-start gap-2 flex-wrap mb-1">
                        <h3 className="font-medium dark:text-white text-gray-900 leading-snug text-sm">
                          {paper.title}
                        </h3>
                        {paper.openAccessPdf?.url && (
                          <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full shrink-0 font-medium">
                            Open Access
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <p className="text-xs dark:text-gray-500 text-gray-400">
                          {paper.authors?.slice(0, 3).map(a => a.name).join(', ')}
                          {paper.authors?.length > 3 ? ' et al.' : ''}
                          {paper.year ? ` · ${paper.year}` : ''}
                        </p>
                        {paper.citationCount > 0 && (
                          <span className="text-xs dark:text-gray-500 text-gray-400">
                            · {paper.citationCount.toLocaleString()} citations
                          </span>
                        )}
                        <CitationBadge count={paper.citationCount} />
                      </div>

                      {paper.abstract && (
                        <p className="dark:text-gray-400 text-gray-500 text-sm leading-relaxed line-clamp-2 mb-3">
                          {paper.abstract}
                        </p>
                      )}

                      {paper.summary && expandedId === paper.paperId && (
                        <div className="dark:bg-gray-800 bg-gray-50 border dark:border-gray-700 border-gray-200 rounded-xl p-4 mb-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Bot size={13} className="text-orange-500" />
                            <p className="text-xs text-orange-500 font-medium">AI Summary</p>
                          </div>
                          <p className="text-sm dark:text-gray-300 text-gray-700 leading-relaxed">{paper.summary}</p>
                        </div>
                      )}

                      <button
                        onClick={() => expandedId === paper.paperId ? setExpandedId(null) : summarizePaper(paper)}
                        disabled={summarizingId === paper.paperId}
                        className="flex items-center gap-1.5 text-xs text-orange-500 hover:underline transition-colors">
                        {summarizingId === paper.paperId ? (
                          <><Loader2 size={11} className="animate-spin" /> Summarizing...</>
                        ) : expandedId === paper.paperId ? (
                          <><ChevronUp size={12} /> Hide summary</>
                        ) : (
                          <><ChevronDown size={12} /> AI Summary</>
                        )}
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => importPaper(paper)}
                        disabled={!!importingId}
                        className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-white text-xs px-4 py-2 rounded-lg transition-colors disabled:opacity-60 whitespace-nowrap font-medium">
                        {importingId === paper.paperId ? (
                          <><Loader2 size={12} className="animate-spin" /> Importing...</>
                        ) : (
                          <><Sparkles size={12} /> Generate ideas</>
                        )}
                      </button>
                      {paper.openAccessPdf?.url && (
                        <a href={paper.openAccessPdf.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 text-xs dark:bg-gray-800 bg-gray-100 border dark:border-gray-700 border-gray-200 dark:text-gray-400 text-gray-500 px-4 py-2 rounded-lg hover:border-orange-500 hover:text-orange-500 transition-colors">
                          <FileText size={12} /> Read PDF
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No results after filter */}
        {papers.length > 0 && filteredPapers.length === 0 && !searching && (
          <div className="text-center py-16">
            <p className="dark:text-gray-500 text-gray-400 mb-2 text-sm">No papers match your filters.</p>
            <button onClick={() => { setOpenAccessOnly(false); setYearFrom(2000); setYearTo(new Date().getFullYear()) }}
              className="text-xs text-orange-500 hover:underline">Reset filters</button>
          </div>
        )}

        {papers.length === 0 && !searching && selectedTopic && (
          <div className="text-center py-16">
            <p className="dark:text-gray-500 text-gray-400 text-sm">No papers found. Try a different search.</p>
          </div>
        )}

      </div>
    </div>
  )
}
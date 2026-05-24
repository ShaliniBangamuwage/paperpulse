'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type CitationFormat = 'APA' | 'IEEE' | 'MLA' | 'Chicago'

interface Paper {
  id: string
  title: string
  abstract: string
  created_at: string
}

function generateCitation(paper: Paper, format: CitationFormat, authors: string, year: string, journal: string): string {
  const t = paper.title
  const y = year || new Date(paper.created_at).getFullYear().toString()
  const a = authors || 'Unknown Author'
  const j = journal || 'Research Paper'

  switch (format) {
    case 'APA': return `${a} (${y}). ${t}. ${j}.`
    case 'IEEE': return `${a}, "${t}," ${j}, ${y}.`
    case 'MLA': return `${a}. "${t}." ${j}, ${y}.`
    case 'Chicago': return `${a}. "${t}." ${j} (${y}).`
    default: return ''
  }
}

export default function CitationsPage() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)
  const [format, setFormat] = useState<CitationFormat>('APA')
  const [authors, setAuthors] = useState('')
  const [year, setYear] = useState('')
  const [journal, setJournal] = useState('')
  const [citations, setCitations] = useState<{ paperId: string; format: CitationFormat; citation: string }[]>([])
  const [generating, setGenerating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
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
  }, [supabase])

  async function generateAICitation() {
    if (!selectedPaper) { toast.error('Select a paper first'); return }
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-citation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: selectedPaper.title, abstract: selectedPaper.abstract, format })
      })
      const data = await res.json()
      if (data.authors) setAuthors(data.authors)
      if (data.year) setYear(data.year)
      if (data.journal) setJournal(data.journal)
      toast.success('AI extracted paper details!')
    } catch {
      toast.error('Failed to extract details')
    }
    setGenerating(false)
  }

  function addCitation() {
    if (!selectedPaper) { toast.error('Select a paper first'); return }
    const citation = generateCitation(selectedPaper, format, authors, year, journal)
    setCitations(prev => {
      const filtered = prev.filter(c => !(c.paperId === selectedPaper.id && c.format === format))
      return [{ paperId: selectedPaper.id, format, citation }, ...filtered]
    })
    toast.success(`${format} citation generated!`)
  }

  async function copyCitation(citation: string, id: string) {
    await navigator.clipboard.writeText(citation)
    setCopiedId(id)
    toast.success('Citation copied!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function downloadAll() {
    if (citations.length === 0) { toast.error('No citations to download'); return }
    const text = citations.map(c => `[${c.format}]\n${c.citation}`).join('\n\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'citations.txt'; a.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded!')
  }

  const formats: CitationFormat[] = ['APA', 'IEEE', 'MLA', 'Chicago']
  const formatColors: Record<CitationFormat, string> = {
    APA: 'bg-blue-500/20 text-blue-400',
    IEEE: 'bg-orange-500/20 text-orange-500',
    MLA: 'bg-violet-500/20 text-violet-400',
    Chicago: 'bg-green-500/20 text-green-400',
  }
  const filtered = papers.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen dark:bg-gray-950 bg-white text-gray-900 dark:text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Citation Generator</h1>
          <p className="dark:text-gray-400 text-gray-500">Generate APA, IEEE, MLA and Chicago citations instantly</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-5">
              <h2 className="font-medium mb-4">Select paper</h2>
              <input type="text" placeholder="Search..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 mb-3" />
              {loading ? <p className="text-sm text-center py-4 dark:text-gray-500 text-gray-400">Loading...</p> :
                filtered.length === 0 ? <p className="text-sm text-center py-4 dark:text-gray-500 text-gray-400">No papers found</p> :
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {filtered.map(paper => (
                    <button key={paper.id} onClick={() => { setSelectedPaper(paper); setAuthors(''); setYear(''); setJournal('') }}
                      className={`w-full text-left p-3 rounded-xl text-sm transition-colors ${
                        selectedPaper?.id === paper.id ? 'bg-orange-500 text-white' :
                        'dark:bg-gray-800 bg-white dark:text-gray-300 text-gray-700 border dark:border-gray-700 border-orange-100 hover:border-orange-500'
                      }`}>
                      <p className="font-medium line-clamp-2">{paper.title}</p>
                      <p className={`text-xs mt-1 ${selectedPaper?.id === paper.id ? 'text-orange-100' : 'dark:text-gray-500 text-gray-400'}`}>
                        {new Date(paper.created_at).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              }
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-5 mb-4">
              <h2 className="font-medium mb-4">Citation format</h2>
              <div className="flex gap-2 flex-wrap mb-5">
                {formats.map(f => (
                  <button key={f} onClick={() => setFormat(f)}
                    className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                      format === f ? 'bg-orange-500 text-white' :
                      'dark:bg-gray-800 bg-white dark:text-gray-400 text-gray-500 border dark:border-gray-700 border-orange-200 hover:border-orange-500'
                    }`}>{f}</button>
                ))}
              </div>
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs dark:text-gray-500 text-gray-400 uppercase tracking-wide mb-1 block">Authors</label>
                  <input type="text" placeholder="e.g. Smith, J., Johnson, A." value={authors}
                    onChange={e => setAuthors(e.target.value)}
                    className="w-full dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs dark:text-gray-500 text-gray-400 uppercase tracking-wide mb-1 block">Year</label>
                    <input type="text" placeholder="2024" value={year} onChange={e => setYear(e.target.value)}
                      className="w-full dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="text-xs dark:text-gray-500 text-gray-400 uppercase tracking-wide mb-1 block">Journal</label>
                    <input type="text" placeholder="IEEE Transactions" value={journal} onChange={e => setJournal(e.target.value)}
                      className="w-full dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={generateAICitation} disabled={!selectedPaper || generating}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-200 dark:text-gray-300 text-gray-600 hover:border-orange-500 disabled:opacity-50 transition-colors">
                  {generating ? <><span className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />Extracting...</> : '🤖 AI extract'}
                </button>
                <button onClick={addCitation} disabled={!selectedPaper}
                  className="flex-1 bg-orange-500 hover:bg-orange-400 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                  Generate citation
                </button>
              </div>
            </div>

            {selectedPaper && (authors || year || journal) && (
              <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-5 mb-4">
                <p className="text-xs dark:text-gray-500 text-gray-400 uppercase tracking-wide mb-2">Preview</p>
                <p className="dark:text-gray-300 text-gray-700 text-sm font-mono leading-relaxed">
                  {generateCitation(selectedPaper, format, authors, year, journal)}
                </p>
              </div>
            )}

            {citations.length > 0 ? (
              <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-medium">Generated ({citations.length})</h2>
                  <button onClick={downloadAll} className="text-xs bg-orange-500/20 text-orange-500 px-3 py-1.5 rounded-lg hover:bg-orange-500/30 transition-colors">
                    ⬇️ Download all
                  </button>
                </div>
                <div className="space-y-3">
                  {citations.map((c, i) => (
                    <div key={i} className="dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-100 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium mb-2 inline-block ${formatColors[c.format]}`}>{c.format}</span>
                          <p className="text-sm dark:text-gray-300 text-gray-700 font-mono leading-relaxed break-words">{c.citation}</p>
                        </div>
                        <button onClick={() => copyCitation(c.citation, `${c.paperId}-${c.format}`)}
                          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            copiedId === `${c.paperId}-${c.format}` ? 'bg-green-500/20 text-green-400 border-green-500/20' :
                            'dark:bg-gray-700 bg-orange-50 dark:text-gray-300 text-gray-600 dark:border-gray-600 border-orange-200 hover:border-orange-500 hover:text-orange-500'
                          }`}>
                          {copiedId === `${c.paperId}-${c.format}` ? '✓' : '📋'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-12 text-center">
                <p className="text-3xl mb-3">📝</p>
                <p className="dark:text-gray-500 text-gray-400">Select a paper and click Generate citation</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
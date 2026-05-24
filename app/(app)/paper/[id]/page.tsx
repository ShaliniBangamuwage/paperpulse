'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Paper, Idea } from '@/types'
import { toast } from 'sonner'
import { useParams, useRouter } from 'next/navigation'

const difficultyColor: Record<string, string> = {
  Beginner: 'bg-green-500/20 text-green-400',
  Intermediate: 'bg-yellow-500/20 text-yellow-400',
  Advanced: 'bg-red-500/20 text-red-400'
}

export default function PaperPage() {
  const { id } = useParams()
  const [paper, setPaper] = useState<Paper | null>(null)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All')
  const [techFilter, setTechFilter] = useState<string>('All')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [likes, setLikes] = useState<Record<string, { count: number; liked: boolean }>>({})
  const [userId, setUserId] = useState<string>('')
  const [likingId, setLikingId] = useState<string | null>(null)
  const [sharedId, setSharedId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: paperData } = await supabase
        .from('papers').select('*').eq('id', id).single()
      const { data: ideasData } = await supabase
        .from('ideas').select('*').eq('paper_id', id)
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setUserId(user.id)
        const { data: saved } = await supabase
          .from('saved_ideas').select('idea_id').eq('user_id', user.id)
        setSavedIds(saved?.map(s => s.idea_id) || [])

        const { data: likesData } = await supabase
          .from('likes')
          .select('idea_id, user_id')

        const likeMap: Record<string, { count: number; liked: boolean }> = {}
        likesData?.forEach(l => {
          if (!likeMap[l.idea_id]) likeMap[l.idea_id] = { count: 0, liked: false }
          likeMap[l.idea_id].count++
          if (l.user_id === user.id) likeMap[l.idea_id].liked = true
        })
        setLikes(likeMap)
      }

      setPaper(paperData)
      setIdeas(ideasData || [])
      setLoading(false)
    }
    load()
  }, [id, supabase])

  async function toggleLike(ideaId: string) {
    if (!userId || likingId) return
    setLikingId(ideaId)
    const current = likes[ideaId] || { count: 0, liked: false }
    if (current.liked) {
      await supabase.from('likes').delete().eq('idea_id', ideaId).eq('user_id', userId)
      setLikes(prev => ({
        ...prev,
        [ideaId]: { count: Math.max((prev[ideaId]?.count || 1) - 1, 0), liked: false }
      }))
    } else {
      await supabase.from('likes').insert({ idea_id: ideaId, user_id: userId })
      setLikes(prev => ({
        ...prev,
        [ideaId]: { count: (prev[ideaId]?.count || 0) + 1, liked: true }
      }))
    }
    setLikingId(null)
  }

  // Feature 9 — Share idea via link
  async function shareIdea(idea: Idea) {
    const url = `${window.location.origin}/idea/${idea.id}`
    try {
      await navigator.clipboard.writeText(url)
      setSharedId(idea.id)
      toast.success('Link copied! Share it with anyone.')
      setTimeout(() => setSharedId(null), 2000)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  async function saveIdea(ideaId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('saved_ideas').insert({
      user_id: user.id,
      idea_id: ideaId,
      status: 'saved'
    })
    if (!error) {
      setSavedIds(prev => [...prev, ideaId])
      toast.success('Idea saved to your board!')
    }
  }

  async function togglePublic() {
    if (!paper) return
    setToggling(true)
    const newValue = !paper.is_public
    const { error } = await supabase
      .from('papers')
      .update({ is_public: newValue })
      .eq('id', paper.id)
    if (!error) {
      setPaper(prev => prev ? { ...prev, is_public: newValue } : null)
      toast.success(newValue ? 'Paper shared to library!' : 'Paper removed from library')
    } else {
      toast.error('Failed to update')
    }
    setToggling(false)
  }

  async function copyIdea(idea: Idea) {
    const text = `
💡 ${idea.title}

${idea.description}

🏗️ Architecture:
${idea.architecture}

🛠️ Tech Stack: ${idea.tech_stack?.join(', ')}
⏱️ Estimated time: ${idea.estimated_weeks} weeks
📊 Difficulty: ${idea.difficulty}
    `.trim()
    await navigator.clipboard.writeText(text)
    setCopiedId(idea.id)
    toast.success('Idea copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }
async function flagIdea(ideaId: string) {
  const { error } = await supabase.from('ideas').update({ flagged: true }).eq('id', ideaId)
  if (!error) {
    toast.success('Idea flagged for review')
  } else {
    toast.error('Failed to flag idea')
  }
}
  async function downloadPDF() {
    if (!paper || ideas.length === 0) return
    setDownloading(true)
    toast.info('Generating PDF...')
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      const contentWidth = pageWidth - margin * 2
      let y = 20

      function checkNewPage(neededSpace: number) {
        if (y + neededSpace > 270) { doc.addPage(); y = 20 }
      }
      function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
        doc.setFontSize(fontSize)
        return doc.splitTextToSize(text, maxWidth)
      }

      doc.setFillColor(249, 115, 22)
      doc.rect(0, 0, pageWidth, 40, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('PaperPulse', margin, 18)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('AI-Generated Project Ideas Report', margin, 28)
      doc.text(new Date().toLocaleDateString(), pageWidth - margin, 28, { align: 'right' })
      y = 55

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      const titleLines = wrapText(paper.title, contentWidth, 14)
      doc.text(titleLines, margin, y)
      y += titleLines.length * 7 + 4

      if (paper.abstract) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 100)
        const abstractLines = wrapText(`Abstract: ${paper.abstract}`, contentWidth, 9)
        const preview = abstractLines.slice(0, 4)
        doc.text(preview, margin, y)
        y += preview.length * 5 + 10
      }

      doc.setDrawColor(249, 115, 22)
      doc.setLineWidth(0.5)
      doc.line(margin, y, pageWidth - margin, y)
      y += 10

      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(`${filteredIdeas.length} Project Ideas`, margin, y)
      y += 12

      filteredIdeas.forEach((idea, index) => {
        checkNewPage(60)
        doc.setFillColor(249, 115, 22)
        doc.roundedRect(margin, y - 5, 8, 8, 2, 2, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        doc.text(`${index + 1}`, margin + 2.5, y + 0.5)
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        const titleLines2 = wrapText(idea.title, contentWidth - 12, 12)
        doc.text(titleLines2, margin + 12, y)
        y += titleLines2.length * 6 + 2
        const diffColor: Record<string, [number, number, number]> = {
          Beginner: [34, 197, 94], Intermediate: [234, 179, 8], Advanced: [239, 68, 68]
        }
        const color = diffColor[idea.difficulty] || [156, 163, 175]
        doc.setFillColor(...color)
        doc.roundedRect(margin, y, 28, 6, 1, 1, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(7)
        doc.text(idea.difficulty, margin + 2, y + 4.2)
        doc.setFillColor(229, 231, 235)
        doc.roundedRect(margin + 32, y, 32, 6, 1, 1, 'F')
        doc.setTextColor(75, 85, 99)
        doc.text(`${idea.estimated_weeks} weeks`, margin + 34, y + 4.2)
        y += 10
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(55, 65, 81)
        const descLines = wrapText(idea.description, contentWidth, 9)
        checkNewPage(descLines.length * 5 + 6)
        doc.text(descLines, margin, y)
        y += descLines.length * 5 + 4
        checkNewPage(20)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(249, 115, 22)
        doc.text('Architecture', margin, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(75, 85, 99)
        const archLines = wrapText(idea.architecture, contentWidth, 8)
        checkNewPage(archLines.length * 4.5 + 6)
        doc.text(archLines, margin, y)
        y += archLines.length * 4.5 + 4
        checkNewPage(16)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(249, 115, 22)
        doc.text('Tech Stack', margin, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(75, 85, 99)
        doc.text(idea.tech_stack?.join(' · ') || '', margin, y)
        y += 14
        if (index < filteredIdeas.length - 1) {
          doc.setDrawColor(229, 231, 235)
          doc.setLineWidth(0.3)
          doc.line(margin, y - 4, pageWidth - margin, y - 4)
        }
      })

      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(156, 163, 175)
        doc.text(`Generated by PaperPulse · Page ${i} of ${pageCount}`, pageWidth / 2, 287, { align: 'center' })
      }
      const fileName = `${paper.title.slice(0, 30).replace(/[^a-z0-9]/gi, '_')}_ideas.pdf`
      doc.save(fileName)
      toast.success('PDF downloaded!')
    } catch (error: any) {
      toast.error('Failed to generate PDF')
      console.error(error)
    }
    setDownloading(false)
  }

  const allTechs = Array.from(new Set(ideas.flatMap(idea => idea.tech_stack || []))).sort()
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced']
  const techOptions = ['All', ...allTechs]

  const filteredIdeas = ideas.filter(idea => {
    const matchesDifficulty = difficultyFilter === 'All' || idea.difficulty === difficultyFilter
    const matchesTech = techFilter === 'All' || idea.tech_stack?.includes(techFilter)
    return matchesDifficulty && matchesTech
  })

  if (loading) return (
    <div className="min-h-screen dark:bg-gray-950 bg-white flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
    </div>
  )

  if (!paper) return (
    <div className="min-h-screen dark:bg-gray-950 bg-white flex items-center justify-center">
      <p className="dark:text-gray-400 text-gray-500">Paper not found</p>
    </div>
  )

  return (
    <div className="min-h-screen dark:bg-gray-950 bg-white text-gray-900 dark:text-white p-6">
      <div className="max-w-6xl mx-auto">

        <button
          onClick={() => router.push('/dashboard')}
          className="dark:text-gray-400 text-gray-500 hover:text-orange-500 text-sm mb-6 flex items-center gap-2 transition-colors">
          ← Back to dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left panel */}
          <div className="lg:col-span-1">
            <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">📄</span>
                <span className="text-xs dark:text-gray-500 text-gray-400 uppercase tracking-wide font-medium">Research paper</span>
              </div>
              <h2 className="text-lg font-semibold mb-4 leading-snug dark:text-white text-gray-900">{paper.title}</h2>

              <div className="border-t dark:border-gray-800 border-orange-100 pt-4 mb-4">
                <p className="text-xs dark:text-gray-500 text-gray-400 uppercase tracking-wide mb-2">Abstract</p>
                <p className="dark:text-gray-400 text-gray-500 text-sm leading-relaxed line-clamp-6">{paper.abstract}</p>
              </div>

              <div className="border-t dark:border-gray-800 border-orange-100 pt-4 mb-4">
                <p className="text-xs dark:text-gray-500 text-gray-400 uppercase tracking-wide mb-2">Stats</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="dark:text-gray-400 text-gray-500">Ideas generated</span>
                  <span className="dark:text-white text-gray-900 font-medium">{ideas.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="dark:text-gray-400 text-gray-500">Showing</span>
                  <span className="dark:text-white text-gray-900 font-medium">{filteredIdeas.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="dark:text-gray-400 text-gray-500">Status</span>
                  <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">{paper.status}</span>
                </div>
              </div>

              <button
                onClick={() => router.push(`/chat/${paper.id}`)}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all mb-3 dark:bg-gray-800 bg-white dark:text-gray-300 text-gray-600 hover:bg-orange-500 hover:text-white border dark:border-gray-700 border-orange-200 hover:border-orange-500">
                💬 Chat with this paper
              </button>

              <button
                onClick={downloadPDF}
                disabled={downloading || ideas.length === 0}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all mb-3 bg-orange-500 hover:bg-orange-400 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {downloading ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating...</>
                ) : '⬇️ Download PDF report'}
              </button>

              <button
                onClick={togglePublic}
                disabled={toggling}
                className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  paper.is_public
                    ? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400 border border-green-500/30 hover:border-red-500/30'
                    : 'dark:bg-gray-800 bg-white text-gray-600 dark:text-gray-300 hover:bg-orange-500 hover:text-white border dark:border-gray-700 border-orange-200 hover:border-orange-500'
                }`}>
                {toggling ? 'Updating...' : paper.is_public ? '✓ Shared to library' : '+ Share to library'}
              </button>
              <p className="dark:text-gray-600 text-gray-400 text-xs mt-2 text-center">
                {paper.is_public ? 'Anyone can see this paper' : 'Only you can see this paper'}
              </p>
            </div>
          </div>

          {/* Right panel */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-semibold">Generated ideas</h1>
              <span className="dark:text-gray-500 text-gray-400 text-sm">{filteredIdeas.length} of {ideas.length}</span>
            </div>

            <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-4 mb-6">
              <div className="flex flex-wrap gap-4">
                <div>
                  <p className="text-xs dark:text-gray-500 text-gray-400 uppercase tracking-wide mb-2">Difficulty</p>
                  <div className="flex gap-2 flex-wrap">
                    {difficulties.map(d => (
                      <button key={d} onClick={() => setDifficultyFilter(d)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                          difficultyFilter === d ? 'bg-orange-500 text-white'
                            : 'dark:bg-gray-800 bg-white dark:text-gray-400 text-gray-500 dark:hover:bg-gray-700 hover:bg-orange-100 border dark:border-gray-700 border-orange-100'
                        }`}>{d}</button>
                    ))}
                  </div>
                </div>
                {allTechs.length > 0 && (
                  <div>
                    <p className="text-xs dark:text-gray-500 text-gray-400 uppercase tracking-wide mb-2">Tech stack</p>
                    <div className="flex gap-2 flex-wrap">
                      {techOptions.map(t => (
                        <button key={t} onClick={() => setTechFilter(t)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                            techFilter === t ? 'bg-orange-500 text-white'
                              : 'dark:bg-gray-800 bg-white dark:text-gray-400 text-gray-500 dark:hover:bg-gray-700 hover:bg-orange-100 border dark:border-gray-700 border-orange-100'
                          }`}>{t}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {(difficultyFilter !== 'All' || techFilter !== 'All') && (
                <button onClick={() => { setDifficultyFilter('All'); setTechFilter('All') }}
                  className="text-xs text-orange-500 hover:underline mt-3 block">
                  Reset filters
                </button>
              )}
            </div>

            {filteredIdeas.length === 0 ? (
              <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-12 text-center">
                <p className="text-2xl mb-3">🔍</p>
                <p className="dark:text-gray-500 text-gray-400">No ideas match your filters.</p>
                <button onClick={() => { setDifficultyFilter('All'); setTechFilter('All') }}
                  className="text-orange-500 hover:underline text-sm mt-2">Reset filters</button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredIdeas.map((idea, i) => (
                  <div key={idea.id} className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-6 dark:hover:border-gray-700 hover:border-orange-200 transition-colors">

                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-orange-500/20 text-orange-500 text-xs font-mono px-2 py-1 rounded-lg">#{i + 1}</span>
                        <h3 className="text-lg font-medium dark:text-white text-gray-900">{idea.title}</h3>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ml-4 shrink-0 ${difficultyColor[idea.difficulty] || 'bg-gray-500/20 text-gray-400'}`}>
                        {idea.difficulty}
                      </span>
                    </div>

                    <p className="dark:text-gray-400 text-gray-500 text-sm mb-4 leading-relaxed">{idea.description}</p>

                    <div className="dark:bg-gray-800/50 bg-white rounded-xl p-4 mb-4 border dark:border-gray-700 border-orange-100">
                      <p className="text-xs dark:text-gray-500 text-gray-400 uppercase tracking-wide mb-2">Architecture</p>
                      <p className="dark:text-gray-300 text-gray-600 text-sm leading-relaxed">{idea.architecture}</p>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs dark:text-gray-500 text-gray-400 uppercase tracking-wide mb-2">Tech stack</p>
                      <div className="flex flex-wrap gap-2">
                        {idea.tech_stack?.map(tech => (
                          <button key={tech} onClick={() => setTechFilter(tech)}
                            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                              techFilter === tech ? 'bg-orange-500 text-white border-orange-500'
                                : 'bg-orange-500/20 text-orange-500 border-orange-500/20 hover:bg-orange-500 hover:text-white'
                            }`}>{tech}</button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t dark:border-gray-800 border-orange-100">
                      <span className="dark:text-gray-500 text-gray-400 text-sm">
                        ~{idea.estimated_weeks} {idea.estimated_weeks === 1 ? 'week' : 'weeks'} to build
                      </span>
                      <div className="flex items-center gap-2 flex-wrap justify-end">

                        {/* Like — Feature 8 */}
                        <button
                          onClick={() => toggleLike(idea.id)}
                          disabled={likingId === idea.id}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all border ${
                            likes[idea.id]?.liked
                              ? 'bg-red-500/20 text-red-400 border-red-500/20'
                              : 'dark:bg-gray-800 bg-white dark:text-gray-400 text-gray-500 dark:border-gray-700 border-orange-200 hover:border-red-400 hover:text-red-400'
                          }`}>
                          {likes[idea.id]?.liked ? '❤️' : '🤍'}
                          <span>{likes[idea.id]?.count || 0}</span>
                        </button>

                        {/* Share — Feature 9 */}
                        <button
                          onClick={() => shareIdea(idea)}
                          className={`px-3 py-2 rounded-lg text-sm transition-all border ${
                            sharedId === idea.id
                              ? 'bg-green-500/20 text-green-400 border-green-500/20'
                              : 'dark:bg-gray-800 bg-white dark:text-gray-400 text-gray-500 dark:border-gray-700 border-orange-200 hover:border-orange-500 hover:text-orange-500'
                          }`}>
                          {sharedId === idea.id ? '✓ Copied' : '🔗 Share'}
                        </button>
                          <button
      onClick={() => flagIdea(idea.id)}
      className="px-3 py-2 rounded-lg text-xs border dark:border-gray-700 border-orange-200 dark:text-gray-400 text-gray-500 hover:border-red-500 hover:text-red-400 transition-colors">
      🚩 Flag
    </button>

                        <button
                          onClick={() => copyIdea(idea)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                            copiedId === idea.id
                              ? 'bg-green-500/20 text-green-400 border-green-500/20'
                              : 'dark:bg-gray-800 bg-white dark:text-gray-300 text-gray-600 dark:border-gray-700 border-orange-200 hover:border-orange-500 hover:text-orange-500'
                          }`}>
                          {copiedId === idea.id ? '✓ Copied' : '📋 Copy'}
                        </button>

                        <button
                          onClick={() => !savedIds.includes(idea.id) && saveIdea(idea.id)}
                          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                            savedIds.includes(idea.id)
                              ? 'bg-green-500/20 text-green-400 cursor-default border border-green-500/20'
                              : 'bg-orange-500 hover:bg-orange-400 text-white'
                          }`}>
                          {savedIds.includes(idea.id) ? '✓ Saved' : 'Save idea'}
                        </button>

                        <button
                          onClick={() => router.push(`/roadmap/${idea.id}`)}
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-all border dark:bg-gray-800 bg-white dark:text-gray-300 text-gray-600 dark:border-gray-700 border-orange-200 hover:border-orange-500 hover:text-orange-500">
                          🗺️ Roadmap
                        </button>

                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface RoadmapPhase {
  phase: number
  title: string
  duration: string
  tasks: string[]
  deliverable: string
}

interface Roadmap {
  idea_title: string
  total_duration: string
  difficulty: string
  overview: string
  phases: RoadmapPhase[]
  tech_stack: string[]
  tips: string[]
}

export default function RoadmapPage() {
  const { id } = useParams()
  const [idea, setIdea] = useState<any>(null)
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copiedPhase, setCopiedPhase] = useState<number | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('ideas')
        .select('*, papers(title)')
        .eq('id', id)
        .single()
      setIdea(data)
      setLoading(false)
    }
    load()
  }, [id, supabase])

  async function generateRoadmap() {
    if (!idea) return
    setGenerating(true)
    toast.info('AI is building your roadmap...')

    try {
      const response = await fetch('/api/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: idea.title,
          description: idea.description,
          architecture: idea.architecture,
          tech_stack: idea.tech_stack,
          difficulty: idea.difficulty,
          estimated_weeks: idea.estimated_weeks
        })
      })

      if (!response.ok) throw new Error('Failed to generate roadmap')
      const data = await response.json()
      setRoadmap(data.roadmap)
      toast.success('Roadmap generated!')
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong')
    }

    setGenerating(false)
  }

  async function copyPhase(phase: RoadmapPhase) {
    const text = `
Phase ${phase.phase}: ${phase.title} (${phase.duration})

Tasks:
${phase.tasks.map(t => `• ${t}`).join('\n')}

Deliverable: ${phase.deliverable}
    `.trim()
    await navigator.clipboard.writeText(text)
    setCopiedPhase(phase.phase)
    toast.success('Phase copied!')
    setTimeout(() => setCopiedPhase(null), 2000)
  }

  async function copyFullRoadmap() {
    if (!roadmap) return
    const text = `
🗺️ Project Roadmap: ${roadmap.idea_title}
Total Duration: ${roadmap.total_duration}
Difficulty: ${roadmap.difficulty}

Overview:
${roadmap.overview}

${roadmap.phases.map(p => `
Phase ${p.phase}: ${p.title} (${p.duration})
Tasks:
${p.tasks.map(t => `• ${t}`).join('\n')}
Deliverable: ${p.deliverable}
`).join('\n---\n')}

Tech Stack: ${roadmap.tech_stack.join(', ')}

Tips:
${roadmap.tips.map(t => `• ${t}`).join('\n')}
    `.trim()
    await navigator.clipboard.writeText(text)
    toast.success('Full roadmap copied!')
  }

  const phaseColors = [
    'border-blue-500/30 bg-blue-500/5',
    'border-violet-500/30 bg-violet-500/5',
    'border-orange-500/30 bg-orange-500/5',
    'border-green-500/30 bg-green-500/5',
    'border-pink-500/30 bg-pink-500/5',
  ]

  const phaseNumberColors = [
    'bg-blue-500',
    'bg-violet-500',
    'bg-orange-500',
    'bg-green-500',
    'bg-pink-500',
  ]

  if (loading) return (
    <div className="min-h-screen dark:bg-gray-950 bg-white flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
    </div>
  )

  if (!idea) return (
    <div className="min-h-screen dark:bg-gray-950 bg-white flex items-center justify-center">
      <p className="dark:text-gray-400 text-gray-500">Idea not found</p>
    </div>
  )

  return (
    <div className="min-h-screen dark:bg-gray-950 bg-white text-gray-900 dark:text-white p-6">
      <div className="max-w-4xl mx-auto">

        <button
          onClick={() => router.back()}
          className="dark:text-gray-400 text-gray-500 hover:text-orange-500 text-sm mb-6 flex items-center gap-2 transition-colors">
          ← Back
        </button>

        {/* Idea header */}
        <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs dark:text-gray-500 text-gray-400 uppercase tracking-wide mb-2">Project idea</p>
              <h1 className="text-2xl font-semibold dark:text-white text-gray-900 mb-2">{idea.title}</h1>
              <p className="dark:text-gray-400 text-gray-500 text-sm leading-relaxed mb-4">{idea.description}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  idea.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' :
                  idea.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {idea.difficulty}
                </span>
                <span className="text-xs dark:text-gray-500 text-gray-400">
                  ~{idea.estimated_weeks} weeks
                </span>
                <span className="text-xs dark:text-gray-500 text-gray-400">
                  from: {(idea as any).papers?.title}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Generate button */}
        {!roadmap && (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🗺️</div>
            <h2 className="text-xl font-semibold mb-3 dark:text-white text-gray-900">
              Generate your project roadmap
            </h2>
            <p className="dark:text-gray-400 text-gray-500 text-sm mb-8 max-w-md mx-auto">
              AI will break down this project into phases with specific tasks, timelines, and deliverables.
            </p>
            <button
              onClick={generateRoadmap}
              disabled={generating}
              className="bg-orange-500 hover:bg-orange-400 text-white px-8 py-3 rounded-xl font-medium transition-colors disabled:opacity-60 flex items-center gap-2 mx-auto">
              {generating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating roadmap...
                </>
              ) : '✨ Generate Roadmap'}
            </button>
          </div>
        )}

        {/* Roadmap */}
        {roadmap && (
          <div>
            {/* Roadmap header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold dark:text-white text-gray-900">Project Roadmap</h2>
                <p className="dark:text-gray-400 text-gray-500 text-sm mt-1">
                  {roadmap.total_duration} · {roadmap.phases.length} phases
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyFullRoadmap}
                  className="dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-200 dark:text-gray-300 text-gray-600 text-sm px-4 py-2 rounded-lg hover:border-orange-500 hover:text-orange-500 transition-colors">
                  📋 Copy all
                </button>
                <button
                  onClick={generateRoadmap}
                  disabled={generating}
                  className="bg-orange-500/20 text-orange-500 text-sm px-4 py-2 rounded-lg hover:bg-orange-500 hover:text-white transition-colors disabled:opacity-50">
                  {generating ? 'Regenerating...' : '↻ Regenerate'}
                </button>
              </div>
            </div>

            {/* Overview */}
            <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-5 mb-6">
              <p className="text-xs dark:text-gray-500 text-gray-400 uppercase tracking-wide mb-2">Overview</p>
              <p className="dark:text-gray-300 text-gray-600 text-sm leading-relaxed">{roadmap.overview}</p>
            </div>

            {/* Timeline bar */}
            <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-5 mb-6">
              <p className="text-xs dark:text-gray-500 text-gray-400 uppercase tracking-wide mb-3">Timeline</p>
              <div className="flex rounded-xl overflow-hidden h-8">
                {roadmap.phases.map((phase, i) => (
                  <div
                    key={i}
                    className={`flex-1 flex items-center justify-center text-white text-xs font-medium ${phaseNumberColors[i % phaseNumberColors.length]}`}
                    title={`Phase ${phase.phase}: ${phase.title}`}>
                    P{phase.phase}
                  </div>
                ))}
              </div>
              <div className="flex mt-2">
                {roadmap.phases.map((phase, i) => (
                  <div key={i} className="flex-1 text-center">
                    <p className="text-xs dark:text-gray-500 text-gray-400 truncate px-1">{phase.duration}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Phases */}
            <div className="space-y-4 mb-6">
              {roadmap.phases.map((phase, i) => (
                <div key={i} className={`border rounded-2xl p-6 ${phaseColors[i % phaseColors.length]}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${phaseNumberColors[i % phaseNumberColors.length]}`}>
                        {phase.phase}
                      </div>
                      <div>
                        <h3 className="font-semibold dark:text-white text-gray-900">{phase.title}</h3>
                        <p className="text-xs dark:text-gray-400 text-gray-500 mt-0.5">{phase.duration}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => copyPhase(phase)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors shrink-0 ml-4 ${
                        copiedPhase === phase.phase
                          ? 'bg-green-500/20 text-green-400 border-green-500/20'
                          : 'dark:bg-gray-800 bg-white dark:border-gray-700 border-gray-200 dark:text-gray-400 text-gray-500 hover:border-orange-500 hover:text-orange-500'
                      }`}>
                      {copiedPhase === phase.phase ? '✓ Copied' : '📋 Copy'}
                    </button>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs dark:text-gray-500 text-gray-400 uppercase tracking-wide mb-2">Tasks</p>
                    <ul className="space-y-2">
                      {phase.tasks.map((task, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm dark:text-gray-300 text-gray-600">
                          <span className="text-orange-500 shrink-0 mt-0.5">•</span>
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t dark:border-gray-700 border-gray-200 pt-3">
                    <p className="text-xs dark:text-gray-500 text-gray-400 uppercase tracking-wide mb-1">Deliverable</p>
                    <p className="text-sm dark:text-orange-400 text-orange-600 font-medium">{phase.deliverable}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tech stack */}
            <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-5 mb-6">
              <p className="text-xs dark:text-gray-500 text-gray-400 uppercase tracking-wide mb-3">Tech stack</p>
              <div className="flex flex-wrap gap-2">
                {roadmap.tech_stack.map(tech => (
                  <span key={tech} className="bg-orange-500/20 text-orange-500 text-xs px-3 py-1 rounded-full border border-orange-500/20">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-5">
              <p className="text-xs dark:text-gray-500 text-gray-400 uppercase tracking-wide mb-3">Pro tips</p>
              <ul className="space-y-2">
                {roadmap.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm dark:text-gray-300 text-gray-600">
                    <span className="text-orange-500 shrink-0">💡</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface PortfolioData {
  id: string
  name: string
  bio: string
  github_url: string
  linkedin_url: string
  website_url: string
  is_public: boolean
}

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [ideas, setIdeas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')
  const [form, setForm] = useState({
    name: '', bio: '', github_url: '', linkedin_url: '', website_url: '', is_public: true
  })
  const supabase = createClient()

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const [{ data: p }, { data: proj }, { data: savedIdeas }] = await Promise.all([
      supabase.from('portfolio').select('*').eq('user_id', user.id).single(),
      supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('saved_ideas').select('*, ideas(title, description, difficulty, tech_stack, github_url, demo_url)').eq('user_id', user.id),
    ])

    if (p) {
      setPortfolio(p)
      setForm({ name: p.name, bio: p.bio || '', github_url: p.github_url || '', linkedin_url: p.linkedin_url || '', website_url: p.website_url || '', is_public: p.is_public })
    }
    setProjects(proj || [])
    setIdeas(savedIdeas || [])
    setLoading(false)
  }

  async function savePortfolio() {
    if (!form.name.trim()) { toast.error('Enter your name'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (portfolio) {
      const { error } = await supabase.from('portfolio').update(form).eq('id', portfolio.id)
      if (error) { toast.error('Failed'); setSaving(false); return }
    } else {
      const { data, error } = await supabase.from('portfolio').insert({ ...form, user_id: user.id }).select().single()
      if (error) { toast.error('Failed'); setSaving(false); return }
      setPortfolio(data)
    }
    toast.success('Portfolio saved!')
    setSaving(false)
  }

  async function updateIdeaLinks(ideaId: string, field: 'github_url' | 'demo_url', value: string) {
    await supabase.from('ideas').update({ [field]: value }).eq('id', ideaId)
    setIdeas(prev => prev.map(i => i.ideas?.id === ideaId ? { ...i, ideas: { ...i.ideas, [field]: value } } : i))
  }

  const portfolioUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/portfolio/${userId}`

  if (loading) return (
    <div className="min-h-screen dark:bg-gray-950 bg-white flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="min-h-screen dark:bg-gray-950 bg-white text-gray-900 dark:text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Portfolio Builder</h1>
          <p className="dark:text-gray-400 text-gray-500">Build your public portfolio to share with recruiters</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">

            {/* Profile form */}
            <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-5">
              <h2 className="font-medium mb-4">Profile</h2>
              <div className="space-y-3">
                <input placeholder="Your name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
                <textarea placeholder="Short bio" value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={3}
                  className="w-full dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 resize-none" />
                <input placeholder="GitHub URL" value={form.github_url} onChange={e => setForm(p => ({ ...p, github_url: e.target.value }))}
                  className="w-full dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
                <input placeholder="LinkedIn URL" value={form.linkedin_url} onChange={e => setForm(p => ({ ...p, linkedin_url: e.target.value }))}
                  className="w-full dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
                <input placeholder="Website URL" value={form.website_url} onChange={e => setForm(p => ({ ...p, website_url: e.target.value }))}
                  className="w-full dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500" />

                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setForm(p => ({ ...p, is_public: !p.is_public }))}
                    className={`w-10 h-5 rounded-full transition-colors relative ${form.is_public ? 'bg-orange-500' : 'dark:bg-gray-700 bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.is_public ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-sm dark:text-gray-300 text-gray-700">Public portfolio</span>
                </label>

                <button onClick={savePortfolio} disabled={saving}
                  className="w-full bg-orange-500 hover:bg-orange-400 text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save portfolio'}
                </button>
              </div>
            </div>

            {/* Share link */}
            {portfolio && form.is_public && (
              <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-5">
                <h2 className="font-medium mb-3">Share link</h2>
                <p className="text-xs dark:text-gray-400 text-gray-500 mb-3 break-all">{portfolioUrl}</p>
                <div className="flex gap-2">
                  <button onClick={() => { navigator.clipboard.writeText(portfolioUrl); toast.success('Copied!') }}
                    className="flex-1 bg-orange-500/20 text-orange-500 py-2 rounded-xl text-xs font-medium hover:bg-orange-500/30 transition-colors">
                    Copy link
                  </button>
                  <a href={portfolioUrl} target="_blank" rel="noreferrer"
                    className="flex-1 text-center dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-200 dark:text-gray-300 text-gray-600 py-2 rounded-xl text-xs hover:border-orange-500 transition-colors">
                    Preview
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">

            {/* Projects */}
            <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-5">
              <h2 className="font-medium mb-4">Projects ({projects.length})</h2>
              {projects.length === 0 ? (
                <p className="text-sm dark:text-gray-500 text-gray-400">No projects yet. Create some in the Tracker.</p>
              ) : (
                <div className="space-y-3">
                  {projects.map(p => (
                    <div key={p.id} className="dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-100 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium dark:text-white text-gray-900 text-sm">{p.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ml-2 ${p.status === 'completed' ? 'bg-green-500/20 text-green-400' : p.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {p.status}
                        </span>
                      </div>
                      {p.description && <p className="text-xs dark:text-gray-400 text-gray-500 mb-2">{p.description}</p>}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {p.tech_stack?.map((t: string) => (
                          <span key={t} className="text-xs bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        {p.github_url && <a href={p.github_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">GitHub</a>}
                        {p.demo_url && <a href={p.demo_url} target="_blank" rel="noreferrer" className="text-xs text-orange-500 hover:underline">Demo</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Saved ideas with GitHub links */}
            <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-5">
              <h2 className="font-medium mb-2">Saved Ideas</h2>
              <p className="text-xs dark:text-gray-500 text-gray-400 mb-4">Add GitHub/demo links to your saved ideas</p>
              {ideas.length === 0 ? (
                <p className="text-sm dark:text-gray-500 text-gray-400">No saved ideas yet.</p>
              ) : (
                <div className="space-y-4">
                  {ideas.map(item => (
                    <div key={item.id} className="dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-100 rounded-xl p-4">
                      <p className="font-medium dark:text-white text-gray-900 text-sm mb-1">{item.ideas?.title}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.ideas?.tech_stack?.map((t: string) => (
                          <span key={t} className="text-xs bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input placeholder="GitHub URL" defaultValue={item.ideas?.github_url || ''}
                          onBlur={e => updateIdeaLinks(item.ideas?.id, 'github_url', e.target.value)}
                          className="dark:bg-gray-700 bg-orange-50 border dark:border-gray-600 border-orange-200 dark:text-white text-gray-900 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-orange-500" />
                        <input placeholder="Demo URL" defaultValue={item.ideas?.demo_url || ''}
                          onBlur={e => updateIdeaLinks(item.ideas?.id, 'demo_url', e.target.value)}
                          className="dark:bg-gray-700 bg-orange-50 border dark:border-gray-600 border-orange-200 dark:text-white text-gray-900 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-orange-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
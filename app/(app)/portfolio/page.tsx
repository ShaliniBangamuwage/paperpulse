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
    name: '',
    bio: '',
    github_url: '',
    linkedin_url: '',
    website_url: '',
    is_public: true
  })

  const supabase = createClient()

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      setUserId(user.id)

      const [
        { data: p, error: portfolioError },
        { data: proj, error: projectsError },
        { data: savedIdeas, error: ideasError }
      ] = await Promise.all([
        supabase
          .from('portfolio')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),

        supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),

        supabase
          .from('saved_ideas')
          .select(`
            *,
            ideas(
              id,
              title,
              description,
              difficulty,
              tech_stack,
              github_url,
              demo_url
            )
          `)
          .eq('user_id', user.id)
      ])

      if (
        portfolioError &&
        portfolioError.code !== 'PGRST116'
      ) {
        console.error(portfolioError)
      }

      if (projectsError) {
        console.error(projectsError)
      }

      if (ideasError) {
        console.error(ideasError)
      }

      if (p) {
        setPortfolio(p)

        setForm({
          name: p.name || '',
          bio: p.bio || '',
          github_url: p.github_url || '',
          linkedin_url: p.linkedin_url || '',
          website_url: p.website_url || '',
          is_public: p.is_public ?? true
        })
      }

      setProjects(proj || [])
      setIdeas(savedIdeas || [])
    } catch (error) {
      console.error(error)
      toast.error('Failed to load portfolio')
    } finally {
      setLoading(false)
    }
  }

  async function savePortfolio() {
    if (!form.name.trim()) {
      toast.error('Enter your name')
      return
    }

    setSaving(true)

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Please login first')
        return
      }

      if (portfolio) {
        const { error } = await supabase
          .from('portfolio')
          .update(form)
          .eq('id', portfolio.id)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('portfolio')
          .insert({
            ...form,
            user_id: user.id
          })
          .select()
          .single()

        if (error) throw error

        setPortfolio(data)
      }

      toast.success('Portfolio saved!')
    } catch (error) {
      console.error(error)
      toast.error('Failed to save portfolio')
    } finally {
      setSaving(false)
    }
  }

  async function updateIdeaLinks(
    ideaId: string,
    field: 'github_url' | 'demo_url',
    value: string
  ) {
    const { error } = await supabase
      .from('ideas')
      .update({ [field]: value })
      .eq('id', ideaId)

    if (error) {
      toast.error('Failed to update link')
      return
    }

    setIdeas(prev =>
      prev.map(i =>
        i.ideas?.id === ideaId
          ? {
              ...i,
              ideas: {
                ...i.ideas,
                [field]: value
              }
            }
          : i
      )
    )

    toast.success('Updated!')
  }

  const portfolioUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/portfolio/${userId}`
      : ''

  if (loading) {
    return (
      <div className="min-h-screen dark:bg-slate-950 bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen dark:bg-slate-950 bg-slate-50 text-slate-900 dark:text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_30px_90px_-30px_rgba(15,23,42,0.35)] dark:border-slate-800/80 dark:bg-slate-950">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.95fr] p-8 lg:p-10">
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-600 dark:text-orange-300">Portfolio Builder</p>
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
                  Create a polished portfolio recruiters love.
                </h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-400">
                  Keep your profile, project links, and public portfolio in one polished dashboard.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200/80 bg-slate-50 p-7 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Portfolio snapshot</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">
                      {portfolio?.name || 'Your portfolio preview'}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-700 dark:bg-orange-500/15 dark:text-orange-200">
                    {form.is_public ? 'Public' : 'Private'} profile
                  </span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Projects</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">{projects.length}</p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Saved ideas</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">{ideas.length}</p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Portfolio status</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
                      {portfolio && form.is_public ? 'Ready' : 'Draft'}
                    </p>
                  </div>
                </div>

                {portfolio?.bio && (
                  <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Bio preview</p>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                      {portfolio.bio}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-[1.75rem] border border-slate-200/80 bg-orange-50 p-6 dark:border-slate-800/80 dark:bg-slate-900">
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Quick profile tips</h2>

                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  <li>• Keep your bio concise and outcome-focused.</li>
                  <li>• Add GitHub, LinkedIn, and website links for easy access.</li>
                  <li>• Publish your portfolio when it’s ready to share.</li>
                </ul>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[1.75rem] border border-orange-100 bg-orange-50 p-6 dark:border-orange-500/20 dark:bg-orange-500/5">
                <h2 className="font-semibold text-slate-950 dark:text-white">Update your details</h2>

                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Keep your portfolio content fresh by updating your profile and links here.
                </p>

                <div className="mt-5 space-y-3">
                  <input
                    placeholder="Your name *"
                    value={form.name}
                    onChange={(e) =>
                      setForm(p => ({
                        ...p,
                        name: e.target.value
                      }))
                    }
                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-orange-400 dark:focus:ring-orange-500/20"
                  />

                  <textarea
                    placeholder="Short bio"
                    value={form.bio}
                    onChange={(e) =>
                      setForm(p => ({
                        ...p,
                        bio: e.target.value
                      }))
                    }
                    rows={4}
                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-orange-400 dark:focus:ring-orange-500/20 resize-none"
                  />

                  <input
                    placeholder="GitHub URL"
                    value={form.github_url}
                    onChange={(e) =>
                      setForm(p => ({
                        ...p,
                        github_url: e.target.value
                      }))
                    }
                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-orange-400 dark:focus:ring-orange-500/20"
                  />

                  <input
                    placeholder="LinkedIn URL"
                    value={form.linkedin_url}
                    onChange={(e) =>
                      setForm(p => ({
                        ...p,
                        linkedin_url: e.target.value
                      }))
                    }
                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-orange-400 dark:focus:ring-orange-500/20"
                  />

                  <input
                    placeholder="Website URL"
                    value={form.website_url}
                    onChange={(e) =>
                      setForm(p => ({
                        ...p,
                        website_url: e.target.value
                      }))
                    }
                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-orange-400 dark:focus:ring-orange-500/20"
                  />

                  <label className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950">
                    <input
                      type="checkbox"
                      checked={form.is_public}
                      onChange={() =>
                        setForm(p => ({
                          ...p,
                          is_public: !p.is_public
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                    />

                    <span className="text-slate-700 dark:text-slate-200">
                      Make my portfolio public
                    </span>
                  </label>

                  <button
                    onClick={savePortfolio}
                    disabled={saving}
                    className="w-full rounded-3xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : 'Save portfolio'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[1.75rem] border border-slate-200/80 bg-slate-50 p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                    Live preview
                  </p>

                  <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                    Your portfolio card
                  </p>
                </div>

                <div className="rounded-full bg-orange-100 px-3 py-1 text-sm text-orange-700 dark:bg-orange-500/15 dark:text-orange-200">
                  Preview mode
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Name</p>

                  <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                    {form.name || 'Your name here'}
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Bio</p>

                  <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                    {form.bio || 'A brief introduction will help employers quickly understand your background and goals.'}
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Links</p>

                  <div className="mt-3 space-y-2 text-sm">
                    <p className="text-slate-900 dark:text-white">
                      GitHub: {form.github_url || '—'}
                    </p>

                    <p className="text-slate-900 dark:text-white">
                      LinkedIn: {form.linkedin_url || '—'}
                    </p>

                    <p className="text-slate-900 dark:text-white">
                      Website: {form.website_url || '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {portfolio && form.is_public && (
              <div className="rounded-[1.75rem] border border-slate-200/80 bg-slate-50 p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                  Share your portfolio
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Copy the link below to share your public portfolio with recruiters.
                </p>

                <div className="mt-5 rounded-3xl bg-white p-4 text-sm text-slate-700 shadow-sm dark:bg-slate-950 dark:text-slate-200 break-words">
                  {portfolioUrl}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(portfolioUrl)
                      toast.success('Copied!')
                    }}
                    className="rounded-3xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                  >
                    Copy link
                  </button>

                  <a
                    href={portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-orange-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  >
                    Preview
                  </a>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
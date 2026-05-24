import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'

export default async function PublicPortfolioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: portfolio }, { data: projects }, { data: savedIdeas }] = await Promise.all([
    supabase.from('portfolio').select('*').eq('user_id', id).eq('is_public', true).single(),
    supabase.from('projects').select('*').eq('user_id', id).order('created_at', { ascending: false }),
    supabase.from('saved_ideas').select('*, ideas(title, description, difficulty, tech_stack, github_url, demo_url)').eq('user_id', id),
  ])

  if (!portfolio) notFound()

  const completedProjects = projects?.filter((p: any) => p.status === 'completed').length || 0
  const inProgressProjects = projects?.filter((p: any) => p.status === 'in-progress').length || 0
  const allTechs = Array.from(new Set(projects?.flatMap((p: any) => p.tech_stack || []) || []))

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    completed: { bg: 'bg-green-500/20', text: 'text-green-400', label: '✓ Completed' },
    'in-progress': { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '⟳ In Progress' },
    planned: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '○ Planned' },
  }

  const difficultyConfig: Record<string, { bg: string; text: string }> = {
    Beginner: { bg: 'bg-green-500/20', text: 'text-green-400' },
    Intermediate: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
    Advanced: { bg: 'bg-red-500/20', text: 'text-red-400' },
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Hero banner */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto px-6 py-16 text-center">

          {/* Avatar */}
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-lg shadow-orange-500/20">
              {portfolio.name?.[0]?.toUpperCase() || '?'}
            </div>
            {completedProjects > 0 && (
              <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                {completedProjects} built
              </div>
            )}
          </div>

          <h1 className="text-4xl font-bold mb-3">{portfolio.name}</h1>

          {portfolio.university && (
            <p className="text-orange-400 text-sm font-medium mb-3">🎓 {portfolio.university}</p>
          )}

          {portfolio.bio && (
            <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-6 leading-relaxed">{portfolio.bio}</p>
          )}

          {/* Social links */}
          <div className="flex items-center justify-center gap-3 flex-wrap mb-8">
            {portfolio.github_url && (
              <a href={portfolio.github_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl text-sm transition-colors border border-gray-700">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                GitHub
              </a>
            )}
            {portfolio.linkedin_url && (
              <a href={portfolio.linkedin_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-4 py-2 rounded-xl text-sm transition-colors border border-blue-600/20">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            )}
            {portfolio.website_url && (
              <a href={portfolio.website_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-4 py-2 rounded-xl text-sm transition-colors border border-orange-500/20">
                🌐 Website
              </a>
            )}
            {portfolio.email && (
              <a href={`mailto:${portfolio.email}`}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl text-sm transition-colors border border-gray-700">
                ✉️ Email
              </a>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            {[
              { label: 'Projects', value: projects?.length || 0, color: 'text-orange-400' },
              { label: 'Completed', value: completedProjects, color: 'text-green-400' },
              { label: 'Ideas', value: savedIdeas?.length || 0, color: 'text-violet-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-gray-500 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-16">

        {/* Tech stack */}
        {allTechs.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-orange-500">⚡</span> Tech Stack
            </h2>
            <div className="flex flex-wrap gap-2">
              {allTechs.map((tech: any) => (
                <span key={tech} className="bg-gray-900 border border-gray-800 text-gray-300 text-sm px-3 py-1.5 rounded-xl hover:border-orange-500/50 transition-colors">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-orange-500">🚀</span> Projects
              <span className="text-gray-600 text-sm font-normal">({projects.length})</span>
            </h2>
            <div className="space-y-4">
              {projects.map((p: any) => {
                const status = statusConfig[p.status] || statusConfig.planned
                return (
                  <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-orange-500/30 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-white text-lg">{p.title}</h3>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium shrink-0 ml-3 ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </div>

                    {p.description && (
                      <p className="text-gray-400 text-sm mb-4 leading-relaxed">{p.description}</p>
                    )}

                    {p.tech_stack?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {p.tech_stack.map((t: string) => (
                          <span key={t} className="bg-orange-500/20 text-orange-400 text-xs px-2.5 py-1 rounded-full border border-orange-500/20">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Progress bar */}
                    {p.progress > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">Progress</span>
                          <span className="text-xs text-orange-400 font-medium">{p.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4 pt-2 border-t border-gray-800">
                      {p.github_url && (
                        <a href={p.github_url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                          </svg>
                          View Code
                        </a>
                      )}
                      {p.demo_url && (
                        <a href={p.demo_url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors">
                          🔗 Live Demo
                        </a>
                      )}
                      {p.deadline && (
                        <span className="text-xs text-gray-600 ml-auto">
                          📅 {new Date(p.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Saved ideas */}
        {savedIdeas && savedIdeas.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-orange-500">💡</span> Project Ideas
              <span className="text-gray-600 text-sm font-normal">({savedIdeas.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedIdeas.map((item: any) => {
                const diff = difficultyConfig[item.ideas?.difficulty] || difficultyConfig.Intermediate
                return (
                  <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-orange-500/30 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-white text-sm leading-snug flex-1">{item.ideas?.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ml-2 shrink-0 ${diff.bg} ${diff.text}`}>
                        {item.ideas?.difficulty}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mb-3 leading-relaxed line-clamp-2">{item.ideas?.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {item.ideas?.tech_stack?.slice(0, 4).map((t: string) => (
                        <span key={t} className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-3 pt-2 border-t border-gray-800">
                      {item.ideas?.github_url && (
                        <a href={item.ideas.github_url} target="_blank" rel="noreferrer"
                          className="text-xs text-gray-400 hover:text-white transition-colors">
                          GitHub →
                        </a>
                      )}
                      {item.ideas?.demo_url && (
                        <a href={item.ideas.demo_url} target="_blank" rel="noreferrer"
                          className="text-xs text-orange-400 hover:text-orange-300 transition-colors">
                          Demo →
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {(!projects || projects.length === 0) && (!savedIdeas || savedIdeas.length === 0) && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🚧</p>
            <p className="text-gray-500">No projects added yet</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-8 border-t border-gray-800">
          <p className="text-gray-600 text-xs">
            Portfolio powered by{' '}
            <a href="/" className="text-orange-500 hover:underline font-medium">PaperPulse</a>
            {' '}— AI Research Platform
          </p>
        </div>

      </div>
    </div>
  )
}
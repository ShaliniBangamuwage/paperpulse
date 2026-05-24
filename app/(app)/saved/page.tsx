'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Bookmark, Hammer, CheckCircle2, Inbox } from 'lucide-react'

const STATUSES = ['saved', 'building', 'done'] as const
type Status = typeof STATUSES[number]

const COLUMN_CONFIG: Record<Status, {
  label: string
  icon: React.ElementType
  border: string
  badge: string
  iconColor: string
}> = {
  saved: {
    label: 'Saved',
    icon: Bookmark,
    border: 'dark:border-yellow-500/30 border-yellow-400/30',
    badge: 'bg-yellow-500/20 text-yellow-500',
    iconColor: 'text-yellow-500',
  },
  building: {
    label: 'Building',
    icon: Hammer,
    border: 'dark:border-blue-500/30 border-blue-400/30',
    badge: 'bg-blue-500/20 text-blue-500',
    iconColor: 'text-blue-400',
  },
  done: {
    label: 'Done',
    icon: CheckCircle2,
    border: 'dark:border-green-500/30 border-green-400/30',
    badge: 'bg-green-500/20 text-green-500',
    iconColor: 'text-green-400',
  },
}

export default function SavedPage() {
  const [saved, setSaved] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('saved_ideas')
        .select('*, idea:ideas(*)')
        .eq('user_id', user.id)
      setSaved(data || [])
      setLoading(false)
    }
    load()
  }, [supabase])

  async function updateStatus(id: string, status: Status) {
    await supabase.from('saved_ideas').update({ status }).eq('id', id)
    setSaved(prev => prev.map(s => s.id === id ? { ...s, status } : s))
    toast.success(`Moved to ${COLUMN_CONFIG[status].label}`)
  }

  const byStatus = (status: Status) => saved.filter(s => s.status === status)

  const difficultyColor: Record<string, string> = {
    Beginner: 'bg-green-500/20 text-green-400',
    Intermediate: 'bg-yellow-500/20 text-yellow-400',
    Advanced: 'bg-red-500/20 text-red-400',
  }

  if (loading) return (
    <div className="min-h-screen dark:bg-gray-950 bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={28} className="animate-spin text-orange-500" />
        <p className="dark:text-gray-500 text-gray-400 text-sm">Loading your ideas...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen dark:bg-gray-950 bg-white text-gray-900 dark:text-white p-6">
      <div className="max-w-6xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-semibold dark:text-white text-gray-900 mb-1">Saved ideas</h1>
          <p className="dark:text-gray-400 text-gray-500 text-sm">Track your project pipeline</p>
        </div>

        {saved.length === 0 ? (
          <div className="flex flex-col items-center py-24 gap-3">
            <div className="w-12 h-12 rounded-2xl dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 flex items-center justify-center">
              <Inbox size={20} className="dark:text-gray-600 text-gray-400" />
            </div>
            <p className="dark:text-gray-500 text-gray-400 text-sm">No saved ideas yet.</p>
            <p className="dark:text-gray-600 text-gray-400 text-xs">Save ideas from any paper to track them here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {STATUSES.map(status => {
              const config = COLUMN_CONFIG[status]
              const Icon = config.icon
              const items = byStatus(status)

              return (
                <div key={status} className={`dark:bg-gray-900 bg-orange-50 border rounded-2xl p-4 ${config.border}`}>

                  {/* Column header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Icon size={15} className={config.iconColor} />
                      <h2 className="font-medium dark:text-white text-gray-900 text-sm">{config.label}</h2>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.badge}`}>
                      {items.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-3">
                    {items.map(item => (
                      <div key={item.id} className="dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-100 rounded-xl p-4">

                        <p className="font-medium dark:text-white text-gray-900 text-sm mb-1 leading-snug">
                          {item.idea?.title}
                        </p>

                        <p className="dark:text-gray-400 text-gray-500 text-xs mb-3 line-clamp-2 leading-relaxed">
                          {item.idea?.description}
                        </p>

                        <div className="flex items-center justify-between mb-3">
                          {item.idea?.difficulty && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor[item.idea.difficulty] || 'dark:bg-gray-700 bg-gray-100 dark:text-gray-400 text-gray-500'}`}>
                              {item.idea.difficulty}
                            </span>
                          )}
                          {item.idea?.estimated_weeks && (
                            <span className="text-xs dark:text-gray-500 text-gray-400">
                              {item.idea.estimated_weeks}w
                            </span>
                          )}
                        </div>

                        {/* Move buttons */}
                        <div className="flex gap-1.5">
                          {STATUSES.filter(s => s !== status).map(s => {
                            const BtnIcon = COLUMN_CONFIG[s].icon
                            return (
                              <button
                                key={s}
                                onClick={() => updateStatus(item.id, s)}
                                className="flex-1 flex items-center justify-center gap-1 text-xs dark:bg-gray-700 bg-orange-50 dark:text-gray-400 text-gray-500 dark:border-gray-600 border-orange-200 border rounded-lg py-1.5 hover:border-orange-500 hover:text-orange-500 transition-colors">
                                <BtnIcon size={10} />
                                {COLUMN_CONFIG[s].label}
                              </button>
                            )
                          })}
                        </div>

                      </div>
                    ))}

                    {items.length === 0 && (
                      <div className="flex flex-col items-center py-8 gap-2">
                        <Icon size={18} className="dark:text-gray-700 text-gray-300" />
                        <p className="dark:text-gray-600 text-gray-400 text-xs text-center">Nothing here yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
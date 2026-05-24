'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { BookOpen, BookMarked, CheckCircle, PauseCircle, Plus, X, FileText, Lightbulb, Loader2 } from 'lucide-react'

interface ReadingItem {
  id: string
  paper_id: string
  status: string
  notes: string
  created_at: string
  papers: {
    id: string
    title: string
    abstract: string
    created_at: string
  }
}

const STATUS_OPTIONS = ['unread', 'reading', 'completed', 'on-hold']
const STATUS_COLORS: Record<string, string> = {
  unread: 'bg-gray-500/20 text-gray-400',
  reading: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-green-500/20 text-green-400',
  'on-hold': 'bg-yellow-500/20 text-yellow-400',
}
const STATUS_ICONS: Record<string, React.ReactNode> = {
  unread: <BookMarked size={14} />,
  reading: <BookOpen size={14} />,
  completed: <CheckCircle size={14} />,
  'on-hold': <PauseCircle size={14} />,
}

export default function ReadingPage() {
  const [items, setItems] = useState<ReadingItem[]>([])
  const [papers, setPapers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedItem, setSelectedItem] = useState<ReadingItem | null>(null)
  const [notes, setNotes] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: readingData }, { data: papersData }] = await Promise.all([
      supabase.from('reading_list')
        .select('*, papers(id, title, abstract, created_at)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('papers')
        .select('id, title')
        .eq('user_id', user.id)
        .eq('status', 'done')
    ])

    setItems(readingData || [])
    const existingIds = (readingData || []).map((r: any) => r.paper_id)
    setPapers((papersData || []).filter(p => !existingIds.includes(p.id)))
    setLoading(false)
  }

  async function addToList(paperId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('reading_list').insert({
      user_id: user.id, paper_id: paperId, status: 'unread'
    })
    if (error) { toast.error('Already in list'); return }
    toast.success('Added to reading list')
    setShowAdd(false)
    loadAll()
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from('reading_list').update({ status }).eq('id', id)
    if (error) { toast.error('Failed'); return }
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i))
    toast.success('Status updated')
  }

  async function saveNotes(id: string) {
    const { error } = await supabase.from('reading_list').update({ notes }).eq('id', id)
    if (error) { toast.error('Failed'); return }
    setItems(prev => prev.map(i => i.id === id ? { ...i, notes } : i))
    toast.success('Notes saved')
  }

  async function removeFromList(id: string) {
    await supabase.from('reading_list').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
    if (selectedItem?.id === id) setSelectedItem(null)
    toast.success('Removed')
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter)

  return (
    <div className="min-h-screen dark:bg-gray-950 bg-white text-gray-900 dark:text-white p-6">
      <div className="max-w-6xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Reading List</h1>
            <p className="dark:text-gray-400 text-gray-500">Track your paper reading progress</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="bg-orange-500 hover:bg-orange-400 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
            <Plus size={16} /> Add paper
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {STATUS_OPTIONS.map(s => (
            <div key={s} className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-4 text-center">
              <p className="text-2xl font-semibold text-orange-500">{items.filter(i => i.status === s).length}</p>
              <p className="text-xs dark:text-gray-400 text-gray-500 mt-1 capitalize">{s}</p>
            </div>
          ))}
        </div>

        {/* Add modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="dark:bg-gray-900 bg-white border dark:border-gray-700 border-orange-200 rounded-2xl p-6 w-full max-w-md">
              <h3 className="font-semibold mb-4">Add to reading list</h3>
              {papers.length === 0 ? (
                <p className="text-sm dark:text-gray-400 text-gray-500 mb-4">All your papers are already in your reading list.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                  {papers.map(p => (
                    <button key={p.id} onClick={() => addToList(p.id)}
                      className="w-full text-left p-3 dark:bg-gray-800 bg-orange-50 border dark:border-gray-700 border-orange-100 rounded-xl text-sm hover:border-orange-500 transition-colors">
                      <p className="dark:text-white text-gray-900 font-medium">{p.title}</p>
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => setShowAdd(false)}
                className="w-full dark:bg-gray-800 bg-orange-50 dark:text-gray-300 text-gray-600 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                <X size={14} /> Close
              </button>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', ...STATUS_OPTIONS].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-xs px-4 py-2 rounded-xl transition-colors capitalize ${filter === s ? 'bg-orange-500 text-white' : 'dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 dark:text-gray-400 text-gray-500 hover:border-orange-500'}`}>
              {s} {s === 'all' ? `(${items.length})` : `(${items.filter(i => i.status === s).length})`}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-1 space-y-3">
            {loading ? (
              <p className="text-sm dark:text-gray-500 text-gray-400 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Loading...
              </p>
            ) : filtered.length === 0 ? (
              <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-8 text-center">
                <BookOpen size={28} className="mx-auto mb-3 dark:text-gray-600 text-gray-400" />
                <p className="dark:text-gray-500 text-gray-400 text-sm">No papers here</p>
              </div>
            ) : filtered.map(item => (
              <div key={item.id} onClick={() => { setSelectedItem(item); setNotes(item.notes || '') }}
                className={`dark:bg-gray-900 bg-orange-50 border rounded-2xl p-4 cursor-pointer transition-all ${selectedItem?.id === item.id ? 'border-orange-500' : 'dark:border-gray-800 border-orange-100 hover:border-orange-500'}`}>
                <p className="font-medium dark:text-white text-gray-900 text-sm line-clamp-2 mb-2">{item.papers?.title}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${STATUS_COLORS[item.status]}`}>
                    {STATUS_ICONS[item.status]} {item.status}
                  </span>
                  <span className="text-xs dark:text-gray-500 text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Detail */}
          <div className="lg:col-span-2">
            {!selectedItem ? (
              <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-16 text-center">
                <BookOpen size={36} className="mx-auto mb-4 dark:text-gray-600 text-gray-400" />
                <p className="dark:text-gray-500 text-gray-400">Select a paper to view details</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold dark:text-white text-gray-900 mb-4">{selectedItem.papers?.title}</h2>
                  <p className="dark:text-gray-400 text-gray-500 text-sm leading-relaxed mb-6 line-clamp-4">{selectedItem.papers?.abstract}</p>

                  <div className="mb-4">
                    <p className="text-xs dark:text-gray-500 text-gray-400 uppercase tracking-wide mb-2">Status</p>
                    <div className="flex gap-2 flex-wrap">
                      {STATUS_OPTIONS.map(s => (
                        <button key={s} onClick={() => updateStatus(selectedItem.id, s)}
                          className={`text-xs px-3 py-1.5 rounded-lg transition-colors capitalize flex items-center gap-1.5 ${selectedItem.status === s ? 'bg-orange-500 text-white' : 'dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-200 dark:text-gray-400 text-gray-500 hover:border-orange-500'}`}>
                          {STATUS_ICONS[s]} {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs dark:text-gray-500 text-gray-400 uppercase tracking-wide mb-2">Notes</p>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                      placeholder="Add your reading notes..."
                      className="w-full dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 resize-none" />
                    <button onClick={() => saveNotes(selectedItem.id)}
                      className="mt-2 bg-orange-500 hover:bg-orange-400 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                      Save notes
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => router.push(`/paper/${selectedItem.paper_id}`)}
                      className="flex-1 dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-200 dark:text-gray-300 text-gray-600 py-2.5 rounded-xl text-sm hover:border-orange-500 transition-colors flex items-center justify-center gap-2">
                      <Lightbulb size={14} /> View ideas
                    </button>
                    <button onClick={() => removeFromList(selectedItem.id)}
                      className="bg-red-500/20 text-red-400 px-4 py-2.5 rounded-xl text-sm hover:bg-red-500/30 transition-colors flex items-center gap-2">
                      <X size={14} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
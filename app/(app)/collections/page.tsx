'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Collection {
  id: string
  name: string
  description: string
  color: string
  created_at: string
  paper_count?: number
}

interface Paper {
  id: string
  title: string
  abstract: string
  status: string
  created_at: string
}

const COLORS = [
  { name: 'orange', bg: 'bg-orange-500', light: 'bg-orange-500/20', text: 'text-orange-500' },
  { name: 'blue', bg: 'bg-blue-500', light: 'bg-blue-500/20', text: 'text-blue-400' },
  { name: 'green', bg: 'bg-green-500', light: 'bg-green-500/20', text: 'text-green-400' },
  { name: 'violet', bg: 'bg-violet-500', light: 'bg-violet-500/20', text: 'text-violet-400' },
  { name: 'red', bg: 'bg-red-500', light: 'bg-red-500/20', text: 'text-red-400' },
  { name: 'yellow', bg: 'bg-yellow-500', light: 'bg-yellow-500/20', text: 'text-yellow-400' },
]

function getColor(name: string) {
  return COLORS.find(c => c.name === name) || COLORS[0]
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [collectionPapers, setCollectionPapers] = useState<Paper[]>([])
  const [allPapers, setAllPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showAddPaper, setShowAddPaper] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newColor, setNewColor] = useState('orange')
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadCollections()
    loadAllPapers()
  }, [])

  async function loadCollections() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) {
      const withCounts = await Promise.all(
        data.map(async (col) => {
          const { count } = await supabase
            .from('collection_papers')
            .select('*', { count: 'exact', head: true })
            .eq('collection_id', col.id)
          return { ...col, paper_count: count || 0 }
        })
      )
      setCollections(withCounts)
    }
    setLoading(false)
  }

  async function loadAllPapers() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('papers')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'done')
      .order('created_at', { ascending: false })
    setAllPapers(data || [])
  }

  async function loadCollectionPapers(collectionId: string) {
    const { data } = await supabase
      .from('collection_papers')
      .select('paper_id, papers(*)')
      .eq('collection_id', collectionId)
    setCollectionPapers(data?.map((d: any) => d.papers) || [])
  }

  async function createCollection() {
    if (!newName.trim()) { toast.error('Enter a name'); return }
    setCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('collections')
      .insert({ user_id: user.id, name: newName, description: newDesc, color: newColor })
      .select().single()

    if (error) { toast.error('Failed to create'); setCreating(false); return }
    setCollections(prev => [{ ...data, paper_count: 0 }, ...prev])
    setNewName(''); setNewDesc(''); setNewColor('orange')
    setShowCreate(false)
    toast.success('Collection created!')
    setCreating(false)
  }

  async function deleteCollection(id: string) {
    const { error } = await supabase.from('collections').delete().eq('id', id)
    if (error) { toast.error('Failed'); return }
    setCollections(prev => prev.filter(c => c.id !== id))
    if (selectedCollection?.id === id) setSelectedCollection(null)
    toast.success('Collection deleted')
  }

  async function addPaperToCollection(paperId: string) {
    if (!selectedCollection) return
    const { error } = await supabase
      .from('collection_papers')
      .insert({ collection_id: selectedCollection.id, paper_id: paperId })

    if (error) {
      if (error.code === '23505') { toast.error('Paper already in collection'); return }
      toast.error('Failed to add'); return
    }

    await loadCollectionPapers(selectedCollection.id)
    setCollections(prev => prev.map(c =>
      c.id === selectedCollection.id ? { ...c, paper_count: (c.paper_count || 0) + 1 } : c
    ))
    setShowAddPaper(false)
    toast.success('Paper added to collection!')
  }

  async function removePaperFromCollection(paperId: string) {
    if (!selectedCollection) return
    const { error } = await supabase
      .from('collection_papers')
      .delete()
      .eq('collection_id', selectedCollection.id)
      .eq('paper_id', paperId)

    if (error) { toast.error('Failed'); return }
    setCollectionPapers(prev => prev.filter(p => p.id !== paperId))
    setCollections(prev => prev.map(c =>
      c.id === selectedCollection.id ? { ...c, paper_count: Math.max(0, (c.paper_count || 0) - 1) } : c
    ))
    toast.success('Paper removed')
  }

  async function openCollection(col: Collection) {
    setSelectedCollection(col)
    await loadCollectionPapers(col.id)
  }

  const papersNotInCollection = allPapers.filter(p =>
    !collectionPapers.find(cp => cp.id === p.id)
  ).filter(p => p.title?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen dark:bg-gray-950 bg-white text-gray-900 dark:text-white p-6">
      <div className="max-w-6xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Collections</h1>
            <p className="dark:text-gray-400 text-gray-500">Organise your research papers into folders</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-orange-500 hover:bg-orange-400 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
            + New collection
          </button>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="dark:bg-gray-900 bg-white border dark:border-gray-700 border-orange-200 rounded-2xl p-6 w-full max-w-md">
              <h3 className="font-semibold dark:text-white text-gray-900 mb-4">Create collection</h3>
              <div className="space-y-3 mb-4">
                <input
                  type="text" placeholder="Collection name" value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full dark:bg-gray-800 bg-orange-50 border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                />
                <textarea
                  placeholder="Description (optional)" value={newDesc}
                  onChange={e => setNewDesc(e.target.value)} rows={2}
                  className="w-full dark:bg-gray-800 bg-orange-50 border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 resize-none"
                />
                <div>
                  <p className="text-xs dark:text-gray-500 text-gray-400 mb-2">Color</p>
                  <div className="flex gap-2">
                    {COLORS.map(c => (
                      <button
                        key={c.name}
                        onClick={() => setNewColor(c.name)}
                        className={`w-7 h-7 rounded-full ${c.bg} transition-transform ${newColor === c.name ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-current scale-110' : ''}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCreate(false)}
                  className="flex-1 dark:bg-gray-800 bg-orange-50 dark:text-gray-300 text-gray-600 py-2.5 rounded-xl text-sm">
                  Cancel
                </button>
                <button onClick={createCollection} disabled={creating}
                  className="flex-1 bg-orange-500 hover:bg-orange-400 text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add paper modal */}
        {showAddPaper && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="dark:bg-gray-900 bg-white border dark:border-gray-700 border-orange-200 rounded-2xl p-6 w-full max-w-md">
              <h3 className="font-semibold dark:text-white text-gray-900 mb-4">Add paper to collection</h3>
              <input
                type="text" placeholder="Search papers..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full dark:bg-gray-800 bg-orange-50 border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 mb-3"
              />
              <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                {papersNotInCollection.length === 0 ? (
                  <p className="text-sm dark:text-gray-500 text-gray-400 text-center py-4">
                    {allPapers.length === 0 ? 'No papers yet' : 'All papers already in this collection'}
                  </p>
                ) : papersNotInCollection.map(paper => (
                  <button
                    key={paper.id}
                    onClick={() => addPaperToCollection(paper.id)}
                    className="w-full text-left p-3 dark:bg-gray-800 bg-orange-50 border dark:border-gray-700 border-orange-100 rounded-xl text-sm dark:text-gray-300 text-gray-700 hover:border-orange-500 transition-colors">
                    <p className="font-medium line-clamp-1">{paper.title}</p>
                    <p className="text-xs dark:text-gray-500 text-gray-400 mt-0.5">{new Date(paper.created_at).toLocaleDateString()}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => { setShowAddPaper(false); setSearch('') }}
                className="w-full dark:bg-gray-800 bg-orange-50 dark:text-gray-300 text-gray-600 py-2.5 rounded-xl text-sm">
                Close
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Collections list */}
          <div className="lg:col-span-1">
            <h2 className="font-medium dark:text-white text-gray-900 mb-4">
              Your collections ({collections.length})
            </h2>
            {loading ? (
              <p className="text-sm dark:text-gray-500 text-gray-400">Loading...</p>
            ) : collections.length === 0 ? (
              <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-8 text-center">
                <p className="text-3xl mb-3">📁</p>
                <p className="dark:text-gray-500 text-gray-400 text-sm">No collections yet</p>
                <button onClick={() => setShowCreate(true)}
                  className="mt-3 text-orange-500 hover:underline text-sm">
                  Create your first one
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {collections.map(col => {
                  const color = getColor(col.color)
                  return (
                    <div
                      key={col.id}
                      onClick={() => openCollection(col)}
                      className={`dark:bg-gray-900 bg-orange-50 border rounded-2xl p-4 cursor-pointer transition-all ${
                        selectedCollection?.id === col.id
                          ? 'border-orange-500 dark:bg-orange-500/10 bg-orange-100'
                          : 'dark:border-gray-800 border-orange-100 hover:border-orange-500'
                      }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${color.bg}`} />
                          <p className="font-medium dark:text-white text-gray-900 text-sm">{col.name}</p>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); deleteCollection(col.id) }}
                          className="text-xs dark:text-gray-600 text-gray-400 hover:text-red-400 transition-colors">
                          🗑
                        </button>
                      </div>
                      {col.description && (
                        <p className="text-xs dark:text-gray-500 text-gray-400 line-clamp-1 mb-2">{col.description}</p>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color.light} ${color.text}`}>
                        {col.paper_count} {col.paper_count === 1 ? 'paper' : 'papers'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Collection contents */}
          <div className="lg:col-span-2">
            {!selectedCollection ? (
              <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-16 text-center">
                <p className="text-4xl mb-4">📂</p>
                <p className="dark:text-gray-500 text-gray-400">Select a collection to view its papers</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${getColor(selectedCollection.color).bg}`} />
                    <h2 className="text-xl font-semibold dark:text-white text-gray-900">{selectedCollection.name}</h2>
                    <span className="text-sm dark:text-gray-500 text-gray-400">({collectionPapers.length} papers)</span>
                  </div>
                  <button
                    onClick={() => setShowAddPaper(true)}
                    className="bg-orange-500 hover:bg-orange-400 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                    + Add paper
                  </button>
                </div>

                {selectedCollection.description && (
                  <p className="dark:text-gray-400 text-gray-500 text-sm mb-4">{selectedCollection.description}</p>
                )}

                {collectionPapers.length === 0 ? (
                  <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-12 text-center">
                    <p className="text-3xl mb-3">📄</p>
                    <p className="dark:text-gray-500 text-gray-400 mb-3">No papers in this collection yet</p>
                    <button
                      onClick={() => setShowAddPaper(true)}
                      className="text-orange-500 hover:underline text-sm">
                      Add your first paper
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {collectionPapers.map(paper => (
                      <div key={paper.id}
                        className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-4 flex items-center justify-between">
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => paper.status === 'done' && router.push(`/paper/${paper.id}`)}>
                          <p className="font-medium dark:text-white text-gray-900 truncate">{paper.title}</p>
                          <p className="text-xs dark:text-gray-500 text-gray-400 mt-0.5">
                            {new Date(paper.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4 shrink-0">
                          <button
                            onClick={() => router.push(`/paper/${paper.id}`)}
                            className="text-xs bg-orange-500/20 text-orange-500 px-3 py-1.5 rounded-lg hover:bg-orange-500/30 transition-colors">
                            View ideas
                          </button>
                          <button
                            onClick={() => removePaperFromCollection(paper.id)}
                            className="text-xs bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/30 transition-colors">
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
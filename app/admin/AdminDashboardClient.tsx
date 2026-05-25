'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  LayoutDashboard, Users, FileText, Lightbulb, CreditCard,
  Library, Megaphone, Flag, Home, LogOut, ChevronLeft, ChevronRight,
  Zap, Ban, CheckCircle, AlertTriangle, Info, XCircle, X,
  Globe, Bookmark, BarChart2
} from 'lucide-react'

type Tab = 'overview' | 'papers' | 'users' | 'ideas' | 'payments' | 'library' | 'announcements' | 'flagged'

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  processing: 'bg-blue-500/20 text-blue-400',
  done: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
}

const difficultyColor: Record<string, string> = {
  Beginner: 'bg-green-500/20 text-green-400',
  Intermediate: 'bg-yellow-500/20 text-yellow-400',
  Advanced: 'bg-red-500/20 text-red-400',
}

interface Props {
  currentUser: string
  stats: {
    userCount: number
    paperCount: number
    ideaCount: number
    savedCount: number
    publicCount: number
    proCount: number
    totalRevenue: number
    flaggedCount: number
  }
  papers: any[]
  users: any[]
  recentIdeas: any[]
  payments: any[]
  announcements: any[]
  flaggedPapers: any[]
  flaggedIdeas: any[]
}

const AnnouncementIcon = ({ type }: { type: string }) => {
  if (type === 'warning') return <AlertTriangle size={14} />
  if (type === 'success') return <CheckCircle size={14} />
  if (type === 'error') return <XCircle size={14} />
  return <Info size={14} />
}

// ── InviteAdminButton — defined OUTSIDE main component ──
function InviteAdminButton() {
  const [showModal, setShowModal] = useState(false)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const supabase = createClient()

  async function sendInvite() {
    if (!email) { toast.error('Enter an email'); return }
    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const res = await fetch('/api/admin-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, invitedBy: user?.id })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Invite sent to ${email}!`)
      setEmail('')
      setShowModal(false)
    } catch (err: any) {
      toast.error(err.message)
    }
    setSending(false)
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm px-4 py-2.5 rounded-xl transition-colors mb-6">
        + Invite Admin
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="dark:bg-gray-900 bg-white border dark:border-gray-700 border-orange-200 rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-semibold dark:text-white text-gray-900 mb-2">Invite Admin</h3>
            <p className="dark:text-gray-400 text-gray-500 text-sm mb-4">
              They will receive an email with a link to create their admin account.
            </p>
            <input
              type="email" placeholder="admin@example.com" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendInvite()}
              className="w-full dark:bg-gray-800 bg-orange-50 border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)}
                className="flex-1 dark:bg-gray-800 bg-orange-50 dark:text-gray-300 text-gray-600 py-2.5 rounded-xl text-sm">
                Cancel
              </button>
              <button onClick={sendInvite} disabled={sending}
                className="flex-1 bg-orange-500 hover:bg-orange-400 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
                {sending ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}



export default function AdminDashboardClient({
  currentUser, stats, papers, users, recentIdeas,
  payments, announcements: initialAnnouncements,
  flaggedPapers, flaggedIdeas,
}: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [newTitle, setNewTitle] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [newType, setNewType] = useState('info')
  const [localUsers, setLocalUsers] = useState(users)
  const [localPapers, setLocalPapers] = useState(papers)
  const [localIdeas, setLocalIdeas] = useState(recentIdeas)
  const [confirmBan, setConfirmBan] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  async function toggleProStatus(userId: string, current: boolean) {
    const { error } = await supabase.from('profiles').update({
      is_pro: !current,
      pro_since: !current ? new Date().toISOString() : null,
    }).eq('id', userId)
    if (error) { toast.error('Failed'); return }
    setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, is_pro: !current } : u))
    toast.success(!current ? 'Pro granted' : 'Pro removed')
  }

  async function toggleUserRole(userId: string, currentRole: string) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    if (error) { toast.error('Failed'); return }
    setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    toast.success(`Role changed to ${newRole}`)
  }

  async function banUser(userId: string) {
    const { error } = await supabase.from('profiles').update({ banned: true }).eq('id', userId)
    if (error) { toast.error('Failed'); return }
    setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: true } : u))
    setConfirmBan(null)
    toast.success('User banned')
  }

  async function unbanUser(userId: string) {
    const { error } = await supabase.from('profiles').update({ banned: false }).eq('id', userId)
    if (error) { toast.error('Failed'); return }
    setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: false } : u))
    toast.success('User unbanned')
  }

  async function deletePaper(paperId: string) {
    const { error } = await supabase.from('papers').delete().eq('id', paperId)
    if (error) { toast.error('Failed'); return }
    setLocalPapers(prev => prev.filter(p => p.id !== paperId))
    toast.success('Paper deleted')
  }

  async function togglePaperPublic(paperId: string, current: boolean) {
    const { error } = await supabase.from('papers').update({ is_public: !current }).eq('id', paperId)
    if (error) { toast.error('Failed'); return }
    setLocalPapers(prev => prev.map(p => p.id === paperId ? { ...p, is_public: !current } : p))
    toast.success(!current ? 'Added to library' : 'Removed from library')
  }

  async function unflagPaper(paperId: string) {
    const { error } = await supabase.from('papers').update({ flagged: false }).eq('id', paperId)
    if (error) { toast.error('Failed'); return }
    toast.success('Unflagged')
    router.refresh()
  }

  async function unflagIdea(ideaId: string) {
    const { error } = await supabase.from('ideas').update({ flagged: false }).eq('id', ideaId)
    if (error) { toast.error('Failed'); return }
    toast.success('Unflagged')
    router.refresh()
  }

  async function deleteIdea(ideaId: string) {
    const { error } = await supabase.from('ideas').delete().eq('id', ideaId)
    if (error) { toast.error('Failed'); return }
    setLocalIdeas(prev => prev.filter(i => i.id !== ideaId))
    toast.success('Idea deleted')
  }

  async function createAnnouncement() {
    if (!newTitle.trim() || !newMessage.trim()) { toast.error('Fill in all fields'); return }
    const { data, error } = await supabase.from('announcements').insert({
      title: newTitle, message: newMessage, type: newType, active: true,
    }).select().single()
    if (error) { toast.error('Failed'); return }
    setAnnouncements(prev => [data, ...prev])
    setNewTitle(''); setNewMessage('')
    toast.success('Announcement created')
  }

  async function toggleAnnouncement(id: string, current: boolean) {
    const { error } = await supabase.from('announcements').update({ active: !current }).eq('id', id)
    if (error) { toast.error('Failed'); return }
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, active: !current } : a))
    toast.success(!current ? 'Activated' : 'Deactivated')
  }

  async function deleteAnnouncement(id: string) {
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (error) { toast.error('Failed'); return }
    setAnnouncements(prev => prev.filter(a => a.id !== id))
    toast.success('Deleted')
  }

  const filteredPapers = useMemo(() => localPapers.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.profiles?.email?.toLowerCase().includes(search.toLowerCase())
  ), [localPapers, search])

  const filteredUsers = useMemo(() => localUsers.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase())
  ), [localUsers, search])

  const filteredPayments = useMemo(() => payments.filter((p: any) =>
    p.email?.toLowerCase().includes(search.toLowerCase())
  ), [payments, search])

  const totalRevenue = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
  const publicPapers = useMemo(() => localPapers.filter(p => p.is_public), [localPapers])

  const navItems: { id: Tab; label: string; icon: React.ReactNode; count?: number; alert?: boolean }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
    { id: 'users', label: 'Users', icon: <Users size={16} />, count: localUsers.length },
    { id: 'papers', label: 'Papers', icon: <FileText size={16} />, count: localPapers.length },
    { id: 'ideas', label: 'Ideas', icon: <Lightbulb size={16} />, count: localIdeas.length },
    { id: 'payments', label: 'Payments', icon: <CreditCard size={16} />, count: payments.length },
    { id: 'library', label: 'Library', icon: <Library size={16} />, count: publicPapers.length },
    { id: 'announcements', label: 'Announcements', icon: <Megaphone size={16} />, count: announcements.length },
    { id: 'flagged', label: 'Flagged', icon: <Flag size={16} />, count: flaggedPapers.length + flaggedIdeas.length, alert: (flaggedPapers.length + flaggedIdeas.length) > 0 },
  ]

  const currentNavItem = navItems.find(n => n.id === tab)

  return (
    <div className="min-h-screen dark:bg-gray-950 bg-white flex">

      {/* SIDEBAR */}
      <div className={`${sidebarOpen ? 'w-60' : 'w-16'} transition-all duration-300 dark:bg-gray-900 bg-orange-50 border-r dark:border-gray-800 border-orange-100 flex flex-col shrink-0`}>
        <div className="p-4 border-b dark:border-gray-800 border-orange-100 flex items-center justify-between">
          {sidebarOpen && <span className="text-orange-500 font-bold text-lg">PaperPulse <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full ml-1">Admin</span></span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="dark:text-gray-400 text-gray-500 hover:text-orange-500 ml-auto">
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {sidebarOpen && (
          <div className="px-4 py-3 border-b dark:border-gray-800 border-orange-100">
            <p className="text-xs dark:text-gray-500 text-gray-400 mb-1">Logged in as</p>
            <p className="text-xs dark:text-white text-gray-800 font-medium truncate">{currentUser}</p>
            <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block">admin</span>
          </div>
        )}

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setTab(item.id); setSearch('') }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${tab === item.id ? 'bg-orange-500 text-white' : 'dark:text-gray-400 text-gray-500 dark:hover:bg-gray-800 hover:bg-orange-100 dark:hover:text-white hover:text-orange-600'}`}>
              <span className="shrink-0 relative">
                {item.icon}
                {item.alert && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
              </span>
              {sidebarOpen && <span className="text-sm font-medium flex-1">{item.label}</span>}
              {sidebarOpen && item.count !== undefined && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${tab === item.id ? 'bg-orange-400 text-white' : item.alert ? 'bg-red-500/20 text-red-400' : 'dark:bg-gray-800 bg-orange-100 dark:text-gray-400 text-orange-500'}`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t dark:border-gray-800 border-orange-100 space-y-1">
          <button onClick={() => router.push('/dashboard')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl dark:text-gray-400 text-gray-500 dark:hover:bg-gray-800 hover:bg-orange-100 transition-all text-left">
            <Home size={16} className="shrink-0" />
            {sidebarOpen && <span className="text-sm">Back to app</span>}
          </button>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl dark:text-gray-400 text-gray-500 dark:hover:bg-gray-800 hover:bg-orange-100 transition-all text-left">
            <LogOut size={16} className="shrink-0" />
            {sidebarOpen && <span className="text-sm">Sign out</span>}
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 overflow-auto">
        <div className="border-b dark:border-gray-800 border-orange-100 px-8 py-4 flex items-center justify-between dark:bg-gray-950 bg-white sticky top-0 z-10">
          <h1 className="text-lg font-semibold dark:text-white text-gray-900 flex items-center gap-2">
            {currentNavItem?.icon}
            {currentNavItem?.label}
          </h1>
          <ThemeToggle />
        </div>

        <div className="p-8">

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && ( <>
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total Users', value: stats.userCount, icon: <Users size={18} />, color: 'text-orange-500' },
                  { label: 'Pro Users', value: stats.proCount, icon: <Zap size={18} />, color: 'text-yellow-400' },
                  { label: 'Papers', value: stats.paperCount, icon: <FileText size={18} />, color: 'text-blue-400' },
                  { label: 'Ideas Generated', value: stats.ideaCount, icon: <Lightbulb size={18} />, color: 'text-violet-400' },
                  { label: 'Saved Ideas', value: stats.savedCount, icon: <Bookmark size={18} />, color: 'text-amber-400' },
                  { label: 'Public Papers', value: stats.publicCount, icon: <Globe size={18} />, color: 'text-green-400' },
                  { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: <BarChart2 size={18} />, color: 'text-green-500' },
                  { label: 'Flagged', value: stats.flaggedCount, icon: <Flag size={18} />, color: stats.flaggedCount > 0 ? 'text-red-400' : 'text-gray-400' },
                ].map(stat => (
                  <div key={stat.label} className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs dark:text-gray-400 text-gray-500">{stat.label}</span>
                      <span className={stat.color}>{stat.icon}</span>
                    </div>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-5">
                  <h3 className="font-medium dark:text-white text-gray-900 mb-4">Recent Users</h3>
                  <div className="space-y-3">
                    {localUsers.slice(0, 5).map(u => (
                      <div key={u.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm dark:text-white text-gray-900">{u.email}</p>
                          <p className="text-xs dark:text-gray-500 text-gray-400">{new Date(u.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          {u.is_pro && <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">Pro</span>}
                          {u.banned && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Banned</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-5">
                  <h3 className="font-medium dark:text-white text-gray-900 mb-4">Recent Payments</h3>
                  {payments.length === 0 ? (
                    <p className="text-sm dark:text-gray-500 text-gray-400">No payments yet</p>
                  ) : (
                    <div className="space-y-3">
                      {payments.slice(0, 5).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm dark:text-white text-gray-900">{p.email}</p>
                            <p className="text-xs dark:text-gray-500 text-gray-400">{new Date(p.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className="text-green-400 font-medium text-sm">${p.amount}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <PaymentsAnalysis payments={payments} />
            </div>
          </> )}

          {/* ── USERS ── */}
          {tab === 'users' && (
            <div>
              <InviteAdminButton />

              <div className="flex items-center gap-4 mb-6">
                <input type="text" placeholder="Search users..." value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 dark:bg-gray-900 bg-orange-50 border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
                <span className="dark:text-gray-500 text-gray-400 text-sm shrink-0">{filteredUsers.length} users</span>
              </div>

              {confirmBan && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="dark:bg-gray-900 bg-white border dark:border-gray-700 border-orange-200 rounded-2xl p-6 max-w-sm w-full mx-4">
                    <h3 className="font-semibold dark:text-white text-gray-900 mb-2">Ban this user?</h3>
                    <p className="text-sm dark:text-gray-400 text-gray-500 mb-6">They will lose access to PaperPulse immediately.</p>
                    <div className="flex gap-3">
                      <button onClick={() => banUser(confirmBan)} className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors">Ban User</button>
                      <button onClick={() => setConfirmBan(null)} className="flex-1 dark:bg-gray-800 bg-orange-50 dark:text-gray-300 text-gray-700 py-2 rounded-xl text-sm hover:opacity-80 transition-colors">Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-gray-800 border-orange-100">
                      {['Email', 'Role', 'Plan', 'Status', 'Papers', 'Joined', 'Actions'].map(h => (
                        <th key={h} className="text-left dark:text-gray-400 text-gray-500 font-medium px-5 py-3 text-xs uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} className={`border-b dark:border-gray-800/50 border-orange-50 transition-colors ${u.banned ? 'opacity-50' : 'dark:hover:bg-gray-800/30 hover:bg-orange-100/50'}`}>
                        <td className="px-5 py-3 dark:text-white text-gray-900 font-medium">{u.email}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'dark:bg-gray-800 bg-orange-100 dark:text-gray-400 text-gray-500'}`}>{u.role}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 w-fit ${u.is_pro ? 'bg-orange-500/20 text-orange-400' : 'dark:bg-gray-800 bg-orange-100 dark:text-gray-400 text-gray-500'}`}>
                            {u.is_pro && <Zap size={10} />}{u.is_pro ? 'Pro' : 'Free'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 w-fit ${u.banned ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                            {u.banned ? <Ban size={10} /> : <CheckCircle size={10} />}
                            {u.banned ? 'Banned' : 'Active'}
                          </span>
                        </td>
                        <td className="px-5 py-3 dark:text-gray-400 text-gray-500 text-xs">{u.papers_count || 0}</td>
                        <td className="px-5 py-3 dark:text-gray-400 text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button onClick={() => toggleProStatus(u.id, u.is_pro)}
                              className="bg-orange-500/20 text-orange-500 border border-orange-500/30 hover:bg-orange-500/30 text-xs px-2.5 py-1 rounded-lg transition-colors">
                              {u.is_pro ? 'Remove Pro' : 'Give Pro'}
                            </button>
                            <button onClick={() => toggleUserRole(u.id, u.role)}
                              className="dark:bg-gray-800 bg-orange-100 dark:text-gray-300 text-gray-600 text-xs px-2.5 py-1 rounded-lg dark:hover:bg-gray-700 hover:bg-orange-200 transition-colors border dark:border-gray-700 border-orange-200">
                              {u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                            </button>
                            {u.banned ? (
                              <button onClick={() => unbanUser(u.id)}
                                className="bg-green-500/20 text-green-400 text-xs px-2.5 py-1 rounded-lg hover:bg-green-500/30 transition-colors">
                                Unban
                              </button>
                            ) : (
                              <button onClick={() => setConfirmBan(u.id)}
                                className="bg-red-500/20 text-red-400 text-xs px-2.5 py-1 rounded-lg hover:bg-red-500/30 transition-colors">
                                Ban
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PAPERS ── */}
          {tab === 'papers' && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <input type="text" placeholder="Search papers or users..." value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 dark:bg-gray-900 bg-orange-50 border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
                <span className="dark:text-gray-500 text-gray-400 text-sm shrink-0">{filteredPapers.length} papers</span>
              </div>
              <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-gray-800 border-orange-100">
                      {['Title', 'User', 'Status', 'Public', 'Date', 'Actions'].map(h => (
                        <th key={h} className="text-left dark:text-gray-400 text-gray-500 font-medium px-5 py-3 text-xs uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPapers.map(paper => (
                      <tr key={paper.id} className="border-b dark:border-gray-800/50 border-orange-50 dark:hover:bg-gray-800/30 hover:bg-orange-100/50 transition-colors">
                        <td className="px-5 py-3 dark:text-white text-gray-900 max-w-xs">
                          <p className="truncate font-medium">{paper.title}</p>
                        </td>
                        <td className="px-5 py-3 dark:text-gray-400 text-gray-500 text-xs">{paper.profiles?.email || '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[paper.status]}`}>{paper.status}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${paper.is_public ? 'bg-green-500/20 text-green-400' : 'dark:bg-gray-800 bg-orange-100 dark:text-gray-400 text-gray-500'}`}>
                            {paper.is_public ? 'public' : 'private'}
                          </span>
                        </td>
                        <td className="px-5 py-3 dark:text-gray-400 text-gray-500 text-xs">{new Date(paper.created_at).toLocaleDateString()}</td>
                        <td className="px-5 py-3">
                          <div className="flex gap-1.5">
                            <button onClick={() => togglePaperPublic(paper.id, paper.is_public)}
                              className="text-xs px-2.5 py-1 rounded-lg border dark:border-gray-700 border-orange-200 dark:text-gray-300 text-gray-600 dark:hover:bg-gray-700 hover:bg-orange-100 transition-colors">
                              {paper.is_public ? 'Unpublish' : 'Publish'}
                            </button>
                            <button onClick={() => deletePaper(paper.id)}
                              className="text-xs px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── IDEAS ── */}
          {tab === 'ideas' && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <input type="text" placeholder="Search ideas..." value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 dark:bg-gray-900 bg-orange-50 border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {localIdeas.filter(i => i.title?.toLowerCase().includes(search.toLowerCase())).map(idea => (
                  <div key={idea.id} className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium dark:text-white text-gray-900 text-sm leading-snug flex-1">{idea.title}</h3>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ml-3 shrink-0 ${difficultyColor[idea.difficulty] || 'dark:bg-gray-800 bg-orange-100 dark:text-gray-400 text-gray-500'}`}>{idea.difficulty}</span>
                    </div>
                    <p className="dark:text-gray-400 text-gray-500 text-xs leading-relaxed mb-3 line-clamp-2">{idea.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs dark:text-gray-500 text-gray-400">from: {(idea as any).papers?.title || '—'}</span>
                      <button onClick={() => deleteIdea(idea.id)}
                        className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-lg hover:bg-red-500/30 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PAYMENTS ── */}
          {tab === 'payments' && (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, color: 'text-green-500' },
                  { label: 'Total Payments', value: payments.length, color: 'text-blue-400' },
                  { label: 'Pro Users', value: stats.proCount, color: 'text-orange-500' },
                ].map(s => (
                  <div key={s.label} className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-5">
                    <p className="text-xs dark:text-gray-400 text-gray-500 mb-2">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mb-6">
                <input type="text" placeholder="Search payments..." value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 dark:bg-gray-900 bg-orange-50 border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
              </div>
              <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-gray-800 border-orange-100">
                      {['Email', 'Plan', 'Amount', 'Status', 'Date'].map(h => (
                        <th key={h} className="text-left dark:text-gray-400 text-gray-500 font-medium px-5 py-3 text-xs uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.length === 0 ? (
                      <tr><td colSpan={5} className="px-5 py-10 text-center dark:text-gray-500 text-gray-400">No payments yet</td></tr>
                    ) : filteredPayments.map((p: any) => (
                      <tr key={p.id} className="border-b dark:border-gray-800/50 border-orange-50 dark:hover:bg-gray-800/30 hover:bg-orange-100/50 transition-colors">
                        <td className="px-5 py-3 dark:text-white text-gray-900">{p.email}</td>
                        <td className="px-5 py-3"><span className="bg-orange-500/20 text-orange-400 text-xs px-2.5 py-1 rounded-full">{p.plan}</span></td>
                        <td className="px-5 py-3 text-green-400 font-medium">${p.amount}</td>
                        <td className="px-5 py-3"><span className={`text-xs px-2.5 py-1 rounded-full ${p.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{p.status}</span></td>
                        <td className="px-5 py-3 dark:text-gray-400 text-gray-500 text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── LIBRARY ── */}
          {tab === 'library' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm dark:text-gray-400 text-gray-500">{publicPapers.length} public papers in library</p>
              </div>
              <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-gray-800 border-orange-100">
                      {['Title', 'Author', 'Date', 'Actions'].map(h => (
                        <th key={h} className="text-left dark:text-gray-400 text-gray-500 font-medium px-5 py-3 text-xs uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {publicPapers.length === 0 ? (
                      <tr><td colSpan={4} className="px-5 py-10 text-center dark:text-gray-500 text-gray-400">No public papers yet. Publish papers from the Papers tab.</td></tr>
                    ) : publicPapers.map(paper => (
                      <tr key={paper.id} className="border-b dark:border-gray-800/50 border-orange-50 dark:hover:bg-gray-800/30 hover:bg-orange-100/50 transition-colors">
                        <td className="px-5 py-3 dark:text-white text-gray-900 max-w-xs">
                          <p className="truncate font-medium">{paper.title}</p>
                        </td>
                        <td className="px-5 py-3 dark:text-gray-400 text-gray-500 text-xs">{paper.profiles?.email || '—'}</td>
                        <td className="px-5 py-3 dark:text-gray-400 text-gray-500 text-xs">{new Date(paper.created_at).toLocaleDateString()}</td>
                        <td className="px-5 py-3">
                          <button onClick={() => togglePaperPublic(paper.id, true)}
                            className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-lg hover:bg-red-500/30 transition-colors">
                            Remove from library
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── ANNOUNCEMENTS ── */}
          {tab === 'announcements' && (
            <div>
              <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-6 mb-6">
                <h3 className="font-medium dark:text-white text-gray-900 mb-4">Create Announcement</h3>
                <div className="space-y-3">
                  <input type="text" placeholder="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                    className="w-full dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500" />
                  <textarea placeholder="Message" value={newMessage} onChange={e => setNewMessage(e.target.value)} rows={3}
                    className="w-full dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 resize-none" />
                  <div className="flex items-center gap-3">
                    <select value={newType} onChange={e => setNewType(e.target.value)}
                      className="dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-200 dark:text-white text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500">
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="success">Success</option>
                      <option value="error">Alert</option>
                    </select>
                    <button onClick={createAnnouncement}
                      className="bg-orange-500 hover:bg-orange-400 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors">
                      Publish
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {announcements.map(a => (
                  <div key={a.id} className={`dark:bg-gray-900 bg-orange-50 border rounded-2xl p-5 ${a.active ? 'dark:border-gray-800 border-orange-100' : 'opacity-50 dark:border-gray-800 border-orange-100'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="dark:text-gray-400 text-gray-500"><AnnouncementIcon type={a.type} /></span>
                          <h4 className="font-medium dark:text-white text-gray-900 text-sm">{a.title}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${a.active ? 'bg-green-500/20 text-green-400' : 'dark:bg-gray-800 bg-orange-100 dark:text-gray-400 text-gray-500'}`}>
                            {a.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm dark:text-gray-400 text-gray-500">{a.message}</p>
                        <p className="text-xs dark:text-gray-600 text-gray-400 mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => toggleAnnouncement(a.id, a.active)}
                          className="text-xs dark:bg-gray-800 bg-orange-100 dark:text-gray-300 text-gray-600 px-3 py-1 rounded-lg dark:hover:bg-gray-700 hover:bg-orange-200 transition-colors">
                          {a.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => deleteAnnouncement(a.id)}
                          className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-lg hover:bg-red-500/30 transition-colors">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {announcements.length === 0 && (
                  <p className="text-center dark:text-gray-500 text-gray-400 py-10 text-sm">No announcements yet</p>
                )}
              </div>
            </div>
          )}

          {/* ── FLAGGED ── */}
          {tab === 'flagged' && (
            <div className="space-y-6">
              {flaggedPapers.length === 0 && flaggedIdeas.length === 0 && (
                <div className="text-center py-20">
                  <CheckCircle size={36} className="mx-auto mb-3 text-green-400" />
                  <p className="dark:text-gray-400 text-gray-500">No flagged content</p>
                </div>
              )}

              {flaggedPapers.length > 0 && (
                <div>
                  <h3 className="font-medium dark:text-white text-gray-900 mb-4">Flagged Papers ({flaggedPapers.length})</h3>
                  <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b dark:border-gray-800 border-orange-100">
                          {['Title', 'User', 'Actions'].map(h => (
                            <th key={h} className="text-left dark:text-gray-400 text-gray-500 font-medium px-5 py-3 text-xs uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {flaggedPapers.map(paper => (
                          <tr key={paper.id} className="border-b dark:border-gray-800/50 border-orange-50">
                            <td className="px-5 py-3 dark:text-white text-gray-900 font-medium">{paper.title}</td>
                            <td className="px-5 py-3 dark:text-gray-400 text-gray-500 text-xs">{paper.profiles?.email || '—'}</td>
                            <td className="px-5 py-3">
                              <div className="flex gap-2">
                                <button onClick={() => unflagPaper(paper.id)} className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-lg hover:bg-green-500/30 transition-colors">Unflag</button>
                                <button onClick={() => deletePaper(paper.id)} className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-lg hover:bg-red-500/30 transition-colors">Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {flaggedIdeas.length > 0 && (
                <div>
                  <h3 className="font-medium dark:text-white text-gray-900 mb-4">Flagged Ideas ({flaggedIdeas.length})</h3>
                  <div className="space-y-3">
                    {flaggedIdeas.map(idea => (
                      <div key={idea.id} className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-medium dark:text-white text-gray-900 text-sm mb-1">{idea.title}</h4>
                            <p className="text-xs dark:text-gray-500 text-gray-400">from: {(idea as any).papers?.title || '—'}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => unflagIdea(idea.id)} className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-lg hover:bg-green-500/30 transition-colors">Unflag</button>
                            <button onClick={() => deleteIdea(idea.id)} className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-lg hover:bg-red-500/30 transition-colors">Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// Simple Payments analysis component (minimal, local-only analysis)
function PaymentsAnalysis({ payments }: { payments: any[] }) {
  const total = payments.reduce((s: number, p: any) => s + (p.amount || 0), 0)
  const count = payments.length
  const avg = count ? total / count : 0

  // monthly breakdown (YYYY-MM)
  const byMonth: Record<string, number> = {}
  payments.forEach(p => {
    try {
      const m = new Date(p.created_at).toISOString().slice(0,7)
      byMonth[m] = (byMonth[m] || 0) + (p.amount || 0)
    } catch {}
  })

  const months = Object.keys(byMonth).sort()
  const latestMonth = months[months.length-1] || null
  const latestRevenue = latestMonth ? byMonth[latestMonth] : 0

  return (
    <div className="dark:bg-gray-900 bg-orange-50 border dark:border-gray-800 border-orange-100 rounded-2xl p-5">
      <h3 className="font-medium dark:text-white text-gray-900 mb-3">Payments Analysis</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs dark:text-gray-400 text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-green-500">${total.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs dark:text-gray-400 text-gray-500">Payments</p>
          <p className="text-2xl font-bold text-gray-900">{count}</p>
        </div>
        <div>
          <p className="text-xs dark:text-gray-400 text-gray-500">Average Payment</p>
          <p className="text-2xl font-bold text-gray-900">${avg.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs dark:text-gray-400 text-gray-500">Latest Month ({latestMonth || '—'})</p>
          <p className="text-2xl font-bold text-green-400">${latestRevenue.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}
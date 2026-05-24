'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  LayoutDashboard, Compass, BookOpen, Bookmark, FolderOpen,
  Quote, Rocket, GitCompare, BookMarked, Briefcase, Zap, User,Brain,
  LogOut, ChevronLeft, ChevronRight, Info, AlertTriangle, CheckCircle, AlertCircle, X
} from 'lucide-react'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/library', label: 'Library', icon: BookOpen },
  { href: '/saved', label: 'Saved', icon: Bookmark },
  { href: '/collections', label: 'Collections', icon: FolderOpen },
  { href: '/citations', label: 'Citations', icon: Quote },
  { href: '/tracker', label: 'Tracker', icon: Rocket },
  { href: '/compare', label: 'Compare', icon: GitCompare },
  { href: '/reading', label: 'Reading', icon: BookMarked },
  { href: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { href: '/upgrade', label: 'Upgrade', icon: Zap },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/focus', label: 'Focus', icon: Brain },
]

const announcementIcons: Record<string, any> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: AlertCircle,
}

const announcementColors: Record<string, string> = {
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  success: 'bg-green-500/10 border-green-500/30 text-green-400',
  error: 'bg-red-500/10 border-red-500/30 text-red-400',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [dismissed, setDismissed] = useState<string[]>([])
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    supabase
      .from('announcements')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => setAnnouncements(data || []))
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const visibleAnnouncements = announcements.filter(a => !dismissed.includes(a.id))

  return (
    <div className="min-h-screen dark:bg-gray-950 bg-white flex">

      {/* SIDEBAR */}
      <aside className={`${collapsed ? 'w-16' : 'w-56'} transition-all duration-300 shrink-0 dark:bg-gray-900 bg-orange-50 border-r dark:border-gray-800 border-orange-100 flex flex-col sticky top-0 h-screen`}>

        {/* Logo */}
        <div className="px-4 py-4 flex items-center justify-between border-b dark:border-gray-800 border-orange-100">
          {!collapsed && (
            <span className="text-orange-500 font-bold text-lg">PaperPulse</span>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="dark:text-gray-400 text-gray-500 hover:text-orange-500 transition-colors ml-auto">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {links.map(link => {
            const Icon = link.icon
            const active = pathname === link.href
            return (
              <Link key={link.href} href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                  active
                    ? 'bg-orange-500 text-white'
                    : 'dark:text-gray-400 text-gray-500 dark:hover:bg-gray-800 hover:bg-orange-100 dark:hover:text-white hover:text-orange-600'
                }`}>
                <Icon size={18} className="shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium">{link.label}</span>
                )}
                {/* Tooltip when collapsed */}
                {collapsed && (
                  <div className="absolute left-16 dark:bg-gray-800 bg-white border dark:border-gray-700 border-orange-200 text-xs dark:text-white text-gray-900 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg ml-1">
                    {link.label}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-2 py-3 border-t dark:border-gray-800 border-orange-100 space-y-0.5">
          <div className="flex items-center gap-3 px-3 py-2">
            {!collapsed && <ThemeToggle />}
            {collapsed && <ThemeToggle />}
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl dark:text-gray-400 text-gray-500 dark:hover:bg-gray-800 hover:bg-orange-100 dark:hover:text-white hover:text-orange-600 transition-all">
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span className="text-sm">Sign out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Announcements */}
        {visibleAnnouncements.map(a => {
          const Icon = announcementIcons[a.type] || Info
          return (
            <div key={a.id} className={`border-b px-6 py-3 flex items-center justify-between ${announcementColors[a.type] || announcementColors.info}`}>
              <div className="flex items-center gap-2 min-w-0">
                <Icon size={15} className="shrink-0" />
                <span className="font-medium text-sm shrink-0">{a.title}</span>
                <span className="text-sm opacity-80 truncate">— {a.message}</span>
              </div>
              <button
                onClick={() => setDismissed(prev => [...prev, a.id])}
                className="opacity-60 hover:opacity-100 transition-opacity ml-4 shrink-0">
                <X size={15} />
              </button>
            </div>
          )
        })}

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
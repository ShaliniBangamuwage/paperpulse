'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Logged out')
    router.push('/login')
  }


   const links = [
  { href: '/dashboard', label: '📄 Dashboard' },
  { href: '/discover', label: '🔍 Discover' },
  { href: '/library', label: '📚 Library' },
  { href: '/saved', label: '🔖 Saved' },
  { href: '/collections', label: '📁 Collections' },
  { href: '/citations', label: '📝 Citations' },
  { href: '/tracker', label: '🚀 Tracker' },
  { href: '/upgrade', label: '⚡ Upgrade' },
  { href: '/profile', label: '👤 Profile' },
]

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="text-white font-bold text-xl">
          Paper<span className="text-indigo-400">Pulse</span>
        </Link>
        <div className="flex items-center gap-6">
          {links.map(link => (
            <Link key={link.href} href={link.href}
              className={`text-sm transition-colors ${pathname === link.href ? 'text-white font-medium' : 'text-gray-400 hover:text-white'}`}>
              {link.label}
            </Link>
          ))}
          <button onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white transition-colors">
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
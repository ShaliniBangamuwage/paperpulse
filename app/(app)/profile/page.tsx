'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FileText,
  Lightbulb,
  CheckCircle,
  Globe,
  Zap,
  Camera,
  Pencil,
  X,
  Save,
  Shield,
  Calendar,
  BookOpen,
  Bookmark,
  ExternalLink
} from 'lucide-react'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [papers, setPapers] = useState<any[]>([])
  const [savedIdeas, setSavedIdeas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user }
        } = await supabase.auth.getUser()

        if (!user) {
          router.push('/login')
          return
        }

        const { data: prof, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) {
          console.error(profileError)
        }

        const { data: userPapers, error: papersError } = await supabase
          .from('papers')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (papersError) {
          console.error(papersError)
        }

        const { data: saved, error: savedError } = await supabase
          .from('saved_ideas')
          .select('*, idea:ideas(*)')
          .eq('user_id', user.id)

        if (savedError) {
          console.error(savedError)
        }

        setProfile({
          ...prof,
          email: user.email
        })

        setPapers(userPapers || [])
        setSavedIdeas(saved || [])

        setBio(prof?.bio || '')
        setDisplayName(prof?.display_name || '')
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [router, supabase])

  async function saveProfile() {
    setSaving(true)

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase
        .from('profiles')
        .update({
          bio,
          display_name: displayName
        })
        .eq('id', user.id)

      if (error) {
        toast.error(error.message)
        return
      }

      setProfile((prev: any) => ({
        ...prev,
        bio,
        display_name: displayName
      }))

      setEditing(false)

      toast.success('Profile updated!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  async function uploadAvatar(file: File) {
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB')
      return
    }

    setUploadingAvatar(true)

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) return

      const ext = file.name.split('.').pop()

      const fileName = `${user.id}/avatar.${ext}`

      await supabase.storage
        .from('avatars')
        .remove([fileName])

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '0',
          upsert: true
        })

      if (uploadError) {
        toast.error(uploadError.message)
        setUploadingAvatar(false)
        return
      }

      const {
        data: { publicUrl }
      } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const avatarUrl = `${publicUrl}?t=${Date.now()}`

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl
        })
        .eq('id', user.id)

      if (updateError) {
        toast.error(updateError.message)
        return
      }

      setProfile((prev: any) => ({
        ...prev,
        avatar_url: avatarUrl
      }))

      toast.success('Avatar updated!')
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const totalIdeas = papers.length * 3

  const doneIdeas = savedIdeas.filter(
    (s) => s.status === 'done'
  ).length

  const publicPapers = papers.filter(
    (p) => p.is_public
  ).length

  const initials = (
    profile?.display_name?.[0] ||
    profile?.email?.[0] ||
    '?'
  ).toUpperCase()

  const stats = [
    {
      label: 'Papers',
      value: papers.length,
      icon: <FileText size={18} />
    },
    {
      label: 'Ideas',
      value: totalIdeas,
      icon: <Lightbulb size={18} />
    },
    {
      label: 'Completed',
      value: doneIdeas,
      icon: <CheckCircle size={18} />
    },
    {
      label: 'Public',
      value: publicPapers,
      icon: <Globe size={18} />
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen dark:bg-gray-950 bg-white p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-48 w-full dark:bg-gray-800 bg-gray-100 rounded-2xl" />
          <Skeleton className="h-32 w-full dark:bg-gray-800 bg-gray-100 rounded-2xl" />
          <Skeleton className="h-64 w-full dark:bg-gray-800 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen dark:bg-gray-950 bg-gray-50 text-gray-900 dark:text-white">

      {/* Cover banner */}
      <div className="h-32 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400" />

      <div className="max-w-4xl mx-auto px-6 pb-12">

        {/* Profile header */}
        <div className="dark:bg-gray-900 bg-white border dark:border-gray-800 border-gray-200 rounded-2xl p-6 -mt-6 mb-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-end gap-4 -mt-16">

              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-2xl border-4 dark:border-gray-900 border-white overflow-hidden bg-orange-500 flex items-center justify-center shadow-lg">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-3xl font-bold">
                      {initials}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-orange-500 hover:bg-orange-400 text-white rounded-lg flex items-center justify-center shadow-md transition-colors"
                >
                  {uploadingAvatar ? (
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera size={13} />
                  )}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] &&
                    uploadAvatar(e.target.files[0])
                  }
                />
              </div>

              {/* Name & info */}
              <div className="mb-1">
                {editing ? (
                  <input
                    value={displayName}
                    onChange={(e) =>
                      setDisplayName(e.target.value)
                    }
                    placeholder="Your name"
                    className="bg-transparent border-b-2 border-orange-500 text-xl font-bold focus:outline-none dark:text-white text-gray-900 w-48 mb-1"
                  />
                ) : (
                  <h1 className="text-xl font-bold dark:text-white text-gray-900">
                    {profile?.display_name ||
                      profile?.email?.split('@')[0]}
                  </h1>
                )}

                <p className="dark:text-gray-400 text-gray-500 text-sm">
                  {profile?.email}
                </p>

                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {profile?.is_pro && (
                    <span className="inline-flex items-center gap-1 bg-orange-500/20 text-orange-500 text-xs px-2.5 py-0.5 rounded-full font-medium border border-orange-500/20">
                      <Zap size={10} /> Pro
                    </span>
                  )}

                  {profile?.role === 'admin' && (
                    <span className="inline-flex items-center gap-1 bg-red-500/20 text-red-400 text-xs px-2.5 py-0.5 rounded-full font-medium border border-red-500/20">
                      <Shield size={10} /> Admin
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 dark:text-gray-500 text-gray-400 text-xs">
                    <Calendar size={10} />
                    Joined{' '}
                    {profile?.created_at
                      ? new Date(
                          profile.created_at
                        ).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric'
                        })
                      : 'Recently'}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit / Save buttons */}
            <div className="shrink-0 mt-2">
              {editing ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="inline-flex items-center gap-1.5 dark:bg-gray-800 bg-gray-100 dark:text-gray-300 text-gray-600 text-sm px-3 py-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X size={14} /> Cancel
                  </button>

                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-white text-sm px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
                  >
                    <Save size={14} />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1.5 dark:bg-gray-800 bg-gray-100 border dark:border-gray-700 border-gray-200 dark:text-gray-300 text-gray-600 text-sm px-4 py-2 rounded-xl hover:border-orange-500 hover:text-orange-500 transition-colors"
                >
                  <Pencil size={14} /> Edit profile
                </button>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="mt-5 pt-5 border-t dark:border-gray-800 border-gray-100">
            {editing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a short bio — your university, interests, what you're building..."
                rows={3}
                className="w-full dark:bg-gray-800 bg-gray-50 border dark:border-gray-700 border-gray-200 rounded-xl px-4 py-3 text-sm dark:text-white text-gray-900 focus:outline-none focus:border-orange-500 resize-none"
              />
            ) : (
              <p className="dark:text-gray-400 text-gray-500 text-sm leading-relaxed">
                {profile?.bio ||
                  'No bio yet — click Edit profile to add one.'}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="dark:bg-gray-900 bg-white border dark:border-gray-800 border-gray-200 rounded-2xl p-5 text-center shadow-sm"
            >
              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center mx-auto mb-3 text-orange-500">
                {stat.icon}
              </div>

              <p className="text-2xl font-bold text-orange-500">
                {stat.value}
              </p>

              <p className="dark:text-gray-400 text-gray-500 text-xs mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Recent papers */}
          <div className="dark:bg-gray-900 bg-white border dark:border-gray-800 border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500">
                  <BookOpen size={16} />
                </div>

                <h2 className="font-semibold dark:text-white text-gray-900">
                  Recent papers
                </h2>
              </div>

              <button
                onClick={() => router.push('/dashboard')}
                className="text-xs text-orange-500 hover:underline flex items-center gap-1"
              >
                View all <ExternalLink size={10} />
              </button>
            </div>

            {papers.length === 0 ? (
              <div className="text-center py-8">
                <FileText
                  size={32}
                  className="mx-auto text-gray-300 dark:text-gray-700 mb-2"
                />

                <p className="dark:text-gray-500 text-gray-400 text-sm">
                  No papers yet
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {papers.slice(0, 4).map((paper) => (
                  <div
                    key={paper.id}
                    onClick={() =>
                      paper.status === 'done' &&
                      router.push(`/paper/${paper.id}`)
                    }
                    className={`flex items-center gap-3 p-3 dark:bg-gray-800 bg-gray-50 rounded-xl ${
                      paper.status === 'done'
                        ? 'cursor-pointer hover:bg-orange-500/10 dark:hover:bg-orange-500/10'
                        : ''
                    } transition-colors`}
                  >
                    <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center shrink-0">
                      <FileText
                        size={14}
                        className="text-orange-500"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium dark:text-white text-gray-900 truncate">
                        {paper.title}
                      </p>

                      <p className="text-xs dark:text-gray-500 text-gray-400">
                        {new Date(
                          paper.created_at
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                        paper.status === 'done'
                          ? 'bg-green-500/20 text-green-400'
                          : paper.status === 'processing'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {paper.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Saved ideas */}
          <div className="dark:bg-gray-900 bg-white border dark:border-gray-800 border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500">
                  <Bookmark size={16} />
                </div>

                <h2 className="font-semibold dark:text-white text-gray-900">
                  Saved ideas
                </h2>
              </div>

              <button
                onClick={() => router.push('/saved')}
                className="text-xs text-orange-500 hover:underline flex items-center gap-1"
              >
                View all <ExternalLink size={10} />
              </button>
            </div>

            {savedIdeas.length === 0 ? (
              <div className="text-center py-8">
                <Bookmark
                  size={32}
                  className="mx-auto text-gray-300 dark:text-gray-700 mb-2"
                />

                <p className="dark:text-gray-500 text-gray-400 text-sm">
                  No saved ideas yet
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedIdeas.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 dark:bg-gray-800 bg-gray-50 rounded-xl"
                  >
                    <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center shrink-0">
                      <Lightbulb
                        size={14}
                        className="text-orange-500"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium dark:text-white text-gray-900 truncate">
                        {item.idea?.title}
                      </p>

                      <p className="text-xs dark:text-gray-500 text-gray-400">
                        {item.idea?.difficulty}
                      </p>
                    </div>

                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                        item.status === 'done'
                          ? 'bg-green-500/20 text-green-400'
                          : item.status === 'building'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
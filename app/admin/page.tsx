import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AdminDashboardClient from './AdminDashboardClient'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()

  const [
    { count: userCount },
    { count: paperCount },
    { count: ideaCount },
    { count: savedCount },
    { count: publicCount },
    { count: proCount },
    { data: papers, error: papersError },
    { data: users, error: usersError },
    { data: recentIdeas, error: ideasError },
    { data: payments, error: paymentsError },
    { data: announcements, error: announcementsError },
    { data: flaggedPapers },
    { data: flaggedIdeas },
    { data: proRequests },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('papers').select('*', { count: 'exact', head: true }),
    admin.from('ideas').select('*', { count: 'exact', head: true }),
    admin.from('saved_ideas').select('*', { count: 'exact', head: true }),
    admin.from('papers').select('*', { count: 'exact', head: true }).eq('is_public', true),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('is_pro', true),
    admin.from('papers').select('*, profiles(email)').order('created_at', { ascending: false }).limit(100),
    admin.from('profiles').select('*').order('created_at', { ascending: false }).limit(100),
    admin.from('ideas').select('*, papers(title)').order('id', { ascending: false }).limit(50),
    admin.from('payments').select('*').order('created_at', { ascending: false }).limit(100),
    admin.from('announcements').select('*').order('created_at', { ascending: false }),
    admin.from('papers').select('*, profiles(email)').eq('flagged', true),
    admin.from('ideas').select('*, papers(title)').eq('flagged', true),
    admin.from('pro_requests').select('*').order('created_at', { ascending: false }),
  ])

  // Log errors to terminal
  if (papersError) console.error('PAPERS ERROR:', papersError)
  if (usersError) console.error('USERS ERROR:', usersError)
  if (ideasError) console.error('IDEAS ERROR:', ideasError)
  if (paymentsError) console.error('PAYMENTS ERROR:', paymentsError)
  if (announcementsError) console.error('ANNOUNCEMENTS ERROR:', announcementsError)

  console.log('Papers count:', papers?.length)
  console.log('Users count:', users?.length)
  console.log('Payments count:', payments?.length)
  console.log('Announcements count:', announcements?.length)

  const totalRevenue = (payments || []).reduce(
    (sum: number, p: any) => sum + (p.amount || 0),
    0
  )

  return (
    <AdminDashboardClient
      currentUser={user.email || ''}
      stats={{
        userCount: userCount || 0,
        paperCount: paperCount || 0,
        ideaCount: ideaCount || 0,
        savedCount: savedCount || 0,
        publicCount: publicCount || 0,
        proCount: proCount || 0,
        totalRevenue,
        flaggedCount:
          (flaggedPapers?.length || 0) + (flaggedIdeas?.length || 0),
      }}
      proRequests={proRequests || []}
      papers={papers || []}
      users={users || []}
      recentIdeas={recentIdeas || []}
      payments={payments || []}
      announcements={announcements || []}
      flaggedPapers={flaggedPapers || []}
      flaggedIdeas={flaggedIdeas || []}
    />
  )
}
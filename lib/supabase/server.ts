import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  // `cookies()` is synchronous in Next.js App Router
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // return an array of simple { name, value } objects
        getAll() {
          try {
            return cookieStore.getAll().map((c: any) => ({ name: c.name, value: c.value }))
          } catch (err) {
            return []
          }
        },

        // accept [{ name, value, options }] and set via Next's cookie API
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Next's cookies().set expects an object
              cookieStore.set({ name, value, ...(options || {}) })
            })
          } catch (error) {
            console.error(error)
          }
        },
      },
    }
  )
}
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const paths = body?.paths
    if (!Array.isArray(paths) || paths.some((p: any) => typeof p !== 'string')) {
      return NextResponse.json({ error: 'Invalid request, expected paths array' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const urls: Record<string, string> = {}

    for (const path of paths) {
      if (path.startsWith('http://') || path.startsWith('https://')) {
        urls[path] = path
        continue
      }

      const { data, error } = await supabase.storage
        .from('id-photos')
        .createSignedUrl(path, 60)

      if (error || !data?.signedUrl) {
        return NextResponse.json({ error: `Failed to generate signed URL for ${path}` }, { status: 500 })
      }

      urls[path] = data.signedUrl
    }

    return NextResponse.json({ urls })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

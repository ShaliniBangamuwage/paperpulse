import { NextRequest, NextResponse } from 'next/server'

const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') || ''
  if (!query) return NextResponse.json({ papers: [] })

  const cached = cache.get(query)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({ papers: cached.data, cached: true })
  }

  try {
    const res = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=10&fields=paperId,title,abstract,year,authors,openAccessPdf,citationCount`,
      {
        headers: {
          'Accept': 'application/json',
          'x-api-key': process.env.SEMANTIC_SCHOLAR_API_KEY!
        }
      }
    )

    if (!res.ok) throw new Error(`API returned ${res.status}`)

    const data = await res.json()
    const papers = data.data || []

    cache.set(query, { data: papers, timestamp: Date.now() })
    return NextResponse.json({ papers })

  } catch (err: any) {
    console.error('Search error:', err.message)
    return NextResponse.json({ papers: [], error: err.message }, { status: 200 })
  }
}
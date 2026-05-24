import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function callGroq(prompt: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000
    })
  })
  const data = await res.json()
  return data.choices[0].message.content
}

export async function POST(req: NextRequest) {
  try {
    const { title, abstract, userId } = await req.json()
    const supabase = createAdminClient()

    // Insert paper record
    const { data: paper, error: paperError } = await supabase
      .from('papers')
      .insert({
        user_id: userId,
        title,
        abstract: abstract?.slice(0, 500) || '',
        file_url: '',
        status: 'processing',
        is_public: false,
      })
      .select()
      .single()

    if (paperError) throw paperError

    // Generate ideas from abstract
    const prompt = `You are a project idea generator for computer science students.

Based on this research paper:
Title: ${title}
Abstract: ${abstract}

Generate exactly 3 buildable project ideas a student can build in 1-8 weeks.

Return ONLY valid JSON array, no markdown, no backticks:
[
  {
    "title": "...",
    "description": "2-3 sentence description of what to build",
    "difficulty": "Beginner",
    "estimated_weeks": 2,
    "tech_stack": ["Next.js", "Python"],
    "architecture": "1 paragraph describing how the system works"
  }
]

difficulty must be exactly: "Beginner", "Intermediate", or "Advanced"`

    const raw = await callGroq(prompt)
    const clean = raw.replace(/\`\`\`json|\`\`\`/g, '').trim()
    const ideas = JSON.parse(clean)

    const ideasToInsert = ideas.map((idea: any) => ({
      paper_id: paper.id,
      title: idea.title,
      description: idea.description,
      difficulty: idea.difficulty,
      estimated_weeks: idea.estimated_weeks,
      tech_stack: idea.tech_stack,
      architecture: idea.architecture,
    }))

    await supabase.from('ideas').insert(ideasToInsert)
    await supabase.from('papers').update({ status: 'done' }).eq('id', paper.id)

    return NextResponse.json({ paperId: paper.id })
  } catch (err: any) {
    console.error('Import error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
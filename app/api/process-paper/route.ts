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
      model: process.env.GROQ_MODEL!,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000
    })
  })
  const data = await res.json()
  return data.choices[0].message.content
}

export async function POST(request: NextRequest) {
  try {
    const { text, paperId } = await request.json()
    const supabase = createAdminClient()

    const summaryPrompt = `You are an academic research analyst. Given the following research paper text, extract key information.
Return ONLY valid JSON, no markdown, no explanation:
{
  "core_problem": "one sentence describing the main problem",
  "methodology": "one sentence describing the approach",
  "key_findings": "one sentence describing main results",
  "open_problems": ["problem 1", "problem 2", "problem 3"]
}

Paper text:
${text.slice(0, 4000)}`

    const summaryRaw = await callGroq(summaryPrompt)
    const summary = JSON.parse(summaryRaw.replace(/```json|```/g, '').trim())

   const ideasPrompt = `
You are an expert academic project idea generator.

Analyze the research paper carefully and generate project ideas STRICTLY related to:
- the paper's core topic
- the actual research domain
- the methodology used
- the real-world problem solved

Do NOT generate generic AI ideas.
Do NOT change the topic/domain of the paper.
Avoid unrelated themes like:
- mask detection
- covid systems
- generic chatbots
- unrelated AI assistants
Prefer ideas that:
- extend the original research
- solve limitations in the paper
- improve scalability
- improve security
- improve real-time performance

Stay tightly connected to the paper topic.
Research Summary:

Core Problem:
${summary.core_problem}

Methodology:
${summary.methodology}

Key Findings:
${summary.key_findings}

Open Problems:
${summary.open_problems.join('\n')}

Generate exactly 3 realistic software project ideas for university students.

Return ONLY valid JSON array:
[
  {
    "title": "project title",
    "description": "2-3 sentence description",
    "difficulty": "Beginner",
    "estimated_weeks": 3,
    "tech_stack": ["Next.js", "Python"],
    "architecture": "system architecture explanation"
  }
]


Rules:
- Ideas must stay in the SAME domain as the paper
- Ideas must be practical and buildable
- difficulty must be exactly:
  Beginner
  Intermediate
  Advanced
`

    const ideasRaw = await callGroq(ideasPrompt)
    const ideas = JSON.parse(ideasRaw.replace(/```json|```/g, '').trim())

    for (const idea of ideas) {
      await supabase.from('ideas').insert({ ...idea, paper_id: paperId })
    }

    await supabase.from('papers').update({ status: 'done' }).eq('id', paperId)

    return NextResponse.json({ success: true, ideas })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { paperA, paperB } = await req.json()

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL!,
      messages: [{
        role: 'user',
        content: `Compare these two research papers for a CS student deciding which to build a project from.

Paper A: ${paperA.title}
Abstract A: ${paperA.abstract}

Paper B: ${paperB.title}
Abstract B: ${paperB.abstract}

Write a concise comparison covering:
1. Key differences in topic and approach
2. Which is easier to build a project from and why
3. Which has more real-world impact
4. Final recommendation

Keep it under 200 words, plain text, no markdown.`
      }],
      max_tokens: 400,
      temperature: 0.7
    })
  })

  const data = await res.json()
  const comparison = data.choices?.[0]?.message?.content || ''
  return NextResponse.json({ comparison })
}
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { title, abstract } = await req.json()

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
          content: `Summarize this research paper in 3-4 sentences for a computer science student. Be clear and concise, focus on what was built and why it matters.

Title: ${title}
Abstract: ${abstract}

Return only the summary text, no labels or formatting.`
        }],
        temperature: 0.5,
        max_tokens: 300
      })
    })

    const data = await res.json()
    const summary = data.choices[0].message.content

    return NextResponse.json({ summary })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { question, paperTitle, paperAbstract, ideas, history } = await request.json()

    const systemContext = `You are an expert research assistant helping a computer science student understand a research paper.

Paper title: ${paperTitle}
Paper abstract: ${paperAbstract}
Project ideas generated from this paper: ${ideas.join(', ')}

Your job:
- Answer questions about the paper clearly and simply
- Help the student understand complex concepts
- Give practical implementation advice when asked
- Keep answers concise but complete (2-5 sentences usually)
- Use bullet points for lists
- Be encouraging and student-friendly`

    const conversationHistory = history.map((m: any) => ({
      role: m.role,
      content: m.content
    }))

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemContext },
          ...conversationHistory,
          { role: 'user', content: question }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    const data = await res.json()
    const answer = data.choices[0].message.content

    return NextResponse.json({ answer })
  } catch (error: any) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
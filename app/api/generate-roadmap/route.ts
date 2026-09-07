import { NextRequest, NextResponse } from 'next/server'

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
      max_tokens: 3000
    })
  })
  const data = await res.json()
  return data.choices[0].message.content
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, architecture, tech_stack, difficulty, estimated_weeks } = await request.json()

    const prompt = `You are a project planning expert for computer science students.

Generate a detailed project roadmap for this idea:
Title: ${title}
Description: ${description}
Architecture: ${architecture}
Tech Stack: ${tech_stack?.join(', ')}
Difficulty: ${difficulty}
Estimated weeks: ${estimated_weeks}

Return ONLY valid JSON, no markdown, no backticks:
{
  "idea_title": "${title}",
  "total_duration": "X weeks",
  "difficulty": "${difficulty}",
  "overview": "2-3 sentence project overview and what the student will learn",
  "phases": [
    {
      "phase": 1,
      "title": "Phase name",
      "duration": "Week 1-2",
      "tasks": [
        "Specific task 1",
        "Specific task 2",
        "Specific task 3",
        "Specific task 4"
      ],
      "deliverable": "What you will have built by end of this phase"
    }
  ],
  "tech_stack": ["tech1", "tech2"],
  "tips": [
    "Practical tip 1 for students",
    "Practical tip 2",
    "Practical tip 3"
  ]
}

Create ${Math.ceil(estimated_weeks / 2)} phases that cover: setup, core features, advanced features, polish and deployment.
Each phase should have 3-5 specific actionable tasks.
Tips should be practical advice for a student building this for the first time.`

    const raw = await callGroq(prompt)
    const clean = raw.replace(/```json|```/g, '').trim()
    const roadmap = JSON.parse(clean)

    return NextResponse.json({ roadmap })
  } catch (error: any) {
    console.error('Roadmap error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
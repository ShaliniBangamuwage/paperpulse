import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const { requestId, idFrontUrl, idBackUrl, universityName, universityEmail } = await request.json()

    const supabase = createAdminClient()

    async function resolveMediaUrl(value: string) {
      if (!value) return ''
      if (value.startsWith('http://') || value.startsWith('https://')) {
        return value
      }

      const { data, error } = await supabase.storage
        .from('id-photos')
        .createSignedUrl(value, 60)

      if (error || !data?.signedUrl) {
        throw new Error('Failed to resolve ID media URL')
      }

      return data.signedUrl
    }

    const frontMediaUrl = await resolveMediaUrl(idFrontUrl)
    const backMediaUrl = await resolveMediaUrl(idBackUrl)

    const prompt = `You are a student ID verification assistant. Analyze the provided student ID card images and determine if this is a valid university/college student ID.

University claimed: ${universityName}
University email provided: ${universityEmail}

Please check:
1. Is this a real student ID card (not a fake or edited image)?
2. Does the university name on the ID match or relate to "${universityName}"?
3. Is the ID card valid (not expired if expiry is visible)?
4. Is the student information clearly visible?

Respond in this exact JSON format only, no other text:
{
  "is_valid": true or false,
  "confidence": "high", "medium", or "low",
  "reason": "brief explanation",
  "student_name": "extracted name or unknown",
  "university_on_id": "university name from ID or unknown",
  "expiry": "expiry date or unknown"
}`

    const imageMessages: any[] = [
      {
        type: 'text',
        text: prompt
      }
    ]

    if (frontMediaUrl) {
      imageMessages.push({
        type: 'image_url',
        image_url: { url: frontMediaUrl }
      })
    }

    if (backMediaUrl) {
      imageMessages.push({
        type: 'image_url',
        image_url: { url: backMediaUrl }
      })
    }

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL!,
      messages: [
        {
          role: 'user',
          content: imageMessages
        }
      ],
      max_tokens: 500,
      response_format: { type: 'json_object' },  // ✅ force JSON response from Groq
    })

    const responseText = completion.choices[0]?.message?.content || ''

    let analysis
    try {
      const cleaned = responseText.replace(/```json|```/g, '').trim()
      analysis = JSON.parse(cleaned)
    } catch {
      analysis = {
        is_valid: false,
        confidence: 'low',
        reason: 'Could not parse ID card information',
        student_name: 'unknown',
        university_on_id: 'unknown',
        expiry: 'unknown'
      }
    }

    if (analysis.is_valid && analysis.confidence === 'high') {
      // Auto approve
      const { data: reqData, error: updateError } = await supabase
        .from('pro_requests')
        .update({
          status: 'approved',
          ai_verified: true,
          ai_confidence: analysis.confidence,
          ai_analysis: JSON.stringify(analysis),
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select('user_id')
        .single()

      if (updateError) {
        console.error('Failed to update pro_request:', updateError)
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
      }

      if (reqData?.user_id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ is_pro: true, pro_since: new Date().toISOString() })
          .eq('id', reqData.user_id)

        if (profileError) {
          console.error('Failed to update profile:', profileError)
        }
      }

      return NextResponse.json({ status: 'approved', analysis })
    } else {
      // Send to admin for manual review
      const { error: pendingError } = await supabase
        .from('pro_requests')
        .update({
          status: 'pending',
          ai_verified: false,
          ai_confidence: analysis.confidence,
          ai_analysis: JSON.stringify(analysis),
        })
        .eq('id', requestId)

      if (pendingError) {
        console.error('Failed to set pending:', pendingError)
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
      }

      return NextResponse.json({ status: 'pending', analysis })
    }
  } catch (error: any) {
    console.error('Verify error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
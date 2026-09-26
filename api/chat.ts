import type { VercelRequest, VercelResponse } from '@vercel/node'

const SYSTEM_PROMPT = `You are the Takara Sake tasting assistant — a knowledgeable, friendly pourer at the counter, not a generic chatbot.

Help guests understand what they're drinking: sake styles (junmai, ginjo, daiginjo, nigori, nama, kimoto), how to read SMV/acidity/polishing ratio, food pairings, and serving temperature. Keep answers short and conversational — two or three sentences unless the guest asks for more.

If the guest is currently looking at a specific bottle, ground your answer in that bottle's real details rather than speaking generically. Don't invent tasting notes, prices, or availability you weren't given — if you don't know, say so and suggest they ask staff.`

const PREFERRED_MODELS = [
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
]

type ChatMessage = { role: 'user' | 'assistant'; content: string }

async function resolveModel(apiKey: string) {
  if (process.env.GROQ_MODEL) return process.env.GROQ_MODEL

  const modelsResponse = await fetch('https://api.groq.com/openai/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!modelsResponse.ok) throw new Error('Unable to list models for this Groq key.')

  const models = await modelsResponse.json()
  const availableModels = new Set((models.data || []).map((model: { id: string }) => model.id))
  return PREFERRED_MODELS.find((model) => availableModels.has(model)) || models.data?.[0]?.id
}

function sanitizeHistory(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return []
  return input
    .filter(
      (entry): entry is ChatMessage =>
        entry &&
        (entry.role === 'user' || entry.role === 'assistant') &&
        typeof entry.content === 'string' &&
        entry.content.trim().length > 0,
    )
    .slice(-8)
    .map((entry) => ({ role: entry.role, content: entry.content.trim() }))
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const prompt = typeof request.body?.prompt === 'string' ? request.body.prompt.trim() : ''
  if (!prompt) {
    return response.status(400).json({ error: 'A prompt is required.' })
  }

  const context = typeof request.body?.context === 'string' ? request.body.context.trim() : ''
  const history = sanitizeHistory(request.body?.history)

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return response.status(503).json({ error: 'AI is not configured yet. Add GROQ_API_KEY in Vercel project settings.' })
  }

  try {
    const model = await resolveModel(apiKey)
    if (!model) return response.status(502).json({ error: 'No chat model is available for this Groq key.' })

    const systemPrompt = context
      ? `${SYSTEM_PROMPT}\n\nThe guest is currently looking at: ${context}`
      : SYSTEM_PROMPT

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 300,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: prompt },
        ],
      }),
    })

    const data = await groqResponse.json()
    if (!groqResponse.ok) {
      return response.status(502).json({ error: data?.error?.message || 'The AI provider returned an error.' })
    }

    return response.status(200).json({ message: data.choices?.[0]?.message?.content || 'No response was returned.' })
  } catch {
    return response.status(502).json({ error: 'Unable to reach the AI provider.' })
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node'

const SYSTEM_PROMPT = `You are Jarvis, a concise clinical-trial research assistant. Help users turn natural-language requests into useful study-search guidance. Do not invent study results or medical advice. Ask for missing search criteria when necessary.`
const PREFERRED_MODELS = [
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
]

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

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const prompt = typeof request.body?.prompt === 'string' ? request.body.prompt.trim() : ''
  if (!prompt) {
    return response.status(400).json({ error: 'A prompt is required.' })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return response.status(503).json({ error: 'AI is not configured yet. Add GROQ_API_KEY in Vercel project settings.' })
  }

  try {
    const model = await resolveModel(apiKey)
    if (!model) return response.status(502).json({ error: 'No chat model is available for this Groq key.' })

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 500,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
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

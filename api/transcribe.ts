import type { VercelRequest, VercelResponse } from '@vercel/node'

// Speech-to-text for the sake assistant's mic button. Reuses the same
// GROQ_API_KEY already configured for chat — Whisper is on the same account,
// no separate signup or terms-acceptance step required (unlike Groq's TTS
// models, which is why voice *output* uses the browser's own SpeechSynthesis
// instead of a second Groq endpoint).
const PREFERRED_STT_MODELS = ['whisper-large-v3-turbo', 'whisper-large-v3']

const EXTENSION_BY_MIME: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'mp4',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const audioBase64 = typeof request.body?.audio === 'string' ? request.body.audio : ''
  if (!audioBase64) {
    return response.status(400).json({ error: 'Audio is required.' })
  }

  const mimeType = typeof request.body?.mimeType === 'string' ? request.body.mimeType.split(';')[0].trim() : ''
  const extension = EXTENSION_BY_MIME[mimeType] || 'webm'

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return response.status(503).json({ error: 'Voice input is not configured yet. Add GROQ_API_KEY in Vercel project settings.' })
  }

  let audioBuffer: Buffer
  try {
    audioBuffer = Buffer.from(audioBase64, 'base64')
  } catch {
    return response.status(400).json({ error: 'That audio clip could not be read.' })
  }

  // A real clip is at least a few KB; anything smaller is silence or a
  // mic permission glitch, not worth sending to the provider.
  if (audioBuffer.byteLength < 800) {
    return response.status(400).json({ error: "That clip was too short to hear — hold the mic button and speak." })
  }

  try {
    const form = new FormData()
    form.append('file', new Blob([audioBuffer], { type: mimeType || 'audio/webm' }), `clip.${extension}`)
    form.append('model', process.env.GROQ_STT_MODEL || PREFERRED_STT_MODELS[0])
    form.append('response_format', 'json')

    const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    })

    const data = await groqResponse.json()
    if (!groqResponse.ok) {
      return response.status(502).json({ error: data?.error?.message || 'The transcription provider returned an error.' })
    }

    const text = typeof data.text === 'string' ? data.text.trim() : ''
    return response.status(200).json({ text })
  } catch {
    return response.status(502).json({ error: 'Unable to reach the transcription provider.' })
  }
}

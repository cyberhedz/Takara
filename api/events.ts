import type { VercelRequest, VercelResponse } from '@vercel/node'

// Forwards guest activity (journal notes, check-ins) to the guest memory
// service in ~/hackathon/memory, which stores it in Cognee. MEMORY_URL points
// at that service, e.g. http://localhost:8000 when running `vercel dev`.
const EVENT_TYPES = new Set(['journal', 'checkin', 'chat'])

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const memberId = typeof request.body?.member_id === 'string' ? request.body.member_id.trim() : ''
  const type = typeof request.body?.type === 'string' ? request.body.type : ''
  if (!memberId || !EVENT_TYPES.has(type)) {
    return response.status(400).json({ error: 'member_id and a known event type are required.' })
  }

  const memoryUrl = process.env.MEMORY_URL
  if (!memoryUrl) {
    return response.status(503).json({ error: 'Guest memory is not configured yet. Set MEMORY_URL.' })
  }

  try {
    const memoryResponse = await fetch(`${memoryUrl.replace(/\/$/, '')}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: memberId, type, source: 'guest_app', data: request.body?.data ?? {} }),
    })
    const data = await memoryResponse.json()
    if (!memoryResponse.ok) {
      return response.status(502).json({ error: data?.detail || 'The memory service returned an error.' })
    }
    return response.status(202).json(data)
  } catch {
    return response.status(502).json({ error: 'Unable to reach the memory service.' })
  }
}

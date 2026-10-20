import { readField, runMemory } from '../../../../lib/memory'

export const runtime = 'nodejs'
export const maxDuration = 65

export async function POST(request) {
  const { value, error } = await readField(request, 'text', 2000)
  if (error) return Response.json({ error }, { status: 400 })
  const { status, body } = await runMemory('remember', value)
  return Response.json(body, { status })
}

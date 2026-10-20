import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

// memory.py sits at the repo root, one level above this app. It only uses the Python standard
// library, so any python3 works; prefer the hackathon venv when it's there. Both can be overridden.
const VENV_PYTHON = path.resolve(process.cwd(), '../../.venv/bin/python')
const PYTHON = process.env.OKAERI_PYTHON || (existsSync(VENV_PYTHON) ? VENV_PYTHON : 'python3')
const SCRIPT = process.env.OKAERI_MEMORY_SCRIPT || path.resolve(process.cwd(), '../memory.py')
const TIMEOUT_MS = 60_000
// Hosted deploys (e.g. Vercel) ship only this app, without memory.py or Python.
const OFFLINE = { status: 503, body: { error: 'Live memory runs on the demo laptop. See the demo video.' } }

// Runs `memory.py <command> <value>`. The value is passed as its own argv entry
// (execFile, no shell), so quotes or `$(...)` in a note are never interpreted.
export function runMemory(command, value) {
  if (!existsSync(SCRIPT)) return Promise.resolve(OFFLINE)
  return new Promise((resolve) => {
    execFile(PYTHON, [SCRIPT, command, value], { timeout: TIMEOUT_MS, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error?.code === 'ENOENT') return resolve(OFFLINE)
      if (error?.killed) return resolve({ status: 504, body: { error: 'Memory took longer than 60 seconds. Try again in a moment.' } })
      if (error) return resolve({ status: 502, body: { error: stderr.trim() || 'Memory command failed.' } })
      resolve({ status: 200, body: { result: stdout.trim() } })
    })
  })
}

export async function readField(request, field, maxLength) {
  const body = await request.json().catch(() => null)
  const value = typeof body?.[field] === 'string' ? body[field].trim() : ''
  if (!value) return { error: `${field} is required.` }
  if (value.length > maxLength) return { error: `${field} must be ${maxLength} characters or fewer.` }
  return { value }
}

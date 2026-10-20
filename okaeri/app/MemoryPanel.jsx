'use client'

import { useState } from 'react'

async function post(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Something went wrong.')
  return data.result
}

// Cognee answers mark sake names with **bold**; render that without pulling in a markdown library.
function Bold({ text }) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))
}

function useAction(url) {
  const [state, setState] = useState({ status: 'idle', result: '', error: '' })
  async function run(payload) {
    setState({ status: 'loading', result: '', error: '' })
    try {
      setState({ status: 'done', result: await post(url, payload), error: '' })
    } catch (error) {
      setState({ status: 'error', result: '', error: error.message })
    }
  }
  return [state, run]
}

export default function MemoryPanel() {
  const [note, setNote] = useState('')
  const [name, setName] = useState('Dana Kim')
  const [saved, remember] = useAction('/api/memory/remember')
  const [recalled, recall] = useAction('/api/memory/recall')

  return (
    <section aria-labelledby="memory" className="memory">
      <h2 id="memory">Palate memory</h2>
      <div className="memory-grid">
        <form
          className="card white"
          onSubmit={(event) => { event.preventDefault(); if (note.trim()) remember({ text: note }) }}
        >
          <label htmlFor="note" className="form-title">Add a tasting note</label>
          <textarea
            id="note"
            rows={4}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. Dana Kim tried Hizo Koshu and loved the caramel finish."
          />
          <button type="submit" disabled={saved.status === 'loading' || !note.trim()}>
            {saved.status === 'loading' ? 'Remembering… (about 20 s)' : 'Remember this'}
          </button>
          <div aria-live="polite">
            {saved.status === 'done' && <p className="result">Saved to memory.</p>}
            {saved.status === 'error' && <p className="error">{saved.error}</p>}
          </div>
        </form>

        <form
          className="card yellow"
          onSubmit={(event) => { event.preventDefault(); if (name.trim()) recall({ name }) }}
        >
          <label htmlFor="name" className="form-title">Guest name</label>
          <input id="name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="off" />
          <button type="submit" className="pink" disabled={recalled.status === 'loading' || !name.trim()}>
            {recalled.status === 'loading' ? 'Remembering…' : 'Okaeri! What should I try next?'}
          </button>
          <div aria-live="polite">
            {recalled.status === 'done' && <p className="result recall"><Bold text={recalled.result} /></p>}
            {recalled.status === 'error' && <p className="error">{recalled.error}</p>}
          </div>
        </form>
      </div>
    </section>
  )
}

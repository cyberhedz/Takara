import MemoryPanel from './MemoryPanel'

const steps = [
  { n: '1', verb: 'Scan', what: 'QR tasting offer', href: 'https://lead.skinnysake.com', tone: 'pink' },
  { n: '2', verb: 'Taste', what: 'Today’s pour', href: 'https://tasting.skinnysake.com', tone: 'yellow' },
  { n: '3', verb: 'Remember', what: 'Sip Notes journal', href: 'https://note.skinnysake.com/journal/new', tone: 'white' },
]

const comingNext = ['Wine', 'Spirits', 'Beer', 'Producer dashboard', 'Distributor view']

export default function Home() {
  return (
    <main className="page">
      <header className="hero">
        <p className="chip">おかえり = welcome back</p>
        <h1>OKAERI</h1>
        <p className="lede">A palate memory for drinks. Guests remember what they tasted; producers recognize them when they come back.</p>
      </header>

      <section aria-labelledby="pilot">
        <h2 id="pilot">Live pilot: Takara Sake, Berkeley</h2>
        <ol className="steps">
          {steps.map((step) => (
            <li key={step.n}>
              <a className={`card ${step.tone}`} href={step.href} target="_blank" rel="noreferrer">
                <span className="step-number">{step.n}</span>
                <span className="step-verb">{step.verb}</span>
                <span className="step-what">{step.what} ↗</span>
              </a>
            </li>
          ))}
        </ol>
      </section>

      <MemoryPanel />

      <section aria-labelledby="next">
        <h2 id="next">Coming next</h2>
        <ul className="tiles">
          {comingNext.map((tile) => (
            <li key={tile} className="tile" aria-disabled="true">{tile}</li>
          ))}
        </ul>
        <p className="caption">Today’s demo shows the Takara sake flow. The same palate memory extends to these.</p>
      </section>
    </main>
  )
}

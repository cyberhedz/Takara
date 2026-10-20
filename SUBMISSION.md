# OKAERI: a palate memory for drinks

**SF Startup Challenge · Track 2: Autonomous GTM Team · Band Desktop + Cognee**

おかえり (*okaeri*) means "welcome back". OKAERI remembers every tasting-room guest, so the next visit, and the follow-up email, builds on the last one.

**Live pilot:** Takara Sake, Berkeley. Wine, spirits, beer, and producer and distributor views are the vision, not today's build.

## The problem

Tasting rooms meet dozens of curious guests every weekend. What each guest loved, asked about and planned (a gift, a team offsite, shipping to another state) is lost when they walk out, so follow-up is generic or never happens. The tasting-room manager has no time to keep notes, and no CRM fits a tasting bar.

**User:** the tasting-room manager. **Buyer:** sake houses, wineries and breweries with a tasting room. **Business model (planned):** credits per qualified lead.

## The agent team

All agents work in one Band room, from one plan and one board.

| Agent | Harness | Job | Hands off to |
|---|---|---|---|
| Architect | Claude Code | Writes the plan and architecture in the room, keeps the board current, reviews work, routes decisions to the manager | Qualifier, manager |
| Qualifier | Plain Python + Groq (OpenAI fallback), a generic Band runtime | Recalls the guest from Cognee, classifies the lead (private event, wholesale, club sign-up, casual), scores it, writes its decision back to Cognee | Follow-up agent (by @mention) |
| Follow-up | Planned | Drafts the personal email and a sake pick | Manager |
| Manager | Human, in Band Desktop | Answers decisions and approves anything sent | — |

**Handoffs are agent to agent.** A guest check-in makes the memory service post an alert in the room that @mentions the Qualifier. The Qualifier replies in the room with its call and @mentions the next agent. Nobody copies text between agents.

**Human in the loop.** Decisions go to the manager through Band (`band ask`), not hard-coded. Example from the build: which model the Qualifier uses while no Groq key is available.

## How Cognee is used

Cognee is the working memory, written and read during the work, not a document dump.

- **Writes:** tasting-journal notes from the Takara app, member check-ins, free-text tasting notes from the OKAERI page, and the Qualifier's own lead decisions.
- **Reads that change behavior:**
  - On check-in, the room is told what we know about a returning guest (versus "new guest, capture a note").
  - The Qualifier's score and next step come from recalled memory (for example TK-004821: *private_event, 90/100: arrange the 12-person December offsite*).
  - "Okaeri! What should I try next?" recommends a pour the guest *hasn't* tried, based on what they liked.
- **Across agents and restarts:** the guest app writes and a different agent (the Qualifier) reads. The memory service was restarted several times during the build and recall still returned every earlier note.
- **Isolation:** one Cognee dataset per member, so recall never mixes guests up.

## Flexprice and Snyk

Not integrated yet. Planned: a Snyk security-reviewer agent in the room that blocks a work item until it's fixed and stores repeat issues in Cognee, and Flexprice credits per qualified lead.

## What runs

| Piece | Where | Port |
|---|---|---|
| OKAERI home (Next.js) | `okaeri/` | 3000 |
| Takara tasting app (Vite + Vercel functions) | repo root | 3001 (`vercel dev`) |
| Memory service (FastAPI + Cognee) | `memory/server.py` | 8000 |
| Memory CLI | `memory.py` (`remember "<text>"`, `recall "<name>"`) | — |
| Qualifier agent | `agents/qualifier.py` | — |
| Room plan and architecture | `plan.md`, `architecture.json` | — |

### Run locally

```sh
pip install -r memory/requirements.txt          # Cognee, FastAPI, uvicorn
uvicorn server:app --app-dir memory --port 8000 # needs LLM_API_KEY (OpenAI) in memory/.env
cd okaeri && npm install && npm run dev          # http://localhost:3000
python agents/qualifier.py --room <band-chat-id> # in its own terminal; see the file header for Band setup
```

## Demo video script (2–3 min)

1. **Band room (0:00–0:30):** show the room with the Architect (Claude Code) and the Qualifier (Python), the plan and architecture diagram, and the work board with items moving to Done.
2. **Cognee recall (0:30–1:15):** on the OKAERI page, click "Okaeri! What should I try next?" for Dana Kim; it recalls her notes and suggests an untried pour. Add a note, wait for "Saved to memory", and recall again to show it changed.
3. **Check-in handoff (1:15–2:00):** check in member TK-004821 in the Takara app; the alert lands in the Band room; the Qualifier replies with its score and next step and writes it back to memory.
4. **Human decision and cost (2:00–2:45):** show the manager answering the decision in Band, then Band Desktop's per-agent sessions, tokens and estimated cost.

## Built with

Band Desktop and the jam CLI · Cognee Open Source · Next.js 16 · React 19 · Vite · FastAPI · Groq / OpenAI · Figma (design system and pitch deck)

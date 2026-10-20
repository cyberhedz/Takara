# OKAERI plan: SF Startup Challenge (Track 2, Autonomous GTM Team)

**Goal:** a tasting room that remembers every guest. Guests leave notes and check in; agents in this Band room recall the guest from Cognee, qualify the lead and hand it on; the manager approves anything that leaves the building.

**Live pilot:** Takara Sake, Berkeley. Wine, spirits, beer, producer and distributor views are the vision, not today's build.

## Architecture

```arch
{
  "kind": "layered",
  "title": "OKAERI: Takara tasting-room lead pipeline",
  "layers": [
    { "id": "guest", "title": "Guest surfaces", "items": [
      { "id": "okaeri_home", "label": "OKAERI home (Next.js :3000)", "detail": "Guest journey, Add a tasting note, Okaeri! recall" },
      { "id": "tasting_app", "label": "Takara tasting app (:3001)", "detail": "Journal save, member check-in, sake assistant" }
    ] },
    { "id": "memory_layer", "title": "Memory", "items": [
      { "id": "memory_cli", "label": "memory.py remember / recall" },
      { "id": "memory_service", "label": "Memory service (FastAPI :8000)", "detail": "/events, /guests/{id}/recall, /notes, /notes/recall" },
      { "id": "cognee", "label": "Cognee knowledge graph", "detail": "One dataset per member plus okaeri_notes" }
    ] },
    { "id": "band_room", "title": "Band room", "items": [
      { "id": "architect", "label": "Architect (Claude Code)", "detail": "Plan, board, review, routing" },
      { "id": "qualifier", "label": "Qualifier (Python + Groq/OpenAI)", "detail": "Recall, score lead, write decision back to Cognee" },
      { "id": "follow_up", "label": "Follow-up agent (next)", "detail": "Drafts email and sake pick" },
      { "id": "manager", "label": "Tasting-room manager (human)", "detail": "Approves decisions and sends in Band" }
    ] }
  ],
  "flows": [
    { "from": "okaeri_home", "to": "memory_cli", "label": "execFile, 60 s timeout" },
    { "from": "memory_cli", "to": "memory_service", "label": "HTTP" },
    { "from": "tasting_app", "to": "memory_service", "label": "/api/events" },
    { "from": "memory_service", "to": "cognee", "label": "add, cognify, search" },
    { "from": "memory_service", "to": "qualifier", "label": "check-in alert in Band" },
    { "from": "qualifier", "to": "cognee", "label": "recall + write back" },
    { "from": "qualifier", "to": "follow_up", "label": "@mention handoff" },
    { "from": "follow_up", "to": "manager", "label": "approval in Band" }
  ]
}
```

## Work items

1. Guest memory service on Cognee (done)
2. Journal notes from the tasting app saved to memory (done)
3. Member check-in recalls the guest and alerts this room (done)
4. Qualifier agent joins the room as a second harness (done; needs an LLM key to score)
5. OKAERI home page with remember and recall (done)
6. Design system and pitch deck (done)
7. Qualifier live run: check-in → recall → score → write back (in progress)
8. Follow-up agent drafts the email; manager approves in Band (next)
9. Bonus: Snyk security reviewer, Flexprice credits per qualified lead (next)

## Decisions for the manager

- Qualifier model while no Groq key is available (asked in this room).

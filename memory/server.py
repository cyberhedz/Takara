"""Guest memory service: a thin HTTP layer over Cognee for the Takara app and agents.

Run (from the repo root, with LLM_API_KEY in memory/.env or MEMORY_ENV_FILE):
    pip install -r memory/requirements.txt
    uvicorn server:app --app-dir memory --port 8000

POST /events                      save a guest event (journal note, check-in, staff note)
GET  /guests/{member_id}/recall   ask Cognee what we know about this guest
GET  /guests/{member_id}/events   raw event log for this guest (for the UI and agents)

Each guest gets their own Cognee dataset, so recall never mixes guests up.
Events are added immediately; cognify (graph building, ~10-20 s) runs in the background.

A check-in also recalls what we know about the guest, returns it to the app, and, when
BAND_SESSION and BAND_CHAT_ID are set, posts it to the Band room (to BAND_NOTIFY_HANDLE).
"""
import asyncio
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

from dotenv import load_dotenv

load_dotenv(os.environ.get("MEMORY_ENV_FILE") or Path(__file__).resolve().parent / ".env")

import cognee  # noqa: E402  (must load after .env)
from cognee import SearchType  # noqa: E402
from fastapi import BackgroundTasks, FastAPI, HTTPException  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402

EVENT_LOG = Path(__file__).resolve().parent / "events.jsonl"
MEMBER_ID = re.compile(r"^[A-Za-z0-9-]{1,40}$")

app = FastAPI(title="Takara guest memory")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Cognee's local stores don't like concurrent pipeline runs; serialise writes.
cognify_lock = asyncio.Lock()


class Event(BaseModel):
    member_id: str
    type: Literal["journal", "checkin", "staff_note", "chat"]
    source: str = "guest_app"
    data: dict[str, Any] = Field(default_factory=dict)


def dataset_for(member_id: str) -> str:
    if not MEMBER_ID.match(member_id):
        raise HTTPException(400, "member_id must be letters, digits and dashes.")
    return "guest_" + member_id.replace("-", "_")


def describe(event: Event, when: str) -> str:
    """Turn an event into a plain sentence; Cognee extracts a better graph from prose than JSON."""
    d = event.data
    who = f"Sake Club member {event.member_id}" + (f" ({d['guest_name']})" if d.get("guest_name") else "")
    if event.type == "journal":
        sake = d.get("sake", "a sake")
        style = f" ({d['classification']})" if d.get("classification") else ""
        parts = [f"On {when}, {who} rated {sake}{style} {d.get('rating', '?')} out of 5 in their tasting journal."]
        if d.get("flavours"):
            parts.append(f"Flavours they noticed: {', '.join(d['flavours'])}.")
        if d.get("notes"):
            parts.append(f"Their note: \"{d['notes']}\".")
        return " ".join(parts)
    if event.type == "checkin":
        return f"On {when}, {who} checked in at the Takara Sake Tasting Room in Berkeley."
    if event.type == "staff_note":
        return f"On {when}, tasting-room staff wrote about {who}: {d.get('text', '')}"
    if event.type == "chat":
        return f"On {when}, {who} asked the sake assistant: \"{d.get('question', '')}\""
    return f"On {when}, {who}: {json.dumps(d)}"


async def cognify_dataset(dataset: str) -> None:
    async with cognify_lock:
        await cognee.cognify(datasets=[dataset])


async def notify_band(text: str) -> None:
    """Post to the Band room through the jam CLI, so the agents there pick the guest up."""
    session, chat_id = os.environ.get("BAND_SESSION"), os.environ.get("BAND_CHAT_ID")
    if not (session and chat_id):
        return
    handle = os.environ.get("BAND_NOTIFY_HANDLE")
    message = f"@{handle.lstrip('@')} {text}" if handle else text
    process = await asyncio.create_subprocess_exec(
        "band", "--session", session, "send", chat_id, message,
        stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await process.communicate()
    print(f"Band notify: {'sent' if not process.returncode else f'failed ({process.returncode}): {stderr.decode().strip()}'}", flush=True)


@app.post("/events", status_code=202)
async def save_event(event: Event, background: BackgroundTasks) -> dict[str, Any]:
    dataset = dataset_for(event.member_id)
    now = datetime.now(timezone.utc)
    text = describe(event, now.strftime("%A %d %B %Y"))

    record = {"at": now.isoformat(), **event.model_dump(), "text": text}
    with EVENT_LOG.open("a") as log:
        log.write(json.dumps(record) + "\n")

    # Recall before adding the check-in itself, so the answer is about past visits.
    memory = await recall(event.member_id) if event.type == "checkin" else None

    async with cognify_lock:
        await cognee.add(text, dataset_name=dataset)

    if memory is None:
        background.add_task(cognify_dataset, dataset)
        return {"saved": True, "text": text}
    if memory["known"]:
        alert = f"Returning guest {event.member_id} just checked in. What we know:\n{memory['answer']}"
    else:
        alert = f"New guest {event.member_id} just checked in. No history yet; please capture a quick note."
    # Background tasks run in order: alert the room first, then spend ~20 s cognifying.
    background.add_task(notify_band, alert)
    background.add_task(cognify_dataset, dataset)
    return {"saved": True, "text": text, "returning": memory["known"], "recall": memory["answer"]}


@app.get("/guests/{member_id}/recall")
async def recall(member_id: str, q: str = "What does this guest like, and what should we follow up with them about?") -> dict[str, Any]:
    dataset = dataset_for(member_id)
    try:
        results = await cognee.search(query_type=SearchType.GRAPH_COMPLETION, query_text=q, datasets=[dataset])
    except Exception as error:  # unknown dataset, or nothing cognified yet
        return {"member_id": member_id, "known": False, "answer": "", "detail": type(error).__name__}

    answers = [
        str(item)
        for result in results
        for item in (result.get("search_result") if isinstance(result, dict) else [result]) or []
    ]
    return {"member_id": member_id, "known": bool(answers), "answer": "\n".join(answers)}


@app.get("/guests/{member_id}/events")
def events(member_id: str) -> list[dict[str, Any]]:
    dataset_for(member_id)
    if not EVENT_LOG.exists():
        return []
    with EVENT_LOG.open() as log:
        return [row for row in map(json.loads, log) if row["member_id"] == member_id]

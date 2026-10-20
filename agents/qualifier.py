"""Qualifier agent: a Groq-powered Band peer that scores tasting-room leads.

It runs outside Claude Code (plain Python + Groq), joins the Band room as
cyberhedzmedia/qualifier-groq, and answers any message that mentions a member ID:

  1. recalls the guest from the memory service (Cognee),
  2. asks Groq to classify the lead (private event, wholesale, club signup, casual)
     and pick a next step,
  3. replies in the room, @mentioning the Follow-up agent when one is set,
  4. writes the qualification back to memory, so later agents and visits see it.

Run (from the repo root, memory service on :8000), in its own terminal, not inside Claude Code:
    python agents/qualifier.py --room <band-chat-id>
Needs GROQ_API_KEY in memory/.env, MEMORY_ENV_FILE, or the environment.

One-time Band setup:
    band onboard --name qualifier-groq --session qualifier-groq --host generic
Then, while the agent is running, a room member invites its live session (from `band --session
qualifier-groq sessions`); attaching alone binds it locally but doesn't add it to the room:
    band --session <member-scope> invite --session-id qualifier-groq-<pid> --room <band-chat-id> --force
"""
import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import httpx
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(os.environ.get("MEMORY_ENV_FILE") or Path(__file__).resolve().parent.parent / "memory" / ".env")

SESSION = "qualifier-groq"
MEMBER_ID = re.compile(r"\bTK-\d{3,}\b")
MEMORY_URL = os.environ.get("MEMORY_URL", "http://localhost:8000").rstrip("/")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

SYSTEM_PROMPT = """You are the Qualifier on a sake tasting room's lead team. You get what we remember
about one guest and decide what kind of lead they are and what should happen next.

Segments:
- private_event: wants a private tasting, team offsite, party or group booking
- wholesale: restaurant, bar, retailer or distributor buying for resale
- club_signup: keen repeat taster who would value the Sake Club or a shipment
- casual: enjoyed the visit, no clear buying intent yet

Reply with JSON only:
{"segment": one of the four, "score": 0-100 likelihood of revenue in the next 60 days,
 "next_step": one short instruction for the Follow-up agent,
 "reason": one sentence citing the specific memory that drove the call}
Only use facts in the memory you were given."""


def band(*args: str) -> subprocess.CompletedProcess:
    # Strip the Claude Code session variables so Band treats this as its own runtime.
    env = {k: v for k, v in os.environ.items() if not k.startswith(("CLAUDE", "JAM_SESSION"))}
    return subprocess.run(["band", "--session", SESSION, *args], capture_output=True, text=True, env=env)


def recall(member_id: str) -> str:
    response = httpx.get(f"{MEMORY_URL}/guests/{member_id}/recall", timeout=60)
    response.raise_for_status()
    data = response.json()
    return data["answer"] if data["known"] else ""


def qualify(groq: OpenAI, member_id: str, memory: str) -> dict:
    completion = groq.chat.completions.create(
        model=GROQ_MODEL,
        temperature=0.2,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Guest {member_id}. What we remember:\n{memory}"},
        ],
    )
    return json.loads(completion.choices[0].message.content)


def remember(member_id: str, result: dict) -> None:
    text = (
        f"Qualifier agent scored this guest as a {result['segment']} lead ({result['score']}/100). "
        f"Next step: {result['next_step']} Reason: {result['reason']}"
    )
    httpx.post(
        f"{MEMORY_URL}/events",
        json={"member_id": member_id, "type": "staff_note", "source": "qualifier-agent", "data": {"text": text}},
        timeout=60,
    ).raise_for_status()


def handle(groq: OpenAI, message: dict, follow_up: str | None) -> str:
    text = message.get("content") or message.get("body") or message.get("text") or ""
    match = MEMBER_ID.search(text)
    if not match:
        return "I score guests by member ID. Mention one (e.g. TK-004821) and I'll qualify the lead."
    member_id = match.group()

    memory = recall(member_id)
    if not memory:
        return f"No memory for {member_id} yet, so I can't qualify them. Ask staff for a quick note first."

    result = qualify(groq, member_id, memory)
    remember(member_id, result)
    handoff = f"@{follow_up.lstrip('@')} " if follow_up else ""
    return (
        f"{handoff}{member_id}: **{result['segment'].replace('_', ' ')}** lead, score {result['score']}/100.\n"
        f"Next step: {result['next_step']}\nWhy: {result['reason']}"
    )


def pending_messages() -> list[dict]:
    brief = band("brief", "--json")
    if brief.returncode:
        print(f"brief failed: {brief.stderr.strip()}", file=sys.stderr)
        return []
    return json.loads(brief.stdout)["messages"]["items"]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--room", required=True, help="Band chat ID to work in")
    parser.add_argument("--follow-up", help="handle of the Follow-up agent to hand qualified leads to")
    parser.add_argument("--debug", action="store_true", help="print raw Band messages")
    args = parser.parse_args()

    if not os.environ.get("GROQ_API_KEY"):
        sys.exit("Set GROQ_API_KEY first (see docstring).")
    groq = OpenAI(api_key=os.environ["GROQ_API_KEY"], base_url="https://api.groq.com/openai/v1")

    attach = band("attach", "--host", "generic", "--host-session", f"{SESSION}-{os.getpid()}",
                  "--host-pid", str(os.getpid()), "--room", args.room)
    if attach.returncode:
        sys.exit(f"Could not join room {args.room}: {attach.stderr.strip() or attach.stdout.strip()}")
    print(f"Qualifier online in room {args.room} (Groq model {GROQ_MODEL}).")

    while True:
        band("inbox", "--wait", "--room", args.room, "--timeout", "60")
        for message in pending_messages():
            if args.debug:
                print(json.dumps(message, indent=2))
            message_id = message.get("id") or message.get("message_id")
            try:
                reply = handle(groq, message, args.follow_up)
            except Exception as error:  # keep the agent alive; tell the room what broke
                reply = f"I couldn't qualify that one ({type(error).__name__}: {error})."
            sent = band("reply", message_id, reply)
            print(f"replied to {message_id}: {'ok' if not sent.returncode else sent.stderr.strip()}")


if __name__ == "__main__":
    main()

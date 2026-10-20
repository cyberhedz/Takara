"""OKAERI memory CLI: a thin client for the guest memory service (memory/server.py).

    python3 memory.py remember "Dana Kim loved N-end's umami"
    python3 memory.py recall "Dana Kim"

Talks to the running service over HTTP (MEMORY_URL, default http://localhost:8000) instead of
opening Cognee directly, so only one process ever touches Cognee's local stores.
Prints the result to stdout; exits non-zero with a message on stderr if anything fails.
"""
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

MEMORY_URL = os.environ.get("MEMORY_URL", "http://localhost:8000").rstrip("/")
TIMEOUT_SECONDS = 55  # the web app kills us at 60


def call(method: str, path: str, body: dict | None = None) -> dict:
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(f"{MEMORY_URL}{path}", data=data, method=method,
                                     headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
        return json.load(response)


def main() -> None:
    if len(sys.argv) != 3 or sys.argv[1] not in ("remember", "recall") or not sys.argv[2].strip():
        sys.exit('usage: memory.py remember "<text>" | recall "<name>"')
    command, value = sys.argv[1], sys.argv[2].strip()
    try:
        if command == "remember":
            print(call("POST", "/notes", {"text": value})["text"])
        else:
            result = call("GET", "/notes/recall?" + urllib.parse.urlencode({"name": value}))
            print(result["answer"] if result["known"] else f"No memory of {value} yet.")
    except urllib.error.URLError as error:
        sys.exit(f"Memory service unreachable at {MEMORY_URL} ({error.reason}). Is it running?")
    except TimeoutError:
        sys.exit("Memory service took too long. Cognee may still be processing; try again.")


if __name__ == "__main__":
    main()

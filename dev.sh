#!/usr/bin/env bash
# Simple dev helper: start backend (FastAPI) and frontend (React) together.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  echo "Shutting down dev stack..."
  [[ -n "${BACK_PID-}" ]] && kill "$BACK_PID" 2>/dev/null || true
  [[ -n "${FRONT_PID-}" ]] && kill "$FRONT_PID" 2>/dev/null || true
}

trap cleanup INT TERM EXIT

echo "Starting backend on http://localhost:8000 ..."
(
  cd "$ROOT/backend"
  export PYTHONPATH="$ROOT/backend:${PYTHONPATH-}"
  uvicorn main:app --host 0.0.0.0 --port 8000
) &
BACK_PID=$!

echo "Starting frontend on http://localhost:3000 ..."
(
  cd "$ROOT/frontend"
  export HOST=0.0.0.0
  export PORT=3000
  npm start
) &
FRONT_PID=$!

echo "Dev stack running. Press Ctrl+C to stop."

# If either process exits, stop the other.
wait -n
cleanup
wait

#!/bin/bash
# Arranca o CineSpot. Mata o que estiver na porta, arranca o servidor e abre o browser.
set -e

PORT=3003
ROOT="$(cd "$(dirname "$0")" && pwd)"

# matar o que estiver a ocupar a porta
pids=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t 2>/dev/null || true)
if [ -n "$pids" ]; then
  echo "Porta $PORT ocupada, a matar: $pids"
  kill -9 $pids 2>/dev/null || true
  sleep 0.5
fi

echo "A arrancar o CineSpot em http://localhost:$PORT"

(
  cd "$ROOT"
  exec env PORT="$PORT" npm start
) &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

(sleep 3 && open "http://localhost:$PORT") &

wait

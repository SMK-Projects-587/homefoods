#!/usr/bin/env bash
# One-command bootstrap for a fresh machine. Idempotent: safe to re-run.
# See SETUP.md for prerequisites and the manual steps this cannot do
# (filling .env secrets, creating staff users).
set -euo pipefail

cd "$(dirname "$0")/.."

fail() { echo "ERROR: $1" >&2; exit 1; }

# --- prerequisites -----------------------------------------------------------
command -v docker >/dev/null || fail "Docker is not installed (https://docs.docker.com/engine/install/)"
docker info >/dev/null 2>&1 || fail "Docker daemon is not running (or user lacks permission — add yourself to the 'docker' group)"
command -v node >/dev/null || fail "Node.js is not installed (need >= 20; .nvmrc pins 22)"

node_major=$(node -p 'process.versions.node.split(".")[0]')
[ "$node_major" -ge 20 ] || fail "Node.js >= 20 required, found $(node --version)"

# --- dependencies (pinned supabase CLI + wrangler via package-lock) ----------
echo "==> Installing pinned dependencies (supabase CLI, wrangler)"
npm ci

# --- env files ---------------------------------------------------------------
if [ ! -f .env ]; then
  cp .env.example .env
  echo "==> Created .env from .env.example — fill in the real values (R2 credentials etc.)"
fi

bash scripts/sync-function-env.sh

# --- local stack -------------------------------------------------------------
# First start on a fresh Docker volume applies every migration + seed.sql,
# so a new machine converges on the exact same schema/data as this repo.
echo "==> Starting local Supabase stack (first run downloads Docker images)"
npx supabase start

echo
echo "==> Done. Local stack info (URLs + keys):"
npx supabase status

cat <<'EOF'

Next steps (see SETUP.md):
  - Fill real secrets into .env, then re-run: npm run functions:env
  - Create a staff user (signups are disabled) — SETUP.md "Staff users"
  - Replay schema+seed anytime:  npm run db:reset
  - Serve the edge function:     npm run functions:serve
EOF

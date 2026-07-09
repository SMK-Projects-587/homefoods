# Setting up on a new machine

Everything that defines this backend is in git: `supabase/config.toml` (stack
config), `supabase/migrations/` (schema), `supabase/seed.sql` (dev data), the
`r2-presign` edge function, and the **pinned** tool versions in
`package.json`/`package-lock.json` (supabase CLI 2.109.0, wrangler 4.107.0,
Node 22 via `.nvmrc`). There is no docker-compose to maintain — the Supabase
CLI *is* the compose layer: `supabase start` assembles the exact same Docker
stack (Postgres 17, PostgREST, GoTrue, Studio, edge runtime, …) from
`config.toml` on any machine.

The only thing git cannot carry is **secrets** (`.env`) and **runtime state**
(auth users, data beyond the seed). See the checklist at the bottom.

## Prerequisites

1. **Docker Engine** — https://docs.docker.com/engine/install/ (on Linux, add
   your user to the `docker` group and re-login).
2. **Node.js 22** — `nvm install` picks it up from `.nvmrc`
   (any Node ≥ 20 works; 22 is what we develop on).
3. **git** and this repository cloned.

## Bootstrap (one command)

```bash
npm run setup        # = bash scripts/setup.sh
```

This is idempotent and does, in order:

1. Verifies Docker is running and Node ≥ 20.
2. `npm ci` — installs the **pinned** supabase CLI and wrangler from the
   lockfile (never use a global/`npx`-latest CLI; version drift between
   machines is exactly what this setup prevents).
3. Creates `.env` from `.env.example` if missing (you fill in real values).
4. Writes `supabase/functions/.env` from the `R2_*` lines of `.env`
   (auto-loaded by `supabase functions serve`).
5. `supabase start` — first start on a fresh machine downloads the images and
   applies **all migrations + seed.sql**, so you end up with the identical
   schema and dev data.
6. Prints `supabase status` (local URLs and API keys).

After editing secrets in `.env`, re-run `npm run functions:env`.

## Day-to-day commands

| Command | Does |
|---|---|
| `npm run db:start` / `db:stop` | start/stop the local stack (config.toml changes need stop+start) |
| `npm run db:status` | local URLs + anon/service keys |
| `npm run db:reset` | wipe + replay all migrations + seed.sql (the "make it exactly like the repo" button) |
| `npm run functions:serve` | serve `r2-presign` locally with hot reload |
| `npm run functions:env` | re-sync `R2_*` from `.env` to `supabase/functions/.env` |
| `npm run types` | regenerate `types/database.types.ts` from the local DB |

Local ports (from `config.toml`): API **54321**, Postgres **54322**, Studio
**54323**, Mailpit **54324**, analytics **54327**. All bound to localhost.

## Staff users (signups are disabled by design)

Local stack — create via the admin API using the `service_role` key from
`npm run db:status`:

```bash
curl -X POST "http://127.0.0.1:54321/auth/v1/admin/users" \
  -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"staff@example.com","password":"...","email_confirm":true}'
```

Hosted — Dashboard → Authentication → Users → *Add user*.

## Hosted project (unchanged from README)

```bash
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push                  # apply migrations to hosted DB
npx supabase secrets set R2_...=...   # function secrets on hosted
```

Migrations are append-only once pushed — fix mistakes with a new migration.

## New-machine checklist (what to carry over manually)

- [ ] `.env` values — from your password manager / the old machine. Never
      committed; `.env.example` lists every key.
- [ ] `npx supabase login` again if you work against the hosted project
      (auth token is per-machine), then `link --project-ref`.
- [ ] Staff users on the **local** stack — local auth users live in the local
      DB volume; recreate with the curl above (seed.sql does not create users).
- [ ] Cloudflare R2 buckets (`homefoods-images`, `homefoods-invoices`) live in
      the Cloudflare account, not on any machine — nothing to migrate.
- [ ] Hosted dashboard toggles (signups OFF, anonymous OFF) — account-level,
      one-time; see README "Auth" section.

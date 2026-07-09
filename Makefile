# HomeFoods local development automation.
# `make help` lists everything. Requires: docker, node/npx, jq, curl.

SHELL := /bin/bash
.DEFAULT_GOAL := help

# Local-only staff login used for development and smoke tests. Override:
#   make staff-user STAFF_EMAIL=me@x.com STAFF_PASSWORD=secret
STAFF_EMAIL    ?= staff@homefoods.test
STAFF_PASSWORD ?= local-dev-password-1

EDGE_CONTAINER := supabase_edge_runtime_homefoods-new
API            := http://127.0.0.1:54321
FUNCTIONS_ENV  := supabase/functions/.env

# Lazily expanded so targets that don't need keys don't pay the status call.
ANON    = $$(npx supabase status -o json 2>/dev/null | jq -r '.ANON_KEY')
SERVICE = $$(npx supabase status -o json 2>/dev/null | jq -r '.SERVICE_ROLE_KEY')

.PHONY: help up down restart reset status smoke staff-user functions-env types migration

help: ## Show this help
	@grep -E '^[a-z-]+:.*##' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

up: ## Start the local stack, edge runtime, functions env, staff user — the one command
	npx supabase start
	@$(MAKE) --no-print-directory functions-env
	@$(MAKE) --no-print-directory ensure-edge
	@$(MAKE) --no-print-directory staff-user
	@$(MAKE) --no-print-directory smoke

down: ## Stop the local stack
	npx supabase stop

restart: ## Full stop+start (required after config.toml or functions/.env changes)
	@$(MAKE) --no-print-directory down
	@$(MAKE) --no-print-directory up

reset: ## Replay migrations + seed, then recreate the staff user and smoke-test
	npx supabase db reset
	@$(MAKE) --no-print-directory ensure-edge
	@$(MAKE) --no-print-directory staff-user
	@$(MAKE) --no-print-directory smoke

status: ## Stack status + edge runtime container state
	@npx supabase status || true
	@echo
	@if [ -n "$$(docker ps -q -f name=$(EDGE_CONTAINER))" ]; then \
	  echo "edge runtime: RUNNING"; \
	else \
	  echo "edge runtime: NOT RUNNING (make up fixes this)"; \
	fi

# `supabase start` sometimes leaves the edge runtime container stopped (e.g.
# when it was created by a separate `functions serve`). Start it if needed.
ensure-edge:
	@if [ -z "$$(docker ps -q -f name=$(EDGE_CONTAINER))" ]; then \
	  echo "starting edge runtime container..."; \
	  docker start $(EDGE_CONTAINER) 2>/dev/null \
	    || echo "WARNING: $(EDGE_CONTAINER) does not exist yet; run 'make restart'"; \
	fi

functions-env: ## Sync R2_* secrets from .env into supabase/functions/.env
	@if [ ! -f .env ]; then \
	  echo "WARNING: no .env file — copy .env.example and fill it in"; \
	elif ! grep -qE '^R2_ACCESS_KEY_ID=..+' .env; then \
	  echo "WARNING: R2_ACCESS_KEY_ID missing/empty in .env — r2-presign will 500"; \
	else \
	  grep -E '^R2_' .env > $(FUNCTIONS_ENV); \
	  echo "$(FUNCTIONS_ENV) synced from .env"; \
	fi

staff-user: ## Create the local staff user (idempotent; db reset wipes users)
	@out=$$(curl -s -X POST "$(API)/auth/v1/admin/users" \
	  -H "apikey: $(SERVICE)" -H "Authorization: Bearer $(SERVICE)" \
	  -H "Content-Type: application/json" \
	  -d '{"email":"$(STAFF_EMAIL)","password":"$(STAFF_PASSWORD)","email_confirm":true}'); \
	if echo "$$out" | jq -e '.id' >/dev/null 2>&1; then \
	  echo "staff user created: $(STAFF_EMAIL)"; \
	elif echo "$$out" | grep -q 'already been registered'; then \
	  echo "staff user exists: $(STAFF_EMAIL)"; \
	else \
	  echo "staff user creation failed: $$out"; exit 1; \
	fi

smoke: ## Quick health check: REST, RLS, search RPC, edge function auth gate
	@anon=$(ANON); fail=0; \
	n=$$(curl -s "$(API)/rest/v1/products?select=id" -H "apikey: $$anon" | jq 'length' 2>/dev/null); \
	echo "anon sees $$n active products (expect 9 on fresh seed)"; \
	[ "$$n" -ge 1 ] 2>/dev/null || fail=1; \
	hit=$$(curl -s -X POST "$(API)/rest/v1/rpc/search_products" -H "apikey: $$anon" \
	  -H "Content-Type: application/json" -d '{"term":"avakya"}' | jq -r '.[0].name' 2>/dev/null); \
	echo "typo search 'avakya' -> $$hit (expect Avakaya Mango Pickle)"; \
	[ "$$hit" = "Avakaya Mango Pickle" ] || fail=1; \
	code=$$(curl -s -o /dev/null -w '%{http_code}' -X POST "$(API)/functions/v1/r2-presign" -d '{}'); \
	echo "r2-presign unauthenticated -> HTTP $$code (expect 401)"; \
	[ "$$code" = "401" ] || fail=1; \
	orders=$$(curl -s "$(API)/rest/v1/orders?select=id" -H "apikey: $$anon" | jq -r '.code' 2>/dev/null); \
	echo "anon on orders -> $$orders (expect 42501)"; \
	[ "$$orders" = "42501" ] || fail=1; \
	if [ $$fail -eq 0 ]; then echo "SMOKE OK"; else echo "SMOKE FAILED"; exit 1; fi

types: ## Regenerate types/database.types.ts from the local schema
	npx supabase gen types typescript --local > types/database.types.ts
	@echo "types/database.types.ts updated"

migration: ## New migration file: make migration name=add_thing
	@test -n "$(name)" || { echo "usage: make migration name=<snake_case_name>"; exit 1; }
	npx supabase migration new $(name)

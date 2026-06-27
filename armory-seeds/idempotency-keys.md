---
title: "Idempotency Keys — Make Every Mutating Endpoint Safe to Retry"
source: starter-kit-seed
date_ingested: 2026-06-26
category: workflow
tags: [api-design, idempotency, backend, retry-safety, data-integrity, distributed-systems]
relevance_score: 5
related_projects: []
status: processed
investigation_status: not-needed
aliases: [idempotency key, retry-safe API, idempotent endpoint, duplicate write prevention]
---

# Idempotency Keys — Make Every Mutating Endpoint Safe to Retry

## TL;DR
Every POST/PUT/DELETE endpoint should accept an `Idempotency-Key` header. The server caches `(key → response)` for ~24h and returns the cached response on retries — the database is never touched twice for the same logical request.

## Key Takeaways
- **Reads are naturally idempotent; writes are not** — you have to design them to be.
- **Mechanism:** the client generates a UUID per logical action and sends it as `Idempotency-Key`. Server checks key store first; if found, returns cached response without executing the handler. If not found, runs handler, stores `(key, response)`, returns response.
- **What this kills:** duplicate records from users double-clicking submit, React 18 strict-mode double-firing effects in development, mobile networks silently retrying on failure, and automated retries after timeouts.
- **Storage:** Redis with a 24h–7d TTL is the typical choice. A dedicated DB table with `(idempotency_key, response_body, created_at)` and a unique index on the key also works.
- **Client pattern:** generate `crypto.randomUUID()` once per logical action (not per render), pass as header on the mutation. Regenerate only when the user intentionally initiates a new action.

## Actionable for your projects
- Add idempotency middleware to your API layer: read `Idempotency-Key` header → cache lookup → run handler or return cached response.
- Prioritize endpoints that create records or move money — those are the highest-cost duplicate targets.
- On the client, generate the key when the user initiates an action (form submit, button click), not on component re-renders.
- Verify the implementation: send the same key twice and confirm your data store has 1 row, not 2.
- Reference: Stripe's API implements this contract exactly — their docs are the canonical example to mirror.

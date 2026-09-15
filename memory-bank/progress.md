# Brasaland Digital Progress

## Current Status

Brasaland Digital is initializing its AI-driven monorepo infrastructure and base application surfaces. The repository now tracks active business context, technical constraints, agent operating rules, dev-agent skills, and first-pass UI entry points for the public website and internal backoffice. Incident CSV analysis now spans a shared Python module, CLI script, FastAPI service, and backoffice upload/export UI.

## Active Constraints

- Brasaland operates across Colombia and Florida with COP/USD financial reporting needs.
- The company needs systems that work in Spanish and English.
- Current operations depend heavily on spreadsheets, PDFs, phone calls, and WhatsApp orders.
- The technology platform starts near-zero, so shared conventions must stay simple, explicit, and easy to verify.
- `.agents/` is reserved for development tool configuration; `/agents` and `/skills` remain reserved for product/runtime code.

## Recent Changes

- Milestone 5 inventory complete on `feature/backend-inventory` (verified against live Supabase): dual DB (TinyDB auth + SQLModel/PostgreSQL), ORM in `models.py`, Pydantic in `schemas.py`, `/inventory` router with computed `current_stock` and outbound HTTP 400, `seed_inventory.py` (6 ingredients / 4 entries / 3 exits; beef net 68 kg). Architecture audit fix: restored top-level `models.py`, moved auth/supplier schemas to `api_schemas.py`, and typed `GET /inventory/orders` with `response_model=List[OrderRead]`.
- Kept root `CONTEXT.md` absent (matching `main`) and placed the full Brasaland company briefing in `CONTEXT-agent-memory.md` on `feature/agent-memory-bank`. Updated `AGENTS.md` and the add-backoffice-view skill to read that file instead.
- AUTH-088: Per-endpoint pytest files under `services/api/tests/` (30 tests, `--cov-fail-under=70` ≈71%); Jest portal auth tests (`npm --prefix uis/portal test`); root `TESTING.md`; fixed access JWTs surviving password change via `token_version`/`tv`.
- Error-handling audit remediation on `feature/error-handling-audit`: stopped logging password-reset JWTs; fail-fast when `SECRET_KEY` is the known default outside development; generic 500 handler; sanitized incident/supplier API errors (no filesystem paths / raw exception text); hardened login/register enumeration messages; portal profile load distinguishes 404 vs failure with Retry; forgot-password surfaces network errors; portal/backoffice/application UIs map failures to safe copy and disable in-flight actions; CLI `analyze.py` and `seed.py` exit non-zero with clear messages; shared validator now rejects invalid statuses and redacts PII in analysis payloads by default.
- Checklist pass round: portal allowlist-only API errors + Retry CTAs + register outer `finally`; backoffice/application loading `finally`, export 3-state, Retry on supplier failures, nullable defaults; backend fixed incident details (no `str(exc)` passthrough), narrow Resend/supplier excepts, TinyDB `OSError` → `503` across auth/users/profiles/suppliers; seed uses scoped I/O/`ValidationError` handling.
- AUTH-01/02/03: TinyDB users/profiles + JWT auth (`services/api/security.py`, `routes/auth.py|users.py|profiles.py`), password reset via Resend (no token logging; provider required outside local/dev), protected supplier + incident routes, and Next.js portal at `uis/portal` (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/account/*`).
- Aligned monorepo to required layout: supplier API at `services/api/{main,models,database,seed}.py` + `routes/suppliers.py`; supplier UI at `uis/application/app/suppliers/`. Added PR evidence screenshots under `docs/screenshots/` (`uv run seed`, Swagger country filter, filtered supplier list).
- Migrated remaining `apps/` UI content into `uis/`: Brasa Points form (`application.html`, `validation.js`) now lives under `uis/website`, root redirect points to `/uis/website/index.html`, and the obsolete `apps/` directory was removed. Docs/READMEs now describe `uis/` + `services/` as the application surfaces.
- Closed Supplier Directory audit gaps: moved supplier API to checklist paths (`services/api/models.py`, `database.py`, `routes/suppliers.py`, `main.py`), enabled `uv run seed`, accepted `/suppliers` with or without trailing slash, and expanded the backoffice table to show currency, `updated_at`, contact email, and notes alongside rate/status controls.
- Milestone 09 Supplier Directory: TinyDB-backed FastAPI CRUD under `/suppliers` (`app/database.py`, `app/models.py`, `app/routers/suppliers.py`, `seed.py`), with country/category filters, rate/status patches, currency-by-country validation, and a backoffice Supplier Directory page (list, filters, create form, inline rate/status updates) for Lucía Fernández.
- Added PR evidence screenshots under `docs/screenshots/` (CLI console for the 100-row CSV and backoffice analysis UI). Fixed backoffice validation crash when `satisfaction_score` was numeric (sample dataset / JSON).
- Aligned incident test data to the required monorepo layout: `scripts/incidents-brasaland.csv` next to `scripts/analyze.py`; API sample endpoint and docs now point at that path. `services/api/` and `uis/backoffice/` remain the backend and upload UI surfaces.
- Incident analysis stack: extracted shared validation/metrics into `shared/incident_analysis/`, wired `scripts/analyze.py` to that module, added FastAPI endpoints in `services/api` (`POST /api/incidents/analyze`, `GET /api/incidents/results/export`), and connected `uis/backoffice` upload/export to the API with a local fallback.
- `uis/website/index.html` and `styles.css`: balanced the public locations grid to alternate Colombia/Florida (Medellin Downtown, Miami, Envigado, Doral) and added a "Menu" section listing signature grilled dishes served identically in both markets.
- `uis/website/index.html` and `styles.css`: added a Medellin, Colombia photo to the hero's Colombia region and replaced five broken Unsplash dish photo URLs (Churrasco, Chorizo, Patacones, Mazorca Asada, Chicharron) with verified, freely licensed Wikimedia Commons images after confirming all image URLs resolve (including under concurrent page load).
- Added a `tests/` suite (38 tests) covering `src/utils/collections.ts`, `search.ts`, `transformations.ts`, and `validations.ts` using Node's built-in test runner via `tsx --test`, plus a `test` npm script.
- `uis/backoffice/index.html`, `styles.css`, and new `app.js`: replaced the Procurement/Training/Executive sidebar links' teaser cards with real data panels (supplier price table, recipe update table, executive weekly snapshot), reusing the existing `.panel`/table styling. Added active-state highlighting and smooth scroll so sidebar navigation gives visible feedback.

## Planned Roadmap

- Establish shared TypeScript business models for locations, currencies, suppliers, sales, customers, HR, and training.
- Replace static UI demo data with service-backed fixtures and typed API contracts.
- Build the central Brasaland API for locations, menus, sales, customers, suppliers, and telemetry.
- Add ingestion adapters for POS data from Colombia and Florida.
- Create operational alerts for no-sales windows, ingredient stockouts, and supplier price changes.
- Expand backoffice modules for procurement, HR, training updates, and executive reporting.
- Add AI assistant capabilities for natural-language executive questions and weekly report generation.

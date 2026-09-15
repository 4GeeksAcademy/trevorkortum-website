# Brasaland Central API

Auth (TinyDB), supplier directory, incident analysis, and ingredient inventory (SQLModel / Supabase PostgreSQL).

## Dual database

| Store | Technology | Owns |
|-------|------------|------|
| Auth / profiles / suppliers | TinyDB (`db.json`) | Users, JWT subjects, supplier directory |
| Inventory | PostgreSQL via SQLModel (`DATABASE_URL`) | Ingredients, entries, exits |

`current_stock` is **never stored** — it is `SUM(entries) - SUM(exits)` at read time.

## Inventory

| Method | Path | Notes |
|--------|------|-------|
| GET | `/inventory/products` | List ingredients + computed `current_stock` |
| POST | `/inventory/products` | Create ingredient |
| GET | `/inventory/products/{id}` | One ingredient + stock |
| POST | `/inventory/orders/inbound` | Delivery (`IngredientEntry`); stores `user_uuid` |
| POST | `/inventory/orders/outbound` | Exit (`IngredientExit`); HTTP 400 if insufficient stock |
| GET | `/inventory/orders` | All entries and exits with ingredient data |

All inventory routes require Bearer JWT (`get_current_user`).

Layout (service root = `services/api/`):

- `database.py` — TinyDB + SQLModel engine + `get_db`
- `models.py` — SQLModel tables (`Ingredient`, `IngredientEntry`, `IngredientExit`)
- `schemas.py` — inventory Pydantic request/response schemas
- `api_schemas.py` — auth/supplier Pydantic schemas
- `routers/inventory.py` — `/inventory` router

## Auth

| Method | Path | Notes |
|--------|------|-------|
| POST | `/users` | Register (+ optional profile) |
| GET/PUT/DELETE | `/users`, `/users/{id}` | Protected; owner or admin |
| GET/PUT | `/profiles/me` | Protected; owner |
| POST | `/auth/login` | JWT |
| GET | `/auth/me` | User + profile |
| POST | `/auth/forgot-password` | Always 200 |
| POST | `/auth/reset-password` | Single-use TinyDB token |
| POST | `/auth/change-password` | Protected |

Copy `.env.example` → `.env` and set a real Supabase `DATABASE_URL` (keep the placeholder until you have credentials).

```bash
uv sync
# or: pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Auth tests: see [TESTING.md](./TESTING.md) (`uv sync --group dev && uv run pytest tests/ -v`).

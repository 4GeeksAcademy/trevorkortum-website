# Brasaland Central API

FastAPI service for Brasaland Digital. Surfaces include incident CSV analysis and the supplier directory used by Procurement.

## Layout

| Path | Role |
|------|------|
| `main.py` | FastAPI app + CORS |
| `models.py` | Supplier Pydantic models |
| `database.py` | TinyDB (`db.json`) |
| `routes/suppliers.py` | Supplier CRUD endpoints |
| `seed.py` | Idempotent supplier seeder (`uv run seed`) |
| `app/` | Incident routers + compatibility imports |

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check |
| `POST` | `/api/incidents/analyze` | Upload a CSV and receive a JSON summary |
| `POST` | `/api/incidents/analyze-sample` | Analyze bundled sample CSV |
| `GET` | `/api/incidents/results/export` | Download latest analysis as CSV |
| `POST` | `/suppliers` | Create a supplier |
| `GET` | `/suppliers` | List suppliers (`country`, `category` filters) |
| `GET` | `/suppliers/{id}` | Get supplier by ID |
| `PATCH` | `/suppliers/{id}/rate` | Update rate and `updated_at` |
| `PATCH` | `/suppliers/{id}/status` | Set `active` or `suspended` |
| `DELETE` | `/suppliers/{id}` | Remove a supplier |

## Setup

```bash
cd services/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# or: uv sync
```

## Seed suppliers

```bash
cd services/api
uv run seed
```

## Run

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
# or from repo root:
npm run dev:api
```

Supplier UI: `npm run dev:application` → http://127.0.0.1:3003/app/suppliers/

API docs: http://127.0.0.1:8000/docs

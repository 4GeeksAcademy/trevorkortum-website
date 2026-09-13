# Brasaland Central API

FastAPI service for Brasaland Digital. Current surface focuses on incident CSV analysis used by Operations and the backoffice.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check |
| `POST` | `/api/incidents/analyze` | Upload a CSV (`multipart/form-data` field `file`) and receive a JSON summary |
| `POST` | `/api/incidents/analyze-sample` | Analyze the bundled `data/raw/incidents-brasaland.csv` sample |
| `GET` | `/api/incidents/results/export` | Download the latest analysis summary as CSV |

Validation and metrics logic is shared with `scripts/analyze.py` via `shared/incident_analysis/`.

## Setup

```bash
cd services/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

From `services/api`:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Or from the repo root (after installing requirements):

```bash
npm run dev:api
```

API docs: http://127.0.0.1:8000/docs

## Example

```bash
curl -X POST http://127.0.0.1:8000/api/incidents/analyze \
  -F "file=@data/raw/incidents-brasaland.csv"

curl -OJ http://127.0.0.1:8000/api/incidents/results/export
```

## Error handling

- `400` for non-CSV uploads, empty files, bad encoding, missing columns, or empty data
- `404` when exporting before any successful analysis

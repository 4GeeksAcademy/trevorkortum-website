# Brasaland Portal (Next.js)

Authenticated app for login, registration, password reset, and account management.

## Run

```bash
# API
cd services/api && cp .env.example .env && uv sync && uvicorn main:app --reload --port 8000

# Portal
cd uis/portal && cp .env.local.example .env.local && npm run dev
# http://127.0.0.1:3004
```

Or from repo root: `npm run dev:portal`

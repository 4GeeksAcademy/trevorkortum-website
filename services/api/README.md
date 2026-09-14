# Brasaland Central API

Auth, supplier directory, and incident analysis.

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

Copy `.env.example` → `.env`. Supplier and incident routes require Bearer JWT.

```bash
uv sync
uvicorn main:app --reload --port 8000
```

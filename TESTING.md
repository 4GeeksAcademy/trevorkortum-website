# TESTING.md — Brasaland AUTH-088

## How to run tests

```bash
# FastAPI auth suite (required)
cd services/api
uv sync --group dev
uv run pytest                 # includes --cov and --cov-fail-under=70
uv run pytest --cov           # same coverage gates via pyproject addopts

# Portal auth helpers (Jest)
cd ../../uis/portal
npm test
```

API fixtures use an isolated TinyDB (`tmp_path`); production `db.json` is never written.

## Test plan (covered cases & rationale)

| Surface | Happy path | Edge case | Failure mode | Rationale |
|---------|------------|-----------|--------------|-----------|
| `POST /users` | Register returns user+profile, no hash | Short password → 422 | Duplicate email → generic 400 | Account creation + anti-enumeration |
| `POST /auth/login` | Access JWT with `type`/`tv`/`role` | Empty password | Wrong pwd / inactive → same 401 | Credential gate without leaking status |
| `GET /auth/me` | User + profile payload | Reset token used as Bearer | Missing / expired access token → 401 | Session identity + token-type safety |
| `POST /auth/forgot-password` | Known email accepted | Unknown email same body | Invalid email schema → 422 | Anti-enumeration |
| `POST /auth/reset-password` | Password updates; login works | Short new password → 422 | Access JWT / garbage token → 400 | Single-use reset lifecycle |
| `POST /auth/change-password` | New password works | Prior JWT invalidated via `tv` | Wrong current password → 400 | Credential change + session revoke |
| `GET/PUT /profiles/me` | Profile update persists | Partial update keeps name | Unauthenticated → 401 | Owner profile business rules |
| `security.py` helpers | hash/verify, mint tokens | Empty/invalid hash | Expired JWT / used reset jti | Pure business logic, no HTTP |
| Portal `api.ts` (Jest) | Token set/get/clear | Allowlisted API details | Unknown 500 / network errors | Safe client-side auth UX |

Assertions target **business outcomes** (credentials, token claims, versioning, anti-enumeration), not OpenAPI/schema serialization internals.

## Edge case / bug caught during testing (AI-assisted)

**Bug:** After `POST /auth/change-password` (and reset), previously issued access JWTs remained valid until natural `exp`.

**Fix:** Persist `token_version` on the user; embed claim `tv` in access tokens; bump version on password change/reset; `get_current_user` rejects mismatched `tv`.

**Regression test:** `test_change_password_edge_invalidates_prior_access_token`.

## Coverage gate

Configured in `services/api/pyproject.toml`:

- Modules: `security`, `routes.auth`, `routes.users`, `routes.profiles`
- Fail under: **70%** (`--cov-fail-under=70`)

## Suite layout (one file per auth endpoint)

| File | Endpoint / scope |
|------|------------------|
| `services/api/tests/conftest.py` | Isolated DB + `TestClient` |
| `services/api/tests/helpers.py` | Shared `login()` helper |
| `services/api/tests/test_login.py` | `POST /auth/login` |
| `services/api/tests/test_me.py` | `GET /auth/me` |
| `services/api/tests/test_register_users.py` | `POST /users` (+ owner get) |
| `services/api/tests/test_forgot_password.py` | `POST /auth/forgot-password` |
| `services/api/tests/test_reset_password.py` | `POST /auth/reset-password` |
| `services/api/tests/test_change_password.py` | `POST /auth/change-password` |
| `services/api/tests/test_profiles_me.py` | `GET/PUT /profiles/me` |
| `services/api/tests/test_security.py` | `security.py` utilities |
| `uis/portal/src/lib/api.auth.test.ts` | Jest: token + `toUserMessage` |

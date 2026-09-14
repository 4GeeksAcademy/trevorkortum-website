"""Brasaland Central API — FastAPI application entrypoint."""

from __future__ import annotations

import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

API_ROOT = Path(__file__).resolve().parent
ROOT = API_ROOT.parents[1]
SHARED = ROOT / "shared"

if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))
if str(SHARED) not in sys.path:
    sys.path.insert(0, str(SHARED))

from routes import auth, profiles, suppliers, users  # noqa: E402
from app.routers import incidents  # noqa: E402

app = FastAPI(
    title="Brasaland Central API",
    description="Auth, supplier directory, and incident analysis for Brasaland Digital.",
    version="0.3.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3002",
        "http://127.0.0.1:3003",
        "http://127.0.0.1:3004",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(profiles.router)
app.include_router(incidents.router)
app.include_router(suppliers.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "brasaland-api"}

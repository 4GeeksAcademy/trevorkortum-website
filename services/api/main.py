"""Brasaland Central API — FastAPI application entrypoint."""

from __future__ import annotations

import logging
import sys
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exception_handlers import (
    http_exception_handler,
    request_validation_exception_handler,
)
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

API_ROOT = Path(__file__).resolve().parent
ROOT = API_ROOT.parents[1]
SHARED = ROOT / "shared"

if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))
if str(SHARED) not in sys.path:
    sys.path.insert(0, str(SHARED))

from routes import auth, profiles, suppliers, users  # noqa: E402
from app.routers import incidents  # noqa: E402

logger = logging.getLogger("brasaland.api")

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


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Preserve FastAPI/Starlette handlers for expected client errors.
    if isinstance(exc, StarletteHTTPException):
        return await http_exception_handler(request, exc)
    if isinstance(exc, RequestValidationError):
        return await request_validation_exception_handler(request, exc)

    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again later."},
    )


@app.get("/health")
def health():
    return {"status": "ok", "service": "brasaland-api"}

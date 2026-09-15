"""TinyDB persistence + SQLModel (Supabase/PostgreSQL) session dependency."""

from __future__ import annotations

import json
import logging
import os
import sys
from pathlib import Path
from typing import Generator

from dotenv import load_dotenv
from sqlmodel import Session, SQLModel, create_engine
from tinydb import TinyDB

load_dotenv()

logger = logging.getLogger("brasaland.db")

DB_PATH = Path(__file__).resolve().parent / "db.json"
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

# Treat template placeholders as unset so local boot still works before Supabase is configured.
_PLACEHOLDER_MARKERS = (
    "<user>",
    "<password>",
    "<host>",
    "<port>",
    "<db>",
    "[YOUR-PASSWORD]",
    "YOUR-PASSWORD",
    "<YOUR-PASSWORD>",
)


def _normalize_database_url(url: str) -> str:
    """Ensure sslmode=require for Supabase/Postgres URLs when omitted."""
    if not url or "sslmode=" in url:
        return url
    sep = "&" if "?" in url else "?"
    return f"{url}{sep}sslmode=require"


def _is_usable_database_url(url: str) -> bool:
    if not url:
        return False
    upper = url.upper()
    if any(marker.upper() in upper for marker in _PLACEHOLDER_MARKERS):
        return False
    return url.startswith("postgresql://") or url.startswith("postgres://")


# SQLModel / PostgreSQL engine for inventory (Supabase). Created only when URL is real.
engine = None
if _is_usable_database_url(DATABASE_URL):
    engine = create_engine(_normalize_database_url(DATABASE_URL), echo=False)


def _open_db() -> TinyDB:
    try:
        return TinyDB(DB_PATH)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        logger.error("Failed to open database at %s: %s", DB_PATH, type(exc).__name__)
        print(
            f"Error: unable to open database ({type(exc).__name__}). "
            "Check db.json permissions and JSON integrity.",
            file=sys.stderr,
        )
        raise SystemExit(1) from exc


db = _open_db()
suppliers_table = db.table("suppliers")
users_table = db.table("users")
profiles_table = db.table("profiles")
reset_tokens_table = db.table("reset_tokens")


def init_inventory_db() -> None:
    """Create inventory tables on the SQLModel engine if configured."""
    if engine is None:
        logger.warning("DATABASE_URL unset; inventory PostgreSQL tables not initialized")
        return
    # Import models so SQLModel metadata is populated.
    from models import Ingredient, IngredientEntry, IngredientExit  # noqa: F401

    SQLModel.metadata.create_all(engine)
    logger.info("Inventory SQLModel tables ensured")


def get_db() -> Generator[Session, None, None]:
    """Yield a per-request SQLModel session. No global session instances."""
    if engine is None:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Inventory database is not configured (set DATABASE_URL).",
        )
    with Session(engine) as session:
        yield session

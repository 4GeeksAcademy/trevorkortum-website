"""TinyDB persistence for Brasaland API."""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path

from tinydb import TinyDB

logger = logging.getLogger("brasaland.db")

DB_PATH = Path(__file__).resolve().parent / "db.json"


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

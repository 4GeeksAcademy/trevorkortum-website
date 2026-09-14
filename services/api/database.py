"""TinyDB persistence for Brasaland API."""

from __future__ import annotations

from pathlib import Path

from tinydb import TinyDB

DB_PATH = Path(__file__).resolve().parent / "db.json"
db = TinyDB(DB_PATH)
suppliers_table = db.table("suppliers")
incidents_table = db.table("incidents")
users_table = db.table("users")
profiles_table = db.table("profiles")
reset_tokens_table = db.table("reset_tokens")

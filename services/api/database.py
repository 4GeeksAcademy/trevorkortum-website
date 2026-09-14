"""TinyDB persistence for the Brasaland supplier directory."""

from __future__ import annotations

from pathlib import Path

from tinydb import TinyDB

DB_PATH = Path(__file__).resolve().parent / "db.json"
db = TinyDB(DB_PATH)
suppliers_table = db.table("suppliers")

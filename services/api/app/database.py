"""Compatibility re-exports for legacy `app.*` imports."""

from database import DB_PATH, db, suppliers_table

__all__ = ["DB_PATH", "db", "suppliers_table"]

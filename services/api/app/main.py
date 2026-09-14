"""Compatibility entrypoint for `uvicorn app.main:app` / `npm run dev:api`."""

from main import app

__all__ = ["app"]

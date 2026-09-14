"""Compatibility shim — prefer `routes.suppliers`."""

from routes.suppliers import router

__all__ = ["router"]

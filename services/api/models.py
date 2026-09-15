"""SQLModel ORM tables for Brasaland ingredient inventory (Supabase / PostgreSQL).

Ingredient maps to README Product; IngredientEntry/Exit map to Inbound/OutboundOrder.
current_stock is never stored — compute as SUM(entries) - SUM(exits).
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Ingredient(SQLModel, table=True):
    """Product / ingredient master data. current_stock is never stored here."""

    __tablename__ = "ingredients"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    sku: str = Field(unique=True, index=True)
    unit: str
    category: str = Field(index=True)
    country: str = Field(index=True, description="CO or US")


class IngredientEntry(SQLModel, table=True):
    """Inbound delivery from a supplier (maps to README InboundOrder)."""

    __tablename__ = "ingredient_entries"

    id: Optional[int] = Field(default=None, primary_key=True)
    ingredient_id: int = Field(foreign_key="ingredients.id", index=True)
    quantity: float
    supplier_name: str
    location_id: int = Field(ge=1, le=14)
    created_at: datetime = Field(default_factory=_utc_now)
    user_uuid: str = Field(index=True)


class IngredientExit(SQLModel, table=True):
    """Outbound consumption or waste (maps to README OutboundOrder)."""

    __tablename__ = "ingredient_exits"

    id: Optional[int] = Field(default=None, primary_key=True)
    ingredient_id: int = Field(foreign_key="ingredients.id", index=True)
    quantity: float
    reason: str = Field(description="consumption or waste")
    location_id: int = Field(ge=1, le=14)
    created_at: datetime = Field(default_factory=_utc_now)
    user_uuid: str = Field(index=True)

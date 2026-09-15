"""Pydantic request/response schemas for the inventory API (not ORM tables)."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Annotated, List, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field


class IngredientCategory(str, Enum):
    meat = "meat"
    produce = "produce"
    sauce = "sauce"
    beverage = "beverage"
    packaging = "packaging"
    cleaning = "cleaning"


class IngredientCountry(str, Enum):
    CO = "CO"
    US = "US"


class ExitReason(str, Enum):
    consumption = "consumption"
    waste = "waste"


class IngredientCreate(BaseModel):
    name: str = Field(..., min_length=1)
    sku: str = Field(..., min_length=1)
    unit: str = Field(..., min_length=1)
    category: IngredientCategory
    country: IngredientCountry


class IngredientRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    sku: str
    unit: str
    category: str
    country: str
    current_stock: float


class InboundOrderCreate(BaseModel):
    ingredient_id: int
    quantity: float = Field(..., gt=0)
    supplier_name: str = Field(..., min_length=1)
    location_id: int = Field(..., ge=1, le=14)


class OutboundOrderCreate(BaseModel):
    ingredient_id: int
    quantity: float = Field(..., gt=0)
    reason: ExitReason
    location_id: int = Field(..., ge=1, le=14)


class IngredientEntryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ingredient_id: int
    quantity: float
    supplier_name: str
    location_id: int
    created_at: datetime
    user_uuid: str
    order_type: Literal["inbound"] = "inbound"
    ingredient: Optional[IngredientRead] = None


class IngredientExitRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ingredient_id: int
    quantity: float
    reason: str
    location_id: int
    created_at: datetime
    user_uuid: str
    order_type: Literal["outbound"] = "outbound"
    ingredient: Optional[IngredientRead] = None


OrderRead = Annotated[
    Union[IngredientEntryRead, IngredientExitRead],
    Field(discriminator="order_type"),
]

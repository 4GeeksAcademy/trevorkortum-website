"""Inventory API — ingredients and inbound/outbound orders under /inventory."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlmodel import Session, select

from database import get_db
from models import Ingredient, IngredientEntry, IngredientExit
from schemas import (
    IngredientCreate,
    IngredientEntryRead,
    IngredientExitRead,
    IngredientRead,
    InboundOrderCreate,
    OrderRead,
    OutboundOrderCreate,
)
from security import get_current_user

router = APIRouter(prefix="/inventory", tags=["inventory"])


def _stock_for(session: Session, ingredient_id: int) -> float:
    inbound = session.exec(
        select(func.coalesce(func.sum(IngredientEntry.quantity), 0.0)).where(
            IngredientEntry.ingredient_id == ingredient_id
        )
    ).one()
    outbound = session.exec(
        select(func.coalesce(func.sum(IngredientExit.quantity), 0.0)).where(
            IngredientExit.ingredient_id == ingredient_id
        )
    ).one()
    return float(inbound) - float(outbound)


def _to_ingredient_read(session: Session, ingredient: Ingredient) -> IngredientRead:
    return IngredientRead(
        id=ingredient.id,
        name=ingredient.name,
        sku=ingredient.sku,
        unit=ingredient.unit,
        category=ingredient.category,
        country=ingredient.country,
        current_stock=_stock_for(session, ingredient.id),
    )


@router.get("/products", response_model=List[IngredientRead])
def list_products(
    session: Session = Depends(get_db),
    _user: dict = Depends(get_current_user),
) -> List[IngredientRead]:
    ingredients = session.exec(select(Ingredient).order_by(Ingredient.id)).all()
    return [_to_ingredient_read(session, item) for item in ingredients]


@router.post("/products", response_model=IngredientRead, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: IngredientCreate,
    session: Session = Depends(get_db),
    _user: dict = Depends(get_current_user),
) -> IngredientRead:
    existing = session.exec(select(Ingredient).where(Ingredient.sku == payload.sku)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ingredient with sku '{payload.sku}' already exists",
        )
    ingredient = Ingredient(
        name=payload.name,
        sku=payload.sku,
        unit=payload.unit,
        category=payload.category.value,
        country=payload.country.value,
    )
    session.add(ingredient)
    session.commit()
    session.refresh(ingredient)
    return _to_ingredient_read(session, ingredient)


@router.get("/products/{product_id}", response_model=IngredientRead)
def get_product(
    product_id: int,
    session: Session = Depends(get_db),
    _user: dict = Depends(get_current_user),
) -> IngredientRead:
    ingredient = session.get(Ingredient, product_id)
    if not ingredient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found")
    return _to_ingredient_read(session, ingredient)


@router.post(
    "/orders/inbound",
    response_model=IngredientEntryRead,
    status_code=status.HTTP_201_CREATED,
)
def create_inbound_order(
    payload: InboundOrderCreate,
    session: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
) -> IngredientEntryRead:
    ingredient = session.get(Ingredient, payload.ingredient_id)
    if not ingredient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found")

    entry = IngredientEntry(
        ingredient_id=payload.ingredient_id,
        quantity=payload.quantity,
        supplier_name=payload.supplier_name,
        location_id=payload.location_id,
        user_uuid=str(user["id"]),
    )
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return IngredientEntryRead(
        id=entry.id,
        ingredient_id=entry.ingredient_id,
        quantity=entry.quantity,
        supplier_name=entry.supplier_name,
        location_id=entry.location_id,
        created_at=entry.created_at,
        user_uuid=entry.user_uuid,
        ingredient=_to_ingredient_read(session, ingredient),
    )


@router.post(
    "/orders/outbound",
    response_model=IngredientExitRead,
    status_code=status.HTTP_201_CREATED,
)
def create_outbound_order(
    payload: OutboundOrderCreate,
    session: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
) -> IngredientExitRead:
    ingredient = session.get(Ingredient, payload.ingredient_id)
    if not ingredient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found")

    available = _stock_for(session, ingredient.id)
    if payload.quantity > available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Insufficient stock for ingredient '{ingredient.name}'. "
                f"Available: {available}, requested: {payload.quantity}."
            ),
        )

    exit_row = IngredientExit(
        ingredient_id=payload.ingredient_id,
        quantity=payload.quantity,
        reason=payload.reason.value,
        location_id=payload.location_id,
        user_uuid=str(user["id"]),
    )
    session.add(exit_row)
    session.commit()
    session.refresh(exit_row)
    return IngredientExitRead(
        id=exit_row.id,
        ingredient_id=exit_row.ingredient_id,
        quantity=exit_row.quantity,
        reason=exit_row.reason,
        location_id=exit_row.location_id,
        created_at=exit_row.created_at,
        user_uuid=exit_row.user_uuid,
        ingredient=_to_ingredient_read(session, ingredient),
    )


@router.get("/orders", response_model=List[OrderRead])
def list_orders(
    session: Session = Depends(get_db),
    _user: dict = Depends(get_current_user),
) -> List[OrderRead]:
    """List all inbound entries and outbound exits with ingredient data."""
    ingredients = {
        item.id: item for item in session.exec(select(Ingredient)).all()
    }
    orders: List[OrderRead] = []

    for entry in session.exec(select(IngredientEntry).order_by(IngredientEntry.id)).all():
        ingredient = ingredients.get(entry.ingredient_id)
        orders.append(
            IngredientEntryRead(
                id=entry.id,
                ingredient_id=entry.ingredient_id,
                quantity=entry.quantity,
                supplier_name=entry.supplier_name,
                location_id=entry.location_id,
                created_at=entry.created_at,
                user_uuid=entry.user_uuid,
                ingredient=_to_ingredient_read(session, ingredient) if ingredient else None,
            )
        )

    for exit_row in session.exec(select(IngredientExit).order_by(IngredientExit.id)).all():
        ingredient = ingredients.get(exit_row.ingredient_id)
        orders.append(
            IngredientExitRead(
                id=exit_row.id,
                ingredient_id=exit_row.ingredient_id,
                quantity=exit_row.quantity,
                reason=exit_row.reason,
                location_id=exit_row.location_id,
                created_at=exit_row.created_at,
                user_uuid=exit_row.user_uuid,
                ingredient=_to_ingredient_read(session, ingredient) if ingredient else None,
            )
        )

    orders.sort(key=lambda row: row.created_at)
    return orders

"""Supplier directory CRUD endpoints."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from database import suppliers_table
from models import RateUpdate, StatusUpdate, Supplier, SupplierCreate
from security import get_current_user

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _doc_to_supplier(doc_id: int, doc: dict) -> Supplier:
    return Supplier(id=doc_id, **doc)


def _get_or_404(supplier_id: int) -> tuple[int, dict]:
    row = suppliers_table.get(doc_id=supplier_id)
    if row is None:
        raise HTTPException(status_code=404, detail=f"Supplier {supplier_id} not found")
    return supplier_id, dict(row)


@router.post("", response_model=Supplier, status_code=201)
@router.post("/", response_model=Supplier, status_code=201, include_in_schema=False)
def create_supplier(
    payload: SupplierCreate,
    _user: dict = Depends(get_current_user),
) -> Supplier:
    data = payload.model_dump(mode="json")
    data["updated_at"] = _now()
    doc_id = suppliers_table.insert(data)
    return _doc_to_supplier(doc_id, data)


@router.get("", response_model=List[Supplier])
@router.get("/", response_model=List[Supplier], include_in_schema=False)
def list_suppliers(
    country: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    _user: dict = Depends(get_current_user),
) -> List[Supplier]:
    results: List[Supplier] = []
    for row in suppliers_table.all():
        doc = dict(row)
        if country and doc.get("country") != country:
            continue
        if category and category not in (doc.get("categories") or []):
            continue
        results.append(_doc_to_supplier(row.doc_id, doc))
    return results


@router.get("/{supplier_id}", response_model=Supplier)
def get_supplier(
    supplier_id: int,
    _user: dict = Depends(get_current_user),
) -> Supplier:
    doc_id, doc = _get_or_404(supplier_id)
    return _doc_to_supplier(doc_id, doc)


@router.patch("/{supplier_id}/rate", response_model=Supplier)
def update_rate(
    supplier_id: int,
    payload: RateUpdate,
    _user: dict = Depends(get_current_user),
) -> Supplier:
    doc_id, doc = _get_or_404(supplier_id)
    doc["rate_per_unit"] = payload.rate_per_unit
    doc["updated_at"] = _now()
    suppliers_table.update(doc, doc_ids=[doc_id])
    return _doc_to_supplier(doc_id, doc)


@router.patch("/{supplier_id}/status", response_model=Supplier)
def update_status(
    supplier_id: int,
    payload: StatusUpdate,
    _user: dict = Depends(get_current_user),
) -> Supplier:
    doc_id, doc = _get_or_404(supplier_id)
    doc["status"] = payload.status.value
    doc["updated_at"] = _now()
    suppliers_table.update(doc, doc_ids=[doc_id])
    return _doc_to_supplier(doc_id, doc)


@router.delete("/{supplier_id}", status_code=204)
def delete_supplier(
    supplier_id: int,
    _user: dict = Depends(get_current_user),
) -> Response:
    _get_or_404(supplier_id)
    suppliers_table.remove(doc_ids=[supplier_id])
    return Response(status_code=204)

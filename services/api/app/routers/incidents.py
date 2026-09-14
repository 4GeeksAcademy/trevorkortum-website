"""Incident analysis + centralized incident manager endpoints."""

from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from fastapi.responses import JSONResponse, Response
from pydantic import ValidationError

from incident_analysis import (
    INCIDENT_BRANCHES,
    INCIDENT_CATEGORIES,
    INCIDENT_ORIGINS,
    INCIDENT_STATUSES,
    analyze_csv_path,
    analyze_csv_text,
    can_transition,
    export_metrics_to_csv_string,
    metrics_to_dict,
)

from app import state
from database import incidents_table
from models import (
    FieldError,
    Incident,
    IncidentCreate,
    IncidentStatusUpdate,
    IncidentSummary,
)
from security import get_current_user

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _doc_to_incident(doc_id: int, doc: dict) -> Incident:
    payload = {k: v for k, v in doc.items() if not k.startswith("_")}
    return Incident(id=doc_id, **payload)


def _get_or_404(incident_id: int) -> tuple[int, dict]:
    row = incidents_table.get(doc_id=incident_id)
    if row is None:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    return incident_id, dict(row)


def _field_error(field: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content=FieldError(field=field, message=message).model_dump(),
    )


def _zero_summary() -> IncidentSummary:
    return IncidentSummary(
        total=0,
        by_status={key: 0 for key in INCIDENT_STATUSES},
        by_category={key: 0 for key in INCIDENT_CATEGORIES},
        by_origin={key: 0 for key in INCIDENT_ORIGINS},
        by_branch={key: 0 for key in INCIDENT_BRANCHES},
    )


# --- Manager CRUD (register static paths before /{id}) ---


@router.get("/summary", response_model=IncidentSummary)
def incidents_summary() -> IncidentSummary:
    rows = list(incidents_table.all())
    if not rows:
        return _zero_summary()

    by_status = Counter(doc.get("status") for doc in rows)
    by_category = Counter(doc.get("category") for doc in rows)
    by_origin = Counter(doc.get("origin") for doc in rows)
    by_branch = Counter(doc.get("branch") for doc in rows)

    summary = _zero_summary()
    summary.total = len(rows)
    for key in INCIDENT_STATUSES:
        summary.by_status[key] = by_status.get(key, 0)
    for key in INCIDENT_CATEGORIES:
        summary.by_category[key] = by_category.get(key, 0)
    for key in INCIDENT_ORIGINS:
        summary.by_origin[key] = by_origin.get(key, 0)
    for key in INCIDENT_BRANCHES:
        summary.by_branch[key] = by_branch.get(key, 0)
    return summary


@router.post("/analyze")
async def analyze_incidents(
    file: UploadFile = File(...),
    _user: dict = Depends(get_current_user),
):
    filename = file.filename or "upload.csv"
    if not filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a .csv")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(
            status_code=400, detail="CSV must be UTF-8 encoded"
        ) from exc

    try:
        metrics = analyze_csv_text(text)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    state.save_latest(metrics, filename)
    return metrics_to_dict(metrics, source_file=filename)


@router.post("/analyze-sample")
def analyze_sample_dataset(_user: dict = Depends(get_current_user)):
    sample_path = (
        Path(__file__).resolve().parents[4] / "scripts" / "incidents-brasaland.csv"
    )
    if not sample_path.exists():
        raise HTTPException(status_code=404, detail=f"Sample file not found: {sample_path}")

    try:
        metrics = analyze_csv_path(str(sample_path))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    filename = sample_path.name
    state.save_latest(metrics, filename)
    return metrics_to_dict(metrics, source_file=filename)


@router.get("/results/export")
def export_latest_results(_user: dict = Depends(get_current_user)):
    metrics, source_file = state.get_latest()
    if metrics is None:
        raise HTTPException(
            status_code=404,
            detail="No analysis results available. POST /api/incidents/analyze first.",
        )

    csv_body = export_metrics_to_csv_string(metrics)
    download_name = "results.csv"
    if source_file:
        stem = source_file.rsplit(".", 1)[0]
        download_name = f"{stem}-results.csv"

    return Response(
        content=csv_body,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{download_name}"'},
    )


@router.post("", response_model=Incident, status_code=201)
@router.post("/", response_model=Incident, status_code=201, include_in_schema=False)
async def create_incident(request: Request):
    try:
        body = await request.json()
    except Exception:
        return _field_error("body", "Request body must be valid JSON")

    try:
        payload = IncidentCreate.model_validate(body)
    except ValidationError as exc:
        err = exc.errors()[0]
        loc = err.get("loc") or ("body",)
        field = str(loc[-1]) if loc else "body"
        message = err.get("msg", "Invalid value")
        return _field_error(field, message)

    now = _now()
    data = payload.model_dump(mode="json")
    data["created_at"] = now
    data["updated_at"] = now
    doc_id = incidents_table.insert(data)
    return _doc_to_incident(doc_id, data)


@router.get("", response_model=List[Incident])
@router.get("/", response_model=List[Incident], include_in_schema=False)
def list_incidents(
    status: Optional[str] = Query(None),
    origin: Optional[str] = Query(None),
    branch: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
) -> List[Incident]:
    results: List[Incident] = []
    for row in incidents_table.all():
        doc = dict(row)
        if status and doc.get("status") != status:
            continue
        if origin and doc.get("origin") != origin:
            continue
        if branch and doc.get("branch") != branch:
            continue
        if category and doc.get("category") != category:
            continue
        results.append(_doc_to_incident(row.doc_id, doc))
    results.sort(key=lambda item: item.created_at, reverse=True)
    return results


@router.get("/{incident_id}", response_model=Incident)
def get_incident(incident_id: int) -> Incident:
    doc_id, doc = _get_or_404(incident_id)
    return _doc_to_incident(doc_id, doc)


@router.patch("/{incident_id}/status", response_model=Incident)
async def update_incident_status(incident_id: int, request: Request):
    doc_id, doc = _get_or_404(incident_id)

    try:
        body = await request.json()
    except Exception:
        return _field_error("body", "Request body must be valid JSON")

    try:
        payload = IncidentStatusUpdate.model_validate(body)
    except ValidationError as exc:
        err = exc.errors()[0]
        loc = err.get("loc") or ("status",)
        field = str(loc[-1]) if loc else "status"
        return _field_error(field, err.get("msg", "Invalid status"))

    current = doc.get("status")
    new_status = payload.status.value
    if current == new_status:
        return _doc_to_incident(doc_id, doc)

    if not can_transition(current, new_status):
        return _field_error(
            "status",
            f"Invalid transition from '{current}' to '{new_status}'",
        )

    doc["status"] = new_status
    doc["updated_at"] = _now()
    incidents_table.update(doc, doc_ids=[doc_id])
    return _doc_to_incident(doc_id, doc)

"""Incident CSV analysis endpoints."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import Response

from incident_analysis import (
    analyze_csv_path,
    analyze_csv_text,
    export_metrics_to_csv_string,
    metrics_to_dict,
)

from app import state

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


@router.post("/analyze")
async def analyze_incidents(file: UploadFile = File(...)):
    """Accept a CSV upload and return a JSON analysis summary."""
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
def analyze_sample_dataset():
    """Analyze the bundled Brasaland sample CSV and return the JSON summary."""
    sample_path = (
        Path(__file__).resolve().parents[4] / "data" / "raw" / "incidents-brasaland.csv"
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
def export_latest_results():
    """Return a downloadable CSV of the latest analysis summary."""
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

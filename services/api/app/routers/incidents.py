"""Incident CSV analysis endpoints."""

from __future__ import annotations

import logging
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response

from incident_analysis import (
    analyze_csv_path,
    analyze_csv_text,
    export_metrics_to_csv_string,
    metrics_to_dict,
)

from app import state
from security import get_current_user

logger = logging.getLogger("brasaland.incidents")

router = APIRouter(prefix="/api/incidents", tags=["incidents"])

MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB


def _client_analysis_error(exc: BaseException) -> HTTPException:
    """Map analysis failures to fixed client details (never forward str(exc))."""
    message = str(exc)
    if message == "CSV file is missing a header row":
        detail = "CSV file is missing a header row"
    elif message == "CSV file contains no data rows":
        detail = "CSV file contains no data rows"
    elif message.startswith("Missing required columns:"):
        detail = "CSV is missing required columns"
    else:
        detail = "Unable to analyze the CSV file"
    return HTTPException(status_code=400, detail=detail)


@router.post("/analyze")
async def analyze_incidents(
    file: UploadFile = File(...),
    _user: dict = Depends(get_current_user),
):
    filename = file.filename or "upload.csv"
    if not filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a .csv")

    try:
        raw = await file.read(MAX_UPLOAD_BYTES + 1)
    except OSError as exc:
        logger.error("Upload read failed: %s", type(exc).__name__)
        raise HTTPException(status_code=400, detail="Unable to read uploaded file") from exc

    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Uploaded file exceeds the 5 MB limit")
    if not raw:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=400, detail="CSV must be UTF-8 encoded") from exc

    try:
        metrics = analyze_csv_text(text)
    except ValueError as exc:
        logger.info("CSV analysis rejected: %s", type(exc).__name__)
        raise _client_analysis_error(exc) from exc

    state.save_latest(metrics, filename)
    return metrics_to_dict(metrics, source_file=filename)


@router.post("/analyze-sample")
def analyze_sample_dataset(_user: dict = Depends(get_current_user)):
    sample_path = (
        Path(__file__).resolve().parents[4] / "scripts" / "incidents-brasaland.csv"
    )
    if not sample_path.exists():
        logger.warning("Sample dataset missing at %s", sample_path)
        raise HTTPException(status_code=404, detail="Sample dataset is not available.")

    try:
        metrics = analyze_csv_path(str(sample_path))
    except FileNotFoundError as exc:
        logger.warning("Sample dataset missing at %s", sample_path)
        raise HTTPException(status_code=404, detail="Sample dataset is not available.") from exc
    except (OSError, UnicodeDecodeError) as exc:
        logger.error("Sample dataset read failed: %s", type(exc).__name__)
        raise HTTPException(status_code=400, detail="Unable to read sample dataset") from exc
    except ValueError as exc:
        logger.info("Sample analysis rejected: %s", type(exc).__name__)
        raise _client_analysis_error(exc) from exc

    filename = sample_path.name
    state.save_latest(metrics, filename)
    return metrics_to_dict(metrics, source_file=filename)


@router.get("/results/export")
def export_latest_results(_user: dict = Depends(get_current_user)):
    metrics, source_file = state.get_latest()
    if metrics is None:
        raise HTTPException(
            status_code=404,
            detail="No analysis results available.",
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

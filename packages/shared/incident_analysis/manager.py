"""Incident manager enums, CSV→model transforms, and status lifecycle rules."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from .core import analyze_csv_path, analyze_csv_text, validate_record

# --- Model enums ---

INCIDENT_CATEGORIES = (
    "equipment_failure",
    "supply_issue",
    "customer_complaint",
    "staff_issue",
    "facility_issue",
    "pos_system",
    "delivery_issue",
    "other",
)

INCIDENT_STATUSES = ("open", "in_progress", "resolved", "discarded")

INCIDENT_ORIGINS = ("customer", "branch", "internal")

INCIDENT_BRANCHES = (
    "central",
    "medellin_centro",
    "medellin_laureles",
    "medellin_envigado",
    "medellin_bello",
    "medellin_itagui",
    "bogota_chapinero",
    "bogota_usaquen",
    "cali_granada",
    "barranquilla_norte",
    "miami_doral",
    "miami_hialeah",
    "miami_kendall",
    "orlando_international",
    "fort_lauderdale",
)

BRANCH_DISPLAY_NAMES: dict[str, str] = {
    "central": "Central (Medellín / Miami)",
    "medellin_centro": "Medellín Centro",
    "medellin_laureles": "Medellín Laureles",
    "medellin_envigado": "Medellín Envigado",
    "medellin_bello": "Medellín Bello",
    "medellin_itagui": "Medellín Itagüí",
    "bogota_chapinero": "Bogotá Chapinero",
    "bogota_usaquen": "Bogotá Usaquén",
    "cali_granada": "Cali Granada",
    "barranquilla_norte": "Barranquilla Norte",
    "miami_doral": "Miami Doral",
    "miami_hialeah": "Miami Hialeah",
    "miami_kendall": "Miami Kendall",
    "orlando_international": "Orlando International Drive",
    "fort_lauderdale": "Fort Lauderdale",
}

STATUS_TRANSITIONS: dict[str, frozenset[str]] = {
    "open": frozenset({"in_progress", "discarded"}),
    "in_progress": frozenset({"resolved", "discarded"}),
    "resolved": frozenset(),
    "discarded": frozenset(),
}

STATUS_MAP = {
    "OPEN": "open",
    "CLOSED": "resolved",
    "DISCARDED": "discarded",
}

CATEGORY_MAP = {
    "CUSTOMER_COMPLAINT": "customer_complaint",
    "EQUIPMENT": "equipment_failure",
    "SUPPLY": "supply_issue",
    "FOOD_QUALITY": "customer_complaint",
    "STAFF": "staff_issue",
}

BRANCH_MAP = {
    "COL-01": "medellin_centro",
    "COL-02": "medellin_laureles",
    "COL-03": "medellin_envigado",
    "COL-04": "medellin_bello",
    "COL-05": "medellin_itagui",
    "COL-06": "bogota_chapinero",
    "COL-07": "bogota_usaquen",
    "COL-08": "cali_granada",
    "COL-09": "barranquilla_norte",
    "COL-10": "central",
    "FLA-01": "miami_doral",
    "FLA-02": "miami_hialeah",
    "FLA-03": "miami_kendall",
    "FLA-04": "orlando_international",
}

EXPECTED_SEED_TOTAL = 96
EXPECTED_SEED_STATUS = {"open": 32, "resolved": 50, "discarded": 14}
EXPECTED_SEED_CATEGORY = {
    "customer_complaint": 48,
    "equipment_failure": 17,
    "supply_issue": 22,
    "staff_issue": 9,
}


def can_transition(current: str, new_status: str) -> bool:
    return new_status in STATUS_TRANSITIONS.get(current, frozenset())


def map_branch(location_id: Optional[str]) -> str:
    key = (location_id or "").strip()
    return BRANCH_MAP.get(key, "central")


def parse_utc_midnight(date_str: str) -> Optional[str]:
    raw = (date_str or "").strip()
    if not raw:
        return None
    try:
        parsed = datetime.strptime(raw, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        return None
    return parsed.isoformat().replace("+00:00", "Z")


def transform_csv_row(row: dict[str, Any]) -> tuple[Optional[dict[str, Any]], Optional[str]]:
    """Transform one analyzer CSV row into an incident manager payload.

    Returns (payload, skip_reason). payload includes `_source_incident_id` for
    seed idempotency only — callers should strip it before API persistence if
    desired.
    """
    is_valid, reasons = validate_record(row)
    if not is_valid:
        return None, f"validation failed: {', '.join(reasons)}"

    description = (row.get("description") or "").strip()
    title = description[:120].strip()
    if not title:
        return None, "empty title after trim"

    created_at = parse_utc_midnight(row.get("date") or "")
    if not created_at:
        return None, "invalid or missing date"

    csv_status = (row.get("status") or "").strip()
    status = STATUS_MAP.get(csv_status)
    if not status:
        return None, f"unmapped status: {csv_status}"

    csv_category = (row.get("category") or "").strip()
    category = CATEGORY_MAP.get(csv_category)
    if not category:
        return None, f"unmapped category: {csv_category}"

    source_id = (row.get("incident_id") or row.get("ticket_id") or "").strip()

    return {
        "title": title,
        "description": row.get("description") or "",
        "category": category,
        "status": status,
        "origin": "customer",
        "branch": map_branch(row.get("location_id")),
        "created_at": created_at,
        "updated_at": created_at,
        "_source_incident_id": source_id or None,
    }, None


def transform_csv_rows(
    rows: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[str]]:
    """Transform many CSV rows; skip invalid/unmappable and collect skip messages."""
    transformed: list[dict[str, Any]] = []
    skipped: list[str] = []
    seen_ids: set[str] = set()

    for index, row in enumerate(rows, start=2):
        payload, reason = transform_csv_row(row)
        if payload is None:
            incident_ref = (row.get("incident_id") or f"row {index}").strip()
            skipped.append(f"{incident_ref}: {reason}")
            continue

        source_id = payload.get("_source_incident_id")
        if source_id:
            if source_id in seen_ids:
                skipped.append(f"{source_id}: duplicate incident_id in CSV")
                continue
            seen_ids.add(source_id)

        transformed.append(payload)

    return transformed, skipped


def load_transformed_from_path(csv_path: str) -> tuple[list[dict[str, Any]], list[str]]:
    metrics = analyze_csv_path(csv_path)
    rows = [
        {k: v for k, v in record.items() if not k.startswith("_")}
        for record in metrics.get("records", [])
    ]
    return transform_csv_rows(rows)


def load_transformed_from_text(csv_text: str) -> tuple[list[dict[str, Any]], list[str]]:
    metrics = analyze_csv_text(csv_text)
    rows = [
        {k: v for k, v in record.items() if not k.startswith("_")}
        for record in metrics.get("records", [])
    ]
    return transform_csv_rows(rows)


def assert_seed_baseline(records: list[dict[str, Any]]) -> None:
    """Raise AssertionError if transformed counts miss the expected 96 baseline."""
    from collections import Counter

    total = len(records)
    status_counts = Counter(r["status"] for r in records)
    category_counts = Counter(r["category"] for r in records)

    assert total == EXPECTED_SEED_TOTAL, (
        f"Expected {EXPECTED_SEED_TOTAL} records, got {total}"
    )
    for status, expected in EXPECTED_SEED_STATUS.items():
        actual = status_counts.get(status, 0)
        assert actual == expected, f"status {status}: expected {expected}, got {actual}"
    for category, expected in EXPECTED_SEED_CATEGORY.items():
        actual = category_counts.get(category, 0)
        assert actual == expected, (
            f"category {category}: expected {expected}, got {actual}"
        )

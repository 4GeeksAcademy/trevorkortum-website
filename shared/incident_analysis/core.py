"""Core incident validation and metrics used by the CLI script and API."""

from __future__ import annotations

import csv
import io
from collections import Counter, OrderedDict
from typing import Any

VALID_CATEGORIES = {
    "CUSTOMER_COMPLAINT",
    "EQUIPMENT",
    "SUPPLY",
    "FOOD_QUALITY",
    "STAFF",
}
VALID_STATUSES = {"OPEN", "CLOSED", "DISCARDED"}
VALID_LOCATIONS = {f"COL-{i:02d}" for i in range(1, 11)} | {
    f"FLA-{i:02d}" for i in range(1, 5)
}
CATEGORY_ORDER = [
    "CUSTOMER_COMPLAINT",
    "EQUIPMENT",
    "SUPPLY",
    "FOOD_QUALITY",
    "STAFF",
]

RULE_LABELS = OrderedDict(
    [
        ("missing_location", "Missing location_id"),
        ("invalid_category", "Invalid or missing category"),
        ("empty_description", "Empty description"),
        ("missing_reporter", "Missing reporter_id"),
        ("invalid_status", "Invalid or missing status"),
        ("closed_no_score", "Closed case, no score"),
        ("score_out_of_range", "Score out of range"),
    ]
)

REQUIRED_COLUMNS = [
    "incident_id",
    "location_id",
    "category",
    "description",
    "status",
    "satisfaction_score",
    "reporter_id",
]


def validate_record(row: dict[str, Any]) -> tuple[bool, list[str]]:
    """Return (is_valid, reason_keys) for a single CSV row dict."""
    reasons: list[str] = []

    location_id = (row.get("location_id") or "").strip()
    if location_id not in VALID_LOCATIONS:
        reasons.append("missing_location")

    category = (row.get("category") or "").strip()
    if category not in VALID_CATEGORIES:
        reasons.append("invalid_category")

    description = (row.get("description") or "").strip()
    if len(description) < 5:
        reasons.append("empty_description")

    reporter_id = (row.get("reporter_id") or "").strip()
    if not reporter_id:
        reasons.append("missing_reporter")

    status = (row.get("status") or "").strip()
    score_raw = (row.get("satisfaction_score") or "").strip()

    if status not in VALID_STATUSES:
        reasons.append("invalid_status")

    if status == "CLOSED" and not score_raw:
        reasons.append("closed_no_score")
    elif score_raw:
        try:
            score = int(score_raw)
            if not 1 <= score <= 5:
                reasons.append("score_out_of_range")
        except ValueError:
            reasons.append("score_out_of_range")

    return (len(reasons) == 0, reasons)


def _read_rows_from_text(csv_text: str) -> list[dict[str, str]]:
    stream = io.StringIO(csv_text.lstrip("\ufeff"))
    reader = csv.DictReader(stream)
    if reader.fieldnames is None:
        raise ValueError("CSV file is missing a header row")

    headers = [(h or "").strip() for h in reader.fieldnames]
    missing = [col for col in REQUIRED_COLUMNS if col not in headers]
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(missing)}")

    rows: list[dict[str, str]] = []
    for raw in reader:
        cleaned: dict[str, str] = {}
        for key, value in raw.items():
            if key is None:
                continue
            cleaned[key.strip()] = (value or "").strip() if isinstance(value, str) else ""
        rows.append(cleaned)
    return rows


def analyze_rows(rows: list[dict[str, Any]]) -> dict[str, Any]:
    """Compute validation metrics and annotated records from row dicts."""
    total = len(rows)
    invalid_count = 0
    rule_counts: Counter[str] = Counter()
    category_counts: Counter[str] = Counter()
    status_counts: Counter[str] = Counter()
    score_counts: Counter[int] = Counter()
    closed_valid = 0
    annotated: list[dict[str, Any]] = []

    for row in rows:
        is_valid, reasons = validate_record(row)
        reason_labels = [RULE_LABELS[r] for r in reasons]
        record = dict(row)
        record["_validation"] = {
            "is_valid": is_valid,
            "errors": reason_labels,
            "error_keys": reasons,
        }
        annotated.append(record)

        if not is_valid:
            invalid_count += 1
            for reason in reasons:
                rule_counts[reason] += 1
            continue

        category_counts[row["category"].strip()] += 1
        status = row["status"].strip()
        status_counts[status] += 1

        if status == "CLOSED":
            closed_valid += 1
            score_raw = (row.get("satisfaction_score") or "").strip()
            if score_raw:
                score_counts[int(score_raw)] += 1

    valid_count = total - invalid_count
    scored_cases = sum(score_counts.values())
    avg_score = (
        sum(score * count for score, count in score_counts.items()) / scored_cases
        if scored_cases
        else 0.0
    )

    return {
        "total": total,
        "valid_count": valid_count,
        "invalid_count": invalid_count,
        "rule_counts": rule_counts,
        "category_counts": category_counts,
        "status_counts": status_counts,
        "closed_valid": closed_valid,
        "scored_cases": scored_cases,
        "score_counts": score_counts,
        "avg_score": avg_score,
        "records": annotated,
    }


def analyze_csv_text(csv_text: str) -> dict[str, Any]:
    """Parse CSV text and return analysis metrics."""
    rows = _read_rows_from_text(csv_text)
    if not rows:
        raise ValueError("CSV file contains no data rows")
    return analyze_rows(rows)


def analyze_csv_path(csv_path: str) -> dict[str, Any]:
    """Read a CSV file from disk and return analysis metrics."""
    with open(csv_path, newline="", encoding="utf-8-sig") as handle:
        text = handle.read()
    return analyze_csv_text(text)


def _pct(count: int, total: int) -> float:
    return (count / total * 100) if total else 0.0


def export_metrics_to_csv_rows(metrics: dict[str, Any]) -> list[tuple[str, str, str]]:
    """Build one row per metric with metric, value, percentage columns."""
    valid = metrics["valid_count"]
    rows: list[tuple[str, str, str]] = [
        ("total_records", str(metrics["total"]), ""),
        ("valid_records", str(valid), ""),
        ("invalid_records", str(metrics["invalid_count"]), ""),
    ]

    rule_counts = metrics["rule_counts"]
    for key, label in RULE_LABELS.items():
        count = rule_counts.get(key, 0)
        if count:
            rows.append((f"invalid_rule:{label}", str(count), ""))

    category_counts = metrics["category_counts"]
    for cat in CATEGORY_ORDER:
        count = category_counts.get(cat, 0)
        rows.append((f"category:{cat}", str(count), f"{_pct(count, valid):.1f}%"))

    status_counts = metrics["status_counts"]
    for status in ["OPEN", "CLOSED", "DISCARDED"]:
        count = status_counts.get(status, 0)
        rows.append((f"status:{status}", str(count), f"{_pct(count, valid):.1f}%"))

    rows.append(("scored_cases", str(metrics["scored_cases"]), ""))
    rows.append(("average_satisfaction_score", f"{metrics['avg_score']:.2f}", ""))
    score_counts = metrics["score_counts"]
    for score in [1, 2, 3, 4, 5]:
        count = score_counts.get(score, 0)
        rows.append((f"satisfaction_score:{score}", str(count), ""))

    return rows


def export_metrics_to_csv_string(metrics: dict[str, Any]) -> str:
    """Serialize summary metrics to CSV text."""
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["metric", "value", "percentage"])
    writer.writerows(export_metrics_to_csv_rows(metrics))
    return buffer.getvalue()


def metrics_to_dict(
    metrics: dict[str, Any],
    source_file: str = "",
    *,
    include_records: bool = True,
    redact_pii: bool = True,
) -> dict[str, Any]:
    """Convert internal metrics (with Counters) into JSON-safe payload.

    When ``redact_pii`` is True (default), omit reporter_id and truncate
    descriptions in the records payload.
    """
    rule_counts = {
        RULE_LABELS[key]: metrics["rule_counts"].get(key, 0)
        for key in RULE_LABELS
        if metrics["rule_counts"].get(key, 0)
    }
    payload: dict[str, Any] = {
        "source_file": source_file,
        "total": metrics["total"],
        "valid_count": metrics["valid_count"],
        "invalid_count": metrics["invalid_count"],
        "rule_counts": rule_counts,
        "category_counts": dict(metrics["category_counts"]),
        "status_counts": dict(metrics["status_counts"]),
        "closed_valid": metrics["closed_valid"],
        "scored_cases": metrics["scored_cases"],
        "score_counts": {str(k): v for k, v in sorted(metrics["score_counts"].items())},
        "avg_score": round(float(metrics["avg_score"]), 2),
    }
    if not include_records:
        payload["records"] = []
        return payload

    records = []
    for record in metrics.get("records", []):
        row = {k: v for k, v in record.items() if not k.startswith("_")}
        if redact_pii:
            row.pop("reporter_id", None)
            description = str(row.get("description") or "")
            if len(description) > 120:
                row["description"] = description[:117] + "..."
        records.append(
            {
                **row,
                "is_valid": record["_validation"]["is_valid"],
                "errors": record["_validation"]["errors"],
            }
        )
    payload["records"] = records
    return payload

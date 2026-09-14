#!/usr/bin/env python3
"""Seed TinyDB with transformed incidents from incidents-brasaland.csv.

Usage:
  python3 scripts/seed_incidents.py
  python3 scripts/seed_incidents.py path/to/incidents.csv

Idempotent: skips rows already present (by source incident_id key or title+created_at).
"""

from __future__ import annotations

import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKAGES_SHARED = ROOT / "packages" / "shared"
API_ROOT = ROOT / "services" / "api"

for path in (PACKAGES_SHARED, API_ROOT):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

from incident_analysis import (  # noqa: E402
    EXPECTED_SEED_CATEGORY,
    EXPECTED_SEED_STATUS,
    EXPECTED_SEED_TOTAL,
    assert_seed_baseline,
    load_transformed_from_path,
)
from database import incidents_table  # noqa: E402


def _existing_keys() -> set[tuple[str, str]]:
    keys: set[tuple[str, str]] = set()
    for row in incidents_table.all():
        title = (row.get("title") or "").strip()
        created = row.get("created_at") or ""
        keys.add((title, created))
        source = row.get("_source_incident_id")
        if source:
            keys.add(("__id__", source))
    return keys


def main() -> int:
    default_csv = ROOT / "scripts" / "incidents-brasaland.csv"
    csv_path = Path(sys.argv[1]) if len(sys.argv) > 1 else default_csv

    if not csv_path.exists():
        print(f"Error: CSV not found -> {csv_path}")
        return 1

    print(f"Loading incidents from {csv_path}")
    records, skipped = load_transformed_from_path(str(csv_path))

    for message in skipped:
        print(f"  SKIP  {message}")

    print(f"\nTransformed valid records: {len(records)}")
    print(f"Skipped rows reported:     {len(skipped)}")

    try:
        assert_seed_baseline(records)
        print(
            f"Baseline assertion OK: {EXPECTED_SEED_TOTAL} records "
            f"(open={EXPECTED_SEED_STATUS['open']}, "
            f"resolved={EXPECTED_SEED_STATUS['resolved']}, "
            f"discarded={EXPECTED_SEED_STATUS['discarded']})"
        )
        print(
            "Category assertion OK: "
            + ", ".join(f"{k}={v}" for k, v in EXPECTED_SEED_CATEGORY.items())
        )
    except AssertionError as exc:
        print(f"Baseline assertion FAILED: {exc}")
        return 1

    existing = _existing_keys()
    inserted = 0
    skipped_existing = 0

    for payload in records:
        source_id = payload.pop("_source_incident_id", None)
        key_title = (payload["title"], payload["created_at"])
        if key_title in existing or (source_id and ("__id__", source_id) in existing):
            skipped_existing += 1
            continue

        if source_id:
            payload["_source_incident_id"] = source_id
            existing.add(("__id__", source_id))
        existing.add(key_title)
        incidents_table.insert(payload)
        inserted += 1

    status_counts = Counter(doc.get("status") for doc in incidents_table.all())
    print(f"\nInserted: {inserted}")
    print(f"Already present (skipped): {skipped_existing}")
    print(f"Incidents in DB: {len(incidents_table)}")
    print(
        "DB status totals: "
        + ", ".join(f"{k}={status_counts.get(k, 0)}" for k in ("open", "in_progress", "resolved", "discarded"))
    )

    # Soft check when DB was empty or only seeded from this CSV
    open_count = status_counts.get("open", 0)
    resolved_count = status_counts.get("resolved", 0)
    discarded_count = status_counts.get("discarded", 0)
    if inserted + skipped_existing == EXPECTED_SEED_TOTAL and skipped_existing == 0:
        assert open_count == 32 and resolved_count == 50 and discarded_count == 14
        print("Post-insert DB status check OK (32 / 50 / 14).")
    elif len(incidents_table) >= EXPECTED_SEED_TOTAL:
        print(
            "Post-insert note: DB already had data; "
            "transformed baseline still matches 96 / 32 / 50 / 14."
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

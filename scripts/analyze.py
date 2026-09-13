#!/usr/bin/env python3
"""Brasaland incident report analyzer.

Usage: python analyze.py <path-to-csv>
"""
import csv
import sys
from collections import Counter, OrderedDict

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
        ("closed_no_score", "Closed case, no score"),
        ("score_out_of_range", "Score out of range"),
    ]
)


def validate_record(row):
    """Return (is_valid, reasons) for a single CSV row dict."""
    reasons = []

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


def analyze_incidents(csv_path):
    """Read the CSV and compute validation + metrics data."""
    with open(csv_path, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    total = len(rows)
    invalid_count = 0
    rule_counts = Counter()
    category_counts = Counter()
    status_counts = Counter()
    score_counts = Counter()
    closed_valid = 0

    for row in rows:
        is_valid, reasons = validate_record(row)
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
    }


def _pct(count, total):
    return (count / total * 100) if total else 0.0


def _line(branch, label, value, width=36):
    """Render an aligned dot-leader line."""
    dots = "." * max(3, width - len(label) - 1)
    return f"  {branch} {label} {dots} {value}"


def print_summary(metrics, source_file):
    total = metrics["total"]
    valid = metrics["valid_count"]
    invalid = metrics["invalid_count"]

    print("=" * 60)
    print("  BRASALAND — INCIDENT REPORT ANALYSIS")
    print(f"  Source file: {source_file}")
    print("=" * 60)
    print()
    print(f"TOTAL RECORDS IN FILE .......... {total}")
    print(_line("├─", "Valid records", valid))
    print(_line("└─", "Invalid / incomplete", invalid))
    print()

    triggered_rules = [
        (label, metrics["rule_counts"][key])
        for key, label in RULE_LABELS.items()
        if metrics["rule_counts"][key] > 0
    ]
    if triggered_rules:
        print("INVALID RECORDS BREAKDOWN")
        for i, (label, count) in enumerate(triggered_rules):
            branch = "└─" if i == len(triggered_rules) - 1 else "├─"
            print(_line(branch, label, count))
        print()

    print("BREAKDOWN BY CATEGORY (valid records)")
    cat_items = [
        (cat, metrics["category_counts"].get(cat, 0)) for cat in CATEGORY_ORDER
    ]
    for i, (cat, count) in enumerate(cat_items):
        branch = "└─" if i == len(cat_items) - 1 else "├─"
        print(_line(branch, cat, f"{count:>3}  ({_pct(count, valid):.1f}%)"))
    print()

    print("BREAKDOWN BY STATUS (valid records)")
    status_order = ["OPEN", "CLOSED", "DISCARDED"]
    status_items = [(s, metrics["status_counts"].get(s, 0)) for s in status_order]
    for i, (status, count) in enumerate(status_items):
        branch = "└─" if i == len(status_items) - 1 else "├─"
        print(_line(branch, status, f"{count:>3}  ({_pct(count, valid):.1f}%)"))
    print()

    print("SATISFACTION INDEX (closed cases)")
    print(f"  Scored cases: {metrics['scored_cases']} of {metrics['closed_valid']}")
    print(f"  Average score: {metrics['avg_score']:.2f} / 5.00")
    score_labels = {
        1: "Very dissatisfied",
        2: "Dissatisfied",
        3: "Neutral",
        4: "Satisfied",
        5: "Very satisfied",
    }
    for i, score in enumerate([1, 2, 3, 4, 5]):
        branch = "└─" if i == 4 else "├─"
        count = metrics["score_counts"].get(score, 0)
        print(_line(branch, f"Score {score} ({score_labels[score]})", f"{count:>3}"))
    print()
    print("=" * 60)


def export_to_csv(metrics, output_path="results.csv"):
    """Write one row per metric with metric, value, percentage columns."""
    valid = metrics["valid_count"]
    rows = [
        ("total_records", metrics["total"], ""),
        ("valid_records", valid, ""),
        ("invalid_records", metrics["invalid_count"], ""),
    ]

    for key, label in RULE_LABELS.items():
        count = metrics["rule_counts"][key]
        if count > 0:
            rows.append((f"invalid_rule:{label}", count, ""))

    for cat in CATEGORY_ORDER:
        count = metrics["category_counts"].get(cat, 0)
        rows.append((f"category:{cat}", count, f"{_pct(count, valid):.1f}%"))

    for status in ["OPEN", "CLOSED", "DISCARDED"]:
        count = metrics["status_counts"].get(status, 0)
        rows.append((f"status:{status}", count, f"{_pct(count, valid):.1f}%"))

    rows.append(("scored_cases", metrics["scored_cases"], ""))
    rows.append(("average_satisfaction_score", f"{metrics['avg_score']:.2f}", ""))
    for score in [1, 2, 3, 4, 5]:
        count = metrics["score_counts"].get(score, 0)
        rows.append((f"satisfaction_score:{score}", count, ""))

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["metric", "value", "percentage"])
        writer.writerows(rows)

    print(f"Results exported to {output_path}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python analyze.py <path-to-csv>")
        sys.exit(1)

    csv_path = sys.argv[1]
    try:
        metrics = analyze_incidents(csv_path)
    except FileNotFoundError:
        print(f"Error: file not found -> {csv_path}")
        sys.exit(1)

    print_summary(metrics, csv_path)

    answer = input("Export results to CSV? [y/n]: ").strip().lower()
    if answer == "y":
        export_to_csv(metrics)


if __name__ == "__main__":
    main()

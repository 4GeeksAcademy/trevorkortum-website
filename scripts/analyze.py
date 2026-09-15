#!/usr/bin/env python3
"""Brasaland incident report analyzer.

Usage: python analyze.py <path-to-csv>
"""
from __future__ import annotations

import csv
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SHARED = ROOT / "shared"
if str(SHARED) not in sys.path:
    sys.path.insert(0, str(SHARED))

from incident_analysis import (  # noqa: E402
    CATEGORY_ORDER,
    RULE_LABELS,
    analyze_csv_path,
    export_metrics_to_csv_rows,
)


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
    try:
        with open(output_path, "w", newline="", encoding="utf-8") as handle:
            writer = csv.writer(handle)
            writer.writerow(["metric", "value", "percentage"])
            writer.writerows(export_metrics_to_csv_rows(metrics))
    except OSError as exc:
        print(f"Error: unable to write export file ({type(exc).__name__})")
        sys.exit(1)
    print(f"Results exported to {output_path}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python analyze.py <path-to-csv>")
        sys.exit(1)

    csv_path = sys.argv[1]
    try:
        metrics = analyze_csv_path(csv_path)
    except FileNotFoundError:
        print(f"Error: file not found -> {csv_path}")
        sys.exit(1)
    except UnicodeDecodeError:
        print("Error: CSV must be UTF-8 encoded")
        sys.exit(1)
    except OSError as exc:
        print(f"Error: unable to read file ({type(exc).__name__})")
        sys.exit(1)
    except ValueError as exc:
        message = str(exc)
        if message.startswith("Missing required columns:") or message in {
            "CSV file is missing a header row",
            "CSV file contains no data rows",
        }:
            print(f"Error: {message}")
        else:
            print("Error: unable to analyze CSV")
        sys.exit(1)

    print_summary(metrics, csv_path)

    try:
        answer = input("Export results to CSV? [y/n]: ").strip().lower()
    except (EOFError, KeyboardInterrupt):
        print("\nSkipping export.")
        return

    if answer == "y":
        export_to_csv(metrics)


if __name__ == "__main__":
    main()

"""In-memory store for the latest incident analysis export."""

from __future__ import annotations

from typing import Any

_latest_metrics: dict[str, Any] | None = None
_latest_source_file: str = ""


def save_latest(metrics: dict[str, Any], source_file: str) -> None:
    global _latest_metrics, _latest_source_file
    _latest_metrics = metrics
    _latest_source_file = source_file


def get_latest() -> tuple[dict[str, Any] | None, str]:
    return _latest_metrics, _latest_source_file

# `scripts` folder

This folder contains **helper scripts** for the monorepo: development automation, maintenance utilities, repetitive tasks (setup, lint, migrations, data generation, etc.), and internal tooling.

- **Main purpose**: group support tools that do not belong to a specific app, agent, or pipeline but make the team’s work easier.
- **Recommendation**: document each script (what it does, parameters, requirements, usage examples) and keep them reproducible (and safe) across environments.

## Incident analyzer

```bash
python3 scripts/analyze.py scripts/incidents-brasaland.csv
```

Test data lives next to the script as `scripts/incidents-brasaland.csv` (Brasaland company sample).

Validation and metrics come from `packages/shared/incident_analysis` (same module used by `services/api`).

## Incident manager seed

Load the analyzer CSV into the centralized Incident Manager (TinyDB), applying status/category/branch transforms:

```bash
# Use the API virtualenv (needs tinydb)
services/api/.venv/bin/python scripts/seed_incidents.py
```

Expected baseline after a clean seed: **96** valid records (`open` 32, `resolved` 50, `discarded` 14). Invalid CSV rows are skipped and printed to stdout. Re-runs are idempotent.

> _Spanish version: [README.es.md](./README.es.md)._

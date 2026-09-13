# `scripts` folder

This folder contains **helper scripts** for the monorepo: development automation, maintenance utilities, repetitive tasks (setup, lint, migrations, data generation, etc.), and internal tooling.

- **Main purpose**: group support tools that do not belong to a specific app, agent, or pipeline but make the team’s work easier.
- **Recommendation**: document each script (what it does, parameters, requirements, usage examples) and keep them reproducible (and safe) across environments.

## Incident analyzer

```bash
python3 scripts/analyze.py data/raw/incidents-brasaland.csv
```

Validation and metrics come from `shared/incident_analysis` (same module used by `services/api`).

> _Spanish version: [README.es.md](./README.es.md)._

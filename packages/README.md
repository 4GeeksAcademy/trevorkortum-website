# `packages` folder

This folder contains **shared packages** for the monorepo: internal libraries, utilities, types, shared components, SDKs, clients, and any code reused by multiple applications, agents, or pipelines.

Each subfolder under `packages/` should represent **one versionable package** (for example `shared-types`, `ui`, `analytics-sdk`) with its own README.

- **Main purpose**: encourage reuse and consistency across all company deliverables.
- **Recommendation**: document packages as you add them—their public API and how they are consumed from `uis/`, `services/`, `agents/`, and `workflows/`.

## Active packages

- `shared/`: TypeScript domain types (`types/`) and Python `incident_analysis` (CSV validation + incident-manager transforms) consumed by `scripts/` and `services/api`.

> _Spanish version: [README.es.md](./README.es.md)._

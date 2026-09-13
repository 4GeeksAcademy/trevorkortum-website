# `shared` folder

This folder is reserved for **unbundled shared resources** in the monorepo: templates, schemas, common assets, short technical documentation, or configuration shared across several components.

- **Main purpose**: provide a neutral place for reusable items that do not fit as an application (`apps/`) or as a package/library (`packages/`).
- **Recommendation**: document what each subfolder or file contains and link to it from consuming components to keep traceability.

## Active modules

- `incident_analysis/`: shared Python validation and metrics used by `scripts/analyze.py` and `services/api`.

> _Spanish version: [README.es.md](./README.es.md)._

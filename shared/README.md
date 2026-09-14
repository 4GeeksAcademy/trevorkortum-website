# `shared` folder

This folder is reserved for **unbundled shared resources** in the monorepo: templates, schemas, common assets, short technical documentation, or configuration shared across several components.

- **Main purpose**: provide a neutral place for reusable items that do not fit as a UI app (`uis/`) or as a package/library (`packages/`).
- **Recommendation**: document what each subfolder or file contains and link to it from consuming components to keep traceability.

## Active modules

- Incident CSV validation moved to `packages/shared/incident_analysis/` (see that package README). This folder keeps a redirect note only.

> _Spanish version: [README.es.md](./README.es.md)._

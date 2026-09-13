# Brasaland Services

Backend services will provide the central Brasaland API, integrations, telemetry ingestion, reporting jobs, and automation workers.

## Intended Boundaries

- `api`: locations, menus, sales, customers, suppliers, HR, training, and executive reporting endpoints.
- `telemetry`: real-time events from locations and operational alert streams.
- `integrations`: POS, supplier, CRM, loyalty, email, and workflow adapters.
- `jobs`: scheduled reports, demand forecasting, and data synchronization tasks.

## Current Status

- `api/`: FastAPI service with incident CSV analyze/export endpoints (`/api/incidents/*`), backed by `shared/incident_analysis`.
- `telemetry/`: still a placeholder for real-time location event streams.

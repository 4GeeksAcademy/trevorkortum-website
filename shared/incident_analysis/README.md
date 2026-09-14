# Moved

Incident CSV validation and manager transforms now live in:

**`packages/shared/incident_analysis/`**

Consumers (`scripts/analyze.py`, `scripts/seed_incidents.py`, `services/api`) import from that package via `packages/shared` on `sys.path`.

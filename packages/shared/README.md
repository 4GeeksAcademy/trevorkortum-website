# `@repo/shared` (`packages/shared`)

Shared Brasaland libraries reused by scripts, services, and UIs.

## Contents

| Path | Purpose |
|---|---|
| `incident_analysis/` | Python CSV validation, metrics, and incident-manager transforms (status/category/branch maps + lifecycle rules). Used by `scripts/analyze.py`, `scripts/seed_incidents.py`, and `services/api`. |
| `types/` | TypeScript domain types (including Incident Manager enums and branch display names). |

## Python usage

Add `packages/shared` to `sys.path`, then:

```python
from incident_analysis import validate_record, load_transformed_from_path, can_transition
```

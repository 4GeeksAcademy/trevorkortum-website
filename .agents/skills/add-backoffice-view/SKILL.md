# Skill: Add Backoffice View

## Objective

Add one focused, verifiable backoffice view to `uis/backoffice` that helps Brasaland staff monitor or act on a real operational need from `CONTEXT.md`.

## Inputs

- Business department: Operations, Procurement, Marketing, People and Culture, Training, Technology, or Executive Direction.
- Primary user: the named department leader or role using the view.
- Data fields: location, market, metric, currency, time period, owner, and alert state where applicable.
- Interaction requirement: read-only dashboard, filterable list, detail panel, form, or workflow action.

## Acceptance Criteria

- The new view renders at `/` or is reachable from the existing backoffice navigation.
- The screen includes visible business data tied to Brasaland's Colombia and Florida operations.
- Money values show `COP` or `USD` explicitly and follow the multi-currency rule.
- The implementation reuses existing backoffice styling and component patterns.
- The local backoffice dev command starts without runtime errors.
- `memory-bank/progress.md` is updated with the new capability and any known limitations.

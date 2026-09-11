# Brasaland Digital Technical Context

## Current Stack

- Primary language: TypeScript for shared utilities and future application logic.
- Current root package: `brasaland-data-utils` with `typecheck`, `build`, `demo`, and static serving scripts.
- Current TypeScript scope: source files under `src/`, compiled to `dist/`.
- Initial UI delivery: static HTML, CSS, and JavaScript app shells under `uis/` so each product can run independently on `/` while the monorepo architecture matures.

## Monorepo Conventions

- `uis/website`: public Brasaland corporate website for guests, brand storytelling, location discovery, and future ordering/loyalty entry points.
- `uis/backoffice`: internal Brasaland Digital operations interface for leadership, operations, HR, procurement, and training workflows.
- `services`: backend service placeholders for the future central API, data ingestion, telemetry, integrations, and automation workers.
- `agents`: product code for runtime AI agents used by Brasaland applications.
- `skills`: product code for reusable runtime skills used by Brasaland applications.
- `.agents`: development tool agent configuration only. This includes coding-agent rules, repo operating instructions, and dev-only skills. Do not place product agent runtime code here.

## Architectural Decisions

- Keep public website and backoffice as separate entry points with their own assets and layout contracts.
- Keep business logic portable and typed before coupling it to a specific frontend framework.
- Treat location, currency, language, and market as first-class dimensions in data models.
- Prefer explicit service boundaries for locations, menu, sales, customers, suppliers, HR, training, telemetry, and reporting.
- Build toward API-driven UIs rather than spreadsheet or PDF-driven operations.

## Dual-Currency Guidelines

- Always store the native transaction currency (`COP` or `USD`) with the amount.
- Do not mix COP and USD totals without recording the exchange rate, conversion timestamp, source, and display currency.
- Display Colombian location values primarily in COP and Florida values primarily in USD; executive views may show both.
- Avoid hard-coded conversion rates in production services. Demo data may use fixed rates only when clearly labeled.
- Format currency and dates using market-aware locale settings: `es-CO` for Colombia and `en-US` for Florida.

## Multi-Market Constraints

- Account for Spanish and English user-facing language requirements.
- Segment HR and compliance data by country because labor laws differ between Colombia and the United States.
- Preserve location-level operational autonomy while reporting chain-level totals centrally.
- Design APIs and dashboards for intermittent integration gaps while POS systems are being unified.

# Brasaland Digital Backend Architecture Proposal

## 1. Recommended Architecture Pattern

- Recommendation: use a layered architecture with explicit domain services, organized around FastAPI routers and service modules, rather than a lightweight MVC-only pattern.
- Why this fits Brasaland:
  - Brasaland is not a single CRUD app; it spans multiple operational domains: restaurant operations, procurement, marketing, HR, training, telemetry, and executive reporting.
  - The business context in CONTEXT.md defines first-class concerns such as location, market, currency, language, supplier, customer, menu, sales, and employee workflows.
  - Each domain has different data ownership and validation rules; for example, sales data must be segmented by location and market, while HR data must reflect country-specific labor rules and payroll constraints.
  - The company operates across Colombia and Florida, which means the platform must preserve local context while also supporting centralized reporting, dashboards, and AI-driven analysis.
- Recommended layered boundary:
  - Presentation/API layer: FastAPI routers and request/response schemas.
  - Application/service layer: business rules, validation, orchestration across repositories and integrations.
  - Domain model layer: entities and value objects for locations, recipes, suppliers, employees, customers, sales, and reports.
  - Data access layer: repositories, persistence adapters, and integration clients for POS, warehouse, CRM, and reporting systems.
- This architecture keeps the system understandable for a startup-scale internal team while being scalable enough for a multi-market chain with 14 locations.

## 2. Proposed FastAPI Folder Structure

- Use a domain-driven monorepo layout under the application root, with separate frontend entry points and a dedicated backend API application.
- Proposed structure:

```text
apps/
  api/
    app/
      main.py
      core/
        config.py
        security.py
        database.py
        middleware.py
      models/
        __init__.py
        location.py
        sales.py
        supplier.py
        customer.py
        employee.py
        recipe.py
        report.py
      schemas/
        location.py
        sales.py
        supplier.py
        customer.py
        employee.py
        recipe.py
        report.py
      repositories/
        location_repo.py
        sales_repo.py
        supplier_repo.py
        customer_repo.py
        employee_repo.py
        recipe_repo.py
      services/
        location_service.py
        sales_service.py
        supplier_service.py
        customer_service.py
        hr_service.py
        training_service.py
        reporting_service.py
      routers/
        locations.py
        sales.py
        suppliers.py
        customers.py
        hr.py
        training.py
        reports.py
      deps/
        auth.py
        db.py
        market.py
        current_user.py
      utils/
        currency.py
        localization.py
        alerts.py
    tests/
      test_locations.py
      test_sales.py
      test_suppliers.py
      test_reports.py
  website/
    ...
  backoffice/
    ...
```

- Folder responsibilities:
  - `core/`: global configuration, security, DB session management, CORS setup, and shared middleware.
  - `models/`: persistent domain models and entity definitions aligned to business logic.
  - `schemas/`: request and response contracts for API contracts, built with Pydantic.
  - `repositories/`: persistence logic for SQL/ORM or external data integrations.
  - `services/`: orchestration of domain behavior such as stock forecasting, supplier price alerts, sales analytics, and executive summaries.
  - `routers/`: route groups that expose API endpoints by domain and maintain clear ownership.
  - `deps/`: shared dependencies for auth, tenant context, market, and database access.

## 3. Endpoint and Router Organization

- Keep API versioning explicit and consistent:
  - Root prefix: `/api/v1`
- Domain grouping by business function:
  - `locations` router: CRUD for restaurant locations, market metadata, schedule windows, and operational status.
    - Methods: GET list, GET by id, POST create, PATCH update, DELETE only when appropriate.
  - `sales` router: transaction ingestion, daily summaries, per-location KPIs, trends, and no-sales alerts.
    - Methods: GET sales summary, GET by location/date, POST ingest from POS or manual entry, PATCH corrections, GET alert streams.
  - `suppliers` router: supplier records, price history, purchasing data, and negotiation insights.
    - Methods: GET list, GET supplier details, POST create or import, PATCH price changes, GET purchase summaries.
  - `customers` router: loyalty profiles, Brasa Points, order history, preferences, and segmentation.
    - Methods: GET customer profile, POST create or sync, PATCH preferences, GET loyalty activity, GET recommendations.
  - `hr` router: employees, absences, onboarding, schedules, compliance, and KPI data.
    - Methods: GET employee records, POST onboarding, PATCH attendance and leave, GET HR dashboard metrics.
  - `training` router: recipes, cooking standards, onboarding material, and multilingual content updates.
    - Methods: GET recipe catalog, POST recipe update, PATCH standards, GET training modules, POST publish updates.
  - `reports` router: executive dashboard, weekly performance snapshots, natural-language query support, and generated summary exports.
    - Methods: GET dashboard totals, GET location comparisons, POST report generation, GET AI-ready summary data.
- Router principles:
  - One router per domain, not one giant file.
  - Keep HTTP semantics clean and stable.
  - Use query parameters for filtering by market, date range, and location.
  - Add explicit status codes and validation for partial or failed updates.

## 4. FastAPI Conventions and Standards

- The project should follow the official FastAPI guidance for larger applications: https://fastapi.tiangolo.com/tutorial/bigger-applications/
- Standard conventions to adopt:
  - Use `APIRouter` for each domain module and mount them in the main app entrypoint.
  - Define request and response payloads with Pydantic models rather than ad hoc dicts.
  - Keep business logic out of route functions; routes should orchestrate and delegate to services.
  - Use dependency injection for database sessions, authentication, market scoping, and shared validation.
  - Keep configuration in a central `core/config.py` with environment variables rather than hard-coded secrets or values.
  - Use response models for validation and consistent API contracts between backend, website, and backoffice.
- Implementation guidance:
  - `app.main` should be thin and focused on app creation, router inclusion, and middleware registration.
  - `services/` should host rules such as inventory projections, currency conversions, supplier risk alerts, and sales normalization.
  - `schemas/` should separate input/output types to reduce accidental coupling between internal persistence models and external API contracts.
- This structure matches FastAPI’s recommended pattern for maintainable, domain-oriented APIs and keeps the codebase healthier as Brasaland grows from a small internal platform to a multi-application digital operation.

## 5. Frontend and Backend Coexistence

- Brasaland will have separate frontend applications and a dedicated backend API.
- Recommended split:
  - `apps/website`: public-facing customer experience and brand site.
  - `apps/backoffice`: internal operations, procurement, HR, training, and executive views.
  - `apps/api`: central FastAPI backend serving both internal and digital customer features.
- Interaction model:
  - Frontends call the API through environment-based base URLs, for example:
    - `API_BASE_URL=http://localhost:8000/api/v1`
    - `PUBLIC_API_BASE_URL=https://api.brasaland.local/api/v1`
  - Use `.env` files for environment configuration and never hard-code local or production endpoints into client code.
  - Register `CORSMiddleware` in the FastAPI app with explicit allowed origins from environment configuration.
  - Keep CORS policy narrow and intentional to avoid exposing internal APIs to arbitrary websites.
  - Example policy: allow only the website domain, the backoffice domain, and local development origins when debug mode is enabled.
- Monorepo setup:
  - Keep each app independent at the package level while sharing domain models, typed contracts, and common utilities when appropriate.
  - This allows frontend and backend teams to ship separately without forcing all UI changes to wait on the entire platform.
  - Shared environment conventions and explicit contracts reduce drift between website, backoffice, and API clients.
- Operational principle:
  - Frontends should remain presentation layers; they should not own business logic or report calculation rules.
  - The API is the system of record for locations, sales, suppliers, customers, employees, recipes, and executive summaries.

## 6. Risks and Points of Attention

- Risk 1: Monolithic route files and spread business logic across endpoints.
  - If the team keeps all logic in a single `main.py` or a single `routes.py` file, the API will become difficult to scale, difficult to test, and harder to reason about as departments add new features.
  - Impact: slower releases, hidden coupling between operations and HR, and low confidence during deployment.
- Risk 2: Ignoring market, currency, and language boundaries.
  - Brasaland operates in two countries with different financial and labor contexts. If location, currency, and market are not modeled as first-class dimensions, KPI reporting can silently mix COP and USD, or treat Colombian and Florida labor data as if they are identical.
  - Impact: incorrect executive reporting, broken compliance flows, and poor operational decisions.
- Risk 3: Weak API contract discipline.
  - If Pydantic schemas and response models are not enforced, frontend apps can drift from real API behavior and break when new data fields or validation rules appear.
  - Impact: hard-to-debug UI bugs, inconsistent integrations, and delayed releases.
- Risk 4: Loose CORS and configuration management.
  - If CORS is overly permissive or secrets are stored in code rather than `.env`, the system becomes brittle and insecure.
  - Impact: blocked browser clients, broken deployments, and avoidable security exposure.
- Risk 5: Spreadsheet-driven workarounds instead of systemized domain services.
  - The company already depends on WhatsApp, Excel, and PDF reporting. If the backend is designed as a thin wrapper over spreadsheets instead of a proper API, the organization will keep reinforcing the same manual process.
  - Impact: limited visibility, poor data quality, and no reliable foundation for AI or operational analytics.

## 7. Final Recommendation

- Adopt a layered, domain-driven FastAPI backend with clean router separation and explicit service boundaries.
- Model the business domain around the real operating units defined in CONTEXT.md: locations, sales, suppliers, customers, HR, training, and reporting.
- Keep the frontend and backend separate, connected through explicit API contracts, `.env` configuration, and controlled CORS policy.
- Use FastAPI’s official design patterns—`APIRouter`, Pydantic schemas, dependency injection, and centralized configuration—to build a platform that is maintainable, auditable, and ready for a multi-market restaurant operation.
- This architecture gives Brasaland the structure needed to transition from spreadsheets and WhatsApp coordination to a dependable digital operating system without losing the continuity of its brand, service model, and operational discipline.

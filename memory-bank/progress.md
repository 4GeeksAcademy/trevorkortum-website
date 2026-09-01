# Brasaland Digital Progress

## Current Status

Brasaland Digital is initializing its AI-driven monorepo infrastructure and base application surfaces. The repository now tracks active business context, technical constraints, agent operating rules, dev-agent skills, and first-pass UI entry points for the public website and internal backoffice.

## Active Constraints

- Brasaland operates across Colombia and Florida with COP/USD financial reporting needs.
- The company needs systems that work in Spanish and English.
- Current operations depend heavily on spreadsheets, PDFs, phone calls, and WhatsApp orders.
- The technology platform starts near-zero, so shared conventions must stay simple, explicit, and easy to verify.
- `.agents/` is reserved for development tool configuration; `/agents` and `/skills` remain reserved for product/runtime code.

## Recent Changes

- `uis/website/index.html` and `styles.css`: balanced the public locations grid to alternate Colombia/Florida (Medellin Downtown, Miami, Envigado, Doral) and added a "Menu" section listing signature grilled dishes served identically in both markets.

## Planned Roadmap

- Establish shared TypeScript business models for locations, currencies, suppliers, sales, customers, HR, and training.
- Replace static UI demo data with service-backed fixtures and typed API contracts.
- Build the central Brasaland API for locations, menus, sales, customers, suppliers, and telemetry.
- Add ingestion adapters for POS data from Colombia and Florida.
- Create operational alerts for no-sales windows, ingredient stockouts, and supplier price changes.
- Expand backoffice modules for procurement, HR, training updates, and executive reporting.
- Add AI assistant capabilities for natural-language executive questions and weekly report generation.

# `apps` Folder

This folder contains **all the applications of the monorepo** related to the company for the cross-functional AI Engineering project (for example: web applications, APIs, internal dashboards, customer portals, etc.).

Each subfolder inside `apps/` must correspond to **one specific application** (for example: `web-portal`, `admin-api`, `backoffice-dashboard`) and include its own technical and functional documentation.

- **Main purpose**: to centralize in a single monorepo all the applications that support the company's use cases.
- **Recommendation**: document in this file (or in sub-READMEs) the applications you add, their objective, the technology used, and how to run them in development, testing, and production environments.

## Current apps

### `brasaland-site`

- **Type**: Static multi-page website (Tailwind CSS + vanilla JavaScript)
- **Goal**: Milestone 1 corporate landing page and validated sign-up/application form
- **Entry files**:
	- `apps/brasaland-site/index.html`
	- `apps/brasaland-site/index.es.html`
	- `apps/brasaland-site/apply.html`
	- `apps/brasaland-site/apply.es.html`
- **Run locally**:
	1. Open either HTML file directly in the browser, or
	2. Serve from repo root with a local static server (example: `python3 -m http.server`) and visit the app paths.

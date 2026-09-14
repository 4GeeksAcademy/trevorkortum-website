# `uis` Folder

UI entry points for Brasaland Digital.

## Applications

### `application`

- **Type**: Internal procurement application
- **Entry**: `uis/application/app/suppliers/`
- **Run**: `npm run dev:application` → http://127.0.0.1:3003/app/suppliers/

### `portal`

- **Type**: Next.js authenticated portal
- **Entry**: `uis/portal` (`/login`, `/register`, account pages)
- **Run**: `npm run dev:portal` → http://127.0.0.1:3004

### `website`

- **Type**: Static public website
- **Entry**: `uis/website/index.html`
- **Related**: `uis/website/application.html` — Brasa Points signup
- **Run**: `npm run dev:website` → http://127.0.0.1:3001

### `backoffice`

- **Type**: Internal operations overview (incidents, talent, executive panels)
- **Entry**: `uis/backoffice/index.html`
- **Run**: `npm run dev:backoffice` → http://127.0.0.1:3002

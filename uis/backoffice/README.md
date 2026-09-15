# Brasaland Backoffice (Next.js)

Internal operations UI for Felipe Guerrero / Brasaland Digital — ingredient inventory,
supplier deliveries (IngredientEntry), and consumption/waste exits (IngredientExit).

## Run

```bash
cp .env.example .env.local
npm install
npm run dev
```

App: http://127.0.0.1:3002  
Login: http://127.0.0.1:3002/login  
Ingredients: http://127.0.0.1:3002/backoffice/inventory/products

From monorepo root: `npm run dev:backoffice`

## Auth

JWT stored as `brasaland_token` (same key as `uis/portal`). Sign in against
`POST /auth/login` on the central API. Inventory routes send `Authorization: Bearer`.

## Legacy static UI

Pre-Next.js HTML panels live under `legacy/` (incidents, suppliers overview).
Serve with: `npm run dev:backoffice:legacy` from the monorepo root.

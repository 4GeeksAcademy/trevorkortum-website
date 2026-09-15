/**
 * Brasaland Inventory API client (Milestone 5).
 *
 * Domain vocabulary (from CONTEXT-backend.md):
 * - Ingredient  → API path segment `/products` (README "Product")
 * - IngredientEntry → inbound delivery (`POST /inventory/orders/inbound`)
 * - IngredientExit  → outbound consumption/waste (`POST /inventory/orders/outbound`)
 * - current_stock   → computed SUM(entries) − SUM(exits); never stored
 *
 * Auth: reuses the portal JWT in localStorage (`brasaland_token`) so ops staff
 * who sign in via the backoffice or portal can call protected `/inventory` routes.
 */

const INVENTORY_API_BASE = (
  process.env.NEXT_PUBLIC_INVENTORY_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://127.0.0.1:8000"
).replace(/\/$/, "");

/** Same key as `uis/portal/src/lib/api.ts` — shared browser session. */
const TOKEN_KEY = "brasaland_token";

export type IngredientCategory =
  | "meat"
  | "produce"
  | "sauce"
  | "beverage"
  | "packaging"
  | "cleaning";

export type IngredientCountry = "CO" | "US";

export type ExitReason = "consumption" | "waste";

/** Ingredient master data + computed current_stock (read model). */
export type Ingredient = {
  id: number;
  name: string;
  sku: string;
  unit: string;
  category: IngredientCategory | string;
  country: IngredientCountry | string;
  current_stock: number;
};

export type InboundDeliveryCreate = {
  ingredient_id: number;
  quantity: number;
  supplier_name: string;
  /** Receiving location (1–14). Not a FK. */
  location_id: number;
};

export type OutboundExitCreate = {
  ingredient_id: number;
  quantity: number;
  reason: ExitReason;
  /** Location where the exit occurred (1–14). */
  location_id: number;
};

/** IngredientEntry — supplier delivery (inbound). */
export type IngredientEntry = {
  id: number;
  ingredient_id: number;
  quantity: number;
  supplier_name: string;
  location_id: number;
  created_at: string;
  user_uuid: string;
  order_type: "inbound";
  ingredient?: Ingredient | null;
};

/** IngredientExit — consumption or waste (outbound). */
export type IngredientExit = {
  id: number;
  ingredient_id: number;
  quantity: number;
  reason: ExitReason | string;
  location_id: number;
  created_at: string;
  user_uuid: string;
  order_type: "outbound";
  ingredient?: Ingredient | null;
};

export type InventoryOrder = IngredientEntry | IngredientExit;

export class InventoryApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "InventoryApiError";
    this.status = status;
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function extractDetail(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const detail = (data as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail.trim();
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item) {
          const msg = (item as { msg?: unknown }).msg;
          return typeof msg === "string" ? msg : "";
        }
        return "";
      })
      .filter(Boolean)
      .join("; ");
  }
  return "";
}

async function inventoryFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAuthToken();
  if (!token) {
    throw new InventoryApiError("Not authenticated", 401);
  }
  headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${INVENTORY_API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new InventoryApiError(
      "Unable to reach the inventory API. Check your connection and try again.",
      0
    );
  }

  const data: unknown = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail = extractDetail(data);
    // Prefer FastAPI `detail` so insufficient-stock (HTTP 400) and validation
    // messages surface verbatim in the UI instead of a generic failure string.
    const message =
      detail ||
      (res.status >= 500
        ? "Inventory service error. Please try again later."
        : `Inventory request failed (${res.status}).`);
    throw new InventoryApiError(message, res.status);
  }

  return data as T;
}

/** GET /inventory/products — all ingredients with computed current_stock. */
export function listIngredients(): Promise<Ingredient[]> {
  return inventoryFetch<Ingredient[]>("/inventory/products");
}

/** GET /inventory/products/{id} — one ingredient + current_stock. */
export function getIngredient(ingredientId: number): Promise<Ingredient> {
  return inventoryFetch<Ingredient>(`/inventory/products/${ingredientId}`);
}

/**
 * POST /inventory/orders/inbound — log an IngredientEntry (supplier delivery).
 * Server stamps user_uuid from the JWT subject (TinyDB user id).
 */
export function createInboundDelivery(
  payload: InboundDeliveryCreate
): Promise<IngredientEntry> {
  return inventoryFetch<IngredientEntry>("/inventory/orders/inbound", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * POST /inventory/orders/outbound — log an IngredientExit (consumption/waste).
 * Server rejects with HTTP 400 if quantity would drive current_stock negative.
 */
export function createOutboundExit(
  payload: OutboundExitCreate
): Promise<IngredientExit> {
  return inventoryFetch<IngredientExit>("/inventory/orders/outbound", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** GET /inventory/orders — IngredientEntry + IngredientExit history. */
export function listOrders(): Promise<InventoryOrder[]> {
  return inventoryFetch<InventoryOrder[]>("/inventory/orders");
}

/**
 * Stock-level classification for ingredient UI indicators.
 *
 * Threshold logic (ingredient units as returned by current_stock):
 * - critical: current_stock <= 0          → out / depleted
 * - low:      0 < current_stock < 10      → reorder attention
 * - healthy:  current_stock >= 10         → adequate on-hand
 *
 * Thresholds are intentionally simple for this milestone; kitchen UOM differs
 * by ingredient (kg / litre / unit) but ops use one visual band across the list.
 */
export type StockLevel = "critical" | "low" | "healthy";

export const STOCK_LOW_THRESHOLD = 10;

export function getStockLevel(currentStock: number): StockLevel {
  if (currentStock <= 0) return "critical";
  if (currentStock < STOCK_LOW_THRESHOLD) return "low";
  return "healthy";
}

export { INVENTORY_API_BASE, TOKEN_KEY };

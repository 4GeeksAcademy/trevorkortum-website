"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Ingredient,
  InventoryApiError,
  getStockLevel,
  listIngredients,
  STOCK_LOW_THRESHOLD,
  StockLevel,
} from "@/lib/inventory";

function countryLabel(country: string): string {
  if (country === "CO") return "Colombia (CO)";
  if (country === "US") return "United States (US)";
  return country;
}

function stockLabel(level: StockLevel): string {
  if (level === "critical") return "Out of stock";
  if (level === "low") return "Low stock";
  return "Healthy";
}

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setIngredients(await listIngredients());
    } catch (err) {
      const message =
        err instanceof InventoryApiError
          ? err.message
          : "Unable to load ingredients.";
      setError(message);
      setIngredients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="panel">
      <p className="muted">Felipe Guerrero · Restaurant Operations</p>
      <h1>Ingredients</h1>
      <p className="muted">
        <code>current_stock</code> is computed as deliveries (IngredientEntry)
        minus exits (IngredientExit). It is never edited here.
      </p>
      <p className="muted">
        {/* Documented for ops reviewers: same bands as getStockLevel() */}
        Stock bands: critical ≤ 0 · low &lt; {STOCK_LOW_THRESHOLD} · healthy ≥{" "}
        {STOCK_LOW_THRESHOLD} (per ingredient unit).
      </p>

      {error ? (
        <div className="banner error" role="alert">
          {error}{" "}
          <button type="button" className="linkish" onClick={() => void load()}>
            Retry
          </button>
        </div>
      ) : null}

      {loading ? <p className="muted">Loading ingredients…</p> : null}

      {!loading && !error ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Country</th>
                <th>Unit</th>
                <th>Current stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="muted">
                    No ingredients yet. Seed inventory or create via API.
                  </td>
                </tr>
              ) : (
                ingredients.map((item) => {
                  const level = getStockLevel(item.current_stock);
                  return (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>
                        <code>{item.sku}</code>
                      </td>
                      <td>{item.category}</td>
                      <td>{countryLabel(item.country)}</td>
                      <td>{item.unit}</td>
                      <td>
                        {item.current_stock} {item.unit}
                      </td>
                      <td>
                        <span className={`badge ${level}`} title={stockLabel(level)}>
                          {level === "healthy" ? "●" : level === "low" ? "▲" : "✕"}{" "}
                          {stockLabel(level)}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <Link
                            href={`/backoffice/inventory/orders/inbound?ingredient_id=${item.id}`}
                          >
                            Inbound
                          </Link>
                          <Link
                            href={`/backoffice/inventory/orders/outbound?ingredient_id=${item.id}`}
                          >
                            Outbound
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </main>
  );
}

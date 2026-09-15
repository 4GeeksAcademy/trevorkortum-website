"use client";

import { useCallback, useEffect, useState } from "react";
import {
  InventoryApiError,
  InventoryOrder,
  listOrders,
} from "@/lib/inventory";

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<InventoryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setOrders(await listOrders());
    } catch (err) {
      setError(
        err instanceof InventoryApiError
          ? err.message
          : "Unable to load order history."
      );
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="panel">
      <p className="muted">Read-only ledger · IngredientEntry + IngredientExit</p>
      <h1>Order history</h1>
      <p className="muted">
        Inbound deliveries and outbound exits with ingredient name, quantity,
        order type, created date, and <code>user_uuid</code>.
      </p>

      {error ? (
        <div className="banner error" role="alert">
          {error}{" "}
          <button type="button" className="linkish" onClick={() => void load()}>
            Retry
          </button>
        </div>
      ) : null}

      {loading ? <p className="muted">Loading orders…</p> : null}

      {!loading && !error ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Ingredient</th>
                <th>Quantity</th>
                <th>Details</th>
                <th>Created</th>
                <th>user_uuid</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted">
                    No deliveries or exits logged yet.
                  </td>
                </tr>
              ) : (
                orders.map((row) => {
                  const name =
                    row.ingredient?.name || `Ingredient #${row.ingredient_id}`;
                  const unit = row.ingredient?.unit || "";
                  const isInbound = row.order_type === "inbound";
                  return (
                    <tr key={`${row.order_type}-${row.id}`}>
                      <td>
                        <span
                          className={`badge ${isInbound ? "inbound" : "outbound"}`}
                        >
                          {isInbound ? "↓ inbound" : "↑ outbound"}
                        </span>
                      </td>
                      <td>{name}</td>
                      <td>
                        {row.quantity}
                        {unit ? ` ${unit}` : ""}
                      </td>
                      <td>
                        {isInbound
                          ? `Supplier: ${row.supplier_name} · Loc ${row.location_id}`
                          : `Reason: ${row.reason} · Loc ${row.location_id}`}
                      </td>
                      <td>{formatWhen(row.created_at)}</td>
                      <td>
                        <code className="uuid">{row.user_uuid}</code>
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

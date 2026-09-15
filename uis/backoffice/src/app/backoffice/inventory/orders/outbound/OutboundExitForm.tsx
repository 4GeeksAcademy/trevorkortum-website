"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ExitReason,
  Ingredient,
  InventoryApiError,
  createOutboundExit,
  getIngredient,
  listIngredients,
} from "@/lib/inventory";

const LOCATION_IDS = Array.from({ length: 14 }, (_, i) => i + 1);

export default function OutboundExitForm() {
  const searchParams = useSearchParams();
  const presetId = searchParams.get("ingredient_id");

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");
  const [ingredientId, setIngredientId] = useState("");
  const [availableStock, setAvailableStock] = useState<number | null>(null);
  const [stockUnit, setStockUnit] = useState("");
  const [stockLoading, setStockLoading] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState<ExitReason>("consumption");
  const [locationId, setLocationId] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  /** API/client errors tied to the quantity field (e.g. HTTP 400 insufficient stock). */
  const [quantityError, setQuantityError] = useState("");

  const loadIngredients = useCallback(async () => {
    setLoadingList(true);
    setListError("");
    try {
      setIngredients(await listIngredients());
    } catch (err) {
      setListError(
        err instanceof InventoryApiError
          ? err.message
          : "Unable to load ingredients."
      );
      setIngredients([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadIngredients();
  }, [loadIngredients]);

  useEffect(() => {
    if (presetId) setIngredientId(presetId);
  }, [presetId]);

  useEffect(() => {
    const id = Number(ingredientId);
    if (!id) {
      setAvailableStock(null);
      setStockUnit("");
      return;
    }
    let cancelled = false;
    setStockLoading(true);
    void getIngredient(id)
      .then((item) => {
        if (cancelled) return;
        setAvailableStock(item.current_stock);
        setStockUnit(item.unit);
      })
      .catch((err) => {
        if (cancelled) return;
        setAvailableStock(null);
        setError(
          err instanceof InventoryApiError
            ? err.message
            : "Unable to load current stock."
        );
      })
      .finally(() => {
        if (!cancelled) setStockLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ingredientId]);

  const selected = useMemo(
    () => ingredients.find((i) => String(i.id) === ingredientId),
    [ingredients, ingredientId]
  );

  const qtyValue = Number(quantity);
  const exceedsStock =
    availableStock !== null &&
    Number.isFinite(qtyValue) &&
    qtyValue > 0 &&
    qtyValue > availableStock;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setQuantityError("");
    setSuccess("");
    const id = Number(ingredientId);
    const qty = Number(quantity);
    const loc = Number(locationId);
    if (!id || !(qty > 0) || loc < 1 || loc > 14) {
      setError(
        "Select an ingredient and enter a valid quantity and location (1–14)."
      );
      return;
    }
    if (availableStock !== null && qty > availableStock) {
      setQuantityError(
        `Requested quantity (${qty}) exceeds available stock (${availableStock} ${stockUnit}).`
      );
      return;
    }

    setSubmitting(true);
    try {
      const exit = await createOutboundExit({
        ingredient_id: id,
        quantity: qty,
        reason,
        location_id: loc,
      });
      setSuccess(
        `Outbound exit logged for ${exit.ingredient?.name || selected?.name || "ingredient"} (${exit.quantity} ${exit.ingredient?.unit || stockUnit}, ${exit.reason}).`
      );
      setQuantity("");
      setReason("consumption");
      setLocationId("1");
      setQuantityError("");
      const refreshed = await getIngredient(id);
      setAvailableStock(refreshed.current_stock);
      setStockUnit(refreshed.unit);
    } catch (err) {
      const message =
        err instanceof InventoryApiError
          ? err.message
          : "Unable to log outbound exit.";
      // Surface insufficient-stock (HTTP 400) and related failures beside quantity.
      if (err instanceof InventoryApiError && (err.status === 400 || err.status === 422)) {
        setQuantityError(message);
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="panel">
      <p className="muted">Consumption or waste · IngredientExit</p>
      <h1>Outbound exit</h1>
      <p className="muted">
        Exits cannot drive <code>current_stock</code> negative. The API returns
        HTTP 400 when stock is insufficient.
      </p>

      {success ? (
        <div className="banner success" role="status">
          {success}
        </div>
      ) : null}
      {error ? (
        <div className="banner error" role="alert">
          {error}
        </div>
      ) : null}
      {listError ? (
        <div className="banner error" role="alert">
          {listError}{" "}
          <button
            type="button"
            className="linkish"
            onClick={() => void loadIngredients()}
          >
            Retry
          </button>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="inventory-form">
        <label>
          Ingredient
          <select
            value={ingredientId}
            onChange={(e) => {
              setIngredientId(e.target.value);
              setError("");
              setQuantityError("");
              setSuccess("");
            }}
            required
            disabled={loadingList || Boolean(listError)}
          >
            <option value="">Select by name…</option>
            {ingredients.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.sku})
              </option>
            ))}
          </select>
        </label>

        {ingredientId ? (
          <p className="muted" aria-live="polite">
            {stockLoading
              ? "Loading available stock…"
              : availableStock === null
                ? "Stock unavailable."
                : `Available current_stock: ${availableStock} ${stockUnit}`}
          </p>
        ) : null}

        <label>
          Quantity
          <input
            type="number"
            min="0.01"
            step="any"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              setQuantityError("");
            }}
            required
            aria-invalid={Boolean(quantityError) || exceedsStock}
            aria-describedby={
              quantityError || exceedsStock ? "quantity-feedback" : undefined
            }
          />
        </label>

        {exceedsStock ? (
          <p id="quantity-feedback" className="error" role="status">
            Warning: requested quantity exceeds available stock (
            {availableStock} {stockUnit}).
          </p>
        ) : quantityError ? (
          <p id="quantity-feedback" className="error" role="alert">
            {quantityError}
          </p>
        ) : null}

        <label>
          Reason
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as ExitReason)}
            required
          >
            <option value="consumption">consumption</option>
            <option value="waste">waste</option>
          </select>
        </label>

        <label>
          Location (1–14)
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            required
          >
            {LOCATION_IDS.map((id) => (
              <option key={id} value={id}>
                Location {id}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={submitting || loadingList || stockLoading || exceedsStock}
        >
          {submitting ? "Logging exit…" : "Log outbound exit"}
        </button>
      </form>
    </main>
  );
}

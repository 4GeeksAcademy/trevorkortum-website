"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Ingredient,
  InventoryApiError,
  createInboundDelivery,
  listIngredients,
} from "@/lib/inventory";

const LOCATION_IDS = Array.from({ length: 14 }, (_, i) => i + 1);

export default function InboundDeliveryForm() {
  const searchParams = useSearchParams();
  const presetId = searchParams.get("ingredient_id");

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");
  const [ingredientId, setIngredientId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [locationId, setLocationId] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

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

  const selected = useMemo(
    () => ingredients.find((i) => String(i.id) === ingredientId),
    [ingredients, ingredientId]
  );

  function resetForm() {
    setIngredientId("");
    setQuantity("");
    setSupplierName("");
    setLocationId("1");
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const id = Number(ingredientId);
    const qty = Number(quantity);
    const loc = Number(locationId);
    if (!id || !(qty > 0) || !supplierName.trim() || loc < 1 || loc > 14) {
      setError(
        "Select an ingredient and enter a valid quantity, supplier, and location (1–14)."
      );
      return;
    }

    setSubmitting(true);
    try {
      const entry = await createInboundDelivery({
        ingredient_id: id,
        quantity: qty,
        supplier_name: supplierName.trim(),
        location_id: loc,
      });
      setSuccess(
        `Inbound delivery logged for ${entry.ingredient?.name || selected?.name || "ingredient"} (${entry.quantity} ${entry.ingredient?.unit || selected?.unit || ""}).`
      );
      resetForm();
    } catch (err) {
      setError(
        err instanceof InventoryApiError
          ? err.message
          : "Unable to log inbound delivery."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="panel">
      <p className="muted">Supplier delivery · IngredientEntry</p>
      <h1>Inbound delivery</h1>
      <p className="muted">
        Record what arrived from a supplier. Stock updates as the net of all
        entries and exits.
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
            onChange={(e) => setIngredientId(e.target.value)}
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

        {selected ? (
          <p className="muted">
            Unit: {selected.unit} · Current stock: {selected.current_stock}{" "}
            {selected.unit}
          </p>
        ) : null}

        <label>
          Quantity received
          <input
            type="number"
            min="0.01"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </label>

        <label>
          Supplier name
          <input
            type="text"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            placeholder="e.g. Carnes del Valle S.A."
            required
            minLength={1}
          />
        </label>

        <label>
          Receiving location (1–14)
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

        <button type="submit" disabled={submitting || loadingList}>
          {submitting ? "Logging delivery…" : "Log inbound delivery"}
        </button>
      </form>
    </main>
  );
}

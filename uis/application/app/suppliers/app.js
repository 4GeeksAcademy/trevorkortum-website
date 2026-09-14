const API_BASE = window.BRASALAND_API_BASE || "http://127.0.0.1:8000";

let allSuppliers = [];

function formatSupplierRate(supplier) {
  const locale = supplier.country === "Colombia" ? "es-CO" : "en-US";
  const amount = Number(supplier.rate_per_unit).toLocaleString(locale, {
    minimumFractionDigits: supplier.currency === "COP" ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${supplier.currency} ${amount}`;
}

function setSupplierFeedback(id, message, isError = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("error", isError);
}

function formatApiDetail(detail) {
  if (!detail) return "Request failed.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const loc = Array.isArray(item.loc) ? item.loc.slice(1).join(".") : "";
        return loc ? `${loc}: ${item.msg}` : item.msg;
      })
      .join("; ");
  }
  return JSON.stringify(detail);
}

function filteredSuppliers() {
  const country = document.getElementById("filter-supplier-country")?.value || "";
  const category = document.getElementById("filter-supplier-category")?.value || "";
  return allSuppliers.filter((supplier) => {
    if (country && supplier.country !== country) return false;
    if (category && !(supplier.categories || []).includes(category)) return false;
    return true;
  });
}

function renderSuppliersTable() {
  const tbody = document.getElementById("suppliers-table-body");
  if (!tbody) return;

  const rows = filteredSuppliers();
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="10">No suppliers match the current filters.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map((supplier) => {
      const isActive = supplier.status === "active";
      const statusClass = isActive ? "active-status" : "suspended";
      const toggleLabel = isActive ? "Suspend" : "Activate";
      const toggleClass = isActive ? "active-state" : "suspended";
      const updatedAt = supplier.updated_at
        ? new Date(supplier.updated_at).toLocaleString(
            supplier.country === "Colombia" ? "es-CO" : "en-US"
          )
        : "—";
      return `
      <tr data-supplier-id="${supplier.id}">
        <td><strong>${supplier.name}</strong></td>
        <td>${supplier.country}</td>
        <td>${(supplier.categories || []).join(", ")}</td>
        <td>
          <div class="inline-rate">
            <span>${formatSupplierRate(supplier)}</span>
            <input type="number" step="any" min="0.01" value="${supplier.rate_per_unit}" aria-label="New rate for ${supplier.name}" />
            <button type="button" data-action="update-rate">Save rate</button>
          </div>
        </td>
        <td>${supplier.currency || "—"}</td>
        <td>${updatedAt}</td>
        <td><span class="tag ${statusClass}">${supplier.status}</span></td>
        <td>${supplier.contact_email || "—"}</td>
        <td class="notes-cell">${supplier.notes || "—"}</td>
        <td>
          <button type="button" class="btn-status-toggle ${toggleClass}" data-action="toggle-status" data-next-status="${isActive ? "suspended" : "active"}">
            ${toggleLabel}
          </button>
        </td>
      </tr>`;
    })
    .join("");
}

async function loadSuppliers() {
  setSupplierFeedback("supplier-list-feedback", "Loading suppliers…");
  try {
    const response = await fetch(`${API_BASE}/suppliers`);
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(formatApiDetail(payload && payload.detail));
    }
    allSuppliers = Array.isArray(payload) ? payload : [];
    renderSuppliersTable();
    setSupplierFeedback("supplier-list-feedback", `${allSuppliers.length} suppliers loaded.`);
  } catch (error) {
    allSuppliers = [];
    renderSuppliersTable();
    setSupplierFeedback(
      "supplier-list-feedback",
      `Could not load suppliers. Start the API (npm run dev:api) then refresh. (${error.message})`,
      true
    );
  }
}

async function updateSupplierRate(supplierId, rateValue) {
  const rate = Number(rateValue);
  if (!(rate > 0)) {
    setSupplierFeedback("supplier-list-feedback", "Rate must be greater than 0.", true);
    return;
  }

  const response = await fetch(`${API_BASE}/suppliers/${supplierId}/rate`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rate_per_unit: rate }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(formatApiDetail(payload && payload.detail));
  }

  const index = allSuppliers.findIndex((item) => item.id === supplierId);
  if (index >= 0) allSuppliers[index] = payload;
  else allSuppliers.push(payload);
  renderSuppliersTable();
  setSupplierFeedback("supplier-list-feedback", `Updated rate for ${payload.name}.`);
}

async function updateSupplierStatus(supplierId, status) {
  const response = await fetch(`${API_BASE}/suppliers/${supplierId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(formatApiDetail(payload && payload.detail));
  }

  const index = allSuppliers.findIndex((item) => item.id === supplierId);
  if (index >= 0) allSuppliers[index] = payload;
  else allSuppliers.push(payload);
  renderSuppliersTable();
  setSupplierFeedback("supplier-list-feedback", `${payload.name} is now ${payload.status}.`);
}

document.getElementById("suppliers-table-body")?.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const row = button.closest("tr[data-supplier-id]");
  if (!row) return;
  const supplierId = Number(row.dataset.supplierId);

  try {
    if (button.dataset.action === "update-rate") {
      const input = row.querySelector("input[type='number']");
      await updateSupplierRate(supplierId, input?.value);
    }
    if (button.dataset.action === "toggle-status") {
      await updateSupplierStatus(supplierId, button.dataset.nextStatus);
    }
  } catch (error) {
    setSupplierFeedback("supplier-list-feedback", error.message, true);
  }
});

["filter-supplier-country", "filter-supplier-category"].forEach((id) => {
  document.getElementById(id)?.addEventListener("change", () => renderSuppliersTable());
});

document.getElementById("btn-refresh-suppliers")?.addEventListener("click", () => {
  loadSuppliers();
});

document.getElementById("supplier-country")?.addEventListener("change", (event) => {
  const currency = document.getElementById("supplier-currency");
  if (!currency) return;
  currency.value = event.target.value === "USA" ? "USD" : "COP";
});

document.getElementById("supplier-create-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const name = form.name.value.trim();
  const country = form.country.value;
  const currency = form.currency.value;
  const rate = Number(form.rate_per_unit.value);
  const status = form.status.value;
  const contactEmail = form.contact_email.value.trim();
  const notes = form.notes.value.trim();
  const categories = Array.from(form.querySelectorAll("input[name='categories']:checked")).map(
    (input) => input.value
  );

  if (!name) {
    setSupplierFeedback("supplier-form-feedback", "Name is required.", true);
    return;
  }
  if (!categories.length) {
    setSupplierFeedback("supplier-form-feedback", "Select at least one category.", true);
    return;
  }
  if (!(rate > 0)) {
    setSupplierFeedback("supplier-form-feedback", "Rate must be greater than 0.", true);
    return;
  }
  if ((country === "Colombia" && currency !== "COP") || (country === "USA" && currency !== "USD")) {
    setSupplierFeedback(
      "supplier-form-feedback",
      "Currency must be COP for Colombia and USD for USA.",
      true
    );
    return;
  }

  const body = {
    name,
    country,
    categories,
    rate_per_unit: rate,
    currency,
    status,
  };
  if (contactEmail) body.contact_email = contactEmail;
  if (notes) body.notes = notes;

  setSupplierFeedback("supplier-form-feedback", "Creating supplier…");
  try {
    const response = await fetch(`${API_BASE}/suppliers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(formatApiDetail(payload && payload.detail));
    }
    allSuppliers.push(payload);
    renderSuppliersTable();
    form.reset();
    document.getElementById("supplier-currency").value = "COP";
    setSupplierFeedback("supplier-form-feedback", `Created ${payload.name}.`);
  } catch (error) {
    setSupplierFeedback("supplier-form-feedback", error.message, true);
  }
});

loadSuppliers();

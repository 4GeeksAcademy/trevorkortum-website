const navLinks = document.querySelectorAll(".sidebar nav a");

function setActive(hash) {
  navLinks.forEach((link) => {
    const isMatch = hash ? link.getAttribute("href") === hash : link.getAttribute("href") === "#operations";
    link.classList.toggle("active", isMatch);
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const href = link.getAttribute("href");
    if (href.startsWith("#")) setActive(href);
  });
});

setActive(window.location.hash || "#operations");

// --- Incident Analysis ---
const API_BASE = window.BRASALAND_API_BASE || "http://127.0.0.1:8000";
const VALID_CATEGORIES = new Set(["CUSTOMER_COMPLAINT", "EQUIPMENT", "SUPPLY", "FOOD_QUALITY", "STAFF"]);
const VALID_LOCATIONS = new Set([
  ...Array.from({ length: 10 }, (_, i) => `COL-${String(i + 1).padStart(2, "0")}`),
  ...Array.from({ length: 4 }, (_, i) => `FLA-${String(i + 1).padStart(2, "0")}`),
]);
const RULE_LABELS = {
  missing_location: "Missing location_id",
  invalid_category: "Invalid or missing category",
  empty_description: "Empty description",
  missing_reporter: "Missing reporter_id",
  closed_no_score: "Closed case, no score",
  score_out_of_range: "Score out of range",
};

let currentIncidents = [];
let latestSummary = null;
let usedApiForLatest = false;
let activeFilter = "all";

function asText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function validateRecord(row) {
  const errors = [];
  const location = asText(row.location_id);
  if (!VALID_LOCATIONS.has(location)) errors.push(RULE_LABELS.missing_location);

  const category = asText(row.category);
  if (!VALID_CATEGORIES.has(category)) errors.push(RULE_LABELS.invalid_category);

  const description = asText(row.description);
  if (description.length < 5) errors.push(RULE_LABELS.empty_description);

  const reporter = asText(row.reporter_id);
  if (!reporter) errors.push(RULE_LABELS.missing_reporter);

  const status = asText(row.status);
  const scoreRaw = asText(row.satisfaction_score);

  if (status === "CLOSED" && !scoreRaw) {
    errors.push(RULE_LABELS.closed_no_score);
  } else if (scoreRaw) {
    const score = parseInt(scoreRaw, 10);
    if (Number.isNaN(score) || score < 1 || score > 5) errors.push(RULE_LABELS.score_out_of_range);
  }

  return { isValid: errors.length === 0, errors };
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field.trim());
      if (row.some((value) => value)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  row.push(field.trim());
  if (row.some((value) => value)) rows.push(row);
  if (rows.length < 2) return [];

  const headers = rows[0].map((header) => header.replace(/^\uFEFF/, "").trim());
  return rows.slice(1).map((values) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || "";
    });
    return record;
  });
}

function computeMetricsLocal(data) {
  const total = data.length;
  let validCount = 0;
  const categories = {};
  const statuses = {};
  const invalidRules = {};
  const scores = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let closedValid = 0;
  let scoredCount = 0;

  data.forEach((item) => {
    const { isValid, errors } = validateRecord(item);
    item._validation = { isValid, errors };

    if (!isValid) {
      errors.forEach((err) => {
        invalidRules[err] = (invalidRules[err] || 0) + 1;
      });
      return;
    }

    validCount += 1;
    categories[item.category] = (categories[item.category] || 0) + 1;
    statuses[item.status] = (statuses[item.status] || 0) + 1;

    if (item.status === "CLOSED") {
      closedValid += 1;
      const score = parseInt(item.satisfaction_score, 10);
      if (!Number.isNaN(score) && scores[score] !== undefined) {
        scores[score] += 1;
        scoredCount += 1;
      }
    }
  });

  const totalScorePoints = Object.entries(scores).reduce((sum, [s, c]) => sum + Number(s) * c, 0);
  const avgSatisfaction = scoredCount > 0 ? (totalScorePoints / scoredCount).toFixed(2) : "0.00";

  return {
    total,
    validCount,
    invalidCount: total - validCount,
    categories,
    statuses,
    invalidRules,
    scores,
    closedValid,
    scoredCount,
    avgSatisfaction,
  };
}

function summaryFromApiPayload(payload) {
  const scores = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  Object.entries(payload.score_counts || {}).forEach(([score, count]) => {
    scores[Number(score)] = count;
  });

  return {
    total: payload.total,
    validCount: payload.valid_count,
    invalidCount: payload.invalid_count,
    categories: payload.category_counts || {},
    statuses: payload.status_counts || {},
    invalidRules: payload.rule_counts || {},
    scores,
    closedValid: payload.closed_valid,
    scoredCount: payload.scored_cases,
    avgSatisfaction: Number(payload.avg_score).toFixed(2),
  };
}

function recordsFromApiPayload(payload) {
  return (payload.records || []).map((row) => ({
    ...row,
    _validation: {
      isValid: Boolean(row.is_valid),
      errors: row.errors || [],
    },
  }));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function pctOf(count, total) {
  if (!total) return "0.0";
  return ((count / total) * 100).toFixed(1);
}

function renderDashboardFromSummary(summary, records, filename) {
  currentIncidents = records;
  latestSummary = summary;

  setText("loaded-filename", filename);
  setText("loaded-file-meta", `(${summary.total} records processed)`);
  setText("metric-total-records", summary.total);
  setText("metric-valid-records", summary.validCount);
  setText("metric-invalid-records", summary.invalidCount);
  setText("metric-avg-satisfaction", summary.avgSatisfaction);
  setText("metric-satisfaction-sub", `${summary.scoredCount} scored closed cases (/ 5.00)`);
  setText("metric-valid-pct", `${pctOf(summary.validCount, summary.total)}% valid`);
  setText("metric-invalid-pct", `${pctOf(summary.invalidCount, summary.total)}% flagged`);
  setText("count-all", summary.total);
  setText("count-valid", summary.validCount);
  setText("count-invalid", summary.invalidCount);

  const catList = document.getElementById("category-breakdown-list");
  if (catList) {
    catList.innerHTML = Object.entries(summary.categories)
      .map(([cat, count]) => `<li class="breakdown-item"><span>${cat}</span><strong>${count} (${pctOf(count, summary.validCount)}%)</strong></li>`)
      .join("");
  }

  const statusList = document.getElementById("status-breakdown-list");
  if (statusList) {
    statusList.innerHTML = Object.entries(summary.statuses)
      .map(([status, count]) => `<li class="breakdown-item"><span>${status}</span><strong>${count} (${pctOf(count, summary.validCount)}%)</strong></li>`)
      .join("");
  }

  const invalidList = document.getElementById("invalid-rules-list");
  if (invalidList) {
    const entries = Object.entries(summary.invalidRules);
    invalidList.innerHTML = entries.length
      ? entries.map(([rule, count]) => `<li class="breakdown-item"><span>${rule}</span><strong style="color:var(--red);">${count}</strong></li>`).join("")
      : '<li class="breakdown-item"><span>No validation errors</span></li>';
  }

  const satList = document.getElementById("satisfaction-breakdown-list");
  if (satList) {
    const starLabels = { 1: "★☆☆☆☆ (1)", 2: "★★☆☆☆ (2)", 3: "★★★☆☆ (3)", 4: "★★★★☆ (4)", 5: "★★★★★ (5)" };
    satList.innerHTML = Object.entries(summary.scores)
      .map(([score, count]) => `<li class="breakdown-item"><span>${starLabels[score]}</span><strong>${count}</strong></li>`)
      .join("");
  }

  renderTable();
}

function renderTable() {
  const tbody = document.getElementById("incidents-table-body");
  if (!tbody) return;

  const filtered = currentIncidents.filter((item) => {
    if (activeFilter === "valid") return item._validation.isValid;
    if (activeFilter === "invalid") return !item._validation.isValid;
    return true;
  });

  tbody.innerHTML = filtered
    .slice(0, 50)
    .map(
      (row) => `
    <tr>
      <td><strong>${row.incident_id || "—"}</strong></td>
      <td>${row.location_id || "—"}</td>
      <td>${row.category || "—"}</td>
      <td>${row.description || "—"}</td>
      <td><span class="tag ${row.status === "CLOSED" ? "good" : row.status === "OPEN" ? "warn" : "danger"}">${row.status || "—"}</span></td>
      <td>${row.satisfaction_score ? `${row.satisfaction_score} / 5` : "—"}</td>
      <td>${row.reporter_id || "—"}</td>
      <td><span class="tag ${row._validation.isValid ? "good" : "danger"}">${row._validation.isValid ? "Valid" : row._validation.errors[0]}</span></td>
    </tr>
  `
    )
    .join("");
}

const REQUIRED_INCIDENT_COLUMNS = [
  "incident_id",
  "location_id",
  "category",
  "description",
  "status",
  "satisfaction_score",
  "reporter_id",
];

const fileInput = document.getElementById("incident-csv-input");
const dropzone = document.getElementById("csv-dropzone");
const uploadFeedback = document.getElementById("upload-feedback");

function setUploadFeedback(message, isError = false) {
  if (!uploadFeedback) return;
  uploadFeedback.textContent = message;
  uploadFeedback.classList.toggle("error", isError);
}

function applyLocalAnalysis(data, filename, note) {
  usedApiForLatest = false;
  const summary = computeMetricsLocal(data);
  renderDashboardFromSummary(summary, data, filename);
  setUploadFeedback(note);
}

async function analyzeViaApi(file) {
  const formData = new FormData();
  formData.append("file", file, file.name);

  const response = await fetch(`${API_BASE}/api/incidents/analyze`, {
    method: "POST",
    body: formData,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const detail = payload && payload.detail ? payload.detail : `HTTP ${response.status}`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }

  usedApiForLatest = true;
  const summary = summaryFromApiPayload(payload);
  const records = recordsFromApiPayload(payload);
  renderDashboardFromSummary(summary, records, payload.source_file || file.name);
  setUploadFeedback(`${file.name} analyzed via API. Metrics and records updated.`);
}

function analyzeFileLocally(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = parseCSV(String(event.target.result || ""));
      const columns = Object.keys(data[0] || {});
      const missingColumns = REQUIRED_INCIDENT_COLUMNS.filter((column) => !columns.includes(column));

      if (!data.length) {
        reject(new Error("The CSV has no incident records."));
        return;
      }
      if (missingColumns.length) {
        reject(new Error(`Missing required columns: ${missingColumns.join(", ")}.`));
        return;
      }

      applyLocalAnalysis(
        data,
        file.name,
        `${file.name} loaded locally (API unavailable). Metrics reflect client-side analysis.`
      );
      resolve();
    };
    reader.onerror = () => reject(new Error("The CSV could not be read."));
    reader.readAsText(file);
  });
}

async function loadIncidentFile(file) {
  if (!file || !file.name.toLowerCase().endsWith(".csv")) {
    setUploadFeedback("Choose a CSV file to analyze.", true);
    return;
  }

  activeFilter = "all";
  document.querySelectorAll(".tab-filter").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === "all");
  });

  setUploadFeedback(`Analyzing ${file.name}…`);

  try {
    await analyzeViaApi(file);
  } catch (apiError) {
    try {
      await analyzeFileLocally(file);
      setUploadFeedback(
        `${file.name} loaded locally. API note: ${apiError.message}`,
        false
      );
    } catch (localError) {
      setUploadFeedback(localError.message, true);
    }
  }
}

function buildResultsCsv(summary) {
  const rows = [
    ["metric", "value", "percentage"],
    ["total_records", summary.total, ""],
    ["valid_records", summary.validCount, ""],
    ["invalid_records", summary.invalidCount, ""],
  ];

  Object.entries(summary.invalidRules).forEach(([rule, count]) => {
    rows.push([`invalid_rule:${rule}`, count, ""]);
  });

  Object.entries(summary.categories).forEach(([cat, count]) => {
    const pct = summary.validCount ? ((count / summary.validCount) * 100).toFixed(1) : "0.0";
    rows.push([`category:${cat}`, count, `${pct}%`]);
  });

  Object.entries(summary.statuses).forEach(([status, count]) => {
    const pct = summary.validCount ? ((count / summary.validCount) * 100).toFixed(1) : "0.0";
    rows.push([`status:${status}`, count, `${pct}%`]);
  });

  rows.push(["scored_cases", summary.scoredCount, ""]);
  rows.push(["average_satisfaction_score", summary.avgSatisfaction, ""]);
  Object.entries(summary.scores).forEach(([score, count]) => {
    rows.push([`satisfaction_score:${score}`, count, ""]);
  });

  return rows
    .map((cols) =>
      cols
        .map((value) => {
          const text = String(value);
          return text.includes(",") ? `"${text}"` : text;
        })
        .join(",")
    )
    .join("\n");
}

function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function exportResultsCsv() {
  if (!latestSummary) {
    setUploadFeedback("Run an analysis before exporting results.", true);
    return;
  }

  if (usedApiForLatest) {
    try {
      const response = await fetch(`${API_BASE}/api/incidents/results/export`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail || `HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "results.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setUploadFeedback("Results CSV downloaded from API.");
      return;
    } catch (error) {
      setUploadFeedback(`API export failed (${error.message}). Falling back to local CSV.`, false);
    }
  }

  downloadTextFile("results.csv", `${buildResultsCsv(latestSummary)}\n`, "text/csv;charset=utf-8");
  setUploadFeedback("Results CSV downloaded.");
}

if (fileInput) {
  fileInput.addEventListener("change", (event) => {
    loadIncidentFile(event.target.files[0]);
    event.target.value = "";
  });
}

if (dropzone) {
  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add("dragover");
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove("dragover");
    });
  });
  dropzone.addEventListener("drop", (event) => loadIncidentFile(event.dataTransfer.files[0]));
}

document.querySelectorAll(".tab-filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-filter").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    renderTable();
  });
});

document.getElementById("btn-export-incident-csv")?.addEventListener("click", () => {
  exportResultsCsv();
});

function buildSampleRows() {
  const sampleRows = [];
  const cats = ["CUSTOMER_COMPLAINT", "EQUIPMENT", "SUPPLY", "FOOD_QUALITY", "STAFF"];
  const catDist = [29, 17, 22, 19, 9];
  let catIndex = 0;
  let countInCat = 0;

  for (let i = 1; i <= 96; i += 1) {
    if (countInCat >= catDist[catIndex]) {
      catIndex += 1;
      countInCat = 0;
    }
    countInCat += 1;
    const isClosed = i <= 50;
    const isDiscarded = i > 50 && i <= 64;
    const status = isClosed ? "CLOSED" : isDiscarded ? "DISCARDED" : "OPEN";
    const score = isClosed ? String(i <= 4 ? 1 : i <= 10 ? 2 : i <= 22 ? 3 : i <= 41 ? 4 : 5) : "";
    sampleRows.push({
      incident_id: `BRS-${String(i).padStart(6, "0")}`,
      date: "2026-08-15",
      location_id: `COL-0${(i % 9) + 1}`,
      category: cats[catIndex],
      description: "Routine reported operational incident",
      status,
      customer_id: "",
      satisfaction_score: score,
      reporter_id: "MGR-01",
    });
  }

  sampleRows.push({
    incident_id: "BRS-000097",
    date: "2026-08-15",
    location_id: "INVALID-LOC",
    category: "EQUIPMENT",
    description: "Motor issue",
    status: "OPEN",
    customer_id: "",
    satisfaction_score: "",
    reporter_id: "MGR-01",
  });
  sampleRows.push({
    incident_id: "BRS-000098",
    date: "2026-08-15",
    location_id: "COL-01",
    category: "INVALID_CAT",
    description: "Grill issue",
    status: "OPEN",
    customer_id: "",
    satisfaction_score: "",
    reporter_id: "MGR-01",
  });
  sampleRows.push({
    incident_id: "BRS-000099",
    date: "2026-08-15",
    location_id: "COL-01",
    category: "STAFF",
    description: "bad",
    status: "OPEN",
    customer_id: "",
    satisfaction_score: "",
    reporter_id: "MGR-01",
  });
  sampleRows.push({
    incident_id: "BRS-000100",
    date: "2026-08-15",
    location_id: "COL-01",
    category: "FOOD_QUALITY",
    description: "Overcooked steak",
    status: "CLOSED",
    customer_id: "",
    satisfaction_score: "",
    reporter_id: "MGR-01",
  });

  return sampleRows;
}

function sampleRowsToCsv(rows) {
  const headers = [
    "incident_id",
    "date",
    "location_id",
    "category",
    "description",
    "status",
    "customer_id",
    "satisfaction_score",
    "reporter_id",
  ];
  const lines = [headers.join(",")];
  rows.forEach((row) => {
    lines.push(headers.map((header) => String(row[header] ?? "")).join(","));
  });
  return `${lines.join("\n")}\n`;
}

async function loadSampleDataset() {
  const sampleRows = buildSampleRows();

  activeFilter = "all";
  document.querySelectorAll(".tab-filter").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === "all");
  });

  // Always paint results immediately so the panel never looks empty.
  applyLocalAnalysis(sampleRows, "incidents-brasaland.csv", "Loading sample analysis…");

  try {
    const response = await fetch(`${API_BASE}/api/incidents/analyze-sample`, {
      method: "POST",
    });
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    if (!response.ok) {
      const detail = payload && payload.detail ? payload.detail : `HTTP ${response.status}`;
      throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    }

    usedApiForLatest = true;
    const summary = summaryFromApiPayload(payload);
    const records = recordsFromApiPayload(payload);
    renderDashboardFromSummary(summary, records, payload.source_file || "incidents-brasaland.csv");
    setUploadFeedback("Sample dataset loaded from API (incidents-brasaland.csv).");
  } catch (error) {
    usedApiForLatest = false;
    setUploadFeedback(
      `Sample dataset loaded locally. Start the API (npm run dev:api) for live analyze/export. (${error.message})`
    );
  }
}

document.getElementById("btn-load-sample")?.addEventListener("click", () => {
  loadSampleDataset();
});
if (document.getElementById("incidents-table-body")) loadSampleDataset();

// --- Supplier Directory ---
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

if (document.getElementById("suppliers-table-body")) loadSuppliers();

// --- Centralized Incident Manager ---
const BRANCH_DISPLAY = {
  central: "Central (Medellín / Miami)",
  medellin_centro: "Medellín Centro",
  medellin_laureles: "Medellín Laureles",
  medellin_envigado: "Medellín Envigado",
  medellin_bello: "Medellín Bello",
  medellin_itagui: "Medellín Itagüí",
  bogota_chapinero: "Bogotá Chapinero",
  bogota_usaquen: "Bogotá Usaquén",
  cali_granada: "Cali Granada",
  barranquilla_norte: "Barranquilla Norte",
  miami_doral: "Miami Doral",
  miami_hialeah: "Miami Hialeah",
  miami_kendall: "Miami Kendall",
  orlando_international: "Orlando International Drive",
  fort_lauderdale: "Fort Lauderdale",
};

const CATEGORY_DISPLAY = {
  equipment_failure: "Equipment failure",
  supply_issue: "Supply issue",
  customer_complaint: "Customer complaint",
  staff_issue: "Staff issue",
  facility_issue: "Facility issue",
  pos_system: "POS system",
  delivery_issue: "Delivery issue",
  other: "Other",
};

const STATUS_OPTIONS = ["open", "in_progress", "resolved", "discarded"];
const STATUS_TRANSITIONS = {
  open: ["in_progress", "discarded"],
  in_progress: ["resolved", "discarded"],
  resolved: [],
  discarded: [],
};

let managedIncidents = [];

function showIncidentToast(message, isError = false) {
  let toast = document.getElementById("incident-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "incident-toast";
    toast.className = "incident-toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("visible");
  window.clearTimeout(showIncidentToast._timer);
  showIncidentToast._timer = window.setTimeout(() => {
    toast.classList.remove("visible");
  }, 3200);
}

function setIncidentFeedback(id, message, kind = "") {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("error", kind === "error");
  el.classList.toggle("success", kind === "success");
}

function clearIncidentFieldErrors() {
  document.querySelectorAll("#incident-create-form .field-error").forEach((el) => {
    el.textContent = "";
  });
}

function setIncidentFieldError(field, message) {
  const el = document.getElementById(`error-${field}`);
  if (el) el.textContent = message;
}

function allowedNextStatuses(current) {
  const next = STATUS_TRANSITIONS[current] || [];
  return [current, ...next];
}

function formatIncidentDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function loadIncidentSummary() {
  const statusEl = document.getElementById("incident-summary-status");
  const metricsEl = document.getElementById("incident-summary-metrics");
  const breakdownEl = document.getElementById("incident-summary-breakdown");
  if (!statusEl) return;

  statusEl.textContent = "Loading summary…";
  statusEl.classList.remove("error");

  try {
    const response = await fetch(`${API_BASE}/api/incidents/summary`);
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(formatApiDetail(payload && payload.detail) || `HTTP ${response.status}`);
    }

    setText("summary-total", payload.total ?? 0);
    setText("summary-open", (payload.by_status && payload.by_status.open) || 0);
    setText("summary-in-progress", (payload.by_status && payload.by_status.in_progress) || 0);
    setText("summary-resolved", (payload.by_status && payload.by_status.resolved) || 0);

    if (metricsEl) metricsEl.hidden = false;
    if (breakdownEl) {
      breakdownEl.hidden = false;
      const sections = [
        ["By category", payload.by_category || {}, CATEGORY_DISPLAY],
        ["By origin", payload.by_origin || {}, { customer: "Customer", branch: "Branch", internal: "Internal" }],
        ["By branch", payload.by_branch || {}, BRANCH_DISPLAY],
      ];
      breakdownEl.innerHTML = sections
        .map(([title, counts, labels]) => {
          const items = Object.entries(counts)
            .filter(([, count]) => count > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(
              ([key, count]) =>
                `<li class="breakdown-item"><span>${labels[key] || key}</span><strong>${count}</strong></li>`
            )
            .join("");
          return `<div class="breakdown-card"><div class="breakdown-header"><h3>${title}</h3></div><ul class="breakdown-list">${
            items || '<li class="breakdown-item"><span>No data yet</span></li>'
          }</ul></div>`;
        })
        .join("");
    }

    statusEl.textContent = `Summary updated · ${payload.total ?? 0} total`;
  } catch (error) {
    statusEl.textContent = `Summary unavailable (${error.message}). List and form still work.`;
    statusEl.classList.add("error");
    if (metricsEl) metricsEl.hidden = true;
    if (breakdownEl) breakdownEl.hidden = true;
  }
}

function renderManagedIncidents() {
  const tbody = document.getElementById("incidents-manager-body");
  if (!tbody) return;

  if (!managedIncidents.length) {
    tbody.innerHTML = `<tr><td colspan="7">No incidents match the current filters.</td></tr>`;
    return;
  }

  tbody.innerHTML = managedIncidents
    .map((incident) => {
      const options = allowedNextStatuses(incident.status)
        .map(
          (status) =>
            `<option value="${status}" ${status === incident.status ? "selected" : ""}>${status}</option>`
        )
        .join("");
      const locked = STATUS_TRANSITIONS[incident.status]?.length === 0;
      return `
      <tr data-incident-id="${incident.id}">
        <td><strong>#${incident.id}</strong></td>
        <td class="notes-cell">${incident.title}</td>
        <td>${BRANCH_DISPLAY[incident.branch] || incident.branch}</td>
        <td>${CATEGORY_DISPLAY[incident.category] || incident.category}</td>
        <td>${incident.origin}</td>
        <td>${formatIncidentDate(incident.created_at)}</td>
        <td>
          <select class="incident-status-select" data-previous="${incident.status}" ${locked ? "disabled" : ""} aria-label="Update status for incident ${incident.id}">
            ${options}
          </select>
        </td>
      </tr>`;
    })
    .join("");
}

async function loadManagedIncidents() {
  const tbody = document.getElementById("incidents-manager-body");
  if (!tbody) return;

  const status = document.getElementById("filter-incident-status")?.value || "";
  const origin = document.getElementById("filter-incident-origin")?.value || "";
  const branch = document.getElementById("filter-incident-branch")?.value || "";
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (origin) params.set("origin", origin);
  if (branch) params.set("branch", branch);

  setIncidentFeedback("incident-list-feedback", "Loading incidents…");
  tbody.innerHTML = `<tr><td colspan="7">Loading incidents…</td></tr>`;

  try {
    const query = params.toString();
    const response = await fetch(`${API_BASE}/api/incidents${query ? `?${query}` : ""}`);
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(formatApiDetail(payload && payload.detail) || `HTTP ${response.status}`);
    }
    managedIncidents = Array.isArray(payload) ? payload : [];
    renderManagedIncidents();
    if (!managedIncidents.length) {
      setIncidentFeedback("incident-list-feedback", "No incidents yet. Register one or run the seed script.");
    } else {
      setIncidentFeedback("incident-list-feedback", `${managedIncidents.length} incident(s) loaded.`);
    }
  } catch (error) {
    managedIncidents = [];
    tbody.innerHTML = `<tr><td colspan="7">Could not load incidents. Start the API (npm run dev:api), then refresh.</td></tr>`;
    setIncidentFeedback("incident-list-feedback", error.message, "error");
  }
}

async function updateManagedIncidentStatus(incidentId, selectEl) {
  const previous = selectEl.dataset.previous;
  const next = selectEl.value;
  if (next === previous) return;

  try {
    const response = await fetch(`${API_BASE}/api/incidents/${incidentId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        (payload && payload.message) ||
        formatApiDetail(payload && payload.detail) ||
        `HTTP ${response.status}`;
      throw new Error(message);
    }

    selectEl.dataset.previous = payload.status;
    const index = managedIncidents.findIndex((item) => item.id === incidentId);
    if (index >= 0) managedIncidents[index] = payload;
    renderManagedIncidents();
    loadIncidentSummary();
    showIncidentToast(`Incident #${incidentId} → ${payload.status}`);
  } catch (error) {
    selectEl.value = previous;
    showIncidentToast(`Status update failed: ${error.message}`, true);
  }
}

function syncBranchHighlight() {
  const origin = document.getElementById("incident-origin")?.value;
  const branchLabel = document.getElementById("incident-branch-label");
  if (!branchLabel) return;
  branchLabel.classList.toggle("branch-required", origin === "branch");
}

document.getElementById("incident-origin")?.addEventListener("change", syncBranchHighlight);
syncBranchHighlight();

document.getElementById("incidents-manager-body")?.addEventListener("change", (event) => {
  const select = event.target.closest("select.incident-status-select");
  if (!select) return;
  const row = select.closest("tr[data-incident-id]");
  if (!row) return;
  updateManagedIncidentStatus(Number(row.dataset.incidentId), select);
});

["filter-incident-status", "filter-incident-origin", "filter-incident-branch"].forEach((id) => {
  document.getElementById(id)?.addEventListener("change", () => loadManagedIncidents());
});

document.getElementById("btn-refresh-incidents")?.addEventListener("click", () => {
  loadManagedIncidents();
  loadIncidentSummary();
});

document.getElementById("incident-create-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const submitBtn = document.getElementById("incident-submit-btn");
  const spinner = submitBtn?.querySelector(".btn-spinner");
  const label = submitBtn?.querySelector(".btn-label");

  clearIncidentFieldErrors();
  setIncidentFeedback("incident-form-feedback", "");

  const body = {
    title: form.title.value.trim(),
    description: form.description.value,
    category: form.category.value,
    origin: form.origin.value,
    branch: form.branch.value,
    status: form.status.value || "open",
  };

  if (!body.title) {
    setIncidentFieldError("title", "Title is required.");
    return;
  }
  if (!body.description.trim()) {
    setIncidentFieldError("description", "Description is required.");
    return;
  }

  if (submitBtn) submitBtn.disabled = true;
  if (spinner) spinner.hidden = false;
  if (label) label.textContent = "Submitting…";

  try {
    const response = await fetch(`${API_BASE}/api/incidents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      if (payload && payload.field && payload.message) {
        setIncidentFieldError(payload.field, payload.message);
        setIncidentFeedback("incident-form-feedback", payload.message, "error");
      } else {
        setIncidentFeedback(
          "incident-form-feedback",
          formatApiDetail(payload && payload.detail) || `HTTP ${response.status}`,
          "error"
        );
      }
      return;
    }

    form.reset();
    form.status.value = "open";
    form.branch.value = "central";
    syncBranchHighlight();
    setIncidentFeedback("incident-form-feedback", `Incident #${payload.id} registered.`, "success");
    await loadManagedIncidents();
    await loadIncidentSummary();
  } catch (error) {
    setIncidentFeedback("incident-form-feedback", error.message, "error");
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    if (spinner) spinner.hidden = true;
    if (label) label.textContent = "Submit incident";
  }
});

if (document.getElementById("incidents-manager-body")) {
  loadManagedIncidents();
  loadIncidentSummary();
}

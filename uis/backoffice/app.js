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
  Object.entries(payload?.score_counts || {}).forEach(([score, count]) => {
    scores[Number(score)] = Number(count) || 0;
  });

  return {
    total: Number(payload?.total) || 0,
    validCount: Number(payload?.valid_count) || 0,
    invalidCount: Number(payload?.invalid_count) || 0,
    categories: payload?.category_counts || {},
    statuses: payload?.status_counts || {},
    invalidRules: payload?.rule_counts || {},
    scores,
    closedValid: Number(payload?.closed_valid) || 0,
    scoredCount: Number(payload?.scored_cases) || 0,
    avgSatisfaction: Number(payload?.avg_score || 0).toFixed(2),
  };
}

function recordsFromApiPayload(payload) {
  return (payload?.records || []).map((row) => ({
    ...(row || {}),
    _validation: {
      isValid: Boolean(row?.is_valid),
      errors: row?.errors || [],
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
    if (activeFilter === "valid") return item._validation?.isValid;
    if (activeFilter === "invalid") return !item._validation?.isValid;
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
      <td><span class="tag ${row._validation?.isValid ? "good" : "danger"}">${row._validation?.isValid ? "Valid" : row._validation?.errors?.[0] || "Invalid"}</span></td>
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
    const detail = payload && payload.detail ? payload.detail : null;
    throw new Error(formatApiDetail(detail));
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

  const sampleBtn = document.getElementById("btn-load-sample");
  const exportBtn = document.getElementById("btn-export-incident-csv");
  if (sampleBtn) sampleBtn.disabled = true;
  if (exportBtn) exportBtn.disabled = true;
  setUploadFeedback(`Analyzing ${file.name}…`);

  try {
    await analyzeViaApi(file);
  } catch (apiError) {
    try {
      await analyzeFileLocally(file);
      setUploadFeedback(
        `${file.name} loaded locally. API unavailable — using local analysis.`,
        false
      );
    } catch (localError) {
      setUploadFeedback(
        safeUserError(localError, "Could not analyze this CSV. Check the file and try again."),
        true
      );
    }
  } finally {
    if (sampleBtn) sampleBtn.disabled = false;
    if (exportBtn) exportBtn.disabled = false;
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

  const exportBtn = document.getElementById("btn-export-incident-csv");
  if (exportBtn) exportBtn.disabled = true;
  setUploadFeedback("Exporting results…");

  try {
    if (usedApiForLatest) {
      try {
        const response = await fetch(`${API_BASE}/api/incidents/results/export`);
        if (!response.ok) {
          throw new Error("API export unavailable");
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
        downloadTextFile("results.csv", `${buildResultsCsv(latestSummary)}\n`, "text/csv;charset=utf-8");
        setUploadFeedback(
          "API export unavailable. Downloaded a local CSV copy instead.",
          false
        );
        return;
      }
    }

    downloadTextFile("results.csv", `${buildResultsCsv(latestSummary)}\n`, "text/csv;charset=utf-8");
    setUploadFeedback("Results CSV downloaded.");
  } finally {
    if (exportBtn) exportBtn.disabled = false;
  }
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

  const sampleBtn = document.getElementById("btn-load-sample");
  if (sampleBtn) sampleBtn.disabled = true;

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
      const detail = payload && payload.detail ? payload.detail : null;
      throw new Error(formatApiDetail(detail));
    }

    usedApiForLatest = true;
    const summary = summaryFromApiPayload(payload);
    const records = recordsFromApiPayload(payload);
    renderDashboardFromSummary(summary, records, payload?.source_file || "incidents-brasaland.csv");
    setUploadFeedback("Sample dataset loaded from API (incidents-brasaland.csv).");
  } catch (error) {
    usedApiForLatest = false;
    setUploadFeedback(
      "Sample dataset loaded locally. Start the API (npm run dev:api) for live analyze/export."
    );
  } finally {
    if (sampleBtn) sampleBtn.disabled = false;
  }
}

document.getElementById("btn-load-sample")?.addEventListener("click", () => {
  loadSampleDataset();
});
if (document.getElementById("incidents-table-body")) loadSampleDataset();

// --- Supplier Directory ---
let allSuppliers = [];

function formatSupplierRate(supplier) {
  const country = supplier?.country || "USA";
  const currency = supplier?.currency || (country === "Colombia" ? "COP" : "USD");
  const locale = country === "Colombia" ? "es-CO" : "en-US";
  const amount = Number(supplier?.rate_per_unit || 0).toLocaleString(locale, {
    minimumFractionDigits: currency === "COP" ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${currency} ${amount}`;
}

function setSupplierFeedback(id, message, isError = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("error", isError);
}

function formatApiDetail(detail) {
  if (!detail) return "Request failed. Please try again.";
  if (typeof detail === "string") {
    if (detail.length > 160) return "Request failed. Please try again.";
    return detail;
  }
  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        const loc = Array.isArray(item?.loc) ? item.loc.slice(1).join(".") : "";
        return loc ? `${loc}: ${item?.msg || "Invalid"}` : item?.msg;
      })
      .filter(Boolean);
    return parts.length ? parts.join("; ") : "Request failed. Please try again.";
  }
  return "Request failed. Please try again.";
}

function safeUserError(error, fallback) {
  if (error instanceof TypeError) {
    return "Unable to reach the API. Check your connection and try again.";
  }
  const message = error && error.message ? String(error.message) : "";
  if (!message) return fallback;
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return "Unable to reach the API. Check your connection and try again.";
  }
  if (message.startsWith("HTTP ") || message.includes("{")) {
    return fallback;
  }
  if (message.length > 160) return fallback;
  return message;
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
  const refreshBtn = document.getElementById("btn-refresh-suppliers");
  if (refreshBtn) refreshBtn.disabled = true;
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
      "Could not load suppliers. Start the API (npm run dev:api) then use Refresh.",
      true
    );
    const feedback = document.getElementById("supplier-list-feedback");
    if (feedback && !feedback.querySelector("[data-retry-supplier]")) {
      const retry = document.createElement("button");
      retry.type = "button";
      retry.dataset.retrySupplier = "1";
      retry.textContent = "Retry";
      retry.addEventListener("click", () => loadSuppliers());
      feedback.appendChild(document.createTextNode(" "));
      feedback.appendChild(retry);
    }
  } finally {
    if (refreshBtn) refreshBtn.disabled = false;
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
  setSupplierFeedback(
    "supplier-list-feedback",
    `Updated rate for ${payload?.name || "supplier"}.`
  );
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
  setSupplierFeedback(
    "supplier-list-feedback",
    `${payload?.name || "Supplier"} is now ${payload?.status || status}.`
  );
}

document.getElementById("suppliers-table-body")?.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const row = button.closest("tr[data-supplier-id]");
  if (!row) return;
  const supplierId = Number(row.dataset.supplierId);

  button.disabled = true;
  try {
    if (button.dataset.action === "update-rate") {
      const input = row.querySelector("input[type='number']");
      await updateSupplierRate(supplierId, input?.value);
    }
    if (button.dataset.action === "toggle-status") {
      await updateSupplierStatus(supplierId, button.dataset.nextStatus);
    }
  } catch (error) {
    const feedback = document.getElementById("supplier-list-feedback");
    setSupplierFeedback(
      "supplier-list-feedback",
      safeUserError(error, "Could not update supplier. Please try again."),
      true
    );
    if (feedback && !feedback.querySelector("[data-retry-supplier]")) {
      const retry = document.createElement("button");
      retry.type = "button";
      retry.dataset.retrySupplier = "1";
      retry.textContent = "Retry";
      retry.addEventListener("click", () => loadSuppliers());
      feedback.appendChild(document.createTextNode(" "));
      feedback.appendChild(retry);
    }
  } finally {
    button.disabled = false;
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
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;
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
    const currencyEl = document.getElementById("supplier-currency");
    if (currencyEl) currencyEl.value = "COP";
    setSupplierFeedback("supplier-form-feedback", `Created ${payload?.name || "supplier"}.`);
  } catch (error) {
    const feedbackId = "supplier-form-feedback";
    setSupplierFeedback(
      feedbackId,
      safeUserError(error, "Could not create supplier. Please try again."),
      true
    );
    const feedback = document.getElementById(feedbackId);
    if (feedback && !feedback.querySelector("[data-retry-create]")) {
      const retry = document.createElement("button");
      retry.type = "submit";
      retry.dataset.retryCreate = "1";
      retry.textContent = "Retry";
      feedback.appendChild(document.createTextNode(" "));
      feedback.appendChild(retry);
    }
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

if (document.getElementById("suppliers-table-body")) loadSuppliers();

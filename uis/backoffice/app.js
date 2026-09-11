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

// --- Incident Analysis: CSV validation matches incident_context.md rules ---
const VALID_CATEGORIES = new Set(["CUSTOMER_COMPLAINT", "EQUIPMENT", "SUPPLY", "FOOD_QUALITY", "STAFF"]);
const VALID_LOCATIONS = new Set([
  ...Array.from({ length: 10 }, (_, i) => `COL-${String(i + 1).padStart(2, "0")}`),
  ...Array.from({ length: 4 }, (_, i) => `FLA-${String(i + 1).padStart(2, "0")}`),
]);

let currentIncidents = [];
let activeFilter = "all";

function validateRecord(row) {
  const errors = [];
  const location = (row.location_id || "").trim();
  if (!VALID_LOCATIONS.has(location)) errors.push("Missing or invalid location_id");

  const category = (row.category || "").trim();
  if (!VALID_CATEGORIES.has(category)) errors.push("Invalid or missing category");

  const description = (row.description || "").trim();
  if (description.length < 5) errors.push("Empty or too-short description");

  const reporter = (row.reporter_id || "").trim();
  if (!reporter) errors.push("Missing reporter_id");

  const status = (row.status || "").trim();
  const scoreRaw = (row.satisfaction_score || "").trim();

  if (status === "CLOSED" && !scoreRaw) {
    errors.push("Closed case, no satisfaction score");
  } else if (scoreRaw) {
    const score = parseInt(scoreRaw, 10);
    if (Number.isNaN(score) || score < 1 || score > 5) errors.push("Satisfaction score out of range (1-5)");
  }

  return { isValid: errors.length === 0, errors };
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""));
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    return row;
  });
}

function computeMetrics(data) {
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

function renderDashboard(data, filename) {
  currentIncidents = data;
  const metrics = computeMetrics(data);

  const filenameEl = document.getElementById("loaded-filename");
  if (filenameEl) filenameEl.textContent = filename;
  const metaEl = document.getElementById("loaded-file-meta");
  if (metaEl) metaEl.textContent = `(${metrics.total} records processed)`;

  document.getElementById("metric-total-records").textContent = metrics.total;
  document.getElementById("metric-valid-records").textContent = metrics.validCount;
  document.getElementById("metric-invalid-records").textContent = metrics.invalidCount;
  document.getElementById("metric-avg-satisfaction").textContent = metrics.avgSatisfaction;

  const validPct = metrics.total ? ((metrics.validCount / metrics.total) * 100).toFixed(1) : 0;
  const invalidPct = metrics.total ? ((metrics.invalidCount / metrics.total) * 100).toFixed(1) : 0;
  document.getElementById("metric-valid-pct").textContent = `${validPct}% valid`;
  document.getElementById("metric-invalid-pct").textContent = `${invalidPct}% flagged`;

  document.getElementById("count-all").textContent = metrics.total;
  document.getElementById("count-valid").textContent = metrics.validCount;
  document.getElementById("count-invalid").textContent = metrics.invalidCount;

  const catList = document.getElementById("category-breakdown-list");
  if (catList) {
    catList.innerHTML = Object.entries(metrics.categories)
      .map(([cat, count]) => `<li class="breakdown-item"><span>${cat}</span><strong>${count} (${((count / metrics.validCount) * 100).toFixed(1)}%)</strong></li>`)
      .join("");
  }

  const statusList = document.getElementById("status-breakdown-list");
  if (statusList) {
    statusList.innerHTML = Object.entries(metrics.statuses)
      .map(([status, count]) => `<li class="breakdown-item"><span>${status}</span><strong>${count} (${((count / metrics.validCount) * 100).toFixed(1)}%)</strong></li>`)
      .join("");
  }

  const invalidList = document.getElementById("invalid-rules-list");
  if (invalidList) {
    const entries = Object.entries(metrics.invalidRules);
    invalidList.innerHTML = entries.length
      ? entries.map(([rule, count]) => `<li class="breakdown-item"><span>${rule}</span><strong style="color:var(--red);">${count}</strong></li>`).join("")
      : '<li class="breakdown-item"><span>No validation errors</span></li>';
  }

  const satList = document.getElementById("satisfaction-breakdown-list");
  if (satList) {
    const starLabels = { 1: "★☆☆☆☆ (1)", 2: "★★☆☆☆ (2)", 3: "★★★☆☆ (3)", 4: "★★★★☆ (4)", 5: "★★★★★ (5)" };
    satList.innerHTML = Object.entries(metrics.scores)
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

const fileInput = document.getElementById("incident-csv-input");
if (fileInput) {
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = parseCSV(event.target.result);
      renderDashboard(data, file.name);
    };
    reader.readAsText(file);
  });
}

document.querySelectorAll(".tab-filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-filter").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    renderTable();
  });
});

// Seeds the panel with the incident_context.md benchmark distribution on load
function loadSampleDataset() {
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
    const score = isClosed ? (i <= 4 ? 1 : i <= 10 ? 2 : i <= 22 ? 3 : i <= 41 ? 4 : 5) : "";
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

  sampleRows.push({ incident_id: "BRS-000097", date: "2026-08-15", location_id: "INVALID-LOC", category: "EQUIPMENT", description: "Motor issue", status: "OPEN", customer_id: "", satisfaction_score: "", reporter_id: "MGR-01" });
  sampleRows.push({ incident_id: "BRS-000098", date: "2026-08-15", location_id: "COL-01", category: "INVALID_CAT", description: "Grill issue", status: "OPEN", customer_id: "", satisfaction_score: "", reporter_id: "MGR-01" });
  sampleRows.push({ incident_id: "BRS-000099", date: "2026-08-15", location_id: "COL-01", category: "STAFF", description: "bad", status: "OPEN", customer_id: "", satisfaction_score: "", reporter_id: "MGR-01" });
  sampleRows.push({ incident_id: "BRS-000100", date: "2026-08-15", location_id: "COL-01", category: "FOOD_QUALITY", description: "Overcooked steak", status: "CLOSED", customer_id: "", satisfaction_score: "", reporter_id: "MGR-01" });

  renderDashboard(sampleRows, "incidents-brasaland.csv");
}

document.getElementById("btn-load-sample")?.addEventListener("click", loadSampleDataset);
if (document.getElementById("incidents-table-body")) loadSampleDataset();


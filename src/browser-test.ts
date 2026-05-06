/**
 * Brasaland Browser Test Helpers
 * Loads sample data and exposes interactive test controls for the browser.
 */

import {
  MenuItem,
  SaleTransaction,
  Location,
  WasteRecord,
} from "./types/models";
import {
  filterSalesByLocation,
  filterSalesByDateRange,
  filterMenuItemsByCategory,
  filterActiveLocations,
  sortLocationsByCapacity,
  sortMenuItemsByPrice,
  findLocationById,
  findMenuItemByName,
  binarySearchLocationByCapacity,
  convertCurrency,
  calculateDailyRevenue,
  calculateLocationMargin,
  calculateWasteCost,
  scoreLocationPerformance,
  rankLocationsByPerformance,
  countSalesByPaymentMethod,
  calculateAverageTicket,
  findTopSellingItems,
  groupWasteByReason,
  calculateCountryComparison,
  validateMenuItem,
  validateSaleTransaction,
  validateLocation,
} from "./index";

const sampleMenuItems: MenuItem[] = [
  {
    id: "ITEM-PICANHA-250",
    name: "Picanha 250g",
    category: "Meat",
    basePrice: { USD: 18.5, COP: 74000 },
    ingredientCost: { USD: 7.2, COP: 28800 },
    prepTimeMinutes: 15,
    isAvailableInColombia: true,
    isAvailableInUSA: true,
    allergens: [],
    status: "Active",
  },
  {
    id: "ITEM-FRIES",
    name: "French Fries",
    category: "Side",
    basePrice: { USD: 4.5, COP: 18000 },
    ingredientCost: { USD: 1.2, COP: 4800 },
    prepTimeMinutes: 8,
    isAvailableInColombia: true,
    isAvailableInUSA: true,
    allergens: [],
    status: "Active",
  },
  {
    id: "ITEM-COKE",
    name: "Coca-Cola",
    category: "Beverage",
    basePrice: { USD: 2.5, COP: 10000 },
    ingredientCost: { USD: 0.8, COP: 3200 },
    prepTimeMinutes: 2,
    isAvailableInColombia: true,
    isAvailableInUSA: true,
    allergens: [],
    status: "Active",
  },
  {
    id: "ITEM-DESSERT",
    name: "Flan",
    category: "Dessert",
    basePrice: { USD: 5.0, COP: 20000 },
    ingredientCost: { USD: 1.5, COP: 6000 },
    prepTimeMinutes: 3,
    isAvailableInColombia: true,
    isAvailableInUSA: false,
    allergens: ["Dairy"],
    status: "Active",
  },
];

const sampleLocations: Location[] = [
  {
    id: "LOC-MEDELLIN-01",
    name: "Brasaland Medellín Centro",
    city: "Medellín",
    country: "Colombia",
    openingYear: 2008,
    seatingCapacity: 80,
    staffCount: 12,
    monthlyRentCost: { USD: 1500, COP: 6000000 },
    averageMonthlyUtilities: { USD: 400, COP: 1600000 },
    manager: "Carlos Jiménez",
    status: "Active",
  },
  {
    id: "LOC-BOGOTA-01",
    name: "Brasaland Bogotá",
    city: "Bogotá",
    country: "Colombia",
    openingYear: 2014,
    seatingCapacity: 60,
    staffCount: 10,
    monthlyRentCost: { USD: 1200, COP: 4800000 },
    averageMonthlyUtilities: { USD: 320, COP: 1280000 },
    manager: "Laura Ríos",
    status: "Active",
  },
  {
    id: "LOC-MIAMI-01",
    name: "Brasaland Miami Beach",
    city: "Miami",
    country: "USA",
    openingYear: 2020,
    seatingCapacity: 100,
    staffCount: 15,
    monthlyRentCost: { USD: 7000, COP: 28000000 },
    averageMonthlyUtilities: { USD: 900, COP: 3600000 },
    manager: "Ashley Turner",
    status: "Temporarily closed",
  },
];

const sampleSales: SaleTransaction[] = [
  {
    id: "TXN-2024-15482",
    locationId: "LOC-MEDELLIN-01",
    itemId: "ITEM-PICANHA-250",
    quantity: 2,
    totalPrice: { USD: 37, COP: 148000 },
    paymentMethod: "Cash",
    timestamp: new Date("2024-03-15T12:10:00Z"),
    waiterName: "María Gómez",
  },
  {
    id: "TXN-2024-15483",
    locationId: "LOC-MEDELLIN-01",
    itemId: "ITEM-COKE",
    quantity: 1,
    totalPrice: { USD: 2.5, COP: 10000 },
    paymentMethod: "Credit card",
    timestamp: new Date("2024-03-15T12:25:00Z"),
    waiterName: "María Gómez",
  },
  {
    id: "TXN-2024-15484",
    locationId: "LOC-BOGOTA-01",
    itemId: "ITEM-FRIES",
    quantity: 1,
    totalPrice: { USD: 4.5, COP: 18000 },
    paymentMethod: "Debit card",
    timestamp: new Date("2024-03-16T19:00:00Z"),
    waiterName: "Laura Ospina",
  },
  {
    id: "TXN-2024-15485",
    locationId: "LOC-MIAMI-01",
    itemId: "ITEM-DESSERT",
    quantity: 1,
    totalPrice: { USD: 5, COP: 20000 },
    paymentMethod: "Digital wallet",
    timestamp: new Date("2024-03-16T20:45:00Z"),
    waiterName: "Ashley Turner",
  },
  {
    id: "TXN-2024-15486",
    locationId: "LOC-BOGOTA-01",
    itemId: "ITEM-COKE",
    quantity: 4,
    totalPrice: { USD: 10, COP: 40000 },
    paymentMethod: "Cash",
    timestamp: new Date("2024-03-16T18:10:00Z"),
    waiterName: "Laura Ospina",
  },
];

const sampleWasteRecords: WasteRecord[] = [
  {
    id: "WASTE-2024-001",
    locationId: "LOC-MEDELLIN-01",
    itemId: "ITEM-FRIES",
    quantity: 3,
    reason: "Cooking error",
    cost: { USD: 2.4, COP: 9600 },
    timestamp: new Date("2024-03-15T14:00:00Z"),
    reportedBy: "Carlos Jiménez",
  },
  {
    id: "WASTE-2024-002",
    locationId: "LOC-BOGOTA-01",
    itemId: "ITEM-DESSERT",
    quantity: 1,
    reason: "Expired",
    cost: { USD: 1.5, COP: 6000 },
    timestamp: new Date("2024-03-16T10:30:00Z"),
    reportedBy: "Laura Ríos",
  },
];

const invalidMenuItem: MenuItem = {
  id: "ITEM-INVALID-001",
  name: "",
  category: "Side",
  basePrice: { USD: -1, COP: 0 },
  ingredientCost: { USD: 0, COP: 0 },
  prepTimeMinutes: 0,
  isAvailableInColombia: false,
  isAvailableInUSA: false,
  allergens: [],
  status: "Discontinued",
};

const invalidSaleTransaction: SaleTransaction = {
  id: "TXN-INVALID-001",
  locationId: "LOC-MEDELLIN-01",
  itemId: "ITEM-PICANHA-250",
  quantity: 0,
  totalPrice: { USD: -5, COP: -20000 },
  paymentMethod: "Cash",
  timestamp: new Date(),
  waiterName: "",
};

const invalidLocation: Location = {
  id: "LOC-INVALID-001",
  name: "",
  city: "Unknown",
  country: "USA",
  openingYear: 2028,
  seatingCapacity: 0,
  staffCount: 0,
  monthlyRentCost: { USD: 0, COP: 0 },
  averageMonthlyUtilities: { USD: 0, COP: 0 },
  manager: "",
  status: "Under renovation",
};

function getElement<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function displayResult(title: string, result: unknown): void {
  const outputContainer = getElement<HTMLDivElement>("outputContainer");
  const formatted = typeof result === "string" ? result : JSON.stringify(result, null, 2);
  outputContainer.innerHTML = `
    <div class="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
      <h3 class="text-xl font-semibold text-slate-900 mb-3">${title}</h3>
      <pre class="whitespace-pre-wrap text-sm text-slate-700">${formatted}</pre>
    </div>
  `;
}

function createOptionList(items: string[]): string {
  return items.map((item) => `<option value="${item}">${item}</option>`).join("");
}

function initializeSelects(): void {
  const locationSelect = getElement<HTMLSelectElement>("locationInput");
  const locationIdSelect = getElement<HTMLSelectElement>("locationIdInput");
  const categorySelect = getElement<HTMLSelectElement>("categoryInput");

  const locationOptions = sampleLocations
    .map((location) => `<option value="${location.id}">${location.name}</option>`)
    .join("");

  locationSelect.innerHTML = locationOptions;
  locationIdSelect.innerHTML = locationOptions;

  const uniqueCategories = [...new Set(sampleMenuItems.map((item) => item.category))];
  categorySelect.innerHTML = createOptionList(uniqueCategories);
}

function initializeButtons(): void {
  getElement<HTMLButtonElement>("filterByLocationButton").addEventListener("click", () => {
    const locationId = getElement<HTMLSelectElement>("locationInput").value;
    const result = filterSalesByLocation(sampleSales, locationId);
    displayResult("Sales filtered by location", result);
  });

  getElement<HTMLButtonElement>("filterByDateRangeButton").addEventListener("click", () => {
    const startDateValue = getElement<HTMLInputElement>("startDateInput").value;
    const endDateValue = getElement<HTMLInputElement>("endDateInput").value;
    const startDate = new Date(startDateValue);
    const endDate = new Date(endDateValue);
    const result = filterSalesByDateRange(sampleSales, startDate, endDate);
    displayResult("Sales filtered by date range", result);
  });

  getElement<HTMLButtonElement>("filterByCategoryButton").addEventListener("click", () => {
    const category = getElement<HTMLSelectElement>("categoryInput").value as MenuItem["category"];
    const result = filterMenuItemsByCategory(sampleMenuItems, category);
    displayResult("Menu items filtered by category", result);
  });

  getElement<HTMLButtonElement>("activeLocationsButton").addEventListener("click", () => {
    const result = filterActiveLocations(sampleLocations);
    displayResult("Active locations", result);
  });

  getElement<HTMLButtonElement>("sortLocationsButton").addEventListener("click", () => {
    const order = getElement<HTMLSelectElement>("locationSortOrder").value as "asc" | "desc";
    const result = sortLocationsByCapacity(sampleLocations, order);
    displayResult(`Locations sorted by capacity (${order})`, result);
  });

  getElement<HTMLButtonElement>("sortMenuItemsButton").addEventListener("click", () => {
    const currency = getElement<HTMLSelectElement>("menuSortCurrency").value as "USD" | "COP";
    const order = getElement<HTMLSelectElement>("menuSortOrder").value as "asc" | "desc";
    const result = sortMenuItemsByPrice(sampleMenuItems, currency, order);
    displayResult(`Menu items sorted by ${currency} (${order})`, result);
  });

  getElement<HTMLButtonElement>("findLocationButton").addEventListener("click", () => {
    const id = getElement<HTMLInputElement>("locationSearchInput").value.trim();
    const result = findLocationById(sampleLocations, id);
    displayResult(`Find location by ID (${id})`, result ?? "Not found");
  });

  getElement<HTMLButtonElement>("findMenuItemButton").addEventListener("click", () => {
    const name = getElement<HTMLInputElement>("menuItemSearchInput").value.trim();
    const result = findMenuItemByName(sampleMenuItems, name);
    displayResult(`Find menu item by name (${name})`, result ?? "Not found");
  });

  getElement<HTMLButtonElement>("binarySearchButton").addEventListener("click", () => {
    const targetCapacity = Number(getElement<HTMLInputElement>("binaryCapacityInput").value);
    const sortedLocations = sortLocationsByCapacity(sampleLocations, "asc");
    const result = binarySearchLocationByCapacity(sortedLocations, targetCapacity);
    displayResult(`Binary search for capacity ${targetCapacity}`, result);
  });

  getElement<HTMLButtonElement>("convertCurrencyButton").addEventListener("click", () => {
    const amount = Number(getElement<HTMLInputElement>("currencyAmountInput").value);
    const fromCurrency = getElement<HTMLSelectElement>("fromCurrencyInput").value as "USD" | "COP";
    const toCurrency = getElement<HTMLSelectElement>("toCurrencyInput").value as "USD" | "COP";
    const result = convertCurrency(amount, fromCurrency, toCurrency);
    displayResult(`Convert ${amount} ${fromCurrency} to ${toCurrency}`, result);
  });

  getElement<HTMLButtonElement>("dailyRevenueButton").addEventListener("click", () => {
    const date = new Date(getElement<HTMLInputElement>("revenueDateInput").value);
    const currency = getElement<HTMLSelectElement>("revenueCurrencyInput").value as "USD" | "COP";
    const result = calculateDailyRevenue(sampleSales, date, currency);
    displayResult(`Daily revenue for ${date.toISOString().slice(0, 10)} (${currency})`, result);
  });

  getElement<HTMLButtonElement>("locationMarginButton").addEventListener("click", () => {
    const locationId = getElement<HTMLSelectElement>("marginLocationInput").value;
    const currency = getElement<HTMLSelectElement>("marginCurrencyInput").value as "USD" | "COP";
    const result = calculateLocationMargin(sampleSales, sampleMenuItems, locationId, currency);
    displayResult(`Location margin for ${locationId} (${currency})`, `${result}%`);
  });

  getElement<HTMLButtonElement>("wasteCostButton").addEventListener("click", () => {
    const locationId = getElement<HTMLSelectElement>("wasteLocationInput").value;
    const currency = getElement<HTMLSelectElement>("wasteCurrencyInput").value as "USD" | "COP";
    const result = calculateWasteCost(sampleWasteRecords, locationId, currency);
    displayResult(`Waste cost for ${locationId} (${currency})`, result);
  });

  getElement<HTMLButtonElement>("performanceScoreButton").addEventListener("click", () => {
    const locationId = getElement<HTMLSelectElement>("performanceLocationInput").value;
    const location = findLocationById(sampleLocations, locationId);
    if (!location) {
      displayResult("Location performance score", "Location not found");
      return;
    }
    const result = scoreLocationPerformance(location, sampleSales, sampleWasteRecords, sampleMenuItems);
    displayResult(`Performance score for ${location.name}`, `${result}/100`);
  });

  getElement<HTMLButtonElement>("rankPerformanceButton").addEventListener("click", () => {
    const result = rankLocationsByPerformance(sampleLocations, sampleSales, sampleWasteRecords, sampleMenuItems);
    displayResult("Locations ranked by performance", result);
  });

  getElement<HTMLButtonElement>("countPaymentButton").addEventListener("click", () => {
    const result = countSalesByPaymentMethod(sampleSales);
    displayResult("Sales count by payment method", result);
  });

  getElement<HTMLButtonElement>("averageTicketButton").addEventListener("click", () => {
    const currency = getElement<HTMLSelectElement>("ticketCurrencyInput").value as "USD" | "COP";
    const result = calculateAverageTicket(sampleSales, currency);
    displayResult(`Average ticket (${currency})`, result);
  });

  getElement<HTMLButtonElement>("topSellingButton").addEventListener("click", () => {
    const topN = Number(getElement<HTMLInputElement>("topSellingInput").value);
    const result = findTopSellingItems(sampleSales, sampleMenuItems, topN);
    displayResult(`Top ${topN} selling items`, result);
  });

  getElement<HTMLButtonElement>("groupWasteButton").addEventListener("click", () => {
    const result = groupWasteByReason(sampleWasteRecords);
    displayResult("Waste grouped by reason", result);
  });

  getElement<HTMLButtonElement>("countryComparisonButton").addEventListener("click", () => {
    const result = calculateCountryComparison(sampleSales, sampleLocations, sampleMenuItems);
    displayResult("Country revenue comparison", result);
  });

  getElement<HTMLButtonElement>("validateMenuItemButton").addEventListener("click", () => {
    const result = validateMenuItem(sampleMenuItems[0]);
    displayResult("Validate a valid menu item", result);
  });

  getElement<HTMLButtonElement>("validateInvalidMenuItemButton").addEventListener("click", () => {
    const result = validateMenuItem(invalidMenuItem);
    displayResult("Validate an invalid menu item", result);
  });

  getElement<HTMLButtonElement>("validateSaleButton").addEventListener("click", () => {
    const result = validateSaleTransaction(sampleSales[0]);
    displayResult("Validate a valid sale transaction", result);
  });

  getElement<HTMLButtonElement>("validateLocationButton").addEventListener("click", () => {
    const result = validateLocation(sampleLocations[0]);
    displayResult("Validate a valid location", result);
  });

  getElement<HTMLButtonElement>("validateInvalidLocationButton").addEventListener("click", () => {
    const result = validateLocation(invalidLocation);
    displayResult("Validate an invalid location", result);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initializeSelects();
  initializeButtons();
  displayResult("Ready", "Use the buttons to run each operation with sample Brasaland data.");
});

/**
 * Brasaland Browser Test Helpers
 * Loads sample data and exposes interactive test controls for the browser.
 */
import { filterSalesByLocation, filterSalesByDateRange, filterMenuItemsByCategory, filterActiveLocations, sortLocationsByCapacity, sortMenuItemsByPrice, findLocationById, findMenuItemByName, binarySearchLocationByCapacity, convertCurrency, calculateDailyRevenue, calculateLocationMargin, calculateWasteCost, scoreLocationPerformance, rankLocationsByPerformance, countSalesByPaymentMethod, calculateAverageTicket, findTopSellingItems, groupWasteByReason, calculateCountryComparison, validateMenuItem, validateSaleTransaction, validateLocation, } from "./index";
const sampleMenuItems = [
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
const sampleLocations = [
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
const sampleSales = [
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
const sampleWasteRecords = [
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
const invalidMenuItem = {
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
const invalidSaleTransaction = {
    id: "TXN-INVALID-001",
    locationId: "LOC-MEDELLIN-01",
    itemId: "ITEM-PICANHA-250",
    quantity: 0,
    totalPrice: { USD: -5, COP: -20000 },
    paymentMethod: "Cash",
    timestamp: new Date(),
    waiterName: "",
};
const invalidLocation = {
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
function getElement(id) {
    return document.getElementById(id);
}
function displayResult(title, result) {
    const outputContainer = getElement("outputContainer");
    const formatted = typeof result === "string" ? result : JSON.stringify(result, null, 2);
    outputContainer.innerHTML = `
    <div class="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
      <h3 class="text-xl font-semibold text-slate-900 mb-3">${title}</h3>
      <pre class="whitespace-pre-wrap text-sm text-slate-700">${formatted}</pre>
    </div>
  `;
}
function createOptionList(items) {
    return items.map((item) => `<option value="${item}">${item}</option>`).join("");
}
function initializeSelects() {
    const locationSelect = getElement("locationInput");
    const locationIdSelect = getElement("locationIdInput");
    const categorySelect = getElement("categoryInput");
    const locationOptions = sampleLocations
        .map((location) => `<option value="${location.id}">${location.name}</option>`)
        .join("");
    locationSelect.innerHTML = locationOptions;
    locationIdSelect.innerHTML = locationOptions;
    const uniqueCategories = [...new Set(sampleMenuItems.map((item) => item.category))];
    categorySelect.innerHTML = createOptionList(uniqueCategories);
}
function initializeButtons() {
    getElement("filterByLocationButton").addEventListener("click", () => {
        const locationId = getElement("locationInput").value;
        const result = filterSalesByLocation(sampleSales, locationId);
        displayResult("Sales filtered by location", result);
    });
    getElement("filterByDateRangeButton").addEventListener("click", () => {
        const startDateValue = getElement("startDateInput").value;
        const endDateValue = getElement("endDateInput").value;
        const startDate = new Date(startDateValue);
        const endDate = new Date(endDateValue);
        const result = filterSalesByDateRange(sampleSales, startDate, endDate);
        displayResult("Sales filtered by date range", result);
    });
    getElement("filterByCategoryButton").addEventListener("click", () => {
        const category = getElement("categoryInput").value;
        const result = filterMenuItemsByCategory(sampleMenuItems, category);
        displayResult("Menu items filtered by category", result);
    });
    getElement("activeLocationsButton").addEventListener("click", () => {
        const result = filterActiveLocations(sampleLocations);
        displayResult("Active locations", result);
    });
    getElement("sortLocationsButton").addEventListener("click", () => {
        const order = getElement("locationSortOrder").value;
        const result = sortLocationsByCapacity(sampleLocations, order);
        displayResult(`Locations sorted by capacity (${order})`, result);
    });
    getElement("sortMenuItemsButton").addEventListener("click", () => {
        const currency = getElement("menuSortCurrency").value;
        const order = getElement("menuSortOrder").value;
        const result = sortMenuItemsByPrice(sampleMenuItems, currency, order);
        displayResult(`Menu items sorted by ${currency} (${order})`, result);
    });
    getElement("findLocationButton").addEventListener("click", () => {
        const id = getElement("locationSearchInput").value.trim();
        const result = findLocationById(sampleLocations, id);
        displayResult(`Find location by ID (${id})`, result ?? "Not found");
    });
    getElement("findMenuItemButton").addEventListener("click", () => {
        const name = getElement("menuItemSearchInput").value.trim();
        const result = findMenuItemByName(sampleMenuItems, name);
        displayResult(`Find menu item by name (${name})`, result ?? "Not found");
    });
    getElement("binarySearchButton").addEventListener("click", () => {
        const targetCapacity = Number(getElement("binaryCapacityInput").value);
        const sortedLocations = sortLocationsByCapacity(sampleLocations, "asc");
        const result = binarySearchLocationByCapacity(sortedLocations, targetCapacity);
        displayResult(`Binary search for capacity ${targetCapacity}`, result);
    });
    getElement("convertCurrencyButton").addEventListener("click", () => {
        const amount = Number(getElement("currencyAmountInput").value);
        const fromCurrency = getElement("fromCurrencyInput").value;
        const toCurrency = getElement("toCurrencyInput").value;
        const result = convertCurrency(amount, fromCurrency, toCurrency);
        displayResult(`Convert ${amount} ${fromCurrency} to ${toCurrency}`, result);
    });
    getElement("dailyRevenueButton").addEventListener("click", () => {
        const date = new Date(getElement("revenueDateInput").value);
        const currency = getElement("revenueCurrencyInput").value;
        const result = calculateDailyRevenue(sampleSales, date, currency);
        displayResult(`Daily revenue for ${date.toISOString().slice(0, 10)} (${currency})`, result);
    });
    getElement("locationMarginButton").addEventListener("click", () => {
        const locationId = getElement("marginLocationInput").value;
        const currency = getElement("marginCurrencyInput").value;
        const result = calculateLocationMargin(sampleSales, sampleMenuItems, locationId, currency);
        displayResult(`Location margin for ${locationId} (${currency})`, `${result}%`);
    });
    getElement("wasteCostButton").addEventListener("click", () => {
        const locationId = getElement("wasteLocationInput").value;
        const currency = getElement("wasteCurrencyInput").value;
        const result = calculateWasteCost(sampleWasteRecords, locationId, currency);
        displayResult(`Waste cost for ${locationId} (${currency})`, result);
    });
    getElement("performanceScoreButton").addEventListener("click", () => {
        const locationId = getElement("performanceLocationInput").value;
        const location = findLocationById(sampleLocations, locationId);
        if (!location) {
            displayResult("Location performance score", "Location not found");
            return;
        }
        const result = scoreLocationPerformance(location, sampleSales, sampleWasteRecords, sampleMenuItems);
        displayResult(`Performance score for ${location.name}`, `${result}/100`);
    });
    getElement("rankPerformanceButton").addEventListener("click", () => {
        const result = rankLocationsByPerformance(sampleLocations, sampleSales, sampleWasteRecords, sampleMenuItems);
        displayResult("Locations ranked by performance", result);
    });
    getElement("countPaymentButton").addEventListener("click", () => {
        const result = countSalesByPaymentMethod(sampleSales);
        displayResult("Sales count by payment method", result);
    });
    getElement("averageTicketButton").addEventListener("click", () => {
        const currency = getElement("ticketCurrencyInput").value;
        const result = calculateAverageTicket(sampleSales, currency);
        displayResult(`Average ticket (${currency})`, result);
    });
    getElement("topSellingButton").addEventListener("click", () => {
        const topN = Number(getElement("topSellingInput").value);
        const result = findTopSellingItems(sampleSales, sampleMenuItems, topN);
        displayResult(`Top ${topN} selling items`, result);
    });
    getElement("groupWasteButton").addEventListener("click", () => {
        const result = groupWasteByReason(sampleWasteRecords);
        displayResult("Waste grouped by reason", result);
    });
    getElement("countryComparisonButton").addEventListener("click", () => {
        const result = calculateCountryComparison(sampleSales, sampleLocations, sampleMenuItems);
        displayResult("Country revenue comparison", result);
    });
    getElement("validateMenuItemButton").addEventListener("click", () => {
        const result = validateMenuItem(sampleMenuItems[0]);
        displayResult("Validate a valid menu item", result);
    });
    getElement("validateInvalidMenuItemButton").addEventListener("click", () => {
        const result = validateMenuItem(invalidMenuItem);
        displayResult("Validate an invalid menu item", result);
    });
    getElement("validateSaleButton").addEventListener("click", () => {
        const result = validateSaleTransaction(sampleSales[0]);
        displayResult("Validate a valid sale transaction", result);
    });
    getElement("validateLocationButton").addEventListener("click", () => {
        const result = validateLocation(sampleLocations[0]);
        displayResult("Validate a valid location", result);
    });
    getElement("validateInvalidLocationButton").addEventListener("click", () => {
        const result = validateLocation(invalidLocation);
        displayResult("Validate an invalid location", result);
    });
}
document.addEventListener("DOMContentLoaded", () => {
    initializeSelects();
    initializeButtons();
    displayResult("Ready", "Use the buttons to run each operation with sample Brasaland data.");
});
//# sourceMappingURL=browser-test.js.map
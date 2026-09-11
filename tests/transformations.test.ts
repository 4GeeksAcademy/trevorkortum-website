import { test } from "node:test";
import assert from "node:assert/strict";
import {
  convertCurrency,
  calculateDailyRevenue,
  calculateLocationMargin,
  calculateWasteCost,
  countSalesByPaymentMethod,
  calculateAverageTicket,
  findTopSellingItems,
  groupWasteByReason,
  calculateCountryComparison,
} from "../src/utils/transformations";
import type {
  Location,
  MenuItem,
  SaleTransaction,
  WasteRecord,
} from "../src/types/models";

const locations: Location[] = [
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
    status: "Active",
  },
];

const menuItems: MenuItem[] = [
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
];

const sales: SaleTransaction[] = [
  {
    id: "TXN-1",
    locationId: "LOC-MEDELLIN-01",
    itemId: "ITEM-PICANHA-250",
    quantity: 2,
    totalPrice: { USD: 37, COP: 148000 },
    paymentMethod: "Cash",
    timestamp: new Date("2024-03-15T12:10:00Z"),
    waiterName: "María Gómez",
  },
  {
    id: "TXN-2",
    locationId: "LOC-MEDELLIN-01",
    itemId: "ITEM-COKE",
    quantity: 1,
    totalPrice: { USD: 2.5, COP: 10000 },
    paymentMethod: "Credit card",
    timestamp: new Date("2024-03-15T12:25:00Z"),
    waiterName: "María Gómez",
  },
  {
    id: "TXN-3",
    locationId: "LOC-MIAMI-01",
    itemId: "ITEM-COKE",
    quantity: 4,
    totalPrice: { USD: 10, COP: 40000 },
    paymentMethod: "Digital wallet",
    timestamp: new Date("2024-04-01T18:00:00Z"),
    waiterName: "Ashley Turner",
  },
];

const wasteRecords: WasteRecord[] = [
  {
    id: "WASTE-1",
    locationId: "LOC-MEDELLIN-01",
    itemId: "ITEM-COKE",
    quantity: 3,
    reason: "Cooking error",
    cost: { USD: 2.4, COP: 9600 },
    timestamp: new Date("2024-03-15T14:00:00Z"),
    reportedBy: "Carlos Jiménez",
  },
  {
    id: "WASTE-2",
    locationId: "LOC-MEDELLIN-01",
    itemId: "ITEM-PICANHA-250",
    quantity: 1,
    reason: "Expired",
    cost: { USD: 7.2, COP: 28800 },
    timestamp: new Date("2024-03-16T14:00:00Z"),
    reportedBy: "Carlos Jiménez",
  },
];

test("convertCurrency returns the same amount when currencies match", () => {
  assert.equal(convertCurrency(10, "USD", "USD"), 10);
});

test("convertCurrency converts USD to COP using the fixed demo rate", () => {
  assert.equal(convertCurrency(10, "USD", "COP"), 40000);
});

test("convertCurrency converts COP to USD using the fixed demo rate", () => {
  assert.equal(convertCurrency(40000, "COP", "USD"), 10);
});

test("calculateDailyRevenue sums only sales within the given day, per currency", () => {
  const revenueUsd = calculateDailyRevenue(
    sales,
    new Date("2024-03-15T00:00:00Z"),
    "USD"
  );
  assert.equal(revenueUsd, 39.5);
});

test("calculateLocationMargin computes profit margin from revenue and ingredient cost", () => {
  const margin = calculateLocationMargin(
    sales,
    menuItems,
    "LOC-MEDELLIN-01",
    "USD"
  );
  // revenue = 37 + 2.5 = 39.5, cost = (7.2 * 2) + (0.8 * 1) = 15.2
  const expected = Math.round(((39.5 - 15.2) / 39.5) * 100 * 100) / 100;
  assert.equal(margin, expected);
});

test("calculateLocationMargin returns 0 when the location has no sales", () => {
  assert.equal(calculateLocationMargin(sales, menuItems, "LOC-UNKNOWN", "USD"), 0);
});

test("calculateWasteCost totals waste cost for a location", () => {
  assert.equal(calculateWasteCost(wasteRecords, "LOC-MEDELLIN-01", "USD"), 9.6);
});

test("countSalesByPaymentMethod tallies every payment method key", () => {
  const counts = countSalesByPaymentMethod(sales);
  assert.deepEqual(counts, {
    Cash: 1,
    "Credit card": 1,
    "Debit card": 0,
    "Digital wallet": 1,
  });
});

test("calculateAverageTicket averages total price across sales", () => {
  assert.equal(calculateAverageTicket(sales, "USD"), 16.5);
});

test("calculateAverageTicket returns 0 for an empty sales list", () => {
  assert.equal(calculateAverageTicket([], "USD"), 0);
});

test("findTopSellingItems ranks items by quantity sold, limited to topN", () => {
  const top = findTopSellingItems(sales, menuItems, 1);
  assert.equal(top.length, 1);
  assert.equal(top[0].item.id, "ITEM-COKE");
  assert.equal(top[0].totalSold, 5);
});

test("groupWasteByReason buckets every reason key, including empty ones", () => {
  const grouped = groupWasteByReason(wasteRecords);
  assert.equal(grouped["Cooking error"].length, 1);
  assert.equal(grouped["Expired"].length, 1);
  assert.equal(grouped["Damage"].length, 0);
});

test("calculateCountryComparison separates Colombia and USA metrics without mixing currencies", () => {
  const comparison = calculateCountryComparison(sales, locations, menuItems);
  assert.equal(comparison.Colombia.totalLocations, 1);
  assert.equal(comparison.USA.totalLocations, 1);
  assert.equal(comparison.Colombia.totalRevenue.USD, 39.5);
  assert.equal(comparison.USA.totalRevenue.USD, 10);
});

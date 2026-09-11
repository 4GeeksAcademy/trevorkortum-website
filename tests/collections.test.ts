import { test } from "node:test";
import assert from "node:assert/strict";
import {
  filterSalesByLocation,
  filterSalesByDateRange,
  filterMenuItemsByCategory,
  filterActiveLocations,
  sortLocationsByCapacity,
  sortMenuItemsByPrice,
} from "../src/utils/collections";
import type { Location, MenuItem, SaleTransaction } from "../src/types/models";

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
    status: "Temporarily closed",
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
    locationId: "LOC-MIAMI-01",
    itemId: "ITEM-COKE",
    quantity: 1,
    totalPrice: { USD: 2.5, COP: 10000 },
    paymentMethod: "Digital wallet",
    timestamp: new Date("2024-04-01T18:00:00Z"),
    waiterName: "Ashley Turner",
  },
];

test("filterSalesByLocation returns only matching location's sales", () => {
  const result = filterSalesByLocation(sales, "LOC-MEDELLIN-01");
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "TXN-1");
});

test("filterSalesByDateRange is inclusive of boundary dates", () => {
  const result = filterSalesByDateRange(
    sales,
    new Date("2024-03-15T00:00:00Z"),
    new Date("2024-03-15T23:59:59Z")
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "TXN-1");
});

test("filterMenuItemsByCategory filters by category", () => {
  const result = filterMenuItemsByCategory(menuItems, "Beverage");
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "ITEM-COKE");
});

test("filterActiveLocations excludes non-active locations", () => {
  const result = filterActiveLocations(locations);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "LOC-MEDELLIN-01");
});

test("sortLocationsByCapacity sorts ascending without mutating input", () => {
  const original = [...locations];
  const result = sortLocationsByCapacity(locations, "asc");
  assert.deepEqual(
    result.map((l) => l.id),
    ["LOC-MEDELLIN-01", "LOC-MIAMI-01"]
  );
  assert.deepEqual(locations, original);
});

test("sortLocationsByCapacity sorts descending", () => {
  const result = sortLocationsByCapacity(locations, "desc");
  assert.deepEqual(
    result.map((l) => l.id),
    ["LOC-MIAMI-01", "LOC-MEDELLIN-01"]
  );
});

test("sortMenuItemsByPrice sorts by USD ascending", () => {
  const result = sortMenuItemsByPrice(menuItems, "USD", "asc");
  assert.deepEqual(
    result.map((i) => i.id),
    ["ITEM-COKE", "ITEM-PICANHA-250"]
  );
});

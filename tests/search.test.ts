import { test } from "node:test";
import assert from "node:assert/strict";
import {
  findLocationById,
  findMenuItemByName,
  binarySearchLocationByCapacity,
} from "../src/utils/search";
import type { Location, MenuItem } from "../src/types/models";

const baseLocation = (overrides: Partial<Location>): Location => ({
  id: "LOC-X",
  name: "Brasaland X",
  city: "City",
  country: "Colombia",
  openingYear: 2010,
  seatingCapacity: 50,
  staffCount: 5,
  monthlyRentCost: { USD: 1000, COP: 4000000 },
  averageMonthlyUtilities: { USD: 200, COP: 800000 },
  manager: "Manager",
  status: "Active",
  ...overrides,
});

const locations: Location[] = [
  baseLocation({ id: "LOC-A", seatingCapacity: 40 }),
  baseLocation({ id: "LOC-B", seatingCapacity: 80 }),
  baseLocation({ id: "LOC-C", seatingCapacity: 120 }),
];

const menuItems: MenuItem[] = [
  {
    id: "ITEM-1",
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
];

test("findLocationById returns matching location", () => {
  const result = findLocationById(locations, "LOC-B");
  assert.ok(result);
  assert.equal(result?.id, "LOC-B");
});

test("findLocationById returns null when not found", () => {
  assert.equal(findLocationById(locations, "LOC-MISSING"), null);
});

test("findMenuItemByName matches case-insensitively", () => {
  const result = findMenuItemByName(menuItems, "picanha 250g");
  assert.ok(result);
  assert.equal(result?.id, "ITEM-1");
});

test("findMenuItemByName returns null when no match", () => {
  assert.equal(findMenuItemByName(menuItems, "unknown item"), null);
});

test("binarySearchLocationByCapacity finds exact match on sorted array", () => {
  const index = binarySearchLocationByCapacity(locations, 80);
  assert.equal(index, 1);
});

test("binarySearchLocationByCapacity returns -1 when capacity absent", () => {
  const index = binarySearchLocationByCapacity(locations, 999);
  assert.equal(index, -1);
});

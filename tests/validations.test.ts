import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateMenuItem,
  validateSaleTransaction,
  validateLocation,
} from "../src/utils/validations";
import type { Location, MenuItem, SaleTransaction } from "../src/types/models";

const validMenuItem: MenuItem = {
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
};

const validSale: SaleTransaction = {
  id: "TXN-1",
  locationId: "LOC-1",
  itemId: "ITEM-1",
  quantity: 1,
  totalPrice: { USD: 10, COP: 40000 },
  paymentMethod: "Cash",
  timestamp: new Date(),
  waiterName: "María Gómez",
};

const validLocation: Location = {
  id: "LOC-1",
  name: "Brasaland Test",
  city: "Medellín",
  country: "Colombia",
  openingYear: 2010,
  seatingCapacity: 50,
  staffCount: 8,
  monthlyRentCost: { USD: 1000, COP: 4000000 },
  averageMonthlyUtilities: { USD: 200, COP: 800000 },
  manager: "Manager",
  status: "Active",
};

test("validateMenuItem accepts a fully valid item", () => {
  const result = validateMenuItem(validMenuItem);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("validateMenuItem rejects an empty name", () => {
  const result = validateMenuItem({ ...validMenuItem, name: "   " });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("Menu item name must not be empty"));
});

test("validateMenuItem rejects non-positive prices", () => {
  const result = validateMenuItem({
    ...validMenuItem,
    basePrice: { USD: 0, COP: 0 },
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("Base price USD must be greater than 0"));
  assert.ok(result.errors.includes("Base price COP must be greater than 0"));
});

test("validateMenuItem rejects prep time outside 0-60 minutes", () => {
  const result = validateMenuItem({ ...validMenuItem, prepTimeMinutes: 90 });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("Prep time must not exceed 60 minutes"));
});

test("validateMenuItem rejects items unavailable in both countries", () => {
  const result = validateMenuItem({
    ...validMenuItem,
    isAvailableInColombia: false,
    isAvailableInUSA: false,
  });
  assert.equal(result.valid, false);
  assert.ok(
    result.errors.includes("Item must be available in at least one country")
  );
});

test("validateSaleTransaction accepts a fully valid sale", () => {
  const result = validateSaleTransaction(validSale);
  assert.equal(result.valid, true);
});

test("validateSaleTransaction rejects non-positive quantity and prices", () => {
  const result = validateSaleTransaction({
    ...validSale,
    quantity: 0,
    totalPrice: { USD: 0, COP: 0 },
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("Quantity must be greater than 0"));
  assert.ok(result.errors.includes("Total price USD must be greater than 0"));
  assert.ok(result.errors.includes("Total price COP must be greater than 0"));
});

test("validateSaleTransaction rejects an empty waiter name", () => {
  const result = validateSaleTransaction({ ...validSale, waiterName: "" });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("Waiter name must not be empty"));
});

test("validateLocation accepts a fully valid location", () => {
  const result = validateLocation(validLocation);
  assert.equal(result.valid, true);
});

test("validateLocation rejects an opening year before 2008", () => {
  const result = validateLocation({ ...validLocation, openingYear: 2000 });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("Opening year must be 2008 or later"));
});

test("validateLocation rejects an opening year in the future", () => {
  const futureYear = new Date().getFullYear() + 1;
  const result = validateLocation({ ...validLocation, openingYear: futureYear });
  assert.equal(result.valid, false);
  assert.ok(
    result.errors.some((e) => e.startsWith("Opening year cannot be in the future"))
  );
});

test("validateLocation rejects non-positive seating capacity and staff count", () => {
  const result = validateLocation({
    ...validLocation,
    seatingCapacity: 0,
    staffCount: 0,
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("Seating capacity must be greater than 0"));
  assert.ok(result.errors.includes("Staff count must be greater than 0"));
});

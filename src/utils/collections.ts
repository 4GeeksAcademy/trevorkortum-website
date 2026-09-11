/**
 * Collection Operations
 * Functions to filter, sort, search, and group elements within arrays
 */

import {
  MenuItem,
  MenuCategory,
  SaleTransaction,
  Location,
} from "../types/models";

export type SortOrder = "asc" | "desc";

export type Predicate<T> = (item: T) => boolean;

export interface SortCriterion<T> {
  selector: (item: T) => string | number | Date;
  order: SortOrder;
}

/**
 * Applies multiple predicates to a collection.
 * Predicates are combined with AND logic.
 */
export function filterByCriteria<T>(
  items: readonly T[],
  predicates: ReadonlyArray<Predicate<T>>
): T[] {
  if (items.length === 0) {
    return [];
  }

  if (predicates.length === 0) {
    return [...items];
  }

  return items.filter((item) => predicates.every((predicate) => predicate(item)));
}

/**
 * Sorts by one or more criteria without mutating the original array.
 */
export function sortByCriteria<T>(
  items: readonly T[],
  criteria: ReadonlyArray<SortCriterion<T>>
): T[] {
  if (items.length <= 1 || criteria.length === 0) {
    return [...items];
  }

  const normalizeValue = (value: string | number | Date): string | number => {
    if (value instanceof Date) {
      return value.getTime();
    }
    return value;
  };

  return [...items].sort((a, b) => {
    for (const criterion of criteria) {
      const left = normalizeValue(criterion.selector(a));
      const right = normalizeValue(criterion.selector(b));

      if (left === right) {
        continue;
      }

      const result = left < right ? -1 : 1;
      return criterion.order === "asc" ? result : -result;
    }

    return 0;
  });
}

/**
 * Filters sales by location ID
 * @param sales - Array of sales transactions
 * @param locationId - Location ID to filter by
 * @returns Array of sales from the specified location
 */
export function filterSalesByLocation(
  sales: SaleTransaction[],
  locationId: string
): SaleTransaction[] {
  return filterByCriteria(sales, [(sale) => sale.locationId === locationId]);
}

/**
 * Filters sales by date range (inclusive)
 * @param sales - Array of sales transactions
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @returns Array of sales within the date range
 */
export function filterSalesByDateRange(
  sales: SaleTransaction[],
  startDate: Date,
  endDate: Date
): SaleTransaction[] {
  if (startDate > endDate) {
    return [];
  }

  return filterByCriteria(sales, [
    (sale) => sale.timestamp >= startDate,
    (sale) => sale.timestamp <= endDate,
  ]);
}

/**
 * Filters menu items by category
 * @param items - Array of menu items
 * @param category - Menu category to filter by
 * @returns Array of menu items in the specified category
 */
export function filterMenuItemsByCategory(
  items: MenuItem[],
  category: MenuCategory
): MenuItem[] {
  return filterByCriteria(items, [(item) => item.category === category]);
}

/**
 * Filters locations with "Active" status
 * @param locations - Array of locations
 * @returns Array of active locations
 */
export function filterActiveLocations(locations: Location[]): Location[] {
  return filterByCriteria(locations, [(location) => location.status === "Active"]);
}

/**
 * Sorts locations by seating capacity
 * @param locations - Array of locations
 * @param order - Sort order: "asc" or "desc"
 * @returns New array of locations sorted by capacity (does not mutate original)
 */
export function sortLocationsByCapacity(
  locations: Location[],
  order: "asc" | "desc"
): Location[] {
  return sortByCriteria(locations, [
    { selector: (location) => location.seatingCapacity, order },
  ]);
}

/**
 * Sorts menu items by price in a specified currency
 * @param items - Array of menu items
 * @param currency - Currency to sort by: "USD" or "COP"
 * @param order - Sort order: "asc" or "desc"
 * @returns New array of menu items sorted by price (does not mutate original)
 */
export function sortMenuItemsByPrice(
  items: MenuItem[],
  currency: "USD" | "COP",
  order: "asc" | "desc"
): MenuItem[] {
  return sortByCriteria(items, [
    { selector: (item) => item.basePrice[currency], order },
  ]);
}

/**
 * Collection Operations
 * Functions to filter, sort, search, and group elements within arrays
 */
import { MenuItem, MenuCategory, SaleTransaction, Location } from "../types/models";
/**
 * Filters sales by location ID
 * @param sales - Array of sales transactions
 * @param locationId - Location ID to filter by
 * @returns Array of sales from the specified location
 */
export declare function filterSalesByLocation(sales: SaleTransaction[], locationId: string): SaleTransaction[];
/**
 * Filters sales by date range (inclusive)
 * @param sales - Array of sales transactions
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @returns Array of sales within the date range
 */
export declare function filterSalesByDateRange(sales: SaleTransaction[], startDate: Date, endDate: Date): SaleTransaction[];
/**
 * Filters menu items by category
 * @param items - Array of menu items
 * @param category - Menu category to filter by
 * @returns Array of menu items in the specified category
 */
export declare function filterMenuItemsByCategory(items: MenuItem[], category: MenuCategory): MenuItem[];
/**
 * Filters locations with "Active" status
 * @param locations - Array of locations
 * @returns Array of active locations
 */
export declare function filterActiveLocations(locations: Location[]): Location[];
/**
 * Sorts locations by seating capacity
 * @param locations - Array of locations
 * @param order - Sort order: "asc" or "desc"
 * @returns New array of locations sorted by capacity (does not mutate original)
 */
export declare function sortLocationsByCapacity(locations: Location[], order: "asc" | "desc"): Location[];
/**
 * Sorts menu items by price in a specified currency
 * @param items - Array of menu items
 * @param currency - Currency to sort by: "USD" or "COP"
 * @param order - Sort order: "asc" or "desc"
 * @returns New array of menu items sorted by price (does not mutate original)
 */
export declare function sortMenuItemsByPrice(items: MenuItem[], currency: "USD" | "COP", order: "asc" | "desc"): MenuItem[];
//# sourceMappingURL=collections.d.ts.map
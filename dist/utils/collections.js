"use strict";
/**
 * Collection Operations
 * Functions to filter, sort, search, and group elements within arrays
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterSalesByLocation = filterSalesByLocation;
exports.filterSalesByDateRange = filterSalesByDateRange;
exports.filterMenuItemsByCategory = filterMenuItemsByCategory;
exports.filterActiveLocations = filterActiveLocations;
exports.sortLocationsByCapacity = sortLocationsByCapacity;
exports.sortMenuItemsByPrice = sortMenuItemsByPrice;
/**
 * Filters sales by location ID
 * @param sales - Array of sales transactions
 * @param locationId - Location ID to filter by
 * @returns Array of sales from the specified location
 */
function filterSalesByLocation(sales, locationId) {
    return sales.filter((sale) => sale.locationId === locationId);
}
/**
 * Filters sales by date range (inclusive)
 * @param sales - Array of sales transactions
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @returns Array of sales within the date range
 */
function filterSalesByDateRange(sales, startDate, endDate) {
    return sales.filter((sale) => {
        const saleDate = sale.timestamp;
        return saleDate >= startDate && saleDate <= endDate;
    });
}
/**
 * Filters menu items by category
 * @param items - Array of menu items
 * @param category - Menu category to filter by
 * @returns Array of menu items in the specified category
 */
function filterMenuItemsByCategory(items, category) {
    return items.filter((item) => item.category === category);
}
/**
 * Filters locations with "Active" status
 * @param locations - Array of locations
 * @returns Array of active locations
 */
function filterActiveLocations(locations) {
    return locations.filter((location) => location.status === "Active");
}
/**
 * Sorts locations by seating capacity
 * @param locations - Array of locations
 * @param order - Sort order: "asc" or "desc"
 * @returns New array of locations sorted by capacity (does not mutate original)
 */
function sortLocationsByCapacity(locations, order) {
    const sorted = [...locations];
    sorted.sort((a, b) => {
        if (order === "asc") {
            return a.seatingCapacity - b.seatingCapacity;
        }
        else {
            return b.seatingCapacity - a.seatingCapacity;
        }
    });
    return sorted;
}
/**
 * Sorts menu items by price in a specified currency
 * @param items - Array of menu items
 * @param currency - Currency to sort by: "USD" or "COP"
 * @param order - Sort order: "asc" or "desc"
 * @returns New array of menu items sorted by price (does not mutate original)
 */
function sortMenuItemsByPrice(items, currency, order) {
    const sorted = [...items];
    sorted.sort((a, b) => {
        const priceA = a.basePrice[currency];
        const priceB = b.basePrice[currency];
        if (order === "asc") {
            return priceA - priceB;
        }
        else {
            return priceB - priceA;
        }
    });
    return sorted;
}
//# sourceMappingURL=collections.js.map
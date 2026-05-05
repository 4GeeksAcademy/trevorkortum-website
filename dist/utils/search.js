"use strict";
/**
 * Search Operations
 * Linear and binary search implementations for collections
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.findLocationById = findLocationById;
exports.findMenuItemByName = findMenuItemByName;
exports.binarySearchLocationByCapacity = binarySearchLocationByCapacity;
/**
 * Performs linear search to find a location by ID
 * @param locations - Array of locations
 * @param id - Location ID to search for
 * @returns Location if found, null otherwise
 */
function findLocationById(locations, id) {
    for (const location of locations) {
        if (location.id === id) {
            return location;
        }
    }
    return null;
}
/**
 * Performs linear search to find a menu item by name (case-insensitive)
 * @param items - Array of menu items
 * @param name - Menu item name to search for
 * @returns MenuItem if found, null otherwise
 */
function findMenuItemByName(items, name) {
    const searchName = name.toLowerCase();
    for (const item of items) {
        if (item.name.toLowerCase() === searchName) {
            return item;
        }
    }
    return null;
}
/**
 * Performs binary search to find a location by seating capacity
 * Assumes array is sorted by seating capacity in ascending order
 * @param sortedLocations - Array of locations sorted by capacity (ascending)
 * @param targetCapacity - Target seating capacity to find
 * @returns Index of location with target capacity if found, -1 otherwise
 */
function binarySearchLocationByCapacity(sortedLocations, targetCapacity) {
    let left = 0;
    let right = sortedLocations.length - 1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const midCapacity = sortedLocations[mid].seatingCapacity;
        if (midCapacity === targetCapacity) {
            return mid;
        }
        else if (midCapacity < targetCapacity) {
            left = mid + 1;
        }
        else {
            right = mid - 1;
        }
    }
    return -1;
}
//# sourceMappingURL=search.js.map
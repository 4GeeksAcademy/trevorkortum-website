/**
 * Search Operations
 * Linear and binary search implementations for collections
 */
import { MenuItem, Location } from "../types/models";
/**
 * Performs linear search to find a location by ID
 * @param locations - Array of locations
 * @param id - Location ID to search for
 * @returns Location if found, null otherwise
 */
export declare function findLocationById(locations: Location[], id: string): Location | null;
/**
 * Performs linear search to find a menu item by name (case-insensitive)
 * @param items - Array of menu items
 * @param name - Menu item name to search for
 * @returns MenuItem if found, null otherwise
 */
export declare function findMenuItemByName(items: MenuItem[], name: string): MenuItem | null;
/**
 * Performs binary search to find a location by seating capacity
 * Assumes array is sorted by seating capacity in ascending order
 * @param sortedLocations - Array of locations sorted by capacity (ascending)
 * @param targetCapacity - Target seating capacity to find
 * @returns Index of location with target capacity if found, -1 otherwise
 */
export declare function binarySearchLocationByCapacity(sortedLocations: Location[], targetCapacity: number): number;
//# sourceMappingURL=search.d.ts.map
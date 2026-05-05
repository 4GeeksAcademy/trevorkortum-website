/**
 * Data Transformations and Aggregations
 * Financial calculations, performance scoring, and reporting functions
 */
import { SaleTransaction, MenuItem, Location, WasteRecord, PaymentMethod, WasteReason, CountryMetrics, LocationPerformanceResult, TopSellingItemResult } from "../types/models";
/**
 * Converts amount between USD and COP
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency ("USD" or "COP")
 * @param toCurrency - Target currency ("USD" or "COP")
 * @returns Converted amount rounded to 2 decimal places
 */
export declare function convertCurrency(amount: number, fromCurrency: "USD" | "COP", toCurrency: "USD" | "COP"): number;
/**
 * Calculates total revenue for a specific date in specified currency
 * @param sales - Array of sales transactions
 * @param date - Date to calculate revenue for
 * @param currency - Currency ("USD" or "COP")
 * @returns Total revenue rounded to 2 decimal places
 */
export declare function calculateDailyRevenue(sales: SaleTransaction[], date: Date, currency: "USD" | "COP"): number;
/**
 * Calculates profit margin for a location
 * Formula: ((Total Revenue - Total Ingredient Cost) / Total Revenue) * 100
 * @param sales - Array of sales transactions
 * @param menuItems - Array of menu items
 * @param locationId - Location ID to calculate margin for
 * @param currency - Currency ("USD" or "COP")
 * @returns Profit margin as percentage (0-100), rounded to 2 decimal places
 */
export declare function calculateLocationMargin(sales: SaleTransaction[], menuItems: MenuItem[], locationId: string, currency: "USD" | "COP"): number;
/**
 * Calculates total cost of waste for a location
 * @param wasteRecords - Array of waste records
 * @param locationId - Location ID to calculate waste cost for
 * @param currency - Currency ("USD" or "COP")
 * @returns Total waste cost rounded to 2 decimal places
 */
export declare function calculateWasteCost(wasteRecords: WasteRecord[], locationId: string, currency: "USD" | "COP"): number;
/**
 * Calculates location performance score (0-100)
 * Components:
 * - Revenue performance (40 points max)
 * - Efficiency (30 points max)
 * - Waste control (20 points max)
 * - Profit margin (10 points max)
 * @param location - Location to score
 * @param sales - Array of sales transactions
 * @param wasteRecords - Array of waste records
 * @param menuItems - Array of menu items
 * @returns Performance score (0-100) rounded to 2 decimal places
 */
export declare function scoreLocationPerformance(location: Location, sales: SaleTransaction[], wasteRecords: WasteRecord[], menuItems: MenuItem[]): number;
/**
 * Ranks locations by performance score
 * @param locations - Array of locations
 * @param sales - Array of sales transactions
 * @param wasteRecords - Array of waste records
 * @param menuItems - Array of menu items
 * @returns Array of location performance results sorted by score (highest first)
 */
export declare function rankLocationsByPerformance(locations: Location[], sales: SaleTransaction[], wasteRecords: WasteRecord[], menuItems: MenuItem[]): LocationPerformanceResult[];
/**
 * Counts sales by payment method
 * @param sales - Array of sales transactions
 * @returns Object with count of sales for each payment method
 */
export declare function countSalesByPaymentMethod(sales: SaleTransaction[]): Record<PaymentMethod, number>;
/**
 * Calculates average ticket (sale value)
 * @param sales - Array of sales transactions
 * @param currency - Currency ("USD" or "COP")
 * @returns Average sale value rounded to 2 decimal places
 */
export declare function calculateAverageTicket(sales: SaleTransaction[], currency: "USD" | "COP"): number;
/**
 * Finds top N selling items
 * @param sales - Array of sales transactions
 * @param menuItems - Array of menu items
 * @param topN - Number of top items to return
 * @returns Array of top selling items with quantities (sorted highest first)
 */
export declare function findTopSellingItems(sales: SaleTransaction[], menuItems: MenuItem[], topN: number): TopSellingItemResult[];
/**
 * Groups waste records by reason
 * @param wasteRecords - Array of waste records
 * @returns Object with waste records grouped by reason
 */
export declare function groupWasteByReason(wasteRecords: WasteRecord[]): Record<WasteReason, WasteRecord[]>;
/**
 * Calculates comparative metrics between Colombia and USA
 * @param sales - Array of sales transactions
 * @param locations - Array of locations
 * @param menuItems - Array of menu items (unused but kept for interface consistency)
 * @returns Object with metrics for Colombia and USA
 */
export declare function calculateCountryComparison(sales: SaleTransaction[], locations: Location[], menuItems: MenuItem[]): {
    Colombia: CountryMetrics;
    USA: CountryMetrics;
};
//# sourceMappingURL=transformations.d.ts.map
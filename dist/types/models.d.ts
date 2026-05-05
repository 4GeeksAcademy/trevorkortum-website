/**
 * Brasaland Data Models
 * TypeScript interfaces and types for Brasaland restaurant operations
 */
/**
 * Price object representing costs in multiple currencies
 */
export interface Price {
    USD: number;
    COP: number;
}
/**
 * Menu categories
 */
export type MenuCategory = "Meat" | "Side" | "Beverage" | "Dessert" | "Combo";
/**
 * Menu item status
 */
export type MenuItemStatus = "Active" | "Seasonal" | "Discontinued";
/**
 * Menu item representing an item on Brasaland's menu
 */
export interface MenuItem {
    id: string;
    name: string;
    category: MenuCategory;
    basePrice: Price;
    ingredientCost: Price;
    prepTimeMinutes: number;
    isAvailableInColombia: boolean;
    isAvailableInUSA: boolean;
    allergens: string[];
    status: MenuItemStatus;
}
/**
 * Payment method types
 */
export type PaymentMethod = "Cash" | "Credit card" | "Debit card" | "Digital wallet";
/**
 * Sale transaction representing a sale made at a Brasaland location
 */
export interface SaleTransaction {
    id: string;
    locationId: string;
    itemId: string;
    quantity: number;
    totalPrice: Price;
    paymentMethod: PaymentMethod;
    timestamp: Date;
    waiterName: string;
}
/**
 * Country types
 */
export type Country = "Colombia" | "USA";
/**
 * Location status
 */
export type LocationStatus = "Active" | "Temporarily closed" | "Under renovation";
/**
 * Location representing a Brasaland restaurant location
 */
export interface Location {
    id: string;
    name: string;
    city: string;
    country: Country;
    openingYear: number;
    seatingCapacity: number;
    staffCount: number;
    monthlyRentCost: Price;
    averageMonthlyUtilities: Price;
    manager: string;
    status: LocationStatus;
}
/**
 * Waste reason types
 */
export type WasteReason = "Expired" | "Cooking error" | "Customer return" | "Damage" | "Other";
/**
 * Waste record tracking food waste at a location
 */
export interface WasteRecord {
    id: string;
    locationId: string;
    itemId: string;
    quantity: number;
    reason: WasteReason;
    cost: Price;
    timestamp: Date;
    reportedBy: string;
}
/**
 * Country metrics for comparative analysis
 */
export interface CountryMetrics {
    totalLocations: number;
    totalRevenue: Price;
    averageRevenuePerLocation: Price;
    totalSales: number;
}
/**
 * Location performance score result
 */
export interface LocationPerformanceResult {
    location: Location;
    score: number;
}
/**
 * Top selling item result
 */
export interface TopSellingItemResult {
    item: MenuItem;
    totalSold: number;
}
/**
 * Validation result
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
//# sourceMappingURL=models.d.ts.map
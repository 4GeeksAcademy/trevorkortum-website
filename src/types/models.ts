/**
 * Brasaland Data Models
 * TypeScript interfaces and types for Brasaland restaurant operations
 */

/**
 * Price object representing costs in multiple currencies
 */
export interface Price {
  USD: number; // Price in US Dollars
  COP: number; // Price in Colombian Pesos
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
  id: string; // Menu item ID (e.g., "ITEM-PICANHA-250")
  name: string; // Item name (e.g., "Picanha 250g")
  category: MenuCategory; // Food category
  basePrice: Price; // Base price (can vary by location)
  ingredientCost: Price; // Cost of ingredients per unit
  prepTimeMinutes: number; // Average preparation time
  isAvailableInColombia: boolean;
  isAvailableInUSA: boolean;
  allergens: string[]; // List of allergens
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
  id: string; // Transaction ID (e.g., "TXN-2024-15482")
  locationId: string; // Location where sale occurred
  itemId: string; // Menu item sold
  quantity: number; // Number of units sold
  totalPrice: Price; // Total price charged
  paymentMethod: PaymentMethod; // How customer paid
  timestamp: Date; // When the sale occurred
  waiterName: string; // Staff member who served
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
  id: string; // Location ID (e.g., "LOC-MEDELLIN-01")
  name: string; // Location name
  city: string; // City name
  country: Country; // Colombia or USA
  openingYear: number; // Year opened
  seatingCapacity: number; // Maximum number of customers
  staffCount: number; // Number of employees
  monthlyRentCost: Price; // Monthly rent
  averageMonthlyUtilities: Price; // Average monthly utilities
  manager: string; // Location manager name
  status: LocationStatus;
}

/**
 * Waste reason types
 */
export type WasteReason =
  | "Expired"
  | "Cooking error"
  | "Customer return"
  | "Damage"
  | "Other";

/**
 * Waste record tracking food waste at a location
 */
export interface WasteRecord {
  id: string; // Waste record ID
  locationId: string; // Location where waste occurred
  itemId: string; // Menu item wasted
  quantity: number; // Number of units wasted
  reason: WasteReason; // Why it was wasted
  cost: Price; // Cost of wasted items
  timestamp: Date; // When it was recorded
  reportedBy: string; // Staff member who reported it
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

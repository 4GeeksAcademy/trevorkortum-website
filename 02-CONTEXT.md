CONTEXT — Brasaland
Milestone 2: Programming Fundamentals
Company: Brasaland — Grilled Food Restaurant Chain
Your Role: Junior Developer, Brasaland Digital Team
Project Owner: Felipe Guerrero, Operations Director

About Brasaland
Brasaland is a grilled food restaurant chain with 14 company-owned locations across Colombia and the United States (Florida). The company focuses on consistent product quality, warm customer experience, and speed of service. You're part of Brasaland Digital, the internal team leading the company's digital transformation.

Your Assignment
Felipe Guerrero, the Operations Director, needs you to build the core data processing logic for Brasaland's restaurant operations system. Currently, location managers handle everything manually — tracking sales, calculating margins, managing waste, and ordering ingredients. This milestone focuses on building the TypeScript functions that will power sales analytics, waste control, and location performance scoring.

This is pure programming — no AI, no prompting. Felipe needs code that works reliably across 14 locations in two countries with different currencies and regulations.

What You're Building
You will implement a set of TypeScript utilities to:

- Model menu items, sales, locations, and waste records using interfaces
- Filter and search sales and menu data by location, date, category, and name
- Sort items and locations in ascending and descending order
- Calculate financial metrics, waste costs, and location performance scores
- Generate aggregated reports for payment methods, ticket averages, top sellers, waste reasons, and country comparison
- Validate data before processing

Implementation Rules

- All entity names, fields, and types must match exactly those specified in this document
- Each function must have explicit parameter and return types
- Functions must be pure: they only use their input values and do not modify global state or external variables
- Each function must have a single, clearly identifiable responsibility
- Empty arrays, missing elements, and not-found results must be handled correctly
- Use const by default and let only when a value will change
- Maintain consistent indentation and formatting throughout the code

Business Entities

MenuItem
Represents an item on Brasaland's menu.

Interface: MenuItem

interface MenuItem {
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

interface Price {
  USD: number; // Price in US Dollars
  COP: number; // Price in Colombian Pesos
}

type MenuCategory = "Meat" | "Side" | "Beverage" | "Dessert" | "Combo";
type MenuItemStatus = "Active" | "Seasonal" | "Discontinued";

Validation Rules:

- basePrice.USD and basePrice.COP must be greater than 0
- ingredientCost.USD and ingredientCost.COP must be greater than 0
- prepTimeMinutes must be greater than 0 and less than or equal to 60
- name must not be empty
- Item must be available in at least one country (Colombia or USA)

SaleTransaction
Represents a sale made at a Brasaland location.

Interface: SaleTransaction

interface SaleTransaction {
  id: string; // Transaction ID (e.g., "TXN-2024-15482")
  locationId: string; // Location where sale occurred
  itemId: string; // Menu item sold
  quantity: number; // Number of units sold
  totalPrice: Price; // Total price charged
  paymentMethod: PaymentMethod; // How customer paid
  timestamp: Date; // When the sale occurred
  waiterName: string; // Staff member who served
}

type PaymentMethod = "Cash" | "Credit card" | "Debit card" | "Digital wallet";

Validation Rules:

- quantity must be greater than 0
- totalPrice.USD and totalPrice.COP must be greater than 0
- waiterName must not be empty

Location
Represents a Brasaland restaurant location.

Interface: Location

interface Location {
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

type Country = "Colombia" | "USA";
type LocationStatus = "Active" | "Temporarily closed" | "Under renovation";

Validation Rules:

- openingYear must be between 2008 and the current year
- seatingCapacity must be greater than 0
- staffCount must be greater than 0
- monthlyRentCost.USD and monthlyRentCost.COP must be greater than 0
- averageMonthlyUtilities.USD and averageMonthlyUtilities.COP must be greater than 0

WasteRecord
Tracks food waste at a location.

Interface: WasteRecord

interface WasteRecord {
  id: string; // Waste record ID
  locationId: string; // Location where waste occurred
  itemId: string; // Menu item wasted
  quantity: number; // Number of units wasted
  reason: WasteReason; // Why it was wasted
  cost: Price; // Cost of wasted items
  timestamp: Date; // When it was recorded
  reportedBy: string; // Staff member who reported it
}

type WasteReason =
  | "Expired"
  | "Cooking error"
  | "Customer return"
  | "Damage"
  | "Other";

Required Functions
Implement these functions in the appropriate files according to the structure in the README.

1. Collection Operations (src/utils/collections.ts)

- filterSalesByLocation(sales: SaleTransaction[], locationId: string): SaleTransaction[]
  - Returns all sales from the specified location

- filterSalesByDateRange(sales: SaleTransaction[], startDate: Date, endDate: Date): SaleTransaction[]
  - Returns sales that occurred between start and end dates (inclusive)

- filterMenuItemsByCategory(items: MenuItem[], category: MenuCategory): MenuItem[]
  - Returns menu items in the specified category

- filterActiveLocations(locations: Location[]): Location[]
  - Returns locations with status "Active"

- sortLocationsByCapacity(locations: Location[], order: "asc" | "desc"): Location[]
  - Returns locations sorted by seating capacity
  - Must not mutate the original array

- sortMenuItemsByPrice(items: MenuItem[], currency: "USD" | "COP", order: "asc" | "desc"): MenuItem[]
  - Returns menu items sorted by price in the specified currency
  - Must not mutate the original array

2. Search Operations (src/utils/search.ts)

- findLocationById(locations: Location[], id: string): Location | null
  - Performs linear search to find a location by ID
  - Returns the location if found, or null otherwise

- findMenuItemByName(items: MenuItem[], name: string): MenuItem | null
  - Performs linear search to find a menu item by name
  - Comparison must be case-insensitive
  - Returns the item if found, or null otherwise

- binarySearchLocationByCapacity(sortedLocations: Location[], targetCapacity: number): number
  - Assumes the array is already sorted by seating capacity in ascending order
  - Performs binary search to find the index of a location with the target capacity
  - Returns the index if found, or -1 otherwise

3. Financial Calculations (src/utils/transformations.ts)

- calculateDailyRevenue(sales: SaleTransaction[], date: Date, currency: "USD" | "COP"): number
  - Calculates total revenue for a specific date in the specified currency
  - Returns total rounded to 2 decimal places

- calculateLocationMargin(sales: SaleTransaction[], menuItems: MenuItem[], locationId: string, currency: "USD" | "COP"): number
  - Calculates profit margin for a location
  - Formula: ((Total Revenue - Total Ingredient Cost) / Total Revenue) * 100
  - Uses sales from that location only
  - Joins sales with menu items to get ingredient costs
  - Returns margin as percentage (0-100), rounded to 2 decimal places

- calculateWasteCost(wasteRecords: WasteRecord[], locationId: string, currency: "USD" | "COP"): number
  - Calculates total cost of waste for a location in the specified currency
  - Returns total rounded to 2 decimal places

- convertCurrency(amount: number, fromCurrency: "USD" | "COP", toCurrency: "USD" | "COP"): number
  - Converts between USD and COP using a fixed exchange rate
  - Use rate: 1 USD = 4000 COP
  - Returns converted amount rounded to 2 decimal places
  - If from and to are the same, return the original amount

4. Location Performance Scoring (src/utils/transformations.ts)

- scoreLocationPerformance(location: Location, sales: SaleTransaction[], wasteRecords: WasteRecord[], menuItems: MenuItem[]): number
  - Calculates a performance score (0-100) for a location based on:
    - Revenue performance (40 points max)
      - Calculate daily average revenue using total revenue and estimated operating days from openingYear
      - Score: (avg daily revenue in USD / 1000) * 40, capped at 40
    - Efficiency (30 points max)
      - Calculate seats efficiency: (total sales count / seating capacity) * 30, capped at 30
    - Waste control (20 points max)
      - Calculate waste percentage: (total waste cost / total revenue) * 100
      - Score: 20 - (waste percentage * 2), minimum 0
    - Profit margin (10 points max)
      - Use calculateLocationMargin function
      - Score: margin / 10, capped at 10
  - Returns total score rounded to 2 decimal places

- rankLocationsByPerformance(locations: Location[], sales: SaleTransaction[], wasteRecords: WasteRecord[], menuItems: MenuItem[]): Array<{ location: Location; score: number }>
  - Scores all locations
  - Returns them sorted by score in descending order
  - Each element contains the location and its score

5. Aggregations and Reports (src/utils/transformations.ts)

- countSalesByPaymentMethod(sales: SaleTransaction[]): Record<PaymentMethod, number>
  - Returns counts of sales for each payment method

- calculateAverageTicket(sales: SaleTransaction[], currency: "USD" | "COP"): number
  - Returns average sale value in the specified currency
  - Round to 2 decimal places

- findTopSellingItems(sales: SaleTransaction[], menuItems: MenuItem[], topN: number): Array<{ item: MenuItem; totalSold: number }>
  - Finds the top N most sold menu items
  - Joins sales with menu items
  - Returns sorted results by total quantity sold in descending order

- groupWasteByReason(wasteRecords: WasteRecord[]): Record<WasteReason, WasteRecord[]>
  - Groups waste records by reason
  - Returns an object where keys are waste reasons and values are arrays of records

- calculateCountryComparison(sales: SaleTransaction[], locations: Location[], menuItems: MenuItem[]): { Colombia: CountryMetrics; USA: CountryMetrics }
  - Returns comparative metrics for each country

interface CountryMetrics {
  totalLocations: number;
  totalRevenue: Price;
  averageRevenuePerLocation: Price;
  totalSales: number;
}

6. Validations (src/utils/validations.ts)

- validateMenuItem(item: MenuItem): { valid: boolean; errors: string[] }
  - Validates all business rules for a menu item
  - Returns valid = true when all validations pass, or false otherwise
  - Returns an array of error messages when invalid

- validateSaleTransaction(sale: SaleTransaction): { valid: boolean; errors: string[] }
  - Validates all business rules for a sale transaction
  - Returns valid = true when all validations pass, or false otherwise
  - Returns an array of error messages when invalid

- validateLocation(location: Location): { valid: boolean; errors: string[] }
  - Validates all business rules for a location
  - Returns valid = true when all validations pass, or false otherwise
  - Returns an array of error messages when invalid

Evaluation Criteria

Your implementation will be evaluated on:

- Technical correctness of the data model and functions
- Exact match of entity names, fields, and types to the rules above
- Correct behavior of filtering, sorting, and searching operations
- Correct aggregation totals, averages, counts, and extreme values
- Correct validation of invalid inputs
- Pure functions with no external side effects
- Empty and not-found cases handled cleanly
- No TypeScript compilation errors
- Local validation/execution commands documented: npm run typecheck, npm run build, npm run demo, npm run serve

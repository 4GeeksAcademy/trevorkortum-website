/**
 * Data Transformations and Aggregations
 * Financial calculations, performance scoring, and reporting functions
 */

import {
  SaleTransaction,
  MenuItem,
  Location,
  WasteRecord,
  PaymentMethod,
  WasteReason,
  CountryMetrics,
  LocationPerformanceResult,
  TopSellingItemResult,
} from "../types/models";

// Constants
const USD_TO_COP_RATE = 4000;
const CURRENT_YEAR = new Date().getFullYear();

/**
 * Converts amount between USD and COP
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency ("USD" or "COP")
 * @param toCurrency - Target currency ("USD" or "COP")
 * @returns Converted amount rounded to 2 decimal places
 */
export function convertCurrency(
  amount: number,
  fromCurrency: "USD" | "COP",
  toCurrency: "USD" | "COP"
): number {
  if (fromCurrency === toCurrency) {
    return Math.round(amount * 100) / 100;
  }

  let result: number;
  if (fromCurrency === "USD" && toCurrency === "COP") {
    result = amount * USD_TO_COP_RATE;
  } else {
    result = amount / USD_TO_COP_RATE;
  }

  return Math.round(result * 100) / 100;
}

/**
 * Calculates total revenue for a specific date in specified currency
 * @param sales - Array of sales transactions
 * @param date - Date to calculate revenue for
 * @param currency - Currency ("USD" or "COP")
 * @returns Total revenue rounded to 2 decimal places
 */
export function calculateDailyRevenue(
  sales: SaleTransaction[],
  date: Date,
  currency: "USD" | "COP"
): number {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const dailySales = sales.filter((sale) => {
    const saleDate = sale.timestamp;
    return saleDate >= dayStart && saleDate <= dayEnd;
  });

  let total = 0;
  for (const sale of dailySales) {
    total += sale.totalPrice[currency];
  }

  return Math.round(total * 100) / 100;
}

/**
 * Calculates profit margin for a location
 * Formula: ((Total Revenue - Total Ingredient Cost) / Total Revenue) * 100
 * @param sales - Array of sales transactions
 * @param menuItems - Array of menu items
 * @param locationId - Location ID to calculate margin for
 * @param currency - Currency ("USD" or "COP")
 * @returns Profit margin as percentage (0-100), rounded to 2 decimal places
 */
export function calculateLocationMargin(
  sales: SaleTransaction[],
  menuItems: MenuItem[],
  locationId: string,
  currency: "USD" | "COP"
): number {
  // Filter sales for location
  const locationSales = sales.filter((sale) => sale.locationId === locationId);

  if (locationSales.length === 0) {
    return 0;
  }

  // Create item lookup map
  const itemMap = new Map<string, MenuItem>();
  for (const item of menuItems) {
    itemMap.set(item.id, item);
  }

  // Calculate total revenue and total ingredient cost
  let totalRevenue = 0;
  let totalCost = 0;

  for (const sale of locationSales) {
    totalRevenue += sale.totalPrice[currency];

    const item = itemMap.get(sale.itemId);
    if (item) {
      totalCost += item.ingredientCost[currency] * sale.quantity;
    }
  }

  if (totalRevenue === 0) {
    return 0;
  }

  const margin = ((totalRevenue - totalCost) / totalRevenue) * 100;
  return Math.round(margin * 100) / 100;
}

/**
 * Calculates total cost of waste for a location
 * @param wasteRecords - Array of waste records
 * @param locationId - Location ID to calculate waste cost for
 * @param currency - Currency ("USD" or "COP")
 * @returns Total waste cost rounded to 2 decimal places
 */
export function calculateWasteCost(
  wasteRecords: WasteRecord[],
  locationId: string,
  currency: "USD" | "COP"
): number {
  const locationWaste = wasteRecords.filter(
    (record) => record.locationId === locationId
  );

  let totalWasteCost = 0;
  for (const record of locationWaste) {
    totalWasteCost += record.cost[currency];
  }

  return Math.round(totalWasteCost * 100) / 100;
}

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
export function scoreLocationPerformance(
  location: Location,
  sales: SaleTransaction[],
  wasteRecords: WasteRecord[],
  menuItems: MenuItem[]
): number {
  // Revenue Performance (40 points max)
  const locationSales = sales.filter(
    (sale) => sale.locationId === location.id
  );
  const totalRevenue = locationSales.reduce(
    (sum, sale) => sum + sale.totalPrice.USD,
    0
  );

  const yearsSinceOpening = CURRENT_YEAR - location.openingYear;
  const operatingDays = Math.max(1, yearsSinceOpening * 365); // Approximate days
  const avgDailyRevenue = totalRevenue / operatingDays;
  let revenueScore = Math.min((avgDailyRevenue / 1000) * 40, 40);

  // Efficiency (30 points max)
  const seatsEfficiency = Math.min(
    (locationSales.length / location.seatingCapacity) * 30,
    30
  );

  // Waste Control (20 points max)
  const wasteCost = calculateWasteCost(
    wasteRecords,
    location.id,
    "USD"
  );
  const wastePercentage = totalRevenue > 0 ? (wasteCost / totalRevenue) * 100 : 0;
  const wasteScore = Math.max(20 - wastePercentage * 2, 0);

  // Profit Margin (10 points max)
  const margin = calculateLocationMargin(
    sales,
    menuItems,
    location.id,
    "USD"
  );
  const marginScore = Math.min(margin / 10, 10);

  const totalScore = revenueScore + seatsEfficiency + wasteScore + marginScore;
  return Math.round(totalScore * 100) / 100;
}

/**
 * Ranks locations by performance score
 * @param locations - Array of locations
 * @param sales - Array of sales transactions
 * @param wasteRecords - Array of waste records
 * @param menuItems - Array of menu items
 * @returns Array of location performance results sorted by score (highest first)
 */
export function rankLocationsByPerformance(
  locations: Location[],
  sales: SaleTransaction[],
  wasteRecords: WasteRecord[],
  menuItems: MenuItem[]
): LocationPerformanceResult[] {
  const results: LocationPerformanceResult[] = locations.map((location) => ({
    location,
    score: scoreLocationPerformance(location, sales, wasteRecords, menuItems),
  }));

  results.sort((a, b) => b.score - a.score);
  return results;
}

/**
 * Counts sales by payment method
 * @param sales - Array of sales transactions
 * @returns Object with count of sales for each payment method
 */
export function countSalesByPaymentMethod(
  sales: SaleTransaction[]
): Record<PaymentMethod, number> {
  const counts: Record<PaymentMethod, number> = {
    Cash: 0,
    "Credit card": 0,
    "Debit card": 0,
    "Digital wallet": 0,
  };

  for (const sale of sales) {
    counts[sale.paymentMethod]++;
  }

  return counts;
}

/**
 * Calculates average ticket (sale value)
 * @param sales - Array of sales transactions
 * @param currency - Currency ("USD" or "COP")
 * @returns Average sale value rounded to 2 decimal places
 */
export function calculateAverageTicket(
  sales: SaleTransaction[],
  currency: "USD" | "COP"
): number {
  if (sales.length === 0) {
    return 0;
  }

  const total = sales.reduce((sum, sale) => sum + sale.totalPrice[currency], 0);
  const average = total / sales.length;
  return Math.round(average * 100) / 100;
}

/**
 * Finds top N selling items
 * @param sales - Array of sales transactions
 * @param menuItems - Array of menu items
 * @param topN - Number of top items to return
 * @returns Array of top selling items with quantities (sorted highest first)
 */
export function findTopSellingItems(
  sales: SaleTransaction[],
  menuItems: MenuItem[],
  topN: number
): TopSellingItemResult[] {
  // Create lookup map
  const itemMap = new Map<string, MenuItem>();
  for (const item of menuItems) {
    itemMap.set(item.id, item);
  }

  // Count quantities by item
  const itemQuantities = new Map<string, number>();
  for (const sale of sales) {
    const current = itemQuantities.get(sale.itemId) || 0;
    itemQuantities.set(sale.itemId, current + sale.quantity);
  }

  // Convert to results and sort
  const results: TopSellingItemResult[] = [];
  for (const [itemId, quantity] of itemQuantities) {
    const item = itemMap.get(itemId);
    if (item) {
      results.push({ item, totalSold: quantity });
    }
  }

  results.sort((a, b) => b.totalSold - a.totalSold);
  return results.slice(0, topN);
}

/**
 * Groups waste records by reason
 * @param wasteRecords - Array of waste records
 * @returns Object with waste records grouped by reason
 */
export function groupWasteByReason(
  wasteRecords: WasteRecord[]
): Record<WasteReason, WasteRecord[]> {
  const groups: Record<WasteReason, WasteRecord[]> = {
    Expired: [],
    "Cooking error": [],
    "Customer return": [],
    Damage: [],
    Other: [],
  };

  for (const record of wasteRecords) {
    groups[record.reason].push(record);
  }

  return groups;
}

/**
 * Calculates comparative metrics between Colombia and USA
 * @param sales - Array of sales transactions
 * @param locations - Array of locations
 * @param menuItems - Array of menu items (unused but kept for interface consistency)
 * @returns Object with metrics for Colombia and USA
 */
export function calculateCountryComparison(
  sales: SaleTransaction[],
  locations: Location[],
  menuItems: MenuItem[]
): { Colombia: CountryMetrics; USA: CountryMetrics } {
  // Get locations by country
  const colombiaLocations = locations.filter(
    (loc) => loc.country === "Colombia"
  );
  const usaLocations = locations.filter((loc) => loc.country === "USA");

  // Get sales by country locations
  const colombiaSales = sales.filter((sale) => {
    const location = locations.find((l) => l.id === sale.locationId);
    return location?.country === "Colombia";
  });

  const usaSales = sales.filter((sale) => {
    const location = locations.find((l) => l.id === sale.locationId);
    return location?.country === "USA";
  });

  // Calculate Colombia metrics
  const colombiaTotalRevenue = colombiaSales.reduce(
    (sum, sale) => ({
      USD: sum.USD + sale.totalPrice.USD,
      COP: sum.COP + sale.totalPrice.COP,
    }),
    { USD: 0, COP: 0 }
  );

  const colombiaAvgRevenue = {
    USD:
      colombiaLocations.length > 0
        ? Math.round((colombiaTotalRevenue.USD / colombiaLocations.length) * 100) /
          100
        : 0,
    COP:
      colombiaLocations.length > 0
        ? Math.round((colombiaTotalRevenue.COP / colombiaLocations.length) * 100) /
          100
        : 0,
  };

  // Calculate USA metrics
  const usaTotalRevenue = usaSales.reduce(
    (sum, sale) => ({
      USD: sum.USD + sale.totalPrice.USD,
      COP: sum.COP + sale.totalPrice.COP,
    }),
    { USD: 0, COP: 0 }
  );

  const usaAvgRevenue = {
    USD:
      usaLocations.length > 0
        ? Math.round((usaTotalRevenue.USD / usaLocations.length) * 100) / 100
        : 0,
    COP:
      usaLocations.length > 0
        ? Math.round((usaTotalRevenue.COP / usaLocations.length) * 100) / 100
        : 0,
  };

  return {
    Colombia: {
      totalLocations: colombiaLocations.length,
      totalRevenue: {
        USD: Math.round(colombiaTotalRevenue.USD * 100) / 100,
        COP: Math.round(colombiaTotalRevenue.COP * 100) / 100,
      },
      averageRevenuePerLocation: colombiaAvgRevenue,
      totalSales: colombiaSales.length,
    },
    USA: {
      totalLocations: usaLocations.length,
      totalRevenue: {
        USD: Math.round(usaTotalRevenue.USD * 100) / 100,
        COP: Math.round(usaTotalRevenue.COP * 100) / 100,
      },
      averageRevenuePerLocation: usaAvgRevenue,
      totalSales: usaSales.length,
    },
  };
}

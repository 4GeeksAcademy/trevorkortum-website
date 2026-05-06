/**
 * Brasaland Data Processing Demo
 * Tests all utilities with sample data
 */
import { filterSalesByLocation, filterMenuItemsByCategory, filterActiveLocations, sortLocationsByCapacity, sortMenuItemsByPrice, findLocationById, findMenuItemByName, binarySearchLocationByCapacity, convertCurrency, calculateDailyRevenue, calculateLocationMargin, calculateWasteCost, countSalesByPaymentMethod, calculateAverageTicket, findTopSellingItems, groupWasteByReason, calculateCountryComparison, validateMenuItem, validateSaleTransaction, validateLocation, } from "./index";
// Sample Data
const sampleMenuItems = [
    {
        id: "ITEM-PICANHA-250",
        name: "Picanha 250g",
        category: "Meat",
        basePrice: { USD: 18.5, COP: 74000 },
        ingredientCost: { USD: 7.2, COP: 28800 },
        prepTimeMinutes: 15,
        isAvailableInColombia: true,
        isAvailableInUSA: true,
        allergens: [],
        status: "Active",
    },
    {
        id: "ITEM-FRIES",
        name: "French Fries",
        category: "Side",
        basePrice: { USD: 4.5, COP: 18000 },
        ingredientCost: { USD: 1.2, COP: 4800 },
        prepTimeMinutes: 8,
        isAvailableInColombia: true,
        isAvailableInUSA: true,
        allergens: [],
        status: "Active",
    },
    {
        id: "ITEM-COKE",
        name: "Coca-Cola",
        category: "Beverage",
        basePrice: { USD: 2.5, COP: 10000 },
        ingredientCost: { USD: 0.8, COP: 3200 },
        prepTimeMinutes: 2,
        isAvailableInColombia: true,
        isAvailableInUSA: true,
        allergens: [],
        status: "Active",
    },
    {
        id: "ITEM-DESSERT",
        name: "Flan",
        category: "Dessert",
        basePrice: { USD: 5.0, COP: 20000 },
        ingredientCost: { USD: 1.5, COP: 6000 },
        prepTimeMinutes: 3,
        isAvailableInColombia: true,
        isAvailableInUSA: false,
        allergens: ["Dairy"],
        status: "Active",
    },
];
const sampleLocations = [
    {
        id: "LOC-MEDELLIN-01",
        name: "Brasaland Medellín Centro",
        city: "Medellín",
        country: "Colombia",
        openingYear: 2008,
        seatingCapacity: 80,
        staffCount: 12,
        monthlyRentCost: { USD: 1500, COP: 6000000 },
        averageMonthlyUtilities: { USD: 400, COP: 1600000 },
        manager: "Carlos Jiménez",
        status: "Active",
    },
    {
        id: "LOC-MIAMI-01",
        name: "Brasaland Miami Beach",
        city: "Miami",
        country: "USA",
        openingYear: 2018,
        seatingCapacity: 100,
        staffCount: 15,
        monthlyRentCost: { USD: 5500, COP: 22000000 },
        averageMonthlyUtilities: { USD: 800, COP: 3200000 },
        manager: "Jake Morrison",
        status: "Active",
    },
    {
        id: "LOC-BOGOTA-01",
        name: "Brasaland Bogotá",
        city: "Bogotá",
        country: "Colombia",
        openingYear: 2015,
        seatingCapacity: 60,
        staffCount: 10,
        monthlyRentCost: { USD: 1200, COP: 4800000 },
        averageMonthlyUtilities: { USD: 350, COP: 1400000 },
        manager: "Diana López",
        status: "Temporarily closed",
    },
];
const sampleSales = [
    {
        id: "TXN-2024-15482",
        locationId: "LOC-MEDELLIN-01",
        itemId: "ITEM-PICANHA-250",
        quantity: 2,
        totalPrice: { USD: 37.0, COP: 148000 },
        paymentMethod: "Credit card",
        timestamp: new Date("2024-03-15T19:30:00"),
        waiterName: "María González",
    },
    {
        id: "TXN-2024-15483",
        locationId: "LOC-MIAMI-01",
        itemId: "ITEM-FRIES",
        quantity: 3,
        totalPrice: { USD: 13.5, COP: 54000 },
        paymentMethod: "Cash",
        timestamp: new Date("2024-03-15T20:15:00"),
        waiterName: "John Smith",
    },
    {
        id: "TXN-2024-15484",
        locationId: "LOC-MEDELLIN-01",
        itemId: "ITEM-COKE",
        quantity: 5,
        totalPrice: { USD: 12.5, COP: 50000 },
        paymentMethod: "Debit card",
        timestamp: new Date("2024-03-15T18:45:00"),
        waiterName: "María González",
    },
    {
        id: "TXN-2024-15485",
        locationId: "LOC-MIAMI-01",
        itemId: "ITEM-PICANHA-250",
        quantity: 1,
        totalPrice: { USD: 18.5, COP: 74000 },
        paymentMethod: "Digital wallet",
        timestamp: new Date("2024-03-16T19:00:00"),
        waiterName: "John Smith",
    },
];
const sampleWaste = [
    {
        id: "WASTE-001",
        locationId: "LOC-MEDELLIN-01",
        itemId: "ITEM-FRIES",
        quantity: 2,
        reason: "Cooking error",
        cost: { USD: 2.4, COP: 9600 },
        timestamp: new Date("2024-03-15T17:30:00"),
        reportedBy: "Carlos Jiménez",
    },
    {
        id: "WASTE-002",
        locationId: "LOC-MIAMI-01",
        itemId: "ITEM-COKE",
        quantity: 3,
        reason: "Expired",
        cost: { USD: 2.4, COP: 9600 },
        timestamp: new Date("2024-03-16T10:00:00"),
        reportedBy: "Jake Morrison",
    },
];
// Demo execution
function main() {
    console.log("=== BRASALAND DATA PROCESSING DEMO ===\n");
    // Collection Operations
    console.log("--- COLLECTION OPERATIONS ---");
    console.log("\n1. Filter sales by location (Medellín):");
    const medellinSales = filterSalesByLocation(sampleSales, "LOC-MEDELLIN-01");
    console.log(`   Found ${medellinSales.length} sales`);
    console.log("\n2. Filter menu items by category (Meat):");
    const meatItems = filterMenuItemsByCategory(sampleMenuItems, "Meat");
    console.log(`   Found ${meatItems.length} items: ${meatItems.map((i) => i.name).join(", ")}`);
    console.log("\n3. Filter active locations:");
    const activeLocations = filterActiveLocations(sampleLocations);
    console.log(`   Found ${activeLocations.length} active locations`);
    console.log("\n4. Sort locations by capacity (ascending):");
    const sortedByCapacity = sortLocationsByCapacity(sampleLocations, "asc");
    sortedByCapacity.forEach((loc) => {
        console.log(`   ${loc.name}: ${loc.seatingCapacity} seats`);
    });
    console.log("\n5. Sort menu items by price (USD, descending):");
    const sortedByPrice = sortMenuItemsByPrice(sampleMenuItems, "USD", "desc");
    sortedByPrice.forEach((item) => {
        console.log(`   ${item.name}: $${item.basePrice.USD}`);
    });
    // Search Operations
    console.log("\n--- SEARCH OPERATIONS ---");
    console.log("\n6. Find location by ID (LOC-MEDELLIN-01):");
    const found = findLocationById(sampleLocations, "LOC-MEDELLIN-01");
    console.log(`   ${found ? `Found: ${found.name}` : "Not found"}`);
    console.log("\n7. Find menu item by name (case-insensitive - 'FRENCH FRIES'):");
    const foundItem = findMenuItemByName(sampleMenuItems, "FRENCH FRIES");
    console.log(`   ${foundItem ? `Found: ${foundItem.name}` : "Not found"}`);
    console.log("\n8. Binary search location by capacity (in sorted array):");
    const sortedLocs = sortLocationsByCapacity(sampleLocations, "asc");
    const index = binarySearchLocationByCapacity(sortedLocs, 100);
    console.log(`   Location with 100 seats at index: ${index}`);
    // Financial Calculations
    console.log("\n--- FINANCIAL CALCULATIONS ---");
    console.log("\n9. Currency conversion (100 USD to COP):");
    const converted = convertCurrency(100, "USD", "COP");
    console.log(`   100 USD = ${converted} COP`);
    console.log("\n10. Daily revenue (2024-03-15, USD):");
    const dailyRev = calculateDailyRevenue(sampleSales, new Date("2024-03-15"), "USD");
    console.log(`    Total: $${dailyRev}`);
    console.log("\n11. Location margin (LOC-MEDELLIN-01, USD):");
    const margin = calculateLocationMargin(sampleSales, sampleMenuItems, "LOC-MEDELLIN-01", "USD");
    console.log(`    Margin: ${margin}%`);
    console.log("\n12. Waste cost (LOC-MEDELLIN-01, USD):");
    const wasteCost = calculateWasteCost(sampleWaste, "LOC-MEDELLIN-01", "USD");
    console.log(`    Total waste cost: $${wasteCost}`);
    // Aggregations
    console.log("\n--- AGGREGATIONS & REPORTS ---");
    console.log("\n13. Count sales by payment method:");
    const paymentCounts = countSalesByPaymentMethod(sampleSales);
    Object.entries(paymentCounts).forEach(([method, count]) => {
        console.log(`    ${method}: ${count}`);
    });
    console.log("\n14. Average ticket (USD):");
    const avgTicket = calculateAverageTicket(sampleSales, "USD");
    console.log(`    $${avgTicket}`);
    console.log("\n15. Top 2 selling items:");
    const topItems = findTopSellingItems(sampleSales, sampleMenuItems, 2);
    topItems.forEach((result) => {
        console.log(`    ${result.item.name}: ${result.totalSold} units`);
    });
    console.log("\n16. Waste grouped by reason:");
    const wasteGroups = groupWasteByReason(sampleWaste);
    Object.entries(wasteGroups).forEach(([reason, records]) => {
        if (records.length > 0) {
            console.log(`    ${reason}: ${records.length} record(s)`);
        }
    });
    console.log("\n17. Country comparison:");
    const comparison = calculateCountryComparison(sampleSales, sampleLocations, sampleMenuItems);
    console.log(`    Colombia: ${comparison.Colombia.totalLocations} locations, $${comparison.Colombia.totalRevenue.USD} USD`);
    console.log(`    USA: ${comparison.USA.totalLocations} locations, $${comparison.USA.totalRevenue.USD} USD`);
    // Validations
    console.log("\n--- VALIDATIONS ---");
    console.log("\n18. Validate menu item (valid):");
    const menuValidation = validateMenuItem(sampleMenuItems[0]);
    console.log(`    Valid: ${menuValidation.valid}`);
    if (menuValidation.errors.length > 0) {
        menuValidation.errors.forEach((err) => console.log(`    Error: ${err}`));
    }
    console.log("\n19. Validate sale transaction (valid):");
    const saleValidation = validateSaleTransaction(sampleSales[0]);
    console.log(`    Valid: ${saleValidation.valid}`);
    console.log("\n20. Validate location (valid):");
    const locValidation = validateLocation(sampleLocations[0]);
    console.log(`    Valid: ${locValidation.valid}`);
    // Invalid data test
    console.log("\n21. Validate invalid menu item (negative price):");
    const invalidItem = {
        ...sampleMenuItems[0],
        basePrice: { USD: -10, COP: -40000 },
    };
    const invalidValidation = validateMenuItem(invalidItem);
    console.log(`    Valid: ${invalidValidation.valid}`);
    invalidValidation.errors.forEach((err) => console.log(`    Error: ${err}`));
    console.log("\n=== DEMO COMPLETE ===");
}
main();
//# sourceMappingURL=demo.js.map
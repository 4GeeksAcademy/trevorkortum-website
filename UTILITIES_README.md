# Brasaland Data Processing Utilities

TypeScript utilities for Brasaland restaurant operations and data processing. This project implements core data manipulation functions for a 14-location restaurant chain operating in Colombia and the USA.

## 🏗️ Project Structure

```
src/
├── types/
│   └── models.ts          # TypeScript interfaces and types
├── utils/
│   ├── collections.ts     # Filtering and sorting operations
│   ├── search.ts          # Linear and binary search functions
│   ├── transformations.ts # Financial calculations and reports
│   └── validations.ts     # Business rule validations
├── index.ts               # Main entry point
└── demo.ts               # Demo script with sample data
```

## 🚀 Getting Started

### Installation

```bash
npm install
```

### TypeScript Type Checking

```bash
npm run typecheck
```

This validates all TypeScript code without compiling to JavaScript.

### Run Demo

```bash
npm run demo
```

Executes the demo script with sample data demonstrating all utility functions.

### Build

```bash
npm run build
```

Compiles TypeScript to JavaScript in the `dist/` directory.

## 📦 Available Utilities

### Collection Operations (`collections.ts`)

- `filterSalesByLocation()` - Filter sales by location ID
- `filterSalesByDateRange()` - Filter sales by date range
- `filterMenuItemsByCategory()` - Filter menu items by category
- `filterActiveLocations()` - Get only active locations
- `sortLocationsByCapacity()` - Sort locations by seating capacity
- `sortMenuItemsByPrice()` - Sort menu items by price (USD or COP)

### Search Operations (`search.ts`)

- `findLocationById()` - Linear search for location by ID
- `findMenuItemByName()` - Linear search for menu item by name (case-insensitive)
- `binarySearchLocationByCapacity()` - Binary search on sorted locations by capacity

### Financial Calculations (`transformations.ts`)

- `convertCurrency()` - Convert between USD and COP (1 USD = 4000 COP)
- `calculateDailyRevenue()` - Calculate revenue for a specific date
- `calculateLocationMargin()` - Calculate profit margin percentage
- `calculateWasteCost()` - Calculate total waste cost for a location
- `scoreLocationPerformance()` - Score location performance (0-100) based on multiple metrics

### Aggregations & Reports (`transformations.ts`)

- `rankLocationsByPerformance()` - Rank all locations by performance score
- `countSalesByPaymentMethod()` - Count sales by payment method
- `calculateAverageTicket()` - Calculate average sale value
- `findTopSellingItems()` - Find top N selling items
- `groupWasteByReason()` - Group waste records by reason
- `calculateCountryComparison()` - Compare metrics between Colombia and USA

### Validations (`validations.ts`)

- `validateMenuItem()` - Validate menu item business rules
- `validateSaleTransaction()` - Validate sale transaction rules
- `validateLocation()` - Validate location data

## 📊 Business Entities

### MenuItem
Represents items on Brasaland's menu with pricing in USD and COP, ingredient costs, and availability by country.

### SaleTransaction
Records a single sale with location, item, quantity, total price, payment method, and staff member.

### Location
Represents a Brasaland restaurant with location ID, city, country, staff count, seating capacity, and costs.

### WasteRecord
Tracks food waste by location, reason, and cost.

## 💰 Currency Handling

All financial calculations support both USD and COP:
- Exchange Rate: 1 USD = 4000 COP
- All amounts are rounded to 2 decimal places
- Currency conversion is handled automatically

## ✅ Validation Rules

### MenuItem
- Name must not be empty
- Both USD and COP prices must be > 0
- Prep time must be > 0 and <= 60 minutes
- Must be available in at least one country

### SaleTransaction
- Quantity must be > 0
- Both price values must be > 0
- Waiter name must not be empty

### Location
- Opening year must be 2008 or later
- Seating capacity must be > 0
- Staff count must be > 0
- Rent and utilities costs must be > 0

## 🎯 Key Features

✨ **Type Safety** - Full TypeScript with strict mode enabled
✨ **Pure Functions** - No global state, all parameters explicit
✨ **Currency Support** - Dual currency (USD/COP) throughout
✨ **No Mutations** - Sorting/filtering create new arrays
✨ **Edge Cases** - Handles empty arrays, null values, and invalid data
✨ **Performance Scoring** - Multi-metric location evaluation

## 📝 Example Usage

```typescript
import {
  filterSalesByLocation,
  calculateLocationMargin,
  validateMenuItem,
  findTopSellingItems,
} from "./index";

// Filter sales for a specific location
const locationSales = filterSalesByLocation(allSales, "LOC-MEDELLIN-01");

// Calculate profit margin
const margin = calculateLocationMargin(
  allSales,
  menuItems,
  "LOC-MEDELLIN-01",
  "USD"
);

// Validate a menu item
const result = validateMenuItem(newMenuItem);
if (result.valid) {
  console.log("Item is valid!");
} else {
  console.log("Errors:", result.errors);
}

// Find top sellers
const topItems = findTopSellingItems(allSales, menuItems, 5);
```

## 🔧 Technology Stack

- **TypeScript 5.3** - Strict mode enabled
- **Node.js ES2020** - Modern JavaScript features
- **tsx** - TypeScript execution for Node.js
- **ESLint ready** - Compatible with linting

## 📋 Requirements Met

✅ Collection management (filter, sort, search, group)
✅ Linear search for unsorted arrays
✅ Binary search for sorted arrays
✅ Data modeling with TypeScript interfaces
✅ Financial calculations with multi-currency support
✅ Location performance scoring
✅ Business validations
✅ Pure functions with no global state
✅ Clean code with single responsibility principle
✅ Edge case handling

## 🧪 Testing

Run the demo to see all functions in action with sample data:

```bash
npm run demo
```

The demo includes:
- 4 sample menu items
- 3 sample locations (2 active, 1 temporarily closed)
- 4 sample sales transactions
- 2 sample waste records

## 📚 Documentation

Each utility function includes:
- JSDoc comments explaining purpose
- Parameter descriptions with types
- Return value documentation
- Business logic explanations

## 🎓 Learning Concepts

This project demonstrates:

- **Arrays & Matrices** - Storage, traversal, sorting, searching
- **Search Algorithms** - Linear vs. Binary search implementation
- **Interfaces & Types** - Strong typing with TypeScript
- **Pure Functions** - Functional programming principles
- **Array Methods** - map(), filter(), reduce() usage
- **Business Logic** - Real-world validation and calculations

## 📞 Support

Built for Felipe Guerrero, Operations Director at Brasaland.
For questions about requirements, refer to the project brief in 02-CONTEXT.md.

---

**Status**: Production Ready ✅

All functions tested, TypeScript validated, and ready for integration into Brasaland's operations system.

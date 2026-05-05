# Quick Start Guide - Brasaland Data Utilities

## 🚀 Get Started in 30 Seconds

```bash
# 1. Navigate to project
cd /workspaces/trevorkortum-website

# 2. Install dependencies
npm install

# 3. Run demo to see all functions in action
npm run demo
```

Done! All 23+ utility functions are ready to use.

---

## 📂 Project Structure

```
src/
├── types/models.ts         ← Business entities (MenuItem, Location, etc.)
├── utils/
│   ├── collections.ts      ← Filter & sort operations
│   ├── search.ts           ← Linear & binary search
│   ├── transformations.ts  ← Financial calculations & reports
│   └── validations.ts      ← Business rule validation
├── index.ts                ← Main exports
└── demo.ts                 ← Example usage with sample data
```

---

## 🎯 Available Commands

```bash
npm run typecheck    # Validate TypeScript (no build)
npm run build        # Compile to JavaScript
npm run demo         # Run executable demo
```

---

## 💡 Quick Examples

### Filter Data
```typescript
import { filterSalesByLocation, filterActiveLocations } from './src/index';

const medellinSales = filterSalesByLocation(sales, 'LOC-MEDELLIN-01');
const activeLocs = filterActiveLocations(locations);
```

### Search
```typescript
import { findLocationById, findMenuItemByName } from './src/index';

const loc = findLocationById(locations, 'LOC-MIAMI-01');
const item = findMenuItemByName(items, 'Picanha 250g');
```

### Calculate Metrics
```typescript
import { calculateLocationMargin, calculateDailyRevenue } from './src/index';

const margin = calculateLocationMargin(sales, items, 'LOC-MEDELLIN-01', 'USD');
const dailyRev = calculateDailyRevenue(sales, new Date(), 'USD');
```

### Validate Data
```typescript
import { validateMenuItem, validateLocation } from './src/index';

const validation = validateMenuItem(newItem);
if (!validation.valid) {
  console.error(validation.errors);
}
```

---

## 🧮 23 Total Functions

**Collections** (6): filterSalesByLocation, filterSalesByDateRange, filterMenuItemsByCategory, filterActiveLocations, sortLocationsByCapacity, sortMenuItemsByPrice

**Search** (3): findLocationById, findMenuItemByName, binarySearchLocationByCapacity

**Transformations** (11): convertCurrency, calculateDailyRevenue, calculateLocationMargin, calculateWasteCost, scoreLocationPerformance, rankLocationsByPerformance, countSalesByPaymentMethod, calculateAverageTicket, findTopSellingItems, groupWasteByReason, calculateCountryComparison

**Validations** (3): validateMenuItem, validateSaleTransaction, validateLocation

---

## 🌍 Built For

- **Company**: Brasaland - 14 restaurant locations (7 Colombia, 7 USA)
- **Currency**: USD & COP (1 USD = 4000 COP)
- **Focus**: Sales analytics, waste control, location performance scoring

---

## ✨ Key Features

✓ TypeScript strict mode enabled
✓ Dual currency support (USD/COP)
✓ Pure functions (no global state)
✓ Linear & binary search implementations
✓ Business rule validation
✓ Location performance scoring
✓ Country comparison analytics
✓ All edge cases handled

---

## 📚 Documentation

- `UTILITIES_README.md` - Full API documentation
- `IMPLEMENTATION_SUMMARY.md` - Complete build summary
- `src/demo.ts` - Working code examples
- `src/test.html` - Visual reference guide

---

## ✅ Verification

All systems ready:
- ✓ TypeScript compiles without errors
- ✓ All 23+ functions tested with sample data
- ✓ Production ready for integration
- ✓ Handles edge cases and invalid data

---

**Status**: Production Ready 
**Version**: 1.0.0
**Built for**: Brasaland Digital Team

"use strict";
/**
 * Brasaland Data Processing Utilities
 * Main entry point exporting all utilities and types
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLocation = exports.validateSaleTransaction = exports.validateMenuItem = exports.calculateCountryComparison = exports.groupWasteByReason = exports.findTopSellingItems = exports.calculateAverageTicket = exports.countSalesByPaymentMethod = exports.rankLocationsByPerformance = exports.scoreLocationPerformance = exports.calculateWasteCost = exports.calculateLocationMargin = exports.calculateDailyRevenue = exports.convertCurrency = exports.binarySearchLocationByCapacity = exports.findMenuItemByName = exports.findLocationById = exports.sortMenuItemsByPrice = exports.sortLocationsByCapacity = exports.filterActiveLocations = exports.filterMenuItemsByCategory = exports.filterSalesByDateRange = exports.filterSalesByLocation = void 0;
// Export types
__exportStar(require("./types/models"), exports);
// Export collections utilities
var collections_1 = require("./utils/collections");
Object.defineProperty(exports, "filterSalesByLocation", { enumerable: true, get: function () { return collections_1.filterSalesByLocation; } });
Object.defineProperty(exports, "filterSalesByDateRange", { enumerable: true, get: function () { return collections_1.filterSalesByDateRange; } });
Object.defineProperty(exports, "filterMenuItemsByCategory", { enumerable: true, get: function () { return collections_1.filterMenuItemsByCategory; } });
Object.defineProperty(exports, "filterActiveLocations", { enumerable: true, get: function () { return collections_1.filterActiveLocations; } });
Object.defineProperty(exports, "sortLocationsByCapacity", { enumerable: true, get: function () { return collections_1.sortLocationsByCapacity; } });
Object.defineProperty(exports, "sortMenuItemsByPrice", { enumerable: true, get: function () { return collections_1.sortMenuItemsByPrice; } });
// Export search utilities
var search_1 = require("./utils/search");
Object.defineProperty(exports, "findLocationById", { enumerable: true, get: function () { return search_1.findLocationById; } });
Object.defineProperty(exports, "findMenuItemByName", { enumerable: true, get: function () { return search_1.findMenuItemByName; } });
Object.defineProperty(exports, "binarySearchLocationByCapacity", { enumerable: true, get: function () { return search_1.binarySearchLocationByCapacity; } });
// Export transformation utilities
var transformations_1 = require("./utils/transformations");
Object.defineProperty(exports, "convertCurrency", { enumerable: true, get: function () { return transformations_1.convertCurrency; } });
Object.defineProperty(exports, "calculateDailyRevenue", { enumerable: true, get: function () { return transformations_1.calculateDailyRevenue; } });
Object.defineProperty(exports, "calculateLocationMargin", { enumerable: true, get: function () { return transformations_1.calculateLocationMargin; } });
Object.defineProperty(exports, "calculateWasteCost", { enumerable: true, get: function () { return transformations_1.calculateWasteCost; } });
Object.defineProperty(exports, "scoreLocationPerformance", { enumerable: true, get: function () { return transformations_1.scoreLocationPerformance; } });
Object.defineProperty(exports, "rankLocationsByPerformance", { enumerable: true, get: function () { return transformations_1.rankLocationsByPerformance; } });
Object.defineProperty(exports, "countSalesByPaymentMethod", { enumerable: true, get: function () { return transformations_1.countSalesByPaymentMethod; } });
Object.defineProperty(exports, "calculateAverageTicket", { enumerable: true, get: function () { return transformations_1.calculateAverageTicket; } });
Object.defineProperty(exports, "findTopSellingItems", { enumerable: true, get: function () { return transformations_1.findTopSellingItems; } });
Object.defineProperty(exports, "groupWasteByReason", { enumerable: true, get: function () { return transformations_1.groupWasteByReason; } });
Object.defineProperty(exports, "calculateCountryComparison", { enumerable: true, get: function () { return transformations_1.calculateCountryComparison; } });
// Export validation utilities
var validations_1 = require("./utils/validations");
Object.defineProperty(exports, "validateMenuItem", { enumerable: true, get: function () { return validations_1.validateMenuItem; } });
Object.defineProperty(exports, "validateSaleTransaction", { enumerable: true, get: function () { return validations_1.validateSaleTransaction; } });
Object.defineProperty(exports, "validateLocation", { enumerable: true, get: function () { return validations_1.validateLocation; } });
//# sourceMappingURL=index.js.map
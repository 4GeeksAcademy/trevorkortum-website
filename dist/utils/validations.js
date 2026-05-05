"use strict";
/**
 * Business Validations
 * Functions to validate data complies with Brasaland's business rules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMenuItem = validateMenuItem;
exports.validateSaleTransaction = validateSaleTransaction;
exports.validateLocation = validateLocation;
const CURRENT_YEAR = new Date().getFullYear();
/**
 * Validates a menu item according to business rules
 * @param item - Menu item to validate
 * @returns ValidationResult with valid flag and error messages
 */
function validateMenuItem(item) {
    const errors = [];
    // Validate name
    if (!item.name || item.name.trim() === "") {
        errors.push("Menu item name must not be empty");
    }
    // Validate prices are positive
    if (item.basePrice.USD <= 0) {
        errors.push("Base price USD must be greater than 0");
    }
    if (item.basePrice.COP <= 0) {
        errors.push("Base price COP must be greater than 0");
    }
    if (item.ingredientCost.USD <= 0) {
        errors.push("Ingredient cost USD must be greater than 0");
    }
    if (item.ingredientCost.COP <= 0) {
        errors.push("Ingredient cost COP must be greater than 0");
    }
    // Validate prep time
    if (item.prepTimeMinutes <= 0) {
        errors.push("Prep time must be greater than 0");
    }
    if (item.prepTimeMinutes > 60) {
        errors.push("Prep time must not exceed 60 minutes");
    }
    // Validate availability in at least one country
    if (!item.isAvailableInColombia && !item.isAvailableInUSA) {
        errors.push("Item must be available in at least one country");
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
/**
 * Validates a sale transaction according to business rules
 * @param sale - Sale transaction to validate
 * @returns ValidationResult with valid flag and error messages
 */
function validateSaleTransaction(sale) {
    const errors = [];
    // Validate quantity
    if (sale.quantity <= 0) {
        errors.push("Quantity must be greater than 0");
    }
    // Validate prices are positive
    if (sale.totalPrice.USD <= 0) {
        errors.push("Total price USD must be greater than 0");
    }
    if (sale.totalPrice.COP <= 0) {
        errors.push("Total price COP must be greater than 0");
    }
    // Validate waiter name
    if (!sale.waiterName || sale.waiterName.trim() === "") {
        errors.push("Waiter name must not be empty");
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
/**
 * Validates a location according to business rules
 * @param location - Location to validate
 * @returns ValidationResult with valid flag and error messages
 */
function validateLocation(location) {
    const errors = [];
    // Validate opening year
    if (location.openingYear < 2008) {
        errors.push("Opening year must be 2008 or later");
    }
    if (location.openingYear > CURRENT_YEAR) {
        errors.push(`Opening year cannot be in the future (current year: ${CURRENT_YEAR})`);
    }
    // Validate seating capacity
    if (location.seatingCapacity <= 0) {
        errors.push("Seating capacity must be greater than 0");
    }
    // Validate staff count
    if (location.staffCount <= 0) {
        errors.push("Staff count must be greater than 0");
    }
    // Validate rent cost
    if (location.monthlyRentCost.USD <= 0) {
        errors.push("Monthly rent USD must be greater than 0");
    }
    if (location.monthlyRentCost.COP <= 0) {
        errors.push("Monthly rent COP must be greater than 0");
    }
    // Validate utilities cost
    if (location.averageMonthlyUtilities.USD <= 0) {
        errors.push("Average monthly utilities USD must be greater than 0");
    }
    if (location.averageMonthlyUtilities.COP <= 0) {
        errors.push("Average monthly utilities COP must be greater than 0");
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
//# sourceMappingURL=validations.js.map
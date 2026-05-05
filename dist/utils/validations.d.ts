/**
 * Business Validations
 * Functions to validate data complies with Brasaland's business rules
 */
import { MenuItem, SaleTransaction, Location, ValidationResult } from "../types/models";
/**
 * Validates a menu item according to business rules
 * @param item - Menu item to validate
 * @returns ValidationResult with valid flag and error messages
 */
export declare function validateMenuItem(item: MenuItem): ValidationResult;
/**
 * Validates a sale transaction according to business rules
 * @param sale - Sale transaction to validate
 * @returns ValidationResult with valid flag and error messages
 */
export declare function validateSaleTransaction(sale: SaleTransaction): ValidationResult;
/**
 * Validates a location according to business rules
 * @param location - Location to validate
 * @returns ValidationResult with valid flag and error messages
 */
export declare function validateLocation(location: Location): ValidationResult;
//# sourceMappingURL=validations.d.ts.map
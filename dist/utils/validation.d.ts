import { Permissions } from './types';
interface ValidationResult {
    isValid: boolean;
    error?: string;
}
/**
 * Validates code changes against security rules and permissions
 *
 * @param newCode - The new code to validate
 * @param oldCode - The original code for comparison
 * @param permissions - User permissions
 * @returns Validation result
 */
export declare function validateCode(newCode: string, oldCode: string, permissions: Permissions): ValidationResult;
export {};

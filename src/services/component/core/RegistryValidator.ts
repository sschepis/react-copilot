import { IRegistryValidator, DEFAULT_PERMISSIONS } from './types';
import { ModifiableComponent, Permissions } from '../../../utils/types';
import { validateCode } from '../../../utils/validation';

/**
 * Handles validation operations for the component registry
 */
export class RegistryValidator implements IRegistryValidator {
  private permissions: Permissions;

  /**
   * Create a new RegistryValidator
   * 
   * @param permissions Optional permissions for code validation
   */
  constructor(permissions?: Partial<Permissions>) {
    this.permissions = { ...DEFAULT_PERMISSIONS, ...permissions };
  }

  /**
   * Set permissions for code validation
   * 
   * @param permissions The permissions to set
   */
  setPermissions(permissions: Partial<Permissions>): void {
    this.permissions = { ...this.permissions, ...permissions };
  }

  /**
   * Get the current permissions
   * 
   * @returns The current permissions
   */
  getPermissions(): Permissions {
    return this.permissions;
  }

  /**
   * Validate a component
   * 
   * @param component The component to validate
   * @returns True if the component is valid
   */
  validateComponent(component: ModifiableComponent): boolean {
    // Ensure component has required fields
    if (!component.id) {
      return false;
    }

    // If component has source code, validate it
    if (component.sourceCode) {
      const validationResult = this.validateCodeChange(component.sourceCode, null);
      if (!validationResult.isValid) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validate a code change
   * 
   * @param sourceCode The new source code
   * @param originalCode The original source code to compare against
   * @returns Validation result with isValid flag and optional error message
   */
  validateCodeChange(
    sourceCode: string, 
    originalCode: string | null
  ): { isValid: boolean; error?: string } {
    // Always valid if no source code provided
    if (!sourceCode) {
      return { isValid: true };
    }

    // Use the validation utility with our permissions
    return validateCode(
      sourceCode,
      originalCode || '',
      this.permissions
    );
  }

  /**
   * Check component creation permission
   */
  canCreateComponent(): boolean {
    return !!this.permissions.allowComponentCreation;
  }

  /**
   * Check component deletion permission
   */
  canDeleteComponent(): boolean {
    return !!this.permissions.allowComponentDeletion;
  }

  /**
   * Check if style changes are allowed
   */
  canChangeStyles(): boolean {
    return !!this.permissions.allowStyleChanges;
  }

  /**
   * Check if logic changes are allowed
   */
  canChangeLogic(): boolean {
    return !!this.permissions.allowLogicChanges;
  }

  /**
   * Check if data access is allowed
   */
  canAccessData(): boolean {
    return !!this.permissions.allowDataAccess;
  }

  /**
   * Check if network requests are allowed
   */
  canMakeNetworkRequests(): boolean {
    return !!this.permissions.allowNetworkRequests;
  }
}

export default RegistryValidator;
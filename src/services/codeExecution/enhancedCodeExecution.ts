import { 
  CodeChangeRequest, 
  CodeChangeResult, 
  ModifiableComponent,
  CrossComponentChangeRequest,
  Permissions
} from '../../utils/types';
import { SafeCodeApplication, SafeCodeOptions } from './SafeCodeApplication';

/**
 * Global SafeCodeApplication instance with default settings
 */
const defaultSafeCodeApp = new SafeCodeApplication({
  enableRollback: true,
  strictValidation: true,
  dependencyCheck: true,
  createBackup: true,
  sandboxExecution: true
});

/**
 * Enhanced version of executeCodeChange that uses SafeCodeApplication
 * for improved safety and validation
 * 
 * @param request The code change request
 * @param getComponent Function to retrieve components by ID
 * @param getComponentDependencies Optional function to get component dependencies
 * @param options Optional safe code options
 * @returns Result of the code change operation
 */
export async function enhancedExecuteCodeChange(
  request: CodeChangeRequest,
  getComponent: (id: string) => ModifiableComponent | null,
  getComponentDependencies?: (id: string) => string[],
  options?: SafeCodeOptions
): Promise<CodeChangeResult> {
  // Create a custom SafeCodeApplication if options are provided, or use the default
  const safeCodeApp = options ? new SafeCodeApplication(options) : defaultSafeCodeApp;
  
  return safeCodeApp.safelyApplyCode(request, getComponent, getComponentDependencies);
}

/**
 * Execute code changes across multiple components
 * 
 * @param request The cross-component change request
 * @param getComponent Function to retrieve components by ID
 * @param getComponentDependencies Optional function to get component dependencies
 * @param options Optional safe code options
 * @returns Results for each component
 */
export async function executeMultiComponentChange(
  request: CrossComponentChangeRequest,
  getComponent: (id: string) => ModifiableComponent | null,
  getComponentDependencies?: (id: string) => string[],
  options?: SafeCodeOptions
): Promise<Record<string, CodeChangeResult>> {
  // Create a custom SafeCodeApplication if options are provided, or use the default
  const safeCodeApp = options ? new SafeCodeApplication(options) : defaultSafeCodeApp;
  
  return safeCodeApp.applyMultiComponentChange(request, getComponent, getComponentDependencies);
}

/**
 * Roll back changes for a component
 * 
 * @param componentId ID of the component to roll back
 * @param options Optional safe code options
 * @returns The rolled back source code or null if rollback failed
 */
export function rollbackComponentChanges(
  componentId: string,
  options?: SafeCodeOptions
): string | null {
  // Create a custom SafeCodeApplication if options are provided, or use the default
  const safeCodeApp = options ? new SafeCodeApplication(options) : defaultSafeCodeApp;
  
  return safeCodeApp.rollback(componentId);
}

/**
 * Get available backups for a component
 * 
 * @param componentId ID of the component
 * @returns Array of backup source code versions
 */
export function getComponentBackups(componentId: string): string[] {
  return defaultSafeCodeApp.getBackups(componentId);
}

/**
 * Clear backups for a component
 * 
 * @param componentId ID of the component
 */
export function clearComponentBackups(componentId: string): void {
  defaultSafeCodeApp.clearBackups(componentId);
}

/**
 * Get the default SafeCodeApplication instance
 * 
 * @returns The default SafeCodeApplication instance
 */
export function getSafeCodeApplication(): SafeCodeApplication {
  return defaultSafeCodeApp;
}

/**
 * Legacy compatibility function that maps to the enhanced version
 * This maintains backward compatibility with existing code
 * 
 * @param request The code change request
 * @returns Result of the code change operation
 */
export async function executeCodeChange(request: CodeChangeRequest): Promise<CodeChangeResult> {
  // This version doesn't have access to getComponent, so we create a simple stub
  // that returns a minimal component object
  const getComponentStub = (id: string): ModifiableComponent | null => {
    if (id === request.componentId) {
      return {
        id,
        name: id,
        ref: { current: null },
        sourceCode: ''
      };
    }
    return null;
  };
  
  return enhancedExecuteCodeChange(
    request,
    getComponentStub,
    undefined,
    { 
      // Use limited options for legacy compatibility
      dependencyCheck: false,
      strictValidation: false,
      sandboxExecution: false
    }
  );
}
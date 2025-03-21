import { Message, Permissions } from '../../../utils/types';
import { EventEmitter } from '../../../utils/EventEmitter';
import { ErrorRecoveryEvents, IErrorRecoveryService } from './types';

/**
 * Service for handling error recovery in code generation
 * Provides validation, auto-fixing, and prompt improvement
 */
export class ErrorRecoveryService extends EventEmitter implements IErrorRecoveryService {
  private maxRetryAttempts: number = 3;
  private defaultPermissions: Permissions | null = null;
  private errorHistory: Array<{
    code: string;
    originalCode: string;
    componentName: string;
    error: string;
    timestamp: number;
  }> = [];
  
  /**
   * Constructor
   * 
   * @param maxRetryAttempts Maximum number of retry attempts
   */
  constructor(maxRetryAttempts: number = 3) {
    super();
    this.maxRetryAttempts = maxRetryAttempts;
  }
  
  /**
   * Set default permissions for code validation
   * 
   * @param permissions The permissions to use
   */
  setDefaultPermissions(permissions: Permissions): void {
    this.defaultPermissions = permissions;
  }
  
  /**
   * Set maximum retry attempts for code generation
   * 
   * @param maxRetries The maximum number of retries
   */
  setMaxRetryAttempts(maxRetries: number): void {
    this.maxRetryAttempts = maxRetries;
  }
  
  /**
   * Validate generated code
   * 
   * @param generatedCode The code to validate
   * @param originalCode The original code
   * @param componentName The component name
   * @param permissions Optional permissions
   * @returns Tuple of [isValid, errorMessage]
   */
  validateGeneratedCode(
    generatedCode: string,
    originalCode: string,
    componentName: string,
    permissions?: Permissions
  ): [boolean, string | null] {
    // Use provided permissions or fall back to default
    const effectivePermissions = permissions || this.defaultPermissions || {};
    
    // For now, this is a simple implementation
    // In a real implementation, would parse the code and check for various issues
    
    // Check if the code contains the component name
    if (!generatedCode.includes(componentName)) {
      return [false, `Generated code does not include component ${componentName}`];
    }
    
    // Check code is not empty or too short
    if (generatedCode.trim().length < 50) {
      return [false, 'Generated code is too short or empty'];
    }
    
    // Check for basic React syntax
    if (generatedCode.includes('import React') || 
        generatedCode.includes('React.') || 
        generatedCode.includes('<div') || 
        generatedCode.includes('function ') || 
        generatedCode.includes('class ')) {
      return [true, null];
    }
    
    return [false, 'Code does not appear to be valid React code'];
  }
  
  /**
   * Auto-fix common errors in generated code
   * 
   * @param code The code to fix
   * @param componentName The component name
   * @returns Fixed code or null if unable to fix
   */
  autoFixCommonErrors(code: string, componentName: string): string | null {
    let fixedCode = code;
    
    // Ensure component name is correct
    const componentRegex = new RegExp(`(function|class)\\s+([A-Za-z0-9_]+)`, 'g');
    const componentMatch = componentRegex.exec(code);
    
    if (componentMatch && componentMatch[2] !== componentName) {
      fixedCode = fixedCode.replace(
        componentMatch[0],
        `${componentMatch[1]} ${componentName}`
      );
    }
    
    // Add missing React import
    if (!fixedCode.includes('import React')) {
      fixedCode = `import React from 'react';\n${fixedCode}`;
    }
    
    // Ensure export statement exists
    if (!fixedCode.includes('export default') && !fixedCode.includes('export {')) {
      fixedCode = `${fixedCode}\n\nexport default ${componentName};`;
    }
    
    // Check if we actually made changes
    if (fixedCode === code) {
      return null; // No fixes made
    }
    
    // Emit recovery success event
    this.emit(ErrorRecoveryEvents.RECOVERY_SUCCESS, {
      componentName,
      originalCode: code,
      fixedCode
    });
    
    return fixedCode;
  }
  
  /**
   * Generate an improved prompt based on previous errors
   * 
   * @param componentName The component name
   * @param originalPrompt The original prompt
   * @returns An improved prompt
   */
  generateImprovedPrompt(componentName: string, originalPrompt: string): string {
    // Get recent errors for this component
    const relevantErrors = this.errorHistory
      .filter(entry => entry.componentName === componentName)
      .slice(-3); // Get last 3 errors
    
    if (relevantErrors.length === 0) {
      // No specific errors to address, provide general guidance
      return `${originalPrompt}\n\nPlease ensure you provide a complete, valid React component named ${componentName}. Include all necessary imports and export the component at the end.`;
    }
    
    // Create a more specific prompt based on error history
    let errorGuidance = 'Please fix the following issues from previous attempts:\n';
    
    relevantErrors.forEach((entry, index) => {
      errorGuidance += `${index + 1}. ${entry.error}\n`;
    });
    
    return `${originalPrompt}\n\n${errorGuidance}\nEnsure the component is named ${componentName} and is properly exported.`;
  }
  
  /**
   * Record an error for learning and improvement
   * 
   * @param generatedCode The code that caused the error
   * @param originalCode The original code
   * @param componentName The component name
   * @param errorMessage The error message
   */
  recordError(
    generatedCode: string,
    originalCode: string,
    componentName: string,
    errorMessage: string
  ): void {
    this.errorHistory.push({
      code: generatedCode,
      originalCode,
      componentName,
      error: errorMessage,
      timestamp: Date.now()
    });
    
    // Limit error history size
    if (this.errorHistory.length > 100) {
      this.errorHistory.shift();
    }
    
    // Emit error detected event
    this.emit(ErrorRecoveryEvents.ERROR_DETECTED, {
      componentName,
      error: errorMessage,
      code: generatedCode
    });
  }
  
  /**
   * Generate fallback code when all attempts fail
   * 
   * @param componentName The component name
   * @returns Simple fallback code
   */
  generateFallbackCode(componentName: string): string | null {
    const fallbackCode = `
import React from 'react';

function ${componentName}() {
  return (
    <div className="${componentName.toLowerCase()}-container">
      <p>Placeholder for ${componentName}</p>
    </div>
  );
}

export default ${componentName};
`.trim();

    return fallbackCode;
  }
}

// Export default instance for backward compatibility
export default ErrorRecoveryService;
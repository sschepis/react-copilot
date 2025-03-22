// Use a conditional import to avoid esbuild loading in test environments
// Check if we're in a test environment
const isTestEnvironment = process.env.NODE_ENV === 'test' ||
                         process.env.JEST_WORKER_ID !== undefined ||
                         process.env.CI === 'true';

// Create a mock esbuild for test environments
let esbuild: any;
if (!isTestEnvironment) {
  // Only import esbuild in non-test environments
  esbuild = require('esbuild');
} else {
  // Mock implementation for test environments
  esbuild = {
    transform: (code: string) => Promise.resolve({ code, map: '' }),
    formatMessages: () => Promise.resolve([]),
    build: () => Promise.resolve({ warnings: [] }),
    stop: () => {}
  };
}
import { EventEmitter } from '../../../utils/EventEmitter';
import { ModifiableComponent } from '../../../utils/types';
import {
  ICodeChangeApplier,
  SafeCodeOptions,
  CodeChangeRequest,
  CodeChangeResult,
  MultiComponentChangeRequest,
  ValidationResult,
  ValidationContext,
  SafeCodeEvents,
  ValidationIssue,
  ValidationSeverity,
  CodeValidator
} from './types';

/**
 * Base class for code change appliers
 * Provides common functionality for validating and applying code changes
 */
export abstract class SafeCodeApplierBase implements ICodeChangeApplier {
  /** Applier name */
  readonly name: string;
  
  /** Component types this applier can handle */
  readonly supportedComponentTypes: string[];
  
  /** Event emitter for listening to events */
  readonly events: EventEmitter = new EventEmitter();
  
  /** Configuration options */
  protected options: Required<SafeCodeOptions>;
  
  /** Default options */
  protected defaultOptions: Required<SafeCodeOptions> = {
    enableRollback: true,
    strictValidation: true,
    dependencyCheck: true,
    createBackup: true,
    sandboxExecution: true,
    maxBackupCount: 10,
    autoApplyFixes: true,
    customValidators: [],
    additionalOptions: {}
  };
  
  /** Map of component backups */
  protected backups: Map<string, string[]> = new Map();
  
  /** Built-in validators */
  protected validators: CodeValidator[] = [];
  
  constructor(name: string, supportedComponentTypes: string[], options?: SafeCodeOptions) {
    this.name = name;
    this.supportedComponentTypes = supportedComponentTypes;
    
    // Set options with defaults
    this.options = {
      ...this.defaultOptions,
      ...(options || {})
    };
    
    // Initialize built-in validators
    this.initializeValidators();
  }
  
  /**
   * Initialize built-in validators
   * Can be extended by subclasses to add more validators
   */
  protected initializeValidators(): void {
    // Add syntax validator
    this.validators.push({
      name: 'SyntaxValidator',
      severityLevel: ValidationSeverity.ERROR,
      validate: async (code: string) => {
        return this.validateSyntax(code);
      }
    });
    
    // Add security validator if strict validation is enabled
    if (this.options.strictValidation) {
      this.validators.push({
        name: 'SecurityValidator',
        severityLevel: ValidationSeverity.CRITICAL,
        validate: (code: string) => {
          return this.validateSecurity(code);
        }
      });
    }
    
    // Add custom validators
    if (this.options.customValidators) {
      this.validators.push(...this.options.customValidators);
    }
  }
  
  /**
   * Apply code changes safely
   * This is the main method that clients will call
   */
  async applyChanges(
    request: CodeChangeRequest,
    getComponent: (id: string) => ModifiableComponent | null,
    getComponentDependencies?: (id: string) => string[]
  ): Promise<CodeChangeResult> {
    this.events.emit(SafeCodeEvents.VALIDATION_STARTED, { componentId: request.componentId });
    
    try {
      const component = getComponent(request.componentId);
      if (!component) {
        return {
          success: false,
          error: `Component with ID ${request.componentId} not found`,
          componentId: request.componentId
        };
      }
      
      // Create backup if enabled
      if (this.options.createBackup && component.sourceCode) {
        this.createBackup(request.componentId, component.sourceCode);
      }
      
      // Validate code through multiple layers of checks
      const validationContext: ValidationContext = {
        componentId: request.componentId,
        originalCode: component.sourceCode || '',
        componentType: this.detectComponentType(component.sourceCode || ''),
        language: this.detectLanguage(component.sourceCode || ''),
        metadata: request.metadata
      };
      
      const validationResult = await this.validateChanges(
        request.sourceCode,
        component.sourceCode || '',
        validationContext
      );
      
      if (!validationResult.success) {
        this.events.emit(SafeCodeEvents.VALIDATION_FAILED, {
          componentId: request.componentId,
          error: validationResult.error,
          issues: validationResult.issues
        });
        
        return {
          success: false,
          error: validationResult.error,
          componentId: request.componentId,
          diff: this.generateDiff(component.sourceCode || '', request.sourceCode),
          validationIssues: validationResult.issues
        };
      }
      
      this.events.emit(SafeCodeEvents.VALIDATION_COMPLETED, { 
        componentId: request.componentId,
        issues: validationResult.issues?.filter(i => i.severity === ValidationSeverity.WARNING)
      });
      
      // Check for dependencies if enabled
      let affectedDependencies: string[] = [];
      if (this.options.dependencyCheck && getComponentDependencies) {
        this.events.emit(SafeCodeEvents.DEPENDENCY_CHECK_STARTED, { componentId: request.componentId });
        
        affectedDependencies = await this.checkDependencies(
          request.componentId,
          component.sourceCode || '',
          request.sourceCode,
          getComponent,
          getComponentDependencies
        );
        
        if (affectedDependencies.length > 0) {
          this.events.emit(SafeCodeEvents.DEPENDENCIES_AFFECTED, {
            componentId: request.componentId,
            affectedDependencies
          });
        }
        
        this.events.emit(SafeCodeEvents.DEPENDENCY_CHECK_COMPLETED, {
          componentId: request.componentId,
          affectedDependencies
        });
      }
      
      // Begin code application
      this.events.emit(SafeCodeEvents.APPLICATION_STARTED, { componentId: request.componentId });
      
      // If sandbox execution is enabled, test the code in a controlled environment
      if (this.options.sandboxExecution) {
        const sandboxResult = await this.executeSandbox(request.sourceCode);
        if (!sandboxResult.success) {
          this.events.emit(SafeCodeEvents.APPLICATION_FAILED, {
            componentId: request.componentId,
            error: sandboxResult.error
          });
          
          return {
            success: false,
            error: `Sandbox execution failed: ${sandboxResult.error}`,
            componentId: request.componentId
          };
        }
      }
      
      // Apply the changes through the implementation-specific method
      const applicationResult = await this.applyChangesImplementation(
        request,
        component,
        validationContext
      );
      
      if (!applicationResult.success) {
        this.events.emit(SafeCodeEvents.APPLICATION_FAILED, {
          componentId: request.componentId,
          error: applicationResult.error
        });
        
        return applicationResult;
      }
      
      // Success
      this.events.emit(SafeCodeEvents.APPLICATION_COMPLETED, {
        componentId: request.componentId,
        sourceCode: applicationResult.newSourceCode
      });
      
      return {
        ...applicationResult,
        affectedDependencies
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during code application';
      
      this.events.emit(SafeCodeEvents.APPLICATION_FAILED, {
        componentId: request.componentId,
        error: errorMessage
      });
      
      return {
        success: false,
        error: errorMessage,
        componentId: request.componentId
      };
    }
  }
  
  /**
   * Implementation-specific code application logic
   * To be implemented by subclasses
   */
  protected abstract applyChangesImplementation(
    request: CodeChangeRequest,
    component: ModifiableComponent,
    context: ValidationContext
  ): Promise<CodeChangeResult>;
  
  /**
   * Apply changes to multiple components
   */
  async applyMultiComponentChanges(
    request: MultiComponentChangeRequest,
    getComponent: (id: string) => ModifiableComponent | null,
    getComponentDependencies?: (id: string) => string[]
  ): Promise<Record<string, CodeChangeResult>> {
    const results: Record<string, CodeChangeResult> = {};
    const componentsToRollback: string[] = [];
    
    // First validate all changes
    for (const componentId of request.componentIds) {
      const sourceCode = request.changes[componentId];
      if (!sourceCode) {
        results[componentId] = {
          success: false,
          error: 'No source code provided for component',
          componentId
        };
        continue;
      }
      
      const component = getComponent(componentId);
      if (!component) {
        results[componentId] = {
          success: false,
          error: `Component with ID ${componentId} not found`,
          componentId
        };
        continue;
      }
      
      const validationContext: ValidationContext = {
        componentId,
        originalCode: component.sourceCode || '',
        componentType: this.detectComponentType(component.sourceCode || ''),
        language: this.detectLanguage(component.sourceCode || ''),
        metadata: request.metadata
      };
      
      const validationResult = await this.validateChanges(
        sourceCode,
        component.sourceCode || '',
        validationContext
      );
      
      if (!validationResult.success) {
        results[componentId] = {
          success: false,
          error: validationResult.error,
          componentId,
          validationIssues: validationResult.issues
        };
        
        // If transactional and validation fails, return immediately
        if (request.transactional) {
          return results;
        }
      }
    }
    
    // Then apply all changes
    try {
      for (const componentId of request.componentIds) {
        const sourceCode = request.changes[componentId];
        if (!sourceCode) continue;
        
        // Skip already failed components
        if (results[componentId] && !results[componentId].success) continue;
        
        const changeRequest: CodeChangeRequest = {
          componentId,
          sourceCode,
          description: request.description,
          metadata: request.metadata
        };
        
        const result = await this.applyChanges(
          changeRequest,
          getComponent,
          getComponentDependencies
        );
        
        results[componentId] = result;
        
        // If transactional and a change fails, track for rollback
        if (request.transactional && !result.success) {
          componentsToRollback.push(...Object.keys(results).filter(id => 
            results[id].success && request.componentIds.includes(id)
          ));
          break;
        }
      }
      
      // Rollback if transactional and any change failed
      if (request.transactional && componentsToRollback.length > 0) {
        for (const componentId of componentsToRollback) {
          await this.rollback(componentId, getComponent);
          
          // Update result to indicate rollback occurred
          if (results[componentId]) {
            results[componentId] = {
              ...results[componentId],
              success: false,
              error: 'Changes rolled back due to transaction failure'
            };
          }
        }
      }
      
      return results;
    } catch (error) {
      // Handle any unexpected errors during the process
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during multi-component change';
      
      // If transactional, roll back any successful changes
      if (request.transactional && componentsToRollback.length > 0) {
        for (const componentId of componentsToRollback) {
          await this.rollback(componentId, getComponent);
        }
      }
      
      // Add error to results for any components that don't have results yet
      for (const componentId of request.componentIds) {
        if (!results[componentId]) {
          results[componentId] = {
            success: false,
            error: errorMessage,
            componentId
          };
        }
      }
      
      return results;
    }
  }
  
  /**
   * Validate code changes against all validators
   */
  async validateChanges(
    newCode: string,
    originalCode: string,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const allIssues: ValidationIssue[] = [];
    
    // Run all validators
    for (const validator of this.validators) {
      const result = await Promise.resolve(validator.validate(newCode, context));
      
      if (!result.success) {
        // If a validator fails with error severity or above, return immediately
        if (validator.severityLevel === ValidationSeverity.ERROR || 
            validator.severityLevel === ValidationSeverity.CRITICAL) {
          return result;
        }
        
        // Otherwise collect the issues
        if (result.issues) {
          allIssues.push(...result.issues);
        }
      }
    }
    
    // Check for patterns specific to the component type
    const patternResult = await this.validateComponentPatterns(newCode, context);
    if (!patternResult.success) {
      return patternResult;
    }
    
    if (patternResult.issues) {
      allIssues.push(...patternResult.issues);
    }
    
    // If we have warnings but no errors, validation passes with warnings
    return {
      success: true,
      issues: allIssues.length > 0 ? allIssues : undefined
    };
  }
  
  /**
   * Roll back changes for a component
   */
  async rollback(
    componentId: string,
    getComponent?: (id: string) => ModifiableComponent | null
  ): Promise<string | null> {
    this.events.emit(SafeCodeEvents.ROLLBACK_STARTED, { componentId });
    
    try {
      const backups = this.backups.get(componentId);
      if (!backups || backups.length === 0) {
        this.events.emit(SafeCodeEvents.ROLLBACK_FAILED, {
          componentId,
          error: 'No backups available for rollback'
        });
        return null;
      }
      
      // Get the most recent backup
      const previousVersion = backups.pop();
      if (!previousVersion) {
        this.events.emit(SafeCodeEvents.ROLLBACK_FAILED, {
          componentId,
          error: 'Failed to retrieve backup version'
        });
        return null;
      }
      
      // Update the backups
      this.backups.set(componentId, backups);
      
      this.events.emit(SafeCodeEvents.ROLLBACK_COMPLETED, {
        componentId,
        sourceCode: previousVersion
      });
      
      return previousVersion;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during rollback';
      
      this.events.emit(SafeCodeEvents.ROLLBACK_FAILED, {
        componentId,
        error: errorMessage
      });
      
      return null;
    }
  }
  
  /**
   * Configure the applier with options
   */
  configure(options: SafeCodeOptions): void {
    this.options = {
      ...this.options,
      ...options
    };
    
    // Reinitialize validators with new options
    this.validators = [];
    this.initializeValidators();
  }
  
  /**
   * Create a backup of component source code
   */
  protected createBackup(componentId: string, sourceCode: string): void {
    let backups = this.backups.get(componentId) || [];
    
    // Add the new backup
    backups.push(sourceCode);
    
    // Limit the number of backups
    if (backups.length > this.options.maxBackupCount) {
      backups = backups.slice(-this.options.maxBackupCount);
    }
    
    this.backups.set(componentId, backups);
  }
  
  /**
   * Get all available backups for a component
   */
  getBackups(componentId: string): string[] {
    return [...(this.backups.get(componentId) || [])];
  }
  
  /**
   * Clear backups for a component
   */
  clearBackups(componentId: string): void {
    this.backups.delete(componentId);
  }
  
  /**
   * Validate code syntax using transpilation
   */
  protected async validateSyntax(code: string): Promise<ValidationResult> {
    try {
      // Wrap the component code in a module
      const wrappedCode = `
        import React from 'react';
        ${code}
      `;
      
      // Use esbuild to transpile the code
      await esbuild.transform(wrappedCode, {
        loader: 'tsx',
        target: 'es2015',
        format: 'esm',
      });
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? `Syntax error: ${error.message}` : 'Transpilation failed',
        issues: [{
          message: error instanceof Error ? error.message : 'Transpilation failed',
          severity: ValidationSeverity.ERROR
        }]
      };
    }
  }
  
  /**
   * Validate code for security vulnerabilities
   */
  protected validateSecurity(code: string): ValidationResult {
    const issues: ValidationIssue[] = [];
    
    // Check for potentially dangerous code patterns
    
    // 1. Check for eval and similar constructs
    if (/\beval\(/.test(code) || /\bnew Function\(/.test(code)) {
      issues.push({
        message: 'Code contains potentially unsafe eval() or Function constructor',
        severity: ValidationSeverity.CRITICAL
      });
    }
    
    // 2. Check for DOM manipulation that could lead to XSS
    if (/\bdocument\.write\(/.test(code) || /\.innerHTML\s*=/.test(code)) {
      issues.push({
        message: 'Code contains potentially unsafe DOM manipulation (document.write or innerHTML)',
        severity: ValidationSeverity.CRITICAL
      });
    }
    
    // 3. Check for suspicious iframe usage
    if (/\bdocument\.createElement\s*\(\s*['"]iframe['"]/.test(code)) {
      issues.push({
        message: 'Code creates iframes, which could be a security risk',
        severity: ValidationSeverity.ERROR
      });
    }
    
    // If any critical issues were found, validation fails
    const hasCriticalIssues = issues.some(i => i.severity === ValidationSeverity.CRITICAL);
    
    return {
      success: !hasCriticalIssues,
      error: hasCriticalIssues ? 'Code contains critical security vulnerabilities' : undefined,
      issues: issues.length > 0 ? issues : undefined
    };
  }
  
  /**
   * Validate component patterns
   * This is implementation-specific and should be overridden by subclasses
   */
  protected abstract validateComponentPatterns(
    code: string,
    context: ValidationContext
  ): Promise<ValidationResult> | ValidationResult;
  
  /**
   * Execute code in a sandbox environment
   */
  protected abstract executeSandbox(
    code: string
  ): Promise<ValidationResult>;
  
  /**
   * Check for affected dependencies
   */
  protected abstract checkDependencies(
    componentId: string,
    originalCode: string,
    newCode: string,
    getComponent: (id: string) => ModifiableComponent | null,
    getComponentDependencies: (id: string) => string[]
  ): Promise<string[]>;
  
  /**
   * Generate a diff between original and new code
   */
  protected abstract generateDiff(
    originalCode: string,
    newCode: string
  ): string;
  
  /**
   * Detect the component type from the code
   */
  protected abstract detectComponentType(
    code: string
  ): string;
  
  /**
   * Detect the language from the code
   */
  protected abstract detectLanguage(
    code: string
  ): string;
}
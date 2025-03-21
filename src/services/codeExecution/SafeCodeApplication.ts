import { CodeChangeRequest, CodeChangeResult, ModifiableComponent, CrossComponentChangeRequest } from '../../utils/types';
import { validateCode } from '../../utils/validation';
import * as esbuild from 'esbuild';
import { EventEmitter } from '../../utils/EventEmitter';

/**
 * Events emitted by the SafeCodeApplication system
 */
export enum SafeCodeEvents {
  VALIDATION_STARTED = 'validation_started',
  VALIDATION_COMPLETED = 'validation_completed',
  VALIDATION_FAILED = 'validation_failed',
  
  APPLICATION_STARTED = 'application_started',
  APPLICATION_COMPLETED = 'application_completed',
  APPLICATION_FAILED = 'application_failed',
  
  ROLLBACK_STARTED = 'rollback_started',
  ROLLBACK_COMPLETED = 'rollback_completed',
  ROLLBACK_FAILED = 'rollback_failed',
  
  DEPENDENCY_CHECK_STARTED = 'dependency_check_started',
  DEPENDENCY_CHECK_COMPLETED = 'dependency_check_completed',
  DEPENDENCIES_AFFECTED = 'dependencies_affected',
}

/**
 * Options for safe code application
 */
export interface SafeCodeOptions {
  enableRollback?: boolean;
  strictValidation?: boolean;
  dependencyCheck?: boolean;
  createBackup?: boolean;
  sandboxExecution?: boolean;
  maxBackupCount?: number;
  autoApplyFixes?: boolean;
}

/**
 * Provides a comprehensive system for safely applying code changes
 * with validation, rollback, dependency analysis, and error handling
 */
export class SafeCodeApplication extends EventEmitter {
  private backups: Map<string, string[]> = new Map();
  private maxBackupCount: number;
  private options: Required<SafeCodeOptions>;
  
  constructor(options: SafeCodeOptions = {}) {
    super();
    
    // Set default options
    this.options = {
      enableRollback: options.enableRollback ?? true,
      strictValidation: options.strictValidation ?? true,
      dependencyCheck: options.dependencyCheck ?? true,
      createBackup: options.createBackup ?? true,
      sandboxExecution: options.sandboxExecution ?? true,
      maxBackupCount: options.maxBackupCount ?? 10,
      autoApplyFixes: options.autoApplyFixes ?? true,
    };
    
    this.maxBackupCount = this.options.maxBackupCount;
  }
  
  /**
   * Safely apply code changes to a component with validation and rollback
   * 
   * @param request The code change request
   * @param getComponent Function to retrieve components by ID
   * @param getComponentDependencies Function to get component dependencies
   * @returns Result of the code change operation
   */
  async safelyApplyCode(
    request: CodeChangeRequest,
    getComponent: (id: string) => ModifiableComponent | null,
    getComponentDependencies?: (id: string) => string[]
  ): Promise<CodeChangeResult> {
    this.emit(SafeCodeEvents.VALIDATION_STARTED, { componentId: request.componentId });
    
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
      const validationResult = await this.validateCodeChanges(
        request.sourceCode,
        component.sourceCode || '',
        request.componentId
      );
      
      if (!validationResult.success) {
        this.emit(SafeCodeEvents.VALIDATION_FAILED, {
          componentId: request.componentId,
          error: validationResult.error
        });
        
        return {
          success: false,
          error: validationResult.error,
          componentId: request.componentId,
          diff: this.generateDiff(component.sourceCode || '', request.sourceCode)
        };
      }
      
      this.emit(SafeCodeEvents.VALIDATION_COMPLETED, { componentId: request.componentId });
      
      // Check for dependencies if enabled
      if (this.options.dependencyCheck && getComponentDependencies) {
        this.emit(SafeCodeEvents.DEPENDENCY_CHECK_STARTED, { componentId: request.componentId });
        
        const dependencies = getComponentDependencies(request.componentId);
        const affectedDependencies = await this.checkDependencies(
          dependencies,
          component.sourceCode || '',
          request.sourceCode,
          getComponent
        );
        
        if (affectedDependencies.length > 0) {
          this.emit(SafeCodeEvents.DEPENDENCIES_AFFECTED, {
            componentId: request.componentId,
            affectedDependencies
          });
          
          // We don't fail here, just emit an event - could be useful for UI warnings
        }
        
        this.emit(SafeCodeEvents.DEPENDENCY_CHECK_COMPLETED, {
          componentId: request.componentId,
          affectedDependencies
        });
      }
      
      // Begin code application
      this.emit(SafeCodeEvents.APPLICATION_STARTED, { componentId: request.componentId });
      
      // If sandbox execution is enabled, test the code in a controlled environment
      if (this.options.sandboxExecution) {
        const sandboxResult = await this.executeSandbox(request.sourceCode);
        if (!sandboxResult.success) {
          this.emit(SafeCodeEvents.APPLICATION_FAILED, {
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
      
      // Apply the changes
      const newSourceCode = request.sourceCode;
      
      this.emit(SafeCodeEvents.APPLICATION_COMPLETED, {
        componentId: request.componentId,
        sourceCode: newSourceCode
      });
      
      return {
        success: true,
        componentId: request.componentId,
        newSourceCode,
        diff: this.generateDiff(component.sourceCode || '', newSourceCode)
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during code application';
      
      this.emit(SafeCodeEvents.APPLICATION_FAILED, {
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
   * Apply code changes across multiple components
   * 
   * @param request Cross-component change request
   * @param getComponent Function to retrieve components by ID
   * @param getComponentDependencies Function to get component dependencies
   * @returns Results for each component
   */
  async applyMultiComponentChange(
    request: CrossComponentChangeRequest,
    getComponent: (id: string) => ModifiableComponent | null,
    getComponentDependencies?: (id: string) => string[]
  ): Promise<Record<string, CodeChangeResult>> {
    const results: Record<string, CodeChangeResult> = {};
    
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
      
      const validationResult = await this.validateCodeChanges(
        sourceCode,
        component.sourceCode || '',
        componentId
      );
      
      if (!validationResult.success) {
        results[componentId] = {
          success: false,
          error: validationResult.error,
          componentId
        };
        // Don't apply any changes if validation fails for any component
        return results;
      }
    }
    
    // Then apply all changes
    for (const componentId of request.componentIds) {
      const sourceCode = request.changes[componentId];
      if (!sourceCode) continue;
      
      const changeRequest: CodeChangeRequest = {
        componentId,
        sourceCode,
        description: request.description
      };
      
      results[componentId] = await this.safelyApplyCode(
        changeRequest,
        getComponent,
        getComponentDependencies
      );
    }
    
    return results;
  }
  
  /**
   * Roll back changes for a component
   * 
   * @param componentId ID of the component to roll back
   * @returns The rolled back source code or null if rollback failed
   */
  rollback(componentId: string): string | null {
    this.emit(SafeCodeEvents.ROLLBACK_STARTED, { componentId });
    
    try {
      const backups = this.backups.get(componentId);
      if (!backups || backups.length === 0) {
        this.emit(SafeCodeEvents.ROLLBACK_FAILED, {
          componentId,
          error: 'No backups available for rollback'
        });
        return null;
      }
      
      // Get the most recent backup
      const previousVersion = backups.pop();
      if (!previousVersion) {
        this.emit(SafeCodeEvents.ROLLBACK_FAILED, {
          componentId,
          error: 'Failed to retrieve backup version'
        });
        return null;
      }
      
      // Update the backups
      this.backups.set(componentId, backups);
      
      this.emit(SafeCodeEvents.ROLLBACK_COMPLETED, {
        componentId,
        sourceCode: previousVersion
      });
      
      return previousVersion;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during rollback';
      
      this.emit(SafeCodeEvents.ROLLBACK_FAILED, {
        componentId,
        error: errorMessage
      });
      
      return null;
    }
  }
  
  /**
   * Create a backup of the component's source code
   * 
   * @param componentId ID of the component
   * @param sourceCode Current source code
   */
  private createBackup(componentId: string, sourceCode: string): void {
    let backups = this.backups.get(componentId) || [];
    
    // Add the new backup
    backups.push(sourceCode);
    
    // Limit the number of backups
    if (backups.length > this.maxBackupCount) {
      backups = backups.slice(-this.maxBackupCount);
    }
    
    this.backups.set(componentId, backups);
  }
  
  /**
   * Get all available backups for a component
   * 
   * @param componentId ID of the component
   * @returns Array of backup source code versions
   */
  getBackups(componentId: string): string[] {
    return [...(this.backups.get(componentId) || [])];
  }
  
  /**
   * Clear backups for a component
   * 
   * @param componentId ID of the component
   */
  clearBackups(componentId: string): void {
    this.backups.delete(componentId);
  }
  
  /**
   * Validate code changes through multiple stages
   * 
   * @param newCode New source code
   * @param originalCode Original source code
   * @param componentId ID of the component
   * @returns Validation result
   */
  private async validateCodeChanges(
    newCode: string,
    originalCode: string,
    componentId: string
  ): Promise<{ success: boolean; error?: string }> {
    // 1. Basic syntax validation through transpilation
    const transpileResult = await this.transpileCode(newCode);
    if (!transpileResult.success) {
      return { 
        success: false, 
        error: `Syntax error: ${transpileResult.error}` 
      };
    }
    
    // 2. Static analysis for safety
    if (this.options.strictValidation) {
      const securityResult = this.performSecurityCheck(newCode);
      if (!securityResult.success) {
        return { 
          success: false, 
          error: `Security check failed: ${securityResult.error}` 
        };
      }
    }
    
    // 3. Check for required patterns (e.g., component function signature)
    const patternResult = this.validateComponentPatterns(newCode, componentId);
    if (!patternResult.success) {
      return { 
        success: false, 
        error: `Component pattern check failed: ${patternResult.error}` 
      };
    }
    
    return { success: true };
  }
  
  /**
   * Transpile code to catch syntax errors
   * 
   * @param code Source code to transpile
   * @returns Transpilation result
   */
  private async transpileCode(code: string): Promise<{ success: boolean; error?: string }> {
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
        error: error instanceof Error ? error.message : 'Transpilation failed'
      };
    }
  }
  
  /**
   * Perform security checks on the code
   * 
   * @param code Source code to check
   * @returns Security check result
   */
  private performSecurityCheck(code: string): { success: boolean; error?: string } {
    // Check for potentially dangerous code patterns
    
    // 1. Check for eval and similar constructs
    if (/\beval\(/.test(code) || /\bnew Function\(/.test(code)) {
      return {
        success: false,
        error: 'Code contains potentially unsafe eval() or Function constructor'
      };
    }
    
    // 2. Check for DOM manipulation that could lead to XSS
    if (/\bdocument\.write\(/.test(code) || /\.innerHTML\s*=/.test(code)) {
      return {
        success: false,
        error: 'Code contains potentially unsafe DOM manipulation (document.write or innerHTML)'
      };
    }
    
    // 3. Check for suspicious iframe usage
    if (/\bdocument\.createElement\s*\(\s*['"]iframe['"]/.test(code)) {
      return {
        success: false,
        error: 'Code creates iframes, which could be a security risk'
      };
    }
    
    return { success: true };
  }
  
  /**
   * Validate component patterns to ensure code matches expected structure
   * 
   * @param code Source code to validate
   * @param componentId ID of the component
   * @returns Validation result
   */
  private validateComponentPatterns(code: string, componentId: string): { success: boolean; error?: string } {
    // Extract component name from ID (assuming ID format like 'Component', 'Button', etc.)
    const componentName = componentId;
    
    // Check for a component function or class definition
    const hasFunctionComponent = new RegExp(`function\\s+${componentName}\\s*\\(`).test(code);
    const hasArrowFunctionComponent = new RegExp(`const\\s+${componentName}\\s*=\\s*\\(`).test(code);
    const hasClassComponent = new RegExp(`class\\s+${componentName}\\s+extends\\s+React\\.Component`).test(code);
    
    if (!hasFunctionComponent && !hasArrowFunctionComponent && !hasClassComponent) {
      return {
        success: false,
        error: `Could not find a proper ${componentName} component definition`
      };
    }
    
    // Check for React import
    if (!code.includes('import React') && !code.includes('from "react"') && !code.includes("from 'react'")) {
      return {
        success: false,
        error: 'Missing React import'
      };
    }
    
    // Check for JSX return or render method
    if (!code.includes('return (') && !code.includes('render() {')) {
      return {
        success: false,
        error: 'Component does not appear to return JSX'
      };
    }
    
    return { success: true };
  }
  
  /**
   * Execute code in a sandbox to check runtime behavior
   * 
   * @param code Source code to execute
   * @returns Execution result
   */
  private async executeSandbox(code: string): Promise<{ success: boolean; error?: string }> {
    // In a real implementation, this would use a more sophisticated sandbox
    // For now, we just check basic JS validity
    try {
      // Remove JSX since we can't execute it directly
      const jsCode = code
        .replace(/<[^>]*>/g, '""') // Replace JSX tags with empty strings
        .replace(/\bimport\b.*?;/g, '') // Remove import statements
        .replace(/\bexport\b.*?;/g, ''); // Remove export statements
      
      // Create a function that checks only the non-JSX parts
      new Function(jsCode);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sandbox execution failed'
      };
    }
  }
  
  /**
   * Check if dependencies are affected by code changes
   * 
   * @param dependencies Array of dependency component IDs
   * @param originalCode Original source code
   * @param newCode New source code
   * @param getComponent Function to retrieve components
   * @returns Array of affected dependency IDs
   */
  private async checkDependencies(
    dependencies: string[],
    originalCode: string,
    newCode: string,
    getComponent: (id: string) => ModifiableComponent | null
  ): Promise<string[]> {
    const affectedDependencies: string[] = [];
    
    // Extract exports from original and new code
    const originalExports = this.extractExports(originalCode);
    const newExports = this.extractExports(newCode);
    
    // Check for changes in exports
    const hasExportChanges = !this.areExportsEqual(originalExports, newExports);
    
    if (hasExportChanges) {
      // If exports changed, all dependencies might be affected
      return dependencies;
    }
    
    // Check for prop changes
    const originalProps = this.extractProps(originalCode);
    const newProps = this.extractProps(newCode);
    
    const propChanges = this.getChangedProps(originalProps, newProps);
    
    if (propChanges.length > 0) {
      // Check each dependency to see if it uses the changed props
      for (const depId of dependencies) {
        const component = getComponent(depId);
        if (!component || !component.sourceCode) continue;
        
        const usesChangedProps = propChanges.some(prop => 
          component.sourceCode?.includes(`${propChanges}=`)
        );
        
        if (usesChangedProps) {
          affectedDependencies.push(depId);
        }
      }
    }
    
    return affectedDependencies;
  }
  
  /**
   * Extract exports from code
   * 
   * @param code Source code to analyze
   * @returns Array of export names
   */
  private extractExports(code: string): string[] {
    const exports: string[] = [];
    
    // Match export statements
    const exportRegex = /export\s+(const|let|var|function|class|default)\s+(\w+)/g;
    let match;
    
    while ((match = exportRegex.exec(code)) !== null) {
      if (match[1] === 'default') {
        exports.push('default');
      } else {
        exports.push(match[2]);
      }
    }
    
    // Match named exports
    const namedExportRegex = /export\s+{([^}]+)}/g;
    while ((match = namedExportRegex.exec(code)) !== null) {
      const names = match[1].split(',').map(n => n.trim());
      exports.push(...names);
    }
    
    return exports;
  }
  
  /**
   * Compare two export arrays for equality
   * 
   * @param exportsA First export array
   * @param exportsB Second export array
   * @returns Whether the exports are equal
   */
  private areExportsEqual(exportsA: string[], exportsB: string[]): boolean {
    if (exportsA.length !== exportsB.length) return false;
    
    const sortedA = [...exportsA].sort();
    const sortedB = [...exportsB].sort();
    
    return sortedA.every((exp, i) => exp === sortedB[i]);
  }
  
  /**
   * Extract props from component code
   * 
   * @param code Source code to analyze
   * @returns Array of prop names
   */
  private extractProps(code: string): string[] {
    const props: string[] = [];
    
    // Match function component props
    const functionPropsRegex = /function\s+\w+\s*\(\s*{([^}]+)}/;
    const functionMatch = code.match(functionPropsRegex);
    
    if (functionMatch) {
      const propStr = functionMatch[1];
      const propList = propStr.split(',').map(p => p.trim());
      props.push(...propList);
    }
    
    // Match destructured props
    const destructuredPropsRegex = /const\s+{([^}]+)}\s*=\s*props/;
    const destructuredMatch = code.match(destructuredPropsRegex);
    
    if (destructuredMatch) {
      const propStr = destructuredMatch[1];
      const propList = propStr.split(',').map(p => p.trim());
      props.push(...propList);
    }
    
    return props;
  }
  
  /**
   * Get props that have changed between versions
   * 
   * @param originalProps Original props
   * @param newProps New props
   * @returns Array of changed prop names
   */
  private getChangedProps(originalProps: string[], newProps: string[]): string[] {
    const removedProps = originalProps.filter(p => !newProps.includes(p));
    const addedProps = newProps.filter(p => !originalProps.includes(p));
    
    return [...removedProps, ...addedProps];
  }
  
  /**
   * Generate a diff between original and new code
   * 
   * @param originalCode Original source code
   * @param newCode New source code
   * @returns Diff string
   */
  private generateDiff(originalCode: string, newCode: string): string {
    // Simple line-by-line diff - in a real implementation,
    // this would use a more sophisticated diff algorithm
    
    const originalLines = originalCode.split('\n');
    const newLines = newCode.split('\n');
    
    let diff = '';
    
    // Find the maximum length for padding
    const maxLength = Math.max(
      ...originalLines.map(line => line.length),
      ...newLines.map(line => line.length)
    );
    
    // Generate a simple side-by-side diff
    const maxLines = Math.max(originalLines.length, newLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const originalLine = i < originalLines.length ? originalLines[i] : '';
      const newLine = i < newLines.length ? newLines[i] : '';
      
      if (originalLine !== newLine) {
        diff += `- ${originalLine}\n+ ${newLine}\n`;
      } else {
        diff += `  ${originalLine}\n`;
      }
    }
    
    return diff;
  }
}

export default SafeCodeApplication;
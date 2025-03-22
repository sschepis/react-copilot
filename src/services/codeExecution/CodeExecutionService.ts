import { ChangeExplainer, ExplanationLevel, ChangeExplanation } from './ChangeExplainer';
import { ConflictResolver, CodeChange, ConflictAnalysisResult, ConflictResolverOptions } from './ConflictResolver';
import { SafeCodeApplication, SafeCodeOptions } from './SafeCodeApplication';
import { ModifiableComponent, CodeChangeRequest, CodeChangeResult } from '../../utils/types';
import { EventEmitter } from '../../utils/EventEmitter';
import * as ts from 'typescript';

/**
 * Interface for the component context service
 */
export interface ComponentContextService {
  /** Get a component by ID */
  getComponent(id: string): ModifiableComponent | null;
  /** Get component dependencies */
  getComponentDependencies?(id: string): string[];
}

/**
 * Events emitted by the CodeExecutionService
 */
export enum CodeExecutionServiceEvents {
  EXECUTION_STARTED = 'execution_started',
  EXECUTION_COMPLETED = 'execution_completed',
  EXECUTION_FAILED = 'execution_failed',
  VALIDATION_COMPLETED = 'validation_completed',
  CONFLICT_DETECTED = 'conflict_detected',
  CONFLICT_RESOLVED = 'conflict_resolved',
  CHANGE_EXPLAINED = 'change_explained',
  ROLLBACK_COMPLETED = 'rollback_completed'
}

/**
 * Represents a comprehensive code execution request
 */
export interface ExecutionRequest {
  /** Component ID */
  componentId: string;
  /** New source code */
  sourceCode: string;
  /** Description of changes */
  description?: string;
  /** Whether to perform validation before applying */
  validate?: boolean;
  /** Whether to check for conflicts */
  checkConflicts?: boolean;
  /** Whether to generate explanation */
  generateExplanation?: boolean;
  /** Whether to create backup before applying */
  createBackup?: boolean;
  /** Metadata about the execution */
  metadata?: Record<string, any>;
}

/**
 * Result of a code execution operation
 */
export interface ExecutionResult {
  /** Success status */
  success: boolean;
  /** Component ID */
  componentId: string;
  /** Error message if failed */
  error?: string;
  /** Validation results if validation was performed */
  validation?: {
    valid: boolean;
    issues: Array<{ message: string; line?: number; column?: number; severity: 'error' | 'warning' | 'info' }>;
  };
  /** Conflict analysis if conflicts were checked */
  conflicts?: ConflictAnalysisResult;
  /** Explanation of changes if generated */
  explanation?: ChangeExplanation;
  /** Warnings or messages */
  warnings?: string[];
  /** Execution metadata */
  metadata?: Record<string, any>;
  /** Execution time in milliseconds */
  executionTime?: number;
}

/**
 * Configuration options for the CodeExecutionService
 */
export interface CodeExecutionServiceOptions {
  /** Default explanation level */
  defaultExplanationLevel?: ExplanationLevel;
  /** Default SafeCode options */
  safeCodeOptions?: SafeCodeOptions;
  /** Default conflict resolver options */
  conflictResolverOptions?: ConflictResolverOptions;
  /** Component context service for resolving components */
  componentContextService?: ComponentContextService;
}

/**
 * Comprehensive service for executing code changes with validation,
 * conflict resolution, explanation generation, and safe application
 */
export class CodeExecutionService extends EventEmitter {
  private changeExplainer: ChangeExplainer;
  private conflictResolver: ConflictResolver;
  private safeCodeApplication: SafeCodeApplication;
  private options: Required<CodeExecutionServiceOptions>;
  private componentContextService?: ComponentContextService;

  constructor(options: CodeExecutionServiceOptions = {}) {
    super();
    
    // Initialize options with defaults
    this.options = {
      defaultExplanationLevel: options.defaultExplanationLevel || ExplanationLevel.DETAILED,
      safeCodeOptions: options.safeCodeOptions || {},
      conflictResolverOptions: options.conflictResolverOptions || {},
      componentContextService: options.componentContextService || {} as ComponentContextService
    };
    
    // Store component context service if provided
    this.componentContextService = options.componentContextService;
    
    // Initialize sub-services
    this.changeExplainer = new ChangeExplainer({
      detailLevel: this.options.defaultExplanationLevel
    });
    
    this.conflictResolver = new ConflictResolver(this.options.conflictResolverOptions);
    
    this.safeCodeApplication = new SafeCodeApplication();
    this.safeCodeApplication.configure(this.options.safeCodeOptions);
  }
  
  /**
   * Execute a code change with optional validation, conflict checking, and explanation
   * 
   * @param request Execution request
   * @returns Execution result
   */
  async executeCode(request: ExecutionRequest): Promise<ExecutionResult> {
    const startTime = Date.now();
    const result: ExecutionResult = {
      success: false,
      componentId: request.componentId,
      warnings: [],
      metadata: {
        ...request.metadata,
        timestamp: new Date().toISOString()
      }
    };
    
    try {
      // Emit start event
      this.emit(CodeExecutionServiceEvents.EXECUTION_STARTED, {
        componentId: request.componentId,
        description: request.description
      });
      
      // Get component
      const component = this.getComponent(request.componentId);
      if (!component) {
        throw new Error(`Component with ID ${request.componentId} not found`);
      }
      
      // Perform validation if requested
      if (request.validate) {
        result.validation = await this.validateCode(component, request.sourceCode);
        
        // Emit validation completed event
        this.emit(CodeExecutionServiceEvents.VALIDATION_COMPLETED, {
          componentId: request.componentId,
          validation: result.validation
        });
        
        // If validation failed with errors, stop execution
        if (result.validation && !result.validation.valid) {
          const errors = result.validation.issues.filter(issue => issue.severity === 'error');
          if (errors.length > 0) {
            throw new Error(
              `Validation failed with ${errors.length} errors. First error: ${errors[0].message}`
            );
          } else if (result.validation.issues) {
            // If only warnings, add to result warnings
            result.validation.issues
              .filter(issue => issue.severity === 'warning')
              .forEach(warning => {
                result.warnings!.push(warning.message);
              });
          }
        }
      }
      
      // Check for conflicts if requested
      if (request.checkConflicts) {
        result.conflicts = await this.checkConflicts(component, request.sourceCode);
        
        // If there are unresolved conflicts, emit event
        if (result.conflicts && result.conflicts.unresolvedConflicts.length > 0) {
          this.emit(CodeExecutionServiceEvents.CONFLICT_DETECTED, {
            componentId: request.componentId,
            conflicts: result.conflicts
          });
          
          // Add warning about conflicts
          result.warnings!.push(
            `${result.conflicts.unresolvedConflicts.length} unresolved conflicts detected. These may need manual resolution.`
          );
        }
      }
      
      // Generate explanation if requested
      if (request.generateExplanation) {
        result.explanation = await this.generateExplanation(component, request.sourceCode);
        
        // Emit explanation event
        this.emit(CodeExecutionServiceEvents.CHANGE_EXPLAINED, {
          componentId: request.componentId,
          explanation: result.explanation
        });
      }
      
      // Apply the code using SafeCodeApplication
      const changeResult = await this.safeCodeApplication.safelyApplyCode(
        {
          componentId: request.componentId,
          newCode: request.sourceCode,
          description: request.description,
          metadata: request.metadata
        } as CodeChangeRequest,
        (id: string) => this.getComponent(id),
        this.getComponentDependencies.bind(this)
      );
      
      // Handle success or failure
      if (changeResult.success) {
        result.success = true;
        
        // Emit success event
        this.emit(CodeExecutionServiceEvents.EXECUTION_COMPLETED, {
          componentId: request.componentId,
          result: result
        });
      } else {
        throw new Error(changeResult.error || 'Unknown error applying code changes');
      }
      
      // Calculate execution time
      result.executionTime = Date.now() - startTime;
      
      return result;
    } catch (error) {
      // Set error message in result
      result.error = error instanceof Error ? error.message : String(error);
      
      // Emit failure event
      this.emit(CodeExecutionServiceEvents.EXECUTION_FAILED, {
        componentId: request.componentId,
        error: result.error
      });
      
      // Calculate execution time
      result.executionTime = Date.now() - startTime;
      
      return result;
    }
  }
  
  /**
   * Validate code changes before applying
   * 
   * @param component Component being changed
   * @param newCode New source code
   * @returns Validation result
   */
  private async validateCode(
    component: ModifiableComponent,
    newCode: string
  ): Promise<ExecutionResult['validation']> {
    try {
      // Import TypeScript compiler API
      const ts = require('typescript');
      
      // Create a source file
      const sourceFile = ts.createSourceFile(
        `${component.name}.tsx`, // Use component name with appropriate extension
        newCode,
        ts.ScriptTarget.Latest,
        true
      );
      
      // Create a compilation unit
      const options: ts.CompilerOptions = {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.React,
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
      };
      
      // Create a program
      const host = ts.createCompilerHost(options);
      const origGetSourceFile = host.getSourceFile;
      
      // Override getSourceFile to use our in-memory source file
      host.getSourceFile = (fileName: string, languageVersion: ts.ScriptTarget) => {
        if (fileName === `${component.name}.tsx`) {
          return sourceFile;
        }
        return origGetSourceFile(fileName, languageVersion);
      };
      
      const program = ts.createProgram([`${component.name}.tsx`], options, host);
      
      // Get diagnostics
      const syntacticDiagnostics = program.getSyntacticDiagnostics(sourceFile);
      const semanticDiagnostics = program.getSemanticDiagnostics(sourceFile);
      const allDiagnostics = [...syntacticDiagnostics, ...semanticDiagnostics];
      
      // Convert TypeScript diagnostics to our issue format
      const issues: Array<{
        message: string;
        line?: number;
        column?: number;
        severity: 'error' | 'warning' | 'info';
      }> = [];
      
      for (const diagnostic of allDiagnostics) {
        // Get message and position
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
        let line: number | undefined;
        let column: number | undefined;
        
        if (diagnostic.file && diagnostic.start !== undefined) {
          const { line: lineNumber, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
          line = lineNumber + 1; // TypeScript is 0-based, we want 1-based
          column = character + 1;
        }
        
        // Determine severity (TypeScript doesn't have an explicit severity in diagnostics)
        let severity: 'error' | 'warning' | 'info' = 'error';
        if (diagnostic.category === ts.DiagnosticCategory.Warning) {
          severity = 'warning';
        } else if (diagnostic.category === ts.DiagnosticCategory.Suggestion) {
          severity = 'info';
        }
        
        issues.push({
          message,
          line,
          column,
          severity
        });
      }
      
      // Perform additional validations for component-specific code
      this.validateComponentSpecifics(component, newCode, issues);
      
      return {
        valid: issues.filter(issue => issue.severity === 'error').length === 0,
        issues
      };
    } catch (error) {
      // If validation fails, return error
      return {
        valid: false,
        issues: [{
          message: error instanceof Error ? error.message : String(error),
          severity: 'error'
        }]
      };
    }
  }
  
  /**
   * Perform React component-specific validations
   * 
   * @param component Component being validated
   * @param code New source code
   * @param issues Array of issues to append to
   */
  private validateComponentSpecifics(
    component: ModifiableComponent,
    code: string,
    issues: Array<{
      message: string;
      line?: number;
      column?: number;
      severity: 'error' | 'warning' | 'info';
    }>
  ): void {
    // Check for missing React import
    if (code.includes('JSX') || code.includes('<') && code.includes('/>')) {
      if (!code.includes('import React') && !code.includes('from "react"') && !code.includes("from 'react'")) {
        issues.push({
          message: 'React import is missing but JSX is used',
          line: 1,
          severity: 'error'
        });
      }
    }
    
    // Check for component name convention (PascalCase)
    const componentNameMatch = code.match(/(?:function|class)\s+([A-Za-z0-9_]+)/);
    if (componentNameMatch && componentNameMatch[1]) {
      const componentName = componentNameMatch[1];
      if (componentName.charAt(0) !== componentName.charAt(0).toUpperCase()) {
        issues.push({
          message: `Component name '${componentName}' should follow PascalCase convention`,
          line: code.split('\n').findIndex(line => line.includes(componentName)),
          severity: 'warning'
        });
      }
    }
    
    // Check for missing return statement in functional component
    if (code.includes('function') && code.includes('props') && !code.includes('return')) {
      issues.push({
        message: 'Functional component appears to be missing a return statement',
        severity: 'error'
      });
    }
    
    // Check for potentially unused props
    const propsMatch = code.match(/(?:function|const)\s+\w+\s*\(\s*(?:props|{\s*([^}]*)}\s*)/);
    if (propsMatch && propsMatch[1]) {
      const declaredProps = propsMatch[1].split(',').map(p => p.trim().split(':')[0].trim());
      
      for (const prop of declaredProps) {
        if (prop && !code.includes(prop)) {
          issues.push({
            message: `Prop '${prop}' is declared but might not be used in component`,
            severity: 'warning'
          });
        }
      }
    }
    
    // Check for missing key prop in list rendering
    if ((code.includes('.map(') || code.includes('forEach(')) && 
        code.includes('return') && code.includes('<') && 
        !code.includes('key=')) {
      issues.push({
        message: 'Component appears to render a list without `key` prop',
        severity: 'warning'
      });
    }
    
    // Check for potentially unsafe component lifecycle methods
    if (code.includes('componentWillMount') || 
        code.includes('componentWillUpdate') || 
        code.includes('componentWillReceiveProps')) {
      issues.push({
        message: 'Component uses deprecated lifecycle methods that may cause issues',
        severity: 'warning'
      });
    }
    
    // Check for nested state updates that might cause re-render loops
    if ((code.includes('useState') || code.includes('this.setState')) && 
        (code.includes('useEffect') || code.includes('componentDidUpdate'))) {
      // Simplified check - in a real implementation would do more precise analysis
      issues.push({
        message: 'Component has state updates inside effects/lifecycle methods - verify for potential infinite loops',
        severity: 'info'
      });
    }
    
    // Check for large render methods
    const renderMethodMatch = code.match(/render\s*\(\s*\)\s*{([^}]*)}/);
    // If the simple match doesn't work, try with a more compatible pattern
    if (!renderMethodMatch) {
      // Using [\s\S]* instead of . with s flag for cross-line matching
      const alternativeMatch = code.match(/render\s*\(\s*\)\s*{([\s\S]*?)}/);
      if (alternativeMatch) {
        const renderBody = alternativeMatch[1];
        if (renderBody.split('\n').length > 50) {
          issues.push({
            message: 'Render method is very large (>50 lines). Consider breaking it down into smaller components.',
            severity: 'warning'
          });
        }
      }
      return;
    }
    if (renderMethodMatch && renderMethodMatch[1]) {
      const renderBody = renderMethodMatch[1];
      if (renderBody.split('\n').length > 50) {
        issues.push({
          message: 'Render method is very large (>50 lines). Consider breaking it down into smaller components.',
          severity: 'warning'
        });
      }
    }
  }
  
  /**
   * Check for conflicts with existing changes
   * 
   * @param component Component being changed
   * @param newCode New source code
   * @returns Conflict analysis result
   */
  private async checkConflicts(
    component: ModifiableComponent,
    newCode: string
  ): Promise<ConflictAnalysisResult> {
    try {
      // Create a CodeChange object for the current change
      const currentChange: CodeChange = {
        filePath: component.id,
        startLine: 1,
        endLine: (component.sourceCode || '').split('\n').length,
        oldContent: component.sourceCode || '',
        newContent: newCode,
        changeId: `change-${Date.now()}`,
        description: 'Current change',
        timestamp: new Date()
      };
      
      // TODO: Get pending changes from a change history or queue
      // For now, we'll just check against an empty list
      const pendingChanges: CodeChange[] = [];
      
      // Add the current change
      const allChanges = [...pendingChanges, currentChange];
      
      // Use conflict resolver to detect and resolve conflicts
      return this.conflictResolver.detectAndResolveConflicts(allChanges);
    } catch (error) {
      console.error('Error checking conflicts:', error);
      
      // Return empty conflict result if error occurs
      return {
        conflicts: [],
        nonConflictingChanges: [],
        autoResolved: [],
        unresolvedConflicts: [],
        stats: {
          totalChanges: 1,
          totalConflicts: 0,
          autoResolved: 0,
          unresolvedConflicts: 0,
          bySeverity: {},
          byType: {}
        } as any
      };
    }
  }
  
  /**
   * Generate explanation for code changes
   * 
   * @param component Component being changed
   * @param newCode New source code
   * @returns Change explanation
   */
  private async generateExplanation(
    component: ModifiableComponent,
    newCode: string
  ): Promise<ChangeExplanation> {
    try {
      // Set up file maps for the explainer
      const originalFiles = new Map<string, string>();
      originalFiles.set(component.id, component.sourceCode || '');
      
      const newFiles = new Map<string, string>();
      newFiles.set(component.id, newCode);
      
      // Generate explanation
      return this.changeExplainer.explainChanges(originalFiles, newFiles);
    } catch (error) {
      console.error('Error generating explanation:', error);
      
      // Return minimal explanation
      return {
        summary: 'Error generating explanation.',
        changes: [],
        fileChanges: new Map(),
        typeChanges: new Map()
      };
    }
  }
  
  /**
   * Roll back changes for a component
   * 
   * @param componentId ID of the component to roll back
   * @returns Success status
   */
  async rollbackChanges(componentId: string): Promise<boolean> {
    try {
      // Get component to verify it exists
      const component = this.getComponent(componentId);
      if (!component) {
        throw new Error(`Component with ID ${componentId} not found`);
      }
      
      // Attempt rollback
      const rolledBackCode = await this.safeCodeApplication.rollback(componentId);
      
      if (rolledBackCode !== null) {
        // Emit rollback event
        this.emit(CodeExecutionServiceEvents.ROLLBACK_COMPLETED, {
          componentId,
          success: true
        });
        
        return true;
      } else {
        throw new Error('Rollback returned null');
      }
    } catch (error) {
      // Emit rollback failure event
      this.emit(CodeExecutionServiceEvents.ROLLBACK_COMPLETED, {
        componentId,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      
      return false;
    }
  }
  
  /**
   * Get a component by ID
   * 
   * @param componentId Component ID
   * @returns Component or null if not found
   */
  private getComponent(componentId: string): ModifiableComponent | null {
    if (this.componentContextService) {
      return this.componentContextService.getComponent(componentId);
    }
    
    // If no context service, return null
    return null;
  }
  
  /**
   * Get dependencies for a component
   * 
   * @param componentId Component ID
   * @returns Array of dependency component IDs
   */
  private getComponentDependencies(componentId: string): string[] {
    if (this.componentContextService && 
        typeof this.componentContextService.getComponentDependencies === 'function') {
      return this.componentContextService.getComponentDependencies(componentId);
    }
    
    // If no context service or method not available, return empty array
    return [];
  }
  
  /**
   * Configure the service with new options
   * 
   * @param options New options to apply
   */
  configure(options: CodeExecutionServiceOptions): void {
    // Update options
    this.options = {
      ...this.options,
      ...options
    };
    
    // Update sub-services with new options
    if (options.defaultExplanationLevel) {
      this.changeExplainer = new ChangeExplainer({
        detailLevel: options.defaultExplanationLevel
      });
    }
    
    if (options.conflictResolverOptions) {
      this.conflictResolver = new ConflictResolver(options.conflictResolverOptions);
    }
    
    if (options.safeCodeOptions) {
      this.safeCodeApplication.configure(options.safeCodeOptions);
    }
    
    // Update component context service if provided
    if (options.componentContextService) {
      this.componentContextService = options.componentContextService;
    }
  }
}

// Export a default instance
export const codeExecutionService = new CodeExecutionService();
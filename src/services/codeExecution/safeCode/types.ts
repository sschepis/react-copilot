import { EventEmitter } from '../../../utils/EventEmitter';
import { ModifiableComponent } from '../../../utils/types';

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
  /** Enable rollback functionality */
  enableRollback?: boolean;
  /** Use strict validation rules */
  strictValidation?: boolean;
  /** Check dependencies for breaking changes */
  dependencyCheck?: boolean;
  /** Create backups before applying changes */
  createBackup?: boolean;
  /** Execute code in a sandbox before applying */
  sandboxExecution?: boolean;
  /** Maximum number of backups to keep */
  maxBackupCount?: number;
  /** Automatically apply minor fixes */
  autoApplyFixes?: boolean;
  /** Custom validation rules */
  customValidators?: CodeValidator[];
  /** Additional options for specific appliers */
  additionalOptions?: Record<string, any>;
}

/**
 * Types of code changes that can be applied
 */
export enum CodeChangeType {
  /** Adding new code */
  ADDITION = 'addition',
  /** Removing existing code */
  DELETION = 'deletion',
  /** Modifying existing code */
  MODIFICATION = 'modification',
  /** Refactoring code (structure changes) */
  REFACTORING = 'refactoring',
  /** Formatting changes only */
  FORMATTING = 'formatting',
  /** Multiple types of changes */
  MIXED = 'mixed'
}

/**
 * Severity level of code validation issues
 */
export enum ValidationSeverity {
  /** Information only */
  INFO = 'info',
  /** Warning that doesn't prevent application */
  WARNING = 'warning',
  /** Error that prevents application */
  ERROR = 'error',
  /** Critical error with security implications */
  CRITICAL = 'critical'
}

/**
 * Result of code validation
 */
export interface ValidationResult {
  /** Whether the validation passed */
  success: boolean;
  /** Error message if validation failed */
  error?: string;
  /** List of validation issues */
  issues?: ValidationIssue[];
  /** Diagnostic information */
  diagnostics?: Record<string, any>;
}

/**
 * Issue found during validation
 */
export interface ValidationIssue {
  /** Message describing the issue */
  message: string;
  /** Severity level */
  severity: ValidationSeverity;
  /** Line number where issue occurs */
  line?: number;
  /** Column number where issue occurs */
  column?: number;
  /** Suggested fix for the issue */
  suggestedFix?: string;
  /** Can this issue be fixed automatically */
  autoFixable?: boolean;
}

/**
 * Code validator interface
 */
export interface CodeValidator {
  /** Validator name */
  name: string;
  /** Validate code */
  validate(code: string, context?: ValidationContext): Promise<ValidationResult> | ValidationResult;
  /** Severity level this validator operates at */
  severityLevel: ValidationSeverity;
  /** Fix issues automatically if possible */
  fix?(code: string, issues: ValidationIssue[]): string;
}

/**
 * Context for code validation
 */
export interface ValidationContext {
  /** Component ID */
  componentId: string;
  /** Original code before changes */
  originalCode?: string;
  /** Component type (function, class, etc.) */
  componentType?: string;
  /** Code language (JavaScript, TypeScript, etc.) */
  language?: string;
  /** Additional context information */
  metadata?: Record<string, any>;
}

/**
 * Request to apply code changes
 */
export interface CodeChangeRequest {
  /** ID of the component to change */
  componentId: string;
  /** New source code */
  sourceCode: string;
  /** Description of the change */
  description?: string;
  /** Type of change being made */
  changeType?: CodeChangeType;
  /** Additional metadata about the change */
  metadata?: Record<string, any>;
}

/**
 * Result of applying code changes
 */
export interface CodeChangeResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Error message if operation failed */
  error?: string;
  /** ID of the component */
  componentId: string;
  /** New source code if successful */
  newSourceCode?: string;
  /** Diff between original and new code */
  diff?: string;
  /** Warnings that didn't prevent application */
  warnings?: string[];
  /** Details of validation issues */
  validationIssues?: ValidationIssue[];
  /** Which dependencies were affected */
  affectedDependencies?: string[];
}

/**
 * Request to apply changes across multiple components
 */
export interface MultiComponentChangeRequest {
  /** IDs of the components to change */
  componentIds: string[];
  /** Changes for each component */
  changes: Record<string, string>;
  /** Description of the changes */
  description?: string;
  /** Whether the changes should be applied as a transaction */
  transactional?: boolean;
  /** Additional metadata about the changes */
  metadata?: Record<string, any>;
}

/**
 * Context for sandbox execution
 */
export interface SandboxContext {
  /** Mock objects to provide */
  mocks?: Record<string, any>;
  /** Maximum execution time in ms */
  timeout?: number;
  /** Whether to allow network access */
  allowNetwork?: boolean;
  /** Additional context configuration */
  config?: Record<string, any>;
}

/**
 * Interface for code change appliers
 */
export interface ICodeChangeApplier {
  /** Applier name */
  readonly name: string;
  
  /** Component types this applier can handle */
  readonly supportedComponentTypes: string[];
  
  /** Event emitter for listening to events */
  readonly events: EventEmitter;
  
  /**
   * Apply code changes safely
   */
  applyChanges(
    request: CodeChangeRequest,
    getComponent: (id: string) => ModifiableComponent | null,
    getComponentDependencies?: (id: string) => string[]
  ): Promise<CodeChangeResult>;
  
  /**
   * Apply changes to multiple components
   */
  applyMultiComponentChanges(
    request: MultiComponentChangeRequest,
    getComponent: (id: string) => ModifiableComponent | null,
    getComponentDependencies?: (id: string) => string[]
  ): Promise<Record<string, CodeChangeResult>>;
  
  /**
   * Validate code changes without applying them
   */
  validateChanges(
    newCode: string,
    originalCode: string,
    context: ValidationContext
  ): Promise<ValidationResult>;
  
  /**
   * Roll back to a previous version
   */
  rollback(
    componentId: string,
    getComponent?: (id: string) => ModifiableComponent | null
  ): Promise<string | null>;
  
  /**
   * Configure the applier with options
   */
  configure(options: SafeCodeOptions): void;
}
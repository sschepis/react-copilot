import { EventEmitter } from './EventEmitter';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  DEBUG = 'debug',      // Low severity, useful for debugging
  INFO = 'info',        // Informational message, not an error
  WARNING = 'warning',  // Warning that doesn't stop operation
  ERROR = 'error',      // Error that affects functionality but doesn't crash
  CRITICAL = 'critical' // Severe error that may crash or corrupt data
}

/**
 * Error categories for better organization
 */
export enum ErrorCategory {
  COMPONENT = 'component',      // Component-related errors
  STATE = 'state',              // State management errors
  LLM = 'llm',                  // LLM communication errors
  NETWORK = 'network',          // Network request errors
  VALIDATION = 'validation',    // Validation errors
  PLUGIN = 'plugin',            // Plugin-related errors 
  CODE_EXECUTION = 'code_exec', // Code execution errors
  SECURITY = 'security',        // Security-related errors
  PERFORMANCE = 'performance',  // Performance issues
  SYSTEM = 'system',            // Core system errors
  UNKNOWN = 'unknown'           // Uncategorized errors
}

/**
 * Error context with additional metadata
 */
export interface ErrorContext {
  componentId?: string;         // ID of related component
  location?: string;            // Where the error occurred
  message: string;              // Human-readable error message
  originalError?: Error;        // Original error object
  timestamp: number;            // When the error occurred
  metadata?: Record<string, any>; // Additional context-specific data
  stackTrace?: string;          // Stack trace if available
  suggestions?: string[];       // Possible solutions or next steps
}

/**
 * Error events emitted by the error handling system
 */
export enum ErrorEvents {
  ERROR_OCCURRED = 'error_occurred',
  ERROR_HANDLED = 'error_handled',
  ERROR_RECOVERED = 'error_recovered'
}

/**
 * Configuration for the error handling system
 */
export interface ErrorHandlingConfig {
  captureUncaughtExceptions?: boolean;  // Whether to capture global uncaught exceptions
  captureRejectedPromises?: boolean;    // Whether to capture unhandled promise rejections
  logToConsole?: boolean;               // Whether to log errors to console
  minSeverityToReport?: ErrorSeverity;  // Minimum severity level to report
  enableStackTraces?: boolean;          // Whether to capture stack traces
  autoReportErrors?: boolean;           // Whether to auto-report errors to monitoring service
  errorReportingEndpoint?: string;      // URL for error reporting API
  maxErrorsStored?: number;             // Maximum number of errors to store in history
}

/**
 * Custom error class for React Copilot errors
 */
export class CopilotError extends Error {
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: Partial<ErrorContext>;
  id: string;

  constructor(
    message: string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    context: Partial<ErrorContext> = {}
  ) {
    super(message);
    this.name = 'CopilotError';
    this.severity = severity;
    this.category = category;
    this.context = context;
    this.id = Math.random().toString(36).substring(2, 15);
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CopilotError);
    }
  }
}

/**
 * Error handler function type
 */
export type ErrorHandler = (
  error: Error | CopilotError,
  severity: ErrorSeverity,
  category: ErrorCategory,
  context?: Partial<ErrorContext>
) => void;

/**
 * Recovery strategy function type
 */
export type ErrorRecoveryStrategy = (
  error: CopilotError,
  context: ErrorContext
) => Promise<boolean>;

/**
 * Central error handling system for React Copilot
 */
export class ErrorHandlingSystem extends EventEmitter {
  private static instance: ErrorHandlingSystem;
  private config: ErrorHandlingConfig;
  private errorHistory: Array<{error: CopilotError, context: ErrorContext}> = [];
  private errorHandlers: Map<ErrorCategory, ErrorHandler[]> = new Map();
  private recoveryStrategies: Map<ErrorCategory, ErrorRecoveryStrategy[]> = new Map();
  private isHandlingError = false;

  /**
   * Get the singleton instance of the error handling system
   */
  public static getInstance(): ErrorHandlingSystem {
    if (!ErrorHandlingSystem.instance) {
      ErrorHandlingSystem.instance = new ErrorHandlingSystem();
    }
    return ErrorHandlingSystem.instance;
  }

  /**
   * Create a new ErrorHandlingSystem
   */
  private constructor() {
    super();
    this.config = {
      captureUncaughtExceptions: true,
      captureRejectedPromises: true,
      logToConsole: true,
      minSeverityToReport: ErrorSeverity.ERROR,
      enableStackTraces: true,
      autoReportErrors: false,
      maxErrorsStored: 50
    };

    this.setupGlobalErrorHandlers();
  }

  /**
   * Configure the error handling system
   * @param config Configuration options
   */
  configure(config: Partial<ErrorHandlingConfig>): void {
    this.config = { ...this.config, ...config };
    
    // If we're toggling global handlers, update them
    if (config.captureUncaughtExceptions !== undefined || 
        config.captureRejectedPromises !== undefined) {
      this.setupGlobalErrorHandlers();
    }
  }

  /**
   * Set up global error handlers for uncaught exceptions and rejected promises
   */
  private setupGlobalErrorHandlers(): void {
    if (typeof window !== 'undefined') {
      // Remove existing handlers if any
      window.removeEventListener('error', this.handleGlobalError);
      window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
      
      // Add handlers if enabled
      if (this.config.captureUncaughtExceptions) {
        window.addEventListener('error', this.handleGlobalError);
      }
      
      if (this.config.captureRejectedPromises) {
        window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
      }
    }
  }

  /**
   * Handle global uncaught errors
   */
  private handleGlobalError = (event: ErrorEvent): void => {
    this.handleError(
      event.error || new Error(event.message),
      ErrorSeverity.CRITICAL,
      ErrorCategory.SYSTEM,
      {
        message: event.message,
        location: `${event.filename}:${event.lineno}:${event.colno}`,
        timestamp: Date.now()
      }
    );
  };

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    let error = event.reason;
    if (!(error instanceof Error)) {
      error = new Error(String(error));
    }
    
    this.handleError(
      error,
      ErrorSeverity.ERROR,
      ErrorCategory.SYSTEM,
      {
        message: error.message,
        timestamp: Date.now(),
        metadata: { unhandledRejection: true }
      }
    );
  };

  /**
   * Register an error handler for a specific category
   * @param category The category of errors to handle
   * @param handler The handler function to call
   */
  registerErrorHandler(category: ErrorCategory, handler: ErrorHandler): void {
    if (!this.errorHandlers.has(category)) {
      this.errorHandlers.set(category, []);
    }
    this.errorHandlers.get(category)!.push(handler);
  }

  /**
   * Register a recovery strategy for a specific error category
   * @param category The category of errors to recover from
   * @param strategy The recovery strategy function
   */
  registerRecoveryStrategy(category: ErrorCategory, strategy: ErrorRecoveryStrategy): void {
    if (!this.recoveryStrategies.has(category)) {
      this.recoveryStrategies.set(category, []);
    }
    this.recoveryStrategies.get(category)!.push(strategy);
  }

  /**
   * Handle an error through the error handling system
   * @param error The error to handle
   * @param severity The severity level of the error
   * @param category The category of the error
   * @param contextData Additional context for the error
   */
  handleError(
    error: Error | CopilotError,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    contextData: Partial<ErrorContext> = {}
  ): void {
    // Prevent recursive error handling
    if (this.isHandlingError) {
      console.error('Recursive error handling detected:', error);
      return;
    }
    
    this.isHandlingError = true;
    
    try {
      // If it's not already a CopilotError, convert it
      const copilotError = error instanceof CopilotError 
        ? error 
        : new CopilotError(error.message, category, severity, contextData);
      
      // Prepare full context
      const context: ErrorContext = {
        message: copilotError.message,
        timestamp: Date.now(),
        stackTrace: copilotError.stack,
        ...(copilotError.context || {}),
        ...contextData
      };

      // Log to console if enabled
      if (this.config.logToConsole) {
        this.logErrorToConsole(copilotError, context);
      }

      // Store in error history
      this.addToErrorHistory(copilotError, context);

      // Emit error event
      this.emit(ErrorEvents.ERROR_OCCURRED, { error: copilotError, context });

      // Call category-specific handlers
      this.callErrorHandlers(copilotError, severity, category, context);

      // If critical, try recovery strategies
      if (severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.ERROR) {
        this.attemptErrorRecovery(copilotError, context);
      }

      // Report error if enabled and meets minimum severity
      if (this.config.autoReportErrors && 
          this.isSeverityReportable(severity) && 
          this.config.errorReportingEndpoint) {
        this.reportError(copilotError, context);
      }
    } finally {
      this.isHandlingError = false;
    }
  }

  /**
   * Check if a severity level should be reported
   * @param severity The severity level to check
   */
  private isSeverityReportable(severity: ErrorSeverity): boolean {
    const severityLevels = Object.values(ErrorSeverity);
    const minIndex = severityLevels.indexOf(this.config.minSeverityToReport!);
    const currentIndex = severityLevels.indexOf(severity);
    return currentIndex >= minIndex;
  }

  /**
   * Log an error to the console with appropriate formatting
   * @param error The error to log
   * @param context The error context
   */
  private logErrorToConsole(error: CopilotError, context: ErrorContext): void {
    const styles = {
      [ErrorSeverity.DEBUG]: 'color: #6c757d',
      [ErrorSeverity.INFO]: 'color: #0dcaf0',
      [ErrorSeverity.WARNING]: 'color: #ffc107',
      [ErrorSeverity.ERROR]: 'color: #dc3545',
      [ErrorSeverity.CRITICAL]: 'color: #dc3545; font-weight: bold'
    };

    console.groupCollapsed(
      `%c${error.severity.toUpperCase()}: [${error.category}] ${error.message}`,
      styles[error.severity]
    );
    
    console.log('Error Details:', {
      category: error.category,
      severity: error.severity,
      message: error.message,
      context,
      originalError: context.originalError
    });
    
    if (context.stackTrace) {
      console.log('Stack Trace:', context.stackTrace);
    }
    
    if (context.suggestions && context.suggestions.length > 0) {
      console.log('Suggestions:', context.suggestions);
    }
    
    console.groupEnd();
  }

  /**
   * Add an error to the error history
   * @param error The error to add
   * @param context The error context
   */
  private addToErrorHistory(error: CopilotError, context: ErrorContext): void {
    this.errorHistory.unshift({ error, context });
    
    // Trim history to max size
    if (this.errorHistory.length > this.config.maxErrorsStored!) {
      this.errorHistory = this.errorHistory.slice(0, this.config.maxErrorsStored!);
    }
  }

  /**
   * Call registered error handlers for a specific category
   * @param error The error object
   * @param severity The error severity
   * @param category The error category
   * @param context The error context
   */
  private callErrorHandlers(
    error: CopilotError,
    severity: ErrorSeverity,
    category: ErrorCategory,
    context: ErrorContext
  ): void {
    // Get handlers for this category
    const handlers = this.errorHandlers.get(category) || [];
    
    // Also get general handlers
    const generalHandlers = this.errorHandlers.get(ErrorCategory.UNKNOWN) || [];
    
    // Call all applicable handlers
    [...handlers, ...generalHandlers].forEach(handler => {
      try {
        handler(error, severity, category, context);
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
      }
    });

    this.emit(ErrorEvents.ERROR_HANDLED, { error, severity, category, context });
  }

  /**
   * Attempt to recover from an error using registered recovery strategies
   * @param error The error to recover from
   * @param context The error context
   */
  private async attemptErrorRecovery(error: CopilotError, context: ErrorContext): Promise<void> {
    // Get strategies for this category
    const categoryStrategies = this.recoveryStrategies.get(error.category) || [];
    
    // Also get general strategies
    const generalStrategies = this.recoveryStrategies.get(ErrorCategory.UNKNOWN) || [];
    
    // Try all applicable strategies in order
    for (const strategy of [...categoryStrategies, ...generalStrategies]) {
      try {
        const recovered = await strategy(error, context);
        if (recovered) {
          this.emit(ErrorEvents.ERROR_RECOVERED, { error, context, strategy });
          return;
        }
      } catch (strategyError) {
        console.error('Error in recovery strategy:', strategyError);
      }
    }
  }

  /**
   * Report an error to the configured error reporting endpoint
   * @param error The error to report
   * @param context The error context
   */
  private async reportError(error: CopilotError, context: ErrorContext): Promise<void> {
    if (!this.config.errorReportingEndpoint) return;
    
    try {
      const response = await fetch(this.config.errorReportingEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            message: error.message,
            category: error.category,
            severity: error.severity,
            id: error.id,
          },
          context: {
            ...context,
            // Sanitize potentially sensitive data
            metadata: context.metadata ? this.sanitizeMetadata(context.metadata) : undefined
          },
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        console.error('Failed to report error:', await response.text());
      }
    } catch (reportingError) {
      console.error('Error reporting failed:', reportingError);
    }
  }

  /**
   * Remove potentially sensitive data from error metadata
   * @param metadata The metadata to sanitize
   */
  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized = { ...metadata };
    
    // Remove common sensitive fields
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credentials'];
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Create a new error with the given parameters
   * @param message Error message
   * @param category Error category
   * @param severity Error severity
   * @param context Additional context
   */
  createError(
    message: string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    context: Partial<ErrorContext> = {}
  ): CopilotError {
    return new CopilotError(message, category, severity, context);
  }

  /**
   * Throw a new error with the given parameters
   * @param message Error message
   * @param category Error category
   * @param severity Error severity
   * @param context Additional context
   */
  throwError(
    message: string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    context: Partial<ErrorContext> = {}
  ): never {
    throw this.createError(message, category, severity, context);
  }

  /**
   * Get the error history
   * @param limit Maximum number of errors to return (default: all)
   * @param category Optional category filter
   * @param minSeverity Optional minimum severity filter
   */
  getErrorHistory(
    limit?: number,
    category?: ErrorCategory,
    minSeverity?: ErrorSeverity
  ): Array<{error: CopilotError, context: ErrorContext}> {
    let filteredHistory = this.errorHistory;
    
    // Apply category filter
    if (category) {
      filteredHistory = filteredHistory.filter(item => item.error.category === category);
    }
    
    // Apply severity filter
    if (minSeverity) {
      const severityLevels = Object.values(ErrorSeverity);
      const minIndex = severityLevels.indexOf(minSeverity);
      
      filteredHistory = filteredHistory.filter(item => {
        const currentIndex = severityLevels.indexOf(item.error.severity);
        return currentIndex >= minIndex;
      });
    }
    
    // Apply limit
    if (limit && limit > 0) {
      filteredHistory = filteredHistory.slice(0, limit);
    }
    
    return filteredHistory;
  }

  /**
   * Clear the error history
   * @param category Optional category to clear (default: all)
   */
  clearErrorHistory(category?: ErrorCategory): void {
    if (category) {
      this.errorHistory = this.errorHistory.filter(
        item => item.error.category !== category
      );
    } else {
      this.errorHistory = [];
    }
  }
}

// Export singleton instance
export const errorHandling = ErrorHandlingSystem.getInstance();
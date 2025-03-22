import { BaseModule, Module, ModuleConfig, ModuleState } from './ModuleSystem';
import { EventBus } from '../utils/EventBus';
import { ErrorHandlingSystem, ErrorCategory, ErrorSeverity } from '../utils/ErrorHandling';
import { LoggingSystem, LogCategory, LogLevel } from '../utils/LoggingSystem';
import { CommonEvents } from '../utils/CommonEvents';

/**
 * Core module configuration
 */
export interface CoreModuleConfig extends ModuleConfig {
  logging: {
    level: LogLevel;
    enableConsole: boolean;
    enableFileOutput: boolean;
    enableEventBusLogging: boolean;
    logPath?: string;
    maxFileSize?: number;
    maxFiles?: number;
  };
  errorHandling: {
    captureUncaughtExceptions: boolean;
    captureRejectedPromises: boolean;
    logErrors: boolean;
    minSeverityToReport: ErrorSeverity;
  };
  eventBus: {
    enableLogging: boolean;
    bufferSize: number;
    retainHistory: boolean;
  };
}

/**
 * Core module for system-wide services
 * This module integrates error handling, logging, and event bus systems
 * and provides a unified interface for core functionality
 */
export class CoreModule extends BaseModule {
  // Use protected to match BaseModule's field visibility
  protected errorHandling: ErrorHandlingSystem;
  protected logging: LoggingSystem;
  protected readonly moduleConfig: CoreModuleConfig;

  /**
   * Create a new core module
   * @param config Module configuration
   */
  constructor(config: CoreModuleConfig) {
    super(config);
    
    this.moduleConfig = config;
    this.eventBus = EventBus.getInstance();
    this.errorHandling = ErrorHandlingSystem.getInstance();
    this.logging = LoggingSystem.getInstance();
  }

  /**
   * Initialize the core module
   */
  protected async onInitialize(): Promise<void> {
    // Configure logging system
    this.logging.configure({
      defaultLevel: this.moduleConfig.logging.level,
      includeTimestamps: true,
      bufferSize: this.moduleConfig.eventBus.bufferSize,
      emitEvents: this.moduleConfig.logging.enableEventBusLogging,
      includeStackTraces: true,
      transports: {
        console: {
          enabled: this.moduleConfig.logging.enableConsole,
          minLevel: this.moduleConfig.logging.level
        },
        memory: {
          enabled: true,
          minLevel: LogLevel.TRACE
        }
      }
    });

    // Configure error handling system
    this.errorHandling.configure({
      captureUncaughtExceptions: this.moduleConfig.errorHandling.captureUncaughtExceptions,
      captureRejectedPromises: this.moduleConfig.errorHandling.captureRejectedPromises,
      logToConsole: this.moduleConfig.errorHandling.logErrors,
      minSeverityToReport: this.moduleConfig.errorHandling.minSeverityToReport,
      enableStackTraces: true,
      autoReportErrors: false,
      maxErrorsStored: 100
    });

    // Configure event bus
    this.eventBus.configure({
      enableLogging: this.moduleConfig.eventBus.enableLogging,
      bufferSize: this.moduleConfig.eventBus.bufferSize,
      defaultPriority: 50,
      maxListeners: 50
    });

    // Set up cross-system integrations

    // Connect error handling to event bus
    this.errorHandling.on('error_occurred', (event) => {
      this.eventBus.publish(CommonEvents.SYSTEM_ERROR, event);
    });

    // Connect logging to error handling for error level logs
    const memoryTransport = this.logging.getTransport('memory');
    if (memoryTransport) {
      this.eventBus.subscribe(CommonEvents.SYSTEM_ERROR, (event) => {
        this.logging.error(
          `System error: ${event.data.error.message}`,
          event.data.error,
          this.mapErrorCategoryToLogCategory(event.data.error.category),
          { correlationId: event.metadata.correlationId }
        );
      });
    }

    this.logMessage(LogLevel.INFO, `Core module initialized. LogLevel: ${LogLevel[this.moduleConfig.logging.level]}`);
  }

  /**
   * Map error categories to log categories
   */
  private mapErrorCategoryToLogCategory(category: ErrorCategory): LogCategory {
    const mapping: Record<ErrorCategory, LogCategory> = {
      [ErrorCategory.COMPONENT]: LogCategory.COMPONENT,
      [ErrorCategory.STATE]: LogCategory.STATE,
      [ErrorCategory.LLM]: LogCategory.LLM,
      [ErrorCategory.NETWORK]: LogCategory.NETWORK,
      [ErrorCategory.VALIDATION]: LogCategory.SYSTEM,
      [ErrorCategory.PLUGIN]: LogCategory.PLUGIN,
      [ErrorCategory.CODE_EXECUTION]: LogCategory.CODE,
      [ErrorCategory.SECURITY]: LogCategory.SECURITY,
      [ErrorCategory.PERFORMANCE]: LogCategory.PERFORMANCE,
      [ErrorCategory.SYSTEM]: LogCategory.SYSTEM,
      [ErrorCategory.UNKNOWN]: LogCategory.SYSTEM
    };
    
    return mapping[category] || LogCategory.SYSTEM;
  }

  /**
   * Start the core module
   */
  protected async onStart(): Promise<void> {
    this.logMessage(LogLevel.INFO, 'Core module started');
    
    // Publish system initialized event
    this.eventBus.publish(CommonEvents.SYSTEM_INITIALIZED, {
      timestamp: Date.now(),
      moduleId: this.config.id,
      config: {
        logLevel: LogLevel[this.moduleConfig.logging.level],
        errorHandling: this.moduleConfig.errorHandling.captureUncaughtExceptions ? 'enabled' : 'disabled',
        eventLogging: this.moduleConfig.eventBus.enableLogging ? 'enabled' : 'disabled'
      }
    });
  }

  /**
   * Stop the core module
   */
  protected async onStop(): Promise<void> {
    this.logMessage(LogLevel.INFO, 'Core module stopping');
    
    // Clear any resources if needed
    if (!this.moduleConfig.eventBus.retainHistory) {
      this.eventBus.reset();
    }
  }

  /**
   * Dispose of the core module
   */
  protected async onDispose(): Promise<void> {
    this.logMessage(LogLevel.INFO, 'Core module disposing');
    
    // Clear all remaining resources
    this.eventBus.reset();
  }

  /**
   * Handle config updates
   * @param config Updated configuration
   */
  protected onConfigUpdate(config: Record<string, any>): void {
    if (config.logging) {
      const loggingConfig = config.logging as CoreModuleConfig['logging'];
      
      this.logging.configure({
        defaultLevel: loggingConfig.level,
        transports: {
          console: {
            enabled: loggingConfig.enableConsole,
            minLevel: loggingConfig.level
          }
        }
      });
      
      this.logMessage(LogLevel.INFO, `Logging configuration updated. Level: ${LogLevel[loggingConfig.level]}`);
    }
    
    if (config.errorHandling) {
      const errorConfig = config.errorHandling as CoreModuleConfig['errorHandling'];
      
      this.errorHandling.configure({
        captureUncaughtExceptions: errorConfig.captureUncaughtExceptions,
        captureRejectedPromises: errorConfig.captureRejectedPromises,
        logToConsole: errorConfig.logErrors,
        minSeverityToReport: errorConfig.minSeverityToReport
      });
      
      this.logMessage(LogLevel.INFO, 'Error handling configuration updated');
    }
    
    if (config.eventBus) {
      const eventConfig = config.eventBus as CoreModuleConfig['eventBus'];
      
      this.eventBus.configure({
        enableLogging: eventConfig.enableLogging,
        bufferSize: eventConfig.bufferSize
      });
      
      this.logMessage(LogLevel.INFO, 'Event bus configuration updated');
    }
  }

  /**
   * Get the event bus instance
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }

  /**
   * Get the error handling system instance
   */
  getErrorHandling(): ErrorHandlingSystem {
    return this.errorHandling;
  }

  /**
   * Get the logging system instance
   */
  getLogging(): LoggingSystem {
    return this.logging;
  }

  /**
   * Log a message at the specified level
   * @param level Log level
   * @param message Message to log
   * @param data Optional data to include
   * @param category Optional log category
   */
  logMessage(level: LogLevel, message: string, data?: any, category?: LogCategory): void {
    this.logging.log(level, message, data, category);
  }

  /**
   * Handle an error through the error handling system
   * @param error The error to handle
   * @param severity The error severity
   * @param category The error category
   */
  handleError(error: Error, severity: ErrorSeverity = ErrorSeverity.ERROR, category: ErrorCategory = ErrorCategory.SYSTEM): void {
    this.errorHandling.handleError(error, severity, category);
  }

  /**
   * Publish an event through the event bus
   * @param eventType Event type
   * @param data Event data
   */
  publishEvent(eventType: string, data: any): void {
    this.eventBus.publish(eventType, data);
  }
}

/**
 * Create a default core module
 */
export function createCoreModule(): CoreModule {
  return new CoreModule({
    id: 'core',
    name: 'Core System',
    version: '1.0.0',
    autoStart: true,
    logging: {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFileOutput: false,
      enableEventBusLogging: true
    },
    errorHandling: {
      captureUncaughtExceptions: true,
      captureRejectedPromises: true,
      logErrors: true,
      minSeverityToReport: ErrorSeverity.ERROR
    },
    eventBus: {
      enableLogging: false,
      bufferSize: 100,
      retainHistory: true
    }
  });
}
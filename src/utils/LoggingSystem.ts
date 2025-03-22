import { EventBus } from './EventBus';
import { CommonEvents } from './CommonEvents';
import { errorHandling, ErrorCategory, ErrorSeverity } from './ErrorHandling';

/**
 * Log levels for categorizing log messages
 */
export enum LogLevel {
  TRACE = 0,   // Fine-grained debug information
  DEBUG = 1,   // Detailed information for debugging
  INFO = 2,    // Informational messages highlighting progress
  WARN = 3,    // Potentially harmful situations
  ERROR = 4,   // Error events that might still allow the application to continue
  FATAL = 5,   // Severe error events that lead to application termination
  OFF = 6      // Turn off logging
}

/**
 * Common log categories to organize logs
 */
export enum LogCategory {
  SYSTEM = 'system',
  COMPONENT = 'component',
  LLM = 'llm',
  STATE = 'state',
  UI = 'ui',
  NETWORK = 'network',
  PLUGIN = 'plugin',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  USER = 'user',
  CODE = 'code',
  AUTONOMOUS = 'autonomous'
}

/**
 * Metadata for log entries
 */
export interface LogMetadata {
  timestamp: number;
  level: LogLevel;
  category: LogCategory | string;
  tags?: string[];
  source?: string;
  correlationId?: string;
  [key: string]: any;
}

/**
 * Complete log entry structure
 */
export interface LogEntry {
  message: string;
  data?: any;
  metadata: LogMetadata;
  formattedMessage?: string;
}

/**
 * Custom formatter function type
 */
export type LogFormatter = (entry: LogEntry) => string;

/**
 * Log transport configuration
 */
export interface LogTransportConfig {
  enabled: boolean;
  minLevel: LogLevel;
  formatter?: LogFormatter;
  filter?: (entry: LogEntry) => boolean;
}

/**
 * Log transport interface
 */
export interface LogTransport {
  name: string;
  log(entry: LogEntry): void;
  updateConfig(config: Partial<LogTransportConfig>): void;
  getConfig(): LogTransportConfig;
}

/**
 * Configuration for the logging system
 */
export interface LoggingConfig {
  defaultLevel: LogLevel;
  defaultCategory: LogCategory | string;
  includeTimestamps: boolean;
  bufferSize: number;
  emitEvents: boolean;
  includeStackTraces: boolean;
  defaultSource: string;
  transports: Record<string, LogTransportConfig>;
}

/**
 * Default config values
 */
const DEFAULT_CONFIG: LoggingConfig = {
  defaultLevel: LogLevel.INFO,
  defaultCategory: LogCategory.SYSTEM,
  includeTimestamps: true,
  bufferSize: 1000,
  emitEvents: true,
  includeStackTraces: true,
  defaultSource: 'app',
  transports: {
    console: {
      enabled: true,
      minLevel: LogLevel.INFO
    },
    memory: {
      enabled: true,
      minLevel: LogLevel.TRACE
    }
  }
};

/**
 * Map log levels to console methods
 */
type ConsoleMethodName = 'debug' | 'info' | 'warn' | 'error';

const CONSOLE_METHODS: Record<LogLevel, ConsoleMethodName> = {
  [LogLevel.TRACE]: 'debug',
  [LogLevel.DEBUG]: 'debug',
  [LogLevel.INFO]: 'info',
  [LogLevel.WARN]: 'warn',
  [LogLevel.ERROR]: 'error',
  [LogLevel.FATAL]: 'error',
  [LogLevel.OFF]: 'info'
};

/**
 * Map log levels to CSS styles for console output
 */
const LOG_LEVEL_STYLES: Record<LogLevel, string> = {
  [LogLevel.TRACE]: 'color: #999999',
  [LogLevel.DEBUG]: 'color: #6c757d',
  [LogLevel.INFO]: 'color: #0dcaf0',
  [LogLevel.WARN]: 'color: #ffc107',
  [LogLevel.ERROR]: 'color: #dc3545',
  [LogLevel.FATAL]: 'color: #dc3545; font-weight: bold',
  [LogLevel.OFF]: ''
};

/**
 * Console transport
 */
class ConsoleTransport implements LogTransport {
  name = 'console';
  private config: LogTransportConfig;

  constructor(config: Partial<LogTransportConfig> = {}) {
    this.config = {
      enabled: true,
      minLevel: LogLevel.INFO,
      ...config,
      formatter: config.formatter || this.defaultFormatter.bind(this)
    };
  }

  defaultFormatter(entry: LogEntry): string {
    const { level, category, timestamp } = entry.metadata;
    
    let prefix = '';
    
    // Add timestamp if available
    if (timestamp) {
      const date = new Date(timestamp);
      prefix += `[${date.toISOString()}] `;
    }
    
    // Add level and category
    prefix += `[${LogLevel[level]}] [${category}] `;
    
    return prefix + entry.message;
  }

  log(entry: LogEntry): void {
    if (!this.config.enabled || entry.metadata.level < this.config.minLevel) {
      return;
    }
    
    // Apply filter if present
    if (this.config.filter && !this.config.filter(entry)) {
      return;
    }
    
    const formatter = this.config.formatter || this.defaultFormatter;
    const formattedMessage = formatter(entry);
    
    const consoleMethod = CONSOLE_METHODS[entry.metadata.level];
    const style = LOG_LEVEL_STYLES[entry.metadata.level];
    
    // Format: [Level] [Category] Message
    if (entry.data) {
      console[consoleMethod](`%c${formattedMessage}`, style, entry.data);
    } else {
      console[consoleMethod](`%c${formattedMessage}`, style);
    }
  }

  updateConfig(config: Partial<LogTransportConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): LogTransportConfig {
    return { ...this.config };
  }
}

/**
 * Memory transport that keeps logs in an array
 */
class MemoryTransport implements LogTransport {
  name = 'memory';
  private config: LogTransportConfig;
  private buffer: LogEntry[] = [];
  private bufferSize: number;

  constructor(config: Partial<LogTransportConfig> = {}, bufferSize = 1000) {
    this.config = {
      enabled: true,
      minLevel: LogLevel.TRACE,
      ...config
    };
    this.bufferSize = bufferSize;
  }

  log(entry: LogEntry): void {
    if (!this.config.enabled || entry.metadata.level < this.config.minLevel) {
      return;
    }
    
    // Apply filter if present
    if (this.config.filter && !this.config.filter(entry)) {
      return;
    }
    
    this.buffer.unshift(entry);
    
    // Trim buffer if needed
    if (this.buffer.length > this.bufferSize) {
      this.buffer = this.buffer.slice(0, this.bufferSize);
    }
  }

  updateConfig(config: Partial<LogTransportConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): LogTransportConfig {
    return { ...this.config };
  }

  /**
   * Get logs from the buffer
   * @param limit Maximum number of logs to retrieve
   * @param minLevel Minimum log level
   * @param category Optional category filter
   */
  getLogs(
    limit?: number,
    minLevel?: LogLevel,
    category?: LogCategory | string
  ): LogEntry[] {
    let filteredLogs = this.buffer;
    
    // Filter by level
    if (minLevel !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.metadata.level >= minLevel);
    }
    
    // Filter by category
    if (category) {
      filteredLogs = filteredLogs.filter(log => log.metadata.category === category);
    }
    
    // Apply limit
    if (limit && limit > 0) {
      filteredLogs = filteredLogs.slice(0, limit);
    }
    
    return filteredLogs;
  }

  /**
   * Clear logs from the buffer
   * @param category Optional category to clear
   */
  clearLogs(category?: LogCategory | string): void {
    if (category) {
      this.buffer = this.buffer.filter(log => log.metadata.category !== category);
    } else {
      this.buffer = [];
    }
  }

  /**
   * Set buffer size
   * @param size New buffer size
   */
  setBufferSize(size: number): void {
    this.bufferSize = size;
    if (this.buffer.length > size) {
      this.buffer = this.buffer.slice(0, size);
    }
  }

  /**
   * Get current buffer size
   */
  getBufferSize(): number {
    return this.bufferSize;
  }

  /**
   * Get current buffer length
   */
  getBufferLength(): number {
    return this.buffer.length;
  }
}

/**
 * Core logging system for React Copilot
 * Provides structured logging with multiple transports and log levels
 */
export class LoggingSystem {
  private static instance: LoggingSystem;
  private config: LoggingConfig;
  private transports: Map<string, LogTransport> = new Map();
  private eventBus: EventBus;
  private errorHandling: typeof errorHandling;

  /**
   * Get the singleton instance of the logging system
   */
  public static getInstance(): LoggingSystem {
    if (!LoggingSystem.instance) {
      LoggingSystem.instance = new LoggingSystem();
    }
    return LoggingSystem.instance;
  }

  /**
   * Create a new logging system
   */
  private constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.eventBus = EventBus.getInstance();
    this.errorHandling = errorHandling;
    
    // Set up default transports
    this.initializeTransports();
  }

  /**
   * Initialize default transports
   */
  private initializeTransports(): void {
    // Add console transport
    const consoleTransport = new ConsoleTransport(this.config.transports.console);
    this.transports.set('console', consoleTransport);
    
    // Add memory transport
    const memoryTransport = new MemoryTransport(
      this.config.transports.memory,
      this.config.bufferSize
    );
    this.transports.set('memory', memoryTransport);
  }

  /**
   * Configure the logging system
   * @param config Configuration options
   */
  configure(config: Partial<LoggingConfig>): void {
    this.config = { 
      ...this.config, 
      ...config,
      // Merge transports separately
      transports: {
        ...this.config.transports,
        ...config.transports
      }
    };
    
    // Update existing transports with new config
    if (config.transports) {
      Object.entries(config.transports).forEach(([name, transportConfig]) => {
        const transport = this.transports.get(name);
        if (transport) {
          transport.updateConfig(transportConfig);
        }
      });
    }
    
    // Update memory transport buffer size if changed
    if (config.bufferSize !== undefined) {
      const memoryTransport = this.transports.get('memory') as MemoryTransport;
      if (memoryTransport) {
        memoryTransport.setBufferSize(config.bufferSize);
      }
    }
  }

  /**
   * Add a custom transport
   * @param transport The transport to add
   */
  addTransport(transport: LogTransport): void {
    this.transports.set(transport.name, transport);
  }

  /**
   * Remove a transport
   * @param name The name of the transport to remove
   */
  removeTransport(name: string): boolean {
    return this.transports.delete(name);
  }

  /**
   * Get a transport by name
   * @param name The name of the transport
   */
  getTransport(name: string): LogTransport | undefined {
    return this.transports.get(name);
  }

  /**
   * Create a log entry with full metadata
   * @param level Log level
   * @param message Log message
   * @param data Additional data
   * @param category Log category
   * @param metadata Additional metadata
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: any,
    category?: LogCategory | string,
    metadata: Partial<LogMetadata> = {}
  ): LogEntry {
    // Create complete metadata
    const fullMetadata: LogMetadata = {
      timestamp: Date.now(),
      level,
      category: category || this.config.defaultCategory,
      source: this.config.defaultSource,
      ...metadata
    };
    
    // Create log entry
    const entry: LogEntry = {
      message,
      data,
      metadata: fullMetadata
    };
    
    // Add stack trace for errors if enabled
    if (
      this.config.includeStackTraces && 
      (level === LogLevel.ERROR || level === LogLevel.FATAL)
    ) {
      const stack = new Error().stack;
      if (stack) {
        entry.metadata.stackTrace = stack
          .split('\n')
          .slice(3) // Remove the error constructor and logging system calls
          .join('\n');
      }
    }
    
    return entry;
  }

  /**
   * Log a message with the specified level
   * @param level Log level
   * @param message Log message
   * @param data Additional data
   * @param category Log category
   * @param metadata Additional metadata
   */
  log(
    level: LogLevel,
    message: string,
    data?: any,
    category?: LogCategory | string,
    metadata?: Partial<LogMetadata>
  ): LogEntry {
    // Don't log if level is OFF
    if (level === LogLevel.OFF) {
      return {
        message,
        data,
        metadata: {
          timestamp: Date.now(),
          level: LogLevel.OFF,
          category: category || this.config.defaultCategory
        }
      };
    }
    
    const entry = this.createLogEntry(level, message, data, category, metadata);
    
    // Send to all enabled transports
    this.transports.forEach(transport => {
      transport.log(entry);
    });
    
    // Emit event if enabled
    if (this.config.emitEvents) {
      this.eventBus.publish(`log:${LogLevel[level].toLowerCase()}`, entry);
    }
    
    return entry;
  }

  /**
   * Log a trace message
   * @param message Log message
   * @param data Additional data
   * @param category Log category
   * @param metadata Additional metadata
   */
  trace(
    message: string,
    data?: any,
    category?: LogCategory | string,
    metadata?: Partial<LogMetadata>
  ): LogEntry {
    return this.log(LogLevel.TRACE, message, data, category, metadata);
  }

  /**
   * Log a debug message
   * @param message Log message
   * @param data Additional data
   * @param category Log category
   * @param metadata Additional metadata
   */
  debug(
    message: string,
    data?: any,
    category?: LogCategory | string,
    metadata?: Partial<LogMetadata>
  ): LogEntry {
    return this.log(LogLevel.DEBUG, message, data, category, metadata);
  }

  /**
   * Log an info message
   * @param message Log message
   * @param data Additional data
   * @param category Log category
   * @param metadata Additional metadata
   */
  info(
    message: string,
    data?: any,
    category?: LogCategory | string,
    metadata?: Partial<LogMetadata>
  ): LogEntry {
    return this.log(LogLevel.INFO, message, data, category, metadata);
  }

  /**
   * Log a warning message
   * @param message Log message
   * @param data Additional data
   * @param category Log category
   * @param metadata Additional metadata
   */
  warn(
    message: string,
    data?: any,
    category?: LogCategory | string,
    metadata?: Partial<LogMetadata>
  ): LogEntry {
    return this.log(LogLevel.WARN, message, data, category, metadata);
  }

  /**
   * Log an error message
   * @param message Log message
   * @param error Error object
   * @param category Log category
   * @param metadata Additional metadata
   */
  error(
    message: string,
    error?: Error | any,
    category?: LogCategory | string,
    metadata?: Partial<LogMetadata>
  ): LogEntry {
    // Forward to error handling system
    if (error instanceof Error) {
      const errorCategory = this.mapLogCategoryToErrorCategory(category);
      this.errorHandling.handleError(
        error,
        ErrorSeverity.ERROR,
        errorCategory,
        {
          message,
          metadata: metadata || {}
        }
      );
    }
    
    return this.log(LogLevel.ERROR, message, error, category, metadata);
  }

  /**
   * Log a fatal error message
   * @param message Log message
   * @param error Error object
   * @param category Log category
   * @param metadata Additional metadata
   */
  fatal(
    message: string,
    error?: Error | any,
    category?: LogCategory | string,
    metadata?: Partial<LogMetadata>
  ): LogEntry {
    // Forward to error handling system as CRITICAL
    if (error instanceof Error) {
      const errorCategory = this.mapLogCategoryToErrorCategory(category);
      this.errorHandling.handleError(
        error,
        ErrorSeverity.CRITICAL,
        errorCategory,
        {
          message,
          metadata: metadata || {}
        }
      );
    }
    
    return this.log(LogLevel.FATAL, message, error, category, metadata);
  }

  /**
   * Map log category to error category
   * @param category Log category
   */
  private mapLogCategoryToErrorCategory(
    category?: LogCategory | string
  ): ErrorCategory {
    if (!category) {
      return ErrorCategory.UNKNOWN;
    }
    
    // Direct mappings between LogCategory and ErrorCategory
    const mappings: Record<string, ErrorCategory> = {
      [LogCategory.COMPONENT]: ErrorCategory.COMPONENT,
      [LogCategory.LLM]: ErrorCategory.LLM,
      [LogCategory.STATE]: ErrorCategory.STATE,
      [LogCategory.NETWORK]: ErrorCategory.NETWORK,
      [LogCategory.PLUGIN]: ErrorCategory.PLUGIN,
      [LogCategory.SECURITY]: ErrorCategory.SECURITY,
      [LogCategory.SYSTEM]: ErrorCategory.SYSTEM,
      [LogCategory.CODE]: ErrorCategory.CODE_EXECUTION,
      [LogCategory.PERFORMANCE]: ErrorCategory.PERFORMANCE
    };
    
    return mappings[category] || ErrorCategory.UNKNOWN;
  }

  /**
   * Create a child logger with pre-set category and optional metadata
   * @param category Category for the child logger
   * @param defaultMetadata Default metadata to include with all logs
   */
  getChildLogger(
    category: LogCategory | string,
    defaultMetadata: Partial<LogMetadata> = {}
  ): LoggerInterface {
    return new ChildLogger(this, category, defaultMetadata);
  }

  /**
   * Get logs from the memory transport
   * @param limit Maximum number of logs to retrieve
   * @param minLevel Minimum log level
   * @param category Optional category filter
   */
  getLogs(
    limit?: number,
    minLevel?: LogLevel,
    category?: LogCategory | string
  ): LogEntry[] {
    const memoryTransport = this.transports.get('memory') as MemoryTransport;
    if (memoryTransport) {
      return memoryTransport.getLogs(limit, minLevel, category);
    }
    return [];
  }

  /**
   * Clear logs from memory
   * @param category Optional category to clear
   */
  clearLogs(category?: LogCategory | string): void {
    const memoryTransport = this.transports.get('memory') as MemoryTransport;
    if (memoryTransport) {
      memoryTransport.clearLogs(category);
    }
  }

  /**
   * Mark the start of an operation for tracking
   * @param operationId ID for the operation
   * @param message Description of the operation
   * @param category Log category
   */
  startOperation(
    operationId: string,
    message: string,
    category?: LogCategory | string
  ): void {
    this.debug(
      `Operation started: ${message}`,
      null,
      category,
      {
        operationId,
        operationStart: Date.now()
      }
    );
  }

  /**
   * Mark the end of an operation and log its duration
   * @param operationId ID for the operation
   * @param message Description of the operation result
   * @param category Log category
   */
  endOperation(
    operationId: string,
    message: string,
    category?: LogCategory | string
  ): void {
    const memoryTransport = this.transports.get('memory') as MemoryTransport;
    if (!memoryTransport) return;
    
    const startLog = memoryTransport.getLogs()
      .find(log => 
        log.metadata.operationId === operationId && 
        log.metadata.operationStart !== undefined
      );
    
    if (startLog) {
      const duration = Date.now() - startLog.metadata.operationStart;
      this.debug(
        `Operation completed (${duration}ms): ${message}`,
        null,
        category,
        {
          operationId,
          operationDuration: duration
        }
      );
    } else {
      this.debug(
        `Operation completed (duration unknown): ${message}`,
        null,
        category,
        { operationId }
      );
    }
  }

  /**
   * Create a group of logs in the console
   * @param name Group name
   * @param expanded Whether the group should be expanded by default
   */
  startGroup(name: string, expanded = false): void {
    if (expanded) {
      console.group(name);
    } else {
      console.groupCollapsed(name);
    }
  }

  /**
   * End a console log group
   */
  endGroup(): void {
    console.groupEnd();
  }
}

/**
 * Interface for logger methods
 */
export interface LoggerInterface {
  trace(message: string, data?: any, metadata?: Partial<LogMetadata>): LogEntry;
  debug(message: string, data?: any, metadata?: Partial<LogMetadata>): LogEntry;
  info(message: string, data?: any, metadata?: Partial<LogMetadata>): LogEntry;
  warn(message: string, data?: any, metadata?: Partial<LogMetadata>): LogEntry;
  error(message: string, error?: Error | any, metadata?: Partial<LogMetadata>): LogEntry;
  fatal(message: string, error?: Error | any, metadata?: Partial<LogMetadata>): LogEntry;
}

/**
 * Child logger with a fixed category
 */
class ChildLogger implements LoggerInterface {
  private parent: LoggingSystem;
  private category: LogCategory | string;
  private defaultMetadata: Partial<LogMetadata>;

  constructor(
    parent: LoggingSystem,
    category: LogCategory | string,
    defaultMetadata: Partial<LogMetadata> = {}
  ) {
    this.parent = parent;
    this.category = category;
    this.defaultMetadata = defaultMetadata;
  }

  trace(message: string, data?: any, metadata?: Partial<LogMetadata>): LogEntry {
    return this.parent.trace(
      message, 
      data, 
      this.category, 
      { ...this.defaultMetadata, ...metadata }
    );
  }

  debug(message: string, data?: any, metadata?: Partial<LogMetadata>): LogEntry {
    return this.parent.debug(
      message, 
      data, 
      this.category, 
      { ...this.defaultMetadata, ...metadata }
    );
  }

  info(message: string, data?: any, metadata?: Partial<LogMetadata>): LogEntry {
    return this.parent.info(
      message, 
      data, 
      this.category, 
      { ...this.defaultMetadata, ...metadata }
    );
  }

  warn(message: string, data?: any, metadata?: Partial<LogMetadata>): LogEntry {
    return this.parent.warn(
      message, 
      data, 
      this.category, 
      { ...this.defaultMetadata, ...metadata }
    );
  }

  error(message: string, error?: Error | any, metadata?: Partial<LogMetadata>): LogEntry {
    return this.parent.error(
      message, 
      error, 
      this.category, 
      { ...this.defaultMetadata, ...metadata }
    );
  }

  fatal(message: string, error?: Error | any, metadata?: Partial<LogMetadata>): LogEntry {
    return this.parent.fatal(
      message, 
      error, 
      this.category, 
      { ...this.defaultMetadata, ...metadata }
    );
  }

  /**
   * Create a context-bound logger for specific operations
   * @param context Additional context to add to all logs
   */
  withContext(context: Record<string, any>): LoggerInterface {
    return new ChildLogger(
      this.parent,
      this.category,
      { ...this.defaultMetadata, ...context }
    );
  }
}

// Export singleton instance
export const logger = LoggingSystem.getInstance();
import { Module, ModuleConfig, ModuleManager } from './ModuleSystem';
import { EventBus } from '../utils/EventBus';
import { CommonEvents } from '../utils/CommonEvents';
import { LoggingSystem, LogCategory, LogLevel } from '../utils/LoggingSystem';
import { ErrorHandlingSystem, ErrorCategory, ErrorSeverity } from '../utils/ErrorHandling';
import { CoreModule, createCoreModule } from './CoreModule';

/**
 * Registry of all application modules
 * Provides central access to module capabilities and ensures proper initialization
 */
export class ModuleRegistry {
  private static instance: ModuleRegistry;
  private moduleManager: ModuleManager;
  private coreModule: CoreModule;
  private initialized = false;
  private startupPromise: Promise<void> | null = null;
  private logger = LoggingSystem.getInstance().getChildLogger(LogCategory.SYSTEM, {
    component: 'ModuleRegistry'
  });

  /**
   * Get the singleton instance
   */
  public static getInstance(): ModuleRegistry {
    if (!ModuleRegistry.instance) {
      ModuleRegistry.instance = new ModuleRegistry();
    }
    return ModuleRegistry.instance;
  }

  /**
   * Create a new module registry
   */
  private constructor() {
    this.moduleManager = ModuleManager.getInstance();
    this.coreModule = createCoreModule();
    
    // Register the core module
    this.moduleManager.registerModule(this.coreModule);
  }

  /**
   * Initialize the module registry
   * This bootstraps the entire system
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    if (this.startupPromise) {
      return this.startupPromise;
    }
    
    this.startupPromise = this.initializeInternal();
    return this.startupPromise;
  }
  
  /**
   * Internal initialization logic
   */
  private async initializeInternal(): Promise<void> {
    try {
      this.logger.info('Initializing module registry');
      
      // Initialize the module manager
      await this.moduleManager.initialize();
      
      // Start all modules
      await this.moduleManager.startAllModules();
      
      // Mark as initialized
      this.initialized = true;
      
      // Get event bus from core module
      const eventBus = this.coreModule.getEventBus();
      
      // Notify system is ready
      eventBus.publish(CommonEvents.SYSTEM_READY, {
        timestamp: Date.now(),
        modules: this.moduleManager.getModuleOrder()
      });
      
      this.logger.info('Module registry initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize module registry', error);
      
      // Get error handling from core module
      const errorHandling = this.coreModule.getErrorHandling();
      
      // Handle the error
      errorHandling.handleError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.CRITICAL,
        ErrorCategory.SYSTEM,
        {
          message: 'Module registry initialization failed',
          location: 'ModuleRegistry.initialize'
        }
      );
      
      throw error;
    } finally {
      this.startupPromise = null;
    }
  }
  
  /**
   * Register a module with the system
   * @param module The module to register
   */
  registerModule(module: Module): void {
    if (this.initialized) {
      throw new Error('Cannot register modules after initialization');
    }
    
    this.moduleManager.registerModule(module);
    this.logger.info(`Registered module: ${module.getMetadata().id}`);
  }
  
  /**
   * Get a module by ID
   * @param moduleId The ID of the module to get
   */
  getModule<T extends Module>(moduleId: string): T | undefined {
    return this.moduleManager.getModule<T>(moduleId);
  }
  
  /**
   * Get the core module
   */
  getCoreModule(): CoreModule {
    return this.coreModule;
  }
  
  /**
   * Shutdown the module registry
   * This properly stops and disposes all modules
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }
    
    try {
      this.logger.info('Shutting down module registry');
      
      // Get event bus from core module
      const eventBus = this.coreModule.getEventBus();
      
      // Notify system is shutting down
      eventBus.publish(CommonEvents.SYSTEM_SHUTDOWN, {
        timestamp: Date.now()
      });
      
      // Stop all modules
      await this.moduleManager.stopAllModules();
      
      // Dispose all modules
      await this.moduleManager.disposeAllModules();
      
      this.initialized = false;
      
      this.logger.info('Module registry shutdown complete');
    } catch (error) {
      this.logger.error('Error during module registry shutdown', error);
      
      // Get error handling from core module
      const errorHandling = this.coreModule.getErrorHandling();
      
      // Handle the error
      errorHandling.handleError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.ERROR,
        ErrorCategory.SYSTEM,
        {
          message: 'Module registry shutdown failed',
          location: 'ModuleRegistry.shutdown'
        }
      );
      
      throw error;
    }
  }
  
  /**
   * Check if the module registry is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Get all registered modules
   */
  getAllModules(): Map<string, Module> {
    return this.moduleManager.getAllModules();
  }
  
  /**
   * Get the module initialization order
   */
  getModuleOrder(): string[] {
    return this.moduleManager.getModuleOrder();
  }
}

/**
 * Global access to the module registry
 */
export const moduleRegistry = ModuleRegistry.getInstance();
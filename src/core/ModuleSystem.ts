import { EventBus } from '../utils/EventBus';
import { CommonEvents } from '../utils/CommonEvents';
import { errorHandling, ErrorCategory, ErrorSeverity } from '../utils/ErrorHandling';
import { logger, LogCategory, LogLevel, LoggerInterface } from '../utils/LoggingSystem';

/**
 * Module lifecycle states
 */
export enum ModuleState {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  ACTIVE = 'active',
  ERROR = 'error',
  DISPOSING = 'disposing',
  DISPOSED = 'disposed'
}

/**
 * Module dependency declaration
 */
export interface ModuleDependency {
  id: string;              // ID of the required module
  required: boolean;       // Whether the dependency is required
  version?: string;        // Optional version requirement
}

/**
 * Module configuration options
 */
export interface ModuleConfig {
  id: string;               // Unique identifier
  name: string;             // Display name
  version: string;          // Semantic version
  dependencies?: ModuleDependency[]; // Dependencies on other modules
  autoStart?: boolean;      // Whether to automatically start the module
  [key: string]: any;       // Additional module-specific configuration
}

/**
 * Module interface that all modules must implement
 */
export interface Module {
  /**
   * Get module metadata
   */
  getMetadata(): ModuleConfig;
  
  /**
   * Get current module state
   */
  getState(): ModuleState;
  
  /**
   * Initialize the module
   * @param dependencies Map of dependency modules
   */
  initialize(dependencies?: Map<string, Module>): Promise<void>;
  
  /**
   * Start the module
   */
  start(): Promise<void>;
  
  /**
   * Stop the module
   */
  stop(): Promise<void>;
  
  /**
   * Check if the module is ready
   */
  isReady(): boolean;
  
  /**
   * Dispose of the module
   */
  dispose(): Promise<void>;
  
  /**
   * Get module configuration
   */
  getConfig(): Record<string, any>;
  
  /**
   * Update module configuration
   * @param config New configuration values
   */
  updateConfig(config: Record<string, any>): void;
  
  /**
   * Handle an error that occurred in the module
   * @param error The error that occurred
   */
  handleError(error: Error): void;
}

/**
 * Base module implementation with common functionality
 */
export abstract class BaseModule implements Module {
  protected config: ModuleConfig;
  protected state: ModuleState = ModuleState.UNINITIALIZED;
  protected dependencies: Map<string, Module> = new Map();
  protected eventBus: EventBus;
  protected log: LoggerInterface;
  
  /**
   * Create a new module
   * @param config Module configuration
   */
  constructor(config: ModuleConfig) {
    this.config = {
      autoStart: true,
      ...config,
      dependencies: config.dependencies || []
    };
    
    this.eventBus = EventBus.getInstance();
    this.log = logger.getChildLogger(LogCategory.SYSTEM, {
      module: this.config.id,
      version: this.config.version
    });
  }
  
  /**
   * Get module metadata
   */
  getMetadata(): ModuleConfig {
    return { ...this.config };
  }
  
  /**
   * Get current module state
   */
  getState(): ModuleState {
    return this.state;
  }
  
  /**
   * Initialize the module with dependencies
   * @param dependencies Map of dependency modules
   */
  async initialize(dependencies?: Map<string, Module>): Promise<void> {
    if (this.state !== ModuleState.UNINITIALIZED) {
      throw new Error(`Cannot initialize module ${this.config.id} in state ${this.state}`);
    }
    
    this.state = ModuleState.INITIALIZING;
    
    try {
      // Store dependencies
      if (dependencies) {
        // Check that all required dependencies are provided
        for (const dep of this.config.dependencies || []) {
          if (dep.required && !dependencies.has(dep.id)) {
            throw new Error(`Required dependency ${dep.id} not provided for module ${this.config.id}`);
          }
          
          if (dependencies.has(dep.id)) {
            this.dependencies.set(dep.id, dependencies.get(dep.id)!);
          }
        }
      }
      
      // Initialize the module
      await this.onInitialize();
      
      // Set to active state if autoStart is true
      if (this.config.autoStart) {
        await this.start();
      }
      
      this.log.info(`Module initialized: ${this.config.id} v${this.config.version}`);
      
      // Emit event
      this.eventBus.publish(`module:${this.config.id}:initialized`, {
        moduleId: this.config.id,
        version: this.config.version,
        dependencies: Array.from(this.dependencies.keys())
      });
    } catch (error) {
      this.state = ModuleState.ERROR;
      this.log.error(`Failed to initialize module: ${this.config.id}`, error);
      this.handleError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
  
  /**
   * Module-specific initialization logic
   */
  protected abstract onInitialize(): Promise<void>;
  
  /**
   * Start the module
   */
  async start(): Promise<void> {
    if (this.state === ModuleState.ACTIVE) {
      return;
    }
    
    if (this.state !== ModuleState.INITIALIZING && this.state !== ModuleState.ERROR) {
      throw new Error(`Cannot start module ${this.config.id} in state ${this.state}`);
    }
    
    try {
      await this.onStart();
      this.state = ModuleState.ACTIVE;
      
      this.log.info(`Module started: ${this.config.id}`);
      
      // Emit event
      this.eventBus.publish(`module:${this.config.id}:started`, {
        moduleId: this.config.id,
        version: this.config.version
      });
    } catch (error) {
      this.state = ModuleState.ERROR;
      this.log.error(`Failed to start module: ${this.config.id}`, error);
      this.handleError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
  
  /**
   * Module-specific start logic
   */
  protected abstract onStart(): Promise<void>;
  
  /**
   * Stop the module
   */
  async stop(): Promise<void> {
    if (this.state !== ModuleState.ACTIVE) {
      return;
    }
    
    try {
      await this.onStop();
      this.state = ModuleState.INITIALIZING;
      
      this.log.info(`Module stopped: ${this.config.id}`);
      
      // Emit event
      this.eventBus.publish(`module:${this.config.id}:stopped`, {
        moduleId: this.config.id,
        version: this.config.version
      });
    } catch (error) {
      this.state = ModuleState.ERROR;
      this.log.error(`Failed to stop module: ${this.config.id}`, error);
      this.handleError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
  
  /**
   * Module-specific stop logic
   */
  protected abstract onStop(): Promise<void>;
  
  /**
   * Check if the module is ready
   */
  isReady(): boolean {
    return this.state === ModuleState.ACTIVE;
  }
  
  /**
   * Dispose of the module
   */
  async dispose(): Promise<void> {
    if (this.state === ModuleState.DISPOSED) {
      return;
    }
    
    // Check if active before changing state
    const wasActive = this.state === ModuleState.ACTIVE;
    
    this.state = ModuleState.DISPOSING;
    
    try {
      // Stop first if it was running
      if (wasActive) {
        await this.stop();
      }
      
      await this.onDispose();
      this.state = ModuleState.DISPOSED;
      
      this.log.info(`Module disposed: ${this.config.id}`);
      
      // Emit event
      this.eventBus.publish(`module:${this.config.id}:disposed`, {
        moduleId: this.config.id,
        version: this.config.version
      });
      
      // Clear dependencies
      this.dependencies.clear();
    } catch (error) {
      this.state = ModuleState.ERROR;
      this.log.error(`Failed to dispose module: ${this.config.id}`, error);
      this.handleError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
  
  /**
   * Module-specific disposal logic
   */
  protected abstract onDispose(): Promise<void>;
  
  /**
   * Get module configuration
   */
  getConfig(): Record<string, any> {
    // Filter out internal config values
    const { id, name, version, dependencies, autoStart, ...rest } = this.config;
    return { ...rest };
  }
  
  /**
   * Update module configuration
   * @param config New configuration values
   */
  updateConfig(config: Record<string, any>): void {
    // Don't allow changing id, name, version, or dependencies
    const { id, name, version, dependencies, ...rest } = config;
    
    // Update config
    this.config = {
      ...this.config,
      ...rest
    };
    
    // Call module-specific config update
    this.onConfigUpdate(rest);
    
    // Emit event
    this.eventBus.publish(`module:${this.config.id}:config_updated`, {
      moduleId: this.config.id,
      config: rest
    });
  }
  
  /**
   * Module-specific config update logic
   * @param config Updated config values
   */
  protected abstract onConfigUpdate(config: Record<string, any>): void;
  
  /**
   * Handle an error that occurred in the module
   * @param error The error that occurred
   */
  handleError(error: Error): void {
    errorHandling.handleError(
      error,
      ErrorSeverity.ERROR,
      ErrorCategory.SYSTEM,
      {
        message: `Error in module ${this.config.id}`,
        componentId: this.config.id,
        metadata: {
          moduleId: this.config.id,
          moduleName: this.config.name,
          moduleVersion: this.config.version,
          moduleState: this.state
        }
      }
    );
  }
  
  /**
   * Get a dependency module
   * @param id ID of the dependency module
   */
  protected getDependency<T extends Module>(id: string): T {
    const dep = this.dependencies.get(id);
    if (!dep) {
      throw new Error(`Dependency ${id} not found for module ${this.config.id}`);
    }
    return dep as T;
  }
}

/**
 * Module manager events
 */
export enum ModuleManagerEvents {
  MODULE_REGISTERED = 'module_manager:module_registered',
  MODULE_UNREGISTERED = 'module_manager:module_unregistered',
  MODULE_INITIALIZED = 'module_manager:module_initialized',
  MODULE_STARTED = 'module_manager:module_started',
  MODULE_STOPPED = 'module_manager:module_stopped',
  MODULE_ERROR = 'module_manager:module_error',
  MODULE_DEPENDENCY_ERROR = 'module_manager:module_dependency_error',
  ALL_MODULES_STARTED = 'module_manager:all_modules_started'
}

/**
 * Manager for module lifecycle and dependencies
 */
export class ModuleManager {
  private static instance: ModuleManager;
  private modules: Map<string, Module> = new Map();
  private moduleOrder: string[] = [];
  private eventBus: EventBus;
  private log: LoggerInterface;
  private initialized = false;
  private starting = false;
  private stopping = false;

  /**
   * Get the singleton instance of the module manager
   */
  public static getInstance(): ModuleManager {
    if (!ModuleManager.instance) {
      ModuleManager.instance = new ModuleManager();
    }
    return ModuleManager.instance;
  }

  /**
   * Create a new module manager
   */
  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.log = logger.getChildLogger(LogCategory.SYSTEM, { 
      component: 'ModuleManager'
    });
    
    // Listen for module errors
    this.eventBus.subscribe('module:*:error', (event) => {
      this.eventBus.publish(ModuleManagerEvents.MODULE_ERROR, event.data);
    });
  }

  /**
   * Register a module with the manager
   * @param module The module to register
   */
  registerModule(module: Module): void {
    const metadata = module.getMetadata();
    
    if (this.modules.has(metadata.id)) {
      throw new Error(`Module with ID ${metadata.id} is already registered`);
    }
    
    this.modules.set(metadata.id, module);
    this.log.info(`Module registered: ${metadata.id} v${metadata.version}`);
    
    // Add to module order (will be sorted during initialization)
    this.moduleOrder.push(metadata.id);
    
    // Emit event
    this.eventBus.publish(ModuleManagerEvents.MODULE_REGISTERED, {
      moduleId: metadata.id,
      moduleName: metadata.name,
      moduleVersion: metadata.version
    });
  }

  /**
   * Unregister a module from the manager
   * @param moduleId The ID of the module to unregister
   */
  unregisterModule(moduleId: string): void {
    if (!this.modules.has(moduleId)) {
      return;
    }
    
    // Check if any other modules depend on this one
    const dependentModules = this.findDependentModules(moduleId);
    if (dependentModules.length > 0) {
      throw new Error(
        `Cannot unregister module ${moduleId} because it is required by: ${dependentModules.join(', ')}`
      );
    }
    
    // Remove from modules map
    this.modules.delete(moduleId);
    
    // Remove from module order
    this.moduleOrder = this.moduleOrder.filter(id => id !== moduleId);
    
    this.log.info(`Module unregistered: ${moduleId}`);
    
    // Emit event
    this.eventBus.publish(ModuleManagerEvents.MODULE_UNREGISTERED, {
      moduleId
    });
  }

  /**
   * Find modules that depend on a specific module
   * @param moduleId ID of the module to check for dependent modules
   */
  private findDependentModules(moduleId: string): string[] {
    const dependentModules: string[] = [];
    
    for (const [id, module] of this.modules.entries()) {
      const metadata = module.getMetadata();
      
      if (metadata.dependencies?.some(dep => dep.id === moduleId)) {
        dependentModules.push(id);
      }
    }
    
    return dependentModules;
  }

  /**
   * Sort modules by dependency order
   */
  private sortModules(): void {
    // Build dependency graph
    const graph = new Map<string, Set<string>>();
    
    // Initialize graph with all modules
    for (const moduleId of this.modules.keys()) {
      graph.set(moduleId, new Set());
    }
    
    // Add dependencies
    for (const [moduleId, module] of this.modules.entries()) {
      const metadata = module.getMetadata();
      
      for (const dep of metadata.dependencies || []) {
        if (this.modules.has(dep.id)) {
          graph.get(moduleId)!.add(dep.id);
        }
      }
    }
    
    // Topological sort
    const visited = new Set<string>();
    const temp = new Set<string>();
    const order: string[] = [];
    
    const visit = (moduleId: string) => {
      if (temp.has(moduleId)) {
        throw new Error(`Circular dependency detected involving module: ${moduleId}`);
      }
      
      if (visited.has(moduleId)) {
        return;
      }
      
      temp.add(moduleId);
      
      const dependencies = graph.get(moduleId) || new Set();
      for (const depId of dependencies) {
        visit(depId);
      }
      
      temp.delete(moduleId);
      visited.add(moduleId);
      order.push(moduleId);
    };
    
    // Visit all modules
    for (const moduleId of this.modules.keys()) {
      if (!visited.has(moduleId)) {
        visit(moduleId);
      }
    }
    
    // Reverse to get correct order (dependencies first)
    this.moduleOrder = order.reverse();
  }

  /**
   * Initialize all registered modules
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    this.log.info('Initializing modules...');
    
    try {
      // Sort modules by dependency order
      this.sortModules();
      
      // Initialize modules in dependency order
      for (const moduleId of this.moduleOrder) {
        const module = this.modules.get(moduleId)!;
        const dependencies = this.getDependenciesForModule(moduleId);
        
        this.log.debug(`Initializing module: ${moduleId}`);
        await module.initialize(dependencies);
      }
      
      this.initialized = true;
      this.log.info(`All modules initialized (${this.modules.size} modules)`);
    } catch (error) {
      this.log.error('Failed to initialize modules', error);
      errorHandling.handleError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.CRITICAL,
        ErrorCategory.SYSTEM,
        {
          message: 'Failed to initialize modules',
          metadata: {
            moduleCount: this.modules.size,
            currentModuleOrder: this.moduleOrder
          }
        }
      );
      throw error;
    }
  }

  /**
   * Get dependencies for a specific module
   * @param moduleId ID of the module
   */
  private getDependenciesForModule(moduleId: string): Map<string, Module> {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not registered`);
    }
    
    const dependencies = new Map<string, Module>();
    const metadata = module.getMetadata();
    
    for (const dep of metadata.dependencies || []) {
      const depModule = this.modules.get(dep.id);
      
      if (!depModule && dep.required) {
        throw new Error(`Required dependency ${dep.id} not found for module ${moduleId}`);
      }
      
      if (depModule) {
        dependencies.set(dep.id, depModule);
      }
    }
    
    return dependencies;
  }

  /**
   * Start all modules
   */
  async startAllModules(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    if (this.starting) {
      return;
    }
    
    this.starting = true;
    this.log.info('Starting all modules...');
    
    try {
      // Start modules in dependency order
      for (const moduleId of this.moduleOrder) {
        const module = this.modules.get(moduleId)!;
        
        if (module.getState() !== ModuleState.ACTIVE) {
          this.log.debug(`Starting module: ${moduleId}`);
          await module.start();
        }
      }
      
      this.log.info(`All modules started (${this.modules.size} modules)`);
      
      // Emit all modules started event
      this.eventBus.publish(ModuleManagerEvents.ALL_MODULES_STARTED, {
        moduleCount: this.modules.size,
        modules: this.moduleOrder
      });
    } catch (error) {
      this.log.error('Failed to start modules', error);
      errorHandling.handleError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.ERROR,
        ErrorCategory.SYSTEM,
        {
          message: 'Failed to start modules',
          metadata: {
            moduleCount: this.modules.size
          }
        }
      );
      throw error;
    } finally {
      this.starting = false;
    }
  }

  /**
   * Stop all modules
   */
  async stopAllModules(): Promise<void> {
    if (!this.initialized || this.stopping) {
      return;
    }
    
    this.stopping = true;
    this.log.info('Stopping all modules...');
    
    try {
      // Stop modules in reverse dependency order
      for (const moduleId of [...this.moduleOrder].reverse()) {
        const module = this.modules.get(moduleId)!;
        
        if (module.getState() === ModuleState.ACTIVE) {
          this.log.debug(`Stopping module: ${moduleId}`);
          await module.stop();
        }
      }
      
      this.log.info('All modules stopped');
    } catch (error) {
      this.log.error('Failed to stop modules', error);
      errorHandling.handleError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.ERROR,
        ErrorCategory.SYSTEM,
        {
          message: 'Failed to stop modules'
        }
      );
      throw error;
    } finally {
      this.stopping = false;
    }
  }

  /**
   * Dispose of all modules
   */
  async disposeAllModules(): Promise<void> {
    if (!this.initialized) {
      return;
    }
    
    try {
      // Stop all modules first
      await this.stopAllModules();
      
      // Dispose modules in reverse dependency order
      for (const moduleId of [...this.moduleOrder].reverse()) {
        const module = this.modules.get(moduleId)!;
        
        this.log.debug(`Disposing module: ${moduleId}`);
        await module.dispose();
      }
      
      // Clear module lists
      this.moduleOrder = [];
      this.modules.clear();
      this.initialized = false;
      
      this.log.info('All modules disposed');
    } catch (error) {
      this.log.error('Failed to dispose modules', error);
      errorHandling.handleError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.ERROR,
        ErrorCategory.SYSTEM,
        {
          message: 'Failed to dispose modules'
        }
      );
      throw error;
    }
  }

  /**
   * Get a specific module by ID
   * @param moduleId ID of the module to get
   */
  getModule<T extends Module>(moduleId: string): T | undefined {
    return this.modules.get(moduleId) as T | undefined;
  }

  /**
   * Check if a module is registered
   * @param moduleId ID of the module to check
   */
  hasModule(moduleId: string): boolean {
    return this.modules.has(moduleId);
  }

  /**
   * Get all registered modules
   */
  getAllModules(): Map<string, Module> {
    return new Map(this.modules);
  }

  /**
   * Get module order
   */
  getModuleOrder(): string[] {
    return [...this.moduleOrder];
  }

  /**
   * Check if all modules are ready
   */
  areAllModulesReady(): boolean {
    if (!this.initialized) {
      return false;
    }
    
    for (const module of this.modules.values()) {
      if (!module.isReady()) {
        return false;
      }
    }
    
    return true;
  }
}

// Export singleton instance
export const moduleManager = ModuleManager.getInstance();
import { Plugin, PluginContext, ModifiableComponent, CodeChangeResult } from '../../utils/types';

/**
 * Manager for handling plugin registration, initialization, and lifecycle
 */
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private context: PluginContext;
  
  /**
   * Create a new PluginManager
   * @param llmManager The LLM manager instance
   * @param componentRegistry The component registry instance
   * @param getState Function to access application state
   */
  constructor(
    // These parameters are used to initialize context
    llmManager: any,
    componentRegistry: any,
    private getState: () => any = () => ({})
  ) {
    this.context = {
      // Required properties from PluginContext interface
      getComponent: (id: string) => componentRegistry?.getComponent?.(id) || null,
      getAllComponents: () => componentRegistry?.getAllComponents?.() || {},
      getRelationships: (id: string) => componentRegistry?.getComponentRelationships?.(id) || {
        childrenIds: [], siblingIds: [], dependsOn: [], dependedOnBy: [], sharedStateKeys: []
      },
      addMessage: (message: { type: string; content: string; level?: 'info' | 'warning' | 'error' }) => {
        console.log(`Plugin message [${message.level || 'info'}]: ${message.content}`);
      },
      setMetadata: (componentId: string, key: string, value: any) => {
        const component = componentRegistry?.getComponent?.(componentId);
        if (component) {
          if (!component.metadata) component.metadata = {};
          component.metadata[key] = value;
          componentRegistry?.updateComponent?.(componentId, { metadata: component.metadata });
        }
      },
      getMetadata: (componentId: string, key: string) => {
        const component = componentRegistry?.getComponent?.(componentId);
        return component?.metadata?.[key];
      },
      
      // Legacy properties for tests
      getState: this.getState,
      llmManager,
      componentRegistry
    };
  }
  
  /**
   * Register a plugin with the manager
   * @param plugin The plugin to register
   */
  registerPlugin(plugin: Plugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin with ID ${plugin.id} is already registered. Overwriting.`);
    }
    
    this.plugins.set(plugin.id, plugin);
    console.log(`Registered plugin: ${plugin.name} (${plugin.id})`);
  }
  
  /**
   * Initialize a specific plugin
   * @param pluginId The ID of the plugin to initialize
   */
  async initializePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin with ID ${pluginId} not found`);
    }
    
    try {
      if (plugin.initialize) {
        await plugin.initialize(this.context);
        console.log(`Initialized plugin: ${plugin.name}`);
      } else {
        console.log(`Plugin ${plugin.name} has no initialize method`);
      }
    } catch (error) {
      console.error(`Error initializing plugin ${plugin.name}:`, error);
      throw error;
    }
  }
  
  /**
   * Initialize all registered plugins
   */
  async initializeAllPlugins(): Promise<void> {
    const initPromises = Array.from(this.plugins.values()).map(plugin => 
      this.initializePlugin(plugin.id).catch(err => {
        console.error(`Failed to initialize plugin ${plugin.name}:`, err);
        return Promise.resolve(); // Continue with other plugins even if one fails
      })
    );
    
    await Promise.all(initPromises);
    console.log('All plugins initialized');
  }
  
  /**
   * Get a plugin by ID
   * @param pluginId The ID of the plugin to get
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }
  
  /**
   * Get all registered plugins
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }
  
  /**
   * Set a new state accessor function
   * @param getState Function to access application state
   */
  setStateAccessor(getState: () => any): void {
    this.getState = getState;
    // Update the context with the new getState function
    this.context.getState = this.getState;
  }
  
  /**
   * Apply plugin hooks to component registration
   * @param component The component being registered
   * @returns Potentially modified component
   */
  applyHooksToComponentRegistration(component: ModifiableComponent): ModifiableComponent {
    let modifiedComponent = { ...component };
    
    // Apply component registration hooks (with backward compatibility)
    for (const plugin of this.plugins.values()) {
      // Use either the new name or the legacy name for backward compatibility
      const beforeRegisterHook = plugin.hooks?.beforeComponentRegister ||
                               plugin.hooks?.beforeComponentRegistration;
      
      if (beforeRegisterHook) {
        modifiedComponent = beforeRegisterHook(modifiedComponent);
      }
    }
    
    // Return the potentially modified component
    return modifiedComponent;
  }
  
  /**
   * Notify plugins after component registration
   * @param component The registered component
   */
  notifyComponentRegistered(component: ModifiableComponent): void {
    // Apply after component registration hooks (with backward compatibility)
    for (const plugin of this.plugins.values()) {
      // Use either the new name or the legacy name for backward compatibility
      const afterRegisterHook = plugin.hooks?.afterComponentRegister ||
                              plugin.hooks?.afterComponentRegistration;
                              
      if (afterRegisterHook) {
        afterRegisterHook(component);
      }
    }
  }
  
  /**
   * Apply plugin hooks to code before execution
   * @param code The code to be executed
   * @returns Potentially modified code
   */
  applyHooksBeforeCodeExecution(code: string): string {
    let modifiedCode = code;
    
    // Apply beforeCodeExecution hooks
    for (const plugin of this.plugins.values()) {
      if (plugin.hooks?.beforeCodeExecution) {
        modifiedCode = plugin.hooks.beforeCodeExecution(modifiedCode);
      }
    }
    
    return modifiedCode;
  }
  
  /**
   * Notify plugins after code execution
   * @param result The result of the code execution
   */
  notifyCodeExecuted(result: CodeChangeResult): void {
    // Apply afterCodeExecution hooks
    for (const plugin of this.plugins.values()) {
      if (plugin.hooks?.afterCodeExecution) {
        plugin.hooks.afterCodeExecution(result);
      }
    }
  }
  
  /**
   * Apply plugin hooks to LLM prompt before sending
   * @param prompt The prompt to be sent to the LLM
   * @returns Potentially modified prompt
   */
  applyHooksBeforeLLMRequest(prompt: string): string {
    let modifiedPrompt = prompt;
    
    // Apply beforeLLMRequest hooks
    for (const plugin of this.plugins.values()) {
      if (plugin.hooks?.beforeLLMRequest) {
        modifiedPrompt = plugin.hooks.beforeLLMRequest(modifiedPrompt);
      }
    }
    
    return modifiedPrompt;
  }
  
  /**
   * Apply plugin hooks to LLM response after receiving
   * @param response The response from the LLM
   * @returns Potentially modified response
   */
  applyHooksAfterLLMResponse(response: string): string {
    let modifiedResponse = response;
    
    // Apply afterLLMResponse hooks
    for (const plugin of this.plugins.values()) {
      if (plugin.hooks?.afterLLMResponse) {
        modifiedResponse = plugin.hooks.afterLLMResponse(modifiedResponse);
      }
    }
    
    return modifiedResponse;
  }
  
  /**
   * Destroy all plugins and clean up resources
   */
  async destroyAllPlugins(): Promise<void> {
    const destroyPromises = Array.from(this.plugins.values()).map(plugin => {
      if (plugin.destroy) {
        const result = plugin.destroy();
        if (result instanceof Promise) {
          return result.catch((err: Error) => {
            console.error(`Error destroying plugin ${plugin.name}:`, err);
            return Promise.resolve(); // Continue with other plugins even if one fails
          });
        }
      }
      return Promise.resolve(); // Return resolved promise for plugins without destroy method
    });
    
    await Promise.all(destroyPromises);
    console.log('All plugins destroyed');
    
    // Clear plugins map
    this.plugins.clear();
  }
}
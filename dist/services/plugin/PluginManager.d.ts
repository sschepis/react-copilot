import { Plugin, ModifiableComponent, CodeChangeResult } from '../../utils/types';
/**
 * Manager for handling plugin registration, initialization, and lifecycle
 */
export declare class PluginManager {
    private getState;
    private plugins;
    private context;
    /**
     * Create a new PluginManager
     * @param llmManager The LLM manager instance
     * @param componentRegistry The component registry instance
     * @param getState Function to access application state
     */
    constructor(llmManager: any, componentRegistry: any, getState?: () => any);
    /**
     * Register a plugin with the manager
     * @param plugin The plugin to register
     */
    registerPlugin(plugin: Plugin): void;
    /**
     * Initialize a specific plugin
     * @param pluginId The ID of the plugin to initialize
     */
    initializePlugin(pluginId: string): Promise<void>;
    /**
     * Initialize all registered plugins
     */
    initializeAllPlugins(): Promise<void>;
    /**
     * Get a plugin by ID
     * @param pluginId The ID of the plugin to get
     */
    getPlugin(pluginId: string): Plugin | undefined;
    /**
     * Get all registered plugins
     */
    getAllPlugins(): Plugin[];
    /**
     * Set a new state accessor function
     * @param getState Function to access application state
     */
    setStateAccessor(getState: () => any): void;
    /**
     * Apply plugin hooks to component registration
     * @param component The component being registered
     * @returns Potentially modified component
     */
    applyHooksToComponentRegistration(component: ModifiableComponent): ModifiableComponent;
    /**
     * Notify plugins after component registration
     * @param component The registered component
     */
    notifyComponentRegistered(component: ModifiableComponent): void;
    /**
     * Apply plugin hooks to code before execution
     * @param code The code to be executed
     * @returns Potentially modified code
     */
    applyHooksBeforeCodeExecution(code: string): string;
    /**
     * Notify plugins after code execution
     * @param result The result of the code execution
     */
    notifyCodeExecuted(result: CodeChangeResult): void;
    /**
     * Apply plugin hooks to LLM prompt before sending
     * @param prompt The prompt to be sent to the LLM
     * @returns Potentially modified prompt
     */
    applyHooksBeforeLLMRequest(prompt: string): string;
    /**
     * Apply plugin hooks to LLM response after receiving
     * @param response The response from the LLM
     * @returns Potentially modified response
     */
    applyHooksAfterLLMResponse(response: string): string;
    /**
     * Destroy all plugins and clean up resources
     */
    destroyAllPlugins(): Promise<void>;
}

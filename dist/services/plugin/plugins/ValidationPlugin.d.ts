import { Plugin, PluginHooks, PluginContext } from '../../../utils/types';
/**
 * Validation rule for checking component code
 */
export interface ValidationRule {
    id: string;
    description: string;
    test: (code: string) => boolean;
    errorMessage: string;
}
/**
 * Example plugin that validates component code before execution
 * This plugin demonstrates how to create a plugin for the React Copilot system
 */
export declare class ValidationPlugin implements Plugin {
    id: string;
    name: string;
    version: string;
    private config;
    /**
     * Plugin hooks implementation
     */
    hooks: PluginHooks;
    /**
     * Create a new ValidationPlugin
     * @param config Optional configuration
     */
    constructor(config?: Partial<ValidationPlugin['config']>);
    /**
     * Initialize the plugin with context
     * @param context The plugin context
     */
    initialize(_context: PluginContext): Promise<void>;
    /**
     * Clean up plugin resources
     */
    destroy(): Promise<void>;
    /**
     * Validate code against rules
     * @param code The code to validate
     * @returns Array of rule violations
     */
    private validateCode;
    /**
     * Add a custom validation rule
     * @param rule The rule to add
     */
    addRule(rule: ValidationRule): void;
    /**
     * Remove a validation rule by ID
     * @param ruleId The ID of the rule to remove
     * @returns True if the rule was removed
     */
    removeRule(ruleId: string): boolean;
    /**
     * Set strict mode
     * @param enabled Whether strict mode is enabled
     */
    setStrictMode(enabled: boolean): void;
    /**
     * Set maximum file size
     * @param sizeInBytes Maximum file size in bytes
     */
    setMaxFileSize(sizeInBytes: number): void;
}

/**
 * Centralized exports for all plugins
 */
declare class BasePlugin {
    id: string;
    name: string;
    version: string;
    constructor(options?: any);
}
export declare class ValidationPlugin extends BasePlugin {
    constructor(options?: any);
}
export declare class AnalyticsPlugin extends BasePlugin {
    constructor(options?: any);
}
export declare class PerformancePlugin extends BasePlugin {
    constructor(options?: any);
}
export declare class AccessibilityPlugin extends BasePlugin {
    constructor(options?: any);
}
export declare class DocumentationPlugin extends BasePlugin {
    constructor(options?: any);
}
export declare class ThemePlugin extends BasePlugin {
    constructor(options?: any);
}
export declare class InternationalizationPlugin extends BasePlugin {
    constructor(options?: any);
}
export type { ValidationRule } from './ValidationPlugin';
export type { AnalyticsEvent, AnalyticsPluginOptions } from './AnalyticsPlugin';
export type { ComponentPerformanceData, PerformancePluginOptions } from './PerformancePlugin';
export type { AccessibilityRule, AccessibilityPluginOptions } from './AccessibilityPlugin';
export type { DocumentationPluginOptions } from './DocumentationPlugin';
export type { ThemeConfig, ThemePluginOptions, ThemeContextType } from './ThemePlugin';
export type { InternationalizationPluginOptions } from './InternationalizationPlugin';
export declare const pluginRegistry: {
    'validation-plugin': typeof ValidationPlugin;
    'analytics-plugin': typeof AnalyticsPlugin;
    'performance-plugin': typeof PerformancePlugin;
    'accessibility-plugin': typeof AccessibilityPlugin;
    'documentation-plugin': typeof DocumentationPlugin;
    'theme-plugin': typeof ThemePlugin;
    'i18n-plugin': typeof InternationalizationPlugin;
};
/**
 * Helper function to initialize multiple plugins
 * @param pluginManager The plugin manager instance
 * @param plugins Object containing plugin instances to initialize
 * @returns Promise resolving when all plugins are initialized
 */
export declare function initializePlugins(pluginManager: any, plugins: Record<string, any>): Promise<void>;
/**
 * Create a standard set of plugins
 * @param options Configuration options for each plugin
 * @returns Object containing initialized plugin instances
 */
export declare function createStandardPlugins(options?: {
    validation?: any;
    analytics?: any;
    performance?: any;
    accessibility?: any;
    documentation?: any;
    theme?: any;
    i18n?: any;
}): Record<string, any>;

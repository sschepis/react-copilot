import { Plugin, PluginHooks, PluginContext } from '../../../utils/types';
/**
 * Analytics event with metadata
 */
export interface AnalyticsEvent {
    type: string;
    timestamp: number;
    data: Record<string, any>;
}
/**
 * Options for configuring the analytics plugin
 */
export interface AnalyticsPluginOptions {
    /** Whether to enable analytics collection */
    enabled?: boolean;
    /** Whether to batch events before sending */
    batchEvents?: boolean;
    /** Batch size for sending events */
    batchSize?: number;
    /** URL of the analytics endpoint */
    endpointUrl?: string;
    /** Custom headers to include with analytics requests */
    headers?: Record<string, string>;
    /** Whether to include component source code in analytics */
    includeSourceCode?: boolean;
    /** Callback for processing events before sending */
    processEvent?: (event: AnalyticsEvent) => AnalyticsEvent;
}
/**
 * Plugin for tracking analytics about component creation and code execution
 */
export declare class AnalyticsPlugin implements Plugin {
    id: string;
    name: string;
    version: string;
    private options;
    private events;
    private _context;
    /**
     * Plugin hooks implementation
     */
    hooks: PluginHooks;
    /**
     * Create a new AnalyticsPlugin
     * @param options Plugin configuration options
     */
    constructor(options?: AnalyticsPluginOptions);
    /**
     * Initialize the plugin with context
     * @param context The plugin context
     */
    initialize(context: PluginContext): Promise<void>;
    /**
     * Clean up plugin resources
     */
    destroy(): Promise<void>;
    /**
     * Track an analytics event
     * @param type The type of event
     * @param data Additional event data
     */
    trackEvent(type: string, data?: Record<string, any>): void;
    /**
     * Send collected events to the analytics endpoint
     */
    sendEvents(): Promise<void>;
    /**
     * Enable or disable analytics collection
     * @param enabled Whether analytics should be enabled
     */
    setEnabled(enabled: boolean): void;
    /**
     * Configure the analytics endpoint
     * @param url The endpoint URL
     * @param headers Optional custom headers
     */
    setEndpoint(url: string, headers?: Record<string, string>): void;
}

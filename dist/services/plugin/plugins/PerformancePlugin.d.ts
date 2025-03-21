import { Plugin, PluginHooks, PluginContext, PerformanceProfile } from '../../../utils/types';
/**
 * Performance data for a component
 */
export interface ComponentPerformanceData {
    componentId: string;
    componentName: string;
    renderCount: number;
    renderTimes: number[];
    lastRenderTime: number;
    averageRenderTime: number;
    maxRenderTime: number;
    unmountCount: number;
    stateAccessMap: Record<string, number>;
    propsChanges: number;
    rerenderReasons: string[];
    memoizationEffectiveness: number;
}
/**
 * Options for configuring the performance plugin
 */
export interface PerformancePluginOptions {
    /** Whether to track component rendering performance */
    trackRenderPerformance?: boolean;
    /** Whether to track component props changes */
    trackPropsChanges?: boolean;
    /** Whether to track component state access */
    trackStateAccess?: boolean;
    /** Whether to analyze memoization effectiveness */
    analyzeMemoization?: boolean;
    /** Whether to automatically suggest performance improvements */
    suggestImprovements?: boolean;
    /** Maximum number of components to track (to limit memory usage) */
    maxTrackedComponents?: number;
    /** Threshold in ms above which to warn about slow renders */
    slowRenderThreshold?: number;
    /** Whether to inject performance monitoring code into components */
    injectMonitoring?: boolean;
}
/**
 * Plugin for monitoring component performance and suggesting optimizations
 */
export declare class PerformancePlugin implements Plugin {
    id: string;
    name: string;
    version: string;
    private options;
    private performanceData;
    private _context;
    /**
     * Plugin hooks implementation
     */
    hooks: PluginHooks;
    /**
     * Create a new PerformancePlugin
     * @param options Plugin configuration options
     */
    constructor(options?: PerformancePluginOptions);
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
     * Initialize performance tracking for a component
     * @param component The component to track
     */
    private initializeComponentTracking;
    /**
     * Record a render event for a component
     * @param componentId The ID of the component
     * @param renderTimeMs The time it took to render in milliseconds
     */
    recordRender(componentId: string, renderTimeMs: number): void;
    /**
     * Record state access for a component
     * @param componentId The ID of the component
     * @param statePath The path to the state being accessed
     */
    recordStateAccess(componentId: string, statePath: string): void;
    /**
     * Create a performance profile for a component
     * @param componentId The ID of the component
     * @returns A performance profile or null if component not found
     */
    createPerformanceProfile(componentId: string): PerformanceProfile | null;
    /**
     * Get performance data for all tracked components
     * @returns Map of component IDs to their performance data
     */
    getAllPerformanceData(): Map<string, ComponentPerformanceData>;
    /**
     * Detect common performance issues in component code
     * @param code The component code to analyze
     * @returns Array of detected issues
     */
    private detectPerformanceIssues;
    /**
     * Inject performance monitoring code into a component
     * @param code The component source code
     * @param componentId The ID of the component
     * @returns Modified code with performance monitoring
     */
    private injectPerformanceMonitoring;
    /**
     * Enable or disable the plugin
     * @param option The option to enable/disable
     * @param enabled Whether the option should be enabled
     */
    setOption(option: keyof PerformancePluginOptions, enabled: boolean): void;
}
declare global {
    interface Window {
        __PERFORMANCE_PLUGIN__?: {
            recordRender: (componentId: string, renderTimeMs: number) => void;
        };
    }
}

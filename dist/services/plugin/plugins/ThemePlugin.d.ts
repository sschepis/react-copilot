import { Plugin, PluginHooks, PluginContext } from '../../../utils/types';
/**
 * Theme configuration
 */
export interface ThemeConfig {
    /** Theme name */
    name: string;
    /** Theme mode ('light' or 'dark') */
    mode: 'light' | 'dark';
    /** Color palette */
    colors: {
        primary: string;
        secondary: string;
        background: string;
        surface: string;
        error: string;
        text: string;
        [key: string]: string;
    };
    /** Typography settings */
    typography: {
        fontFamily: string;
        headingFontFamily?: string;
        fontSize: string;
        fontWeightRegular: number;
        fontWeightMedium: number;
        fontWeightBold: number;
        h1: {
            fontSize: string;
            fontWeight: number;
            lineHeight: number;
        };
        h2: {
            fontSize: string;
            fontWeight: number;
            lineHeight: number;
        };
        h3: {
            fontSize: string;
            fontWeight: number;
            lineHeight: number;
        };
        body1: {
            fontSize: string;
            fontWeight: number;
            lineHeight: number;
        };
        body2: {
            fontSize: string;
            fontWeight: number;
            lineHeight: number;
        };
        button: {
            fontSize: string;
            fontWeight: number;
            lineHeight: number;
        };
        [key: string]: any;
    };
    /** Spacing units */
    spacing: {
        unit: string;
        baseline: number;
        [key: string]: any;
    };
    /** Border styles */
    borders: {
        radius: string;
        width: string;
        [key: string]: any;
    };
    /** Animation settings */
    animation: {
        duration: {
            short: string;
            medium: string;
            long: string;
        };
        easing: {
            easeIn: string;
            easeOut: string;
            easeInOut: string;
        };
    };
    /** Other theme properties */
    [key: string]: any;
}
/**
 * Component styling issue
 */
export interface StylingIssue {
    type: 'color' | 'typography' | 'spacing' | 'borders' | 'hardcoded';
    description: string;
    suggestedFix: string;
    code: string;
    severity: 'error' | 'warning' | 'info';
}
/**
 * Theme plugin options
 */
export interface ThemePluginOptions {
    /** Initial theme configuration */
    initialTheme?: ThemeConfig;
    /** Whether to automatically fix styling issues */
    autoFix?: boolean;
    /** Whether to enforce the design system */
    enforceDesignSystem?: boolean;
    /** Whether to support dark mode */
    supportDarkMode?: boolean;
    /** CSS-in-JS library to use */
    cssLibrary?: 'styled-components' | 'emotion' | 'none';
    /** Array of disallowed style patterns (regex) */
    disallowedPatterns?: string[];
}
/**
 * Plugin for managing theming and design system integration
 */
export declare class ThemePlugin implements Plugin {
    id: string;
    name: string;
    version: string;
    private options;
    private currentTheme;
    private themes;
    private context;
    /**
     * Plugin hooks implementation
     */
    hooks: PluginHooks;
    /**
     * Create a new ThemePlugin
     * @param options Theme plugin options
     */
    constructor(options?: ThemePluginOptions);
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
     * Create a default light theme
     * @returns Default theme configuration
     */
    private createDefaultTheme;
    /**
     * Create a dark theme variant from a light theme
     * @param lightTheme The light theme to base on
     * @returns Dark theme configuration
     */
    private createDarkTheme;
    /**
     * Check for styling issues in component code
     * @param code Component source code
     * @returns Array of styling issues
     */
    private checkStylingIssues;
    /**
     * Apply fixes for styling issues
     * @param code Original component code
     * @param issues Detected styling issues
     * @returns Fixed code
     */
    private fixStylingIssues;
    /**
     * Find the closest theme color to a hex color
     * @param hexColor Hex color string
     * @returns Theme color key or null if no close match
     */
    private findClosestThemeColor;
    /**
     * Register a new theme
     * @param theme Theme configuration to register
     */
    registerTheme(theme: ThemeConfig): void;
    /**
     * Get a registered theme by name
     * @param name Theme name
     * @returns Theme configuration or null if not found
     */
    getTheme(name: string): ThemeConfig | null;
    /**
     * Get all registered themes
     * @returns Array of theme configurations
     */
    getAllThemes(): ThemeConfig[];
    /**
     * Set the current active theme
     * @param name Name of the theme to activate
     * @returns Whether the theme was successfully activated
     */
    setTheme(name: string): boolean;
    /**
     * Get the current active theme
     * @returns Current theme configuration
     */
    getCurrentTheme(): ThemeConfig;
    /**
     * Toggle between light and dark mode
     * @returns Whether the toggle was successful
     */
    toggleDarkMode(): boolean;
    /**
     * Enable or disable design system enforcement
     * @param enabled Whether to enforce the design system
     */
    setEnforceDesignSystem(enabled: boolean): void;
}
/**
 * Context for accessing theme in components
 */
export interface ThemeContextType {
    currentTheme: ThemeConfig;
    themes: ThemeConfig[];
    setTheme: (name: string) => void;
    toggleDarkMode: () => void;
}

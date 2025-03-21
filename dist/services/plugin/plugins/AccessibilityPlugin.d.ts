import { Plugin, PluginHooks, PluginContext } from '../../../utils/types';
/**
 * Interface defining an accessibility rule
 */
export interface AccessibilityRule {
    id: string;
    description: string;
    test: (code: string) => {
        passed: boolean;
        elements?: string[];
    };
    severity: 'error' | 'warning' | 'info';
    helpUrl?: string;
    wcagCriteria?: string;
}
/**
 * Options for configuring the accessibility plugin
 */
export interface AccessibilityPluginOptions {
    /** Minimum severity level to report ('error', 'warning', 'info') */
    minSeverity?: 'error' | 'warning' | 'info';
    /** Whether to insert accessible fixes automatically when possible */
    autoFix?: boolean;
    /** Custom rules to add to the default set */
    customRules?: AccessibilityRule[];
    /** Rules to disable (by ID) */
    disabledRules?: string[];
    /** Whether to include WCAG reference information */
    includeWcagInfo?: boolean;
    /** Whether to display detailed error information */
    verboseOutput?: boolean;
}
/**
 * Access violation with details
 */
export interface AccessibilityViolation {
    ruleId: string;
    description: string;
    elements: string[];
    severity: 'error' | 'warning' | 'info';
    helpUrl?: string;
    wcagCriteria?: string;
}
/**
 * Plugin for checking React components for accessibility issues
 */
export declare class AccessibilityPlugin implements Plugin {
    id: string;
    name: string;
    version: string;
    private options;
    private rules;
    private context;
    /**
     * Plugin hooks implementation
     */
    hooks: PluginHooks;
    /**
     * Create a new AccessibilityPlugin
     * @param options Plugin configuration options
     */
    constructor(options?: AccessibilityPluginOptions);
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
     * Initialize default accessibility rules
     */
    private initializeRules;
    /**
     * Check code for accessibility issues
     * @param code Component source code to check
     * @returns Array of accessibility violations
     */
    checkAccessibility(code: string): AccessibilityViolation[];
    /**
     * Apply automatic fixes for accessibility issues
     * @param code The original code
     * @param violations The detected violations
     * @returns Fixed code with accessibility improvements
     */
    private applyAccessibilityFixes;
    /**
     * Add a custom accessibility rule
     * @param rule The rule to add
     */
    addRule(rule: AccessibilityRule): void;
    /**
     * Disable a rule by ID
     * @param ruleId The ID of the rule to disable
     * @returns Whether the rule was found and disabled
     */
    disableRule(ruleId: string): boolean;
    /**
     * Set minimum severity level
     * @param level The minimum severity level
     */
    setMinSeverity(level: 'error' | 'warning' | 'info'): void;
    /**
     * Enable or disable auto-fixing
     * @param enabled Whether auto-fixing should be enabled
     */
    setAutoFix(enabled: boolean): void;
}

import { Plugin, PluginHooks, PluginContext } from '../../utils/types';

/**
 * Enum defining the standard plugin categories
 */
export enum PluginType {
  DEVELOPMENT_TOOLS = 'development-tools',
  FRAMEWORK_ADAPTER = 'framework-adapter',
  STATE_MANAGEMENT = 'state-management',
  EXTERNAL_SERVICE = 'external-service',
  CODE_GENERATOR = 'code-generator',
  CODE_ANALYZER = 'code-analyzer',
  PERFORMANCE = 'performance',
  ACCESSIBILITY = 'accessibility',
  SECURITY = 'security',
  DOCUMENTATION = 'documentation',
  MULTI_MODAL = 'multi-modal',
  CUSTOM = 'custom'
}

/**
 * Interface for plugin configuration options
 */
export interface PluginOptions {
  /** Whether the plugin is enabled */
  enabled?: boolean;
  /** Configuration specific to the plugin */
  config?: Record<string, any>;
  /** Plugin-specific capabilities to enable */
  enabledCapabilities?: string[];
  /** Priority of the plugin (lower numbers run first) */
  priority?: number;
}

/**
 * Extended plugin interface with metadata
 */
export interface ExtendedPlugin extends Plugin {
  /** Type of the plugin */
  type: PluginType;
  /** Dependencies on other plugins (by ID) */
  dependencies?: string[];
  /** Whether the plugin is enabled */
  enabled: boolean;
  /** Icon for the plugin (for UI representation) */
  icon?: string;
  /** Plugin capabilities */
  capabilities?: string[];
  /** Plugin options */
  options?: PluginOptions;
  /** Default configuration for the plugin */
  defaultConfig?: Record<string, any>;
}

/**
 * Development tools plugin interface
 */
export interface DevelopmentToolsPlugin extends ExtendedPlugin {
  type: PluginType.DEVELOPMENT_TOOLS;
  capabilities: Array<
    | 'component-inspector'
    | 'state-inspector'
    | 'performance-analyzer'
    | 'debug-console'
    | 'network-monitor'
    | 'layout-inspector'
    | string
  >;
}

/**
 * Framework adapter plugin interface
 */
export interface FrameworkAdapterPlugin extends ExtendedPlugin {
  type: PluginType.FRAMEWORK_ADAPTER;
  framework: 'react' | 'vue' | 'angular' | 'svelte' | 'solid' | string;
  supportedVersions: string[];
  capabilities: Array<
    | 'component-detection'
    | 'lifecycle-hooks'
    | 'state-integration'
    | 'router-integration'
    | 'jsx-transformation'
    | 'template-integration'
    | string
  >;
}

/**
 * State management plugin interface
 */
export interface StateManagementPlugin extends ExtendedPlugin {
  type: PluginType.STATE_MANAGEMENT;
  stateManager: 'redux' | 'mobx' | 'zustand' | 'recoil' | 'jotai' | 'context' | string;
  capabilities: Array<
    | 'state-tracking'
    | 'state-modification'
    | 'selector-optimization'
    | 'persistence'
    | 'time-travel'
    | 'state-visualization'
    | string
  >;
  
  // State management specific hooks
  hooks: PluginHooks & {
    beforeStateChange?: (path: string, value: any) => any;
    afterStateChange?: (path: string, oldValue: any, newValue: any) => void;
    onStateAccess?: (path: string, component: string) => void;
    getState?: () => any;
    setState?: (path: string, value: any) => void;
  };
}

/**
 * External service plugin interface
 */
export interface ExternalServicePlugin extends ExtendedPlugin {
  type: PluginType.EXTERNAL_SERVICE;
  serviceType: 'api' | 'database' | 'storage' | 'auth' | 'analytics' | 'notification' | string;
  capabilities: Array<
    | 'data-fetching'
    | 'data-caching'
    | 'authentication'
    | 'logging'
    | 'error-reporting'
    | 'push-notifications'
    | string
  >;
  
  // External service specific methods
  connect?: () => Promise<void>;
  disconnect?: () => Promise<void>;
  isConnected?: () => boolean;
  execute?: (method: string, params: any) => Promise<any>;
}

/**
 * Code generator plugin interface
 */
export interface CodeGeneratorPlugin extends ExtendedPlugin {
  type: PluginType.CODE_GENERATOR;
  generatorType: 'component' | 'hook' | 'test' | 'style' | 'documentation' | string;
  capabilities: Array<
    | 'component-generation'
    | 'hook-generation'
    | 'test-generation'
    | 'style-generation'
    | 'documentation-generation'
    | string
  >;
  
  // Code generator specific methods
  generateCode: (type: string, options: any) => Promise<string>;
  getTemplates: () => Array<{ id: string; name: string; description: string }>;
}

/**
 * Code analyzer plugin interface
 */
export interface CodeAnalyzerPlugin extends ExtendedPlugin {
  type: PluginType.CODE_ANALYZER;
  analyzerType: 'syntax' | 'style' | 'performance' | 'security' | 'accessibility' | string;
  capabilities: Array<
    | 'syntax-validation'
    | 'style-linting'
    | 'performance-analysis'
    | 'security-scanning'
    | 'accessibility-checking'
    | string
  >;
  
  // Code analyzer specific methods
  analyzeCode: (code: string, options?: any) => Promise<{ 
    issues: Array<{ 
      type: string; 
      severity: 'error' | 'warning' | 'info'; 
      message: string;
      line?: number;
      column?: number;
      fix?: () => string;
    }> 
  }>;
}

/**
 * Performance plugin interface
 */
export interface PerformancePlugin extends ExtendedPlugin {
  type: PluginType.PERFORMANCE;
  capabilities: Array<
    | 'render-tracking'
    | 'component-profiling'
    | 'state-access-tracking'
    | 'memoization-analysis'
    | 'bundle-analysis'
    | string
  >;
  
  // Performance specific methods
  startProfiling: (componentId: string) => void;
  stopProfiling: (componentId: string) => any;
  getPerformanceReport: () => any;
}

/**
 * Accessibility plugin interface
 */
export interface AccessibilityPlugin extends ExtendedPlugin {
  type: PluginType.ACCESSIBILITY;
  capabilities: Array<
    | 'contrast-analysis'
    | 'aria-validation'
    | 'keyboard-navigation'
    | 'screen-reader-testing'
    | 'color-blindness-simulation'
    | string
  >;
  
  // Accessibility specific methods
  analyzeAccessibility: (componentId: string) => Promise<{
    issues: Array<{
      type: string;
      severity: 'critical' | 'serious' | 'moderate' | 'minor';
      message: string;
      element?: string;
      fix?: string;
    }>
  }>;
}

/**
 * Documentation plugin interface
 */
export interface DocumentationPlugin extends ExtendedPlugin {
  type: PluginType.DOCUMENTATION;
  capabilities: Array<
    | 'code-documentation'
    | 'component-documentation'
    | 'api-documentation'
    | 'markdown-generation'
    | 'diagram-generation'
    | string
  >;
  
  // Documentation specific methods
  generateDocumentation: (
    componentId: string, 
    options?: { format?: 'markdown' | 'html' | 'jsdoc'; includeProps?: boolean; includeExamples?: boolean }
  ) => Promise<string>;
}

/**
 * Multi-modal plugin interface
 */
export interface MultiModalPlugin extends ExtendedPlugin {
  type: PluginType.MULTI_MODAL;
  capabilities: Array<
    | 'image-processing'
    | 'audio-processing'
    | 'video-processing'
    | 'speech-recognition'
    | 'text-to-speech'
    | 'visual-designer'
    | string
  >;
  
  // Multi-modal specific methods
  processMedia: (type: 'image' | 'audio' | 'video', data: any) => Promise<any>;
  generateMedia: (type: 'image' | 'audio' | 'video', prompt: string) => Promise<any>;
}

/**
 * Plugin dependency definition
 */
export interface PluginDependency {
  /** ID of the required plugin */
  pluginId: string;
  /** Version requirement (semver string) */
  version?: string;
  /** Whether this dependency is optional */
  optional?: boolean;
}

/**
 * Enhanced plugin configuration options
 */
export interface PluginConfig {
  /** ID of the plugin */
  id: string;
  /** Whether the plugin is enabled */
  enabled: boolean;
  /** Plugin-specific configuration */
  options: Record<string, any>;
  /** Dependencies configuration */
  dependencies?: Record<string, boolean>;
  /** Enabled/disabled capabilities */
  capabilities?: Record<string, boolean>;
}

/**
 * Plugin registration options
 */
export interface PluginRegistrationOptions {
  /** Whether to automatically initialize the plugin */
  autoInitialize?: boolean;
  /** Whether to override an existing plugin with the same ID */
  override?: boolean;
  /** Custom configuration to apply */
  config?: Record<string, any>;
  /** Initial enabled state */
  enabled?: boolean;
}
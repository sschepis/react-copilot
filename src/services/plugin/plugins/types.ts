/**
 * Types for the plugin system
 * This file re-exports all plugin-specific types
 */

// ValidationPlugin types
export type { ValidationRule } from './ValidationPlugin';

// AnalyticsPlugin types
export type { 
  AnalyticsEvent,
  AnalyticsPluginOptions
} from './AnalyticsPlugin';

// PerformancePlugin types
export type { 
  ComponentPerformanceData,
  PerformancePluginOptions
} from './PerformancePlugin';

// AccessibilityPlugin types
export type { 
  AccessibilityRule,
  AccessibilityPluginOptions,
  AccessibilityViolation
} from './AccessibilityPlugin';

// DocumentationPlugin types
export type { DocumentationPluginOptions } from './DocumentationPlugin';

// ThemePlugin types
export type { 
  ThemeConfig,
  ThemePluginOptions,
  ThemeContextType
} from './ThemePlugin';

// InternationalizationPlugin types
export type { InternationalizationPluginOptions } from './InternationalizationPlugin';
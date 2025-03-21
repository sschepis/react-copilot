/**
 * Types for the plugin system
 * This file re-exports all plugin-specific types
 */
export type { ValidationRule } from './ValidationPlugin';
export type { AnalyticsEvent, AnalyticsPluginOptions } from './AnalyticsPlugin';
export type { ComponentPerformanceData, PerformancePluginOptions } from './PerformancePlugin';
export type { AccessibilityRule, AccessibilityPluginOptions, AccessibilityViolation } from './AccessibilityPlugin';
export type { DocumentationPluginOptions } from './DocumentationPlugin';
export type { ThemeConfig, ThemePluginOptions, ThemeContextType } from './ThemePlugin';
export type { InternationalizationPluginOptions } from './InternationalizationPlugin';

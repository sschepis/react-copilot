// Export components
export { LLMProvider } from './components/LLMProvider';
export { ModifiableApp } from './components/ModifiableApp';
export { ChatOverlay } from './components/ChatOverlay';
export { AutonomousAgent } from './components/AutonomousAgent';
export { MultiModalChatOverlay } from './components/MultiModalChatOverlay';
export { MultiModalMessageDisplay, LegacyMessageAdapter } from './components/MultiModalMessageDisplay';

// Export debug components
export { DebugPanel } from './components/debug/DebugPanel';
export { ComponentTree } from './components/debug/ComponentTree';
export { PropsMonitor } from './components/debug/PropsMonitor';
export { StateMonitor } from './components/debug/StateMonitor';
export { RelationshipView } from './components/debug/RelationshipView';
export {
  debugTheme,
  darkDebugTheme,
  createThemeVariables
} from './components/debug/theme';
export type { ThemeVariables } from './components/debug/theme';
export type { DebugPanelProps } from './components/debug/DebugPanel';

// Export hooks
export { useLLM } from './hooks/useLLM';
export { useModifiableComponent } from './hooks/useModifiableComponent';
export { useAutonomousMode } from './hooks/useAutonomousMode';
export { useDebug } from './hooks/useDebug';

// Export contexts
export { useLLMContext, useComponentContext } from './context';

// Export plugins
export { PluginManager } from './services/plugin/PluginManager';
export { DocumentationPlugin } from './services/plugin/plugins/DocumentationPlugin';
export { AnalyticsPlugin } from './services/plugin/plugins/AnalyticsPlugin';
export { PerformancePlugin } from './services/plugin/plugins/PerformancePlugin';
export { ValidationPlugin } from './services/plugin/plugins/ValidationPlugin';

// Export modular UI system
export {
  // Core module types and registry
  ModuleRegistry,
  moduleRegistry,
  registerModule,
  registerModules,
  
  // Module visibility management
  ModuleVisibilityContext,
  useModuleVisibility,
  ModuleVisibilityProvider,
  
  // UI components
  UIControlPanel,
  ModuleRenderer,
  ModuleProvider,
  
  // Default modules
  DebugPanelModule,
  ChatOverlayModule,
  MultiModalChatOverlayModule,
  DefaultModules,
  registerDefaultModules
} from './components/ui-modules';

// Export types
export * from './utils/types';
export * from './utils/types.multimodal';
export * from './components/ui-modules/types';

// Export version
export const VERSION = '0.1.0';

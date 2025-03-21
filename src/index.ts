// Export components
export { LLMProvider } from './components/LLMProvider';
export { ModifiableApp } from './components/ModifiableApp';
export { ChatOverlay } from './components/ChatOverlay';
export { AutonomousAgent } from './components/AutonomousAgent';

// Export debug components
export { DebugPanel } from './components/debug/DebugPanel';
export { ComponentTree } from './components/debug/ComponentTree';
export { PropsMonitor } from './components/debug/PropsMonitor';
export { StateMonitor } from './components/debug/StateMonitor';
export { RelationshipView } from './components/debug/RelationshipView';

// Export hooks
export { useLLM } from './hooks/useLLM';
export { useModifiableComponent } from './hooks/useModifiableComponent';
export { useAutonomousMode } from './hooks/useAutonomousMode';
export { useDebug } from './hooks/useDebug';

// Export contexts
export { useLLMContext } from './context/LLMContext';
export { useComponentContext } from './context/ComponentContext';

// Export plugins
export { PluginManager } from './services/plugin/PluginManager';
export { DocumentationPlugin } from './services/plugin/plugins/DocumentationPlugin';
export { AnalyticsPlugin } from './services/plugin/plugins/AnalyticsPlugin';
export { PerformancePlugin } from './services/plugin/plugins/PerformancePlugin';
export { ValidationPlugin } from './services/plugin/plugins/ValidationPlugin';

// Export types
export * from './utils/types';

// Export version
export const VERSION = '0.1.0';

// Export types
export * from './types';

// Export registry
export { ModuleRegistry, moduleRegistry, registerModule, registerModules } from './ModuleRegistry';

// Export visibility context
export { 
  ModuleVisibilityContext, 
  useModuleVisibility, 
  ModuleVisibilityProvider 
} from './ModuleVisibilityContext';

// Export UI components
export { UIControlPanel } from './UIControlPanel';
export { ModuleRenderer } from './ModuleRenderer';
export { ModuleProvider } from './ModuleProvider';

// Export default modules
export {
  DebugPanelModule,
  ChatOverlayModule,
  MultiModalChatOverlayModule,
  DefaultModules,
  registerDefaultModules
} from './DefaultModules';

// No utility functions at the module level that call React hooks
// Instead, create proper custom hooks or use the exported hooks directly

// Usage examples (these are comments, not actual code):
// Example 1: Inside a component
// const MyComponent = () => {
//   const { isModuleVisible } = useModuleVisibility();
//   const isDebugEnabled = isModuleVisible('debug-panel');
//   return isDebugEnabled ? <DebugStuff /> : null;
// };

// Example 2: Create a specialized hook in a component file
// const useIsDebugEnabled = () => {
//   const { isModuleVisible } = useModuleVisibility();
//   return isModuleVisible('debug-panel');
// };
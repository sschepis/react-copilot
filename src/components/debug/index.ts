/**
 * Debug components for inspecting ModifiableComponents
 */
// Export main debug panel
export { DebugPanel } from './DebugPanel';

// Export base components
export * from './base';

// Export individual debug components
export * from './components';

// Export types for public API
export type { DebugPanelProps } from './DebugPanel';

// Export theme utilities from utils/theme
export {
  ThemeConfig,
  lightTheme,
  darkTheme,
  createThemeVariables
} from '../../utils/theme';
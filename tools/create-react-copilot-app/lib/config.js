/**
 * Configuration and constants for the create-react-copilot-app CLI
 */

// Available LLM providers
export const LLM_PROVIDERS = ['openai', 'anthropic', 'deepseek'];

// Available plugins
export const PLUGINS = [
  { name: 'Documentation Plugin', value: 'documentation', checked: true },
  { name: 'Analytics Plugin', value: 'analytics', checked: false },
  { name: 'Performance Plugin', value: 'performance', checked: true },
  { name: 'Validation Plugin', value: 'validation', checked: true },
  { name: 'Accessibility Plugin', value: 'accessibility', checked: true },
  { name: 'Internationalization Plugin', value: 'internationalization', checked: false },
  { name: 'Theme Plugin', value: 'theme', checked: true }
];

// Available templates
export const TEMPLATES = {
  'default': 'Create React App template (legacy)',
  'vite-default': 'Vite template with modern React (recommended)'
};

// Debug panel theme options
export const DEBUG_PANEL_THEME_OPTIONS = {
  light: 'Light',
  dark: 'Dark',
  system: 'System default'
};

// Default model mapping
export const DEFAULT_MODELS = {
  'openai': 'gpt-4',
  'anthropic': 'claude-3-sonnet-20240229',
  'deepseek': 'deepseek-chat'
};

// File extension mappings for TypeScript
export const TS_FILE_EXTENSION_MAP = {
  '.js': '.ts',
  '.jsx': '.tsx'
};
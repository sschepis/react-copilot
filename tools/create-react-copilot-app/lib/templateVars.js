/**
 * Functions for preparing template variables
 */
import { DEFAULT_MODELS } from './config.js';

/**
 * Prepare template variables based on configuration
 */
export async function prepareTemplateVariables(config) {
  const { projectName, provider, typescript, debugPanel, plugins, apiKey } = config;
  
  // Determine model based on provider
  const model = DEFAULT_MODELS[provider] || DEFAULT_MODELS.openai;
  
  // Prepare plugin imports and config
  const pluginImports = [];
  const pluginInstances = [];
  
  if (plugins.includes('documentation')) {
    pluginImports.push('DocumentationPlugin');
    pluginInstances.push('    new DocumentationPlugin({ generateJsDocs: true, generateReadmes: true })');
  }
  if (plugins.includes('analytics')) {
    pluginImports.push('AnalyticsPlugin');
    pluginInstances.push('    new AnalyticsPlugin({ endpointUrl: "/api/analytics", batchEvents: true })');
  }
  if (plugins.includes('performance')) {
    pluginImports.push('PerformancePlugin');
    pluginInstances.push('    new PerformancePlugin({ injectMonitoring: true, trackRenderPerformance: true })');
  }
  if (plugins.includes('validation')) {
    pluginImports.push('ValidationPlugin');
    pluginInstances.push('    new ValidationPlugin({ strictMode: true })');
  }
  if (plugins.includes('accessibility')) {
    pluginImports.push('AccessibilityPlugin');
    pluginInstances.push('    new AccessibilityPlugin({ checkAria: true, enforceContrast: true })');
  }
  if (plugins.includes('internationalization')) {
    pluginImports.push('InternationalizationPlugin');
    pluginInstances.push('    new InternationalizationPlugin({ defaultLocale: "en", supportedLocales: ["en", "es", "fr"] })');
  }
  if (plugins.includes('theme')) {
    pluginImports.push('ThemePlugin');
    pluginInstances.push('    new ThemePlugin({ defaultTheme: "light", themes: { light: {}, dark: {} } })');
  }
  
  const pluginImportStatement = pluginImports.length > 0 
    ? `import { ${pluginImports.join(', ')} } from 'react-copilot';` 
    : '';
  
  const pluginsConfig = pluginInstances.length > 0 
    ? `\n  plugins={[\n${pluginInstances.join(',\n')}\n  ]}` 
    : '';
  
  // Environment variables for API keys
  const openaiEnv = provider === 'openai'
    ? `VITE_OPENAI_API_KEY=${apiKey}`
    : '# VITE_OPENAI_API_KEY=your_openai_api_key_here';
    
  const anthropicEnv = provider === 'anthropic'
    ? `VITE_ANTHROPIC_API_KEY=${apiKey}`
    : '# VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here';
    
  const deepseekEnv = provider === 'deepseek'
    ? `VITE_DEEPSEEK_API_KEY=${apiKey}`
    : '# VITE_DEEPSEEK_API_KEY=your_deepseek_api_key_here';
  
  // Environment variables for plugins
  const docPluginEnv = plugins.includes('documentation') 
    ? 'VITE_ENABLE_DOCUMENTATION=true' 
    : '# VITE_ENABLE_DOCUMENTATION=false';
    
  const analyticsPluginEnv = plugins.includes('analytics') 
    ? 'VITE_ENABLE_ANALYTICS=true' 
    : '# VITE_ENABLE_ANALYTICS=false';
    
  const performancePluginEnv = plugins.includes('performance') 
    ? 'VITE_ENABLE_PERFORMANCE=true' 
    : '# VITE_ENABLE_PERFORMANCE=false';
    
  const validationPluginEnv = plugins.includes('validation') 
    ? 'VITE_ENABLE_VALIDATION=true' 
    : '# VITE_ENABLE_VALIDATION=false';
    
  const accessibilityPluginEnv = plugins.includes('accessibility') 
    ? 'VITE_ENABLE_ACCESSIBILITY=true' 
    : '# VITE_ENABLE_ACCESSIBILITY=false';
    
  const intlPluginEnv = plugins.includes('internationalization') 
    ? 'VITE_ENABLE_INTERNATIONALIZATION=true' 
    : '# VITE_ENABLE_INTERNATIONALIZATION=false';
    
  const themePluginEnv = plugins.includes('theme') 
    ? 'VITE_ENABLE_THEME=true' 
    : '# VITE_ENABLE_THEME=false';
  
  // Debug panel components
  const debugPanelImport = debugPanel ? ', DebugPanel' : '';
  const debugPanelComponent = debugPanel ? '<DebugPanel position="bottom-right" initialVisible={false} theme="system" />' : '';
  
  // Return all template variables
  return {
    projectName,
    buildCommand: typescript ? "tsc && vite build" : "vite build",
    typescriptDeps: typescript 
      ? `"@types/node": "^16.18.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.4",
    ` 
      : "",
    jsExtension: typescript ? "tsx" : "jsx",
    provider,
    model,
    debugPanel: debugPanel ? "true" : "false",
    debugPanelImport,
    debugPanelComponent,
    pluginImports: pluginImportStatement,
    pluginsConfig,
    // Environment variables
    openaiEnv,
    anthropicEnv,
    deepseekEnv,
    docPluginEnv,
    analyticsPluginEnv,
    performancePluginEnv,
    validationPluginEnv,
    accessibilityPluginEnv,
    intlPluginEnv,
    themePluginEnv
  };
}
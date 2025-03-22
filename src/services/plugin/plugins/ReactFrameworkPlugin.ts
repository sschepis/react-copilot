import { Plugin, PluginContext, ModifiableComponent } from '../../../utils/types';
import { PluginType, FrameworkAdapterPlugin } from '../types';

/**
 * Plugin that provides React-specific functionality and integration
 */
export class ReactFrameworkPlugin implements FrameworkAdapterPlugin {
  id = 'react-framework-plugin';
  name = 'React Framework Plugin';
  description = 'Provides React-specific functionality and integration';
  version = '1.0.0';
  type: PluginType.FRAMEWORK_ADAPTER = PluginType.FRAMEWORK_ADAPTER;
  framework = 'react';
  supportedVersions = ['^16.8.0', '^17.0.0', '^18.0.0'];
  enabled = true;
  capabilities = [
    'component-detection',
    'lifecycle-hooks',
    'jsx-transformation',
    'hooks-detection',
    'props-analysis'
  ];

  private context: PluginContext | null = null;

  hooks = {
    /**
     * Process component during registration to add React-specific metadata
     */
    beforeComponentRegister: (component: ModifiableComponent): ModifiableComponent => {
      const updatedComponent = { ...component };
      
      // Detect if the component is a React component
      const isReactComponent = this.isReactComponent(component);
      
      if (isReactComponent) {
        // Set componentType if not already set
        if (!updatedComponent.metadata) {
          updatedComponent.metadata = {};
        }
        
        updatedComponent.metadata.framework = 'react';
        updatedComponent.metadata.componentType = this.detectComponentType(component);
        
        // Extract props information if available
        const propsInfo = this.extractPropsInfo(component);
        if (propsInfo.length > 0) {
          updatedComponent.metadata.props = propsInfo;
        }
        
        // Detect hooks usage
        const hooksUsage = this.detectHooksUsage(component);
        if (Object.keys(hooksUsage).length > 0) {
          updatedComponent.metadata.hooks = hooksUsage;
        }
      }
      
      return updatedComponent;
    },
    
    /**
     * Validate React-specific code before execution
     */
    beforeCodeExecution: (code: string): string => {
      // Add React import if missing but JSX is used
      if (this.hasJSXButNoReactImport(code)) {
        code = "import React from 'react';\n" + code;
      }
      
      // Fix common React mistakes
      code = this.fixCommonReactMistakes(code);
      
      return code;
    }
  };

  /**
   * Initialize the plugin with the provided context
   */
  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    console.log('React Framework Plugin initialized');
  }

  /**
   * Clean up resources when plugin is destroyed
   */
  destroy(): void {
    this.context = null;
    console.log('React Framework Plugin destroyed');
  }

  /**
   * Configure the plugin with the provided options
   */
  configure(options: Record<string, any>): void {
    if (options.supportedVersions) {
      this.supportedVersions = options.supportedVersions;
    }
    
    if (options.capabilities) {
      this.capabilities = options.capabilities;
    }
    
    if (options.enabled !== undefined) {
      this.enabled = options.enabled;
    }
  }

  /**
   * Check if the component is React compatible
   */
  isCompatible(component: ModifiableComponent): boolean {
    return this.isReactComponent(component);
  }

  /**
   * Get plugin capabilities
   */
  getCapabilities(): string[] {
    return this.capabilities;
  }

  /**
   * Check if a component is a React component
   */
  private isReactComponent(component: ModifiableComponent): boolean {
    if (!component.sourceCode) return false;
    
    const sourceCode = component.sourceCode;
    
    // Check for React imports
    const hasReactImport = sourceCode.includes('import React') || 
                          sourceCode.includes('from "react"') || 
                          sourceCode.includes("from 'react'");
    
    // Check for JSX syntax
    const hasJSX = sourceCode.includes('return (') && 
                  (sourceCode.includes('<') && sourceCode.includes('/>')) ||
                  sourceCode.includes('return <');
    
    // Check for React component patterns
    const isClassComponent = sourceCode.includes('extends React.Component') || 
                            sourceCode.includes('extends Component');
    
    const isFunctionalComponent = (sourceCode.includes('function') || sourceCode.includes('=>')) && 
                                hasJSX;
    
    return hasReactImport && (isClassComponent || isFunctionalComponent || hasJSX);
  }

  /**
   * Detect what type of React component this is
   */
  private detectComponentType(component: ModifiableComponent): string {
    if (!component.sourceCode) return 'unknown';
    
    const sourceCode = component.sourceCode;
    
    if (sourceCode.includes('extends React.Component') || 
        sourceCode.includes('extends Component')) {
      return 'class-component';
    }
    
    if ((sourceCode.includes('function') || sourceCode.includes('const')) && 
        sourceCode.includes('return') && 
        (sourceCode.includes('<') && sourceCode.includes('/>'))) {
      
      if (sourceCode.includes('React.memo') || sourceCode.includes('memo(')) {
        return 'memoized-functional-component';
      }
      
      return 'functional-component';
    }
    
    return 'unknown';
  }

  /**
   * Extract props information from component
   */
  private extractPropsInfo(component: ModifiableComponent): any[] {
    if (!component.sourceCode) return [];
    
    const sourceCode = component.sourceCode;
    const props: any[] = [];
    
    // Extract props from function parameters
    const funcPropsMatch = sourceCode.match(/function\s+\w+\s*\(\s*{\s*([^}]*)\s*}\s*\)/);
    if (funcPropsMatch && funcPropsMatch[1]) {
      const propsList = funcPropsMatch[1].split(',');
      propsList.forEach(prop => {
        const trimmedProp = prop.trim();
        if (trimmedProp) {
          const [name, type] = trimmedProp.split(':').map(p => p.trim());
          props.push({ name, type: type || 'any', isRequired: false });
        }
      });
    }
    
    // Extract props from PropTypes
    const propTypesMatches = sourceCode.match(/([A-Za-z0-9_]+)\.propTypes\s*=\s*{([^}]*)}/);
    if (propTypesMatches && propTypesMatches[2]) {
      const propsList = propTypesMatches[2].split(',');
      propsList.forEach(prop => {
        const propMatch = prop.match(/([A-Za-z0-9_]+)\s*:\s*PropTypes\.([A-Za-z0-9_]+)(\s*\.isRequired)?/);
        if (propMatch) {
          const name = propMatch[1].trim();
          const type = propMatch[2].trim();
          const isRequired = !!propMatch[3];
          props.push({ name, type, isRequired });
        }
      });
    }
    
    return props;
  }

  /**
   * Detect React hooks usage
   */
  private detectHooksUsage(component: ModifiableComponent): Record<string, number> {
    if (!component.sourceCode) return {};
    
    const sourceCode = component.sourceCode;
    const hooksUsage: Record<string, number> = {};
    
    // Common React hooks to detect
    const hooks = [
      'useState', 'useEffect', 'useContext', 'useReducer', 
      'useCallback', 'useMemo', 'useRef', 'useImperativeHandle',
      'useLayoutEffect', 'useDebugValue', 'useTransition', 'useDeferredValue'
    ];
    
    hooks.forEach(hook => {
      const regex = new RegExp(`\\b${hook}\\s*\\(`, 'g');
      const matches = sourceCode.match(regex);
      if (matches && matches.length > 0) {
        hooksUsage[hook] = matches.length;
      }
    });
    
    // Detect custom hooks (functions starting with 'use')
    const customHooksMatches = sourceCode.match(/function\s+use[A-Z]\w*\s*\(/g);
    if (customHooksMatches) {
      hooksUsage.customHooks = customHooksMatches.length;
    }
    
    return hooksUsage;
  }

  /**
   * Check if code has JSX but no React import
   */
  private hasJSXButNoReactImport(code: string): boolean {
    const hasJSX = code.includes('<') && code.includes('/>') || 
                  code.includes('return <') ||
                  code.includes('render()') && code.includes('return');
                  
    const hasReactImport = code.includes('import React') || 
                          code.includes('from "react"') || 
                          code.includes("from 'react'");
    
    return hasJSX && !hasReactImport;
  }

  /**
   * Fix common React mistakes in code
   */
  private fixCommonReactMistakes(code: string): string {
    let fixedCode = code;
    
    // Fix class/className mistake
    fixedCode = fixedCode.replace(/class=/g, 'className=');
    
    // Fix for/htmlFor mistake
    fixedCode = fixedCode.replace(/ for=/g, ' htmlFor=');
    
    // Fix missing key in iterators
    if ((fixedCode.includes('.map(') || fixedCode.includes('.forEach(')) && 
        !fixedCode.includes('key=')) {
      console.log('Warning: Component might have a missing key prop in an iterator');
    }
    
    return fixedCode;
  }
}

// Export a default instance
export const reactFrameworkPlugin = new ReactFrameworkPlugin();
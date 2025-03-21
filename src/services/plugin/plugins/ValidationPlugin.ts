import { Plugin, PluginHooks, PluginContext, ModifiableComponent } from '../../../utils/types';

/**
 * Validation rule for checking component code
 */
export interface ValidationRule {
  id: string;
  description: string;
  test: (code: string) => boolean;
  errorMessage: string;
}

/**
 * Example plugin that validates component code before execution
 * This plugin demonstrates how to create a plugin for the React Copilot system
 */
export class ValidationPlugin implements Plugin {
  id = 'code-validation-plugin';
  name = 'Code Validation Plugin';
  version = '1.0.0';
  
  // Optional configuration
  private config: {
    strictMode: boolean;
    maxFileSize: number;
    rules: ValidationRule[];
  };
  
  /**
   * Plugin hooks implementation
   */
  hooks: PluginHooks = {
    // Check component before registration
    beforeComponentRegistration: (component: ModifiableComponent): ModifiableComponent => {
      console.log(`[ValidationPlugin] Validating component: ${component.name}`);
      
      // Simply return the component unmodified in this example
      // In a real plugin, you could validate the component structure
      return component;
    },
    
    // Log after component registration
    afterComponentRegistration: (component: ModifiableComponent): void => {
      console.log(`[ValidationPlugin] Component registered: ${component.name} (${component.id})`);
    },
    
    // Validate code before execution
    beforeCodeExecution: (code: string): string => {
      console.log(`[ValidationPlugin] Validating code (${code.length} characters)`);
      
      if (this.config.strictMode) {
        // Apply validation rules
        const violations = this.validateCode(code);
        
        if (violations.length > 0) {
          // In a real plugin, you might modify the code or provide warnings
          // Here we just add a comment with the violations
          const violationComments = violations
            .map(v => `// WARNING: ${v.rule}: ${v.message}`)
            .join('\n');
            
          return `${violationComments}\n\n${code}`;
        }
      }
      
      // Code size validation
      if (code.length > this.config.maxFileSize) {
        console.warn(`[ValidationPlugin] Code size exceeds limit (${code.length} > ${this.config.maxFileSize})`);
      }
      
      return code;
    },
  };
  
  /**
   * Create a new ValidationPlugin
   * @param config Optional configuration
   */
  constructor(config?: Partial<ValidationPlugin['config']>) {
    // Default configuration
    this.config = {
      strictMode: false,
      maxFileSize: 10000, // 10KB
      rules: [
        {
          id: 'no-eval',
          description: 'Avoid using eval() in your code',
          test: (code) => !code.includes('eval('),
          errorMessage: 'Using eval() is discouraged for security reasons',
        },
        {
          id: 'no-document-write',
          description: 'Avoid using document.write()',
          test: (code) => !code.includes('document.write('),
          errorMessage: 'document.write() is discouraged as it can lead to XSS vulnerabilities',
        },
        {
          id: 'prefer-const',
          description: 'Prefer const over let when variable is not reassigned',
          test: (code) => {
            // This is a simplified check - a real implementation would be more sophisticated
            const letDeclarations = code.match(/let\s+(\w+)\s*=/g) || [];
            const reassignments = letDeclarations
              .map(dec => dec.match(/let\s+(\w+)\s*=/)?.[1])
              .filter(Boolean)
              .filter(varName => {
                const pattern = new RegExp(`${varName}\\s*=`, 'g');
                const matches = code.match(pattern) || [];
                return matches.length <= 1; // Only the declaration, no reassignments
              });
              
            return reassignments.length === 0;
          },
          errorMessage: 'Use const for variables that are not reassigned',
        },
      ],
    };
    
    // Apply custom configuration if provided
    if (config) {
      this.config = {
        ...this.config,
        ...config,
        // Merge rules if provided
        rules: [
          ...this.config.rules,
          ...(config.rules || []),
        ],
      };
    }
  }
  
  /**
   * Initialize the plugin with context
   * @param context The plugin context
   */
  async initialize(_context: PluginContext): Promise<void> {
    console.log('[ValidationPlugin] Initializing...');
    
    // Access the context to set up the plugin
    // For example, you could register custom rules or set up event listeners
    
    console.log('[ValidationPlugin] Initialized successfully');
  }
  
  /**
   * Clean up plugin resources
   */
  async destroy(): Promise<void> {
    console.log('[ValidationPlugin] Cleaning up...');
    
    // Release any resources or perform cleanup
    
    console.log('[ValidationPlugin] Clean up complete');
  }
  
  /**
   * Validate code against rules
   * @param code The code to validate
   * @returns Array of rule violations
   */
  private validateCode(code: string): Array<{rule: string, message: string}> {
    const violations: Array<{rule: string, message: string}> = [];
    
    for (const rule of this.config.rules) {
      if (!rule.test(code)) {
        violations.push({
          rule: rule.id,
          message: rule.errorMessage,
        });
      }
    }
    
    return violations;
  }
  
  /**
   * Add a custom validation rule
   * @param rule The rule to add
   */
  addRule(rule: ValidationRule): void {
    this.config.rules.push(rule);
  }
  
  /**
   * Remove a validation rule by ID
   * @param ruleId The ID of the rule to remove
   * @returns True if the rule was removed
   */
  removeRule(ruleId: string): boolean {
    const initialLength = this.config.rules.length;
    this.config.rules = this.config.rules.filter(rule => rule.id !== ruleId);
    return this.config.rules.length < initialLength;
  }
  
  /**
   * Set strict mode
   * @param enabled Whether strict mode is enabled
   */
  setStrictMode(enabled: boolean): void {
    this.config.strictMode = enabled;
  }
  
  /**
   * Set maximum file size
   * @param sizeInBytes Maximum file size in bytes
   */
  setMaxFileSize(sizeInBytes: number): void {
    this.config.maxFileSize = sizeInBytes;
  }
}
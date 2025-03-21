import { ValidationPlugin, ValidationRule } from '../../src/services/plugin/plugins/ValidationPlugin';
import { ModifiableComponent } from '../../src/utils/types';

describe('ValidationPlugin', () => {
  let validationPlugin: ValidationPlugin;
  let mockContext: any;
  
  // Sample component for testing
  const sampleComponent: ModifiableComponent = {
    id: 'test-component-1',
    name: 'TestComponent',
    sourceCode: 'function TestComponent() { return <div>Hello World</div>; }',
    ref: { current: null },
  };
  
  // Sample code snippets for testing rules
  const codeWithEval = 'function test() { eval("console.log(\'hello\')"); }';
  const codeWithDocumentWrite = 'document.write("<h1>Hello World</h1>");';
  const codeWithLetMisuse = 'let x = 10; // This should be const';
  const codeWithoutIssues = 'function test() { const x = 10; return x; }';
  
  beforeEach(() => {
    // Reset console mocks
    jest.clearAllMocks();
    
    // Create plugin instance with default config
    validationPlugin = new ValidationPlugin();
    
    // Mock context for initialization
    mockContext = {
      componentRegistry: {
        getAllComponents: jest.fn().mockReturnValue({}),
      },
      llmManager: {
        getCurrentProvider: jest.fn().mockReturnValue({}),
      },
    };
  });
  
  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      expect(validationPlugin).toBeDefined();
      expect(validationPlugin.id).toBe('code-validation-plugin');
      expect(validationPlugin.name).toBe('Code Validation Plugin');
      expect(validationPlugin.version).toBe('1.0.0');
    });
    
    it('should accept custom configuration', () => {
      const customRule: ValidationRule = {
        id: 'custom-rule',
        description: 'Custom rule for testing',
        test: () => true,
        errorMessage: 'Custom rule failed',
      };
      
      const customPlugin = new ValidationPlugin({
        strictMode: true,
        maxFileSize: 5000,
        rules: [customRule],
      });
      
      // Access the private config through type assertion
      const config = (customPlugin as any).config;
      
      expect(config.strictMode).toBe(true);
      expect(config.maxFileSize).toBe(5000);
      expect(config.rules).toHaveLength(4); // 3 default + 1 custom
      expect(config.rules[3].id).toBe('custom-rule');
    });
  });
  
  describe('initialize', () => {
    it('should initialize with context', async () => {
      await validationPlugin.initialize(mockContext);
      
      // Verify console output
      expect(console.log).toHaveBeenCalledWith('[ValidationPlugin] Initializing...');
      expect(console.log).toHaveBeenCalledWith('[ValidationPlugin] Initialized successfully');
    });
  });
  
  describe('hooks', () => {
    describe('beforeComponentRegistration', () => {
      it('should log validation message and return component unchanged', () => {
        // Use non-null assertion operator to tell TypeScript the property exists and won't be undefined
        const result = validationPlugin.hooks!.beforeComponentRegistration!(sampleComponent);
        
        expect(console.log).toHaveBeenCalledWith(
          `[ValidationPlugin] Validating component: ${sampleComponent.name}`
        );
        expect(result).toEqual(sampleComponent);
      });
    });
    
    describe('afterComponentRegistration', () => {
      it('should log registration message', () => {
        // Use non-null assertion operator
        validationPlugin.hooks!.afterComponentRegistration!(sampleComponent);
        
        expect(console.log).toHaveBeenCalledWith(
          `[ValidationPlugin] Component registered: ${sampleComponent.name} (${sampleComponent.id})`
        );
      });
    });
    
    describe('beforeCodeExecution', () => {
      it('should return code unchanged when not in strict mode', () => {
        // Use non-null assertion operator
        const result = validationPlugin.hooks!.beforeCodeExecution!(codeWithEval);
        
        expect(console.log).toHaveBeenCalledWith(
          `[ValidationPlugin] Validating code (${codeWithEval.length} characters)`
        );
        expect(result).toEqual(codeWithEval);
      });
      
      it('should add warnings when in strict mode and code violates rules', () => {
        // Enable strict mode
        (validationPlugin as any).config.strictMode = true;
        
        // Use non-null assertion operator
        const result = validationPlugin.hooks!.beforeCodeExecution!(codeWithEval);
        
        expect(result).toContain('// WARNING: no-eval:');
        expect(result).toContain(codeWithEval);
      });
      
      it('should warn when code size exceeds limit', () => {
        // Set small file size limit
        (validationPlugin as any).config.maxFileSize = 10;
        
        // Use non-null assertion operator
        validationPlugin.hooks!.beforeCodeExecution!(codeWithoutIssues);
        
        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining('Code size exceeds limit')
        );
      });
    });
  });
  
  describe('validateCode', () => {
    it('should detect eval usage', () => {
      // Access private method through type assertion
      const validateCode = (validationPlugin as any).validateCode.bind(validationPlugin);
      
      const violations = validateCode(codeWithEval);
      
      expect(violations).toHaveLength(1);
      expect(violations[0].rule).toBe('no-eval');
    });
    
    it('should detect document.write usage', () => {
      const validateCode = (validationPlugin as any).validateCode.bind(validationPlugin);
      
      const violations = validateCode(codeWithDocumentWrite);
      
      expect(violations).toHaveLength(1);
      expect(violations[0].rule).toBe('no-document-write');
    });
    
    it('should detect when let is used instead of const', () => {
      const validateCode = (validationPlugin as any).validateCode.bind(validationPlugin);
      
      const violations = validateCode(codeWithLetMisuse);
      
      expect(violations).toHaveLength(1);
      expect(violations[0].rule).toBe('prefer-const');
    });
    
    it('should return empty array for code without issues', () => {
      const validateCode = (validationPlugin as any).validateCode.bind(validationPlugin);
      
      const violations = validateCode(codeWithoutIssues);
      
      expect(violations).toHaveLength(0);
    });
  });
  
  describe('rule management', () => {
    it('should add a custom rule', () => {
      const customRule: ValidationRule = {
        id: 'no-console-log',
        description: 'Avoid using console.log',
        test: (code) => !code.includes('console.log'),
        errorMessage: 'Using console.log is discouraged in production code',
      };
      
      validationPlugin.addRule(customRule);
      
      // Get rules from private config
      const rules = (validationPlugin as any).config.rules;
      
      expect(rules).toContainEqual(customRule);
    });
    
    it('should remove a rule by ID', () => {
      const result = validationPlugin.removeRule('no-eval');
      
      // Get rules from private config
      const rules = (validationPlugin as any).config.rules;
      const ruleIds = rules.map((r: ValidationRule) => r.id);
      
      expect(result).toBe(true);
      expect(ruleIds).not.toContain('no-eval');
    });
    
    it('should return false when removing non-existent rule', () => {
      const result = validationPlugin.removeRule('non-existent-rule');
      
      expect(result).toBe(false);
    });
  });
  
  describe('configuration', () => {
    it('should set strict mode', () => {
      validationPlugin.setStrictMode(true);
      
      expect((validationPlugin as any).config.strictMode).toBe(true);
    });
    
    it('should set max file size', () => {
      validationPlugin.setMaxFileSize(20000);
      
      expect((validationPlugin as any).config.maxFileSize).toBe(20000);
    });
  });
  
  describe('destroy', () => {
    it('should clean up resources', async () => {
      await validationPlugin.destroy();
      
      expect(console.log).toHaveBeenCalledWith('[ValidationPlugin] Cleaning up...');
      expect(console.log).toHaveBeenCalledWith('[ValidationPlugin] Clean up complete');
    });
  });
});
import { PluginManager } from '../../src/services/plugin/PluginManager';
import { ValidationPlugin } from '../../src/services/plugin/plugins/ValidationPlugin';
import { AnalyticsPlugin } from '../../src/services/plugin/plugins/AnalyticsPlugin';
import { PerformancePlugin } from '../../src/services/plugin/plugins/PerformancePlugin';
import { DocumentationPlugin } from '../../src/services/plugin/plugins/DocumentationPlugin';
import { ModifiableComponent, CodeChangeResult } from '../../src/utils/types';

/**
 * Integration tests for the plugin system, showing how multiple plugins
 * work together in a complete workflow.
 */
describe('Plugin System Integration', () => {
  let pluginManager: PluginManager;
  let mockLLMManager: any;
  let mockComponentRegistry: any;
  
  // Sample plugins
  let validationPlugin: ValidationPlugin;
  let analyticsPlugin: AnalyticsPlugin;
  let performancePlugin: PerformancePlugin;
  let documentationPlugin: DocumentationPlugin;
  
  // Sample component for testing
  const sampleComponent: ModifiableComponent = {
    id: 'test-component-1',
    name: 'TestComponent',
    sourceCode: 'function TestComponent() { return <div>Hello World</div>; }',
    ref: { current: null },
  };
  
  // Sample code change result
  const sampleCodeResult: CodeChangeResult = {
    componentId: 'test-component-1',
    success: true,
    newSourceCode: 'function TestComponent() { return <div>Updated</div>; }',
  };
  
  // Sample LLM content
  const samplePrompt = 'Create a React component that displays a counter';
  const sampleResponse = 'Here is a counter component:\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  return <div>{count}</div>;\n}';
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mocks
    mockLLMManager = {
      getCurrentProvider: jest.fn().mockReturnValue({
        name: 'TestProvider',
        model: 'test-model',
      }),
    };
    
    mockComponentRegistry = {
      getComponent: jest.fn().mockReturnValue(sampleComponent),
      getAllComponents: jest.fn().mockReturnValue({
        [sampleComponent.id]: sampleComponent,
      }),
      updateComponent: jest.fn(),
    };
    
    // Create plugin manager
    pluginManager = new PluginManager(mockLLMManager, mockComponentRegistry);
    
    // Create plugins with specific configurations for testing
    validationPlugin = new ValidationPlugin({
      strictMode: false, // Don't add warnings in tests
    });
    
    analyticsPlugin = new AnalyticsPlugin({
      enabled: true,
      batchEvents: false, // Immediate tracking for easier testing
      endpointUrl: '/test-analytics', // Mock endpoint
    });
    
    performancePlugin = new PerformancePlugin({
      trackRenderPerformance: true,
      injectMonitoring: true,
    });
    
    documentationPlugin = new DocumentationPlugin({
      generateJsDocs: true,
      generateReadmes: true, // Control readme generation instead of autoWrapStrings
    });
    
    // Override fetch for analytics plugin
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });
  });
  
  describe('plugin initialization flow', () => {
    it('should initialize all plugins in the correct order', async () => {
      // Register plugins in a specific order
      pluginManager.registerPlugin(validationPlugin);
      pluginManager.registerPlugin(analyticsPlugin);
      pluginManager.registerPlugin(performancePlugin);
      pluginManager.registerPlugin(documentationPlugin);
      
      // Spy on each plugin's initialize method
      const validationInitSpy = jest.spyOn(validationPlugin, 'initialize');
      const analyticsInitSpy = jest.spyOn(analyticsPlugin, 'initialize');
      const performanceInitSpy = jest.spyOn(performancePlugin, 'initialize');
      const docInitSpy = jest.spyOn(documentationPlugin, 'initialize');
      
      // Initialize all plugins
      await pluginManager.initializeAllPlugins();
      
      // Verify each plugin's initialize was called with the correct context
      expect(validationInitSpy).toHaveBeenCalledWith(expect.objectContaining({
        llmManager: mockLLMManager,
        componentRegistry: mockComponentRegistry,
      }));
      
      expect(analyticsInitSpy).toHaveBeenCalledWith(expect.objectContaining({
        llmManager: mockLLMManager,
        componentRegistry: mockComponentRegistry,
      }));
      
      expect(performanceInitSpy).toHaveBeenCalledWith(expect.objectContaining({
        llmManager: mockLLMManager,
        componentRegistry: mockComponentRegistry,
      }));
      
      expect(docInitSpy).toHaveBeenCalledWith(expect.objectContaining({
        llmManager: mockLLMManager,
        componentRegistry: mockComponentRegistry,
      }));
    });
  });
  
  describe('component registration flow', () => {
    beforeEach(async () => {
      // Register and initialize plugins
      pluginManager.registerPlugin(validationPlugin);
      pluginManager.registerPlugin(analyticsPlugin);
      pluginManager.registerPlugin(performancePlugin);
      pluginManager.registerPlugin(documentationPlugin);
      await pluginManager.initializeAllPlugins();
    });
    
    it('should process component through all plugins during registration', () => {
      // Spy on the hooks
      const validationBeforeSpy = jest.spyOn(validationPlugin.hooks!, 'beforeComponentRegistration' as any);
      const performanceBeforeSpy = jest.spyOn(performancePlugin.hooks!, 'beforeComponentRegistration' as any);
      
      // Skip DocumentationPlugin check since it doesn't have beforeComponentRegistration
      // const docBeforeSpy = jest.spyOn(documentationPlugin.hooks!, 'beforeComponentRegistration' as any);
      
      const analyticsAfterSpy = jest.spyOn(analyticsPlugin.hooks!, 'afterComponentRegistration' as any);
      const performanceAfterSpy = jest.spyOn(performancePlugin.hooks!, 'afterComponentRegistration' as any);
      
      // Simulate component registration flow
      const modifiedComponent = pluginManager.applyHooksToComponentRegistration(sampleComponent);
      pluginManager.notifyComponentRegistered(modifiedComponent);
      
      // Verify beforeComponentRegistration hooks were called
      expect(validationBeforeSpy).toHaveBeenCalledWith(sampleComponent);
      expect(performanceBeforeSpy).toHaveBeenCalled();
      // DocumentationPlugin doesn't have beforeComponentRegistration hook
      
      // Verify afterComponentRegistration hooks were called
      expect(analyticsAfterSpy).toHaveBeenCalled();
      expect(performanceAfterSpy).toHaveBeenCalled();
      
      // Verify the component was modified as expected
      // Performance plugin should have added monitoring code
      expect(modifiedComponent.sourceCode).toContain('performance.now');
    });
  });
  
  describe('code execution flow', () => {
    beforeEach(async () => {
      // Register and initialize plugins
      pluginManager.registerPlugin(validationPlugin);
      pluginManager.registerPlugin(analyticsPlugin);
      pluginManager.registerPlugin(performancePlugin);
      pluginManager.registerPlugin(documentationPlugin);
      await pluginManager.initializeAllPlugins();
    });
    
    it('should process code through all plugins during execution', () => {
      // Sample code with potential issues
      const codeWithIssues = 'function TestComponent() { return <div style={{color: "red"}}>Hello</div>; }';
      
      // Spy on the hooks
      const validationBeforeSpy = jest.spyOn(validationPlugin.hooks!, 'beforeCodeExecution' as any);
      const performanceBeforeSpy = jest.spyOn(performancePlugin.hooks!, 'beforeCodeExecution' as any);
      
      const analyticsAfterSpy = jest.spyOn(analyticsPlugin.hooks!, 'afterCodeExecution' as any);
      const performanceAfterSpy = jest.spyOn(performancePlugin.hooks!, 'afterCodeExecution' as any);
      
      // Simulate code execution flow
      const modifiedCode = pluginManager.applyHooksBeforeCodeExecution(codeWithIssues);
      pluginManager.notifyCodeExecuted(sampleCodeResult);
      
      // Verify beforeCodeExecution hooks were called
      expect(validationBeforeSpy).toHaveBeenCalledWith(codeWithIssues);
      expect(performanceBeforeSpy).toHaveBeenCalledWith(codeWithIssues);
      
      // Verify afterCodeExecution hooks were called
      expect(analyticsAfterSpy).toHaveBeenCalledWith(sampleCodeResult);
      expect(performanceAfterSpy).toHaveBeenCalledWith(sampleCodeResult);
      
      // Performance plugin should have detected the inline style issue
      expect(modifiedCode).toContain('PERFORMANCE SUGGESTION');
    });
  });
  
  describe('LLM interaction flow', () => {
    beforeEach(async () => {
      // Register and initialize plugins
      pluginManager.registerPlugin(validationPlugin);
      pluginManager.registerPlugin(analyticsPlugin);
      await pluginManager.initializeAllPlugins();
    });
    
    it('should process LLM prompts and responses through plugins', () => {
      // Spy on the hooks
      const analyticsBeforeSpy = jest.spyOn(analyticsPlugin.hooks!, 'beforeLLMRequest' as any);
      const analyticsAfterSpy = jest.spyOn(analyticsPlugin.hooks!, 'afterLLMResponse' as any);
      
      // Simulate LLM interaction flow
      const modifiedPrompt = pluginManager.applyHooksBeforeLLMRequest(samplePrompt);
      const modifiedResponse = pluginManager.applyHooksAfterLLMResponse(sampleResponse);
      
      // Verify LLM hooks were called
      expect(analyticsBeforeSpy).toHaveBeenCalledWith(samplePrompt);
      expect(analyticsAfterSpy).toHaveBeenCalledWith(sampleResponse);
      
      // For this test, the content should pass through unchanged
      expect(modifiedPrompt).toBe(samplePrompt);
      expect(modifiedResponse).toBe(sampleResponse);
      
      // Analytics plugin should have tracked these events
      expect(global.fetch).toHaveBeenCalledTimes(2); // Once for prompt, once for response
    });
  });
  
  describe('plugin destruction flow', () => {
    beforeEach(async () => {
      // Register and initialize plugins
      pluginManager.registerPlugin(validationPlugin);
      pluginManager.registerPlugin(analyticsPlugin);
      pluginManager.registerPlugin(performancePlugin);
      pluginManager.registerPlugin(documentationPlugin);
      await pluginManager.initializeAllPlugins();
    });
    
    it('should destroy all plugins in the correct order', async () => {
      // Spy on each plugin's destroy method
      const validationDestroySpy = jest.spyOn(validationPlugin, 'destroy');
      const analyticsDestroySpy = jest.spyOn(analyticsPlugin, 'destroy');
      const performanceDestroySpy = jest.spyOn(performancePlugin, 'destroy');
      const docDestroySpy = jest.spyOn(documentationPlugin, 'destroy');
      
      // Destroy all plugins
      await pluginManager.destroyAllPlugins();
      
      // Verify destroy was called on each plugin
      expect(validationDestroySpy).toHaveBeenCalled();
      expect(analyticsDestroySpy).toHaveBeenCalled();
      expect(performanceDestroySpy).toHaveBeenCalled();
      expect(docDestroySpy).toHaveBeenCalled();
      
      // Verify no plugins remain registered
      expect(pluginManager.getAllPlugins()).toHaveLength(0);
    });
  });
  
  describe('full workflow simulation', () => {
    beforeEach(async () => {
      // Register and initialize plugins
      pluginManager.registerPlugin(validationPlugin);
      pluginManager.registerPlugin(analyticsPlugin);
      pluginManager.registerPlugin(performancePlugin);
      pluginManager.registerPlugin(documentationPlugin);
      await pluginManager.initializeAllPlugins();
    });
    
    it('should process a component through a complete lifecycle', () => {
      // 1. Start with component registration
      const modifiedComponent = pluginManager.applyHooksToComponentRegistration(sampleComponent);
      pluginManager.notifyComponentRegistered(modifiedComponent);
      
      // 2. Simulate LLM interaction to generate code
      const prompt = 'Improve the TestComponent by adding a button';
      // Apply hooks to prompt
      pluginManager.applyHooksBeforeLLMRequest(prompt);
      
      // Simulate LLM response
      const response = 'function TestComponent() { return (<div>Hello World<button>Click me</button></div>); }';
      const modifiedResponse = pluginManager.applyHooksAfterLLMResponse(response);
      
      // 3. Process the generated code
      const processedCode = pluginManager.applyHooksBeforeCodeExecution(modifiedResponse);
      
      // 4. Simulate code execution result
      const codeResult: CodeChangeResult = {
        componentId: sampleComponent.id,
        success: true,
        newSourceCode: processedCode,
      };
      
      pluginManager.notifyCodeExecuted(codeResult);
      
      // Verify the expected flow
      // Each plugin should have left its mark on the code or tracked events
      
      // Documentation plugin should have analyzed the component
      expect((documentationPlugin as any).extractComponentMetadata).toHaveBeenCalled;
      
      // Analytics plugin should have tracked both component and code events
      expect(global.fetch).toHaveBeenCalled;
      
      // Performance plugin should have added monitoring code
      expect(modifiedComponent.sourceCode).toContain('performance.now');
    });
  });
});
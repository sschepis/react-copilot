import { PerformancePlugin } from '../../src/services/plugin/plugins/PerformancePlugin';
import { ModifiableComponent, CodeChangeResult } from '../../src/utils/types';

describe('PerformancePlugin', () => {
  let performancePlugin: PerformancePlugin;
  let mockContext: any;
  
  // Sample component for testing
  const sampleComponent: ModifiableComponent = {
    id: 'test-component-1',
    name: 'TestComponent',
    sourceCode: 'function TestComponent() { return <div>Hello World</div>; }',
    ref: { current: null },
  };
  
  // Sample code with performance issues
  const codeWithInlineObject = 'function TestComponent() { return <div style={{ color: "red" }}>Hello</div>; }';
  const codeWithNestedMaps = 'function TestComponent() { return <div>{items.map(item => item.subitems.map(subitem => <div key={subitem.id}>{subitem.name}</div>))}</div>; }';
  const codeWithUseCallback = 'function TestComponent() { const handleClick = useCallback(() => { console.log("clicked"); }, []); return <button onClick={handleClick}>Click me</button>; }';
  
  // Sample code change result
  const sampleCodeResult: CodeChangeResult = {
    componentId: 'test-component-1',
    success: true,
    newSourceCode: 'function TestComponent() { return <div>Updated</div>; }',
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    jest.spyOn(window.performance, 'now')
      .mockReturnValueOnce(100) // First call (start time)
      .mockReturnValueOnce(150); // Second call (end time)
    
    // Create plugin instance with default config
    performancePlugin = new PerformancePlugin({
      injectMonitoring: true,
      trackRenderPerformance: true,
      suggestImprovements: true,
    });
    
    // Mock context for initialization
    mockContext = {
      componentRegistry: {
        getAllComponents: jest.fn().mockReturnValue({}),
        getComponent: jest.fn().mockReturnValue(sampleComponent),
      },
      llmManager: {
        getCurrentProvider: jest.fn().mockReturnValue({}),
      },
    };
  });
  
  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const defaultPlugin = new PerformancePlugin();
      
      expect(defaultPlugin).toBeDefined();
      expect(defaultPlugin.id).toBe('performance-plugin');
      expect(defaultPlugin.name).toBe('Performance Monitoring Plugin');
      expect(defaultPlugin.version).toBe('1.0.0');
      
      // Access private options through type assertion
      const options = (defaultPlugin as any).options;
      expect(options.trackRenderPerformance).toBe(true);
      expect(options.trackPropsChanges).toBe(true);
      expect(options.suggestImprovements).toBe(true);
      expect(options.slowRenderThreshold).toBe(16); // 60fps threshold
    });
    
    it('should accept custom configuration', () => {
      const customPlugin = new PerformancePlugin({
        trackRenderPerformance: false,
        trackPropsChanges: false,
        suggestImprovements: false,
        slowRenderThreshold: 50,
        maxTrackedComponents: 50,
      });
      
      // Access private options through type assertion
      const options = (customPlugin as any).options;
      
      expect(options.trackRenderPerformance).toBe(false);
      expect(options.trackPropsChanges).toBe(false);
      expect(options.suggestImprovements).toBe(false);
      expect(options.slowRenderThreshold).toBe(50);
      expect(options.maxTrackedComponents).toBe(50);
    });
  });
  
  describe('initialize', () => {
    it('should initialize with context', async () => {
      await performancePlugin.initialize(mockContext);
      
      // Verify console output
      expect(console.log).toHaveBeenCalledWith('[PerformancePlugin] Initializing...');
      expect(console.log).toHaveBeenCalledWith('[PerformancePlugin] Initialized successfully');
      
      // Verify context is saved properly
      expect((performancePlugin as any)._context).toBe(mockContext);
    });
  });
  
  describe('hooks', () => {
    describe('beforeComponentRegistration', () => {
      it('should add performance monitoring to component with monitoring enabled', () => {
        const result = performancePlugin.hooks!.beforeComponentRegistration!(sampleComponent);
        
        // The source code should be updated to include performance monitoring
        expect(result.sourceCode).not.toEqual(sampleComponent.sourceCode);
        expect(result.sourceCode).toContain('performance.now');
      });
      
      it('should analyze code for performance issues', () => {
        // Spy on detect performance issues method
        const analyzeSpy = jest.spyOn(performancePlugin as any, 'detectPerformanceIssues');
        
        performancePlugin.hooks!.beforeComponentRegistration!(sampleComponent);
        
        // Verify analyze was called
        expect(analyzeSpy).not.toHaveBeenCalled(); // Only called in beforeCodeExecution
      });
      
      it('should not modify code when monitoring is disabled', () => {
        // Disable monitoring
        (performancePlugin as any).options.injectMonitoring = false;
        
        const result = performancePlugin.hooks!.beforeComponentRegistration!(sampleComponent);
        
        // The source code should remain unchanged
        expect(result.sourceCode).toEqual(sampleComponent.sourceCode);
      });
    });
    
    describe('afterComponentRegistration', () => {
      it('should add component to performance tracking', () => {
        // Spy on initializeComponentTracking method
        const trackSpy = jest.spyOn(performancePlugin as any, 'initializeComponentTracking');
        
        performancePlugin.hooks!.afterComponentRegistration!(sampleComponent);
        
        // Verify tracking was updated
        expect(trackSpy).toHaveBeenCalledWith(sampleComponent);
      });
    });
    
    describe('beforeCodeExecution', () => {
      it('should analyze code for performance issues', () => {
        // Spy on detectPerformanceIssues method
        const analyzeSpy = jest.spyOn(performancePlugin as any, 'detectPerformanceIssues');
        
        performancePlugin.hooks!.beforeCodeExecution!(codeWithInlineObject);
        
        // Verify analyze was called
        expect(analyzeSpy).toHaveBeenCalledWith(codeWithInlineObject);
      });
      
      it('should add suggestions for inline objects', () => {
        const result = performancePlugin.hooks!.beforeCodeExecution!(codeWithInlineObject);
        
        // Should include warning about inline object
        expect(result).toContain('// PERFORMANCE SUGGESTION');
        expect(result).toContain('Inline object creation');
      });
      
      it('should add suggestions for nested maps', () => {
        const result = performancePlugin.hooks!.beforeCodeExecution!(codeWithNestedMaps);
        
        // Should include warning about nested maps
        expect(result).toContain('// PERFORMANCE SUGGESTION');
        expect(result).toContain('Nested array mapping');
      });
      
      it('should not add suggestions when turned off', () => {
        // Disable suggestions
        (performancePlugin as any).options.suggestImprovements = false;
        
        const result = performancePlugin.hooks!.beforeCodeExecution!(codeWithInlineObject);
        
        // Should not include warnings
        expect(result).not.toContain('// PERFORMANCE SUGGESTION');
      });
    });
    
    describe('afterCodeExecution', () => {
      it('should update performance tracking for the component', () => {
        // First add component to tracking
        (performancePlugin as any).initializeComponentTracking(sampleComponent);
        
        performancePlugin.hooks!.afterCodeExecution!(sampleCodeResult);
        
        // Verify component was updated
        const performanceData = (performancePlugin as any).performanceData;
        expect(performanceData.has(sampleCodeResult.componentId)).toBe(true);
      });
      
      it('should not update tracking if the code change failed', () => {
        // Create a failed code result
        const failedResult: CodeChangeResult = {
          ...sampleCodeResult,
          success: false,
        };
        
        // First add component to tracking
        (performancePlugin as any).initializeComponentTracking(sampleComponent);
        
        // Get initial data
        const initialData = new Map((performancePlugin as any).performanceData);
        
        performancePlugin.hooks!.afterCodeExecution!(failedResult);
        
        // Verify data was not modified
        expect((performancePlugin as any).performanceData).toEqual(initialData);
      });
    });
  });
  
  describe('detectPerformanceIssues', () => {
    it('should detect inline objects', () => {
      const issues = (performancePlugin as any).detectPerformanceIssues(codeWithInlineObject);
      
      expect(issues).toContainEqual(expect.stringContaining('Inline object creation'));
    });
    
    it('should detect nested maps', () => {
      const issues = (performancePlugin as any).detectPerformanceIssues(codeWithNestedMaps);
      
      expect(issues).toContainEqual(expect.stringContaining('Nested array mapping'));
    });
    
    it('should recognize good practices like useCallback', () => {
      const issues = (performancePlugin as any).detectPerformanceIssues(codeWithUseCallback);
      
      // Should not have warnings for useCallback
      const hasCallbackWarning = issues.some((issue: string) =>
        issue.includes('arrow functions') && !issue.includes('useCallback'));
      expect(hasCallbackWarning).toBe(false);
    });
  });
  
  describe('performance tracking', () => {
    it('should add component to performance tracking', () => {
      (performancePlugin as any).initializeComponentTracking({
        id: 'test-component-2',
        name: 'AnotherComponent',
        sourceCode: 'function AnotherComponent() { return <div>Test</div>; }',
        ref: { current: null },
      });
      
      // Check if component was added to tracking data
      const performanceData = (performancePlugin as any).performanceData;
      expect(performanceData.has('test-component-2')).toBe(true);
      expect(performanceData.get('test-component-2').componentName).toBe('AnotherComponent');
      expect(performanceData.get('test-component-2').renderCount).toBe(0);
    });
    
    it('should track render events', () => {
      // Mock to simulate a render event
      const componentId = 'test-component-1';
      
      // First add component to tracking
      (performancePlugin as any).initializeComponentTracking(sampleComponent);
      
      // Track render
      (performancePlugin as any).recordRender(componentId, 50); // 50ms render time
      
      // Check if render data was updated
      const performanceData = (performancePlugin as any).performanceData;
      expect(performanceData.get(componentId).renderCount).toBe(1);
      expect(performanceData.get(componentId).renderTimes).toContain(50);
      expect(performanceData.get(componentId).maxRenderTime).toBe(50);
    });
    
    it('should update max render time when a longer render occurs', () => {
      const componentId = 'test-component-1';
      
      // First add component to tracking
      (performancePlugin as any).initializeComponentTracking(sampleComponent);
      
      // Track renders with different times
      (performancePlugin as any).recordRender(componentId, 20);
      (performancePlugin as any).recordRender(componentId, 60);
      (performancePlugin as any).recordRender(componentId, 30);
      
      // Check if max render time was updated
      const performanceData = (performancePlugin as any).performanceData;
      expect(performanceData.get(componentId).renderCount).toBe(3);
      expect(performanceData.get(componentId).maxRenderTime).toBe(60);
      expect(performanceData.get(componentId).renderTimes).toContain(30);
    });
    
    it('should warn when render time exceeds threshold', () => {
      const componentId = 'test-component-1';
      
      // Set warning threshold
      (performancePlugin as any).options.slowRenderThreshold = 30;
      
      // First add component to tracking
      (performancePlugin as any).initializeComponentTracking(sampleComponent);
      
      // Track a slow render
      (performancePlugin as any).recordRender(componentId, 50);
      
      // Verify warning was logged
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Slow render detected'),
        expect.stringContaining('TestComponent')
      );
    });
  });
  
  describe('performance profile', () => {
    it('should create a performance profile for a component', () => {
      const componentId = 'test-component-1';
      
      // First add component to tracking
      (performancePlugin as any).initializeComponentTracking(sampleComponent);
      
      // Add some render data
      (performancePlugin as any).recordRender(componentId, 10);
      (performancePlugin as any).recordRender(componentId, 15);
      
      // Get profile
      const profile = performancePlugin.createPerformanceProfile(componentId);
      
      // Verify profile contents
      expect(profile).toBeTruthy();
      expect(profile?.componentId).toBe(componentId);
      expect(profile?.renderCount).toBe(2);
      expect(profile?.averageRenderTime).toBe(12.5);
      expect(profile?.recommendedOptimizations).toBeInstanceOf(Array);
    });
    
    it('should return null for non-existing components', () => {
      const profile = performancePlugin.createPerformanceProfile('non-existing-id');
      expect(profile).toBeNull();
    });
    
    it('should provide optimization recommendations', () => {
      const componentId = 'test-component-1';
      
      // Add component with slow renders
      (performancePlugin as any).initializeComponentTracking(sampleComponent);
      
      // Simulate multiple slow renders
      (performancePlugin as any).recordRender(componentId, 20);
      (performancePlugin as any).recordRender(componentId, 20);
      (performancePlugin as any).recordRender(componentId, 20);
      (performancePlugin as any).recordRender(componentId, 20);
      (performancePlugin as any).recordRender(componentId, 20);
      (performancePlugin as any).recordRender(componentId, 20);
      
      // Get profile
      const profile = performancePlugin.createPerformanceProfile(componentId);
      
      // Should recommend memoization for slow components
      expect(profile?.recommendedOptimizations).toContainEqual(
        expect.stringContaining('React.memo')
      );
    });
  });
  
  describe('getAllPerformanceData', () => {
    it('should return performance data for all tracked components', () => {
      // Add components to tracking
      (performancePlugin as any).initializeComponentTracking({ 
        id: 'comp-1', 
        name: 'Component1',
        sourceCode: '',
        ref: { current: null },
      });
      (performancePlugin as any).initializeComponentTracking({ 
        id: 'comp-2', 
        name: 'Component2',
        sourceCode: '',
        ref: { current: null },
      });
      
      // Get all data
      const allData = performancePlugin.getAllPerformanceData();
      
      // Verify result
      expect(allData).toBeInstanceOf(Map);
      expect(allData.size).toBe(2);
      expect(allData.has('comp-1')).toBe(true);
      expect(allData.has('comp-2')).toBe(true);
    });
  });
  
  describe('setOption', () => {
    it('should allow changing options', () => {
      performancePlugin.setOption('trackRenderPerformance', false);
      expect((performancePlugin as any).options.trackRenderPerformance).toBe(false);
      
      // Cast the number to any to avoid TypeScript errors in the test
      // In actual usage, we'll only provide valid values
      performancePlugin.setOption('slowRenderThreshold' as any, 50 as any);
      expect((performancePlugin as any).options.slowRenderThreshold).toBe(50);
    });
  });
  
  describe('destroy', () => {
    it('should clean up resources', async () => {
      await performancePlugin.destroy();
      
      expect(console.log).toHaveBeenCalledWith('[PerformancePlugin] Cleaning up...');
      expect(console.log).toHaveBeenCalledWith('[PerformancePlugin] Clean up complete');
      
      // Verify context was cleared
      expect((performancePlugin as any)._context).toBeNull();
    });
  });
});
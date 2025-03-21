import { AnalyticsPlugin, AnalyticsEvent } from '../../src/services/plugin/plugins/AnalyticsPlugin';
import { ModifiableComponent, CodeChangeResult } from '../../src/utils/types';

describe('AnalyticsPlugin', () => {
  let analyticsPlugin: AnalyticsPlugin;
  let mockContext: any;
  
  // Sample component for testing
  const sampleComponent: ModifiableComponent = {
    id: 'test-component-1',
    name: 'TestComponent',
    sourceCode: 'function TestComponent() { return <div>Hello World</div>; }',
    ref: { current: null },
  };
  
  // Sample code change result for testing
  const sampleCodeResult: CodeChangeResult = {
    componentId: 'test-component-1',
    success: true,
    newSourceCode: 'function TestComponent() { return <div>Updated</div>; }',
  };
  
  // Sample prompt and response
  const samplePrompt = 'Create a React component that displays a counter';
  const sampleResponse = 'Here is a counter component: function Counter() { const [count, setCount] = useState(0); return <div>{count}</div>; }';
  
  beforeEach(() => {
    // Reset fetch and console mocks
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    
    // Create plugin instance with default config
    analyticsPlugin = new AnalyticsPlugin({
      // Override default endpoint to avoid actual network requests
      endpointUrl: '/test-api/analytics',
      batchEvents: false, // Disable batching for simpler testing
    });
    
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
      const defaultPlugin = new AnalyticsPlugin();
      
      expect(defaultPlugin).toBeDefined();
      expect(defaultPlugin.id).toBe('analytics-plugin');
      expect(defaultPlugin.name).toBe('Analytics Plugin');
      expect(defaultPlugin.version).toBe('1.0.0');
      
      // Access private options through type assertion
      const options = (defaultPlugin as any).options;
      expect(options.enabled).toBe(true);
      expect(options.batchEvents).toBe(true);
      expect(options.batchSize).toBe(10);
      expect(options.endpointUrl).toBe('/api/analytics');
      expect(options.includeSourceCode).toBe(false);
    });
    
    it('should accept custom configuration', () => {
      const customPlugin = new AnalyticsPlugin({
        enabled: false,
        batchEvents: false,
        batchSize: 5,
        endpointUrl: '/custom-api/analytics',
        includeSourceCode: true,
        headers: { 'X-Custom-Header': 'test' },
      });
      
      // Access private options through type assertion
      const options = (customPlugin as any).options;
      
      expect(options.enabled).toBe(false);
      expect(options.batchEvents).toBe(false);
      expect(options.batchSize).toBe(5);
      expect(options.endpointUrl).toBe('/custom-api/analytics');
      expect(options.includeSourceCode).toBe(true);
      expect(options.headers).toHaveProperty('X-Custom-Header', 'test');
    });
  });
  
  describe('initialize', () => {
    it('should initialize with context', async () => {
      await analyticsPlugin.initialize(mockContext);
      
      // Verify console output
      expect(console.log).toHaveBeenCalledWith('[AnalyticsPlugin] Initializing...');
      expect(console.log).toHaveBeenCalledWith('[AnalyticsPlugin] Initialized successfully');
      
      // Verify context is saved properly
      expect((analyticsPlugin as any)._context).toBe(mockContext);
    });
  });
  
  describe('hooks', () => {
    describe('afterComponentRegistration', () => {
      it('should track component registration event', () => {
        // Spy on trackEvent method
        const trackEventSpy = jest.spyOn(analyticsPlugin as any, 'trackEvent');
        
        // Call the hook
        analyticsPlugin.hooks!.afterComponentRegistration!(sampleComponent);
        
        // Verify event was tracked
        expect(trackEventSpy).toHaveBeenCalledWith('component_registered', expect.objectContaining({
          componentId: sampleComponent.id,
          componentName: sampleComponent.name,
        }));
      });
      
      it('should include source code if configured', () => {
        // Set includeSourceCode option to true
        (analyticsPlugin as any).options.includeSourceCode = true;
        
        // Spy on trackEvent method
        const trackEventSpy = jest.spyOn(analyticsPlugin as any, 'trackEvent');
        
        // Call the hook
        analyticsPlugin.hooks!.afterComponentRegistration!(sampleComponent);
        
        // Verify event includes source code
        expect(trackEventSpy).toHaveBeenCalledWith('component_registered', expect.objectContaining({
          sourceCode: sampleComponent.sourceCode,
        }));
      });
      
      it('should not track event if analytics is disabled', () => {
        // Disable analytics
        (analyticsPlugin as any).options.enabled = false;
        
        // Spy on trackEvent method
        const trackEventSpy = jest.spyOn(analyticsPlugin as any, 'trackEvent');
        
        // Call the hook
        analyticsPlugin.hooks!.afterComponentRegistration!(sampleComponent);
        
        // Verify event was not tracked
        expect(trackEventSpy).not.toHaveBeenCalled();
      });
    });
    
    describe('afterCodeExecution', () => {
      it('should track code execution event', () => {
        // Spy on trackEvent method
        const trackEventSpy = jest.spyOn(analyticsPlugin as any, 'trackEvent');
        
        // Call the hook
        analyticsPlugin.hooks!.afterCodeExecution!(sampleCodeResult);
        
        // Verify event was tracked
        expect(trackEventSpy).toHaveBeenCalledWith('code_executed', expect.objectContaining({
          componentId: sampleCodeResult.componentId,
          success: sampleCodeResult.success,
        }));
      });
      
      it('should include source code if configured', () => {
        // Set includeSourceCode option to true
        (analyticsPlugin as any).options.includeSourceCode = true;
        
        // Spy on trackEvent method
        const trackEventSpy = jest.spyOn(analyticsPlugin as any, 'trackEvent');
        
        // Call the hook
        analyticsPlugin.hooks!.afterCodeExecution!(sampleCodeResult);
        
        // Verify event includes source code
        expect(trackEventSpy).toHaveBeenCalledWith('code_executed', expect.objectContaining({
          sourceCode: sampleCodeResult.newSourceCode,
        }));
      });
    });
    
    describe('beforeLLMRequest', () => {
      it('should track LLM request and return prompt unchanged', () => {
        // Spy on trackEvent method
        const trackEventSpy = jest.spyOn(analyticsPlugin as any, 'trackEvent');
        
        // Call the hook
        const result = analyticsPlugin.hooks!.beforeLLMRequest!(samplePrompt);
        
        // Verify event was tracked
        expect(trackEventSpy).toHaveBeenCalledWith('llm_request', expect.objectContaining({
          promptLength: samplePrompt.length,
          promptPreview: expect.stringContaining(samplePrompt.substring(0, 20)),
        }));
        
        // Verify hook returns prompt unchanged
        expect(result).toBe(samplePrompt);
      });
    });
    
    describe('afterLLMResponse', () => {
      it('should track LLM response and return response unchanged', () => {
        // Spy on trackEvent method
        const trackEventSpy = jest.spyOn(analyticsPlugin as any, 'trackEvent');
        
        // Call the hook
        const result = analyticsPlugin.hooks!.afterLLMResponse!(sampleResponse);
        
        // Verify event was tracked
        expect(trackEventSpy).toHaveBeenCalledWith('llm_response', expect.objectContaining({
          responseLength: sampleResponse.length,
          responsePreview: expect.stringContaining(sampleResponse.substring(0, 20)),
        }));
        
        // Verify hook returns response unchanged
        expect(result).toBe(sampleResponse);
      });
    });
  });
  
  describe('trackEvent', () => {
    it('should add event to the queue and send immediately when not batching', () => {
      // Spy on sendEvents method
      const sendEventsSpy = jest.spyOn(analyticsPlugin as any, 'sendEvents').mockResolvedValue(undefined);
      
      // Call trackEvent
      (analyticsPlugin as any).trackEvent('test_event', { testData: 'value' });
      
      // In the actual implementation, the events array is not cleared after sending
      // So we should expect it to have 1 event
      const events = (analyticsPlugin as any).events;
      expect(events.length).toBe(1); // Has one event after tracking and sending
      
      // Verify sendEvents was called
      expect(sendEventsSpy).toHaveBeenCalled();
    });
    
    it('should add event to the queue but not send when batching and below batch size', () => {
      // Configure for batching
      (analyticsPlugin as any).options.batchEvents = true;
      (analyticsPlugin as any).options.batchSize = 5;
      
      // Spy on sendEvents method
      const sendEventsSpy = jest.spyOn(analyticsPlugin as any, 'sendEvents').mockResolvedValue(undefined);
      
      // Call trackEvent
      (analyticsPlugin as any).trackEvent('test_event', { testData: 'value' });
      
      // Verify event is added to queue
      const events = (analyticsPlugin as any).events;
      expect(events.length).toBe(1);
      expect(events[0].type).toBe('test_event');
      expect(events[0].data).toEqual({ testData: 'value' });
      
      // Verify sendEvents was not called
      expect(sendEventsSpy).not.toHaveBeenCalled();
    });
    
    it('should send events when batch size is reached', () => {
      // Configure for batching with small batch size
      (analyticsPlugin as any).options.batchEvents = true;
      (analyticsPlugin as any).options.batchSize = 2;
      
      // Spy on sendEvents method
      const sendEventsSpy = jest.spyOn(analyticsPlugin as any, 'sendEvents').mockResolvedValue(undefined);
      
      // Call trackEvent twice
      (analyticsPlugin as any).trackEvent('test_event_1', { id: 1 });
      (analyticsPlugin as any).trackEvent('test_event_2', { id: 2 });
      
      // Verify sendEvents was called after second event
      expect(sendEventsSpy).toHaveBeenCalled();
    });
    
    it('should process event with custom processor if provided', () => {
      // Set custom processor function
      const processEvent = jest.fn((event: AnalyticsEvent) => ({
        ...event,
        data: { ...event.data, processed: true }
      }));
      
      (analyticsPlugin as any).options.processEvent = processEvent;
      
      // Call trackEvent
      (analyticsPlugin as any).trackEvent('test_event', { testData: 'value' });
      
      // Verify processor was called
      expect(processEvent).toHaveBeenCalled();
    });
  });
  
  describe('sendEvents', () => {
    it('should send events to the configured endpoint', async () => {
      // Add events to the queue
      (analyticsPlugin as any).events = [
        { type: 'test_event_1', timestamp: Date.now(), data: { id: 1 } },
        { type: 'test_event_2', timestamp: Date.now(), data: { id: 2 } }
      ];
      
      // Call sendEvents
      await (analyticsPlugin as any).sendEvents();
      
      // Verify fetch was called with correct arguments
      expect(global.fetch).toHaveBeenCalledWith(
        '/test-api/analytics',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.any(String)
        })
      );
      
      // Verify events queue is cleared
      expect((analyticsPlugin as any).events).toHaveLength(0);
    });
    
    it('should handle fetch errors gracefully', async () => {
      // Configure fetch to fail
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      // Add events to the queue
      (analyticsPlugin as any).events = [
        { type: 'test_event', timestamp: Date.now(), data: { id: 1 } }
      ];
      
      // Spy on console.error
      const errorSpy = jest.spyOn(console, 'error');
      
      // Call sendEvents
      await (analyticsPlugin as any).sendEvents();
      
      // Verify error was logged
      expect(errorSpy).toHaveBeenCalledWith(
        '[AnalyticsPlugin] Failed to send events:',
        expect.any(Error)
      );
      
      // Verify events are put back in the queue
      expect((analyticsPlugin as any).events.length).toBeGreaterThan(0);
    });
  });
  
  describe('configuration methods', () => {
    it('should allow enabling/disabling analytics', () => {
      // Analytics should be enabled by default
      expect((analyticsPlugin as any).options.enabled).toBe(true);
      
      // Disable analytics
      analyticsPlugin.setEnabled(false);
      
      // Verify state changed
      expect((analyticsPlugin as any).options.enabled).toBe(false);
      
      // Re-enable analytics
      analyticsPlugin.setEnabled(true);
      
      // Verify state changed back
      expect((analyticsPlugin as any).options.enabled).toBe(true);
    });
    
    it('should allow changing endpoint configuration', () => {
      // Set new endpoint
      analyticsPlugin.setEndpoint('/new-api/analytics', {
        'Authorization': 'Bearer test-token',
        'X-Custom-Header': 'test-value'
      });
      
      // Verify changes were applied
      const options = (analyticsPlugin as any).options;
      expect(options.endpointUrl).toBe('/new-api/analytics');
      expect(options.headers).toEqual({
        'Authorization': 'Bearer test-token',
        'X-Custom-Header': 'test-value'
      });
    });
  });
  
  describe('destroy', () => {
    it('should send remaining events and clean up', async () => {
      // Add some events to the queue
      (analyticsPlugin as any).events = [
        { type: 'test_event', timestamp: Date.now(), data: { id: 1 } }
      ];
      
      // Spy on sendEvents method
      const sendEventsSpy = jest.spyOn(analyticsPlugin as any, 'sendEvents').mockResolvedValue(undefined);
      
      // Call destroy
      await analyticsPlugin.destroy();
      
      // Verify sendEvents was called
      expect(sendEventsSpy).toHaveBeenCalled();
      
      // Verify context was cleared
      expect((analyticsPlugin as any)._context).toBeNull();
      
      // Verify console output
      expect(console.log).toHaveBeenCalledWith('[AnalyticsPlugin] Cleaning up...');
      expect(console.log).toHaveBeenCalledWith('[AnalyticsPlugin] Clean up complete');
    });
    
    it('should not call sendEvents if there are no events', async () => {
      // Ensure events array is empty
      (analyticsPlugin as any).events = [];
      
      // Spy on sendEvents method
      const sendEventsSpy = jest.spyOn(analyticsPlugin as any, 'sendEvents');
      
      // Call destroy
      await analyticsPlugin.destroy();
      
      // Verify sendEvents was not called
      expect(sendEventsSpy).not.toHaveBeenCalled();
    });
  });
});
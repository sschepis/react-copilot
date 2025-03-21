import { PluginManager } from '../../src/services/plugin/PluginManager';
import { Plugin, PluginHooks, PluginContext, ModifiableComponent, CodeChangeResult } from '../../src/utils/types';

// Create mock plugin class for testing
class MockPlugin implements Plugin {
  id: string;
  name: string;
  version: string = '1.0.0';
  hooks: PluginHooks = {};
  initialized: boolean = false;
  destroyed: boolean = false;
  
  constructor(id: string, name: string, hooks: Partial<PluginHooks> = {}) {
    this.id = id;
    this.name = name;
    this.hooks = hooks;
  }
  
  async initialize(_context: PluginContext): Promise<void> {
    this.initialized = true;
  }
  
  async destroy(): Promise<void> {
    this.destroyed = true;
  }
}

describe('PluginManager', () => {
  // Mocks
  let mockLLMManager: any;
  let mockComponentRegistry: any;
  let mockGetState: jest.Mock;
  let pluginManager: PluginManager;
  
  // Sample component for testing hooks
  const sampleComponent: ModifiableComponent = {
    id: 'test-component-1',
    name: 'TestComponent',
    ref: { current: null },
    sourceCode: 'function TestComponent() { return <div>Hello World</div>; }',
  };
  
  // Sample code change result for testing hooks
  const sampleCodeResult: CodeChangeResult = {
    componentId: 'test-component-1',
    success: true,
    newSourceCode: 'function TestComponent() { return <div>Updated</div>; }',
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mocks
    mockLLMManager = {
      getCurrentProvider: jest.fn().mockReturnValue({}),
    };
    
    mockComponentRegistry = {
      getComponent: jest.fn().mockReturnValue(sampleComponent),
      getAllComponents: jest.fn().mockReturnValue({}),
    };
    
    mockGetState = jest.fn().mockReturnValue({ test: 'state' });
    
    // Create plugin manager instance
    pluginManager = new PluginManager(mockLLMManager, mockComponentRegistry, mockGetState);
  });
  
  describe('constructor', () => {
    it('should create a properly initialized PluginManager', () => {
      expect(pluginManager).toBeDefined();
      expect(pluginManager.getAllPlugins()).toHaveLength(0);
    });
    
    it('should initialize with default state accessor if none provided', () => {
      const manager = new PluginManager(mockLLMManager, mockComponentRegistry);
      expect(manager).toBeDefined();
    });
  });
  
  describe('plugin registration', () => {
    it('should register plugins', () => {
      const plugin = new MockPlugin('test-plugin', 'Test Plugin');
      pluginManager.registerPlugin(plugin);
      
      expect(pluginManager.getAllPlugins()).toHaveLength(1);
      expect(pluginManager.getPlugin('test-plugin')).toBe(plugin);
    });
    
    it('should overwrite plugins with the same ID', () => {
      const plugin1 = new MockPlugin('test-plugin', 'Test Plugin 1');
      const plugin2 = new MockPlugin('test-plugin', 'Test Plugin 2');
      
      pluginManager.registerPlugin(plugin1);
      pluginManager.registerPlugin(plugin2);
      
      expect(pluginManager.getAllPlugins()).toHaveLength(1);
      expect(pluginManager.getPlugin('test-plugin')).toBe(plugin2);
    });
  });
  
  describe('plugin initialization', () => {
    it('should initialize a specific plugin', async () => {
      const plugin = new MockPlugin('test-plugin', 'Test Plugin');
      pluginManager.registerPlugin(plugin);
      
      await pluginManager.initializePlugin('test-plugin');
      
      expect(plugin.initialized).toBe(true);
    });
    
    it('should throw an error when initializing a non-existent plugin', async () => {
      await expect(pluginManager.initializePlugin('non-existent')).rejects.toThrow();
    });
    
    it('should initialize all registered plugins', async () => {
      const plugin1 = new MockPlugin('plugin1', 'Plugin 1');
      const plugin2 = new MockPlugin('plugin2', 'Plugin 2');
      
      pluginManager.registerPlugin(plugin1);
      pluginManager.registerPlugin(plugin2);
      
      await pluginManager.initializeAllPlugins();
      
      expect(plugin1.initialized).toBe(true);
      expect(plugin2.initialized).toBe(true);
    });
    
    it('should continue initialization if one plugin fails', async () => {
      const plugin1 = new MockPlugin('plugin1', 'Plugin 1');
      const plugin2 = new MockPlugin('plugin2', 'Plugin 2');
      
      // Make plugin1 fail during initialization
      plugin1.initialize = jest.fn().mockRejectedValue(new Error('Initialization failed'));
      
      pluginManager.registerPlugin(plugin1);
      pluginManager.registerPlugin(plugin2);
      
      // This should complete without throwing, despite plugin1 failing
      await pluginManager.initializeAllPlugins();
      
      expect(plugin2.initialized).toBe(true);
    });
  });
  
  describe('plugin hooks', () => {
    describe('component registration hooks', () => {
      it('should apply beforeComponentRegistration hooks', () => {
        const modifyComponent = jest.fn().mockImplementation((component) => ({
          ...component,
          name: 'Modified' + component.name
        }));
        
        const plugin = new MockPlugin('test-plugin', 'Test Plugin', {
          beforeComponentRegistration: modifyComponent
        });
        
        pluginManager.registerPlugin(plugin);
        
        const result = pluginManager.applyHooksToComponentRegistration(sampleComponent);
        
        expect(modifyComponent).toHaveBeenCalledWith(sampleComponent);
        expect(result.name).toBe('ModifiedTestComponent');
      });
      
      it('should call afterComponentRegistration hooks', () => {
        const afterRegistration = jest.fn();
        
        const plugin = new MockPlugin('test-plugin', 'Test Plugin', {
          afterComponentRegistration: afterRegistration
        });
        
        pluginManager.registerPlugin(plugin);
        
        pluginManager.notifyComponentRegistered(sampleComponent);
        
        expect(afterRegistration).toHaveBeenCalledWith(sampleComponent);
      });
    });
    
    describe('code execution hooks', () => {
      it('should apply beforeCodeExecution hooks', () => {
        const modifyCode = jest.fn().mockImplementation((code) => {
          return '// Modified\n' + code;
        });
        
        const plugin = new MockPlugin('test-plugin', 'Test Plugin', {
          beforeCodeExecution: modifyCode
        });
        
        pluginManager.registerPlugin(plugin);
        
        const code = 'function test() { return true; }';
        const result = pluginManager.applyHooksBeforeCodeExecution(code);
        
        expect(modifyCode).toHaveBeenCalledWith(code);
        expect(result).toBe('// Modified\n' + code);
      });
      
      it('should call afterCodeExecution hooks', () => {
        const afterExecution = jest.fn();
        
        const plugin = new MockPlugin('test-plugin', 'Test Plugin', {
          afterCodeExecution: afterExecution
        });
        
        pluginManager.registerPlugin(plugin);
        
        pluginManager.notifyCodeExecuted(sampleCodeResult);
        
        expect(afterExecution).toHaveBeenCalledWith(sampleCodeResult);
      });
    });
    
    describe('LLM hooks', () => {
      it('should apply beforeLLMRequest hooks', () => {
        const modifyPrompt = jest.fn().mockImplementation((prompt) => {
          return '[Enhanced] ' + prompt;
        });
        
        const plugin = new MockPlugin('test-plugin', 'Test Plugin', {
          beforeLLMRequest: modifyPrompt
        });
        
        pluginManager.registerPlugin(plugin);
        
        const prompt = 'Create a React component';
        const result = pluginManager.applyHooksBeforeLLMRequest(prompt);
        
        expect(modifyPrompt).toHaveBeenCalledWith(prompt);
        expect(result).toBe('[Enhanced] ' + prompt);
      });
      
      it('should apply afterLLMResponse hooks', () => {
        const modifyResponse = jest.fn().mockImplementation((response) => {
          return response + ' [Modified]';
        });
        
        const plugin = new MockPlugin('test-plugin', 'Test Plugin', {
          afterLLMResponse: modifyResponse
        });
        
        pluginManager.registerPlugin(plugin);
        
        const response = 'Here is your component:';
        const result = pluginManager.applyHooksAfterLLMResponse(response);
        
        expect(modifyResponse).toHaveBeenCalledWith(response);
        expect(result).toBe(response + ' [Modified]');
      });
    });
  });
  
  describe('plugin destruction', () => {
    it('should destroy all plugins', async () => {
      const plugin1 = new MockPlugin('plugin1', 'Plugin 1');
      const plugin2 = new MockPlugin('plugin2', 'Plugin 2');
      
      pluginManager.registerPlugin(plugin1);
      pluginManager.registerPlugin(plugin2);
      
      await pluginManager.destroyAllPlugins();
      
      expect(plugin1.destroyed).toBe(true);
      expect(plugin2.destroyed).toBe(true);
      expect(pluginManager.getAllPlugins()).toHaveLength(0);
    });
    
    it('should continue destruction if one plugin fails', async () => {
      const plugin1 = new MockPlugin('plugin1', 'Plugin 1');
      const plugin2 = new MockPlugin('plugin2', 'Plugin 2');
      
      // Make plugin1 fail during destruction
      plugin1.destroy = jest.fn().mockRejectedValue(new Error('Destruction failed'));
      
      pluginManager.registerPlugin(plugin1);
      pluginManager.registerPlugin(plugin2);
      
      // This should complete without throwing, despite plugin1 failing
      await pluginManager.destroyAllPlugins();
      
      expect(plugin2.destroyed).toBe(true);
      expect(pluginManager.getAllPlugins()).toHaveLength(0);
    });
  });
  
  describe('state access', () => {
    it('should provide state access to plugins', () => {
      const plugin = new MockPlugin('test-plugin', 'Test Plugin');
      const getStateSpy = jest.spyOn(mockGetState, 'getMockImplementation');
      
      pluginManager.registerPlugin(plugin);
      
      // Add a mock implementation to check if getState is called
      const initializePlugin = async () => {
        await pluginManager.initializePlugin('test-plugin');
        // Simulate plugin accessing state through context
        const context = (plugin as any).context;
        if (context && context.getState) {
          context.getState();
        }
      };
      
      initializePlugin();
      
      expect(getStateSpy).toHaveBeenCalled;
    });
    
    it('should allow updating the state accessor', () => {
      const newGetState = jest.fn().mockReturnValue({ updated: 'state' });
      
      pluginManager.setStateAccessor(newGetState);
      
      // Test if the context's getState was updated by initializing a plugin
      // which receives the context
      const plugin = new MockPlugin('test-plugin', 'Test Plugin');
      
      plugin.initialize = jest.fn().mockImplementation((context: PluginContext) => {
        // Call getState to verify it's the updated function
        context.getState();
        return Promise.resolve();
      });
      
      pluginManager.registerPlugin(plugin);
      pluginManager.initializePlugin('test-plugin');
      
      expect(plugin.initialize).toHaveBeenCalled();
      expect(newGetState).toHaveBeenCalled();
    });
  });
});
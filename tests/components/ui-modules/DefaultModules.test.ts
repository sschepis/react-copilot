import { DefaultModules, registerDefaultModules } from '../../../src/components/ui-modules/DefaultModules';
import { moduleRegistry } from '../../../src/components/ui-modules/ModuleRegistry';
import { DebugPanel } from '../../../src/components/debug/DebugPanel';
import { ChatOverlay } from '../../../src/components/ChatOverlay';
import { MultiModalChatOverlay } from '../../../src/components/MultiModalChatOverlay';

// Mock the component imports
jest.mock('../../../src/components/debug/DebugPanel', () => ({
  DebugPanel: jest.fn(),
}));

jest.mock('../../../src/components/ChatOverlay', () => ({
  ChatOverlay: jest.fn(),
}));

jest.mock('../../../src/components/MultiModalChatOverlay', () => ({
  MultiModalChatOverlay: jest.fn(),
}));

// Mock the registry
jest.mock('../../../src/components/ui-modules/ModuleRegistry', () => ({
  moduleRegistry: {
    register: jest.fn(),
    registerMany: jest.fn(),
  },
  registerModules: jest.fn(),
}));

describe('DefaultModules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should export the default modules', () => {
    // Check that all default modules are exported
    expect(DefaultModules).toHaveLength(3);
    
    // Check that each module has the correct properties
    const moduleIds = DefaultModules.map(m => m.id);
    expect(moduleIds).toContain('debug-panel');
    expect(moduleIds).toContain('chat-overlay');
    expect(moduleIds).toContain('multimodal-chat-overlay');
    
    // Check that each module has the correct component
    const debugModule = DefaultModules.find(m => m.id === 'debug-panel');
    const chatModule = DefaultModules.find(m => m.id === 'chat-overlay');
    const multiModalModule = DefaultModules.find(m => m.id === 'multimodal-chat-overlay');
    
    expect(debugModule?.component).toBe(DebugPanel);
    expect(chatModule?.component).toBe(ChatOverlay);
    expect(multiModalModule?.component).toBe(MultiModalChatOverlay);
  });
  
  test('registerDefaultModules should register all default modules', () => {
    registerDefaultModules();
    
    // Check that registerModules was called with all default modules
    expect(moduleRegistry.registerMany).toHaveBeenCalledWith(DefaultModules);
  });
});
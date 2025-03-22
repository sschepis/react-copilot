import React from 'react';
import { 
  ModuleProvider, 
  registerDefaultModules,
  ChatOverlayModule,
  DebugPanelModule,
  useModuleVisibility
} from '../../../src/components/ui-modules';

// Register all default modules
registerDefaultModules();

/**
 * Custom component to show how to check module visibility
 */
const ModuleStatusDisplay: React.FC = () => {
  const { visibilityState, toggleModule } = useModuleVisibility();
  
  return (
    <div style={{ 
      padding: '20px', 
      margin: '20px', 
      border: '1px solid #ccc',
      borderRadius: '5px',
      background: '#f9f9f9'
    }}>
      <h3>Module Status</h3>
      <p>
        Chat Overlay: 
        <span style={{ 
          color: visibilityState[ChatOverlayModule.id] ? 'green' : 'red',
          fontWeight: 'bold',
          marginLeft: '5px'
        }}>
          {visibilityState[ChatOverlayModule.id] ? 'Enabled' : 'Disabled'}
        </span>
        <button 
          onClick={() => toggleModule(ChatOverlayModule.id)}
          style={{ marginLeft: '10px' }}
        >
          Toggle
        </button>
      </p>
      
      <p>
        Debug Panel: 
        <span style={{ 
          color: visibilityState[DebugPanelModule.id] ? 'green' : 'red',
          fontWeight: 'bold',
          marginLeft: '5px'
        }}>
          {visibilityState[DebugPanelModule.id] ? 'Enabled' : 'Disabled'}
        </span>
        <button 
          onClick={() => toggleModule(DebugPanelModule.id)}
          style={{ marginLeft: '10px' }}
        >
          Toggle
        </button>
      </p>
      
      <p style={{ fontSize: '0.8em', color: '#666', marginTop: '20px' }}>
        You can also toggle modules using the UI Modules panel (Alt+M)
      </p>
    </div>
  );
};

/**
 * Example application using the modular UI system
 */
export const ModularUIExample: React.FC = () => {
  return (
    <ModuleProvider
      // You can specify which modules to include (omitting this includes all registered modules)
      modules={[ChatOverlayModule.id, DebugPanelModule.id]}
      // Override default visibility settings
      defaultVisibility={{
        [ChatOverlayModule.id]: true,
        [DebugPanelModule.id]: false
      }}
      // Control panel configuration
      enableControlPanel={true}
      controlPanelPosition="top-right"
    >
      <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Modular UI Example</h1>
        <p>
          This example demonstrates the modular UI system. The system allows you to:
        </p>
        <ul>
          <li>Selectively include UI modules in your application</li>
          <li>Toggle the visibility of included modules at runtime</li>
          <li>Configure default visibility settings</li>
          <li>Use the control panel to manage modules</li>
        </ul>
        
        <ModuleStatusDisplay />
        
        <p>
          In this example, we've included:
        </p>
        <ul>
          <li><strong>Chat Overlay</strong> - A simple chat interface for LLM interactions</li>
          <li><strong>Debug Panel</strong> - Advanced debugging tools for component inspection</li>
        </ul>
        
        <p>
          Try toggling the modules using the buttons above or the control panel in the top-right corner.
        </p>
      </div>
    </ModuleProvider>
  );
};

export default ModularUIExample;
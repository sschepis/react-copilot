// React is loaded from CDN and available as a global
const React = window.React;
const { useState, useEffect } = React;

import {
  ModuleProvider,
  registerDefaultModules,
  DefaultModules,
  useModuleVisibility
} from '../components/ui-modules';

// Register all default modules
registerDefaultModules();

/**
 * Module toggle component
 */
const ModuleToggles = () => {
  const { visibilityState, toggleModule } = useModuleVisibility();
  
  return (
    <div className="module-toggles">
      <h3>Available Modules</h3>
      <p>Toggle modules to test their functionality:</p>
      
      {DefaultModules.map(module => (
        <button
          key={module.id}
          onClick={() => toggleModule(module.id)}
          className={visibilityState[module.id] ? '' : 'inactive'}
        >
          {module.name}: {visibilityState[module.id] ? 'ON' : 'OFF'}
        </button>
      ))}
      
      <p style={{ fontSize: '0.8em', marginTop: '15px' }}>
        You can also use the control panel in the corner to toggle modules.
      </p>
    </div>
  );
};

/**
 * Development App
 * An empty application that only loads the UI modules for development purposes
 */
export const DevApp = () => {
  // Initialize all modules as visible for development
  const initialVisibility = DefaultModules.reduce<Record<string, boolean>>((acc, module) => {
    acc[module.id] = true;
    return acc;
  }, {});

  return (
    <ModuleProvider
      // Include all modules for development
      defaultVisibility={initialVisibility}
      enableControlPanel={true}
      controlPanelPosition="top-right"
    >
      <div className="dev-container">
        <h1>React-LLM-UI Development Mode</h1>
        <p>
          This is a development environment for testing UI modules in isolation.
          Use the toggles below or the control panel to show/hide different modules.
        </p>
        
        <ModuleToggles />
        
        <div style={{ marginTop: '30px' }}>
          <h3>How to Use</h3>
          <p>
            Interact with the visible modules to test their functionality.
            This environment allows you to focus on module development without
            the complexity of a full application.
          </p>
        </div>
      </div>
    </ModuleProvider>
  );
};

export default DevApp;
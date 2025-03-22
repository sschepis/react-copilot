import React, { createContext, useContext, useEffect, useState } from 'react';
import { ModuleVisibilityContextType, ModuleVisibilityState, UIModule } from './types';
import { moduleRegistry } from './ModuleRegistry';

// Default context value
const defaultContextValue: ModuleVisibilityContextType = {
  visibilityState: {},
  toggleModule: () => {},
  setModuleVisibility: () => {},
  isModuleVisible: () => false,
};

// Create the context
export const ModuleVisibilityContext = createContext<ModuleVisibilityContextType>(defaultContextValue);

// Storage key for persisting visibility state
const STORAGE_KEY = 'ui-module-visibility';

/**
 * Custom hook to use the module visibility context
 */
export const useModuleVisibility = () => useContext(ModuleVisibilityContext);

/**
 * Props for the ModuleVisibilityProvider component
 */
interface ModuleVisibilityProviderProps {
  children: React.ReactNode;
  modules?: string[];
  defaultVisibility?: Record<string, boolean>;
}

/**
 * Provider component for module visibility state
 */
export const ModuleVisibilityProvider: React.FC<ModuleVisibilityProviderProps> = ({
  children,
  modules,
  defaultVisibility = {},
}) => {
  // Initialize state from storage or defaults
  const [visibilityState, setVisibilityState] = useState<ModuleVisibilityState>(() => {
    // Get available modules
    const availableModules = modules
      ? moduleRegistry.filterModules(modules)
      : moduleRegistry.getAllModules();
    
    // Create initial state with module defaults
    const initialState: ModuleVisibilityState = {};
    availableModules.forEach(module => {
      // Priority: defaultVisibility prop > module.defaultVisible
      initialState[module.id] = 
        defaultVisibility[module.id] !== undefined 
          ? defaultVisibility[module.id] 
          : module.defaultVisible;
    });
    
    // Try to load saved state from localStorage
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState) as ModuleVisibilityState;
        
        // Merge saved state with initial state (for new modules)
        return { ...initialState, ...parsedState };
      }
    } catch (error) {
      console.error('Failed to load module visibility settings', error);
    }
    
    return initialState;
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visibilityState));
    } catch (error) {
      console.error('Failed to save module visibility settings', error);
    }
  }, [visibilityState]);

  // Toggle a module's visibility
  const toggleModule = (moduleId: string) => {
    setVisibilityState(prevState => {
      const module = moduleRegistry.getModule(moduleId);
      if (!module) return prevState;
      
      // Calculate the new visibility state for this module
      const currentVisibility = prevState[moduleId] !== undefined 
        ? prevState[moduleId] 
        : module.defaultVisible;
      const newVisibility = !currentVisibility;
      
      // Update the visibility state
      return {
        ...prevState,
        [moduleId]: newVisibility,
      };
    });
  };

  // Set a module's visibility explicitly
  const setModuleVisibility = (moduleId: string, visible: boolean) => {
    setVisibilityState(prevState => ({
      ...prevState,
      [moduleId]: visible,
    }));
  };

  // Check if a module is visible
  const isModuleVisible = (moduleId: string): boolean => {
    const module = moduleRegistry.getModule(moduleId);
    if (!module) return false;
    
    // Get visibility from state or fallback to default
    return visibilityState[moduleId] !== undefined 
      ? visibilityState[moduleId] 
      : module.defaultVisible;
  };

  // Make sure dependencies are visible if a dependent module is visible
  useEffect(() => {
    const availableModules = modules
      ? moduleRegistry.filterModules(modules)
      : moduleRegistry.getAllModules();
    
    // Check for modules that have dependencies
    const modulesWithDeps = availableModules.filter(
      module => module.dependencies && module.dependencies.length > 0
    );
    
    let stateChanged = false;
    const newState = { ...visibilityState };
    
    // Ensure dependencies are visible if their dependents are visible
    modulesWithDeps.forEach(module => {
      if (isModuleVisible(module.id) && module.dependencies) {
        module.dependencies.forEach(depId => {
          if (!isModuleVisible(depId)) {
            newState[depId] = true;
            stateChanged = true;
          }
        });
      }
    });
    
    // Update state if needed
    if (stateChanged) {
      setVisibilityState(newState);
    }
  }, [modules, visibilityState]);

  // Context value
  const contextValue: ModuleVisibilityContextType = {
    visibilityState,
    toggleModule,
    setModuleVisibility,
    isModuleVisible,
  };

  return (
    <ModuleVisibilityContext.Provider value={contextValue}>
      {children}
    </ModuleVisibilityContext.Provider>
  );
};
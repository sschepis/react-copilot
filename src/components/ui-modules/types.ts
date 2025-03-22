import React from 'react';

/**
 * Categories for UI modules for organizational purposes.
 */
export type ModuleCategory = 'debug' | 'chat' | 'tools' | 'custom';

/**
 * Standard interface for all UI modules.
 */
export interface UIModule {
  /** Unique identifier for the module */
  id: string;
  
  /** Display name for the module */
  name: string;
  
  /** Optional description of what the module does */
  description?: string;
  
  /** Whether this module should be visible by default */
  defaultVisible: boolean;
  
  /** Category for organization in the control panel */
  category?: ModuleCategory;
  
  /** The React component to render */
  component: React.ComponentType<any>;
  
  /** Optional array of permissions required to use this module */
  requiredPermissions?: string[];
  
  /** Optional array of module IDs that this module depends on */
  dependencies?: string[];
}

/**
 * Build-time configuration options for the module system.
 */
export interface ModuleConfig {
  /** Modules to include in the build */
  include?: string[];
  
  /** Modules to exclude from the build */
  exclude?: string[];
  
  /** Default visibility settings that override the module defaults */
  defaults?: Record<string, boolean>;
  
  /** Control panel configuration */
  controlPanel?: {
    /** Whether to enable the control panel */
    enabled: boolean;
    
    /** Position of the control panel */
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    
    /** Keyboard shortcut to toggle the control panel */
    shortcut?: string;
  };
}

/**
 * Runtime state of module visibility.
 */
export interface ModuleVisibilityState {
  [moduleId: string]: boolean;
}

/**
 * Context interface for module visibility management.
 */
export interface ModuleVisibilityContextType {
  /** Current visibility state of all modules */
  visibilityState: ModuleVisibilityState;
  
  /** Toggle a module's visibility */
  toggleModule: (moduleId: string) => void;
  
  /** Explicitly set a module's visibility */
  setModuleVisibility: (moduleId: string, visible: boolean) => void;
  
  /** Check if a module is currently visible */
  isModuleVisible: (moduleId: string) => boolean;
}

/**
 * Properties for the ModuleProvider component.
 */
export interface ModuleProviderProps {
  /** Modules to include - overrides the module registry */
  modules?: string[];
  
  /** Default visibility settings - overrides the module defaults */
  defaultVisibility?: Record<string, boolean>;
  
  /** Whether to enable the control panel */
  enableControlPanel?: boolean;
  
  /** Position of the control panel */
  controlPanelPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  
  /** Children components */
  children: React.ReactNode;
}
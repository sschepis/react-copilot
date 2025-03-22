import React from 'react';
import { ModuleProviderProps } from './types';
import { ModuleVisibilityProvider } from './ModuleVisibilityContext';
import { UIControlPanel } from './UIControlPanel';
import { ModuleRenderer } from './ModuleRenderer';

/**
 * Main provider component for the modular UI system.
 * This component sets up the module visibility context, renders the control panel,
 * and renders the visible modules.
 */
export const ModuleProvider: React.FC<ModuleProviderProps> = ({
  modules,
  defaultVisibility,
  enableControlPanel = true,
  controlPanelPosition = 'top-right',
  children,
}) => {
  return (
    <ModuleVisibilityProvider
      modules={modules}
      defaultVisibility={defaultVisibility}
    >
      {children}
      
      {/* Render the UI Control Panel if enabled */}
      {enableControlPanel && (
        <UIControlPanel
          position={controlPanelPosition}
          modules={modules}
        />
      )}
      
      {/* Render all visible modules */}
      <ModuleRenderer modules={modules} />
    </ModuleVisibilityProvider>
  );
};
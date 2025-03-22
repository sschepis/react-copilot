import React, { useState, useEffect } from 'react';
import { ModuleCategory } from './types';
import { moduleRegistry } from './ModuleRegistry';
import { useModuleVisibility } from './ModuleVisibilityContext';

/**
 * Props for the UIControlPanel component
 */
interface UIControlPanelProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  defaultCollapsed?: boolean;
  shortcut?: string;
  width?: number | string;
  modules?: string[];
  showCategories?: boolean;
}

/**
 * Control panel for toggling UI module visibility
 */
export const UIControlPanel: React.FC<UIControlPanelProps> = ({
  position = 'top-right',
  defaultCollapsed = true,
  shortcut = 'Alt+M',
  width = 280,
  modules,
  showCategories = true,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const { visibilityState, toggleModule, isModuleVisible } = useModuleVisibility();

  // Get all available modules
  const availableModules = modules
    ? moduleRegistry.filterModules(modules)
    : moduleRegistry.getAllModules();

  // Group modules by category if enabled
  const modulesByCategory: Record<string, typeof availableModules> = {};
  
  if (showCategories) {
    // Initialize with all known categories
    const knownCategories: ModuleCategory[] = ['debug', 'chat', 'tools', 'custom'];
    knownCategories.forEach(category => {
      modulesByCategory[category] = [];
    });
    
    // Add 'other' category for uncategorized modules
    modulesByCategory['other'] = [];
    
    // Group modules by category
    availableModules.forEach(module => {
      const category = module.category || 'other';
      if (!modulesByCategory[category]) {
        modulesByCategory[category] = [];
      }
      modulesByCategory[category].push(module);
    });
    
    // Remove empty categories
    Object.keys(modulesByCategory).forEach(category => {
      if (modulesByCategory[category].length === 0) {
        delete modulesByCategory[category];
      }
    });
  } else {
    // No categorization, put all modules in a single group
    modulesByCategory['all'] = availableModules;
  }

  // Toggle panel with keyboard shortcut
  useEffect(() => {
    if (!shortcut) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Parse the shortcut (e.g., "Alt+M")
      const keys = shortcut.split('+');
      const modifierKey = keys[0].toLowerCase();
      const key = keys[1]?.toLowerCase();
      
      if (
        (modifierKey === 'alt' && e.altKey && e.key.toLowerCase() === key) ||
        (modifierKey === 'ctrl' && e.ctrlKey && e.key.toLowerCase() === key) ||
        (modifierKey === 'shift' && e.shiftKey && e.key.toLowerCase() === key)
      ) {
        setIsCollapsed(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcut]);

  // Get position styles
  const getPositionStyles = () => {
    switch (position) {
      case 'bottom-right':
        return { bottom: '20px', right: '20px' };
      case 'bottom-left':
        return { bottom: '20px', left: '20px' };
      case 'top-right':
        return { top: '20px', right: '20px' };
      case 'top-left':
        return { top: '20px', left: '20px' };
      default:
        return { top: '20px', right: '20px' };
    }
  };

  // Render toggle button when collapsed
  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        style={{
          position: 'fixed',
          ...getPositionStyles(),
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: '#007aff',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          zIndex: 9998,
        }}
        title={`UI Modules Panel (${shortcut})`}
        aria-label="Open UI Modules Panel"
      >
        UI
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        ...getPositionStyles(),
        width: typeof width === 'number' ? `${width}px` : width,
        maxHeight: '80vh',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8f9fa',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px' }}>UI Modules</h3>
        <button
          onClick={() => setIsCollapsed(true)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '4px',
            color: '#666',
          }}
          aria-label="Close UI Modules Panel"
        >
          ×
        </button>
      </div>
      
      {/* Module list - scrollable */}
      <div
        style={{
          overflow: 'auto',
          padding: '12px 16px',
          maxHeight: 'calc(80vh - 50px)',
        }}
      >
        {Object.entries(modulesByCategory).map(([category, categoryModules]) => (
          <div key={category} style={{ marginBottom: '16px' }}>
            {/* Category title if using categories */}
            {showCategories && (
              <h4 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '14px',
                color: '#666',
                textTransform: 'capitalize',
              }}>
                {category}
              </h4>
            )}
            
            {/* Modules in category */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categoryModules.map(module => (
                <div 
                  key={module.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px',
                    borderRadius: '4px',
                    background: '#f8f9fa',
                  }}
                >
                  {/* Toggle switch */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isModuleVisible(module.id)}
                      onChange={() => toggleModule(module.id)}
                      style={{ marginRight: '8px' }}
                    />
                    <span style={{ fontWeight: 500 }}>{module.name}</span>
                  </label>
                  
                  {/* Info icon for tooltip */}
                  {module.description && (
                    <div
                      style={{
                        marginLeft: 'auto',
                        fontSize: '14px',
                        color: '#666',
                        cursor: 'help',
                      }}
                      title={module.description}
                    >
                      ℹ️
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {/* Empty state */}
        {availableModules.length === 0 && (
          <div
            style={{
              padding: '16px',
              textAlign: 'center',
              color: '#666',
            }}
          >
            No UI modules available
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid #eee',
          fontSize: '12px',
          color: '#666',
        }}
      >
        Toggle with {shortcut}
      </div>
    </div>
  );
};
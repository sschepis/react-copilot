import React, { useState, useEffect } from 'react';
import { ModifiableAppProps } from '../utils/types';
import { useComponentContext } from '../context/ComponentContext';
import { DebugPanel } from './debug';
import { useDebug } from '../hooks/useDebug';

/**
 * Wrapper component that enables hot-reloading and modification
 * of the application components
 */
export const ModifiableApp: React.FC<ModifiableAppProps> = ({ 
  children,
  debug = {}
}) => {
  const { components } = useComponentContext();
  const [isUpdating, setIsUpdating] = useState(false);
  const { 
    isDebugEnabled, 
    isDebugVisible, 
    debugOptions, 
    toggleDebugPanel 
  } = useDebug({
    enabled: debug.enabled,
    initialVisible: debug.initialVisible,
    position: debug.position,
    width: debug.width,
    height: debug.height,
    shortcutKey: debug.shortcutKey
  });
  
  // Track when components are updated
  useEffect(() => {
    const componentIds = Object.keys(components);
    if (componentIds.length > 0) {
      setIsUpdating(true);
      
      // This would be where we'd trigger a hot reload
      // For now, we'll just simulate it with a timeout
      const timeout = setTimeout(() => {
        setIsUpdating(false);
      }, 100);
      
      return () => clearTimeout(timeout);
    }
  }, [components]);
  
  return (
    <div className="react-llm-ui-modifiable-app" data-updating={isUpdating}>
      {/* This wrapper is necessary for hot-reloading to work properly */}
      {children}
      
      {/* Notification when app is updating */}
      {isUpdating && (
        <div 
          style={{ 
            position: 'fixed', 
            bottom: '20px', 
            right: '20px',
            background: '#4a90e2', 
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 9999,
            transition: 'opacity 0.3s ease-in-out'
          }}
        >
          Updating components...
        </div>
      )}
      
      {/* Debug Panel */}
      {isDebugEnabled && (
        <DebugPanel
          initialVisible={isDebugVisible}
          position={debugOptions.position}
          width={debugOptions.width}
          height={debugOptions.height}
        />
      )}
    </div>
  );
};

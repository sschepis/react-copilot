import React from 'react';
import { ModifiableComponent } from '../../../utils/types';

export interface StateMonitorProps {
  component: ModifiableComponent;
  componentState?: Record<string, any>; // Add an optional componentState prop
  className?: string;
}

/**
 * Displays the state of a component in a readable format
 */
export const StateMonitor: React.FC<StateMonitorProps> = ({
  component,
  componentState = {},
  className = '',
}) => {
  // Use the provided componentState or empty object as fallback
  const state = componentState || {};
  const stateKeys = Object.keys(state);
  
  // Format a state value for display
  const formatStateValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    
    if (typeof value === 'function') {
      return 'function() {...}';
    }
    
    if (typeof value === 'object') {
      if (React.isValidElement(value)) {
        return `<${value.type.toString().split('(')[0] || 'Component'} />`;
      }
      
      try {
        return JSON.stringify(value, null, 2);
      } catch (e) {
        return '[Complex Object]';
      }
    }
    
    return String(value);
  };
  
  // Get shared state keys from relationships
  const sharedStateKeys = component.relationships?.sharedStateKeys || [];
  
  return (
    <div className={`state-monitor ${className}`}>
      <h3 className="state-monitor-title">State</h3>
      
      {stateKeys.length === 0 ? (
        <div className="state-monitor-empty">
          No state found for this component
        </div>
      ) : (
        <div className="state-monitor-content">
          {stateKeys.map(key => (
            <div 
              key={key} 
              className={`state-monitor-item ${sharedStateKeys.includes(key) ? 'state-monitor-shared' : ''}`}
            >
              <div className="state-monitor-key">
                {key}
                {sharedStateKeys.includes(key) && (
                  <span className="state-monitor-shared-badge" title="Shared state">
                    shared
                  </span>
                )}
              </div>
              <div className="state-monitor-value">
                <pre>{formatStateValue(state[key])}</pre>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {sharedStateKeys.length > 0 && stateKeys.length === 0 && (
        <div className="state-monitor-shared-info">
          <h4>Shared State References</h4>
          <ul>
            {sharedStateKeys.map(key => (
              <li key={key}>{key}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
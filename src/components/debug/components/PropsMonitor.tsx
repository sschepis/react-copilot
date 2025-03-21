import React from 'react';
import { ModifiableComponent } from '../../../utils/types';

export interface PropsMonitorProps {
  component: ModifiableComponent;
  className?: string;
}

/**
 * Displays the props of a component in a readable format
 */
export const PropsMonitor: React.FC<PropsMonitorProps> = ({
  component,
  className = '',
}) => {
  // Get the component's props
  const props = component.props || {};
  const propKeys = Object.keys(props);
  
  // Format a prop value for display
  const formatPropValue = (value: any): string => {
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
  
  return (
    <div className={`props-monitor ${className}`}>
      <h3 className="props-monitor-title">Props</h3>
      
      {propKeys.length === 0 ? (
        <div className="props-monitor-empty">
          No props found for this component
        </div>
      ) : (
        <div className="props-monitor-content">
          {propKeys.map(key => (
            <div key={key} className="props-monitor-item">
              <div className="props-monitor-key">{key}</div>
              <div className="props-monitor-value">
                <pre>{formatPropValue(props[key])}</pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
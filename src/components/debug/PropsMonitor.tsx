import React, { useState, useEffect } from 'react';
import { ModifiableComponent } from '../../utils/types';

interface PropsMonitorProps {
  component: ModifiableComponent;
}

/**
 * Displays the props of a component with their names, types, and values
 */
export const PropsMonitor: React.FC<PropsMonitorProps> = ({ component }) => {
  const [propEntries, setPropEntries] = useState<[string, any][]>([]);
  
  // Extract props from component
  useEffect(() => {
    if (component.props) {
      setPropEntries(Object.entries(component.props));
    } else {
      setPropEntries([]);
    }
  }, [component]);
  
  // Helper to determine the type of a value
  const getValueType = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object' && value.$$typeof) return 'react element';
    if (typeof value === 'function') return 'function';
    return typeof value;
  };
  
  // Format the value for display
  const formatValue = (value: any): string => {
    const type = getValueType(value);
    
    switch (type) {
      case 'null':
        return 'null';
      case 'undefined':
        return 'undefined';
      case 'function':
        return value.name ? `ƒ ${value.name}()` : 'ƒ ()';
      case 'react element':
        return `<${value.type.name || value.type}>`;
      case 'array':
        return `Array(${value.length})`;
      case 'object':
        return '{ ' + Object.keys(value).join(', ') + ' }';
      case 'string':
        return `"${value}"`;
      default:
        return String(value);
    }
  };
  
  // Extract prop types if available from component source
  const extractPropType = (propName: string): string => {
    if (!component.sourceCode) return '';
    
    // This is a simplified prop type extraction - in a real implementation
    // we would use TypeScript's compiler API or a more robust parsing strategy
    const propPattern = new RegExp(`${propName}\\s*:\\s*([A-Za-z0-9|<>'"\`\\[\\]{}]+)`, 'i');
    const match = component.sourceCode.match(propPattern);
    
    return match ? match[1].trim() : '';
  };
  
  if (propEntries.length === 0) {
    return (
      <div className="props-monitor">
        <p className="monitor-empty">No props found for this component</p>
      </div>
    );
  }
  
  return (
    <div className="props-monitor">
      <table className="monitor-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {propEntries.map(([name, value]) => (
            <tr key={name}>
              <td className="monitor-property">{name}</td>
              <td className="monitor-type">
                {extractPropType(name) || getValueType(value)}
              </td>
              <td className="monitor-value">
                {formatValue(value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
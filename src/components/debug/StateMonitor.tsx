import React, { useState, useEffect } from 'react';
import { ModifiableComponent } from '../../utils/types';

interface StateMonitorProps {
  component: ModifiableComponent;
}

/**
 * Displays the state of a component with state values and types
 * Uses React internals to access component state when possible
 */
export const StateMonitor: React.FC<StateMonitorProps> = ({ component }) => {
  const [stateEntries, setStateEntries] = useState<[string, any][]>([]);
  const [hookStates, setHookStates] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Refresh state view periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 1000); // Refresh every second
    
    return () => clearInterval(interval);
  }, []);
  
  // Extract state from component
  useEffect(() => {
    if (!component.ref?.current) {
      setStateEntries([]);
      setHookStates([]);
      return;
    }
    
    try {
      // Attempt to extract state information from component fiber
      // This uses React internals which are subject to change
      const extractComponentState = () => {
        // Access React fiber
        const fiberNode = getFiberNodeFromDOM(component.ref.current);
        if (!fiberNode) return;
        
        // Extract class component state
        if (fiberNode.stateNode && fiberNode.stateNode.state) {
          setStateEntries(Object.entries(fiberNode.stateNode.state));
        } else {
          setStateEntries([]);
        }
        
        // Extract hooks state (useState, useReducer)
        const hooksState = extractHooksState(fiberNode);
        setHookStates(hooksState);
      };
      
      extractComponentState();
    } catch (error) {
      console.warn('Failed to extract component state:', error);
      setStateEntries([]);
      setHookStates([]);
    }
  }, [component, refreshTrigger]);
  
  // Helper to access fiber node from DOM element
  const getFiberNodeFromDOM = (element: any): any => {
    // React internals - subject to change between versions
    const key = Object.keys(element).find(
      key => key.startsWith('__reactFiber$') || 
             key.startsWith('__reactInternalInstance$')
    );
    
    return key ? element[key] : null;
  };
  
  // Extract state from hooks
  const extractHooksState = (fiber: any): any[] => {
    if (!fiber || !fiber.memoizedState) return [];
    
    const states: any[] = [];
    let hookNode = fiber.memoizedState;
    
    // Walk through the hooks linked list
    while (hookNode) {
      // Check for useState and useReducer hooks
      if (hookNode.memoizedState !== undefined) {
        states.push(hookNode.memoizedState);
      }
      
      hookNode = hookNode.next;
    }
    
    return states;
  };
  
  // Format the value for display
  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (typeof value === 'function') return 'function()';
    if (typeof value === 'object') return `{ ${Object.keys(value).join(', ')} }`;
    if (typeof value === 'string') return `"${value}"`;
    return String(value);
  };
  
  // Create a state display name based on index for hooks
  const getHookStateName = (index: number): string => {
    return `useState(${index})`;
  };
  
  const noStateMessage = (
    <p className="monitor-empty">No state found for this component</p>
  );
  
  return (
    <div className="state-monitor">
      {/* Class Component State */}
      {stateEntries.length > 0 && (
        <>
          <h3>Component State</h3>
          <table className="monitor-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {stateEntries.map(([name, value]) => (
                <tr key={name}>
                  <td className="monitor-property">{name}</td>
                  <td className="monitor-value">{formatValue(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      
      {/* Hooks State */}
      {hookStates.length > 0 && (
        <>
          <h3>Hooks State</h3>
          <table className="monitor-table">
            <thead>
              <tr>
                <th>Hook</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {hookStates.map((state, index) => (
                <tr key={index}>
                  <td className="monitor-property">{getHookStateName(index)}</td>
                  <td className="monitor-value">{formatValue(state)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      
      {stateEntries.length === 0 && hookStates.length === 0 && noStateMessage}
    </div>
  );
};
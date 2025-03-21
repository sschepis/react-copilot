import React from 'react';
import { ModifiableComponent } from '../../utils/types';
interface StateMonitorProps {
    component: ModifiableComponent;
}
/**
 * Displays the state of a component with state values and types
 * Uses React internals to access component state when possible
 */
export declare const StateMonitor: React.FC<StateMonitorProps>;
export {};

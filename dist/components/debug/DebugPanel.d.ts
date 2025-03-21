import React from 'react';
import './DebugPanel.css';
export interface DebugPanelProps {
    initialVisible?: boolean;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    width?: number | string;
    height?: number | string;
}
/**
 * A debugging panel that provides visibility into ModifiableComponents.
 * Shows component tree, props, state, and relationships.
 */
export declare const DebugPanel: React.FC<DebugPanelProps>;

import React from 'react';
import { ModifiableComponent } from '../../utils/types';
interface ComponentTreeProps {
    components: Record<string, ModifiableComponent>;
    selectedComponentId: string | null;
    onSelectComponent: (componentId: string) => void;
}
/**
 * Displays a hierarchical tree of components with parent-child relationships
 */
export declare const ComponentTree: React.FC<ComponentTreeProps>;
export {};

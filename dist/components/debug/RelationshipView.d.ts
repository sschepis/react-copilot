import React from 'react';
import { ModifiableComponent } from '../../utils/types';
interface RelationshipViewProps {
    component: ModifiableComponent;
}
/**
 * Displays the relationships between components, including parent-child relationships,
 * dependencies, and components that share state.
 */
export declare const RelationshipView: React.FC<RelationshipViewProps>;
export {};

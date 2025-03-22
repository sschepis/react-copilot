import { RelationshipDetectionStrategy } from '../types';
import { ParentChildDetectionStrategy } from './ParentChildDetectionStrategy';
import { PropDependencyDetectionStrategy } from './PropDependencyDetectionStrategy';
import { StateDependencyDetectionStrategy } from './StateDependencyDetectionStrategy';
import { ContextDependencyDetectionStrategy } from './ContextDependencyDetectionStrategy';

/**
 * Factory function to create all default detection strategies
 */
export function createDefaultDetectionStrategies(): RelationshipDetectionStrategy[] {
  return [
    new ParentChildDetectionStrategy(),
    new PropDependencyDetectionStrategy(),
    new StateDependencyDetectionStrategy(),
    new ContextDependencyDetectionStrategy()
  ];
}

export {
  ParentChildDetectionStrategy,
  PropDependencyDetectionStrategy,
  StateDependencyDetectionStrategy,
  ContextDependencyDetectionStrategy
};
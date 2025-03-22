# Component Relationship System

This module provides a comprehensive system for tracking, analyzing, and visualizing relationships between React components.

## Architecture

The relationship system has been refactored into a modular, maintainable structure:

```
relationship/
├── types.ts                    # Core types and interfaces
├── RelationshipManager.ts      # Core relationship management
├── RelationshipGraphVisualization.ts  # Visualization utilities
├── RelationshipAnalyzer.ts     # Analysis tools
├── index.ts                    # Main entry point
├── detectionStrategies/        # Relationship detection strategies
│   ├── ParentChildDetectionStrategy.ts
│   ├── PropDependencyDetectionStrategy.ts
│   ├── StateDependencyDetectionStrategy.ts
│   ├── ContextDependencyDetectionStrategy.ts
│   └── index.ts                # Factory for strategies
└── README.md                   # This file
```

## Core Classes

- **RelationshipManager**: Core class for managing component relationships, tracking dependencies, and detecting patterns
- **RelationshipGraphVisualization**: Tools for converting relationship data into visualization-friendly formats
- **RelationshipAnalyzer**: Advanced analysis of component relationships (finding cycles, hubs, etc.)

## Detection Strategies

The system uses a strategy pattern for relationship detection:

- **ParentChildDetectionStrategy**: Detects parent-child relationships from component nesting
- **PropDependencyDetectionStrategy**: Identifies prop passing between components
- **StateDependencyDetectionStrategy**: Detects state sharing between components
- **ContextDependencyDetectionStrategy**: Identifies context usage between components

## Migration Guide

### From Monolithic to Modular

The old monolithic `RelationshipGraph` class has been split into specialized modules. For backwards compatibility, a wrapper class with the same name is provided, but we recommend migrating to the new system:

```typescript
// Old approach
import { RelationshipGraph } from '../services/component';
const graph = new RelationshipGraph();
graph.addComponent(component);
graph.detectRelationships(component);
const visData = graph.visualizeGraph();

// New approach
import { 
  RelationshipManager, 
  RelationshipGraphVisualization,
  RelationshipAnalyzer
} from '../services/component/relationship';

const manager = new RelationshipManager();
manager.addComponent(component);
manager.detectRelationships(component);

// Use specialized classes for specific needs
const visualizer = new RelationshipGraphVisualization(manager);
const visData = visualizer.getGraphData();

const analyzer = new RelationshipAnalyzer(manager);
const hubComponents = analyzer.findHubComponents();
```

### Benefits of Migration

- **Improved maintainability**: Smaller, focused modules are easier to maintain and test
- **Better separation of concerns**: Each class has a clear, specific responsibility
- **Enhanced extensibility**: Easy to add new detection strategies or analysis tools
- **Reduced coupling**: Dependencies are explicit and minimized

## Example Usage

```typescript
// Create the core relationship manager
const relationshipManager = new RelationshipManager();

// Add components and detect relationships
relationshipManager.addComponent(component);
relationshipManager.detectRelationships(component);

// Create visualization helper
const visualizer = new RelationshipGraphVisualization(relationshipManager);
const d3Data = visualizer.getD3ForceGraphData();

// Perform advanced analysis
const analyzer = new RelationshipAnalyzer(relationshipManager);
const cycles = analyzer.findCycles(component.id);
const hubs = analyzer.findHubComponents(5); // Find components with 5+ connections
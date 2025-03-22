# Unified State Management System

This module provides a comprehensive, unified approach to state management in React applications, supporting multiple state management libraries (Redux, MobX, Zustand, etc.) through a consistent interface.

## Directory Structure

- **`/types`**: Core type definitions for state management
  - Path types, selectors, metadata, history, etc.

- **`/adapter`**: Adapter pattern implementation
  - Interface definitions and abstract base class
  - Individual adapters for different state libraries

- **`/manager`**: State manager implementation
  - Unified manager for coordinating between adapters
  - Utilities for state operations

- **`UnifiedStateSystem.ts`**: Main entry point API
  - Provides simplified interface for consuming code
  - Handles coordination between adapters

## Key Features

- **Library Agnostic**: Works with any state management library
- **Consistent API**: Single interface regardless of underlying implementation
- **Time-Travel Debugging**: Record state history and go back in time
- **Middleware Support**: Intercept and transform state changes
- **Performance Optimization**: Track component dependencies
- **Storage Integration**: Persist and restore state
- **State Synchronization**: Keep multiple state sources in sync

## Usage Example

```typescript
import { stateSystem } from '../services/state';
import { ReduxAdapter } from '../services/state/adapters/ReduxAdapter';
import { MobXAdapter } from '../services/state/adapters/MobXAdapter';

// Initialize with adapters
stateSystem.initialize([
  new ReduxAdapter(store),
  new MobXAdapter(mobxState)
]);

// Get state
const userData = stateSystem.get('user.profile');

// Set state
stateSystem.set('user.profile.name', 'John Doe');

// Subscribe to changes
const unsubscribe = stateSystem.subscribe(
  'user.profile',
  (path, newValue, oldValue) => {
    console.log(`${path} changed from`, oldValue, 'to', newValue);
  }
);

// Transaction (multiple updates as one)
stateSystem.transaction({
  'user.profile.name': 'John Doe',
  'user.profile.email': 'john@example.com'
});

// Enable time-travel debugging
stateSystem.enableTimeTravel();

// Travel back in time
stateSystem.timeTravel(5); // Go back 5 steps
```

## Extending The System

To add support for a new state management library:

1. Create a new adapter extending `AbstractUnifiedStateAdapter`
2. Implement required abstract methods
3. Register the adapter with the state system

See existing adapters for implementation examples.
/**
 * State Management Module
 * Provides adapters for various state management libraries and tools for tracking state usage
 */

// Core interfaces and base classes
export * from './StateAdapter';

// State adapters
export { ReduxAdapter } from './ReduxAdapter';
export { ZustandAdapter } from './ZustandAdapter';
export { MobXAdapter } from './MobXAdapter';

// State management and tracking
export { 
  StateManager, 
  getStateManager, 
  StateManagerEvents, 
  StateChangeRequest, 
  StateModificationResult 
} from './StateManager';

export { 
  StateTracker, 
  getStateTracker, 
  StateTrackerEvents, 
  StateUsage, 
  StateDependency 
} from './StateTracker';
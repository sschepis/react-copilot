/**
 * Main exports for the state management system
 */

// Export the original StateAdapter
export * from './StateAdapter.js';

// Export all types
export * from './types/index.js';

// Export the adapter interfaces and abstractions
export * from './adapter/UnifiedStateAdapter.interface.js';
export * from './adapter/UnifiedStateAdapter.abstract.js';

// Export the manager
export * from './manager/UnifiedStateManager.interface.js';
export * from './manager/UnifiedStateManager.js';
export * from './manager/utils.js';

// Export the unified state system
export * from './UnifiedStateSystem.js';
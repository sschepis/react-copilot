// Export main services
export { 
  SafeCodeApplication,
  SafeCodeEvents,
  SafeCodeOptions,
  safeCodeApplication
} from './SafeCodeApplication';

export {
  PropTypeInference,
  InferredPropType,
  InferredProp,
  InferenceResult
} from './PropTypeInference';

export {
  TestGenerator,
  TestGeneratorOptions,
  TestGenerationResult,
  TestCase
} from './TestGenerator';
export {
  DocumentationGenerator,
  DocumentationOptions,
  DocumentationResult,
  DocumentationFormat,
  UsageExample
} from './DocumentationGenerator';

// Re-export from refactored modules

// Safe code exports
export {
  SafeCodeManager,
  defaultSafeCodeManager
} from './safeCode/SafeCodeManager';

export {
  SafeCodeApplierFactory
} from './safeCode/SafeCodeApplierFactory';

export {
  ReactSafeCodeApplier
} from './safeCode/appliers/ReactSafeCodeApplier';

// Prop inference exports
export {
  PropTypeInferenceManager,
  defaultPropTypeInferenceManager
} from './propInference/PropTypeInferenceManager';

export {
  PropTypeInferencerFactory
} from './propInference/PropTypeInferencerFactory';

// Test exports
export {
  TestManager
} from './test/TestManager';

// Documentation exports
export {
  DocumentationManager
} from './documentation/DocumentationManager';
export * from './documentation';

// Export other services
export { default as StyleGenerator } from './StyleGenerator';
export { default as ChangeExplainer } from './ChangeExplainer';
export { default as ConflictResolver } from './ConflictResolver';
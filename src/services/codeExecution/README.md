# Code Execution Services Architecture

This directory contains a suite of services for analyzing, validating, and applying code changes safely in the React LLM UI system. The architecture is designed around a set of modular, extensible components that follow consistent patterns.

## Architecture Overview

Each module in the code execution services follows a similar pattern:

1. **Types Layer**: Defines interfaces, enums, and type definitions
2. **Base Layer**: Abstract classes implementing common functionality
3. **Implementation Layer**: Concrete implementations for specific use cases
4. **Factory Layer**: Instantiates appropriate implementations
5. **Manager Layer**: Provides high-level coordination and API
6. **Public API**: Clean interface for consumers

This pattern provides clear separation of concerns, promotes reusability, and allows for easy extension.

## Components

### 1. Safe Code Application (`/safeCode`)

Handles the safe application of code changes with validation, rollback, and dependency tracking.

- **Key Files**:
  - `types.ts`: Core interfaces and types
  - `SafeCodeApplierBase.ts`: Abstract base class for code appliers
  - `SafeCodeApplierFactory.ts`: Factory for creating appliers
  - `SafeCodeManager.ts`: High-level manager
  - `appliers/ReactSafeCodeApplier.ts`: React-specific implementation

- **Usage**:
  ```typescript
  import { safeCodeApplication } from '../services/codeExecution';
  
  // Apply code changes
  const result = await safeCodeApplication.safelyApplyCode(
    { componentId: 'MyComponent', sourceCode: '...' },
    (id) => getComponent(id)
  );
  
  // Listen for events
  safeCodeApplication.on(SafeCodeEvents.VALIDATION_COMPLETED, (data) => {
    console.log('Validation completed:', data);
  });
  ```

### 2. Prop Type Inference (`/propInference`)

Analyses component code and usage to infer prop types and generate TypeScript interfaces.

- **Key Files**:
  - `types.ts`: Core interfaces and types
  - `PropTypeInferencerBase.ts`: Abstract base class for inferencers
  - `PropTypeInferencerFactory.ts`: Factory for creating inferencers
  - `PropTypeInferenceManager.ts`: High-level manager
  - `inferencers/ReactPropTypeInferencer.ts`: React-specific implementation

- **Usage**:
  ```typescript
  import { defaultPropTypeInferenceManager } from '../services/codeExecution';
  
  const inferenceResult = defaultPropTypeInferenceManager.inferPropTypes({
    componentCode: '...',
    usageExamples: ['...', '...']
  });
  
  console.log(inferenceResult.interfaceText);
  ```

### 3. Test Generation (`/test`)

Generates automated tests for components based on their implementation and prop types.

- **Key Files**:
  - `types.ts`: Core interfaces and types
  - `TestGeneratorBase.ts`: Abstract base class for test generators
  - `TestGeneratorFactory.ts`: Factory for creating generators
  - `TestManager.ts`: High-level manager
  - `generators/`: Specific implementations for test frameworks

- **Usage**:
  ```typescript
  import { TestManager } from '../services/codeExecution';
  
  const testManager = new TestManager();
  const testCode = testManager.generateTests({
    sourceCode: '...',
    filePath: 'src/components/Button.tsx',
    codeType: 'react-component'
  });
  ```

### 4. Documentation Generation (`/documentation`)

Creates documentation for components in various formats (markdown, JSDoc, etc.).

- **Key Files**:
  - `types.ts`: Core interfaces and types
  - `DocumentationGeneratorBase.ts`: Abstract base class
  - `DocumentationGeneratorFactory.ts`: Factory for creating generators
  - `DocumentationManager.ts`: High-level manager
  - `generators/`: Format-specific implementations

- **Usage**:
  ```typescript
  import { DocumentationManager } from '../services/codeExecution';
  
  const docManager = new DocumentationManager();
  const docs = docManager.generateDocumentation({
    componentCode: '...',
    format: 'markdown'
  });
  ```

## Extending the Architecture

### Adding New Implementations

To add a new implementation (e.g., a Vue component code applier):

1. Create a new class extending the base class:
   ```typescript
   export class VueSafeCodeApplier extends SafeCodeApplierBase {
     constructor(options?: any) {
       super('VueSafeCodeApplier', ['vue-component'], options);
     }
     
     // Implement abstract methods...
   }
   ```

2. Register with the factory:
   ```typescript
   SafeCodeApplierFactory.registerApplier(new VueSafeCodeApplier());
   ```

### Creating Custom Validators

For SafeCodeApplication, you can create custom validators:

```typescript
const customValidator = {
  name: 'CustomSecurityValidator',
  severityLevel: ValidationSeverity.ERROR,
  validate: (code: string) => {
    // Custom validation logic
    return { success: true };
  }
};

safeCodeApplication.configure({
  customValidators: [customValidator]
});
```

## Design Benefits

1. **Modularity**: Each component has a single responsibility
2. **Extensibility**: Easy to add new implementations without modifying existing code
3. **Testability**: Well-defined interfaces make unit testing straightforward
4. **Consistency**: Common patterns across all services
5. **Separation of Concerns**: Clear boundaries between validation, application, and rollback

## Migration from Previous APIs

The refactored services maintain backward compatibility through facades that match the original API signatures. The following classes provide backward compatibility:

- `SafeCodeApplication`: Wraps the new SafeCodeManager
- `PropTypeInference`: Wraps the new PropTypeInferenceManager
- `TestGenerator`: Wraps the new TestManager
- `DocumentationGenerator`: Wraps the new DocumentationManager

No changes are required for existing code that uses these APIs.
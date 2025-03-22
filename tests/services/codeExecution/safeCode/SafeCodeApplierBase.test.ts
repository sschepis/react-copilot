import { SafeCodeApplierBase } from '../../../../src/services/codeExecution/safeCode/SafeCodeApplierBase';
import { 
  ValidationResult, 
  ValidationContext, 
  SafeCodeEvents,
  CodeChangeRequest,
  ValidationSeverity
} from '../../../../src/services/codeExecution/safeCode/types';
import { ModifiableComponent } from '../../../../src/utils/types';

// Create a concrete implementation of the abstract base class for testing
class TestSafeCodeApplier extends SafeCodeApplierBase {
  constructor() {
    super('TestSafeCodeApplier', ['test-component'], {});
  }

  // Implement abstract methods
  protected async applyChangesImplementation(
    request: CodeChangeRequest,
    component: ModifiableComponent,
    context: ValidationContext
  ) {
    return {
      success: true,
      componentId: request.componentId,
      newSourceCode: request.sourceCode
    };
  }

  protected validateComponentPatterns(
    code: string,
    context: ValidationContext
  ): ValidationResult {
    return {
      success: code.includes('function') || code.includes('class'),
      error: !code.includes('function') && !code.includes('class') ? 
        'No component pattern found' : undefined
    };
  }

  protected async executeSandbox(code: string): Promise<ValidationResult> {
    return {
      success: !code.includes('error'),
      error: code.includes('error') ? 'Error in sandbox execution' : undefined
    };
  }

  protected async checkDependencies(
    componentId: string,
    originalCode: string,
    newCode: string,
    getComponent: (id: string) => ModifiableComponent | null,
    getComponentDependencies: (id: string) => string[]
  ): Promise<string[]> {
    return originalCode === newCode ? [] : ['TestDependency'];
  }

  protected generateDiff(originalCode: string, newCode: string): string {
    return `- ${originalCode}\n+ ${newCode}`;
  }

  protected detectComponentType(code: string): string {
    return 'test-component';
  }

  protected detectLanguage(code: string): string {
    return 'typescript';
  }
}

describe('SafeCodeApplierBase', () => {
  let applier: TestSafeCodeApplier;
  let mockGetComponent: jest.Mock;
  let mockGetDependencies: jest.Mock;
  
  // Sample component for testing
  const testComponent: ModifiableComponent = {
    id: 'test-component',
    name: 'TestComponent',
    sourceCode: 'function TestComponent() { return <div>Test</div>; }',
    props: {},
    relationships: {
      childrenIds: []
    },
    ref: { current: null }
  };

  beforeEach(() => {
    applier = new TestSafeCodeApplier();
    mockGetComponent = jest.fn().mockReturnValue(testComponent);
    mockGetDependencies = jest.fn().mockReturnValue(['dep1', 'dep2']);
    
    // Clear event listeners between tests
    applier.events.removeAllListeners();
  });

  describe('applyChanges', () => {
    it('should apply changes successfully', async () => {
      // Setup event listener spy
      const validationStartedSpy = jest.fn();
      const validationCompletedSpy = jest.fn();
      const applicationCompletedSpy = jest.fn();
      
      applier.events.on(SafeCodeEvents.VALIDATION_STARTED, validationStartedSpy);
      applier.events.on(SafeCodeEvents.VALIDATION_COMPLETED, validationCompletedSpy);
      applier.events.on(SafeCodeEvents.APPLICATION_COMPLETED, applicationCompletedSpy);

      const request: CodeChangeRequest = {
        componentId: 'test-component',
        sourceCode: 'function TestComponent() { return <div>Updated</div>; }'
      };

      const result = await applier.applyChanges(request, mockGetComponent, mockGetDependencies);

      // Check result
      expect(result.success).toBe(true);
      expect(result.componentId).toBe('test-component');
      expect(result.newSourceCode).toBe('function TestComponent() { return <div>Updated</div>; }');
      
      // Verify events were emitted
      expect(validationStartedSpy).toHaveBeenCalledWith({ componentId: 'test-component' });
      expect(validationCompletedSpy).toHaveBeenCalled();
      expect(applicationCompletedSpy).toHaveBeenCalled();
      
      // Verify component getter was called
      expect(mockGetComponent).toHaveBeenCalledWith('test-component');
    });

    it('should fail when component is not found', async () => {
      mockGetComponent.mockReturnValue(null);
      
      const request: CodeChangeRequest = {
        componentId: 'missing-component',
        sourceCode: 'function TestComponent() { return <div>Test</div>; }'
      };

      const result = await applier.applyChanges(request, mockGetComponent);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should fail validation for code that doesn\'t match component patterns', async () => {
      const validationFailedSpy = jest.fn();
      applier.events.on(SafeCodeEvents.VALIDATION_FAILED, validationFailedSpy);
      
      const request: CodeChangeRequest = {
        componentId: 'test-component',
        sourceCode: 'const x = 10;' // No function or class
      };

      const result = await applier.applyChanges(request, mockGetComponent);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No component pattern found');
      expect(validationFailedSpy).toHaveBeenCalled();
    });

    it('should detect affected dependencies', async () => {
      const dependenciesAffectedSpy = jest.fn();
      applier.events.on(SafeCodeEvents.DEPENDENCIES_AFFECTED, dependenciesAffectedSpy);
      
      const request: CodeChangeRequest = {
        componentId: 'test-component',
        sourceCode: 'function TestComponent() { return <div>Changed</div>; }'
      };

      await applier.applyChanges(request, mockGetComponent, mockGetDependencies);

      expect(dependenciesAffectedSpy).toHaveBeenCalled();
      expect(dependenciesAffectedSpy.mock.calls[0][0].affectedDependencies).toContain('TestDependency');
    });

    it('should fail sandbox execution for code with errors', async () => {
      const applicationFailedSpy = jest.fn();
      applier.events.on(SafeCodeEvents.APPLICATION_FAILED, applicationFailedSpy);
      
      const request: CodeChangeRequest = {
        componentId: 'test-component',
        sourceCode: 'function TestComponent() { error; return <div>Test</div>; }'
      };

      const result = await applier.applyChanges(request, mockGetComponent);

      expect(result.success).toBe(false);
      expect(result.error).toContain('sandbox');
      expect(applicationFailedSpy).toHaveBeenCalled();
    });
  });

  describe('rollback', () => {
    it('should rollback changes successfully', async () => {
      // Setup with a backup
      const originalCode = 'function TestComponent() { return <div>Original</div>; }';
      (applier as any).createBackup('test-component', originalCode);
      
      const rollbackCompletedSpy = jest.fn();
      applier.events.on(SafeCodeEvents.ROLLBACK_COMPLETED, rollbackCompletedSpy);

      const result = await applier.rollback('test-component');

      expect(result).toBe(originalCode);
      expect(rollbackCompletedSpy).toHaveBeenCalledWith({
        componentId: 'test-component',
        sourceCode: originalCode
      });
    });

    it('should fail rollback when no backups exist', async () => {
      const rollbackFailedSpy = jest.fn();
      applier.events.on(SafeCodeEvents.ROLLBACK_FAILED, rollbackFailedSpy);

      const result = await applier.rollback('no-backups');

      expect(result).toBeNull();
      expect(rollbackFailedSpy).toHaveBeenCalled();
    });
  });

  describe('validateChanges', () => {
    it('should validate code successfully', async () => {
      const result = await applier.validateChanges(
        'function TestComponent() { return <div>Test</div>; }',
        'function TestComponent() { return <div>Old</div>; }',
        { componentId: 'test-component' }
      );

      expect(result.success).toBe(true);
    });

    it('should validate security issues', async () => {
      const result = await applier.validateChanges(
        'function TestComponent() { eval("alert()"); return <div>Test</div>; }',
        '',
        { componentId: 'test-component' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('security');
      expect(result.issues?.some(i => i.severity === ValidationSeverity.CRITICAL)).toBe(true);
    });
  });
});
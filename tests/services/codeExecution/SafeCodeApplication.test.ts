import { SafeCodeApplication, SafeCodeEvents } from '../../../src/services/codeExecution/SafeCodeApplication';
import { defaultSafeCodeManager } from '../../../src/services/codeExecution/safeCode';
import { ModifiableComponent } from '../../../src/utils/types';

// Mock the safeCode module
jest.mock('../../../src/services/codeExecution/safeCode', () => {
  return {
    defaultSafeCodeManager: {
      safelyApplyCode: jest.fn(),
      applyMultiComponentChanges: jest.fn(),
      rollback: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      configure: jest.fn(),
      getApplierByName: jest.fn()
    }
  };
});

describe('SafeCodeApplication', () => {
  let safeCodeApp: SafeCodeApplication;
  let mockGetComponent: jest.Mock;
  let mockGetDependencies: jest.Mock;
  
  // Test component
  const testComponent: ModifiableComponent = {
    id: 'test-component',
    name: 'TestComponent',
    sourceCode: 'function TestComponent() { return <div>Test</div>; }',
    props: {},
    ref: { current: null }
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create new instance
    safeCodeApp = new SafeCodeApplication();
    
    // Mock component getters
    mockGetComponent = jest.fn().mockReturnValue(testComponent);
    mockGetDependencies = jest.fn().mockReturnValue(['header', 'footer']);
    
    // Mock successful result for safelyApplyCode
    (defaultSafeCodeManager.safelyApplyCode as jest.Mock).mockResolvedValue({
      success: true,
      componentId: 'test-component',
      newSourceCode: 'function TestComponent() { return <div>Updated</div>; }',
      diff: '- old\n+ new'
    });
    
    // Mock successful result for applyMultiComponentChanges
    (defaultSafeCodeManager.applyMultiComponentChanges as jest.Mock).mockResolvedValue({
      'test-component': {
        success: true,
        componentId: 'test-component',
        newSourceCode: 'function TestComponent() { return <div>Updated</div>; }'
      }
    });
    
    // Mock successful result for rollback
    (defaultSafeCodeManager.rollback as jest.Mock).mockResolvedValue(
      'function TestComponent() { return <div>Old Version</div>; }'
    );
    
    // Mock applier with getBackups and clearBackups
    (defaultSafeCodeManager.getApplierByName as jest.Mock).mockReturnValue({
      getBackups: jest.fn().mockReturnValue(['backup1', 'backup2']),
      clearBackups: jest.fn()
    });
  });

  describe('safelyApplyCode', () => {
    it('should delegate to SafeCodeManager.safelyApplyCode', async () => {
      const request = {
        componentId: 'test-component',
        newCode: 'function TestComponent() { return <div>Updated</div>; }',
        sourceCode: 'function TestComponent() { return <div>Updated</div>; }' // For compatibility
      };
      
      const result = await safeCodeApp.safelyApplyCode(
        request,
        mockGetComponent,
        mockGetDependencies
      );
      
      expect(result.success).toBe(true);
      expect(defaultSafeCodeManager.safelyApplyCode).toHaveBeenCalledWith(
        request,
        mockGetComponent,
        mockGetDependencies
      );
    });
  });

  describe('applyMultiComponentChange', () => {
    it('should delegate to SafeCodeManager.applyMultiComponentChanges', async () => {
      const request = {
        componentIds: ['test-component', 'header'],
        changes: {
          'test-component': 'function TestComponent() { return <div>Updated</div>; }',
          'header': 'function Header() { return <header>Updated</header>; }'
        },
        description: 'Update components'
      };
      
      const result = await safeCodeApp.applyMultiComponentChange(
        request,
        mockGetComponent,
        mockGetDependencies
      );
      
      expect(result['test-component'].success).toBe(true);
      expect(defaultSafeCodeManager.applyMultiComponentChanges).toHaveBeenCalledWith(
        {
          componentIds: request.componentIds,
          changes: request.changes,
          description: request.description,
          transactional: true
        },
        mockGetComponent,
        mockGetDependencies
      );
    });
    
    it('should handle missing componentIds in request', async () => {
      const request = {
        changes: {
          'test-component': 'function TestComponent() { return <div>Updated</div>; }',
          'header': 'function Header() { return <header>Updated</header>; }'
        },
        description: 'Update components'
      };
      
      await safeCodeApp.applyMultiComponentChange(
        request as any,
        mockGetComponent,
        mockGetDependencies
      );
      
      // Check that componentIds was extracted from changes
      expect(defaultSafeCodeManager.applyMultiComponentChanges).toHaveBeenCalledWith(
        expect.objectContaining({
          componentIds: expect.arrayContaining(['test-component', 'header']),
          changes: request.changes
        }),
        mockGetComponent,
        mockGetDependencies
      );
    });
  });

  describe('rollback', () => {
    it('should delegate to SafeCodeManager.rollback', async () => {
      const oldCode = await safeCodeApp.rollback('test-component');
      
      expect(oldCode).toBe('function TestComponent() { return <div>Old Version</div>; }');
      expect(defaultSafeCodeManager.rollback).toHaveBeenCalledWith('test-component');
    });
  });

  describe('getBackups', () => {
    it('should retrieve backups from the applier', () => {
      const backups = safeCodeApp.getBackups('test-component');
      
      expect(backups).toEqual(['backup1', 'backup2']);
      expect(defaultSafeCodeManager.getApplierByName).toHaveBeenCalledWith('ReactSafeCodeApplier');
    });
    
    it('should return empty array if no applier found', () => {
      (defaultSafeCodeManager.getApplierByName as jest.Mock).mockReturnValue(null);
      
      const backups = safeCodeApp.getBackups('test-component');
      
      expect(backups).toEqual([]);
    });
  });

  describe('clearBackups', () => {
    it('should clear backups using the applier', () => {
      safeCodeApp.clearBackups('test-component');
      
      const mockApplier = (defaultSafeCodeManager.getApplierByName as jest.Mock).mock.results[0].value;
      expect(mockApplier.clearBackups).toHaveBeenCalledWith('test-component');
    });
    
    it('should do nothing if no applier found', () => {
      (defaultSafeCodeManager.getApplierByName as jest.Mock).mockReturnValue(null);
      
      // This should not throw error
      safeCodeApp.clearBackups('test-component');
    });
  });

  describe('event handling', () => {
    it('should delegate event handlers to SafeCodeManager', () => {
      const handler = jest.fn();
      
      // Register handler
      safeCodeApp.on(SafeCodeEvents.VALIDATION_COMPLETED, handler);
      
      expect(defaultSafeCodeManager.on).toHaveBeenCalledWith(
        SafeCodeEvents.VALIDATION_COMPLETED,
        handler
      );
      
      // Remove handler
      safeCodeApp.off(SafeCodeEvents.VALIDATION_COMPLETED, handler);
      
      expect(defaultSafeCodeManager.off).toHaveBeenCalledWith(
        SafeCodeEvents.VALIDATION_COMPLETED,
        handler
      );
    });
  });

  describe('configure', () => {
    it('should delegate configuration to SafeCodeManager', () => {
      const options = {
        strictValidation: false,
        sandboxExecution: true
      };
      
      safeCodeApp.configure(options);
      
      expect(defaultSafeCodeManager.configure).toHaveBeenCalledWith(options);
    });
  });
});
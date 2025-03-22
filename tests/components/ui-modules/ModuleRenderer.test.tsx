import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom'; // Add this import to fix toBeInTheDocument errors
import { ModuleRenderer } from '../../../src/components/ui-modules/ModuleRenderer';
import { ModuleVisibilityProvider } from '../../../src/components/ui-modules/ModuleVisibilityContext';
import { moduleRegistry, registerModule } from '../../../src/components/ui-modules/ModuleRegistry';
import { UIModule } from '../../../src/components/ui-modules/types';

// Mock useModuleVisibility hook
jest.mock('../../../src/components/ui-modules/ModuleVisibilityContext', () => {
  const original = jest.requireActual('../../../src/components/ui-modules/ModuleVisibilityContext');
  return {
    ...original,
    useModuleVisibility: jest.fn(() => ({
      isModuleVisible: (moduleId: string) => mockVisibilityState[moduleId] || false,
      visibilityState: mockVisibilityState,
      toggleModule: jest.fn(),
      setModuleVisibility: jest.fn(),
    })),
  };
});

// Mock visibility state
let mockVisibilityState: Record<string, boolean> = {};

describe('ModuleRenderer', () => {
  // Create mock components for testing
  const TestComponent = jest.fn(() => <div data-testid="test-component">Test Component</div>);
  const DependentComponent = jest.fn(() => <div data-testid="dependent-component">Dependent Component</div>);
  
  // Create module definitions
  const testModule: UIModule = {
    id: 'test-module',
    name: 'Test Module',
    description: 'A test module',
    defaultVisible: true,
    category: 'custom',
    component: TestComponent,
  };
  
  const dependentModule: UIModule = {
    id: 'dependent-module',
    name: 'Dependent Module',
    description: 'A module that depends on test-module',
    defaultVisible: true,
    category: 'custom',
    component: DependentComponent,
    dependencies: ['test-module'],
  };
  
  beforeEach(() => {
    // Reset mocks
    TestComponent.mockClear();
    DependentComponent.mockClear();
    
    // Clear registry
    moduleRegistry.clear();
    
    // Register modules
    registerModule(testModule);
    registerModule(dependentModule);
    
    // Reset mock visibility state
    mockVisibilityState = {};
  });
  
  test('should render visible modules', () => {
    mockVisibilityState = {
      'test-module': true,
      'dependent-module': true,
    };
    
    const { getByTestId } = render(<ModuleRenderer />);
    
    // Both components should be rendered
    expect(getByTestId('test-component')).toBeInTheDocument();
    expect(getByTestId('dependent-component')).toBeInTheDocument();
    
    // Components should have been called
    expect(TestComponent).toHaveBeenCalled();
    expect(DependentComponent).toHaveBeenCalled();
  });
  
  test('should not render hidden modules', () => {
    mockVisibilityState = {
      'test-module': true,
      'dependent-module': false,
    };
    
    const { getByTestId, queryByTestId } = render(<ModuleRenderer />);
    
    // Only test component should be rendered
    expect(getByTestId('test-component')).toBeInTheDocument();
    expect(queryByTestId('dependent-component')).not.toBeInTheDocument();
    
    // Only test component should have been called
    expect(TestComponent).toHaveBeenCalled();
    expect(DependentComponent).not.toHaveBeenCalled();
  });
  
  test('should not render modules with unsatisfied dependencies', () => {
    mockVisibilityState = {
      'test-module': false,
      'dependent-module': true,
    };
    
    // Mock console.warn to avoid noisy test output
    const originalWarn = console.warn;
    console.warn = jest.fn();
    
    const { queryByTestId } = render(<ModuleRenderer />);
    
    // Neither component should be rendered
    // test-module is hidden, and dependent-module has unsatisfied dependencies
    expect(queryByTestId('test-component')).not.toBeInTheDocument();
    expect(queryByTestId('dependent-component')).not.toBeInTheDocument();
    
    // Neither component should have been called
    expect(TestComponent).not.toHaveBeenCalled();
    expect(DependentComponent).not.toHaveBeenCalled();
    
    // Should warn about unsatisfied dependencies
    expect(console.warn).toHaveBeenCalled();
    
    // Restore console.warn
    console.warn = originalWarn;
  });
  
  test('should filter modules with modules prop', () => {
    mockVisibilityState = {
      'test-module': true,
      'dependent-module': true,
    };
    
    const { getByTestId, queryByTestId } = render(
      <ModuleRenderer modules={['test-module']} />
    );
    
    // Only test component should be rendered
    expect(getByTestId('test-component')).toBeInTheDocument();
    expect(queryByTestId('dependent-component')).not.toBeInTheDocument();
    
    // Only test component should have been called
    expect(TestComponent).toHaveBeenCalled();
    expect(DependentComponent).not.toHaveBeenCalled();
  });
});
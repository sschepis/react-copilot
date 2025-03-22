import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ModuleVisibilityProvider, useModuleVisibility } from '../../../src/components/ui-modules/ModuleVisibilityContext';
import { moduleRegistry, registerModule } from '../../../src/components/ui-modules/ModuleRegistry';
import { UIModule } from '../../../src/components/ui-modules/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Test component that uses the context
const TestComponent: React.FC = () => {
  const { visibilityState, toggleModule, setModuleVisibility, isModuleVisible } = useModuleVisibility();
  
  return (
    <div>
      <div data-testid="visibility-state">{JSON.stringify(visibilityState)}</div>
      <button
        data-testid="toggle-test-module"
        onClick={() => toggleModule('test-module')}
      >
        Toggle Test Module
      </button>
      <button
        data-testid="set-test-module-visible"
        onClick={() => setModuleVisibility('test-module', true)}
      >
        Make Test Module Visible
      </button>
      <button
        data-testid="set-test-module-hidden"
        onClick={() => setModuleVisibility('test-module', false)}
      >
        Make Test Module Hidden
      </button>
      <div data-testid="is-test-module-visible">
        {isModuleVisible('test-module') ? 'visible' : 'hidden'}
      </div>
      <div data-testid="is-dependent-module-visible">
        {isModuleVisible('dependent-module') ? 'visible' : 'hidden'}
      </div>
    </div>
  );
};

describe('ModuleVisibilityContext', () => {
  // Sample modules for testing
  const testModule: UIModule = {
    id: 'test-module',
    name: 'Test Module',
    description: 'A test module',
    defaultVisible: false,
    category: 'custom',
    component: () => null, // Mock component
  };
  
  const dependentModule: UIModule = {
    id: 'dependent-module',
    name: 'Dependent Module',
    description: 'A module that depends on test-module',
    defaultVisible: true,
    category: 'custom',
    component: () => null, // Mock component
    dependencies: ['test-module'],
  };
  
  beforeEach(() => {
    // Clear localStorage mock
    localStorageMock.clear();
    
    // Clear registry
    moduleRegistry.clear();
    
    // Register test modules
    registerModule(testModule);
    registerModule(dependentModule);
  });
  
  test('should provide default visibility state', () => {
    render(
      <ModuleVisibilityProvider>
        <TestComponent />
      </ModuleVisibilityProvider>
    );
    
    const state = JSON.parse(screen.getByTestId('visibility-state').textContent || '{}');
    
    // Check that modules have their default visibility values
    expect(state['test-module']).toBe(false);
    expect(state['dependent-module']).toBe(true);
  });
  
  test('should toggle module visibility', () => {
    render(
      <ModuleVisibilityProvider>
        <TestComponent />
      </ModuleVisibilityProvider>
    );
    
    // Initially hidden
    expect(screen.getByTestId('is-test-module-visible').textContent).toBe('hidden');
    
    // Toggle to visible
    fireEvent.click(screen.getByTestId('toggle-test-module'));
    expect(screen.getByTestId('is-test-module-visible').textContent).toBe('visible');
    
    // Toggle back to hidden
    fireEvent.click(screen.getByTestId('toggle-test-module'));
    expect(screen.getByTestId('is-test-module-visible').textContent).toBe('hidden');
  });
  
  test('should set module visibility', () => {
    render(
      <ModuleVisibilityProvider>
        <TestComponent />
      </ModuleVisibilityProvider>
    );
    
    // Initially hidden
    expect(screen.getByTestId('is-test-module-visible').textContent).toBe('hidden');
    
    // Set to visible
    fireEvent.click(screen.getByTestId('set-test-module-visible'));
    expect(screen.getByTestId('is-test-module-visible').textContent).toBe('visible');
    
    // Set to hidden
    fireEvent.click(screen.getByTestId('set-test-module-hidden'));
    expect(screen.getByTestId('is-test-module-visible').textContent).toBe('hidden');
  });
  
  test('should respect defaultVisibility prop', () => {
    render(
      <ModuleVisibilityProvider defaultVisibility={{ 'test-module': true }}>
        <TestComponent />
      </ModuleVisibilityProvider>
    );
    
    // Should be visible due to defaultVisibility prop override
    expect(screen.getByTestId('is-test-module-visible').textContent).toBe('visible');
  });
  
  test('should filter modules with modules prop', () => {
    render(
      <ModuleVisibilityProvider modules={['test-module']}>
        <TestComponent />
      </ModuleVisibilityProvider>
    );
    
    const state = JSON.parse(screen.getByTestId('visibility-state').textContent || '{}');
    
    // Only test-module should be in the state
    expect(Object.keys(state)).toHaveLength(1);
    expect(state).toHaveProperty('test-module');
    expect(state).not.toHaveProperty('dependent-module');
  });
  
  test('should save state to localStorage', () => {
    render(
      <ModuleVisibilityProvider>
        <TestComponent />
      </ModuleVisibilityProvider>
    );
    
    // Toggle module to visible
    fireEvent.click(screen.getByTestId('toggle-test-module'));
    
    // Check localStorage was called
    expect(localStorageMock.setItem).toHaveBeenCalled();
    
    // Get the saved value
    const savedStateStr = localStorageMock.setItem.mock.calls.slice(-1)[0][1];
    const savedState = JSON.parse(savedStateStr);
    
    // Verify saved state
    expect(savedState['test-module']).toBe(true);
  });
  
  test('should load state from localStorage', () => {
    // Set up localStorage
    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      'test-module': true
    }));
    
    render(
      <ModuleVisibilityProvider>
        <TestComponent />
      </ModuleVisibilityProvider>
    );
    
    // Check that localStorage was read
    expect(localStorageMock.getItem).toHaveBeenCalled();
    
    // Verify state was loaded
    expect(screen.getByTestId('is-test-module-visible').textContent).toBe('visible');
  });
  
  test('should handle localStorage errors gracefully', () => {
    // Mock localStorage to throw an error
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });
    
    // This should not throw but fall back to defaults
    render(
      <ModuleVisibilityProvider>
        <TestComponent />
      </ModuleVisibilityProvider>
    );
    
    // Should still render with default values
    expect(screen.getByTestId('is-test-module-visible').textContent).toBe('hidden');
  });
  
  test('should make dependencies visible when dependent module is visible', () => {
    render(
      <ModuleVisibilityProvider>
        <TestComponent />
      </ModuleVisibilityProvider>
    );
    
    // Initial state: test-module is hidden, dependent-module is visible
    expect(screen.getByTestId('is-test-module-visible').textContent).toBe('hidden');
    expect(screen.getByTestId('is-dependent-module-visible').textContent).toBe('visible');
    
    // When component mounts and effects run, test-module should become visible
    // because dependent-module depends on it and is visible
    
    // Trigger a re-render to ensure effects have run
    act(() => {
      fireEvent.click(screen.getByTestId('toggle-test-module'));
      fireEvent.click(screen.getByTestId('toggle-test-module'));
    });
    
    // Now test-module should be visible
    expect(screen.getByTestId('is-test-module-visible').textContent).toBe('visible');
  });
});
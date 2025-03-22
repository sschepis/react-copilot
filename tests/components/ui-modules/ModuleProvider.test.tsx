import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ModuleProvider } from '../../../src/components/ui-modules/ModuleProvider';
import { ModuleVisibilityProvider } from '../../../src/components/ui-modules/ModuleVisibilityContext';
import { UIControlPanel } from '../../../src/components/ui-modules/UIControlPanel';
import { ModuleRenderer } from '../../../src/components/ui-modules/ModuleRenderer';

// Mock the child components
jest.mock('../../../src/components/ui-modules/ModuleVisibilityContext', () => {
  return {
    ModuleVisibilityProvider: jest.fn(({ children }) => (
      <div data-testid="mock-visibility-provider">{children}</div>
    )),
    useModuleVisibility: jest.fn(),
  };
});

jest.mock('../../../src/components/ui-modules/UIControlPanel', () => ({
  UIControlPanel: jest.fn(() => <div data-testid="mock-control-panel" />),
}));

jest.mock('../../../src/components/ui-modules/ModuleRenderer', () => ({
  ModuleRenderer: jest.fn(() => <div data-testid="mock-module-renderer" />),
}));

describe('ModuleProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should render children', () => {
    const { getByText } = render(
      <ModuleProvider>
        <div>Test Child</div>
      </ModuleProvider>
    );
    
    expect(getByText('Test Child')).toBeInTheDocument();
  });
  
  test('should pass modules and defaultVisibility to ModuleVisibilityProvider', () => {
    const modules = ['test-module'];
    const defaultVisibility = { 'test-module': true };
    
    render(
      <ModuleProvider 
        modules={modules} 
        defaultVisibility={defaultVisibility}
      >
        <div>Test Child</div>
      </ModuleProvider>
    );
    
    // Check if ModuleVisibilityProvider was called with the correct props
    expect(ModuleVisibilityProvider).toHaveBeenCalled();
    const lastCall = (ModuleVisibilityProvider as jest.Mock).mock.calls[0][0];
    expect(lastCall.modules).toEqual(modules);
    expect(lastCall.defaultVisibility).toEqual(defaultVisibility);
  });
  
  test('should render UIControlPanel when enabled', () => {
    const { getByTestId } = render(
      <ModuleProvider enableControlPanel={true}>
        <div>Test Child</div>
      </ModuleProvider>
    );
    
    expect(getByTestId('mock-control-panel')).toBeInTheDocument();
    expect(UIControlPanel).toHaveBeenCalled();
  });
  
  test('should not render UIControlPanel when disabled', () => {
    const { queryByTestId } = render(
      <ModuleProvider enableControlPanel={false}>
        <div>Test Child</div>
      </ModuleProvider>
    );
    
    expect(queryByTestId('mock-control-panel')).not.toBeInTheDocument();
    expect(UIControlPanel).not.toHaveBeenCalled();
  });
  
  test('should pass position to UIControlPanel', () => {
    render(
      <ModuleProvider 
        enableControlPanel={true}
        controlPanelPosition="bottom-left"
      >
        <div>Test Child</div>
      </ModuleProvider>
    );
    
    // Check if UIControlPanel was called with the correct position prop
    expect(UIControlPanel).toHaveBeenCalled();
    const lastCall = (UIControlPanel as jest.Mock).mock.calls[0][0];
    expect(lastCall.position).toBe('bottom-left');
  });
  
  test('should pass modules to ModuleRenderer', () => {
    const modules = ['test-module'];
    
    render(
      <ModuleProvider modules={modules}>
        <div>Test Child</div>
      </ModuleProvider>
    );
    
    // Check if ModuleRenderer was called with the correct modules prop
    expect(ModuleRenderer).toHaveBeenCalled();
    const lastCall = (ModuleRenderer as jest.Mock).mock.calls[0][0];
    expect(lastCall.modules).toEqual(modules);
  });
});
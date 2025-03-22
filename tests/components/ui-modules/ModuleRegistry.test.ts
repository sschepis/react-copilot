import { ModuleRegistry, registerModule, registerModules } from '../../../src/components/ui-modules/ModuleRegistry';
import { UIModule } from '../../../src/components/ui-modules/types';

describe('ModuleRegistry', () => {
  // Create a clean registry instance for each test
  let registry: ModuleRegistry;
  
  beforeEach(() => {
    // Clear the registry before each test
    ModuleRegistry.getInstance().clear();
    registry = ModuleRegistry.getInstance();
  });
  
  // Sample module for testing
  const testModule: UIModule = {
    id: 'test-module',
    name: 'Test Module',
    description: 'A test module',
    defaultVisible: true,
    category: 'custom',
    component: () => null, // Mock component
  };
  
  const dependentModule: UIModule = {
    id: 'dependent-module',
    name: 'Dependent Module',
    description: 'A module with dependencies',
    defaultVisible: true,
    category: 'custom',
    component: () => null, // Mock component
    dependencies: ['test-module'],
  };

  test('should register a module', () => {
    registry.register(testModule);
    
    expect(registry.hasModule('test-module')).toBe(true);
    expect(registry.getModule('test-module')).toEqual(testModule);
  });
  
  test('should register multiple modules', () => {
    registry.registerMany([testModule, dependentModule]);
    
    expect(registry.hasModule('test-module')).toBe(true);
    expect(registry.hasModule('dependent-module')).toBe(true);
  });
  
  test('should throw error when registering duplicate modules', () => {
    registry.register(testModule);
    
    expect(() => {
      registry.register(testModule);
    }).toThrow(/already exists/);
  });
  
  test('should unregister a module', () => {
    registry.register(testModule);
    
    expect(registry.unregister('test-module')).toBe(true);
    expect(registry.hasModule('test-module')).toBe(false);
  });
  
  test('should return false when unregistering non-existent module', () => {
    expect(registry.unregister('non-existent')).toBe(false);
  });
  
  test('should clear all modules', () => {
    registry.registerMany([testModule, dependentModule]);
    
    registry.clear();
    
    expect(registry.hasModule('test-module')).toBe(false);
    expect(registry.hasModule('dependent-module')).toBe(false);
    expect(registry.getAllModules().length).toBe(0);
  });
  
  test('should get all modules', () => {
    registry.registerMany([testModule, dependentModule]);
    
    const allModules = registry.getAllModules();
    
    expect(allModules).toHaveLength(2);
    expect(allModules).toContainEqual(testModule);
    expect(allModules).toContainEqual(dependentModule);
  });
  
  test('should get modules by category', () => {
    const debugModule: UIModule = {
      id: 'debug-module',
      name: 'Debug Module',
      defaultVisible: true,
      category: 'debug',
      component: () => null,
    };
    
    registry.registerMany([testModule, debugModule]);
    
    const customModules = registry.getModulesByCategory('custom');
    const debugModules = registry.getModulesByCategory('debug');
    
    expect(customModules).toHaveLength(1);
    expect(debugModules).toHaveLength(1);
    expect(customModules[0]).toEqual(testModule);
    expect(debugModules[0]).toEqual(debugModule);
  });
  
  test('should filter modules by include list', () => {
    registry.registerMany([testModule, dependentModule]);
    
    const filtered = registry.filterModules(['test-module']);
    
    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toEqual(testModule);
  });
  
  test('should filter modules by exclude list', () => {
    registry.registerMany([testModule, dependentModule]);
    
    const filtered = registry.filterModules(undefined, ['test-module']);
    
    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toEqual(dependentModule);
  });
  
  test('should check if dependencies are satisfied', () => {
    registry.registerMany([testModule, dependentModule]);
    
    expect(registry.areDependenciesSatisfied('test-module')).toBe(true);
    expect(registry.areDependenciesSatisfied('dependent-module')).toBe(true);
    
    registry.unregister('test-module');
    
    expect(registry.areDependenciesSatisfied('dependent-module')).toBe(false);
  });
  
  test('should get dependents of a module', () => {
    registry.registerMany([testModule, dependentModule]);
    
    const dependents = registry.getDependents('test-module');
    
    expect(dependents).toHaveLength(1);
    expect(dependents[0]).toEqual(dependentModule);
  });
  
  test('should use helper function registerModule', () => {
    registerModule(testModule);
    
    expect(ModuleRegistry.getInstance().hasModule('test-module')).toBe(true);
  });
  
  test('should use helper function registerModules', () => {
    registerModules([testModule, dependentModule]);
    
    expect(ModuleRegistry.getInstance().hasModule('test-module')).toBe(true);
    expect(ModuleRegistry.getInstance().hasModule('dependent-module')).toBe(true);
  });
});
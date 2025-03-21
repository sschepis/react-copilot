/**
 * Adapter for maintaining compatibility with the original TestGenerator API
 * This allows existing code to continue working while transitioning to the new architecture
 */

import {
  CodeToTest,
  TestGenerationOptions,
  TestGenerationResult,
  TestFramework,
  TestType,
  CoverageLevel,
  AssertionStyle,
  generateTests,
  generateTestSuite,
  setDefaultOptions,
  generateComponentTests,
  generateUnitTests
} from './test';

/**
 * @deprecated Use the modular test system from the 'test' directory instead
 */
export class TestGenerator {
  /**
   * Generate tests for a code snippet
   * 
   * @deprecated Use generateTests from the test module instead
   */
  static generateTests(code: string, options: any = {}): string {
    console.warn(
      'TestGenerator.generateTests is deprecated. ' + 
      'Use generateTests from the test module instead.'
    );
    
    // Convert to the new format
    const codeToTest: CodeToTest = {
      sourceCode: code,
      filePath: options.filePath,
      codeType: options.codeType,
      dependencies: options.dependencies,
      existingTests: options.existingTests,
      metadata: options.metadata
    };
    
    // Convert options to the new format
    const newOptions: TestGenerationOptions = this.convertOptions(options);
    
    // Create context from options
    const context = {
      projectName: options.projectName,
      testDirectory: options.testDirectory,
      targetInfo: {
        name: options.targetName || '',
        type: options.targetType || '',
        path: options.targetPath
      },
      dependencies: options.dependenciesToMock?.map((dep: string) => ({
        name: dep,
        path: dep,
        isDefault: false
      })),
      testConfig: options.testConfig,
      additionalContext: options.additionalContext
    };
    
    // Use the new system to generate tests
    const result = generateTests(codeToTest, newOptions, context);
    
    // Return just the test code
    return result.testCode;
  }
  
  /**
   * Generate unit tests for a function or class
   * 
   * @deprecated Use generateUnitTests from the test module instead
   */
  static generateUnitTests(code: string, options: any = {}): string {
    console.warn(
      'TestGenerator.generateUnitTests is deprecated. ' + 
      'Use generateUnitTests from the test module instead.'
    );
    
    // Convert to the new format
    const codeToTest: CodeToTest = {
      sourceCode: code,
      filePath: options.filePath,
      codeType: 'Function',
      dependencies: options.dependencies,
      existingTests: options.existingTests,
      metadata: options.metadata
    };
    
    // Create context from options
    const context = {
      projectName: options.projectName,
      testDirectory: options.testDirectory,
      targetInfo: {
        name: options.targetName || '',
        type: 'Function',
        path: options.targetPath
      },
      dependencies: options.dependenciesToMock?.map((dep: string) => ({
        name: dep,
        path: dep,
        isDefault: false
      })),
      testConfig: options.testConfig,
      additionalContext: options.additionalContext
    };
    
    // Use the new system to generate tests
    const result = generateUnitTests(codeToTest, context);
    
    // Return just the test code
    return result.testCode;
  }
  
  /**
   * Generate component tests for a React component
   * 
   * @deprecated Use generateComponentTests from the test module instead
   */
  static generateComponentTests(componentCode: string, options: any = {}): string {
    console.warn(
      'TestGenerator.generateComponentTests is deprecated. ' + 
      'Use generateComponentTests from the test module instead.'
    );
    
    // Convert to the new format
    const codeToTest: CodeToTest = {
      sourceCode: componentCode,
      filePath: options.filePath,
      codeType: 'Component',
      dependencies: options.dependencies,
      existingTests: options.existingTests,
      metadata: options.metadata
    };
    
    // Create context from options
    const context = {
      projectName: options.projectName,
      testDirectory: options.testDirectory,
      targetInfo: {
        name: options.componentName || options.targetName || '',
        type: 'Component',
        path: options.targetPath
      },
      dependencies: options.dependenciesToMock?.map((dep: string) => ({
        name: dep,
        path: dep,
        isDefault: false
      })),
      testConfig: options.testConfig,
      additionalContext: options.additionalContext
    };
    
    // Use the new system to generate component tests
    const result = generateComponentTests(codeToTest, context);
    
    // Return just the test code
    return result.testCode;
  }
  
  /**
   * Generate tests for multiple code files
   * 
   * @deprecated Use generateTestSuite from the test module instead
   */
  static generateTestSuite(
    codeFiles: { source: string, options?: any }[],
    suiteOptions: any = {}
  ): string {
    console.warn(
      'TestGenerator.generateTestSuite is deprecated. ' + 
      'Use generateTestSuite from the test module instead.'
    );
    
    // Convert to the new format
    const codeItems: CodeToTest[] = codeFiles.map(item => ({
      sourceCode: item.source,
      filePath: item.options?.filePath,
      codeType: item.options?.codeType,
      dependencies: item.options?.dependencies,
      existingTests: item.options?.existingTests,
      metadata: item.options?.metadata
    }));
    
    // Convert options to the new format
    const newOptions: TestGenerationOptions = this.convertOptions(suiteOptions);
    
    // Create context from options
    const context = {
      projectName: suiteOptions.projectName,
      testDirectory: suiteOptions.testDirectory,
      testConfig: suiteOptions.testConfig,
      additionalContext: suiteOptions.additionalContext
    };
    
    // Use the new system to generate a test suite
    const result = generateTestSuite(codeItems, newOptions, context);
    
    // Return just the test code
    return result.testCode;
  }
  
  /**
   * Set default options for test generation
   * 
   * @deprecated Use setDefaultOptions from the test module instead
   */
  static setDefaultOptions(options: any): void {
    console.warn(
      'TestGenerator.setDefaultOptions is deprecated. ' + 
      'Use setDefaultOptions from the test module instead.'
    );
    
    // Convert to the new format
    const newOptions: TestGenerationOptions = this.convertOptions(options);
    
    // Use the new system to set default options
    setDefaultOptions(newOptions);
  }
  
  /**
   * Convert from the old options format to the new one
   */
  private static convertOptions(oldOptions: any): TestGenerationOptions {
    const newOptions: TestGenerationOptions = {};
    
    // Convert framework
    if (oldOptions.framework) {
      switch (oldOptions.framework.toLowerCase()) {
        case 'jest':
          newOptions.framework = TestFramework.JEST;
          break;
        case 'mocha':
          newOptions.framework = TestFramework.MOCHA;
          break;
        case 'cypress':
          newOptions.framework = TestFramework.CYPRESS;
          break;
        case 'rtl':
        case 'react-testing-library':
        case 'testing-library':
          newOptions.framework = TestFramework.TESTING_LIBRARY;
          break;
        case 'enzyme':
          newOptions.framework = TestFramework.ENZYME;
          break;
        case 'vitest':
          newOptions.framework = TestFramework.VITEST;
          break;
      }
    }
    
    // Convert test type
    if (oldOptions.testType) {
      switch (oldOptions.testType.toLowerCase()) {
        case 'unit':
          newOptions.testType = TestType.UNIT;
          break;
        case 'integration':
          newOptions.testType = TestType.INTEGRATION;
          break;
        case 'e2e':
          newOptions.testType = TestType.E2E;
          break;
        case 'snapshot':
          newOptions.testType = TestType.SNAPSHOT;
          break;
        case 'performance':
          newOptions.testType = TestType.PERFORMANCE;
          break;
        case 'accessibility':
          newOptions.testType = TestType.ACCESSIBILITY;
          break;
      }
    }
    
    // Convert coverage level
    if (oldOptions.coverageLevel) {
      switch (oldOptions.coverageLevel.toLowerCase()) {
        case 'basic':
        case 'minimal':
          newOptions.coverageLevel = CoverageLevel.BASIC;
          break;
        case 'standard':
        case 'normal':
          newOptions.coverageLevel = CoverageLevel.STANDARD;
          break;
        case 'comprehensive':
        case 'detailed':
          newOptions.coverageLevel = CoverageLevel.COMPREHENSIVE;
          break;
        case 'complete':
        case 'full':
          newOptions.coverageLevel = CoverageLevel.COMPLETE;
          break;
      }
    }
    
    // Convert assertion style
    if (oldOptions.assertionStyle) {
      switch (oldOptions.assertionStyle.toLowerCase()) {
        case 'expect':
          newOptions.assertionStyle = AssertionStyle.EXPECT;
          break;
        case 'assert':
          newOptions.assertionStyle = AssertionStyle.ASSERT;
          break;
        case 'should':
          newOptions.assertionStyle = AssertionStyle.SHOULD;
          break;
      }
    }
    
    // Convert boolean options
    if (oldOptions.includeSetupAndTeardown !== undefined) {
      newOptions.includeSetupAndTeardown = !!oldOptions.includeSetupAndTeardown;
    }
    
    if (oldOptions.includeComments !== undefined) {
      newOptions.includeComments = !!oldOptions.includeComments;
    }
    
    if (oldOptions.generateMocks !== undefined) {
      newOptions.generateMocks = !!oldOptions.generateMocks;
    }
    
    if (oldOptions.useTypeScript !== undefined) {
      newOptions.useTypeScript = !!oldOptions.useTypeScript;
    }
    
    if (oldOptions.focusOnEdgeCases !== undefined) {
      newOptions.focusOnEdgeCases = !!oldOptions.focusOnEdgeCases;
    }
    
    if (oldOptions.includePerformanceTests !== undefined) {
      newOptions.includePerformanceTests = !!oldOptions.includePerformanceTests;
    }
    
    if (oldOptions.includeAccessibilityTests !== undefined) {
      newOptions.includeAccessibilityTests = !!oldOptions.includeAccessibilityTests;
    }
    
    // Convert numeric options
    if (oldOptions.coverageThreshold !== undefined) {
      newOptions.coverageThreshold = +oldOptions.coverageThreshold;
    }
    
    // Convert other specific options
    if (oldOptions.includeTemplates !== undefined) {
      newOptions.includeTemplates = !!oldOptions.includeTemplates;
    }
    
    if (oldOptions.useTestDataFactories !== undefined) {
      newOptions.useTestDataFactories = !!oldOptions.useTestDataFactories;
    }
    
    // Add any custom options
    if (oldOptions.customOptions) {
      newOptions.customOptions = { ...oldOptions.customOptions };
    }
    
    return newOptions;
  }
}
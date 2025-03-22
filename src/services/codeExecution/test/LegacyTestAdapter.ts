import * as ts from 'typescript';
import { InferredProp } from '../PropTypeInference';
import {
  CodeToTest,
  TestGenerationOptions,
  TestContext,
  TestGenerationResult,
  TestFramework,
  TestType,
  CoverageLevel,
  AssertionStyle
} from './types';
import { TestManager } from './TestManager';

/**
 * Legacy test case definition
 */
export interface LegacyTestCase {
  description: string;
  props: Record<string, any>;
  assertions: string[];
  setup?: string;
  teardown?: string;
}

/**
 * Legacy test generator options
 */
export interface LegacyTestGeneratorOptions {
  /** Testing framework to use */
  framework: 'jest' | 'react-testing-library' | 'enzyme';
  /** Include snapshot tests */
  includeSnapshots?: boolean;
  /** Include prop validation tests */
  includePropValidation?: boolean;
  /** Include event handler tests */
  includeEvents?: boolean;
  /** Include accessibility tests */
  includeAccessibility?: boolean;
  /** Test file naming pattern (default: [ComponentName].test.tsx) */
  testFilePattern?: string;
  /** Custom test cases to include */
  customTestCases?: LegacyTestCase[];
}

/**
 * Legacy test generation result
 */
export interface LegacyTestGenerationResult {
  testCode: string;
  testFilePath: string;
  coverage: {
    props: number;
    events: number;
    branches: number;
    statements: number;
  };
  suggestedMocks: string[];
}

/**
 * Adapter class that implements the original TestGenerator API
 * but uses the new refactored implementation internally
 */
export class LegacyTestAdapter {
  private manager: TestManager;
  private options: LegacyTestGeneratorOptions;

  constructor(options: LegacyTestGeneratorOptions) {
    this.options = {
      framework: options.framework,
      includeSnapshots: options.includeSnapshots ?? true,
      includePropValidation: options.includePropValidation ?? true,
      includeEvents: options.includeEvents ?? true,
      includeAccessibility: options.includeAccessibility ?? false,
      testFilePattern: options.testFilePattern ?? '[name].test.tsx',
      customTestCases: options.customTestCases ?? []
    };

    this.manager = new TestManager();
  }

  /**
   * Generate tests for a component using the new implementation
   */
  generateTests(
    componentPath: string,
    componentCode: string,
    inferredProps?: InferredProp[]
  ): LegacyTestGenerationResult {
    // Convert to the new format
    const codeToTest: CodeToTest = {
      sourceCode: componentCode,
      filePath: componentPath,
      codeType: 'react-component',
      metadata: {
        props: inferredProps || []
      }
    };

    // Convert options
    const newOptions = this.convertOptions(this.options);

    // Create context with additional metadata
    const context: TestContext = {
      targetInfo: {
        name: this.extractComponentName(componentCode),
        type: 'component',
        path: componentPath
      },
      testDirectory: this.getTestDirectory(componentPath),
      additionalContext: {
        legacyOptions: this.options
      }
    };

    // Generate tests using the new system
    const result = this.manager.generateTests(codeToTest, newOptions, context);

    // Convert back to the legacy format
    return {
      testCode: result.testCode,
      testFilePath: result.testPath || this.generateTestFilePath(componentPath, context.targetInfo?.name || ''),
      coverage: {
        props: result.estimatedCoverage ? result.estimatedCoverage / 100 : 0.8,
        events: result.estimatedCoverage ? result.estimatedCoverage / 100 : 0.7,
        branches: result.estimatedCoverage ? result.estimatedCoverage / 100 : 0.75,
        statements: result.estimatedCoverage ? result.estimatedCoverage / 100 : 0.8
      },
      suggestedMocks: result.dependencies || []
    };
  }

  /**
   * Convert legacy options to new format
   */
  private convertOptions(legacyOptions: LegacyTestGeneratorOptions): TestGenerationOptions {
    // Map the framework
    let framework: TestFramework;
    switch (legacyOptions.framework) {
      case 'jest':
        framework = TestFramework.JEST;
        break;
      case 'react-testing-library':
        framework = TestFramework.TESTING_LIBRARY;
        break;
      case 'enzyme':
        framework = TestFramework.ENZYME;
        break;
      default:
        framework = TestFramework.JEST;
    }

    return {
      framework,
      testType: TestType.UNIT,
      coverageLevel: CoverageLevel.STANDARD,
      assertionStyle: AssertionStyle.EXPECT,
      useTypeScript: true,
      includeAccessibilityTests: legacyOptions.includeAccessibility,
      customOptions: {
        includeSnapshots: legacyOptions.includeSnapshots,
        includePropValidation: legacyOptions.includePropValidation,
        includeEvents: legacyOptions.includeEvents,
        testFilePattern: legacyOptions.testFilePattern,
        customTestCases: legacyOptions.customTestCases
      }
    };
  }

  /**
   * Extract component name from source code
   */
  private extractComponentName(componentCode: string): string {
    let componentName = 'Component';
    
    // Match common component definition patterns
    const functionMatch = /function\s+([A-Z]\w+)\s*\(/g.exec(componentCode);
    const arrowMatch = /const\s+([A-Z]\w+)\s*=\s*\(?[^)]*\)?\s*=>/g.exec(componentCode);
    const classMatch = /class\s+([A-Z]\w+)\s+extends\s+React\.Component/g.exec(componentCode);
    
    if (functionMatch) {
      componentName = functionMatch[1];
    } else if (arrowMatch) {
      componentName = arrowMatch[1];
    } else if (classMatch) {
      componentName = classMatch[1];
    } else {
      // Try to find export default if we couldn't find the component definition
      const exportMatches = /export\s+default\s+(\w+)/g.exec(componentCode);
      if (exportMatches) {
        componentName = exportMatches[1];
      }
    }
    
    return componentName;
  }

  /**
   * Generate test file path from component path
   */
  private generateTestFilePath(componentPath: string, componentName: string): string {
    const path = require('path');
    const lastSlashIndex = componentPath.lastIndexOf('/');
    const directory = componentPath.substring(0, lastSlashIndex + 1);
    
    // Replace [name] placeholder with component name
    const testFilename = this.options.testFilePattern!.replace('[name]', componentName);
    
    return directory + testFilename;
  }

  /**
   * Get the directory for test files
   */
  private getTestDirectory(componentPath: string): string {
    const path = require('path');
    const lastSlashIndex = componentPath.lastIndexOf('/');
    return componentPath.substring(0, lastSlashIndex + 1);
  }
}
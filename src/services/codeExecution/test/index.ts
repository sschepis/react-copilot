/**
 * Test Generation Module
 * 
 * A modular system for generating automated tests for different types of code
 * with various testing frameworks and levels of coverage.
 */

// Export types for external use
export * from './types';

// Export base functionality
export * from './TestGeneratorBase';
export * from './TestGeneratorFactory';
export * from './TestManager';

// Export concrete generators
export * from './generators/ReactComponentTestGenerator';

// Additional generators will be exported here as they are implemented
// export * from './generators/FunctionTestGenerator';
// export * from './generators/ApiTestGenerator';

/**
 * Main functionality for generating tests
 */
import { TestManager, defaultTestManager } from './TestManager';
import {
  CodeToTest,
  TestGenerationOptions,
  TestContext,
  TestGenerationResult,
  TestFramework,
  TestType,
  CoverageLevel
} from './types';

// Export the default manager instance
export const testManager = defaultTestManager;

/**
 * Generate tests for a single code item
 * 
 * @param code The code to test
 * @param options Options for the test generation
 * @param context Additional context for the tests
 * @returns The test generation result
 */
export function generateTests(
  code: CodeToTest,
  options?: TestGenerationOptions,
  context?: TestContext
): TestGenerationResult {
  return testManager.generateTests(code, options, context);
}

/**
 * Generate tests for multiple code items
 * 
 * @param codeItems The code items to test
 * @param options Options for the test generation
 * @param context Additional context for the tests
 * @returns Array of test generation results
 */
export function generateMultipleTests(
  codeItems: CodeToTest[],
  options?: TestGenerationOptions,
  context?: TestContext
): TestGenerationResult[] {
  return testManager.generateMultipleTests(codeItems, options, context);
}

/**
 * Generate a test suite that includes tests for multiple related code items
 * 
 * @param codeItems The code items to test
 * @param options Options for the test generation
 * @param context Additional context for the tests
 * @returns A combined test suite result
 */
export function generateTestSuite(
  codeItems: CodeToTest[],
  options?: TestGenerationOptions,
  context?: TestContext
): TestGenerationResult {
  return testManager.generateTestSuite(codeItems, options, context);
}

/**
 * Generate unit tests for a component or function
 * 
 * @param code The code to test
 * @param context Additional context for the tests
 * @returns The test generation result
 */
export function generateUnitTests(
  code: CodeToTest,
  context?: TestContext
): TestGenerationResult {
  return testManager.generateUnitTests(code, context);
}

/**
 * Generate React component tests using Testing Library
 * 
 * @param code The component code to test
 * @param context Additional context for the tests
 * @returns The test generation result
 */
export function generateComponentTests(
  code: CodeToTest,
  context?: TestContext
): TestGenerationResult {
  return testManager.generateComponentTests(code, context);
}

/**
 * Generate snapshot tests for a component
 * 
 * @param code The component code to test
 * @param context Additional context for the tests
 * @returns The test generation result
 */
export function generateSnapshotTests(
  code: CodeToTest,
  context?: TestContext
): TestGenerationResult {
  return testManager.generateTests(
    code,
    {
      framework: TestFramework.JEST,
      testType: TestType.SNAPSHOT
    },
    context
  );
}

/**
 * Generate integration tests
 * 
 * @param code The code to test
 * @param context Additional context for the tests
 * @returns The test generation result
 */
export function generateIntegrationTests(
  code: CodeToTest,
  context?: TestContext
): TestGenerationResult {
  return testManager.generateIntegrationTests(code, context);
}

/**
 * Set default options for all test generation
 * 
 * @param options Default options to use
 */
export function setDefaultOptions(options: Partial<TestGenerationOptions>): void {
  testManager.setDefaultOptions(options);
}

/**
 * Register a custom generator with the default manager
 * 
 * @param generator The generator to register
 */
export function registerGenerator(generator: any): void {
  testManager.registerGenerator(generator);
}

/**
 * Get all registered generators
 * 
 * @returns Array of all registered generators
 */
export function getAllGenerators(): any[] {
  return testManager.getAllGenerators();
}
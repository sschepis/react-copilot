import * as ts from 'typescript';

/**
 * Testing framework
 */
export enum TestFramework {
  /** Jest testing framework */
  JEST = 'jest',
  /** Mocha testing framework */
  MOCHA = 'mocha',
  /** Cypress testing framework */
  CYPRESS = 'cypress',
  /** React Testing Library */
  TESTING_LIBRARY = 'testing-library',
  /** Enzyme testing utility */
  ENZYME = 'enzyme',
  /** Vitest testing framework */
  VITEST = 'vitest',
  /** Custom testing framework */
  CUSTOM = 'custom'
}

/**
 * Test type
 */
export enum TestType {
  /** Unit tests for small, isolated units of code */
  UNIT = 'unit',
  /** Integration tests for interactions between components */
  INTEGRATION = 'integration',
  /** End-to-end tests for full application flows */
  E2E = 'e2e',
  /** Snapshot tests for UI components */
  SNAPSHOT = 'snapshot',
  /** Performance tests */
  PERFORMANCE = 'performance',
  /** Accessibility tests */
  ACCESSIBILITY = 'accessibility',
  /** Custom test type */
  CUSTOM = 'custom'
}

/**
 * Test coverage level
 */
export enum CoverageLevel {
  /** Basic coverage that tests main functionality */
  BASIC = 'basic',
  /** Standard coverage with common edge cases */
  STANDARD = 'standard',
  /** Comprehensive coverage with extensive edge cases */
  COMPREHENSIVE = 'comprehensive',
  /** Complete coverage aiming for 100% code coverage */
  COMPLETE = 'complete'
}

/**
 * Assertion style
 */
export enum AssertionStyle {
  /** Expect/should style assertions */
  EXPECT = 'expect',
  /** Assert style */
  ASSERT = 'assert',
  /** Should style */
  SHOULD = 'should',
  /** Custom assertion style */
  CUSTOM = 'custom'
}

/**
 * Test structuring style
 */
export enum TestStructure {
  /** Describe/it structure */
  DESCRIBE_IT = 'describe-it',
  /** Test/it structure */
  TEST_IT = 'test-it',
  /** Suite/test structure */
  SUITE_TEST = 'suite-test',
  /** Custom test structure */
  CUSTOM = 'custom'
}

/**
 * Mocking approach
 */
export enum MockingApproach {
  /** Manual mocks */
  MANUAL = 'manual',
  /** Automatic mocks */
  AUTO = 'auto',
  /** Spy-based mocks */
  SPY = 'spy',
  /** Stub-based mocks */
  STUB = 'stub',
  /** Factory-based mocks */
  FACTORY = 'factory',
  /** Custom mocking approach */
  CUSTOM = 'custom'
}

/**
 * Options for generating tests
 */
export interface TestGenerationOptions {
  /** Testing framework to use */
  framework?: TestFramework;
  /** Type of tests to generate */
  testType?: TestType;
  /** Level of test coverage */
  coverageLevel?: CoverageLevel;
  /** Style of assertions to use */
  assertionStyle?: AssertionStyle;
  /** Structure of test cases */
  testStructure?: TestStructure;
  /** Approach for mocking dependencies */
  mockingApproach?: MockingApproach;
  /** Include setup and teardown */
  includeSetupAndTeardown?: boolean;
  /** Include comments explaining test cases */
  includeComments?: boolean;
  /** Generate mocks for dependencies */
  generateMocks?: boolean;
  /** Use TypeScript for tests */
  useTypeScript?: boolean;
  /** Focus on edge cases */
  focusOnEdgeCases?: boolean;
  /** Include performance assertions */
  includePerformanceTests?: boolean;
  /** Include accessibility tests */
  includeAccessibilityTests?: boolean;
  /** Code coverage threshold (percentage) */
  coverageThreshold?: number;
  /** Include test templates for common scenarios */
  includeTemplates?: boolean;
  /** Use test data factories */
  useTestDataFactories?: boolean;
  /** Custom options */
  customOptions?: Record<string, any>;
}

/**
 * Context for generating tests
 */
export interface TestContext {
  /** Project name */
  projectName?: string;
  /** Directory for tests */
  testDirectory?: string;
  /** Information about component or function being tested */
  targetInfo?: {
    /** Name of component or function */
    name: string;
    /** Type (component, function, class, etc.) */
    type: string;
    /** Path to file containing the code */
    path?: string;
    /** Additional metadata */
    metadata?: Record<string, any>;
  };
  /** Dependencies that need to be mocked */
  dependencies?: Array<{
    /** Name of dependency */
    name: string;
    /** Import path */
    path: string;
    /** If it's a default or named import */
    isDefault?: boolean;
    /** Functions or properties to mock */
    exports?: string[];
  }>;
  /** Configuration for test framework */
  testConfig?: {
    /** Path to test config file */
    configPath?: string;
    /** Test match patterns */
    testMatch?: string[];
    /** Test environment */
    testEnvironment?: string;
  };
  /** Additional context */
  additionalContext?: Record<string, any>;
}

/**
 * Code to test
 */
export interface CodeToTest {
  /** Source code to test */
  sourceCode: string;
  /** AST of the source code */
  ast?: ts.SourceFile;
  /** Path to the file */
  filePath?: string;
  /** Type of code (component, utility, etc.) */
  codeType?: string;
  /** Dependencies used in the code */
  dependencies?: string[];
  /** Existing tests (if any) */
  existingTests?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Result of test generation
 */
export interface TestGenerationResult {
  /** Generated test code */
  testCode: string;
  /** Framework used */
  framework: TestFramework;
  /** Type of tests generated */
  testType: TestType;
  /** Path where tests should be saved */
  testPath?: string;
  /** Dependencies that need to be installed */
  dependencies?: string[];
  /** Warnings or suggestions */
  warnings?: string[];
  /** Estimated code coverage */
  estimatedCoverage?: number;
  /** Test cases included */
  testCases?: Array<{
    /** Name of test case */
    name: string;
    /** Description of what it tests */
    description: string;
    /** Expected code coverage */
    coverage?: string[];
  }>;
  /** Mocks generated */
  mocks?: Record<string, string>;
  /** Additional outputs */
  additionalOutputs?: Record<string, any>;
}

/**
 * Interface for test generators
 */
export interface ITestGenerator {
  /** Name of the generator */
  readonly name: string;
  
  /** Frameworks supported by this generator */
  readonly supportedFrameworks: TestFramework[];
  
  /** Test types supported by this generator */
  readonly supportedTestTypes: TestType[];
  
  /**
   * Generate tests for the given code
   */
  generateTests(
    code: CodeToTest, 
    options?: TestGenerationOptions, 
    context?: TestContext
  ): TestGenerationResult;
  
  /**
   * Check if this generator can generate tests for the given code
   */
  canGenerateTests(code: CodeToTest, framework: TestFramework, testType: TestType): boolean;
  
  /**
   * Configure the generator with specific options
   */
  configure(options: Record<string, any>): void;
}

/**
 * Interface for mock generators
 */
export interface IMockGenerator {
  /** Name of the generator */
  readonly name: string;
  
  /**
   * Generate mocks for dependencies
   */
  generateMocks(
    dependencies: Array<{name: string, path: string, exports?: string[]}>,
    options?: {
      framework?: TestFramework;
      approach?: MockingApproach;
      useTypeScript?: boolean;
      customOptions?: Record<string, any>;
    }
  ): Record<string, string>;
  
  /**
   * Configure the generator with specific options
   */
  configure(options: Record<string, any>): void;
}

/**
 * Interface for test template providers
 */
export interface ITestTemplateProvider {
  /** Name of the provider */
  readonly name: string;
  
  /** Templates provided */
  readonly availableTemplates: string[];
  
  /**
   * Get a test template by name
   */
  getTemplate(
    templateName: string,
    options?: {
      framework?: TestFramework;
      testType?: TestType;
      useTypeScript?: boolean;
      customOptions?: Record<string, any>;
    }
  ): string;
  
  /**
   * Configure the provider with specific options
   */
  configure(options: Record<string, any>): void;
}
import * as ts from 'typescript';
import {
  ITestGenerator,
  CodeToTest,
  TestGenerationOptions,
  TestContext,
  TestGenerationResult,
  TestFramework,
  TestType,
  CoverageLevel,
  AssertionStyle,
  TestStructure,
  MockingApproach
} from './types';

/**
 * Base class for test generators
 * Provides common functionality for generating tests
 */
export abstract class TestGeneratorBase implements ITestGenerator {
  /** Name of the generator */
  readonly name: string;
  
  /** Frameworks supported by this generator */
  readonly supportedFrameworks: TestFramework[];
  
  /** Test types supported by this generator */
  readonly supportedTestTypes: TestType[];
  
  /** Configuration options */
  protected options: Record<string, any> = {};
  
  /** Default test generation options */
  protected defaultOptions: TestGenerationOptions = {
    framework: TestFramework.JEST,
    testType: TestType.UNIT,
    coverageLevel: CoverageLevel.STANDARD,
    assertionStyle: AssertionStyle.EXPECT,
    testStructure: TestStructure.DESCRIBE_IT,
    mockingApproach: MockingApproach.MANUAL,
    includeSetupAndTeardown: true,
    includeComments: true,
    generateMocks: true,
    useTypeScript: true,
    focusOnEdgeCases: true,
    includePerformanceTests: false,
    includeAccessibilityTests: false,
    coverageThreshold: 80,
    includeTemplates: false,
    useTestDataFactories: false
  };
  
  constructor(name: string, supportedFrameworks: TestFramework[], supportedTestTypes: TestType[]) {
    this.name = name;
    this.supportedFrameworks = supportedFrameworks;
    this.supportedTestTypes = supportedTestTypes;
  }
  
  /**
   * Generate tests for the given code
   * This is the main method that clients will call
   */
  generateTests(
    code: CodeToTest,
    options?: TestGenerationOptions,
    context?: TestContext
  ): TestGenerationResult {
    // Merge with default options
    const mergedOptions = {
      ...this.defaultOptions,
      ...options
    };
    
    // Ensure we have a supported framework
    if (mergedOptions.framework && !this.supportedFrameworks.includes(mergedOptions.framework)) {
      throw new Error(`Framework ${mergedOptions.framework} not supported by generator ${this.name}`);
    }
    
    // Ensure we have a supported test type
    if (mergedOptions.testType && !this.supportedTestTypes.includes(mergedOptions.testType)) {
      throw new Error(`Test type ${mergedOptions.testType} not supported by generator ${this.name}`);
    }
    
    // Parse AST if not provided
    if (!code.ast && code.sourceCode) {
      try {
        code = {
          ...code,
          ast: this.parseAST(code.sourceCode, code.filePath)
        };
      } catch (error) {
        console.warn('Failed to parse code AST:', error);
      }
    }
    
    // Detect dependencies if not provided
    if (!code.dependencies && code.sourceCode) {
      code = {
        ...code,
        dependencies: this.detectDependencies(code.sourceCode, code.ast)
      };
    }
    
    // Create full context
    const fullContext: TestContext = {
      ...(context || {}),
      targetInfo: {
        ...(context?.targetInfo || {name: '', type: ''}),
        name: context?.targetInfo?.name || this.detectTargetName(code),
        type: context?.targetInfo?.type || this.detectTargetType(code),
        path: context?.targetInfo?.path || code.filePath
      }
    };
    
    // Determine test path if not specified
    if (!fullContext.testDirectory && code.filePath) {
      fullContext.testDirectory = this.inferTestDirectory(code.filePath);
    }
    
    // Generate the test code using the specific implementation
    const testCode = this.generateTestCode(code, mergedOptions, fullContext);
    
    // Determine dependencies required for tests
    const dependencies = this.determineDependencies(mergedOptions.framework as TestFramework);
    
    // Generate test cases information
    const testCases = this.extractTestCases(testCode);
    
    // Generate mocks if required
    const mocks = mergedOptions.generateMocks ? 
      this.generateMocks(code, code.dependencies || [], mergedOptions, fullContext) : 
      undefined;
    
    // Estimate coverage
    const estimatedCoverage = this.estimateCoverage(testCode, code, mergedOptions);
    
    // Generate warnings
    const warnings = this.generateWarnings(testCode, code, mergedOptions);
    
    // Determine test path
    const testPath = this.determineTestPath(code.filePath, fullContext);
    
    // Return the test generation result
    return {
      testCode,
      framework: mergedOptions.framework as TestFramework,
      testType: mergedOptions.testType as TestType,
      testPath,
      dependencies,
      warnings,
      estimatedCoverage,
      testCases,
      mocks,
      additionalOutputs: this.generateAdditionalOutputs(code, mergedOptions, fullContext)
    };
  }
  
  /**
   * Check if this generator can generate tests for the given code
   */
  canGenerateTests(code: CodeToTest, framework: TestFramework, testType: TestType): boolean {
    return this.supportedFrameworks.includes(framework) && 
           this.supportedTestTypes.includes(testType);
  }
  
  /**
   * Configure the generator with specific options
   */
  configure(options: Record<string, any>): void {
    this.options = {
      ...this.options,
      ...options
    };
    
    // Update default options if provided
    if (options.defaultOptions) {
      this.defaultOptions = {
        ...this.defaultOptions,
        ...options.defaultOptions
      };
    }
  }
  
  /**
   * Generate the actual test code
   * This method must be implemented by specific generators
   */
  protected abstract generateTestCode(
    code: CodeToTest,
    options: TestGenerationOptions,
    context: TestContext
  ): string;
  
  /**
   * Parse code into an AST
   */
  protected parseAST(code: string, filePath?: string): ts.SourceFile {
    const fileName = filePath || 'temp.ts';
    const isTypeScript = fileName.endsWith('.ts') || fileName.endsWith('.tsx');
    
    return ts.createSourceFile(
      fileName,
      code,
      ts.ScriptTarget.Latest,
      /* setParentNodes */ true,
      isTypeScript ? ts.ScriptKind.TSX : ts.ScriptKind.JSX
    );
  }
  
  /**
   * Detect dependencies in the code
   */
  protected detectDependencies(code: string, ast?: ts.SourceFile): string[] {
    if (!ast) {
      return this.detectDependenciesFromString(code);
    }
    
    const dependencies: string[] = [];
    
    // Visit all import declarations
    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier)) {
          dependencies.push(moduleSpecifier.text);
        }
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(ast);
    
    return dependencies;
  }
  
  /**
   * Detect dependencies from code string
   */
  protected detectDependenciesFromString(code: string): string[] {
    const dependencies: string[] = [];
    const importRegex = /import\s+(?:.*\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(code)) !== null) {
      dependencies.push(match[1]);
    }
    
    // Look for require statements
    const requireRegex = /(?:const|let|var)\s+.*\s*=\s*require\(['"]([^'"]+)['"]\)/g;
    while ((match = requireRegex.exec(code)) !== null) {
      dependencies.push(match[1]);
    }
    
    return dependencies;
  }
  
  /**
   * Detect the name of the target being tested
   */
  protected detectTargetName(code: CodeToTest): string {
    if (!code.ast) {
      return this.detectTargetNameFromString(code.sourceCode);
    }
    
    let targetName = '';
    
    // Visit AST to find exported classes, functions, or variables
    const visit = (node: ts.Node) => {
      // Check for export declarations
      if (ts.isExportAssignment(node) && node.expression && ts.isIdentifier(node.expression)) {
        targetName = node.expression.text;
        return;
      }
      
      // Check for exported class declarations
      if (ts.isClassDeclaration(node) && node.name && 
          node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        targetName = node.name.text;
        return;
      }
      
      // Check for exported function declarations
      if (ts.isFunctionDeclaration(node) && node.name && 
          node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        targetName = node.name.text;
        return;
      }
      
      // Check for exported const/let/var declarations
      if (ts.isVariableStatement(node) && 
          node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        const declaration = node.declarationList.declarations[0];
        if (declaration && declaration.name && ts.isIdentifier(declaration.name)) {
          targetName = declaration.name.text;
          return;
        }
      }
      
      // Continue with child nodes
      ts.forEachChild(node, visit);
    };
    
    visit(code.ast);
    
    // If we couldn't find a name from AST, try to extract from file path
    if (!targetName && code.filePath) {
      const fileName = code.filePath.split('/').pop() || '';
      const baseName = fileName.split('.')[0];
      if (baseName && baseName !== 'index') {
        targetName = baseName;
      }
    }
    
    return targetName || 'Unknown';
  }
  
  /**
   * Detect target name from code string
   */
  protected detectTargetNameFromString(code: string): string {
    // Look for export default statement
    const exportDefaultRegex = /export\s+default\s+(?:function|class|const|let|var)?\s*(\w+)/;
    const exportDefaultMatch = code.match(exportDefaultRegex);
    if (exportDefaultMatch) {
      return exportDefaultMatch[1];
    }
    
    // Look for named exports
    const namedExportRegex = /export\s+(?:function|class|const|let|var)\s+(\w+)/;
    const namedExportMatch = code.match(namedExportRegex);
    if (namedExportMatch) {
      return namedExportMatch[1];
    }
    
    // Look for React components
    const reactComponentRegex = /(?:function|class|const|let|var)\s+(\w+)(?:\s+extends\s+(?:React\.)?Component|\s*=\s*\(\s*(?:props|{[^}]*})\s*\)\s*=>)/;
    const reactComponentMatch = code.match(reactComponentRegex);
    if (reactComponentMatch) {
      return reactComponentMatch[1];
    }
    
    return 'Unknown';
  }
  
  /**
   * Detect the type of the target being tested
   */
  protected detectTargetType(code: CodeToTest): string {
    if (!code.ast) {
      return this.detectTargetTypeFromString(code.sourceCode);
    }
    
    // Visit AST to determine the type
    let targetType = '';
    
    const visit = (node: ts.Node) => {
      // Check for React components
      if (ts.isClassDeclaration(node) && node.heritageClauses?.some(
          clause => clause.getText().includes('React.Component') || 
                  clause.getText().includes('Component'))) {
        targetType = 'Component';
        return;
      }
      
      // Check for functional components
      if ((ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node)) && 
          this.isFunctionalComponent(node)) {
        targetType = 'Component';
        return;
      }
      
      // Check for regular functions
      if (ts.isFunctionDeclaration(node) && !this.isFunctionalComponent(node)) {
        targetType = 'Function';
        return;
      }
      
      // Check for regular classes
      if (ts.isClassDeclaration(node) && !node.heritageClauses?.some(
          clause => clause.getText().includes('React.Component') || 
                  clause.getText().includes('Component'))) {
        targetType = 'Class';
        return;
      }
      
      // Check for utilities (common exports)
      if (ts.isVariableStatement(node) && 
          node.declarationList.declarations.some(decl => 
            decl.initializer && (
              ts.isObjectLiteralExpression(decl.initializer) || 
              ts.isArrayLiteralExpression(decl.initializer) ||
              ts.isArrowFunction(decl.initializer) ||
              ts.isFunctionExpression(decl.initializer)
            ) && 
            !this.isFunctionalComponent(decl.initializer)
          )) {
        targetType = 'Utility';
        return;
      }
      
      // Continue with child nodes
      ts.forEachChild(node, visit);
    };
    
    visit(code.ast);
    
    return targetType || 'Unknown';
  }
  
  /**
   * Detect target type from code string
   */
  protected detectTargetTypeFromString(code: string): string {
    // Check for React components
    if (code.includes('extends Component') || 
        code.includes('extends React.Component') ||
        (code.includes('return') && (code.includes('JSX') || code.includes('<div') || code.includes('<>')))) {
      return 'Component';
    }
    
    // Check for regular classes
    if (code.includes('class ') && code.includes('{')) {
      return 'Class';
    }
    
    // Check for functions
    if (code.includes('function ') || code.includes('=>')) {
      return 'Function';
    }
    
    // Check for utilities
    if (code.includes('export const') || code.includes('export let') || code.includes('export var')) {
      return 'Utility';
    }
    
    return 'Unknown';
  }
  
  /**
   * Check if a node is a functional component
   */
  protected isFunctionalComponent(node: ts.Node): boolean {
    let returnsJSX = false;
    
    // Visit body of the function
    const visitBody = (bodyNode: ts.Node) => {
      // Check for JSX element or fragment
      if (ts.isJsxElement(bodyNode) || ts.isJsxFragment(bodyNode) || ts.isJsxSelfClosingElement(bodyNode)) {
        returnsJSX = true;
        return;
      }
      
      // Check for return statement with JSX
      if (ts.isReturnStatement(bodyNode) && bodyNode.expression) {
        if (ts.isJsxElement(bodyNode.expression) || 
            ts.isJsxFragment(bodyNode.expression) || 
            ts.isJsxSelfClosingElement(bodyNode.expression)) {
          returnsJSX = true;
          return;
        }
      }
      
      // Continue search in child nodes
      ts.forEachChild(bodyNode, visitBody);
    };
    
    // Get the body based on node type
    if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) {
      if (node.body) {
        visitBody(node.body);
      }
    } else if (ts.isArrowFunction(node)) {
      if (node.body) {
        visitBody(node.body);
      }
    } else if (ts.isVariableDeclaration(node) && node.initializer) {
      if (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer)) {
        const func = node.initializer;
        if (func.body) {
          visitBody(func.body);
        }
      }
    }
    
    return returnsJSX;
  }
  
  /**
   * Infer test directory from source file path
   */
  protected inferTestDirectory(filePath: string): string {
    // Common patterns for test directories
    if (filePath.includes('/src/')) {
      // Most common: src/ -> __tests__/
      return filePath.replace('/src/', '/__tests__/');
    }
    
    // Determine the directory of the file
    const lastSlashIndex = filePath.lastIndexOf('/');
    if (lastSlashIndex !== -1) {
      const directory = filePath.substring(0, lastSlashIndex);
      return `${directory}/__tests__`;
    }
    
    return '__tests__';
  }
  
  /**
   * Determine which dependencies are required for tests
   */
  protected determineDependencies(framework: TestFramework): string[] {
    const dependencies: string[] = [];
    
    // Add framework-specific dependencies
    switch (framework) {
      case TestFramework.JEST:
        dependencies.push('@types/jest', 'jest');
        break;
      case TestFramework.MOCHA:
        dependencies.push('mocha', 'chai', '@types/mocha', '@types/chai');
        break;
      case TestFramework.CYPRESS:
        dependencies.push('cypress');
        break;
      case TestFramework.TESTING_LIBRARY:
        dependencies.push('@testing-library/react', '@testing-library/jest-dom');
        break;
      case TestFramework.ENZYME:
        dependencies.push('enzyme', 'enzyme-adapter-react-16', '@types/enzyme');
        break;
      case TestFramework.VITEST:
        dependencies.push('vitest');
        break;
    }
    
    return dependencies;
  }
  
  /**
   * Extract test cases from generated test code
   */
  protected extractTestCases(testCode: string): Array<{name: string, description: string, coverage?: string[]}> {
    const testCases: Array<{name: string, description: string, coverage?: string[]}> = [];
    
    // Look for test/it statements
    const testRegex = /(?:test|it)\s*\(\s*(['"])(.+?)\1/g;
    let match;
    
    while ((match = testRegex.exec(testCode)) !== null) {
      testCases.push({
        name: match[2],
        description: match[2],
        coverage: []
      });
    }
    
    return testCases;
  }
  
  /**
   * Generate mocks for dependencies
   */
  protected generateMocks(
    code: CodeToTest, 
    dependencies: string[], 
    options: TestGenerationOptions,
    context: TestContext
  ): Record<string, string> | undefined {
    // This is a simple implementation
    // Concrete generators should provide more sophisticated mocking
    const mocks: Record<string, string> = {};
    
    dependencies.forEach(dep => {
      if (dep.startsWith('.')) {
        // Local dependency
        mocks[dep] = `
// Mock for ${dep}
jest.mock('${dep}', () => ({
  // Add mock implementations here
}));`;
      } else {
        // External dependency
        mocks[dep] = `
// Mock for ${dep}
jest.mock('${dep}');`;
      }
    });
    
    return Object.keys(mocks).length > 0 ? mocks : undefined;
  }
  
  /**
   * Estimate code coverage of tests
   */
  protected estimateCoverage(testCode: string, code: CodeToTest, options: TestGenerationOptions): number {
    // This is a simple heuristic - real coverage would be calculated by running tests
    const testCount = (testCode.match(/(?:test|it)\s*\(/g) || []).length;
    
    // Heuristic based on coverage level and test count
    switch (options.coverageLevel) {
      case CoverageLevel.BASIC:
        return Math.min(60, testCount * 10);
      case CoverageLevel.STANDARD:
        return Math.min(80, testCount * 10);
      case CoverageLevel.COMPREHENSIVE:
        return Math.min(90, testCount * 8);
      case CoverageLevel.COMPLETE:
        return Math.min(95, testCount * 6);
      default:
        return Math.min(75, testCount * 9);
    }
  }
  
  /**
   * Generate warnings or suggestions
   */
  protected generateWarnings(
    testCode: string, 
    code: CodeToTest, 
    options: TestGenerationOptions
  ): string[] {
    const warnings: string[] = [];
    
    // Check for potential issues
    if (!testCode.includes('expect(')) {
      warnings.push('Tests do not contain assertions (expect statements)');
    }
    
    // Check for complex logic that might be hard to test
    if (code.sourceCode.includes('setTimeout') || code.sourceCode.includes('setInterval')) {
      warnings.push('Code contains timers which may require special handling in tests');
    }
    
    // Check for API calls
    if (code.sourceCode.includes('fetch(') || 
        code.sourceCode.includes('axios') || 
        code.sourceCode.includes('http.') || 
        code.sourceCode.includes('.ajax')) {
      warnings.push('Code contains API calls which should be mocked');
    }
    
    // Check coverage expectations
    if (options.coverageThreshold && options.coverageThreshold > 80) {
      warnings.push(`High coverage threshold (${options.coverageThreshold}%) may require additional test cases`);
    }
    
    return warnings;
  }
  
  /**
   * Determine the test file path
   */
  protected determineTestPath(sourcePath?: string, context?: TestContext): string | undefined {
    if (!sourcePath) {
      return context?.testDirectory ? `${context.testDirectory}/test.js` : undefined;
    }
    
    // Extract file name
    const fileNameMatch = sourcePath.match(/([^/]+)$/);
    const fileName = fileNameMatch ? fileNameMatch[1] : 'test';
    
    // Create test file name based on source file
    const testFileName = fileName.replace(/\.(js|ts|jsx|tsx)$/, '.test.$1');
    
    if (context?.testDirectory) {
      return `${context.testDirectory}/${testFileName}`;
    }
    
    // Default to same directory as source file
    const directoryMatch = sourcePath.match(/(.*\/)[^/]+$/);
    const directory = directoryMatch ? directoryMatch[1] : '';
    
    return `${directory}${testFileName}`;
  }
  
  /**
   * Generate additional outputs
   */
  protected generateAdditionalOutputs(
    code: CodeToTest,
    options: TestGenerationOptions,
    context: TestContext
  ): Record<string, any> {
    return {};
  }
  
  /**
   * Generate test setup code
   */
  protected generateSetupCode(
    framework: TestFramework,
    options: TestGenerationOptions,
    context: TestContext
  ): string {
    let setupCode = '';
    
    switch (framework) {
      case TestFramework.JEST:
        setupCode = `// Jest test setup
`;
        break;
      case TestFramework.MOCHA:
        setupCode = `// Mocha test setup
const { expect } = require('chai');
`;
        break;
      case TestFramework.TESTING_LIBRARY:
        setupCode = `// React Testing Library setup
import '@testing-library/jest-dom';
`;
        break;
      case TestFramework.ENZYME:
        setupCode = `// Enzyme setup
import Enzyme, { shallow, mount, render } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new Adapter() });
`;
        break;
    }
    
    return setupCode;
  }
  
  /**
   * Generate imports for tests
   */
  protected generateImports(
    targetName: string, 
    targetPath: string, 
    dependencies: string[],
    framework: TestFramework,
    options: TestGenerationOptions
  ): string {
    let imports = '';
    
    // Import the target
    if (targetPath.startsWith('.')) {
      imports += `import ${targetName} from '${targetPath}';\n`;
    } else {
      // Assume relative path for component under test if path doesn't start with dot
      // This is a common convention for tests importing the component they're testing
      imports += `import ${targetName} from '../${targetPath}';\n`;
    }
    
    // Add framework-specific imports
    switch (framework) {
      case TestFramework.JEST:
        // Jest doesn't require additional imports for basic functionality
        break;
      case TestFramework.MOCHA:
        imports += `import { expect } from 'chai';\n`;
        break;
      case TestFramework.TESTING_LIBRARY:
        imports += `import { render, screen, fireEvent } from '@testing-library/react';\n`;
        imports += `import '@testing-library/jest-dom';\n`;
        break;
      case TestFramework.ENZYME:
        imports += `import Enzyme, { shallow, mount } from 'enzyme';\n`;
        imports += `import Adapter from 'enzyme-adapter-react-16';\n\n`;
        imports += `Enzyme.configure({ adapter: new Adapter() });\n`;
        break;
      case TestFramework.CYPRESS:
        // Cypress has global access to cy, no imports needed
        break;
      case TestFramework.VITEST:
        imports += `import { describe, it, expect } from 'vitest';\n`;
        break;
    }
    
    // Import React for component tests
    if (options.testType === TestType.UNIT && dependencies.includes('react')) {
      imports += `import React from 'react';\n`;
    }
    
    return imports;
  }
  
  /**
   * Generate describe block
   */
  protected generateDescribeBlock(
    targetName: string,
    testCases: string[],
    options: TestGenerationOptions
  ): string {
    const indentation = '  ';
    let describeBlock = `describe('${targetName}', () => {\n`;
    
    // Add setup and teardown if requested
    if (options.includeSetupAndTeardown) {
      describeBlock += `${indentation}beforeEach(() => {\n`;
      describeBlock += `${indentation}  // Setup code\n`;
      describeBlock += `${indentation}});\n\n`;
      
      describeBlock += `${indentation}afterEach(() => {\n`;
      describeBlock += `${indentation}  // Teardown code\n`;
      describeBlock += `${indentation}});\n\n`;
    }
    
    // Add test cases
    testCases.forEach(testCase => {
      describeBlock += `${indentation}${testCase}\n\n`;
    });
    
    describeBlock += '});\n';
    
    return describeBlock;
  }
}
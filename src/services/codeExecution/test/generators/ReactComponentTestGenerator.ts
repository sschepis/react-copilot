import * as ts from 'typescript';
import {
  CodeToTest,
  TestGenerationOptions,
  TestContext,
  TestFramework,
  TestType,
  AssertionStyle,
  CoverageLevel
} from '../types';
import { TestGeneratorBase } from '../TestGeneratorBase';

/**
 * Generator for React component tests
 * Specializes in creating tests for React functional and class components
 */
export class ReactComponentTestGenerator extends TestGeneratorBase {
  constructor() {
    super(
      'ReactComponentTestGenerator', 
      [
        TestFramework.JEST, 
        TestFramework.TESTING_LIBRARY, 
        TestFramework.ENZYME,
        TestFramework.VITEST
      ], 
      [
        TestType.UNIT, 
        TestType.SNAPSHOT, 
        TestType.INTEGRATION
      ]
    );
  }
  
  /**
   * Generate test code for a React component
   */
  protected generateTestCode(
    code: CodeToTest,
    options: TestGenerationOptions,
    context: TestContext
  ): string {
    // Extract component name from context or try to infer it
    const componentName = context.targetInfo?.name || this.detectTargetName(code);
    
    // Generate test code based on framework
    switch (options.framework) {
      case TestFramework.TESTING_LIBRARY:
        return this.generateTestingLibraryTests(code, componentName, options, context);
      case TestFramework.ENZYME:
        return this.generateEnzymeTests(code, componentName, options, context);
      case TestFramework.VITEST:
        return this.generateVitestTests(code, componentName, options, context);
      case TestFramework.JEST:
      default:
        return this.generateJestTests(code, componentName, options, context);
    }
  }
  
  /**
   * Generate tests using React Testing Library
   */
  private generateTestingLibraryTests(
    code: CodeToTest,
    componentName: string,
    options: TestGenerationOptions,
    context: TestContext
  ): string {
    // Extract props from the component
    const props = this.extractComponentProps(code);
    
    // Generate imports
    let testCode = `import React from 'react';\n`;
    testCode += `import { render, screen, fireEvent } from '@testing-library/react';\n`;
    testCode += `import '@testing-library/jest-dom';\n`;
    testCode += `import ${componentName} from '${this.determineImportPath(code.filePath, context)}';\n\n`;
    
    // Generate mocks if needed
    if (options.generateMocks) {
      const mocks = this.generateComponentMocks(code);
      if (mocks) {
        testCode += mocks + '\n\n';
      }
    }
    
    // Generate describe block
    testCode += `describe('${componentName}', () => {\n`;
    
    // Add setup and teardown if requested
    if (options.includeSetupAndTeardown) {
      testCode += `  beforeEach(() => {\n`;
      testCode += `    // Setup code\n`;
      testCode += `  });\n\n`;
      
      testCode += `  afterEach(() => {\n`;
      testCode += `    // Cleanup\n`;
      testCode += `  });\n\n`;
    }
    
    // Add render test
    testCode += `  test('renders without crashing', () => {\n`;
    testCode += `    render(<${componentName} ${this.generatePropAssignments(props)} />);\n`;
    testCode += `  });\n\n`;
    
    // Add content test
    testCode += `  test('renders correct content', () => {\n`;
    testCode += `    render(<${componentName} ${this.generatePropAssignments(props)} />);\n`;
    
    if (code.sourceCode.includes('data-testid=')) {
      // If the component uses data-testid, use that for assertions
      const testIdMatch = code.sourceCode.match(/data-testid=["']([^"']+)["']/);
      if (testIdMatch) {
        const testId = testIdMatch[1];
        testCode += `    const element = screen.getByTestId('${testId}');\n`;
        testCode += `    expect(element).toBeInTheDocument();\n`;
      } else {
        testCode += `    // Use getByTestId for elements with data-testid attributes\n`;
        testCode += `    // const element = screen.getByTestId('your-test-id');\n`;
        testCode += `    // expect(element).toBeInTheDocument();\n`;
      }
    } else {
      // Otherwise use reasonable assumptions based on component name
      testCode += `    // Look for text or elements related to the component\n`;
      testCode += `    // For example, checking for the component name in the rendered output\n`;
      testCode += `    const element = screen.getByText(/${componentName}/i);\n`;
      testCode += `    expect(element).toBeInTheDocument();\n`;
    }
    
    testCode += `  });\n\n`;
    
    // Add interaction tests
    const interactionTests = this.generateInteractionTests(code, componentName, props, 'testing-library');
    if (interactionTests) {
      testCode += interactionTests;
    }
    
    // Add accessibility tests if requested
    if (options.includeAccessibilityTests) {
      testCode += `  test('meets accessibility standards', async () => {\n`;
      testCode += `    // Note: This requires jest-axe to be installed\n`;
      testCode += `    // import { axe, toHaveNoViolations } from 'jest-axe';\n`;
      testCode += `    // expect.extend(toHaveNoViolations);\n`;
      testCode += `    // const { container } = render(<${componentName} ${this.generatePropAssignments(props)} />);\n`;
      testCode += `    // const results = await axe(container);\n`;
      testCode += `    // expect(results).toHaveNoViolations();\n`;
      testCode += `  });\n\n`;
    }
    
    // Add property variation tests if we have props and this is detailed coverage
    if (props.length > 0 && options.coverageLevel && 
        [CoverageLevel.COMPREHENSIVE, CoverageLevel.COMPLETE].includes(options.coverageLevel)) {
      testCode += this.generatePropVariationTests(componentName, props, 'testing-library');
    }
    
    // Close describe block
    testCode += `});\n`;
    
    return testCode;
  }
  
  /**
   * Generate tests using Enzyme
   */
  private generateEnzymeTests(
    code: CodeToTest,
    componentName: string,
    options: TestGenerationOptions,
    context: TestContext
  ): string {
    // Extract props from the component
    const props = this.extractComponentProps(code);
    
    // Generate imports
    let testCode = `import React from 'react';\n`;
    testCode += `import Enzyme, { shallow, mount } from 'enzyme';\n`;
    testCode += `import Adapter from 'enzyme-adapter-react-16';\n`;
    testCode += `import ${componentName} from '${this.determineImportPath(code.filePath, context)}';\n\n`;
    
    // Add Enzyme configuration
    testCode += `Enzyme.configure({ adapter: new Adapter() });\n\n`;
    
    // Generate mocks if needed
    if (options.generateMocks) {
      const mocks = this.generateComponentMocks(code);
      if (mocks) {
        testCode += mocks + '\n\n';
      }
    }
    
    // Generate describe block
    testCode += `describe('${componentName}', () => {\n`;
    
    // Add setup and teardown if requested
    if (options.includeSetupAndTeardown) {
      testCode += `  let wrapper;\n\n`;
      
      testCode += `  beforeEach(() => {\n`;
      testCode += `    wrapper = shallow(<${componentName} ${this.generatePropAssignments(props)} />);\n`;
      testCode += `  });\n\n`;
      
      testCode += `  afterEach(() => {\n`;
      testCode += `    // Cleanup\n`;
      testCode += `  });\n\n`;
    }
    
    // Add render test
    testCode += `  it('renders without crashing', () => {\n`;
    if (options.includeSetupAndTeardown) {
      testCode += `    expect(wrapper.exists()).toBe(true);\n`;
    } else {
      testCode += `    const wrapper = shallow(<${componentName} ${this.generatePropAssignments(props)} />);\n`;
      testCode += `    expect(wrapper.exists()).toBe(true);\n`;
    }
    testCode += `  });\n\n`;
    
    // Add structure test
    testCode += `  it('has the correct structure', () => {\n`;
    if (!options.includeSetupAndTeardown) {
      testCode += `    const wrapper = shallow(<${componentName} ${this.generatePropAssignments(props)} />);\n`;
    }
    testCode += `    // Check for specific elements or components\n`;
    testCode += `    // Example: expect(wrapper.find('div')).toHaveLength(1);\n`;
    testCode += `  });\n\n`;
    
    // Add property tests for each prop
    if (props.length > 0) {
      testCode += `  it('handles props correctly', () => {\n`;
      if (!options.includeSetupAndTeardown) {
        testCode += `    const wrapper = shallow(<${componentName} ${this.generatePropAssignments(props)} />);\n`;
      }
      testCode += `    // Verify props\n`;
      props.forEach(prop => {
        if (!prop.optional) {
          testCode += `    // Check that ${prop.name} prop is used correctly\n`;
        }
      });
      testCode += `  });\n\n`;
    }
    
    // Add interaction tests
    const interactionTests = this.generateInteractionTests(code, componentName, props, 'enzyme');
    if (interactionTests) {
      testCode += interactionTests;
    }
    
    // Add snapshot test if this is a snapshot test type
    if (options.testType === TestType.SNAPSHOT) {
      testCode += `  it('matches snapshot', () => {\n`;
      testCode += `    const wrapper = shallow(<${componentName} ${this.generatePropAssignments(props)} />);\n`;
      testCode += `    expect(wrapper).toMatchSnapshot();\n`;
      testCode += `  });\n\n`;
    }
    
    // Close describe block
    testCode += `});\n`;
    
    return testCode;
  }
  
  /**
   * Generate tests using Jest
   */
  private generateJestTests(
    code: CodeToTest,
    componentName: string,
    options: TestGenerationOptions,
    context: TestContext
  ): string {
    // Extract props from the component
    const props = this.extractComponentProps(code);
    
    // Generate imports
    let testCode = `import React from 'react';\n`;
    testCode += `import { render } from '@testing-library/react';\n`;
    testCode += `import ${componentName} from '${this.determineImportPath(code.filePath, context)}';\n\n`;
    
    // Generate mocks if needed
    if (options.generateMocks) {
      const mocks = this.generateComponentMocks(code);
      if (mocks) {
        testCode += mocks + '\n\n';
      }
    }
    
    // Generate describe block
    testCode += `describe('${componentName}', () => {\n`;
    
    // Add setup and teardown if requested
    if (options.includeSetupAndTeardown) {
      testCode += `  beforeEach(() => {\n`;
      testCode += `    // Setup code\n`;
      testCode += `  });\n\n`;
      
      testCode += `  afterEach(() => {\n`;
      testCode += `    // Cleanup\n`;
      testCode += `  });\n\n`;
    }
    
    // Add render test
    testCode += `  test('renders without crashing', () => {\n`;
    testCode += `    render(<${componentName} ${this.generatePropAssignments(props)} />);\n`;
    testCode += `  });\n\n`;
    
    // Add snapshot test if this is a snapshot test type
    if (options.testType === TestType.SNAPSHOT) {
      testCode += `  test('matches snapshot', () => {\n`;
      testCode += `    const { asFragment } = render(<${componentName} ${this.generatePropAssignments(props)} />);\n`;
      testCode += `    expect(asFragment()).toMatchSnapshot();\n`;
      testCode += `  });\n\n`;
    }
    
    // Add prop tests if we have props
    if (props.length > 0) {
      testCode += `  test('accepts and uses props', () => {\n`;
      testCode += `    const { container } = render(<${componentName} ${this.generatePropAssignments(props)} />);\n`;
      testCode += `    // Add assertions to verify props are used correctly\n`;
      testCode += `  });\n\n`;
    }
    
    // Add interaction tests
    const interactionTests = this.generateInteractionTests(code, componentName, props, 'jest');
    if (interactionTests) {
      testCode += interactionTests;
    }
    
    // Close describe block
    testCode += `});\n`;
    
    return testCode;
  }
  
  /**
   * Generate tests using Vitest
   */
  private generateVitestTests(
    code: CodeToTest,
    componentName: string,
    options: TestGenerationOptions,
    context: TestContext
  ): string {
    // Extract props from the component
    const props = this.extractComponentProps(code);
    
    // Generate imports
    let testCode = `import { describe, it, expect } from 'vitest';\n`;
    testCode += `import React from 'react';\n`;
    testCode += `import { render, screen } from '@testing-library/react';\n`;
    testCode += `import ${componentName} from '${this.determineImportPath(code.filePath, context)}';\n\n`;
    
    // Generate mocks if needed
    if (options.generateMocks) {
      const mocks = this.generateComponentMocks(code);
      if (mocks) {
        testCode += mocks.replace(/jest\./g, 'vi.') + '\n\n';
      }
    }
    
    // Generate describe block
    testCode += `describe('${componentName}', () => {\n`;
    
    // Add render test
    testCode += `  it('renders without crashing', () => {\n`;
    testCode += `    render(<${componentName} ${this.generatePropAssignments(props)} />);\n`;
    testCode += `  });\n\n`;
    
    // Add content test
    testCode += `  it('renders correct content', () => {\n`;
    testCode += `    render(<${componentName} ${this.generatePropAssignments(props)} />);\n`;
    testCode += `    // Add assertions for content\n`;
    testCode += `  });\n\n`;
    
    // Add snapshot test if this is a snapshot test type
    if (options.testType === TestType.SNAPSHOT) {
      testCode += `  it('matches snapshot', () => {\n`;
      testCode += `    const { asFragment } = render(<${componentName} ${this.generatePropAssignments(props)} />);\n`;
      testCode += `    expect(asFragment()).toMatchSnapshot();\n`;
      testCode += `  });\n\n`;
    }
    
    // Add interaction tests
    const interactionTests = this.generateInteractionTests(code, componentName, props, 'vitest');
    if (interactionTests) {
      testCode += interactionTests;
    }
    
    // Close describe block
    testCode += `});\n`;
    
    return testCode;
  }
  
  /**
   * Extract props from the component
   */
  private extractComponentProps(code: CodeToTest): Array<{name: string, type: string, optional: boolean}> {
    if (!code.ast) {
      return this.extractPropsFromString(code.sourceCode);
    }
    
    const props: Array<{name: string, type: string, optional: boolean}> = [];
    
    // Visit AST to find props interface/type
    const visit = (node: ts.Node) => {
      // Look for interfaces that end with Props
      if (ts.isInterfaceDeclaration(node) && 
          node.name.text.endsWith('Props')) {
        node.members.forEach(member => {
          if (ts.isPropertySignature(member) && member.name) {
            const name = member.name.getText();
            const type = member.type ? member.type.getText() : 'any';
            const optional = member.questionToken !== undefined;
            
            props.push({ name, type, optional });
          }
        });
        return;
      }
      
      // Look for type aliases that end with Props
      if (ts.isTypeAliasDeclaration(node) && 
          node.name.text.endsWith('Props') && 
          ts.isTypeLiteralNode(node.type)) {
        node.type.members.forEach(member => {
          if (ts.isPropertySignature(member) && member.name) {
            const name = member.name.getText();
            const type = member.type ? member.type.getText() : 'any';
            const optional = member.questionToken !== undefined;
            
            props.push({ name, type, optional });
          }
        });
        return;
      }
      
      // Visit children
      ts.forEachChild(node, visit);
    };
    
    visit(code.ast);
    
    return props;
  }
  
  /**
   * Extract props from code string (fallback when AST is not available)
   */
  private extractPropsFromString(code: string): Array<{name: string, type: string, optional: boolean}> {
    const props: Array<{name: string, type: string, optional: boolean}> = [];
    
    // Look for prop types
    const propTypesRegex = /\.propTypes\s*=\s*{([^}]+)}/;
    const propTypesMatch = code.match(propTypesRegex);
    
    if (propTypesMatch) {
      const propTypesDef = propTypesMatch[1];
      const propEntries = propTypesDef.split(',');
      
      propEntries.forEach(entry => {
        const entryMatch = entry.trim().match(/(\w+)\s*:\s*PropTypes\.(\w+)(?:\.isRequired)?/);
        if (entryMatch) {
          const name = entryMatch[1];
          const type = this.mapPropTypeToTypescript(entryMatch[2]);
          const optional = !entry.includes('isRequired');
          
          props.push({ name, type, optional });
        }
      });
      
      return props;
    }
    
    // Look for function parameters
    const functionPropsRegex = /function\s+\w+\s*\(\s*(?:{([^}]+)}|\w+)\s*\)/;
    const arrowFunctionPropsRegex = /const\s+\w+\s*=\s*\(\s*(?:{([^}]+)}|\w+)\s*\)\s*=>/;
    
    const functionMatch = code.match(functionPropsRegex) || code.match(arrowFunctionPropsRegex);
    
    if (functionMatch && functionMatch[1]) {
      const propsList = functionMatch[1];
      const propEntries = propsList.split(',');
      
      propEntries.forEach(entry => {
        const entryMatch = entry.trim().match(/(\w+)(?::\s*([^=]+))?(?:\s*=\s*([^,]+))?/);
        if (entryMatch) {
          const name = entryMatch[1];
          const type = entryMatch[2] ? entryMatch[2].trim() : 'any';
          const optional = !!entryMatch[3] || !type.includes('|') || type.includes('undefined');
          
          props.push({ name, type, optional });
        }
      });
    }
    
    return props;
  }
  
  /**
   * Map PropTypes to TypeScript types
   */
  private mapPropTypeToTypescript(propType: string): string {
    switch (propType.toLowerCase()) {
      case 'string': return 'string';
      case 'number': return 'number';
      case 'bool': return 'boolean';
      case 'func': return '() => void';
      case 'array': return 'any[]';
      case 'object': return 'object';
      case 'symbol': return 'symbol';
      case 'node': return 'React.ReactNode';
      case 'element': return 'React.ReactElement';
      case 'instanceof': return 'any';
      case 'oneoftype': return 'any';
      case 'arrayof': return 'any[]';
      case 'objectof': return 'Record<string, any>';
      case 'shape': return 'object';
      case 'exact': return 'object';
      default: return 'any';
    }
  }
  
  /**
   * Generate test values for props based on their types
   */
  private generateTestValueForProp(name: string, type: string): string {
    if (type.includes('string')) {
      return `'test-${name}'`;
    }
    if (type.includes('number')) {
      return '42';
    }
    if (type.includes('boolean') || type === 'bool') {
      return 'true';
    }
    if (type.includes('[]') || type.includes('Array')) {
      return '[]';
    }
    if (type.includes('()') || type === 'func' || type.includes('Function')) {
      return 'jest.fn()';
    }
    if (type.includes('ReactNode') || type.includes('ReactElement')) {
      return '<div>Test</div>';
    }
    if (type.includes('object') || type.includes('Object')) {
      return '{}';
    }
    return `/* TODO: add test value for ${type} */`;
  }
  
  /**
   * Generate prop assignments for component instantiation
   */
  private generatePropAssignments(props: Array<{name: string, type: string, optional: boolean}>): string {
    if (props.length === 0) {
      return '';
    }
    
    return props
      .filter(prop => !prop.optional)
      .map(prop => `${prop.name}={${this.generateTestValueForProp(prop.name, prop.type)}}`)
      .join(' ');
  }
  
  /**
   * Generate mock setup for component dependencies
   */
  private generateComponentMocks(code: CodeToTest): string | null {
    if (!code.dependencies || code.dependencies.length === 0) {
      return null;
    }
    
    // Find external dependencies (not local imports)
    const externalDeps = code.dependencies.filter(dep => !dep.startsWith('.'));
    
    if (externalDeps.length === 0) {
      return null;
    }
    
    let mocks = '// Mocks\n';
    
    // Create mocks for common dependencies
    externalDeps.forEach(dep => {
      if (dep === 'react' || dep === 'react-dom') {
        return; // Skip React itself
      }
      
      if (dep.includes('redux') || dep.includes('store')) {
        mocks += `jest.mock('${dep}', () => ({\n`;
        mocks += `  useSelector: jest.fn(),\n`;
        mocks += `  useDispatch: () => jest.fn(),\n`;
        mocks += `}));\n`;
      } else if (dep.includes('router')) {
        mocks += `jest.mock('${dep}', () => ({\n`;
        mocks += `  useNavigate: () => jest.fn(),\n`;
        mocks += `  useParams: jest.fn(() => ({})),\n`;
        mocks += `  useLocation: jest.fn(() => ({ pathname: '/' })),\n`;
        mocks += `}));\n`;
      } else if (dep.includes('axios') || dep.includes('fetch') || dep.includes('http')) {
        mocks += `jest.mock('${dep}', () => ({\n`;
        mocks += `  get: jest.fn(() => Promise.resolve({ data: {} })),\n`;
        mocks += `  post: jest.fn(() => Promise.resolve({ data: {} })),\n`;
        mocks += `}));\n`;
      } else {
        mocks += `jest.mock('${dep}');\n`;
      }
    });
    
    return mocks;
  }
  
  /**
   * Determine the import path for the component
   */
  private determineImportPath(filePath: string | undefined, context: TestContext): string {
    if (context.targetInfo?.path) {
      return context.targetInfo.path;
    }
    
    if (!filePath) {
      return '../path/to/component';
    }
    
    // Get filename
    const fileNameMatch = filePath.match(/([^/]+)$/);
    if (!fileNameMatch) {
      return '../path/to/component';
    }
    
    // Remove extension
    const fileName = fileNameMatch[1].replace(/\.[^.]+$/, '');
    
    // Determine relative path
    // This is a simplification - in a real implementation you'd compute this based on
    // the test file location vs. component file location
    return `../${fileName}`;
  }
  
  /**
   * Generate tests for component interactions
   */
  private generateInteractionTests(
    code: CodeToTest,
    componentName: string,
    props: Array<{name: string, type: string, optional: boolean}>,
    framework: string
  ): string | null {
    // Look for event handlers in the code
    const hasClickHandlers = code.sourceCode.includes('onClick') || code.sourceCode.includes('handleClick');
    const hasChangeHandlers = code.sourceCode.includes('onChange') || code.sourceCode.includes('handleChange');
    const hasSubmitHandlers = code.sourceCode.includes('onSubmit') || code.sourceCode.includes('handleSubmit');
    
    if (!hasClickHandlers && !hasChangeHandlers && !hasSubmitHandlers) {
      return null;
    }
    
    let interactionTests = '';
    
    // Generate click test
    if (hasClickHandlers) {
      switch (framework) {
        case 'testing-library':
          interactionTests += `  test('handles click events', () => {\n`;
          interactionTests += `    render(<${componentName} ${this.generatePropAssignments(props)} />);\n`;
          interactionTests += `    // Find a clickable element\n`;
          interactionTests += `    const clickableElement = screen.getByRole('button', { name: /click me/i });\n`;
          interactionTests += `    // Simulate a click\n`;
          interactionTests += `    fireEvent.click(clickableElement);\n`;
          interactionTests += `    // Add assertions for the expected outcome\n`;
          interactionTests += `  });\n\n`;
          break;
        case 'enzyme':
          interactionTests += `  it('handles click events', () => {\n`;
          interactionTests += `    const wrapper = shallow(<${componentName} ${this.generatePropAssignments(props)} />);\n`;
          interactionTests += `    // Find a clickable element\n`;
          interactionTests += `    const clickableElement = wrapper.find('button').first();\n`;
          interactionTests += `    // Simulate a click\n`;
          interactionTests += `    clickableElement.simulate('click');\n`;
          interactionTests += `    // Add assertions for the expected outcome\n`;
          interactionTests += `  });\n\n`;
          break;
        case 'jest':
        case 'vitest':
          interactionTests += `  test('handles click events', () => {\n`;
          interactionTests += `    const { getByRole } = render(<${componentName} ${this.generatePropAssignments(props)} />);\n`;
          interactionTests += `    // Find a clickable element\n`;
          interactionTests += `    const clickableElement = getByRole('button');\n`;
          interactionTests += `    // Simulate a click\n`;
          interactionTests += `    clickableElement.click();\n`;
          interactionTests += `    // Add assertions for the expected outcome\n`;
          interactionTests += `  });\n\n`;
          break;
      }
    }
    
    // Generate change test
    if (hasChangeHandlers) {
      switch (framework) {
        case 'testing-library':
          interactionTests += `  test('handles input changes', () => {\n`;
          interactionTests += `    render(<${componentName} ${this.generatePropAssignments(props)} />);\n`;
          interactionTests += `    // Find an input element\n`;
          interactionTests += `    const inputElement = screen.getByRole('textbox');\n`;
          interactionTests += `    // Simulate a change\n`;
          interactionTests += `    fireEvent.change(inputElement, { target: { value: 'new value' } });\n`;
          interactionTests += `    // Add assertions for the expected outcome\n`;
          interactionTests += `  });\n\n`;
          break;
        case 'enzyme':
          interactionTests += `  it('handles input changes', () => {\n`;
          interactionTests += `    const wrapper = shallow(<${componentName} ${this.generatePropAssignments(props)} />);\n`;
          interactionTests += `    // Find an input element\n`;
          interactionTests += `    const inputElement = wrapper.find('input').first();\n`;
          interactionTests += `    // Simulate a change\n`;
          interactionTests += `    inputElement.simulate('change', { target: { value: 'new value' } });\n`;
          interactionTests += `    // Add assertions for the expected outcome\n`;
          interactionTests += `  });\n\n`;
          break;
        case 'jest':
        case 'vitest':
          interactionTests += `  test('handles input changes', () => {\n`;
          interactionTests += `    const { getByRole } = render(<${componentName} ${this.generatePropAssignments(props)} />);\n`;
          interactionTests += `    // Find an input element\n`;
          interactionTests += `    const inputElement = getByRole('textbox');\n`;
          interactionTests += `    // Simulate a change\n`;
          interactionTests += `    fireEvent.change(inputElement, { target: { value: 'new value' } });\n`;
          interactionTests += `    // Add assertions for the expected outcome\n`;
          interactionTests += `  });\n\n`;
          break;
      }
    }
    
    // Generate form submission test
    if (hasSubmitHandlers) {
      switch (framework) {
        case 'testing-library':
          interactionTests += `  test('handles form submission', () => {\n`;
          interactionTests += `    render(<${componentName} ${this.generatePropAssignments(props)} />);\n`;
          interactionTests += `    // Find a form element\n`;
          interactionTests += `    const formElement = screen.getByRole('form');\n`;
          interactionTests += `    // Simulate a submit\n`;
          interactionTests += `    fireEvent.submit(formElement);\n`;
          interactionTests += `    // Add assertions for the expected outcome\n`;
          interactionTests += `  });\n\n`;
          break;
        case 'enzyme':
          interactionTests += `  it('handles form submission', () => {\n`;
          interactionTests += `    const wrapper = shallow(<${componentName} ${this.generatePropAssignments(props)} />);\n`;
          interactionTests += `    // Find a form element\n`;
          interactionTests += `    const formElement = wrapper.find('form');\n`;
          interactionTests += `    // Simulate a submit\n`;
          interactionTests += `    formElement.simulate('submit', { preventDefault: jest.fn() });\n`;
          interactionTests += `    // Add assertions for the expected outcome\n`;
          interactionTests += `  });\n\n`;
          break;
        case 'jest':
        case 'vitest':
          interactionTests += `  test('handles form submission', () => {\n`;
          interactionTests += `    const { getByRole } = render(<${componentName} ${this.generatePropAssignments(props)} />);\n`;
          interactionTests += `    // Find a form element - note: forms need a proper aria-label or role to be found by role\n`;
          interactionTests += `    const formElement = document.querySelector('form');\n`;
          interactionTests += `    // Simulate a submit\n`;
          interactionTests += `    fireEvent.submit(formElement);\n`;
          interactionTests += `    // Add assertions for the expected outcome\n`;
          interactionTests += `  });\n\n`;
          break;
      }
    }
    
    return interactionTests;
  }
  
  /**
   * Generate tests for prop variations
   */
  private generatePropVariationTests(
    componentName: string,
    props: Array<{name: string, type: string, optional: boolean}>,
    framework: string
  ): string {
    let tests = '';
    
    // Generate tests for required props
    props.filter(prop => !prop.optional).forEach(prop => {
      tests += `  test('requires ${prop.name} prop', () => {\n`;
      tests += `    // Testing required prop ${prop.name} of type ${prop.type}\n`;
      tests += `    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});\n`;
      
      const allPropsExcept = props
        .filter(p => !p.optional && p.name !== prop.name)
        .map(p => `${p.name}={${this.generateTestValueForProp(p.name, p.type)}}`)
        .join(' ');
      
      tests += `    expect(() => {\n`;
      tests += `      render(<${componentName} ${allPropsExcept} />);\n`;
      tests += `    }).toThrow();\n`;
      tests += `    consoleSpy.mockRestore();\n`;
      tests += `  });\n\n`;
    });
    
    // Generate tests for boolean props
    props.filter(prop => prop.type.includes('boolean') || prop.type === 'bool').forEach(prop => {
      tests += `  test('handles ${prop.name} prop correctly', () => {\n`;
      
      const otherProps = props
        .filter(p => !p.optional && p.name !== prop.name)
        .map(p => `${p.name}={${this.generateTestValueForProp(p.name, p.type)}}`)
        .join(' ');
      
      tests += `    // Render with ${prop.name}={true}\n`;
      tests += `    const { rerender } = render(<${componentName} ${otherProps} ${prop.name}={true} />);\n`;
      tests += `    // Add assertions for when ${prop.name} is true\n\n`;
      
      tests += `    // Re-render with ${prop.name}={false}\n`;
      tests += `    rerender(<${componentName} ${otherProps} ${prop.name}={false} />);\n`;
      tests += `    // Add assertions for when ${prop.name} is false\n`;
      tests += `  });\n\n`;
    });
    
    return tests;
  }
}
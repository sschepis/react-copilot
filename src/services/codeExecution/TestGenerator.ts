import * as ts from 'typescript';
import { InferredProp } from './PropTypeInference';

/**
 * Test configuration options
 */
export interface TestGeneratorOptions {
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
  customTestCases?: TestCase[];
}

/**
 * Custom test case definition
 */
export interface TestCase {
  description: string;
  props: Record<string, any>;
  assertions: string[];
  setup?: string;
  teardown?: string;
}

/**
 * Test generation result
 */
export interface TestGenerationResult {
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
 * Component analysis result
 */
interface ComponentAnalysis {
  name: string;
  props: InferredProp[];
  events: string[];
  stateVars: string[];
  renderBranches: number;
  imports: string[];
  hooks: string[];
}

/**
 * Generates automated tests for React components
 */
export class TestGenerator {
  private options: Required<TestGeneratorOptions>;
  
  constructor(options: TestGeneratorOptions) {
    // Set default options
    this.options = {
      framework: options.framework,
      includeSnapshots: options.includeSnapshots ?? true,
      includePropValidation: options.includePropValidation ?? true,
      includeEvents: options.includeEvents ?? true,
      includeAccessibility: options.includeAccessibility ?? false,
      testFilePattern: options.testFilePattern ?? '[name].test.tsx',
      customTestCases: options.customTestCases ?? []
    };
  }
  
  /**
   * Generate tests for a component
   * 
   * @param componentPath Path to the component file
   * @param componentCode Component source code
   * @param inferredProps Optional pre-analyzed props
   * @returns Test generation result
   */
  generateTests(
    componentPath: string,
    componentCode: string,
    inferredProps?: InferredProp[]
  ): TestGenerationResult {
    // Analyze the component to extract test-relevant information
    const analysis = this.analyzeComponent(componentCode, inferredProps);
    
    // Generate the test file path
    const testFilePath = this.generateTestFilePath(componentPath);
    
    // Generate imports
    const imports = this.generateImports(analysis);
    
    // Generate test suite
    const testSuite = this.generateTestSuite(analysis);
    
    // Calculate test coverage metrics
    const coverage = this.calculateCoverage(analysis, testSuite);
    
    // Determine suggested mocks based on analysis
    const suggestedMocks = this.suggestMocks(analysis);
    
    // Combine all test code sections
    const testCode = [
      imports,
      '',
      testSuite
    ].join('\n');
    
    return {
      testCode,
      testFilePath,
      coverage,
      suggestedMocks
    };
  }
  
  /**
   * Analyze component to extract testing-relevant information
   * 
   * @param componentCode Component source code
   * @param inferredProps Optional pre-analyzed props
   * @returns Component analysis
   */
  private analyzeComponent(
    componentCode: string,
    inferredProps?: InferredProp[]
  ): ComponentAnalysis {
    let componentName = '';
    const events: string[] = [];
    const stateVars: string[] = [];
    const imports: string[] = [];
    const hooks: string[] = [];
    let renderBranches = 0;
    
    try {
      // Create a source file from the component code
      const sourceFile = ts.createSourceFile(
        'component.tsx',
        componentCode,
        ts.ScriptTarget.Latest,
        true
      );
      
      // Extract component name
      componentName = this.extractComponentName(sourceFile, componentCode);
      
      // Visitor function to analyze component
      const visit = (node: ts.Node) => {
        // Extract imports
        if (ts.isImportDeclaration(node)) {
          imports.push(node.getText(sourceFile));
        }
        
        // Extract event handlers
        if (ts.isMethodDeclaration(node) || ts.isFunctionDeclaration(node)) {
          const name = node.name?.getText(sourceFile) || '';
          if (name.startsWith('handle') || name.includes('Handler') || name.startsWith('on')) {
            events.push(name);
          }
        }
        
        // Extract useState hooks for state variables
        if (ts.isCallExpression(node) && 
            node.expression.getText(sourceFile) === 'useState') {
          const parent = node.parent;
          if (ts.isVariableDeclaration(parent) && 
              ts.isArrayBindingPattern(parent.name)) {
            const stateVar = parent.name.elements[0].getText(sourceFile);
            stateVars.push(stateVar);
          }
        }
        
        // Extract React hooks
        if (ts.isCallExpression(node)) {
          const callName = node.expression.getText(sourceFile);
          if (callName.startsWith('use') && callName !== 'useRef') {
            hooks.push(callName);
          }
        }
        
        // Count render branches (if/conditional rendering)
        if (ts.isIfStatement(node) || ts.isConditionalExpression(node)) {
          renderBranches++;
        }
        
        // Check for logical expressions (&&, ||) which are used for conditional rendering
        if (ts.isBinaryExpression(node)) {
          if (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
              node.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
            renderBranches++;
          }
        }
        
        // Continue traversal
        ts.forEachChild(node, visit);
      };
      
      // Start traversal
      ts.forEachChild(sourceFile, visit);
      
    } catch (error) {
      console.error('Error analyzing component:', error);
    }
    
    // If props weren't provided, extract them from component signature
    const props = inferredProps || this.extractPropsFromCode(componentCode);
    
    return {
      name: componentName,
      props,
      events,
      stateVars,
      renderBranches,
      imports,
      hooks
    };
  }
  
  /**
   * Extract component name from source code
   * 
   * @param sourceFile TypeScript source file
   * @param componentCode Original component code
   * @returns Component name
   */
  private extractComponentName(sourceFile: ts.SourceFile, componentCode: string): string {
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
   * Extract props from component code
   * 
   * @param componentCode Component source code
   * @returns Array of inferred props
   */
  private extractPropsFromCode(componentCode: string): InferredProp[] {
    const props: InferredProp[] = [];
    
    // Look for props destructuring patterns
    const destructuringMatch = /{\s*((\w+)(,\s*\w+)*)\s*}\s*=\s*props/.exec(componentCode);
    if (destructuringMatch) {
      const propNames = destructuringMatch[1].split(',').map(p => p.trim());
      
      propNames.forEach(name => {
        if (name) {
          props.push({
            name,
            type: 'any',
            required: true,
            usage: 1,
            inference: 'probable'
          });
        }
      });
    }
    
    // Look for props parameter types
    const propsTypeMatch = /\(\s*props\s*:\s*(\w+Props)\s*\)/.exec(componentCode);
    if (propsTypeMatch) {
      // Find the interface/type definition
      const interfaceMatch = new RegExp(`interface\\s+${propsTypeMatch[1]}\\s*{([^}]+)}`).exec(componentCode);
      if (interfaceMatch) {
        const interfaceBody = interfaceMatch[1];
        const propRegex = /(\w+)(\?)?:\s*([^;]+);/g;
        let propMatch;
        
        while ((propMatch = propRegex.exec(interfaceBody)) !== null) {
          const name = propMatch[1];
          const optional = propMatch[2] === '?';
          const type = propMatch[3].trim();
          
          props.push({
            name,
            type,
            required: !optional,
            usage: 1,
            inference: 'definite'
          });
        }
      }
    }
    
    return props;
  }
  
  /**
   * Generate the test file path from the component path
   * 
   * @param componentPath Path to the component file
   * @returns Test file path
   */
  private generateTestFilePath(componentPath: string): string {
    const lastSlashIndex = componentPath.lastIndexOf('/');
    const directory = componentPath.substring(0, lastSlashIndex + 1);
    const filename = componentPath.substring(lastSlashIndex + 1);
    
    // Remove extension from filename
    const dotIndex = filename.lastIndexOf('.');
    const nameWithoutExt = dotIndex !== -1 ? filename.substring(0, dotIndex) : filename;
    
    // Replace [name] placeholder with component name
    const testFilename = this.options.testFilePattern.replace('[name]', nameWithoutExt);
    
    return directory + testFilename;
  }
  
  /**
   * Generate test imports based on component analysis and test framework
   * 
   * @param analysis Component analysis
   * @returns Import statements as string
   */
  private generateImports(analysis: ComponentAnalysis): string {
    const imports: string[] = [];
    
    // Basic imports based on framework
    switch (this.options.framework) {
      case 'jest':
        imports.push("import React from 'react';");
        imports.push("import { render, screen, fireEvent } from '@testing-library/react';");
        
        if (this.options.includeSnapshots) {
          imports.push("import renderer from 'react-test-renderer';");
        }
        break;
        
      case 'react-testing-library':
        imports.push("import React from 'react';");
        imports.push("import { render, screen, fireEvent } from '@testing-library/react';");
        
        if (this.options.includeAccessibility) {
          imports.push("import { axe, toHaveNoViolations } from 'jest-axe';");
          imports.push("expect.extend(toHaveNoViolations);");
        }
        break;
        
      case 'enzyme':
        imports.push("import React from 'react';");
        imports.push("import { shallow, mount } from 'enzyme';");
        break;
    }
    
    // Component import (assuming it's imported from the target file)
    const componentPathParts = analysis.name.split('/');
    const componentName = componentPathParts[componentPathParts.length - 1];
    imports.push(`import ${componentName} from './${componentName}';`);
    
    // Add mock imports if needed
    if (analysis.hooks.includes('useContext')) {
      imports.push("import { MockContext } from '../test-utils';");
    }
    
    return imports.join('\n');
  }
  
  /**
   * Generate the complete test suite
   * 
   * @param analysis Component analysis
   * @returns Test suite code
   */
  private generateTestSuite(analysis: ComponentAnalysis): string {
    let testSuite = `describe('${analysis.name} Component', () => {\n`;
    
    // Add setup/teardown if needed
    if (analysis.hooks.length > 0) {
      testSuite += `  // Setup for hooks\n`;
      testSuite += `  beforeEach(() => {\n`;
      testSuite += `    jest.clearAllMocks();\n`;
      
      // Add specific setup for hooks
      if (analysis.hooks.includes('useContext')) {
        testSuite += `    // Mock context values\n`;
      }
      
      testSuite += `  });\n\n`;
    }
    
    // Generate render test
    testSuite += this.generateRenderTest(analysis);
    
    // Generate prop validation tests
    if (this.options.includePropValidation && analysis.props.length > 0) {
      testSuite += this.generatePropTests(analysis);
    }
    
    // Generate event handler tests
    if (this.options.includeEvents && analysis.events.length > 0) {
      testSuite += this.generateEventTests(analysis);
    }
    
    // Generate snapshot test
    if (this.options.includeSnapshots) {
      testSuite += this.generateSnapshotTest(analysis);
    }
    
    // Generate accessibility test
    if (this.options.includeAccessibility) {
      testSuite += this.generateAccessibilityTest(analysis);
    }
    
    // Generate custom test cases
    if (this.options.customTestCases.length > 0) {
      testSuite += this.generateCustomTests(analysis);
    }
    
    testSuite += '});\n';
    return testSuite;
  }
  
  /**
   * Generate basic render test
   * 
   * @param analysis Component analysis
   * @returns Render test code
   */
  private generateRenderTest(analysis: ComponentAnalysis): string {
    let testCode = `  it('renders without crashing', () => {\n`;
    
    // Create props object with test values
    const propsObj = this.generateTestProps(analysis.props);
    const propsStr = Object.keys(propsObj).length > 0 ? 
      JSON.stringify(propsObj, null, 2).replace(/"([^"]+)":/g, '$1:') : '{}';
    
    // Render based on framework
    switch (this.options.framework) {
      case 'jest':
      case 'react-testing-library':
        testCode += `    const props = ${propsStr};\n`;
        testCode += `    render(<${analysis.name} {...props} />);\n`;
        
        // Add basic assertions
        if (analysis.props.some(p => p.name === 'title' || p.name === 'heading')) {
          const titleProp = analysis.props.find(p => p.name === 'title' || p.name === 'heading');
          if (titleProp) {
            testCode += `    expect(screen.getByText('${propsObj[titleProp.name] || 'Test Title'}')).toBeInTheDocument();\n`;
          }
        } else {
          testCode += `    // Verify component renders\n`;
          testCode += `    expect(screen.getByTestId('${analysis.name.toLowerCase()}')).toBeInTheDocument();\n`;
        }
        break;
        
      case 'enzyme':
        testCode += `    const wrapper = shallow(<${analysis.name} ${Object.keys(propsObj).map(k => `${k}={${JSON.stringify(propsObj[k])}}`).join(' ')} />);\n`;
        testCode += `    expect(wrapper.exists()).toBe(true);\n`;
        break;
    }
    
    testCode += `  });\n\n`;
    return testCode;
  }
  
  /**
   * Generate prop validation tests
   * 
   * @param analysis Component analysis
   * @returns Prop tests code
   */
  private generatePropTests(analysis: ComponentAnalysis): string {
    let testCode = `  describe('Props', () => {\n`;
    
    // Test each required prop
    const requiredProps = analysis.props.filter(p => p.required);
    if (requiredProps.length > 0) {
      testCode += `    it('renders with all required props', () => {\n`;
      
      // Create props object with test values for required props
      const propsObj = this.generateTestProps(requiredProps);
      const propsStr = Object.keys(propsObj).length > 0 ? 
        JSON.stringify(propsObj, null, 2).replace(/"([^"]+)":/g, '$1:') : '{}';
      
      // Render with required props
      switch (this.options.framework) {
        case 'jest':
        case 'react-testing-library':
          testCode += `      const props = ${propsStr};\n`;
          testCode += `      render(<${analysis.name} {...props} />);\n`;
          testCode += `      // Verify component rendered correctly with required props\n`;
          testCode += `      expect(document.querySelector('[data-testid="${analysis.name.toLowerCase()}"]')).toBeInTheDocument();\n`;
          break;
          
        case 'enzyme':
          testCode += `      const wrapper = shallow(<${analysis.name} ${Object.keys(propsObj).map(k => `${k}={${JSON.stringify(propsObj[k])}}`).join(' ')} />);\n`;
          testCode += `      expect(wrapper.exists()).toBe(true);\n`;
          break;
      }
      
      testCode += `    });\n\n`;
    }
    
    // Test individual props
    for (const prop of analysis.props) {
      testCode += `    it('${prop.name} prop works correctly', () => {\n`;
      
      // Create props object with only this prop changed
      const allDefaultProps = this.generateTestProps(analysis.props);
      let testValue;
      
      // Generate appropriate test value based on type
      switch (prop.type) {
        case 'string':
          testValue = `'Test ${prop.name}'`;
          break;
        case 'number':
          testValue = '42';
          break;
        case 'boolean':
          testValue = 'true';
          break;
        case 'function':
          testValue = 'jest.fn()';
          break;
        default:
          testValue = prop.defaultValue ? 
            JSON.stringify(prop.defaultValue) : 
            'undefined';
      }
      
      // Render with the test prop
      switch (this.options.framework) {
        case 'jest':
        case 'react-testing-library':
          testCode += `      const props = ${JSON.stringify(allDefaultProps, null, 2).replace(/"([^"]+)":/g, '$1:')};\n`;
          
          // Handle special cases for functions
          if (prop.type === 'function') {
            testCode += `      const mock${prop.name.charAt(0).toUpperCase() + prop.name.slice(1)} = jest.fn();\n`;
            testCode += `      render(<${analysis.name} {...props} ${prop.name}={mock${prop.name.charAt(0).toUpperCase() + prop.name.slice(1)}} />);\n`;
          } else {
            testCode += `      render(<${analysis.name} {...props} ${prop.name}=${testValue} />);\n`;
          }
          
          // Add assertions based on prop type
          if (prop.type === 'string' && (prop.name.includes('title') || prop.name.includes('text'))) {
            testCode += `      expect(screen.getByText(${testValue})).toBeInTheDocument();\n`;
          } else if (prop.type === 'function') {
            testCode += `      // Trigger the function prop\n`;
            testCode += `      // Example: fireEvent.click(screen.getByRole('button'));\n`;
            testCode += `      // expect(mock${prop.name.charAt(0).toUpperCase() + prop.name.slice(1)}).toHaveBeenCalled();\n`;
          }
          break;
          
        case 'enzyme':
          testCode += `      const wrapper = shallow(<${analysis.name} ${Object.keys(allDefaultProps).map(k => `${k}={${JSON.stringify(allDefaultProps[k])}}`).join(' ')} ${prop.name}=${testValue} />);\n`;
          
          if (prop.type === 'string' && (prop.name.includes('title') || prop.name.includes('text'))) {
            testCode += `      expect(wrapper.find('*').text()).toContain(${testValue.replace(/['"]/g, '')});\n`;
          } else if (prop.type === 'function') {
            testCode += `      // Trigger the function prop\n`;
            testCode += `      // Example: wrapper.find('button').simulate('click');\n`;
            testCode += `      // expect(${testValue}).toHaveBeenCalled();\n`;
          }
          break;
      }
      
      testCode += `    });\n\n`;
    }
    
    testCode += `  });\n\n`;
    return testCode;
  }
  
  /**
   * Generate event handler tests
   * 
   * @param analysis Component analysis
   * @returns Event tests code
   */
  private generateEventTests(analysis: ComponentAnalysis): string {
    // Skip if no events
    if (analysis.events.length === 0) {
      return '';
    }
    
    let testCode = `  describe('Event Handling', () => {\n`;
    
    // Create mock props
    const mockProps = this.generateTestProps(analysis.props);
    
    // Create tests for each event handler
    for (const event of analysis.events) {
      // Determine event type from handler name
      let eventType = 'click';
      if (event.toLowerCase().includes('change')) eventType = 'change';
      if (event.toLowerCase().includes('submit')) eventType = 'submit';
      if (event.toLowerCase().includes('hover') || event.toLowerCase().includes('mouse')) eventType = 'mouseOver';
      if (event.toLowerCase().includes('key')) eventType = 'keyDown';
      
      testCode += `    it('${event} works correctly', () => {\n`;
      
      switch (this.options.framework) {
        case 'jest':
        case 'react-testing-library':
          testCode += `      const mock${event} = jest.fn();\n`;
          testCode += `      render(<${analysis.name} {...${JSON.stringify(mockProps, null, 2).replace(/"([^"]+)":/g, '$1:')}} ${event}={mock${event}} />);\n`;
          
          // Add event simulation
          switch (eventType) {
            case 'click':
              testCode += `      // Find the element and click it\n`;
              testCode += `      const element = screen.getByRole('button');\n`;
              testCode += `      fireEvent.click(element);\n`;
              break;
            case 'change':
              testCode += `      // Find the input element and change it\n`;
              testCode += `      const input = screen.getByRole('textbox');\n`;
              testCode += `      fireEvent.change(input, { target: { value: 'new value' } });\n`;
              break;
            case 'submit':
              testCode += `      // Find the form and submit it\n`;
              testCode += `      const form = screen.getByRole('form');\n`;
              testCode += `      fireEvent.submit(form);\n`;
              break;
            default:
              testCode += `      // Find the element and trigger the event\n`;
              testCode += `      const element = screen.getByTestId('${analysis.name.toLowerCase()}');\n`;
              testCode += `      fireEvent.${eventType}(element);\n`;
          }
          
          testCode += `      expect(mock${event}).toHaveBeenCalled();\n`;
          break;
          
        case 'enzyme':
          testCode += `      const mock${event} = jest.fn();\n`;
          testCode += `      const wrapper = mount(<${analysis.name} ${Object.keys(mockProps).map(k => `${k}={${JSON.stringify(mockProps[k])}}`).join(' ')} ${event}={mock${event}} />);\n`;
          
          // Add event simulation
          switch (eventType) {
            case 'click':
              testCode += `      wrapper.find('button').simulate('click');\n`;
              break;
            case 'change':
              testCode += `      wrapper.find('input').simulate('change', { target: { value: 'new value' } });\n`;
              break;
            case 'submit':
              testCode += `      wrapper.find('form').simulate('submit');\n`;
              break;
            default:
              testCode += `      wrapper.find('.element-selector').simulate('${eventType}');\n`;
          }
          
          testCode += `      expect(mock${event}).toHaveBeenCalled();\n`;
          break;
      }
      
      testCode += `    });\n\n`;
    }
    
    testCode += `  });\n\n`;
    return testCode;
  }
  
  /**
   * Generate snapshot test
   * 
   * @param analysis Component analysis
   * @returns Snapshot test code
   */
  private generateSnapshotTest(analysis: ComponentAnalysis): string {
    if (!this.options.includeSnapshots) {
      return '';
    }
    
    let testCode = `  describe('Snapshots', () => {\n`;
    testCode += `    it('matches snapshot', () => {\n`;
    
    // Create props object
    const props = this.generateTestProps(analysis.props);
    
    // Generate snapshot test
    if (this.options.framework === 'enzyme') {
      testCode += `      const wrapper = shallow(<${analysis.name} ${Object.keys(props).map(k => `${k}={${JSON.stringify(props[k])}}`).join(' ')} />);\n`;
      testCode += `      expect(wrapper).toMatchSnapshot();\n`;
    } else {
      testCode += `      const tree = renderer.create(\n`;
      testCode += `        <${analysis.name} ${Object.keys(props).map(k => `${k}={${JSON.stringify(props[k])}}`).join(' ')} />\n`;
      testCode += `      ).toJSON();\n`;
      testCode += `      expect(tree).toMatchSnapshot();\n`;
    }
    
    testCode += `    });\n`;
    
    // Add multiple snapshots if there are conditional rendering branches
    if (analysis.renderBranches > 0) {
      testCode += `\n    it('matches snapshot with different props', () => {\n`;
      
      // Create alternative props for conditional branches
      const altProps = { ...props };
      
      // Toggle boolean props
      for (const prop of analysis.props) {
        if (prop.type === 'boolean' && prop.name in altProps) {
          altProps[prop.name] = !altProps[prop.name];
        }
      }
      
      // Generate snapshot test with alternative props
      if (this.options.framework === 'enzyme') {
        testCode += `      const wrapper = shallow(<${analysis.name} ${Object.keys(altProps).map(k => `${k}={${JSON.stringify(altProps[k])}}`).join(' ')} />);\n`;
        testCode += `      expect(wrapper).toMatchSnapshot();\n`;
      } else {
        testCode += `      const tree = renderer.create(\n`;
        testCode += `        <${analysis.name} ${Object.keys(altProps).map(k => `${k}={${JSON.stringify(altProps[k])}}`).join(' ')} />\n`;
        testCode += `      ).toJSON();\n`;
        testCode += `      expect(tree).toMatchSnapshot();\n`;
      }
      
      testCode += `    });\n`;
    }
    
    testCode += `  });\n\n`;
    return testCode;
  }
  
  /**
   * Generate accessibility test
   * 
   * @param analysis Component analysis
   * @returns Accessibility test code
   */
  private generateAccessibilityTest(analysis: ComponentAnalysis): string {
    if (!this.options.includeAccessibility) {
      return '';
    }
    
    let testCode = `  describe('Accessibility', () => {\n`;
    testCode += `    it('has no accessibility violations', async () => {\n`;
    
    // Create props object
    const props = this.generateTestProps(analysis.props);
    
    // Generate accessibility test using jest-axe
    testCode += `      const { container } = render(<${analysis.name} ${Object.keys(props).map(k => `${k}={${JSON.stringify(props[k])}}`).join(' ')} />);\n`;
    testCode += `      const results = await axe(container);\n`;
    testCode += `      expect(results).toHaveNoViolations();\n`;
    
    testCode += `    });\n`;
    testCode += `  });\n\n`;
    return testCode;
  }
  
  /**
   * Generate custom test cases
   * 
   * @param analysis Component analysis
   * @returns Custom tests code
   */
  private generateCustomTests(analysis: ComponentAnalysis): string {
    if (this.options.customTestCases.length === 0) {
      return '';
    }
    
    let testCode = `  describe('Custom Tests', () => {\n`;
    
    for (const testCase of this.options.customTestCases) {
      testCode += `    it('${testCase.description}', () => {\n`;
      
      // Add setup code if provided
      if (testCase.setup) {
        testCode += `      ${testCase.setup}\n`;
      }
      
      // Create props object combining default and custom props
      const defaultProps = this.generateTestProps(analysis.props);
      const props = { ...defaultProps, ...testCase.props };
      
      // Render component
      switch (this.options.framework) {
        case 'jest':
        case 'react-testing-library':
          testCode += `      render(<${analysis.name} ${Object.keys(props).map(k => `${k}={${JSON.stringify(props[k])}}`).join(' ')} />);\n`;
          break;
          
        case 'enzyme':
          testCode += `      const wrapper = mount(<${analysis.name} ${Object.keys(props).map(k => `${k}={${JSON.stringify(props[k])}}`).join(' ')} />);\n`;
          break;
      }
      
      // Add assertions
      for (const assertion of testCase.assertions) {
        testCode += `      ${assertion}\n`;
      }
      
      // Add teardown code if provided
      if (testCase.teardown) {
        testCode += `      ${testCase.teardown}\n`;
      }
      
      testCode += `    });\n\n`;
    }
    
    testCode += `  });\n\n`;
    return testCode;
  }
  
  /**
   * Generate test props for a component
   * 
   * @param props Array of component props
   * @returns Props object with test values
   */
  private generateTestProps(props: InferredProp[]): Record<string, any> {
    const testProps: Record<string, any> = {};
    
    for (const prop of props) {
      // Generate appropriate test value based on type
      switch (prop.type) {
        case 'string':
          if (prop.name.includes('name')) {
            testProps[prop.name] = 'Test Name';
          } else if (prop.name.includes('title')) {
            testProps[prop.name] = 'Test Title';
          } else if (prop.name.includes('text')) {
            testProps[prop.name] = 'Test Text';
          } else if (prop.name.includes('description')) {
            testProps[prop.name] = 'Test Description';
          } else if (prop.name.includes('url') || prop.name.includes('href')) {
            testProps[prop.name] = 'https://example.com';
          } else {
            testProps[prop.name] = `Test ${prop.name}`;
          }
          break;
          
        case 'number':
          if (prop.name.includes('index')) {
            testProps[prop.name] = 0;
          } else if (prop.name.includes('count')) {
            testProps[prop.name] = 5;
          } else if (prop.name.includes('id')) {
            testProps[prop.name] = 1;
          } else {
            testProps[prop.name] = 42;
          }
          break;
          
        case 'boolean':
          testProps[prop.name] = true;
          break;
          
        case 'array':
          testProps[prop.name] = [];
          break;
          
        case 'object':
          testProps[prop.name] = {};
          break;
          
        case 'function':
          testProps[prop.name] = null; // Will be replaced with jest.fn() in test code
          break;
          
        default:
          if (prop.defaultValue !== undefined) {
            testProps[prop.name] = prop.defaultValue;
          }
      }
    }
    
    return testProps;
  }
  
  /**
   * Calculate test coverage metrics
   * 
   * @param analysis Component analysis
   * @param testSuite Generated test suite
   * @returns Coverage metrics
   */
  private calculateCoverage(analysis: ComponentAnalysis, testSuite: string): { props: number; events: number; branches: number; statements: number } {
    // Props coverage
    const totalProps = analysis.props.length;
    const testedProps = analysis.props.filter(p => 
      testSuite.includes(`${p.name} prop works correctly`)
    ).length;
    const propsCoverage = totalProps > 0 ? (testedProps / totalProps) * 100 : 100;
    
    // Events coverage
    const totalEvents = analysis.events.length;
    const testedEvents = analysis.events.filter(e => 
      testSuite.includes(`${e} works correctly`)
    ).length;
    const eventsCoverage = totalEvents > 0 ? (testedEvents / totalEvents) * 100 : 100;
    
    // Branches coverage - estimate based on conditional rendering
    const branchesCoverage = Math.min(100, analysis.renderBranches > 0 ? 
      this.options.includeSnapshots ? 80 : 50 : 100);
    
    // Statement coverage - rough estimate
    const statementsCoverage = Math.min(100, 
      (propsCoverage + eventsCoverage + branchesCoverage) / 3
    );
    
    return {
      props: Math.round(propsCoverage),
      events: Math.round(eventsCoverage),
      branches: Math.round(branchesCoverage),
      statements: Math.round(statementsCoverage)
    };
  }
  
  /**
   * Suggest mocks based on component analysis
   * 
   * @param analysis Component analysis
   * @returns Array of suggested mock imports
   */
  private suggestMocks(analysis: ComponentAnalysis): string[] {
    const mocks: string[] = [];
    
    // Suggest mocks based on hooks
    if (analysis.hooks.includes('useContext')) {
      mocks.push("jest.mock('react', () => ({ ...jest.requireActual('react'), useContext: jest.fn() }));");
    }
    
    if (analysis.hooks.includes('useRouter') || analysis.imports.some(i => i.includes('next/router'))) {
      mocks.push("jest.mock('next/router', () => ({ useRouter: () => ({ push: jest.fn(), query: {} }) }));");
    }
    
    if (analysis.hooks.includes('useDispatch') || analysis.imports.some(i => i.includes('react-redux'))) {
      mocks.push("jest.mock('react-redux', () => ({ useDispatch: () => jest.fn(), useSelector: jest.fn() }));");
    }
    
    // Add mocks for props that are likely to need mocking
    for (const prop of analysis.props) {
      if (prop.type === 'function' && 
          (prop.name.includes('fetch') || prop.name.includes('load') || prop.name.includes('get'))) {
        mocks.push(`// Mock for ${prop.name} prop\nconst mock${prop.name.charAt(0).toUpperCase() + prop.name.slice(1)} = jest.fn();`);
      }
    }
    
    return mocks;
  }
}

export default TestGenerator;
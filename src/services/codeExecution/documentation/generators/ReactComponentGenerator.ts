import * as ts from 'typescript';
import {
  CodeToDocument,
  DocumentationOptions,
  DocumentationContext,
  CodeType,
  DocumentationStyle
} from '../types';
import { DocumentationGeneratorBase } from '../DocumentationGeneratorBase';

/**
 * Generator for documenting React components
 */
export class ReactComponentGenerator extends DocumentationGeneratorBase {
  constructor() {
    super('ReactComponentGenerator', [CodeType.REACT_COMPONENT]);
  }
  
  /**
   * Generate documentation for a React component
   */
  protected generateDocumentationContent(
    code: CodeToDocument,
    options: DocumentationOptions,
    context: DocumentationContext
  ): string {
    const { sourceCode, ast, filePath } = code;
    
    // Extract component name from context or try to infer it
    const componentName = context.entityName || this.extractComponentName(sourceCode, ast, filePath);
    
    // Extract props interface
    const propsInterface = this.extractPropsInterface(ast);
    
    // Extract state interface
    const stateInterface = this.extractStateInterface(ast);
    
    // Extract component description
    const description = this.extractComponentDescription(ast);
    
    // Extract methods/functions
    const methods = this.extractMethods(ast);
    
    // Extract hooks used
    const hooks = this.extractHooks(sourceCode);
    
    // Build documentation based on the detail level
    switch (options.style) {
      case DocumentationStyle.BRIEF:
        return this.generateBriefDocumentation(
          componentName,
          description,
          propsInterface,
          stateInterface,
          hooks,
          options
        );
      case DocumentationStyle.DETAILED:
        return this.generateDetailedDocumentation(
          componentName,
          description,
          propsInterface,
          stateInterface,
          methods,
          hooks,
          options
        );
      case DocumentationStyle.COMPREHENSIVE:
        return this.generateComprehensiveDocumentation(
          componentName,
          description,
          propsInterface,
          stateInterface,
          methods,
          hooks,
          sourceCode,
          options,
          context
        );
      case DocumentationStyle.STANDARD:
      default:
        return this.generateStandardDocumentation(
          componentName,
          description,
          propsInterface,
          stateInterface,
          methods,
          hooks,
          options
        );
    }
  }
  
  /**
   * Extract the component name from source code, AST, or file path
   */
  private extractComponentName(
    sourceCode: string,
    ast?: ts.SourceFile,
    filePath?: string
  ): string {
    // Try to extract from AST
    if (ast) {
      // Look for component class or function declaration
      let componentName = '';
      
      // Visit each node in the AST
      const visit = (node: ts.Node) => {
        if (ts.isClassDeclaration(node) &&
            node.name &&
            node.heritageClauses?.some(
              clause => clause.getText().includes('React.Component') ||
                       clause.getText().includes('Component')
            )) {
          componentName = node.name.getText();
          return;
        }
        
        if (ts.isFunctionDeclaration(node) && node.name) {
          // Check if function returns JSX
          if (this.functionReturnsJSX(node)) {
            componentName = node.name.getText();
            return;
          }
        }
        
        if (ts.isVariableStatement(node)) {
          node.declarationList.declarations.forEach(declaration => {
            if (declaration.name && ts.isIdentifier(declaration.name) &&
                declaration.initializer && 
                (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) {
              
              // Check if arrow function returns JSX
              if (this.functionReturnsJSX(declaration.initializer)) {
                componentName = declaration.name.getText();
                return;
              }
            }
          });
        }
        
        // Continue search in child nodes
        ts.forEachChild(node, visit);
      };
      
      visit(ast);
      
      if (componentName) {
        return componentName;
      }
    }
    
    // Try to extract from file path
    if (filePath) {
      const fileName = filePath.split('/').pop() || '';
      const baseName = fileName.split('.')[0];
      if (baseName && baseName !== 'index') {
        return baseName;
      }
    }
    
    // Default to generic name
    return 'ReactComponent';
  }
  
  /**
   * Check if a function or arrow function returns JSX
   */
  private functionReturnsJSX(node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression): boolean {
    if (!node.body) return false;
    
    let returnsJSX = false;
    
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
    
    visitBody(node.body);
    
    return returnsJSX;
  }
  
  /**
   * Extract props interface from AST
   */
  private extractPropsInterface(ast?: ts.SourceFile): any[] {
    if (!ast) return [];
    
    const propsProperties: any[] = [];
    
    // Visit each node in the AST
    const visit = (node: ts.Node) => {
      // Look for interfaces or types that end with "Props"
      if (ts.isInterfaceDeclaration(node) && 
          node.name.getText().endsWith('Props')) {
        // Extract properties
        node.members.forEach(member => {
          if (ts.isPropertySignature(member)) {
            const name = member.name.getText();
            const type = member.type ? member.type.getText() : 'any';
            const optional = member.questionToken !== undefined;
            const description = this.extractJSDocComment(member);
            
            propsProperties.push({
              name,
              type,
              optional,
              description
            });
          }
        });
        
        return;
      }
      
      // Look for type aliases that end with "Props"
      if (ts.isTypeAliasDeclaration(node) && 
          node.name.getText().endsWith('Props')) {
        
        // Handle type aliases with type literals
        if (ts.isTypeLiteralNode(node.type)) {
          node.type.members.forEach(member => {
            if (ts.isPropertySignature(member)) {
              const name = member.name.getText();
              const type = member.type ? member.type.getText() : 'any';
              const optional = member.questionToken !== undefined;
              const description = this.extractJSDocComment(member);
              
              propsProperties.push({
                name,
                type,
                optional,
                description
              });
            }
          });
        }
        
        return;
      }
      
      // Continue search in child nodes
      ts.forEachChild(node, visit);
    };
    
    visit(ast);
    
    return propsProperties;
  }
  
  /**
   * Extract state interface from AST
   */
  private extractStateInterface(ast?: ts.SourceFile): any[] {
    if (!ast) return [];
    
    const stateProperties: any[] = [];
    
    // Visit each node in the AST
    const visit = (node: ts.Node) => {
      // Look for interfaces or types that end with "State"
      if (ts.isInterfaceDeclaration(node) && 
          node.name.getText().endsWith('State')) {
        // Extract properties
        node.members.forEach(member => {
          if (ts.isPropertySignature(member)) {
            const name = member.name.getText();
            const type = member.type ? member.type.getText() : 'any';
            const optional = member.questionToken !== undefined;
            const description = this.extractJSDocComment(member);
            
            stateProperties.push({
              name,
              type,
              optional,
              description
            });
          }
        });
        
        return;
      }
      
      // Look for type aliases that end with "State"
      if (ts.isTypeAliasDeclaration(node) && 
          node.name.getText().endsWith('State')) {
        
        // Handle type aliases with type literals
        if (ts.isTypeLiteralNode(node.type)) {
          node.type.members.forEach(member => {
            if (ts.isPropertySignature(member)) {
              const name = member.name.getText();
              const type = member.type ? member.type.getText() : 'any';
              const optional = member.questionToken !== undefined;
              const description = this.extractJSDocComment(member);
              
              stateProperties.push({
                name,
                type,
                optional,
                description
              });
            }
          });
        }
        
        return;
      }
      
      // Continue search in child nodes
      ts.forEachChild(node, visit);
    };
    
    visit(ast);
    
    return stateProperties;
  }
  
  /**
   * Extract component description from AST
   */
  private extractComponentDescription(ast?: ts.SourceFile): string {
    if (!ast) return '';
    
    let description = '';
    
    // Visit each node in the AST
    const visit = (node: ts.Node) => {
      // Look for component class or function declaration
      if ((ts.isClassDeclaration(node) &&
           node.heritageClauses?.some(
             clause => clause.getText().includes('React.Component') ||
                      clause.getText().includes('Component')
           )) ||
          (ts.isFunctionDeclaration(node) && this.functionReturnsJSX(node)) ||
          (ts.isVariableStatement(node) &&
           node.declarationList.declarations.some(declaration => 
             declaration.initializer && 
             (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer)) &&
             this.functionReturnsJSX(declaration.initializer as ts.ArrowFunction | ts.FunctionExpression)
           ))
      ) {
        // Extract JSDoc comment
        description = this.extractJSDocComment(node);
        return;
      }
      
      // Continue search in child nodes
      ts.forEachChild(node, visit);
    };
    
    visit(ast);
    
    return description;
  }
  
  /**
   * Extract methods or functions from AST
   */
  private extractMethods(ast?: ts.SourceFile): any[] {
    if (!ast) return [];
    
    const methods: any[] = [];
    
    // Visit each node in the AST
    const visit = (node: ts.Node) => {
      // Look for methods in component class
      if (ts.isClassDeclaration(node) &&
          node.heritageClauses?.some(
            clause => clause.getText().includes('React.Component') ||
                     clause.getText().includes('Component')
          )) {
        
        node.members.forEach(member => {
          if (ts.isMethodDeclaration(member)) {
            const name = member.name.getText();
            const parameters = this.extractParameters(member);
            const returnType = this.extractReturnType(member);
            const description = this.extractJSDocComment(member);
            
            methods.push({
              name,
              parameters,
              returnType,
              description
            });
          }
        });
        
        return;
      }
      
      // Look for helper functions in the file
      if (ts.isFunctionDeclaration(node) && node.name) {
        const name = node.name.getText();
        
        // Skip if this is the component itself
        if (!this.functionReturnsJSX(node)) {
          const parameters = this.extractParameters(node);
          const returnType = this.extractReturnType(node);
          const description = this.extractJSDocComment(node);
          
          methods.push({
            name,
            parameters,
            returnType,
            description
          });
        }
      }
      
      // Continue search in child nodes
      ts.forEachChild(node, visit);
    };
    
    visit(ast);
    
    return methods;
  }
  
  /**
   * Extract hooks used in the component
   */
  private extractHooks(sourceCode: string): string[] {
    const hooks: string[] = [];
    
    // Common hooks to look for
    const hookPatterns = [
      'useState',
      'useEffect',
      'useContext',
      'useReducer',
      'useCallback',
      'useMemo',
      'useRef',
      'useImperativeHandle',
      'useLayoutEffect',
      'useDebugValue'
    ];
    
    // Check for hook usage in source code
    hookPatterns.forEach(hook => {
      if (new RegExp(`\\b${hook}\\s*\\(`).test(sourceCode)) {
        hooks.push(hook);
      }
    });
    
    // Also look for custom hooks (functions starting with "use")
    const customHookRegex = /\buse[A-Z]\w+\s*\(/g;
    let match;
    while ((match = customHookRegex.exec(sourceCode)) !== null) {
      const hook = match[0].replace(/\s*\($/, '');
      if (!hooks.includes(hook)) {
        hooks.push(hook);
      }
    }
    
    return hooks;
  }
  
  /**
   * Extract JSDoc comment from a node
   */
  private extractJSDocComment(node: ts.Node): string {
    const jsDocComments = ts.getJSDocCommentsAndTags(node);
    
    if (jsDocComments && jsDocComments.length > 0) {
      const jsDocComment = jsDocComments[0];
      if (ts.isJSDoc(jsDocComment) && typeof jsDocComment.comment === 'string') {
        return jsDocComment.comment;
      }
    }
    
    return '';
  }
  
  /**
   * Generate brief documentation
   */
  private generateBriefDocumentation(
    componentName: string,
    description: string,
    propsInterface: any[],
    stateInterface: any[],
    hooks: string[],
    options: DocumentationOptions
  ): string {
    let doc = `# ${componentName}\n\n`;
    
    // Add description
    if (description) {
      doc += `${description}\n\n`;
    } else {
      doc += `A React component.\n\n`;
    }
    
    // Add props section if there are any props
    if (propsInterface.length > 0) {
      doc += `## Props\n\n`;
      
      doc += `- **${propsInterface.length}** props: `;
      doc += propsInterface.map(prop => `\`${prop.name}\``).join(', ');
      doc += '\n\n';
    }
    
    // Add state section if there is state
    if (stateInterface.length > 0) {
      doc += `## State\n\n`;
      
      doc += `- **${stateInterface.length}** state properties: `;
      doc += stateInterface.map(prop => `\`${prop.name}\``).join(', ');
      doc += '\n\n';
    }
    
    // Add hooks section if there are any hooks
    if (hooks.length > 0) {
      doc += `## Hooks\n\n`;
      doc += `- Uses ${hooks.map(hook => `\`${hook}\``).join(', ')}\n\n`;
    }
    
    return doc;
  }
  
  /**
   * Generate standard documentation
   */
  private generateStandardDocumentation(
    componentName: string,
    description: string,
    propsInterface: any[],
    stateInterface: any[],
    methods: any[],
    hooks: string[],
    options: DocumentationOptions
  ): string {
    let doc = `# ${componentName}\n\n`;
    
    // Add description
    if (description) {
      doc += `${description}\n\n`;
    } else {
      doc += `A React component.\n\n`;
    }
    
    // Add props section if there are any props
    if (propsInterface.length > 0) {
      doc += `## Props\n\n`;
      
      doc += `| Name | Type | Required | Description |\n`;
      doc += `|------|------|----------|-------------|\n`;
      
      propsInterface.forEach(prop => {
        doc += `| ${prop.name} | \`${prop.type}\` | ${prop.optional ? 'No' : 'Yes'} | ${prop.description || ''} |\n`;
      });
      
      doc += '\n';
    }
    
    // Add state section if there is state
    if (stateInterface.length > 0) {
      doc += `## State\n\n`;
      
      doc += `| Name | Type | Description |\n`;
      doc += `|------|------|-------------|\n`;
      
      stateInterface.forEach(prop => {
        doc += `| ${prop.name} | \`${prop.type}\` | ${prop.description || ''} |\n`;
      });
      
      doc += '\n';
    }
    
    // Add methods section if there are any methods
    if (methods.length > 0 && options.includeTypes) {
      doc += `## Methods\n\n`;
      
      methods.forEach(method => {
        doc += `### ${method.name}\n\n`;
        
        if (method.description) {
          doc += `${method.description}\n\n`;
        }
        
        if (method.parameters.length > 0) {
          doc += `**Parameters:**\n\n`;
          method.parameters.forEach((param: any) => {
            doc += `- \`${param.name}\` (${param.type})${param.optional ? ' (optional)' : ''}\n`;
          });
          doc += '\n';
        }
        
        doc += `**Returns:** \`${method.returnType}\`\n\n`;
      });
    }
    
    // Add hooks section if there are any hooks
    if (hooks.length > 0) {
      doc += `## Hooks\n\n`;
      
      hooks.forEach(hook => {
        doc += `- \`${hook}\`\n`;
      });
      
      doc += '\n';
    }
    
    return doc;
  }
  
  /**
   * Generate detailed documentation
   */
  private generateDetailedDocumentation(
    componentName: string,
    description: string,
    propsInterface: any[],
    stateInterface: any[],
    methods: any[],
    hooks: string[],
    options: DocumentationOptions
  ): string {
    // Start with standard documentation
    let doc = this.generateStandardDocumentation(
      componentName,
      description,
      propsInterface,
      stateInterface,
      methods,
      hooks,
      options
    );
    
    // Add usage example if requested
    if (options.includeExamples) {
      doc += `## Usage Example\n\n`;
      doc += '```jsx\n';
      doc += `import React from 'react';\n`;
      doc += `import { ${componentName} } from './${componentName}';\n\n`;
      doc += `function ExampleUsage() {\n`;
      doc += `  return (\n`;
      doc += `    <${componentName}`;
      
      // Add some example props if available
      if (propsInterface.length > 0) {
        doc += '\n';
        propsInterface.forEach(prop => {
          if (prop.type === 'string') {
            doc += `      ${prop.name}="${prop.name}Value"\n`;
          } else if (prop.type === 'number') {
            doc += `      ${prop.name}={42}\n`;
          } else if (prop.type === 'boolean') {
            doc += `      ${prop.name}={true}\n`;
          } else if (prop.type.includes('[]') || prop.type.includes('Array')) {
            doc += `      ${prop.name}={[]}\n`;
          } else if (prop.type.includes('{}') || prop.type.includes('object')) {
            doc += `      ${prop.name}={{}}\n`;
          } else if (prop.type.includes('()') || prop.type.includes('function')) {
            doc += `      ${prop.name}={() => {}}\n`;
          } else if (prop.optional) {
            // Skip optional props that we don't know how to initialize
          } else {
            doc += `      ${prop.name}={/* TODO: Add ${prop.type} value */}\n`;
          }
        });
        doc += `    `;
      }
      
      doc += `>\n`;
      doc += `      {/* Component children */}\n`;
      doc += `    </${componentName}>\n`;
      doc += `  );\n`;
      doc += `}\n`;
      doc += '```\n\n';
    }
    
    return doc;
  }
  
  /**
   * Generate comprehensive documentation
   */
  private generateComprehensiveDocumentation(
    componentName: string,
    description: string,
    propsInterface: any[],
    stateInterface: any[],
    methods: any[],
    hooks: string[],
    sourceCode: string,
    options: DocumentationOptions,
    context: DocumentationContext
  ): string {
    // Start with detailed documentation
    let doc = this.generateDetailedDocumentation(
      componentName,
      description,
      propsInterface,
      stateInterface,
      methods,
      hooks,
      options
    );
    
    // Add lifecycle information
    if (hooks.includes('useEffect')) {
      doc += `## Lifecycle\n\n`;
      doc += `This component uses the \`useEffect\` hook, which corresponds to componentDidMount, componentDidUpdate, and componentWillUnmount lifecycle methods in class components.\n\n`;
    }
    
    // Add dependencies section if context has module information
    if (context.moduleName) {
      doc += `## Dependencies\n\n`;
      doc += `This component is part of the \`${context.moduleName}\` module.\n\n`;
      
      if (context.repositoryUrl) {
        doc += `Source: [${context.repositoryUrl}](${context.repositoryUrl})\n\n`;
      }
    }
    
    // Add file information
    if (context.filePath) {
      doc += `## File Information\n\n`;
      doc += `- File: \`${context.filePath}\`\n`;
      
      if (context.author) {
        doc += `- Author: ${context.author}\n`;
      }
      
      if (context.projectVersion) {
        doc += `- Version: ${context.projectVersion}\n`;
      }
      
      doc += '\n';
    }
    
    // Add performance considerations
    doc += `## Performance Considerations\n\n`;
    
    if (hooks.includes('useMemo') || hooks.includes('useCallback')) {
      doc += `This component uses memoization techniques (${
        hooks.includes('useMemo') ? '`useMemo`' : ''
      }${
        hooks.includes('useMemo') && hooks.includes('useCallback') ? ' and ' : ''
      }${
        hooks.includes('useCallback') ? '`useCallback`' : ''
      }) to optimize rendering performance.\n\n`;
    } else {
      doc += `Consider using memoization techniques like \`useMemo\` and \`useCallback\` for performance-critical components.\n\n`;
    }
    
    // Add accessibility information
    doc += `## Accessibility\n\n`;
    
    if (sourceCode.includes('aria-') || sourceCode.includes('role=')) {
      doc += `This component includes ARIA attributes to enhance accessibility.\n\n`;
    } else {
      doc += `Ensure that this component follows accessibility guidelines by adding appropriate ARIA attributes when necessary.\n\n`;
    }
    
    return doc;
  }
}
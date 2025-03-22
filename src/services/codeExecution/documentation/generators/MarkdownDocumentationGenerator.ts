import * as ts from 'typescript';
import { InferredProp } from '../../PropTypeInference';
import {
  CodeToDocument,
  DocumentationOptions,
  DocumentationContext,
  DocumentationResult,
  CodeType,
  DocumentationFormat,
  DocumentationStyle,
  DocumentationScope
} from '../types';
import { DocumentationGeneratorBase } from '../DocumentationGeneratorBase';

/**
 * Interface for the component information extracted from code
 */
interface ComponentInfo {
  /** Component name */
  name: string;
  /** Component description */
  description: string;
  /** Component props */
  props: InferredProp[];
  /** JSDoc tags from component */
  tags: Record<string, string>;
  /** Example usages */
  examples: UsageExample[];
  /** Parent component (if any) */
  parent?: string;
  /** Children components */
  children: string[];
  /** Component file path */
  filePath: string;
}

/**
 * Usage example for a component
 */
interface UsageExample {
  /** Example title */
  title: string;
  /** Example code */
  code: string;
  /** Description of the example */
  description?: string;
}

/**
 * Generates Markdown documentation for React components and functions
 */
export class MarkdownDocumentationGenerator extends DocumentationGeneratorBase {
  constructor() {
    super('MarkdownDocumentationGenerator', [
      CodeType.REACT_COMPONENT,
      CodeType.FUNCTION,
      CodeType.CLASS,
      CodeType.INTERFACE
    ]);
  }
  
  /**
   * Generate documentation for the given code
   */
  protected generateDocumentationContent(
    code: CodeToDocument,
    options: DocumentationOptions,
    context: DocumentationContext
  ): string {
    const { sourceCode, ast, filePath } = code;
    const codeType = code.codeType || this.detectCodeType(code);
    
    // Extract component information from the code
    const componentInfo = this.analyzeComponent(sourceCode, ast, filePath, context);
    
    // Use custom template if provided
    if (options.customOptions?.template) {
      return this.applyTemplate(options.customOptions.template, componentInfo);
    }
    
    // Generate Markdown documentation
    return this.generateMarkdownDocs(componentInfo, options);
  }
  
  /**
   * Analyze component to extract documentation-relevant information
   */
  private analyzeComponent(
    sourceCode: string,
    ast?: ts.SourceFile,
    filePath?: string,
    context?: DocumentationContext
  ): ComponentInfo {
    let componentName = context?.entityName || '';
    let componentDescription = '';
    const tags: Record<string, string> = {};
    const examples: UsageExample[] = [];
    const children: string[] = [];
    let parent: string | undefined;
    
    try {
      // Create a source file from the component code if not provided
      const sourceFile = ast || ts.createSourceFile(
        'component.tsx',
        sourceCode,
        ts.ScriptTarget.Latest,
        true
      );
      
      // Extract component name and description from JSDoc
      const visit = (node: ts.Node) => {
        // Look for component declarations
        if (ts.isFunctionDeclaration(node) || 
            ts.isVariableStatement(node) ||
            ts.isClassDeclaration(node)) {
          
          // Get JSDoc comments
          const jsDocComments = ts.getJSDocCommentsAndTags(node);
          if (jsDocComments && jsDocComments.length > 0) {
            const jsDoc = jsDocComments[0];
            
            // Extract description
            if (ts.isJSDoc(jsDoc)) {
              if (jsDoc.comment) {
                componentDescription = typeof jsDoc.comment === 'string' ? 
                  jsDoc.comment : jsDoc.comment.map(c => c.text).join('');
              }
              
              // Extract tags
              if (jsDoc.tags) {
                jsDoc.tags.forEach(tag => {
                  if (ts.isJSDoc(tag) && tag.tagName) {
                    const tagName = tag.tagName.text;
                    const tagText = tag.comment || '';
                    tags[tagName] = typeof tagText === 'string' ?
                      tagText : tagText.map(c => c.text).join('');
                  }
                });
              }
            }
          }
          
          // Get component name
          if (ts.isFunctionDeclaration(node) && node.name) {
            componentName = node.name.text;
          } else if (ts.isVariableStatement(node)) {
            const declaration = node.declarationList.declarations[0];
            if (declaration.name) {
              componentName = declaration.name.getText(sourceFile);
            }
          } else if (ts.isClassDeclaration(node) && node.name) {
            componentName = node.name.text;
          }
        }
        
        // Look for JSX elements to determine children
        if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
          const tagName = ts.isJsxElement(node) ? 
            node.openingElement.tagName.getText(sourceFile) : 
            node.tagName.getText(sourceFile);
          
          // If tag starts with uppercase, it's likely a component
          if (/^[A-Z]/.test(tagName) && 
              !children.includes(tagName) && 
              tagName !== componentName) {
            children.push(tagName);
          }
        }
        
        // Look for extends to determine parent (for class components)
        if (ts.isClassDeclaration(node) && node.heritageClauses) {
          for (const heritage of node.heritageClauses) {
            if (heritage.token === ts.SyntaxKind.ExtendsKeyword) {
              const parentType = heritage.types[0].expression.getText(sourceFile);
              // Extract component name from React.Component<Props>
              const parentMatch = parentType.match(/(\w+)(?=(?:\<.*\>)?$)/);
              if (parentMatch && parentMatch[1] !== 'Component') {
                parent = parentMatch[1];
              }
            }
          }
        }
        
        // Extract examples from JSDoc @example tags
        if (ts.isJSDoc(node) && node.tags) {
          for (const tag of node.tags) {
            if (ts.isJSDoc(tag) && tag.tagName && tag.tagName.text === 'example' && tag.comment) {
              const exampleText = typeof tag.comment === 'string' ? 
                tag.comment : tag.comment.map(c => c.text).join('');
              
              // Try to extract code block
              const codeBlockMatch = exampleText.match(/```(?:jsx?|tsx?)?\s*([\s\S]*?)```/);
              const code = codeBlockMatch ? codeBlockMatch[1].trim() : exampleText.trim();
              
              // Try to extract title (first line before code block)
              const titleMatch = exampleText.match(/^([^\n]+)/);
              const title = titleMatch ? titleMatch[1].trim() : 'Example';
              
              examples.push({
                title,
                code,
                description: exampleText.replace(code, '').trim()
              });
            }
          }
        }
        
        // Continue traversal
        ts.forEachChild(node, visit);
      };
      
      // Start traversal
      ts.forEachChild(sourceFile, visit);
      
      // If component name is still empty, try to extract from filename
      if (!componentName && filePath) {
        const path = require('path');
        const filename = path.basename(filePath, path.extname(filePath));
        componentName = filename.charAt(0).toUpperCase() + filename.slice(1);
      }
      
    } catch (error) {
      console.error('Error analyzing component for documentation:', error);
    }
    
    // Extract props from context if available
    const props = (context?.metadata?.props as InferredProp[]) || [];
    
    return {
      name: componentName,
      description: componentDescription,
      props,
      tags,
      examples,
      parent,
      children,
      filePath: filePath || ''
    };
  }
  
  /**
   * Generate Markdown documentation
   */
  private generateMarkdownDocs(componentInfo: ComponentInfo, options: DocumentationOptions): string {
    // Start with component name and description
    let markdown = `# ${componentInfo.name}\n\n`;
    
    if (componentInfo.description) {
      markdown += `${componentInfo.description}\n\n`;
    }
    
    // Add component hierarchy if enabled
    if (options.includeSeeAlso !== false && (componentInfo.parent || componentInfo.children.length > 0)) {
      markdown += `## Component Hierarchy\n\n`;
      
      if (componentInfo.parent) {
        markdown += `- Parent Component: \`${componentInfo.parent}\`\n`;
      }
      
      if (componentInfo.children.length > 0) {
        markdown += `- Child Components: ${componentInfo.children.map(c => `\`${c}\``).join(', ')}\n`;
      }
      
      markdown += `\n`;
    }
    
    // Add props table if enabled
    if (options.includeParameters !== false && componentInfo.props.length > 0) {
      markdown += `## Props\n\n`;
      markdown += `| Name | Type | Required | Description | Default |\n`;
      markdown += `| ---- | ---- | -------- | ----------- | ------- |\n`;
      
      for (const prop of componentInfo.props) {
        const defaultValue = prop.defaultValue !== undefined ? 
          `\`${JSON.stringify(prop.defaultValue)}\`` : '';
        
        markdown += `| ${prop.name} | \`${prop.type}\` | ${prop.required ? 'Yes' : 'No'} | ${prop.description || ''} | ${defaultValue} |\n`;
      }
      
      markdown += `\n`;
    }
    
    // Add TypeScript interfaces if enabled
    if (options.includeTypes !== false && componentInfo.props.length > 0) {
      markdown += `## TypeScript Interface\n\n`;
      markdown += "```typescript\n";
      markdown += `interface ${componentInfo.name}Props {\n`;
      
      for (const prop of componentInfo.props) {
        if (prop.description) {
          markdown += `  /** ${prop.description} */\n`;
        }
        markdown += `  ${prop.name}${prop.required ? '' : '?'}: ${prop.type};\n`;
      }
      
      markdown += `}\n`;
      markdown += "```\n\n";
    }
    
    // Add usage examples if enabled
    if (options.includeExamples !== false) {
      markdown += `## Usage Examples\n\n`;
      
      if (componentInfo.examples.length > 0) {
        // Use extracted examples
        for (const example of componentInfo.examples) {
          markdown += `### ${example.title}\n\n`;
          
          if (example.description) {
            markdown += `${example.description}\n\n`;
          }
          
          markdown += "```jsx\n";
          markdown += `${example.code}\n`;
          markdown += "```\n\n";
        }
      } else {
        // Generate a basic example
        markdown += `### Basic Example\n\n`;
        markdown += "```jsx\n";
        markdown += `import React from 'react';\n`;
        markdown += `import ${componentInfo.name} from './${componentInfo.name}';\n\n`;
        markdown += `function Example() {\n`;
        markdown += `  return (\n`;
        markdown += `    <${componentInfo.name}`;
        
        // Add required props
        const requiredProps = componentInfo.props.filter(p => p.required);
        if (requiredProps.length > 0) {
          markdown += `\n`;
          for (const prop of requiredProps) {
            let value = '';
            
            // Generate appropriate value based on type
            switch (prop.type) {
              case 'string':
                value = `"Example ${prop.name}"`;
                break;
              case 'number':
                value = '42';
                break;
              case 'boolean':
                value = 'true';
                break;
              case 'function':
                value = `{() => console.log("${prop.name} called")}`;
                break;
              case 'array':
                value = '{[]}';
                break;
              case 'object':
                value = '{{}}';
                break;
              default:
                value = '{}';
            }
            
            markdown += `      ${prop.name}=${value}\n`;
          }
          markdown += `    `;
        }
        
        markdown += ` />\n`;
        markdown += `  );\n`;
        markdown += `}\n`;
        markdown += "```\n\n";
      }
    }
    
    // Add accessibility information if enabled
    if (options.customOptions?.includeAccessibility) {
      markdown += `## Accessibility\n\n`;
      
      // Check for ARIA attributes in the codebase
      const hasAriaAttributes = componentInfo.tags['aria'] !== undefined;
      
      if (hasAriaAttributes) {
        markdown += componentInfo.tags['aria'] + '\n\n';
      } else {
        markdown += `This component ${componentInfo.tags['a11y'] ? componentInfo.tags['a11y'] : 'implements standard accessibility features. Please ensure that you provide appropriate ARIA attributes when necessary.'}\n\n`;
      }
    }
    
    return markdown;
  }
  
  /**
   * Apply a template to the component information
   */
  private applyTemplate(template: string, componentInfo: ComponentInfo): string {
    return template
      .replace(/\${componentName}/g, componentInfo.name)
      .replace(/\${componentDescription}/g, componentInfo.description)
      .replace(/\${propsTable}/g, this.generatePropsTable(componentInfo.props))
      .replace(/\${examples}/g, this.generateExamplesMarkdown(componentInfo.examples))
      .replace(/\${typeScriptInterface}/g, this.generateTypeScriptInterface(componentInfo))
      .replace(/\${hierarchy}/g, this.generateHierarchyText(componentInfo));
  }
  
  /**
   * Generate a props table in markdown format
   */
  private generatePropsTable(props: InferredProp[]): string {
    if (props.length === 0) {
      return 'No props defined for this component.';
    }
    
    let table = `| Name | Type | Required | Description | Default |\n`;
    table += `| ---- | ---- | -------- | ----------- | ------- |\n`;
    
    for (const prop of props) {
      const defaultValue = prop.defaultValue !== undefined ? 
        `\`${JSON.stringify(prop.defaultValue)}\`` : '';
      
      table += `| ${prop.name} | \`${prop.type}\` | ${prop.required ? 'Yes' : 'No'} | ${prop.description || ''} | ${defaultValue} |\n`;
    }
    
    return table;
  }
  
  /**
   * Generate examples in markdown format
   */
  private generateExamplesMarkdown(examples: UsageExample[]): string {
    if (examples.length === 0) {
      return 'No examples available.';
    }
    
    let markdown = '';
    
    for (const example of examples) {
      markdown += `### ${example.title}\n\n`;
      
      if (example.description) {
        markdown += `${example.description}\n\n`;
      }
      
      markdown += "```jsx\n";
      markdown += `${example.code}\n`;
      markdown += "```\n\n";
    }
    
    return markdown;
  }
  
  /**
   * Generate TypeScript interface for component props
   */
  private generateTypeScriptInterface(componentInfo: ComponentInfo): string {
    if (componentInfo.props.length === 0) {
      return 'No props defined for this component.';
    }
    
    let code = "```typescript\n";
    code += `interface ${componentInfo.name}Props {\n`;
    
    for (const prop of componentInfo.props) {
      if (prop.description) {
        code += `  /** ${prop.description} */\n`;
      }
      code += `  ${prop.name}${prop.required ? '' : '?'}: ${prop.type};\n`;
    }
    
    code += `}\n`;
    code += "```";
    
    return code;
  }
  
  /**
   * Generate hierarchy text in markdown format
   */
  private generateHierarchyText(componentInfo: ComponentInfo): string {
    if (!componentInfo.parent && componentInfo.children.length === 0) {
      return 'This component does not have explicit parent/child relationships.';
    }
    
    let text = '';
    
    if (componentInfo.parent) {
      text += `- Parent Component: \`${componentInfo.parent}\`\n`;
    }
    
    if (componentInfo.children.length > 0) {
      text += `- Child Components: ${componentInfo.children.map(c => `\`${c}\``).join(', ')}\n`;
    }
    
    return text;
  }
}
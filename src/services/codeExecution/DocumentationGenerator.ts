import * as ts from 'typescript';
import { InferredProp } from './PropTypeInference';
import * as path from 'path';

/**
 * Documentation format options
 */
export enum DocumentationFormat {
  MARKDOWN = 'markdown',
  JSDOC = 'jsdoc',
  STORYBOOK = 'storybook',
  DOCUSAURUS = 'docusaurus',
  HTML = 'html'
}

/**
 * Configuration for documentation generation
 */
export interface DocumentationOptions {
  /** Output format */
  format: DocumentationFormat;
  /** Include usage examples */
  includeExamples?: boolean;
  /** Include props table */
  includeProps?: boolean;
  /** Include TypeScript interfaces */
  includeInterfaces?: boolean;
  /** Include accessibility info */
  includeAccessibility?: boolean;
  /** Include component hierarchy */
  includeHierarchy?: boolean;
  /** Output directory (relative to component) */
  outputDir?: string;
  /** Custom template content */
  template?: string;
}

/**
 * Usage example for a component
 */
export interface UsageExample {
  /** Example title */
  title: string;
  /** Example code */
  code: string;
  /** Example description */
  description?: string;
}

/**
 * Result of documentation generation
 */
export interface DocumentationResult {
  /** Path to the generated documentation file */
  filePath: string;
  /** Generated documentation content */
  content: string;
  /** Component name */
  componentName: string;
  /** Documentation format */
  format: DocumentationFormat;
}

/**
 * Component information extracted from code
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
 * Generates documentation for React components
 */
export class DocumentationGenerator {
  private options: Required<DocumentationOptions>;
  
  constructor(options: DocumentationOptions) {
    // Set default options
    this.options = {
      format: options.format,
      includeExamples: options.includeExamples ?? true,
      includeProps: options.includeProps ?? true,
      includeInterfaces: options.includeInterfaces ?? true,
      includeAccessibility: options.includeAccessibility ?? true,
      includeHierarchy: options.includeHierarchy ?? true,
      outputDir: options.outputDir ?? './docs',
      template: options.template ?? ''
    };
  }
  
  /**
   * Generate documentation for a component
   * 
   * @param componentPath Path to the component file
   * @param componentCode Component source code
   * @param inferredProps Optional pre-analyzed props
   * @param examples Optional additional usage examples
   * @returns Documentation generation result
   */
  generateDocumentation(
    componentPath: string,
    componentCode: string,
    inferredProps?: InferredProp[],
    examples?: UsageExample[]
  ): DocumentationResult {
    // Analyze the component
    const componentInfo = this.analyzeComponent(componentPath, componentCode, inferredProps);
    
    // Add additional examples if provided
    if (examples) {
      componentInfo.examples.push(...examples);
    }
    
    // Generate documentation based on format
    let content = '';
    switch (this.options.format) {
      case DocumentationFormat.MARKDOWN:
        content = this.generateMarkdownDocs(componentInfo);
        break;
      case DocumentationFormat.JSDOC:
        content = this.generateJSDocComments(componentInfo);
        break;
      case DocumentationFormat.STORYBOOK:
        content = this.generateStorybookDocs(componentInfo);
        break;
      case DocumentationFormat.DOCUSAURUS:
        content = this.generateDocusaurusDocs(componentInfo);
        break;
      case DocumentationFormat.HTML:
        content = this.generateHtmlDocs(componentInfo);
        break;
    }
    
    // Generate output file path
    const filePath = this.generateOutputPath(componentPath, componentInfo.name);
    
    return {
      filePath,
      content,
      componentName: componentInfo.name,
      format: this.options.format
    };
  }
  
  /**
   * Analyze a component to extract documentation-relevant information
   * 
   * @param componentPath Component file path
   * @param componentCode Component source code
   * @param inferredProps Optional pre-analyzed props
   * @returns Component information
   */
  private analyzeComponent(
    componentPath: string,
    componentCode: string,
    inferredProps?: InferredProp[]
  ): ComponentInfo {
    let componentName = '';
    let componentDescription = '';
    const tags: Record<string, string> = {};
    const examples: UsageExample[] = [];
    const children: string[] = [];
    let parent: string | undefined;
    
    try {
      // Create a source file from the component code
      const sourceFile = ts.createSourceFile(
        'component.tsx',
        componentCode,
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
            if (tag.tagName.text === 'example' && tag.comment) {
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
      if (!componentName) {
        const filename = path.basename(componentPath, path.extname(componentPath));
        componentName = filename.charAt(0).toUpperCase() + filename.slice(1);
      }
      
    } catch (error) {
      console.error('Error analyzing component for documentation:', error);
    }
    
    // Use inferred props or empty array
    const props = inferredProps || [];
    
    return {
      name: componentName,
      description: componentDescription,
      props,
      tags,
      examples,
      parent,
      children,
      filePath: componentPath
    };
  }
  
  /**
   * Generate Markdown documentation
   * 
   * @param componentInfo Component information
   * @returns Markdown documentation content
   */
  private generateMarkdownDocs(componentInfo: ComponentInfo): string {
    // Use custom template if provided
    if (this.options.template && this.options.format === DocumentationFormat.MARKDOWN) {
      return this.applyTemplate(this.options.template, componentInfo);
    }
    
    // Start with component name and description
    let markdown = `# ${componentInfo.name}\n\n`;
    
    if (componentInfo.description) {
      markdown += `${componentInfo.description}\n\n`;
    }
    
    // Add component hierarchy if enabled
    if (this.options.includeHierarchy && (componentInfo.parent || componentInfo.children.length > 0)) {
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
    if (this.options.includeProps && componentInfo.props.length > 0) {
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
    if (this.options.includeInterfaces && componentInfo.props.length > 0) {
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
    if (this.options.includeExamples) {
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
    if (this.options.includeAccessibility) {
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
   * Generate JSDoc comments for a component
   * 
   * @param componentInfo Component information
   * @returns JSDoc comments
   */
  private generateJSDocComments(componentInfo: ComponentInfo): string {
    let jsdoc = `/**\n`;
    jsdoc += ` * ${componentInfo.name} Component\n`;
    
    // Add description
    if (componentInfo.description) {
      jsdoc += ` *\n`;
      
      // Split description into lines and add asterisk to each
      const descriptionLines = componentInfo.description.split('\n');
      for (const line of descriptionLines) {
        jsdoc += ` * ${line}\n`;
      }
    }
    
    // Add component hierarchy
    if (this.options.includeHierarchy) {
      if (componentInfo.parent) {
        jsdoc += ` *\n * @extends {${componentInfo.parent}}\n`;
      }
      
      if (componentInfo.children.length > 0) {
        jsdoc += ` *\n * @uses ${componentInfo.children.join(', ')}\n`;
      }
    }
    
    // Add prop documentation
    if (this.options.includeProps && componentInfo.props.length > 0) {
      jsdoc += ` *\n`;
      
      for (const prop of componentInfo.props) {
        const paramTag = prop.required ? '@param' : '@param [optional]';
        const typeStr = prop.type.toString();
        
        jsdoc += ` * ${paramTag} {${typeStr}} ${prop.name} ${prop.description || ''}\n`;
        
        if (prop.defaultValue !== undefined) {
          jsdoc += ` * @param [${prop.name}=${JSON.stringify(prop.defaultValue)}] - Default value\n`;
        }
      }
    }
    
    // Add usage examples if enabled
    if (this.options.includeExamples && componentInfo.examples.length > 0) {
      for (const example of componentInfo.examples) {
        jsdoc += ` *\n * @example\n * ${example.title}\n * \n`;
        
        // Split code into lines and add asterisk + space to each
        const codeLines = example.code.split('\n');
        for (const line of codeLines) {
          jsdoc += ` * ${line}\n`;
        }
      }
    }
    
    // Add accessibility info
    if (this.options.includeAccessibility && componentInfo.tags['a11y']) {
      jsdoc += ` *\n * @accessibility ${componentInfo.tags['a11y']}\n`;
    }
    
    jsdoc += ` */\n`;
    return jsdoc;
  }
  
  /**
   * Generate Storybook documentation
   * 
   * @param componentInfo Component information
   * @returns Storybook documentation content
   */
  private generateStorybookDocs(componentInfo: ComponentInfo): string {
    const stories = `import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ${componentInfo.name} } from './${componentInfo.name}';

/**
 * ${componentInfo.description || `${componentInfo.name} component`}
 */
const meta: Meta<typeof ${componentInfo.name}> = {
  title: 'Components/${componentInfo.name}',
  component: ${componentInfo.name},
  tags: ['autodocs'],
  argTypes: {
${componentInfo.props.map(prop => {
  // Generate argType based on prop type
  let controlType = 'text';
  switch (prop.type) {
    case 'boolean':
      controlType = 'boolean';
      break;
    case 'number':
      controlType = 'number';
      break;
    case 'string':
      controlType = 'text';
      break;
    case 'array':
      controlType = 'object';
      break;
    case 'function':
      controlType = 'function';
      break;
  }
  
  return `    ${prop.name}: { 
      description: '${prop.description || ''}',
      control: { type: '${controlType}' },
      ${prop.defaultValue !== undefined ? `defaultValue: ${JSON.stringify(prop.defaultValue)},` : ''}
      ${!prop.required ? 'required: false,' : 'required: true,'}
    }`;
}).join(',\n')}
  },
};

export default meta;
type Story = StoryObj<typeof ${componentInfo.name}>;

/**
 * Default usage of ${componentInfo.name} component
 */
export const Default: Story = {
  args: {
${componentInfo.props.filter(p => p.required).map(prop => {
  // Generate default value based on type
  let defaultValue = '';
  switch (prop.type) {
    case 'string':
      defaultValue = `'Sample ${prop.name}'`;
      break;
    case 'number':
      defaultValue = '42';
      break;
    case 'boolean':
      defaultValue = 'true';
      break;
    case 'function':
      defaultValue = '() => console.log("Function called")';
      break;
    case 'array':
      defaultValue = '[]';
      break;
    case 'object':
      defaultValue = '{}';
      break;
    default:
      defaultValue = 'undefined';
  }
  
  return `    ${prop.name}: ${defaultValue}`;
}).join(',\n')}
  },
};
`;

    // Add additional examples as stories
    const additionalStories = componentInfo.examples.map((example, index) => {
      // Try to extract props from JSX
      const propsMatch = example.code.match(/<\w+\s+([^>]+)/);
      const propsStr = propsMatch ? propsMatch[1] : '';
      
      // Convert JSX props to Storybook args
      const argsObj: Record<string, string> = {};
      
      // Simple regex to extract props from JSX string
      const propRegex = /(\w+)(?:=(?:{([^}]+)}|"([^"]+)"))/g;
      let match;
      
      while ((match = propRegex.exec(propsStr)) !== null) {
        const propName = match[1];
        const jsValue = match[2];
        const stringValue = match[3];
        
        if (jsValue) {
          argsObj[propName] = jsValue;
        } else if (stringValue) {
          argsObj[propName] = `'${stringValue}'`;
        }
      }
      
      return `
/**
 * ${example.title}
 * ${example.description || ''}
 */
export const Example${index + 1}: Story = {
  args: {
${Object.entries(argsObj).map(([key, value]) => `    ${key}: ${value}`).join(',\n')}
  },
};`;
    }).join('\n');

    return stories + additionalStories;
  }
  
  /**
   * Generate Docusaurus documentation
   * 
   * @param componentInfo Component information
   * @returns Docusaurus documentation content
   */
  private generateDocusaurusDocs(componentInfo: ComponentInfo): string {
    // Start with frontmatter
    let content = `---
id: ${componentInfo.name.toLowerCase()}
title: ${componentInfo.name}
sidebar_label: ${componentInfo.name}
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

`;

    // Add description
    if (componentInfo.description) {
      content += `${componentInfo.description}\n\n`;
    }

    // Add import code
    content += `## Import\n\n`;
    content += "```jsx\n";
    content += `import { ${componentInfo.name} } from 'your-library';\n`;
    content += "```\n\n";

    // Add live example using docusaurus tabs
    content += `## Example\n\n`;
    content += `<Tabs\n`;
    content += `  defaultValue="jsx"\n`;
    content += `  values={[\n`;
    content += `    { label: 'JSX', value: 'jsx' },\n`;
    content += `    { label: 'Result', value: 'result' },\n`;
    content += `  ]}\n`;
    content += `>\n`;

    // JSX tab
    content += `<TabItem value="jsx">\n\n`;
    
    if (componentInfo.examples.length > 0) {
      content += "```jsx live\n";
      content += componentInfo.examples[0].code;
      content += "\n```\n\n";
    } else {
      content += "```jsx live\n";
      content += `function Example() {\n`;
      content += `  return (\n`;
      content += `    <${componentInfo.name}`;
      
      // Add required props
      const requiredProps = componentInfo.props.filter(p => p.required);
      if (requiredProps.length > 0) {
        content += `\n`;
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
          
          content += `      ${prop.name}=${value}\n`;
        }
        content += `    `;
      }
      
      content += ` />\n`;
      content += `  );\n`;
      content += `}\n`;
      content += "```\n\n";
    }
    
    content += `</TabItem>\n\n`;

    // Result tab (placeholder)
    content += `<TabItem value="result">\n\n`;
    content += `Rendered ${componentInfo.name} component example.\n\n`;
    content += `</TabItem>\n`;
    content += `</Tabs>\n\n`;

    // Add props API
    if (this.options.includeProps && componentInfo.props.length > 0) {
      content += `## API\n\n`;
      content += `### Props\n\n`;
      content += `| Prop | Type | Default | Required | Description |\n`;
      content += `| ---- | ---- | ------- | -------- | ----------- |\n`;
      
      for (const prop of componentInfo.props) {
        const defaultValue = prop.defaultValue !== undefined ? 
          `\`${JSON.stringify(prop.defaultValue)}\`` : '-';
        
        content += `| ${prop.name} | \`${prop.type}\` | ${defaultValue} | ${prop.required ? 'Yes' : 'No'} | ${prop.description || ''} |\n`;
      }
      
      content += `\n`;
    }

    // Add component hierarchy
    if (this.options.includeHierarchy && (componentInfo.parent || componentInfo.children.length > 0)) {
      content += `## Component Relationships\n\n`;
      
      if (componentInfo.parent) {
        content += `- **Parent Component:** \`${componentInfo.parent}\`\n`;
      }
      
      if (componentInfo.children.length > 0) {
        content += `- **Child Components:** ${componentInfo.children.map(c => `\`${c}\``).join(', ')}\n`;
      }
      
      content += `\n`;
    }

    // Add accessibility information
    if (this.options.includeAccessibility) {
      content += `## Accessibility\n\n`;
      
      if (componentInfo.tags['a11y']) {
        content += componentInfo.tags['a11y'] + '\n\n';
      } else {
        content += `This component implements standard accessibility features. Please ensure that you provide appropriate ARIA attributes when necessary.\n\n`;
      }
    }

    return content;
  }
  
  /**
   * Generate HTML documentation
   * 
   * @param componentInfo Component information
   * @returns HTML documentation content
   */
  private generateHtmlDocs(componentInfo: ComponentInfo): string {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${componentInfo.name} Documentation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
    }
    code {
      font-family: Consolas, Monaco, 'Andale Mono', monospace;
      background-color: #f5f5f5;
      padding: 2px 4px;
      border-radius: 3px;
    }
    pre {
      background-color: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
    }
    .required {
      color: #e53935;
      font-weight: bold;
    }
    .component-hierarchy {
      margin: 1em 0;
    }
    .component-hierarchy ul {
      list-style-type: none;
      padding-left: 1em;
    }
  </style>
</head>
<body>
  <h1>${componentInfo.name}</h1>
  
  ${componentInfo.description ? `<p>${componentInfo.description}</p>` : ''}`;

    // Add component hierarchy if enabled
    if (this.options.includeHierarchy && (componentInfo.parent || componentInfo.children.length > 0)) {
      html += `
  <h2>Component Hierarchy</h2>
  <div class="component-hierarchy">`;
      
      if (componentInfo.parent) {
        html += `
    <p><strong>Parent Component:</strong> <code>${componentInfo.parent}</code></p>`;
      }
      
      if (componentInfo.children.length > 0) {
        html += `
    <p><strong>Child Components:</strong> ${componentInfo.children.map(c => `<code>${c}</code>`).join(', ')}</p>`;
      }
      
      html += `
  </div>`;
    }

    // Add props table if enabled
    if (this.options.includeProps && componentInfo.props.length > 0) {
      html += `
  <h2>Props</h2>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Required</th>
        <th>Default</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>`;
      
      for (const prop of componentInfo.props) {
        const defaultValue = prop.defaultValue !== undefined ? 
          `<code>${JSON.stringify(prop.defaultValue)}</code>` : '';
        
        html += `
      <tr>
        <td><code>${prop.name}</code></td>
        <td><code>${prop.type}</code></td>
        <td>${prop.required ? '<span class="required">Yes</span>' : 'No'}</td>
        <td>${defaultValue}</td>
        <td>${prop.description || ''}</td>
      </tr>`;
      }
      
      html += `
    </tbody>
  </table>`;
    }

    // Add TypeScript interface if enabled
    if (this.options.includeInterfaces && componentInfo.props.length > 0) {
      html += `
  <h2>TypeScript Interface</h2>
  <pre><code>interface ${componentInfo.name}Props {
${componentInfo.props.map(prop => `  ${prop.name}${prop.required ? '' : '?'}: ${prop.type};`).join('\n')}
}</code></pre>`;
    }

    // Add usage examples if enabled
    if (this.options.includeExamples) {
      html += `
  <h2>Usage Examples</h2>`;
      
      if (componentInfo.examples.length > 0) {
        // Use extracted examples
        for (const example of componentInfo.examples) {
          html += `
  <h3>${example.title}</h3>
  ${example.description ? `<p>${example.description}</p>` : ''}
  <pre><code>${this.escapeHtml(example.code)}</code></pre>`;
        }
      } else {
        // Generate a basic example
        const exampleCode = this.generateBasicExample(componentInfo);
        html += `
  <h3>Basic Example</h3>
  <pre><code>${this.escapeHtml(exampleCode)}</code></pre>`;
      }
    }

    // Add accessibility information if enabled
    if (this.options.includeAccessibility) {
      html += `
  <h2>Accessibility</h2>
  <p>${componentInfo.tags['a11y'] || 'This component implements standard accessibility features. Please ensure that you provide appropriate ARIA attributes when necessary.'}</p>`;
    }
    
    html += `
</body>
</html>`;

    return html;
  }
  
  /**
   * Generate a basic example for the component
   * 
   * @param componentInfo Component information
   * @returns Example code
   */
  private generateBasicExample(componentInfo: ComponentInfo): string {
    let example = `import React from 'react';
import ${componentInfo.name} from './${componentInfo.name}';

function Example() {
  return (
    <${componentInfo.name}`;
        
    // Add required props
    const requiredProps = componentInfo.props.filter(p => p.required);
    if (requiredProps.length > 0) {
      example += `\n`;
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
        
        example += `      ${prop.name}=${value}\n`;
      }
      example += `    `;
    }
        
    example += ` />
  );
}

export default Example;`;
    
    return example;
  }
  
  /**
   * Generate the output file path for documentation
   * 
   * @param componentPath Component file path
   * @param componentName Component name
   * @returns Documentation file path
   */
  private generateOutputPath(componentPath: string, componentName: string): string {
    // Get directory containing the component
    const dir = path.dirname(componentPath);
    
    // Generate filename based on format
    let extension;
    switch (this.options.format) {
      case DocumentationFormat.MARKDOWN:
        extension = '.md';
        break;
      case DocumentationFormat.JSDOC:
        // For JSDoc, we return the component path itself
        return componentPath;
      case DocumentationFormat.STORYBOOK:
        extension = '.stories.tsx';
        break;
      case DocumentationFormat.DOCUSAURUS:
        extension = '.mdx';
        break;
      case DocumentationFormat.HTML:
        extension = '.html';
        break;
    }
    
    // Create full path
    const outputDir = path.join(dir, this.options.outputDir);
    const outputFile = `${componentName}${extension}`;
    
    return path.join(outputDir, outputFile);
  }
  
  /**
   * Apply template to component information
   * 
   * @param template Template string
   * @param componentInfo Component information
   * @returns Filled template
   */
  private applyTemplate(template: string, componentInfo: ComponentInfo): string {
    return template
      .replace(/\{\{name\}\}/g, componentInfo.name)
      .replace(/\{\{description\}\}/g, componentInfo.description)
      .replace(/\{\{props\}\}/g, this.generatePropsTable(componentInfo.props))
      .replace(/\{\{examples\}\}/g, this.generateExamplesMarkdown(componentInfo.examples))
      .replace(/\{\{interface\}\}/g, this.generateTypeScriptInterface(componentInfo))
      .replace(/\{\{hierarchy\}\}/g, this.generateHierarchyText(componentInfo))
      .replace(/\{\{accessibility\}\}/g, componentInfo.tags['a11y'] || '');
  }
  
  /**
   * Generate props table in Markdown format
   * 
   * @param props Component props
   * @returns Markdown props table
   */
  private generatePropsTable(props: InferredProp[]): string {
    if (props.length === 0) {
      return 'This component has no props.';
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
   * Generate examples in Markdown format
   * 
   * @param examples Usage examples
   * @returns Markdown examples
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
   * Generate TypeScript interface for a component
   * 
   * @param componentInfo Component information
   * @returns TypeScript interface code
   */
  private generateTypeScriptInterface(componentInfo: ComponentInfo): string {
    if (componentInfo.props.length === 0) {
      return 'This component has no props.';
    }
    
    let interfaceCode = "```typescript\n";
    interfaceCode += `interface ${componentInfo.name}Props {\n`;
    
    for (const prop of componentInfo.props) {
      if (prop.description) {
        interfaceCode += `  /** ${prop.description} */\n`;
      }
      interfaceCode += `  ${prop.name}${prop.required ? '' : '?'}: ${prop.type};\n`;
    }
    
    interfaceCode += `}\n`;
    interfaceCode += "```";
    
    return interfaceCode;
  }
  
  /**
   * Generate component hierarchy description
   * 
   * @param componentInfo Component information
   * @returns Component hierarchy text
   */
  private generateHierarchyText(componentInfo: ComponentInfo): string {
    if (!componentInfo.parent && componentInfo.children.length === 0) {
      return 'This component has no parent or child components.';
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
  
  /**
   * Escape HTML special characters
   * 
   * @param html HTML string to escape
   * @returns Escaped HTML
   */
  private escapeHtml(html: string): string {
    return html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

export default DocumentationGenerator;
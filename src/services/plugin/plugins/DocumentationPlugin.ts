import { Plugin, PluginHooks, PluginContext, ModifiableComponent, CodeChangeResult } from '../../../utils/types';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Configuration options for the documentation plugin
 */
export interface DocumentationPluginOptions {
  /** Whether to automatically generate JSDoc/TSDoc comments */
  generateJsDocs?: boolean;
  /** Whether to create/update README.md files for component directories */
  generateReadmes?: boolean;
  /** Whether to create usage examples */
  generateExamples?: boolean;
  /** Directory where documentation files should be saved (relative to project root) */
  docsDirectory?: string;
  /** Level of detail for documentation generation */
  detailLevel?: 'minimal' | 'standard' | 'verbose';
  /** Custom templates for different documentation types */
  templates?: {
    jsDoc?: string;
    readme?: string;
    example?: string;
  };
}

/**
 * Component property information extracted from the code
 */
interface PropInfo {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
}

/**
 * Extracted component metadata for documentation
 */
interface ComponentMetadata {
  name: string;
  description: string;
  props: PropInfo[];
  hookUsage: string[];
  dependencies: string[];
  hasDefaultExport: boolean;
  hasNamedExport: boolean;
  fileName: string;
  path?: string;
  relationships?: {
    parents: string[];
    children: string[];
  };
}

/**
 * Generated documentation content
 */
interface GeneratedDocs {
  jsDoc: string;
  readme: string;
  example: string;
}

/**
 * Plugin that generates and maintains documentation for components
 */
export class DocumentationPlugin implements Plugin {
  id = 'documentation-plugin';
  name = 'Documentation Plugin';
  version = '1.0.0';
  
  private options: DocumentationPluginOptions;
  private componentMetadata: Map<string, ComponentMetadata> = new Map();
  private context: PluginContext | null = null;
  
  /**
   * Plugin hooks implementation
   */
  hooks: PluginHooks = {
    // Extract metadata from components after registration
    afterComponentRegistration: (component: ModifiableComponent): void => {
      if (!component.sourceCode) {
        return;
      }
      
      // Extract metadata from component source code
      const metadata = this.extractComponentMetadata(component);
      this.componentMetadata.set(component.id, metadata);
      
      if (this.options.generateJsDocs) {
        // Schedule JSDoc generation for this component
        this.scheduleDocGeneration(component.id);
      }
      
      console.log(`[DocumentationPlugin] Analyzed component: ${component.name}`);
    },
    
    // Add documentation before code execution as needed
    beforeCodeExecution: (code: string): string => {
      if (!this.options.generateJsDocs) {
        return code;
      }
      
      // Check if the component has documentation already
      if (this.hasJsDocComments(code)) {
        return code;
      }
      
      // Generate JSDoc for the component
      const jsDoc = this.generateBasicJsDoc(code);
      if (jsDoc) {
        return jsDoc + '\n\n' + code;
      }
      
      return code;
    },
    
    // Track changes to components after code execution
    afterCodeExecution: (result: CodeChangeResult): void => {
      if (!result.success || !result.newSourceCode) {
        return;
      }
      
      // Re-extract metadata if code has changed
      if (this.componentMetadata.has(result.componentId)) {
        const component = this.context?.componentRegistry?.getComponent?.(result.componentId) ||
                         this.context?.getComponent?.(result.componentId);
        if (component) {
          const metadata = this.extractComponentMetadata({
            ...component,
            sourceCode: result.newSourceCode
          });
          this.componentMetadata.set(result.componentId, metadata);
          
          // If the JSDoc has been removed, regenerate it
          if (this.options.generateJsDocs && !this.hasJsDocComments(result.newSourceCode)) {
            this.scheduleDocGeneration(result.componentId);
          }
        }
      }
    }
  };
  
  /**
   * Create a new DocumentationPlugin
   * @param options Plugin configuration options
   */
  constructor(options: DocumentationPluginOptions = {}) {
    this.options = {
      generateJsDocs: true,
      generateReadmes: true,
      generateExamples: true,
      docsDirectory: './docs/components',
      detailLevel: 'standard',
      templates: {},
      ...options
    };
  }
  
  /**
   * Initialize the plugin with context
   * @param context The plugin context
   */
  async initialize(context: PluginContext): Promise<void> {
    console.log('[DocumentationPlugin] Initializing...');
    this.context = context;
    
    // Create docs directory if it doesn't exist
    try {
      await fs.mkdir(this.options.docsDirectory!, { recursive: true });
    } catch (error) {
      console.error(`[DocumentationPlugin] Error creating docs directory: ${error}`);
    }
    
    // Set up initial documentation for existing components
    const components = context.componentRegistry?.getAllComponents() || context.getAllComponents();
    Object.entries(components).forEach(([id, comp]) => {
      // Type guard to check if the component has the expected structure
      if (comp && 
          typeof comp === 'object' && 
          'id' in comp && 
          'name' in comp && 
          'sourceCode' in comp) {
        
        const modifiableComponent = comp as ModifiableComponent;
        if (modifiableComponent.sourceCode) {
          const metadata = this.extractComponentMetadata(modifiableComponent);
          this.componentMetadata.set(id, metadata);
        }
      }
    });
    
    console.log('[DocumentationPlugin] Initialized successfully');
  }
  
  /**
   * Clean up plugin resources
   */
  async destroy(): Promise<void> {
    console.log('[DocumentationPlugin] Cleaning up...');
    this.context = null;
    console.log('[DocumentationPlugin] Clean up complete');
  }
  
  /**
   * Extract metadata from a component's source code
   * @param component The component to analyze
   * @returns Extracted component metadata
   */
  private extractComponentMetadata(component: ModifiableComponent): ComponentMetadata {
    const sourceCode = component.sourceCode || '';
    
    // Extract basic component information
    const metadata: ComponentMetadata = {
      name: component.name,
      description: this.extractDescription(sourceCode),
      props: this.extractProps(sourceCode),
      hookUsage: this.extractHooks(sourceCode),
      dependencies: this.extractDependencies(sourceCode),
      hasDefaultExport: sourceCode.includes('export default'),
      hasNamedExport: sourceCode.includes(`export const ${component.name}`),
      fileName: component.path ? component.path[component.path.length - 1] : `${component.name}.tsx`,
      path: component.path?.join('/'),
      relationships: {
        parents: [],
        children: []
      }
    };
    
    // Add relationship info if available
    if (component.relationships) {
      if (component.relationships.parentId) {
        metadata.relationships!.parents = [component.relationships.parentId];
      }
      if (component.relationships.childrenIds) {
        metadata.relationships!.children = component.relationships.childrenIds;
      }
    }
    
    return metadata;
  }
  
  /**
   * Extract component description from code or comments
   * @param sourceCode Component source code
   * @returns Description for the component
   */
  private extractDescription(sourceCode: string): string {
    // Try to extract from existing JSDoc comment
    const jsDocMatch = sourceCode.match(/\/\*\*\s*([\s\S]*?)\s*\*\//);
    if (jsDocMatch) {
      const jsDocContent = jsDocMatch[1];
      const descriptionMatch = jsDocContent.match(/\*\s*([^@\n\r]*(?:\n\r?\s*\*\s*[^@\n\r]*)*)/);
      if (descriptionMatch) {
        return descriptionMatch[1]
          .replace(/\n\r?\s*\*\s*/g, ' ')
          .trim();
      }
    }
    
    // Try to extract from component name and code context
    const name = sourceCode.match(/function\s+(\w+)|const\s+(\w+)\s*=/)?.[1] || 'Component';
    
    // Generate a basic description based on name and code patterns
    if (sourceCode.includes('children')) {
      return `${name} component that can contain child elements.`;
    } else if (sourceCode.includes('useState')) {
      return `${name} component with internal state management.`;
    } else if (sourceCode.includes('useEffect')) {
      return `${name} component with side effects.`;
    } else {
      return `${name} component.`;
    }
  }
  
  /**
   * Extract props information from component code
   * @param sourceCode Component source code
   * @returns Array of props information
   */
  private extractProps(sourceCode: string): PropInfo[] {
    const props: PropInfo[] = [];
    
    // Check for TypeScript interface/type definition
    const propsTypeMatch = sourceCode.match(/interface\s+(\w+)Props\s*\{([^}]+)\}|type\s+(\w+)Props\s*=\s*\{([^}]+)\}/);
    if (propsTypeMatch) {
      const propsContent = propsTypeMatch[2] || propsTypeMatch[4];
      const propLines = propsContent.split(';').filter(Boolean);
      
      for (const line of propLines) {
        const propMatch = line.match(/(\w+)(\?)?:\s*([^\/;]+)(?:\/\/\s*(.+))?/);
        if (propMatch) {
          props.push({
            name: propMatch[1],
            type: propMatch[3].trim(),
            required: !propMatch[2], // If there's a ?, it's optional
            description: propMatch[4]?.trim()
          });
        }
      }
    }
    
    // Check for prop destructuring in function parameters
    const destructuringMatch = sourceCode.match(/function\s+\w+\(\{\s*([^}]+)\}\s*(?::\s*\w+Props)?\)/);
    if (destructuringMatch) {
      const destructuredProps = destructuringMatch[1].split(',').map(p => p.trim());
      
      for (const prop of destructuredProps) {
        // Handle default values
        const defaultValueMatch = prop.match(/(\w+)(?:\s*=\s*([^,]+))?/);
        if (defaultValueMatch) {
          const name = defaultValueMatch[1];
          const defaultValue = defaultValueMatch[2];
          
          // Add prop if not already present
          if (!props.find(p => p.name === name)) {
            props.push({
              name,
              type: 'any', // Can't determine type from destructuring alone
              required: !defaultValue,
              defaultValue: defaultValue?.trim()
            });
          } else {
            // Update existing prop with default value
            const existingProp = props.find(p => p.name === name);
            if (existingProp && defaultValue) {
              existingProp.defaultValue = defaultValue.trim();
            }
          }
        }
      }
    }
    
    return props;
  }
  
  /**
   * Extract React hook usage from component code
   * @param sourceCode Component source code
   * @returns Array of hook names used
   */
  private extractHooks(sourceCode: string): string[] {
    const hooks: string[] = [];
    const hooksRegex = /use[A-Z]\w+\(/g;
    let match;
    
    while ((match = hooksRegex.exec(sourceCode)) !== null) {
      const hook = match[0].slice(0, -1); // Remove the trailing (
      if (!hooks.includes(hook)) {
        hooks.push(hook);
      }
    }
    
    return hooks;
  }
  
  /**
   * Extract dependencies from import statements
   * @param sourceCode Component source code
   * @returns Array of dependencies
   */
  private extractDependencies(sourceCode: string): string[] {
    const dependencies: string[] = [];
    const importRegex = /import\s+.+\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(sourceCode)) !== null) {
      dependencies.push(match[1]);
    }
    
    return dependencies;
  }
  
  /**
   * Check if code already has JSDoc comments
   * @param code Component source code
   * @returns Whether the code has JSDoc comments
   */
  private hasJsDocComments(code: string): boolean {
    return /\/\*\*\s*\n\s*\*/.test(code);
  }
  
  /**
   * Generate basic JSDoc comment for a component
   * @param code Component source code
   * @returns Code with added JSDoc comments
   */
  private generateBasicJsDoc(code: string): string {
    // Find the component declaration
    const funcMatch = code.match(/function\s+(\w+)|const\s+(\w+)\s*=/);
    if (!funcMatch) {
      return '';
    }
    
    const componentName = funcMatch[1] || funcMatch[2];
    const metadata = Array.from(this.componentMetadata.values())
      .find(m => m.name === componentName);
      
    if (!metadata) {
      return '';
    }
    
    // Generate JSDoc comment
    let jsDoc = '/**\n';
    jsDoc += ` * ${metadata.description}\n`;
    jsDoc += ' *\n';
    
    // Add props documentation
    if (metadata.props.length > 0) {
      for (const prop of metadata.props) {
        const required = prop.required ? ' (required)' : '';
        const description = prop.description || `The ${prop.name} prop`;
        jsDoc += ` * @param {${prop.type}} props.${prop.name}${required} ${description}\n`;
        if (prop.defaultValue) {
          jsDoc += ` * @default ${prop.defaultValue}\n`;
        }
      }
    }
    
    // Add example usage if available
    if (metadata.props.length > 0) {
      jsDoc += ' *\n';
      jsDoc += ' * @example\n';
      jsDoc += ' * ```jsx\n';
      jsDoc += ` * <${componentName}`;
      
      // Add example props
      for (const prop of metadata.props) {
        if (prop.type === 'string') {
          jsDoc += `\n *   ${prop.name}="example"`;
        } else if (prop.type === 'number') {
          jsDoc += `\n *   ${prop.name}={42}`;
        } else if (prop.type === 'boolean') {
          jsDoc += `\n *   ${prop.name}={true}`;
        } else if (prop.type.includes('[]') || prop.type.includes('Array')) {
          jsDoc += `\n *   ${prop.name}={[]}`;
        } else if (prop.type.includes('{') || prop.type.includes('object')) {
          jsDoc += `\n *   ${prop.name}={{}}`;
        } else if (prop.type.includes('function') || prop.type.includes('=>')) {
          jsDoc += `\n *   ${prop.name}={() => {}}`;
        }
      }
      
      jsDoc += '\n * />\n';
      jsDoc += ' * ```\n';
    }
    
    jsDoc += ' */';
    return jsDoc;
  }
  
  /**
   * Schedule documentation generation for a component
   * @param componentId The ID of the component
   */
  private scheduleDocGeneration(componentId: string): void {
    // In a real implementation, this would queue generation tasks,
    // potentially with debouncing to avoid regenerating too frequently
    setTimeout(() => {
      this.generateComponentDocs(componentId).catch(err => {
        console.error(`[DocumentationPlugin] Error generating docs for ${componentId}:`, err);
      });
    }, 100);
  }
  
  /**
   * Generate comprehensive documentation for a component
   * @param componentId The ID of the component
   */
  private async generateComponentDocs(componentId: string): Promise<void> {
    const metadata = this.componentMetadata.get(componentId);
    if (!metadata) {
      return;
    }
    
    const component = this.context?.componentRegistry?.getComponent?.(componentId) ||
                     this.context?.getComponent?.(componentId);
    if (!component || !component.sourceCode) {
      return;
    }
    
    // Generate docs
    const docs = this.generateDocs(metadata, component.sourceCode);
    
    // Save docs if enabled
    if (this.options.generateReadmes) {
      try {
        // Create component directory in docs
        const componentDir = path.join(this.options.docsDirectory!, metadata.name);
        await fs.mkdir(componentDir, { recursive: true });
        
        // Write README.md
        await fs.writeFile(
          path.join(componentDir, 'README.md'),
          docs.readme,
          'utf8'
        );
        
        // Write example file if enabled
        if (this.options.generateExamples) {
          await fs.writeFile(
            path.join(componentDir, 'example.tsx'),
            docs.example,
            'utf8'
          );
        }
        
        console.log(`[DocumentationPlugin] Generated docs for ${metadata.name}`);
      } catch (error) {
        console.error(`[DocumentationPlugin] Error saving docs:`, error);
      }
    }
    
    // Update component's source code with JSDoc if needed
    if (this.options.generateJsDocs && !this.hasJsDocComments(component.sourceCode)) {
      try {
        const jsDoc = docs.jsDoc;
        const updatedCode = jsDoc + '\n' + component.sourceCode;
        
        // Update the component in the registry - use either direct method or through registry
        if (this.context?.componentRegistry?.updateComponent) {
          this.context.componentRegistry.updateComponent(componentId, {
            sourceCode: updatedCode
          });
        } else if (this.context?.updateComponent) {
          this.context.updateComponent(componentId, {
            sourceCode: updatedCode
          });
        }
        
        console.log(`[DocumentationPlugin] Added JSDoc to ${metadata.name}`);
      } catch (error) {
        console.error(`[DocumentationPlugin] Error updating component:`, error);
      }
    }
  }
  
  /**
   * Generate complete documentation for a component
   * @param metadata Component metadata
   * @param sourceCode Component source code
   * @returns Generated documentation
   */
  private generateDocs(metadata: ComponentMetadata, sourceCode: string): GeneratedDocs {
    // Generate JSDoc
    const jsDoc = this.generateBasicJsDoc(sourceCode);
    
    // Generate README.md
    let readme = `# ${metadata.name}\n\n`;
    readme += `${metadata.description}\n\n`;
    
    // Add usage section
    readme += `## Usage\n\n`;
    readme += `\`\`\`jsx\nimport { ${metadata.name} } from '${metadata.path || '.'}';\n\n`;
    readme += `function MyComponent() {\n  return (\n    <${metadata.name}`;
    
    // Add example props
    for (const prop of metadata.props) {
      if (prop.type === 'string') {
        readme += `\n      ${prop.name}="example"`;
      } else if (prop.type === 'number') {
        readme += `\n      ${prop.name}={42}`;
      } else if (prop.type === 'boolean') {
        readme += `\n      ${prop.name}={true}`;
      } else if (prop.type.includes('[]') || prop.type.includes('Array')) {
        readme += `\n      ${prop.name}={[]}`;
      } else if (prop.type.includes('{') || prop.type.includes('object')) {
        readme += `\n      ${prop.name}={{}}`;
      } else if (prop.type.includes('function') || prop.type.includes('=>')) {
        readme += `\n      ${prop.name}={() => {}}`;
      }
    }
    
    readme += `\n    />\n  );\n}\n\`\`\`\n\n`;
    
    // Add props table
    if (metadata.props.length > 0) {
      readme += `## Props\n\n`;
      readme += `| Name | Type | Required | Default | Description |\n`;
      readme += `|------|------|----------|---------|-------------|\n`;
      
      for (const prop of metadata.props) {
        const required = prop.required ? 'Yes' : 'No';
        const defaultValue = prop.defaultValue || '-';
        const description = prop.description || '-';
        
        readme += `| ${prop.name} | \`${prop.type}\` | ${required} | ${defaultValue} | ${description} |\n`;
      }
      
      readme += `\n`;
    }
    
    // Add hooks section if any are used
    if (metadata.hookUsage.length > 0) {
      readme += `## Hooks\n\n`;
      readme += `This component uses the following hooks:\n\n`;
      
      for (const hook of metadata.hookUsage) {
        readme += `- \`${hook}\`\n`;
      }
      
      readme += `\n`;
    }
    
    // Add dependencies section
    if (metadata.dependencies.length > 0) {
      readme += `## Dependencies\n\n`;
      
      for (const dep of metadata.dependencies) {
        readme += `- \`${dep}\`\n`;
      }
      
      readme += `\n`;
    }
    
    // Generate example file
    let example = `import React from 'react';\n`;
    example += `import { ${metadata.name} } from '${metadata.path || '.'}';\n\n`;
    example += `/**\n * Example usage of the ${metadata.name} component\n */\n`;
    example += `export const Example = () => {\n`;
    
    // Add state for any props that need it
    const stateProps = metadata.props.filter(p => 
      p.type.includes('function') || 
      p.type.includes('=>') || 
      p.type.includes('Handler')
    );
    
    if (stateProps.length > 0) {
      for (const prop of stateProps) {
        const handlerName = prop.name.startsWith('on') 
          ? `handle${prop.name.slice(2)}` 
          : `handle${prop.name.charAt(0).toUpperCase() + prop.name.slice(1)}`;
          
        example += `  const ${handlerName} = () => {\n`;
        example += `    console.log('${prop.name} called');\n`;
        example += `  };\n\n`;
      }
    }
    
    example += `  return (\n`;
    example += `    <div className="example">\n`;
    example += `      <h2>${metadata.name} Example</h2>\n`;
    example += `      <${metadata.name}`;
    
    // Add example props
    for (const prop of metadata.props) {
      if (stateProps.includes(prop)) {
        const handlerName = prop.name.startsWith('on') 
          ? `handle${prop.name.slice(2)}` 
          : `handle${prop.name.charAt(0).toUpperCase() + prop.name.slice(1)}`;
        
        example += `\n        ${prop.name}={${handlerName}}`;
      } else if (prop.type === 'string') {
        example += `\n        ${prop.name}="example"`;
      } else if (prop.type === 'number') {
        example += `\n        ${prop.name}={42}`;
      } else if (prop.type === 'boolean') {
        example += `\n        ${prop.name}={true}`;
      } else if (prop.type.includes('[]') || prop.type.includes('Array')) {
        example += `\n        ${prop.name}={[]}`;
      } else if (prop.type.includes('{') || prop.type.includes('object')) {
        example += `\n        ${prop.name}={{}}`;
      }
    }
    
    example += `\n      />\n`;
    example += `    </div>\n`;
    example += `  );\n`;
    example += `};\n`;
    
    return {
      jsDoc,
      readme,
      example
    };
  }
  
  /**
   * Set documentation generation options
   * @param options New options to apply
   */
  setOptions(options: Partial<DocumentationPluginOptions>): void {
    this.options = {
      ...this.options,
      ...options
    };
  }
  
  /**
   * Manually generate documentation for all components
   */
  async generateAllDocs(): Promise<void> {
    for (const componentId of this.componentMetadata.keys()) {
      await this.generateComponentDocs(componentId);
    }
  }
}
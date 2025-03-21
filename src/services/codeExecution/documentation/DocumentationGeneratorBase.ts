import * as ts from 'typescript';
import {
  IDocumentationGenerator,
  CodeToDocument,
  DocumentationOptions,
  DocumentationContext,
  DocumentationResult,
  DocumentationFormat,
  DocumentationStyle,
  DocumentationScope,
  CodeType
} from './types';

/**
 * Base class for documentation generators
 * Provides common functionality for analyzing code and generating documentation
 */
export abstract class DocumentationGeneratorBase implements IDocumentationGenerator {
  /** Generator name */
  readonly name: string;
  
  /** Code types this generator can handle */
  readonly supportedCodeTypes: CodeType[];
  
  /** Configuration options */
  protected options: Record<string, any> = {};
  
  /** Default documentation options */
  protected defaultOptions: DocumentationOptions = {
    format: DocumentationFormat.MARKDOWN,
    style: DocumentationStyle.STANDARD,
    scope: DocumentationScope.ENTITY,
    includeExamples: true,
    includeTypes: true,
    includeParameters: true,
    includeReturnValues: true,
    includeExceptions: false,
    includeSeeAlso: false,
    includeVersion: false,
    includeAuthor: false,
    includeSince: false,
    includeDeprecated: true
  };
  
  constructor(name: string, supportedCodeTypes: CodeType[]) {
    this.name = name;
    this.supportedCodeTypes = supportedCodeTypes;
  }
  
  /**
   * Generate documentation for the given code
   * This is the main method that clients will call
   */
  generateDocumentation(
    code: CodeToDocument,
    options?: DocumentationOptions,
    context?: DocumentationContext
  ): DocumentationResult {
    // Merge with default options
    const mergedOptions = {
      ...this.defaultOptions,
      ...options
    };
    
    // Ensure code type is set
    const codeType = code.codeType || this.detectCodeType(code);
    code = {
      ...code,
      codeType
    };
    
    // Check if this generator can handle the code
    if (!this.canDocument(code)) {
      throw new Error(`Generator ${this.name} cannot document code of type ${codeType}`);
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
    
    // Create context if not provided
    const fullContext: DocumentationContext = {
      codeType, // Now we're sure codeType is defined
      filePath: code.filePath,
      ...(context || {})
    };
    
    // Generate the documentation using the specific implementation
    const documentation = this.generateDocumentationContent(code, mergedOptions, fullContext);
    
    // Format the documentation according to the specified format
    const formattedDocumentation = this.formatDocumentation(
      documentation,
      mergedOptions.format || DocumentationFormat.MARKDOWN
    );
    
    // Extract section headings
    const sections = this.extractSections(formattedDocumentation);
    
    // Generate warnings if any
    const warnings = this.generateWarnings(code);
    
    // Return the final result
    return {
      documentation: formattedDocumentation,
      format: mergedOptions.format || DocumentationFormat.MARKDOWN,
      style: mergedOptions.style || DocumentationStyle.STANDARD,
      codeType,
      scope: mergedOptions.scope || DocumentationScope.ENTITY,
      sections,
      warnings,
      metadata: this.generateMetadata(code, mergedOptions, fullContext)
    };
  }
  
  /**
   * Check if this generator can document the given code
   */
  canDocument(code: CodeToDocument): boolean {
    // If no specific type is specified, try to detect it
    const codeType = code.codeType || this.detectCodeType(code);
    return this.supportedCodeTypes.includes(codeType);
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
   * Generate documentation content for the given code
   * This method must be implemented by specific generators
   */
  protected abstract generateDocumentationContent(
    code: CodeToDocument,
    options: DocumentationOptions,
    context: DocumentationContext
  ): string;
  
  /**
   * Detect the type of code
   */
  protected detectCodeType(code: CodeToDocument): CodeType {
    // Try to detect from file path
    if (code.filePath) {
      if (code.filePath.endsWith('.tsx') || code.filePath.endsWith('.jsx')) {
        return CodeType.REACT_COMPONENT;
      }
      
      if (code.filePath.endsWith('.css') || code.filePath.endsWith('.scss')) {
        return CodeType.CSS;
      }
      
      if (code.filePath.endsWith('.html')) {
        return CodeType.HTML;
      }
    }
    
    // Try to detect from source code
    const sourceCode = code.sourceCode || '';
    
    // Check for React component patterns
    if (sourceCode.includes('React') && 
        (sourceCode.includes('extends Component') || 
         sourceCode.includes('function') && sourceCode.includes('return') && 
         (sourceCode.includes('JSX') || sourceCode.includes('<div') || sourceCode.includes('<>')))) {
      return CodeType.REACT_COMPONENT;
    }
    
    // Check for class patterns
    if (sourceCode.includes('class ') && sourceCode.includes('{')) {
      return CodeType.CLASS;
    }
    
    // Check for interface patterns
    if (sourceCode.includes('interface ') && sourceCode.includes('{')) {
      return CodeType.INTERFACE;
    }
    
    // Check for type patterns
    if (sourceCode.includes('type ') && (sourceCode.includes('=') || sourceCode.includes('<'))) {
      return CodeType.TYPE;
    }
    
    // Check for enum patterns
    if (sourceCode.includes('enum ') && sourceCode.includes('{')) {
      return CodeType.ENUM;
    }
    
    // Check for HTML patterns
    if (sourceCode.includes('<!DOCTYPE html>') || 
        (sourceCode.includes('<html') && sourceCode.includes('</html>'))) {
      return CodeType.HTML;
    }
    
    // Check for CSS patterns
    if ((sourceCode.includes('{') && sourceCode.includes('}') && sourceCode.includes(':')) && 
        !sourceCode.includes('function') && !sourceCode.includes('class ')) {
      return CodeType.CSS;
    }
    
    // Default to function for any other JavaScript/TypeScript code
    return CodeType.FUNCTION;
  }
  
  /**
   * Parse code into an AST
   */
  protected parseAST(code: string, filePath?: string): ts.SourceFile {
    return ts.createSourceFile(
      filePath || 'temp.ts',
      code,
      ts.ScriptTarget.Latest,
      true
    );
  }
  
  /**
   * Format documentation according to the specified format
   */
  protected formatDocumentation(documentation: string, format: DocumentationFormat): string {
    switch (format) {
      case DocumentationFormat.PLAIN_TEXT:
        return this.formatAsPlainText(documentation);
      case DocumentationFormat.HTML:
        return this.formatAsHTML(documentation);
      case DocumentationFormat.JSDOC:
        return this.formatAsJSDoc(documentation);
      case DocumentationFormat.TSDOC:
        return this.formatAsTSDoc(documentation);
      case DocumentationFormat.MARKDOWN:
      default:
        return this.formatAsMarkdown(documentation);
    }
  }
  
  /**
   * Format documentation as plain text
   */
  protected formatAsPlainText(documentation: string): string {
    // Strip any markdown formatting
    return documentation
      .replace(/#{1,6}\s+/g, '') // Remove headings
      .replace(/\*\*/g, '')      // Remove bold
      .replace(/\*/g, '')        // Remove italic
      .replace(/`/g, '\'')       // Replace code ticks with quotes
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with just text
      .replace(/```[a-z]*\n([\s\S]*?)```/g, '$1'); // Remove code blocks
  }
  
  /**
   * Format documentation as markdown
   */
  protected formatAsMarkdown(documentation: string): string {
    return documentation; // Already in markdown format
  }
  
  /**
   * Format documentation as HTML
   */
  protected formatAsHTML(documentation: string): string {
    // Convert markdown to HTML (simplified version)
    return documentation
      .replace(/#{6}\s+(.*)/g, '<h6>$1</h6>')
      .replace(/#{5}\s+(.*)/g, '<h5>$1</h5>')
      .replace(/#{4}\s+(.*)/g, '<h4>$1</h4>')
      .replace(/#{3}\s+(.*)/g, '<h3>$1</h3>')
      .replace(/#{2}\s+(.*)/g, '<h2>$1</h2>')
      .replace(/#{1}\s+(.*)/g, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/```[a-z]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  }
  
  /**
   * Format documentation as JSDoc
   */
  protected formatAsJSDoc(documentation: string): string {
    // Extract sections and convert to JSDoc format
    const sections = documentation.split(/#{2,3}\s+/).filter(Boolean);
    let jsdoc = '/**\n';
    
    // Add main description
    if (sections.length > 0) {
      const description = sections[0].trim();
      jsdoc += ` * ${description.split('\n').join('\n * ')}\n *\n`;
    }
    
    // Process remaining sections
    for (let i = 1; i < sections.length; i++) {
      const section = sections[i];
      const lines = section.split('\n');
      const title = lines[0].trim();
      const content = lines.slice(1).join('\n').trim();
      
      // Convert section title to JSDoc tag if applicable
      if (title.toLowerCase() === 'parameters' || title.toLowerCase() === 'params') {
        // Extract parameter descriptions
        const paramRegex = /- `([^`]+)`\s*(?:\((.*?)\))?\s*:\s*(.*)/g;
        let match;
        while ((match = paramRegex.exec(content)) !== null) {
          const name = match[1];
          const type = match[2] || '';
          const description = match[3];
          jsdoc += ` * @param {${type}} ${name} ${description}\n`;
        }
      } else if (title.toLowerCase() === 'returns' || title.toLowerCase() === 'return value') {
        // Extract return description
        const returnRegex = /(?:\((.*?)\))?\s*:\s*(.*)/;
        const match = returnRegex.exec(content);
        if (match) {
          const type = match[1] || '';
          const description = match[2];
          jsdoc += ` * @returns {${type}} ${description}\n`;
        } else {
          jsdoc += ` * @returns ${content}\n`;
        }
      } else if (title.toLowerCase() === 'throws' || title.toLowerCase() === 'exceptions') {
        // Extract exception descriptions
        const throwsRegex = /- `([^`]+)`\s*:\s*(.*)/g;
        let match;
        while ((match = throwsRegex.exec(content)) !== null) {
          const type = match[1];
          const description = match[2];
          jsdoc += ` * @throws {${type}} ${description}\n`;
        }
      } else if (title.toLowerCase() === 'example' || title.toLowerCase() === 'examples') {
        // Format examples
        jsdoc += ` * @example\n`;
        const exampleLines = content.split('\n');
        for (const line of exampleLines) {
          jsdoc += ` * ${line}\n`;
        }
      } else if (title.toLowerCase() === 'see also') {
        // Format see also references
        const seeAlsoRegex = /- \[(.*?)\]\((.*?)\)/g;
        let match;
        while ((match = seeAlsoRegex.exec(content)) !== null) {
          const name = match[1];
          const link = match[2];
          jsdoc += ` * @see ${link} ${name}\n`;
        }
      } else {
        // Default section handling
        jsdoc += ` * ${title}\n`;
        jsdoc += ` * ${content.split('\n').join('\n * ')}\n`;
      }
    }
    
    jsdoc += ' */';
    return jsdoc;
  }
  
  /**
   * Format documentation as TSDoc
   */
  protected formatAsTSDoc(documentation: string): string {
    // TSDoc is similar to JSDoc but with some TypeScript-specific tags
    // For simplicity, we'll reuse the JSDoc formatter and then make adjustments
    let tsdoc = this.formatAsJSDoc(documentation);
    
    // Replace JSDoc-specific tags with TSDoc equivalents
    tsdoc = tsdoc
      .replace(/@param {(.*?)} /g, '@param ') // TSDoc doesn't need type annotations in @param
      .replace(/@returns {(.*?)} /g, '@returns '); // Same for @returns
    
    return tsdoc;
  }
  
  /**
   * Extract sections from documentation
   */
  protected extractSections(documentation: string): string[] {
    const sections: string[] = [];
    
    // Extract headings (level 2 and 3)
    const headingRegex = /#{2,3}\s+(.*)/g;
    let match;
    while ((match = headingRegex.exec(documentation)) !== null) {
      sections.push(match[1]);
    }
    
    return sections;
  }
  
  /**
   * Generate warnings about potential issues with the documentation
   */
  protected generateWarnings(code: CodeToDocument): string[] {
    return []; // Default implementation returns no warnings
  }
  
  /**
   * Generate metadata about the documentation
   */
  protected generateMetadata(
    code: CodeToDocument,
    options: DocumentationOptions,
    context: DocumentationContext
  ): Record<string, any> {
    return {
      generator: this.name,
      generatedAt: new Date().toISOString(),
      codeType: code.codeType,
      format: options.format,
      style: options.style,
      filePath: code.filePath
    };
  }
  
  /**
   * Extract information about function parameters from AST
   */
  protected extractParameters(node: ts.FunctionDeclaration | ts.MethodDeclaration | ts.ArrowFunction): any[] {
    const parameters: any[] = [];
    
    if (!node.parameters) {
      return parameters;
    }
    
    for (const param of node.parameters) {
      const paramInfo: any = {
        name: param.name.getText(),
        optional: param.questionToken !== undefined,
        type: param.type ? param.type.getText() : 'any'
      };
      
      // Extract default value if present
      if (param.initializer) {
        paramInfo.defaultValue = param.initializer.getText();
      }
      
      parameters.push(paramInfo);
    }
    
    return parameters;
  }
  
  /**
   * Extract information about a function's return type from AST
   */
  protected extractReturnType(node: ts.FunctionDeclaration | ts.MethodDeclaration | ts.ArrowFunction): string {
    if (node.type) {
      return node.type.getText();
    }
    
    // Try to infer from body for arrow functions
    if (ts.isArrowFunction(node) && node.body && ts.isExpression(node.body)) {
      return 'inferred from body';
    }
    
    return 'any';
  }
  
  /**
   * Extract JSDoc comments from a node
   */
  protected extractJSDocComments(node: ts.Node): any {
    const result: any = {
      description: '',
      params: {},
      returns: '',
      examples: [],
      see: [],
      deprecated: false
    };
    
    // Get JSDoc comment ranges
    const jsDocComments = ts.getJSDocCommentsAndTags(node) as ts.JSDoc[];
    
    if (!jsDocComments || jsDocComments.length === 0) {
      return result;
    }
    
    for (const jsDocComment of jsDocComments) {
      if (ts.isJSDoc(jsDocComment)) {
        // Extract description
        if (jsDocComment.comment) {
          result.description = jsDocComment.comment;
        }
        
        // Extract tags
        if (jsDocComment.tags) {
          for (const tag of jsDocComment.tags) {
            if (ts.isJSDocParameterTag(tag)) {
              const paramName = tag.name?.getText();
              if (paramName) {
                result.params[paramName] = tag.comment || '';
              }
            } else if (ts.isJSDocReturnTag(tag)) {
              result.returns = tag.comment || '';
            } else if (tag.tagName.getText() === 'example') {
              // Check tag name directly since isJSDocExampleTag doesn't exist
              result.examples.push(tag.comment || '');
            } else if (ts.isJSDocSeeTag(tag)) {
              result.see.push(tag.comment || '');
            } else if (ts.isJSDocDeprecatedTag(tag)) {
              result.deprecated = true;
              result.deprecatedReason = tag.comment || '';
            }
          }
        }
      }
    }
    
    return result;
  }
}
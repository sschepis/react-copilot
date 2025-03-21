import * as ts from 'typescript';

/**
 * Documentation format
 */
export enum DocumentationFormat {
  /** Plain text documentation */
  PLAIN_TEXT = 'plain_text',
  /** Markdown formatted documentation */
  MARKDOWN = 'markdown',
  /** HTML formatted documentation */
  HTML = 'html',
  /** JSDoc style documentation */
  JSDOC = 'jsdoc',
  /** TSDoc style documentation */
  TSDOC = 'tsdoc',
  /** Custom documentation format */
  CUSTOM = 'custom'
}

/**
 * Style of documentation
 */
export enum DocumentationStyle {
  /** Brief documentation with essential information only */
  BRIEF = 'brief',
  /** Standard level of detail */
  STANDARD = 'standard',
  /** Detailed documentation with examples */
  DETAILED = 'detailed',
  /** Comprehensive documentation with all available information */
  COMPREHENSIVE = 'comprehensive'
}

/**
 * Type of code to document
 */
export enum CodeType {
  /** React component */
  REACT_COMPONENT = 'react_component',
  /** JavaScript/TypeScript function */
  FUNCTION = 'function',
  /** JavaScript/TypeScript class */
  CLASS = 'class',
  /** JavaScript/TypeScript interface */
  INTERFACE = 'interface',
  /** JavaScript/TypeScript type */
  TYPE = 'type',
  /** JavaScript/TypeScript enum */
  ENUM = 'enum',
  /** JavaScript/TypeScript module */
  MODULE = 'module',
  /** HTML markup */
  HTML = 'html',
  /** CSS/SCSS styles */
  CSS = 'css',
  /** Custom code type */
  CUSTOM = 'custom'
}

/**
 * Scope of documentation
 */
export enum DocumentationScope {
  /** Document a single entity */
  ENTITY = 'entity',
  /** Document a file */
  FILE = 'file',
  /** Document a module */
  MODULE = 'module',
  /** Document an entire project */
  PROJECT = 'project'
}

/**
 * Options for generating documentation
 */
export interface DocumentationOptions {
  /** Format of the documentation */
  format?: DocumentationFormat;
  /** Style of the documentation */
  style?: DocumentationStyle;
  /** Scope of the documentation */
  scope?: DocumentationScope;
  /** Include examples in the documentation */
  includeExamples?: boolean;
  /** Include type information in the documentation */
  includeTypes?: boolean;
  /** Include parameter descriptions in the documentation */
  includeParameters?: boolean;
  /** Include return value descriptions in the documentation */
  includeReturnValues?: boolean;
  /** Include thrown exceptions in the documentation */
  includeExceptions?: boolean;
  /** Include see also references in the documentation */
  includeSeeAlso?: boolean;
  /** Include version information in the documentation */
  includeVersion?: boolean;
  /** Include author information in the documentation */
  includeAuthor?: boolean;
  /** Include since information in the documentation */
  includeSince?: boolean;
  /** Include deprecated information in the documentation */
  includeDeprecated?: boolean;
  /** Set of tags to include in the documentation */
  includeTags?: Set<string>;
  /** Custom options for specific documentation generators */
  customOptions?: Record<string, any>;
}

/**
 * Context for generating documentation
 */
export interface DocumentationContext {
  /** Type of code to document */
  codeType?: CodeType;
  /** Filename or path */
  filePath?: string;
  /** Component or entity name */
  entityName?: string;
  /** Project name */
  projectName?: string;
  /** Project version */
  projectVersion?: string;
  /** Author information */
  author?: string;
  /** Module or package name */
  moduleName?: string;
  /** Repository URL */
  repositoryUrl?: string;
  /** Additional project or entity metadata */
  metadata?: Record<string, any>;
}

/**
 * Code to document
 */
export interface CodeToDocument {
  /** The source code to document */
  sourceCode: string;
  /** The source code AST (if available) */
  ast?: ts.SourceFile;
  /** The file path (if available) */
  filePath?: string;
  /** The type of code */
  codeType?: CodeType;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Result of documentation generation
 */
export interface DocumentationResult {
  /** The generated documentation */
  documentation: string;
  /** Format of the documentation */
  format: DocumentationFormat;
  /** Style of the documentation */
  style: DocumentationStyle;
  /** Type of code that was documented */
  codeType: CodeType;
  /** Scope of the documentation */
  scope: DocumentationScope;
  /** Extracted section headings */
  sections?: string[];
  /** Warnings or issues encountered during generation */
  warnings?: string[];
  /** Additional metadata about the documentation */
  metadata?: Record<string, any>;
}

/**
 * Interface for documentation generators
 */
export interface IDocumentationGenerator {
  /** Generator name */
  readonly name: string;
  
  /** Code types this generator can handle */
  readonly supportedCodeTypes: CodeType[];
  
  /**
   * Generate documentation for the given code
   */
  generateDocumentation(
    code: CodeToDocument, 
    options?: DocumentationOptions, 
    context?: DocumentationContext
  ): DocumentationResult;
  
  /**
   * Check if this generator can document the given code
   */
  canDocument(code: CodeToDocument): boolean;
  
  /**
   * Configure the generator with specific options
   */
  configure(options: Record<string, any>): void;
}

/**
 * Interface for documentation templates
 */
export interface IDocumentationTemplate {
  /** Template name */
  readonly name: string;
  
  /** Documentation format this template produces */
  readonly format: DocumentationFormat;
  
  /**
   * Apply the template to generate documentation
   */
  apply(data: any): string;
  
  /**
   * Check if this template can handle the given data
   */
  canApply(data: any): boolean;
  
  /**
   * Configure the template with specific options
   */
  configure(options: Record<string, any>): void;
}
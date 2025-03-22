import { InferredProp } from '../PropTypeInference';
import * as path from 'path';
import {
  CodeToDocument,
  DocumentationOptions as NewDocumentationOptions,
  DocumentationContext,
  DocumentationFormat,
  CodeType,
  DocumentationStyle
} from './types';
import { DocumentationManager } from './DocumentationManager';
import { defaultDocumentationManager } from './DocumentationManager';

/**
 * Represents the original DocumentationFormat enum for backward compatibility
 */
export enum LegacyDocumentationFormat {
  MARKDOWN = 'markdown',
  JSDOC = 'jsdoc',
  STORYBOOK = 'storybook',
  DOCUSAURUS = 'docusaurus',
  HTML = 'html'
}

/**
 * Original DocumentationOptions interface for backward compatibility
 */
export interface LegacyDocumentationOptions {
  /** Output format */
  format: LegacyDocumentationFormat;
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
 * Original UsageExample interface for backward compatibility
 */
export interface LegacyUsageExample {
  /** Example title */
  title: string;
  /** Example code */
  code: string;
  /** Example description */
  description?: string;
}

/**
 * Original DocumentationResult interface for backward compatibility
 */
export interface LegacyDocumentationResult {
  /** Path to the generated documentation file */
  filePath: string;
  /** Generated documentation content */
  content: string;
  /** Component name */
  componentName: string;
  /** Documentation format */
  format: LegacyDocumentationFormat;
}

/**
 * Adapter class that implements the original DocumentationGenerator API
 * but uses the new refactored implementation internally
 */
export class LegacyDocumentationAdapter {
  private manager: DocumentationManager;
  private options: LegacyDocumentationOptions;
  
  constructor(options: LegacyDocumentationOptions) {
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
    
    this.manager = defaultDocumentationManager;
  }
  
  /**
   * Generate documentation for a component using the new implementation
   */
  generateDocumentation(
    componentPath: string,
    componentCode: string,
    inferredProps?: InferredProp[],
    examples?: LegacyUsageExample[]
  ): LegacyDocumentationResult {
    // Convert to the new format
    const codeToDocument: CodeToDocument = {
      sourceCode: componentCode,
      filePath: componentPath,
      codeType: CodeType.REACT_COMPONENT
    };
    
    // Convert options
    const newOptions: NewDocumentationOptions = this.convertOptions(this.options);
    
    // Create context with additional metadata
    const context: DocumentationContext = {
      codeType: CodeType.REACT_COMPONENT,
      filePath: componentPath,
      metadata: {
        props: inferredProps || [],
        examples: examples || []
      }
    };
    
    // Generate documentation using the new system
    const result = this.manager.generateDocumentation(codeToDocument, newOptions, context);
    
    // Convert back to the original format
    return {
      filePath: this.generateOutputPath(componentPath, result.metadata?.componentName as string || ''),
      content: result.documentation,
      componentName: result.metadata?.componentName as string || '',
      format: this.convertFormatBack(result.format)
    };
  }
  
  /**
   * Convert legacy options to new format
   */
  private convertOptions(legacyOptions: LegacyDocumentationOptions): NewDocumentationOptions {
    const format = this.convertFormat(legacyOptions.format);
    
    return {
      format,
      style: DocumentationStyle.STANDARD,
      includeExamples: legacyOptions.includeExamples,
      includeParameters: legacyOptions.includeProps,
      includeTypes: legacyOptions.includeInterfaces,
      includeSeeAlso: legacyOptions.includeHierarchy,
      customOptions: {
        includeAccessibility: legacyOptions.includeAccessibility,
        template: legacyOptions.template,
        outputDir: legacyOptions.outputDir
      }
    };
  }
  
  /**
   * Convert legacy format to new format
   */
  private convertFormat(legacyFormat: LegacyDocumentationFormat): DocumentationFormat {
    switch (legacyFormat) {
      case LegacyDocumentationFormat.MARKDOWN:
        return DocumentationFormat.MARKDOWN;
      case LegacyDocumentationFormat.JSDOC:
        return DocumentationFormat.JSDOC;
      case LegacyDocumentationFormat.HTML:
        return DocumentationFormat.HTML;
      case LegacyDocumentationFormat.STORYBOOK:
      case LegacyDocumentationFormat.DOCUSAURUS:
        // Map these to custom
        return DocumentationFormat.CUSTOM;
      default:
        return DocumentationFormat.MARKDOWN;
    }
  }
  
  /**
   * Convert new format back to legacy format
   */
  private convertFormatBack(format: DocumentationFormat): LegacyDocumentationFormat {
    switch (format) {
      case DocumentationFormat.MARKDOWN:
        return LegacyDocumentationFormat.MARKDOWN;
      case DocumentationFormat.JSDOC:
        return LegacyDocumentationFormat.JSDOC;
      case DocumentationFormat.HTML:
        return LegacyDocumentationFormat.HTML;
      case DocumentationFormat.CUSTOM:
        // Determine which custom format based on the original options
        if (this.options.format === LegacyDocumentationFormat.STORYBOOK) {
          return LegacyDocumentationFormat.STORYBOOK;
        } else if (this.options.format === LegacyDocumentationFormat.DOCUSAURUS) {
          return LegacyDocumentationFormat.DOCUSAURUS;
        }
        return LegacyDocumentationFormat.MARKDOWN;
      default:
        return LegacyDocumentationFormat.MARKDOWN;
    }
  }
  
  /**
   * Generate output file path (maintain compatibility with original implementation)
   */
  private generateOutputPath(componentPath: string, componentName: string): string {
    const dir = path.join(path.dirname(componentPath), this.options.outputDir || './docs');
    let filename = '';
    
    switch (this.options.format) {
      case LegacyDocumentationFormat.MARKDOWN:
        filename = `${componentName}.md`;
        break;
      case LegacyDocumentationFormat.JSDOC:
        filename = `${componentName}.js`;
        break;
      case LegacyDocumentationFormat.HTML:
        filename = `${componentName}.html`;
        break;
      case LegacyDocumentationFormat.STORYBOOK:
        filename = `${componentName}.stories.tsx`;
        break;
      case LegacyDocumentationFormat.DOCUSAURUS:
        filename = `${componentName}.mdx`;
        break;
      default:
        filename = `${componentName}.md`;
    }
    
    return path.join(dir, filename);
  }
}
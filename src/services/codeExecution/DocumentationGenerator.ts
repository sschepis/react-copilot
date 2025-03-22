import * as ts from 'typescript';
import { InferredProp } from './PropTypeInference';
import * as path from 'path';
import {
  LegacyDocumentationAdapter,
  LegacyDocumentationFormat as DocumentationFormat,
  LegacyDocumentationOptions as DocumentationOptions,
  LegacyDocumentationResult as DocumentationResult,
  LegacyUsageExample as UsageExample
} from './documentation/LegacyDocumentationAdapter';

// Re-export the types for backward compatibility
export { DocumentationFormat, DocumentationOptions, DocumentationResult, UsageExample };

/**
 * Component information extracted from code (internal interface)
 * @private
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
 * @deprecated Use the new DocumentationManager from './documentation' instead
 */
export class DocumentationGenerator {
  private adapter: LegacyDocumentationAdapter;
  
  constructor(options: DocumentationOptions) {
    this.adapter = new LegacyDocumentationAdapter(options);
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
    return this.adapter.generateDocumentation(
      componentPath,
      componentCode,
      inferredProps,
      examples
    );
  }
}
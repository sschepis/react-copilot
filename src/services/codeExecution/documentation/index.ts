/**
 * Documentation Generation Module
 * 
 * A modular system for generating documentation for different types of code
 * with various output formats and levels of detail.
 */

// Export types for external use
export * from './types';

// Export base functionality
export * from './DocumentationGeneratorBase';
export * from './DocumentationGeneratorFactory';
export * from './DocumentationManager';

// Export concrete generators
export * from './generators/ReactComponentGenerator';

// Additional generators will be exported here as they are implemented
// export * from './generators/FunctionGenerator';
// export * from './generators/ClassGenerator';
// export * from './generators/InterfaceGenerator';

/**
 * Main functionality for generating documentation
 */
import { DocumentationManager, defaultDocumentationManager } from './DocumentationManager';
import { CodeToDocument, DocumentationOptions, DocumentationResult, DocumentationContext } from './types';

// Export the default manager instance
export const documentationManager = defaultDocumentationManager;

/**
 * Generate documentation for a single code item
 * 
 * @param code The code to document
 * @param options Options for the documentation
 * @param context Additional context for the documentation
 * @returns The documentation result
 */
export function generateDocumentation(
  code: CodeToDocument,
  options?: DocumentationOptions,
  context?: DocumentationContext
): DocumentationResult {
  return documentationManager.generateDocumentation(code, options, context);
}

/**
 * Generate documentation for multiple code items
 * 
 * @param codeItems The code items to document
 * @param options Options for the documentation
 * @param context Additional context for the documentation
 * @returns Array of documentation results
 */
export function generateMultipleDocumentations(
  codeItems: CodeToDocument[],
  options?: DocumentationOptions,
  context?: DocumentationContext
): DocumentationResult[] {
  return documentationManager.generateMultipleDocumentations(codeItems, options, context);
}

/**
 * Generate a consolidated documentation for multiple code items
 * 
 * @param codeItems The code items to document
 * @param options Options for the documentation
 * @param context Additional context for the documentation
 * @returns A consolidated documentation result
 */
export function generateConsolidatedDocumentation(
  codeItems: CodeToDocument[],
  options?: DocumentationOptions,
  context?: DocumentationContext
): DocumentationResult {
  return documentationManager.generateConsolidatedDocumentation(codeItems, options, context);
}

/**
 * Set default options for all documentation generation
 * 
 * @param options Default options to use
 */
export function setDefaultOptions(options: Partial<DocumentationOptions>): void {
  documentationManager.setDefaultOptions(options);
}

/**
 * Register a custom generator with the default manager
 * 
 * @param generator The generator to register
 */
export function registerGenerator(generator: any): void {
  documentationManager.registerGenerator(generator);
}
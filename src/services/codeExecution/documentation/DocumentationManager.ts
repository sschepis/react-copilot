import {
  CodeToDocument,
  DocumentationOptions,
  DocumentationResult,
  IDocumentationGenerator,
  CodeType,
  DocumentationContext,
  DocumentationFormat,
  DocumentationStyle,
  DocumentationScope
} from './types';
import { DocumentationGeneratorFactory } from './DocumentationGeneratorFactory';

/**
 * Manager for coordinating documentation generation
 * Provides a high-level API for generating documentation
 */
export class DocumentationManager {
  private generators: Map<string, IDocumentationGenerator> = new Map();
  private defaultOptions: Partial<DocumentationOptions> = {};
  
  /**
   * Create a new manager with default generators
   */
  constructor() {
    // Register default generators from the factory
    DocumentationGeneratorFactory.getAllGenerators().forEach(generator => {
      this.registerGenerator(generator);
    });
  }
  
  /**
   * Register a generator with this manager
   */
  registerGenerator(generator: IDocumentationGenerator): void {
    this.generators.set(generator.name, generator);
  }
  
  /**
   * Unregister a generator by name
   */
  unregisterGenerator(name: string): boolean {
    return this.generators.delete(name);
  }
  
  /**
   * Set default options for all documentation generation
   */
  setDefaultOptions(options: Partial<DocumentationOptions>): void {
    this.defaultOptions = {
      ...this.defaultOptions,
      ...options
    };
  }
  
  /**
   * Get a generator for a specific code item
   */
  getGeneratorForCode(code: CodeToDocument): IDocumentationGenerator {
    // Try to find a generator from our local registry first
    for (const generator of this.generators.values()) {
      if (generator.canDocument(code)) {
        return generator;
      }
    }
    
    // Fall back to the factory
    return DocumentationGeneratorFactory.getGenerator(code);
  }
  
  /**
   * Generate documentation for code
   */
  generateDocumentation(
    code: CodeToDocument,
    options?: DocumentationOptions,
    context?: DocumentationContext
  ): DocumentationResult {
    // Merge options with defaults
    const mergedOptions = {
      ...this.defaultOptions,
      ...options
    };
    
    // Get the appropriate generator
    const generator = this.getGeneratorForCode(code);
    
    // Generate and return the documentation
    return generator.generateDocumentation(code, mergedOptions, context);
  }
  
  /**
   * Generate documentation for multiple code items
   */
  generateMultipleDocumentations(
    codeItems: CodeToDocument[],
    options?: DocumentationOptions,
    context?: DocumentationContext
  ): DocumentationResult[] {
    return codeItems.map(code => this.generateDocumentation(code, options, context));
  }
  
  /**
   * Generate a consolidated documentation for multiple code items
   */
  generateConsolidatedDocumentation(
    codeItems: CodeToDocument[],
    options?: DocumentationOptions,
    context?: DocumentationContext
  ): DocumentationResult {
    // Check if there are any code items to document
    if (codeItems.length === 0) {
      throw new Error('No code items to document');
    }
    
    // Merge options with defaults
    const mergedOptions = {
      ...this.defaultOptions,
      ...options
    };
    
    // If there's only one code item, just document it
    if (codeItems.length === 1) {
      return this.generateDocumentation(codeItems[0], mergedOptions, context);
    }
    
    // Generate individual documentations
    const individualDocumentations = this.generateMultipleDocumentations(codeItems, mergedOptions, context);
    
    // Categorize the code items
    const categorizedCode = this.categorizeCode(codeItems);
    
    // Generate a consolidated documentation
    const consolidated = this.consolidateDocumentation(
      individualDocumentations,
      categorizedCode,
      mergedOptions,
      context
    );
    
    return consolidated;
  }
  
  /**
   * Categorize code items by type
   */
  private categorizeCode(codeItems: CodeToDocument[]): Record<CodeType, CodeToDocument[]> {
    const categorized: Partial<Record<CodeType, CodeToDocument[]>> = {};
    
    // Initialize with empty arrays for each code type
    Object.values(CodeType).forEach(type => {
      categorized[type] = [];
    });
    
    // Categorize each code item
    codeItems.forEach(code => {
      const type = code.codeType || this.detectCodeType(code);
      categorized[type]!.push(code);
    });
    
    return categorized as Record<CodeType, CodeToDocument[]>;
  }
  
  /**
   * Detect the type of code
   */
  private detectCodeType(code: CodeToDocument): CodeType {
    // If we have a generator for this code, use its detection
    const generator = this.getGeneratorForCode(code);
    
    // Check if the code now has a type (may have been detected by the generator)
    if (code.codeType) {
      return code.codeType;
    }
    
    // Default to function if we couldn't detect the type
    return CodeType.FUNCTION;
  }
  
  /**
   * Consolidate multiple documentations into one
   */
  private consolidateDocumentation(
    documentations: DocumentationResult[],
    categorizedCode: Record<CodeType, CodeToDocument[]>,
    options: DocumentationOptions,
    context?: DocumentationContext
  ): DocumentationResult {
    // Create a consolidated documentation
    let consolidatedDoc = '# API Documentation\n\n';
    
    // Add a summary of all code items
    consolidatedDoc += '## Overview\n\n';
    consolidatedDoc += 'This documentation covers:\n\n';
    
    Object.entries(categorizedCode).forEach(([type, codeItems]) => {
      if (codeItems.length > 0) {
        consolidatedDoc += `- **${type}**: ${codeItems.length} items\n`;
      }
    });
    
    // Add a table of contents if there are multiple code types
    const codeTypes = Object.entries(categorizedCode)
      .filter(([_, codeItems]) => codeItems.length > 0)
      .map(([type, _]) => type);
    
    if (codeTypes.length > 1) {
      consolidatedDoc += '\n## Table of Contents\n\n';
      
      codeTypes.forEach(type => {
        consolidatedDoc += `- [${type}](#${type.toLowerCase()})\n`;
      });
    }
    
    // Add sections for each code type
    codeTypes.forEach(type => {
      consolidatedDoc += `\n## ${type}\n\n`;
      
      // Get all documentation results for this type
      const typeDocumentations = documentations.filter(doc => doc.codeType === type);
      
      // Add each documentation
      typeDocumentations.forEach(doc => {
        // Extract the title from the documentation
        const titleMatch = doc.documentation.match(/^#\s+(.*)/m);
        const title = titleMatch ? titleMatch[1] : 'Untitled';
        
        // Add the documentation without the title (to avoid duplication)
        const docWithoutTitle = doc.documentation.replace(/^#\s+.*\n/, '');
        
        consolidatedDoc += `### ${title}\n\n${docWithoutTitle}\n\n`;
      });
    });
    
    // Collect all warnings
    const allWarnings: string[] = [];
    documentations.forEach(doc => {
      if (doc.warnings && doc.warnings.length > 0) {
        allWarnings.push(...doc.warnings);
      }
    });
    
    // Add a warnings section if there are any
    if (allWarnings.length > 0) {
      consolidatedDoc += '## Warnings\n\n';
      // Deduplicate warnings
      [...new Set(allWarnings)].forEach(warning => {
        consolidatedDoc += `- ${warning}\n`;
      });
    }
    
    // Determine the primary code type
    let primaryCodeType = codeTypes[0] || CodeType.FUNCTION;
    let maxItems = 0;
    
    Object.entries(categorizedCode).forEach(([type, codeItems]) => {
      if (codeItems.length > maxItems) {
        maxItems = codeItems.length;
        primaryCodeType = type as CodeType;
      }
    });
    
    // Return the consolidated documentation
    return {
      documentation: consolidatedDoc,
      format: options.format || DocumentationFormat.MARKDOWN,
      style: options.style || DocumentationStyle.STANDARD,
      codeType: primaryCodeType as CodeType,
      scope: DocumentationScope.MODULE,
      sections: this.extractSections(consolidatedDoc),
      warnings: [...new Set(allWarnings)],
      metadata: {
        consolidatedFrom: documentations.length,
        codeTypes: codeTypes
      }
    };
  }
  
  /**
   * Extract sections from documentation
   */
  private extractSections(documentation: string): string[] {
    const sections: string[] = [];
    
    // Extract all headings
    const headingRegex = /^#{2,3}\s+(.*)/gm;
    let match;
    while ((match = headingRegex.exec(documentation)) !== null) {
      sections.push(match[1]);
    }
    
    return sections;
  }
  
  /**
   * Get all registered generators
   */
  getAllGenerators(): IDocumentationGenerator[] {
    return Array.from(this.generators.values());
  }
}

/**
 * Default documentation manager instance
 */
export const defaultDocumentationManager = new DocumentationManager();
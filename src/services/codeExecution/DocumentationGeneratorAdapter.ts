/**
 * Adapter for maintaining compatibility with the original DocumentationGenerator API
 * This allows existing code to continue working while transitioning to the new architecture
 */

import {
  CodeToDocument,
  DocumentationOptions,
  DocumentationResult,
  DocumentationFormat,
  DocumentationStyle,
  DocumentationScope,
  CodeType,
  generateDocumentation,
  generateMultipleDocumentations,
  generateConsolidatedDocumentation,
  setDefaultOptions
} from './documentation';

/**
 * @deprecated Use the modular documentation system from the 'documentation' directory instead
 */
export class DocumentationGenerator {
  /**
   * Generate documentation for code
   * 
   * @deprecated Use generateDocumentation from the documentation module instead
   */
  static generateDocumentation(
    code: string,
    options: any = {}
  ): string {
    console.warn(
      'DocumentationGenerator.generateDocumentation is deprecated. ' + 
      'Use generateDocumentation from the documentation module instead.'
    );
    
    // Convert to the new format
    const codeToDocument: CodeToDocument = {
      sourceCode: code,
      filePath: options.filePath,
      codeType: this.convertCodeType(options.codeType),
      metadata: options
    };
    
    // Convert options to the new format
    const newOptions: DocumentationOptions = this.convertOptions(options);
    
    // Create context from options
    const context = {
      entityName: options.entityName,
      projectName: options.projectName,
      projectVersion: options.projectVersion,
      author: options.author,
      moduleName: options.moduleName,
      repositoryUrl: options.repositoryUrl,
      metadata: options.metadata
    };
    
    // Use the new system to generate documentation
    const result = generateDocumentation(codeToDocument, newOptions, context);
    
    // Return the documentation string
    return result.documentation;
  }
  
  /**
   * Generate documentation for multiple code items
   * 
   * @deprecated Use generateMultipleDocumentations from the documentation module instead
   */
  static generateMultipleDocumentations(
    codeItems: { source: string, options?: any }[]
  ): string[] {
    console.warn(
      'DocumentationGenerator.generateMultipleDocumentations is deprecated. ' + 
      'Use generateMultipleDocumentations from the documentation module instead.'
    );
    
    // Convert to the new format
    const itemsToDocument: CodeToDocument[] = codeItems.map(item => ({
      sourceCode: item.source,
      filePath: item.options?.filePath,
      codeType: this.convertCodeType(item.options?.codeType),
      metadata: item.options
    }));
    
    // Use the new system to generate documentation
    const results = generateMultipleDocumentations(itemsToDocument);
    
    // Return just the documentation strings
    return results.map(result => result.documentation);
  }
  
  /**
   * Generate consolidated documentation for a set of code items
   * 
   * @deprecated Use generateConsolidatedDocumentation from the documentation module instead
   */
  static generateConsolidatedDocumentation(
    codeItems: { source: string, options?: any }[],
    title?: string,
    options?: any
  ): string {
    console.warn(
      'DocumentationGenerator.generateConsolidatedDocumentation is deprecated. ' + 
      'Use generateConsolidatedDocumentation from the documentation module instead.'
    );
    
    // Convert to the new format
    const itemsToDocument: CodeToDocument[] = codeItems.map(item => ({
      sourceCode: item.source,
      filePath: item.options?.filePath,
      codeType: this.convertCodeType(item.options?.codeType),
      metadata: item.options
    }));
    
    // Convert options to the new format
    const newOptions: DocumentationOptions = this.convertOptions(options || {});
    
    // Create context from options and title
    const context = {
      projectName: title || options?.projectName,
      projectVersion: options?.projectVersion,
      author: options?.author,
      moduleName: options?.moduleName,
      repositoryUrl: options?.repositoryUrl,
      metadata: options?.metadata
    };
    
    // Use the new system to generate consolidated documentation
    const result = generateConsolidatedDocumentation(itemsToDocument, newOptions, context);
    
    // Return the documentation string
    return result.documentation;
  }
  
  /**
   * Generate API documentation for a React component
   * 
   * @deprecated Use generateDocumentation with CodeType.REACT_COMPONENT from the documentation module instead
   */
  static generateComponentDocs(
    componentCode: string,
    options: any = {}
  ): string {
    console.warn(
      'DocumentationGenerator.generateComponentDocs is deprecated. ' + 
      'Use generateDocumentation with CodeType.REACT_COMPONENT from the documentation module instead.'
    );
    
    // Convert to the new format
    const codeToDocument: CodeToDocument = {
      sourceCode: componentCode,
      filePath: options.filePath,
      codeType: CodeType.REACT_COMPONENT,
      metadata: options
    };
    
    // Convert options to the new format
    const newOptions: DocumentationOptions = this.convertOptions(options);
    
    // Create context from options
    const context = {
      entityName: options.componentName || options.entityName,
      projectName: options.projectName,
      projectVersion: options.projectVersion,
      author: options.author,
      moduleName: options.moduleName,
      repositoryUrl: options.repositoryUrl,
      metadata: options.metadata
    };
    
    // Use the new system to generate documentation
    const result = generateDocumentation(codeToDocument, newOptions, context);
    
    // Return the documentation string
    return result.documentation;
  }
  
  /**
   * Generate API documentation for a TypeScript interface or type
   * 
   * @deprecated Use generateDocumentation with CodeType.INTERFACE or CodeType.TYPE from the documentation module instead
   */
  static generateInterfaceDocs(
    interfaceCode: string,
    options: any = {}
  ): string {
    console.warn(
      'DocumentationGenerator.generateInterfaceDocs is deprecated. ' + 
      'Use generateDocumentation with CodeType.INTERFACE from the documentation module instead.'
    );
    
    // Convert to the new format
    const codeToDocument: CodeToDocument = {
      sourceCode: interfaceCode,
      filePath: options.filePath,
      codeType: interfaceCode.includes('interface ') ? CodeType.INTERFACE : CodeType.TYPE,
      metadata: options
    };
    
    // Convert options to the new format
    const newOptions: DocumentationOptions = this.convertOptions(options);
    
    // Create context from options
    const context = {
      entityName: options.interfaceName || options.entityName,
      projectName: options.projectName,
      projectVersion: options.projectVersion,
      author: options.author,
      moduleName: options.moduleName,
      repositoryUrl: options.repositoryUrl,
      metadata: options.metadata
    };
    
    // Use the new system to generate documentation
    const result = generateDocumentation(codeToDocument, newOptions, context);
    
    // Return the documentation string
    return result.documentation;
  }
  
  /**
   * Set default options for documentation generation
   * 
   * @deprecated Use setDefaultOptions from the documentation module instead
   */
  static setDefaultOptions(options: any): void {
    console.warn(
      'DocumentationGenerator.setDefaultOptions is deprecated. ' + 
      'Use setDefaultOptions from the documentation module instead.'
    );
    
    // Convert to the new format
    const newOptions: DocumentationOptions = this.convertOptions(options);
    
    // Use the new system to set default options
    setDefaultOptions(newOptions);
  }
  
  /**
   * Convert from the old options format to the new one
   */
  private static convertOptions(oldOptions: any): DocumentationOptions {
    const newOptions: DocumentationOptions = {};
    
    // Convert format
    if (oldOptions.format) {
      switch (oldOptions.format.toLowerCase()) {
        case 'text':
        case 'plain':
        case 'plaintext':
          newOptions.format = DocumentationFormat.PLAIN_TEXT;
          break;
        case 'markdown':
        case 'md':
          newOptions.format = DocumentationFormat.MARKDOWN;
          break;
        case 'html':
          newOptions.format = DocumentationFormat.HTML;
          break;
        case 'jsdoc':
          newOptions.format = DocumentationFormat.JSDOC;
          break;
        case 'tsdoc':
          newOptions.format = DocumentationFormat.TSDOC;
          break;
        case 'custom':
          newOptions.format = DocumentationFormat.CUSTOM;
          break;
      }
    }
    
    // Convert style/detail level
    if (oldOptions.style || oldOptions.detailLevel) {
      const styleValue = (oldOptions.style || oldOptions.detailLevel || '').toLowerCase();
      switch (styleValue) {
        case 'brief':
        case 'minimal':
          newOptions.style = DocumentationStyle.BRIEF;
          break;
        case 'standard':
        case 'normal':
          newOptions.style = DocumentationStyle.STANDARD;
          break;
        case 'detailed':
        case 'full':
          newOptions.style = DocumentationStyle.DETAILED;
          break;
        case 'comprehensive':
        case 'complete':
        case 'exhaustive':
          newOptions.style = DocumentationStyle.COMPREHENSIVE;
          break;
      }
    }
    
    // Convert scope
    if (oldOptions.scope) {
      switch (oldOptions.scope.toLowerCase()) {
        case 'entity':
        case 'component':
        case 'function':
        case 'interface':
          newOptions.scope = DocumentationScope.ENTITY;
          break;
        case 'file':
          newOptions.scope = DocumentationScope.FILE;
          break;
        case 'module':
        case 'package':
          newOptions.scope = DocumentationScope.MODULE;
          break;
        case 'project':
          newOptions.scope = DocumentationScope.PROJECT;
          break;
      }
    }
    
    // Convert boolean options
    if (oldOptions.includeExamples !== undefined) {
      newOptions.includeExamples = !!oldOptions.includeExamples;
    }
    
    if (oldOptions.includeTypes !== undefined) {
      newOptions.includeTypes = !!oldOptions.includeTypes;
    }
    
    if (oldOptions.includeParams !== undefined || oldOptions.includeParameters !== undefined) {
      newOptions.includeParameters = !!(oldOptions.includeParams || oldOptions.includeParameters);
    }
    
    if (oldOptions.includeReturn !== undefined || oldOptions.includeReturnValue !== undefined) {
      newOptions.includeReturnValues = !!(oldOptions.includeReturn || oldOptions.includeReturnValue);
    }
    
    if (oldOptions.includeExceptions !== undefined || oldOptions.includeThrows !== undefined) {
      newOptions.includeExceptions = !!(oldOptions.includeExceptions || oldOptions.includeThrows);
    }
    
    if (oldOptions.includeSeeAlso !== undefined) {
      newOptions.includeSeeAlso = !!oldOptions.includeSeeAlso;
    }
    
    if (oldOptions.includeVersion !== undefined) {
      newOptions.includeVersion = !!oldOptions.includeVersion;
    }
    
    if (oldOptions.includeAuthor !== undefined) {
      newOptions.includeAuthor = !!oldOptions.includeAuthor;
    }
    
    if (oldOptions.includeSince !== undefined) {
      newOptions.includeSince = !!oldOptions.includeSince;
    }
    
    if (oldOptions.includeDeprecated !== undefined) {
      newOptions.includeDeprecated = !!oldOptions.includeDeprecated;
    }
    
    // Convert tags
    if (oldOptions.includeTags) {
      if (Array.isArray(oldOptions.includeTags)) {
        newOptions.includeTags = new Set(oldOptions.includeTags);
      } else if (typeof oldOptions.includeTags === 'string') {
        newOptions.includeTags = new Set(oldOptions.includeTags.split(',').map((tag: string) => tag.trim()));
      }
    }
    
    // Convert any custom options
    if (oldOptions.customOptions) {
      newOptions.customOptions = { ...oldOptions.customOptions };
    }
    
    return newOptions;
  }
  
  /**
   * Convert from the old code type to the new one
   */
  private static convertCodeType(oldType: string): CodeType | undefined {
    if (!oldType) return undefined;
    
    switch (oldType.toLowerCase()) {
      case 'react':
      case 'reactcomponent':
      case 'react-component':
      case 'component':
        return CodeType.REACT_COMPONENT;
      case 'function':
      case 'method':
        return CodeType.FUNCTION;
      case 'class':
        return CodeType.CLASS;
      case 'interface':
        return CodeType.INTERFACE;
      case 'type':
        return CodeType.TYPE;
      case 'enum':
      case 'enumeration':
        return CodeType.ENUM;
      case 'module':
      case 'namespace':
        return CodeType.MODULE;
      case 'html':
      case 'markup':
        return CodeType.HTML;
      case 'css':
      case 'scss':
      case 'style':
        return CodeType.CSS;
      default:
        return undefined;
    }
  }
}
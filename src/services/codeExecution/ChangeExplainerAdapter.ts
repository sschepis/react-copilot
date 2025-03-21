/**
 * Adapter for maintaining compatibility with the original ChangeExplainer API
 * This allows existing code to continue working while transitioning to the new architecture
 */

import {
  CodeChange,
  ExplanationOptions,
  ExplanationResult,
  ExplanationFormat,
  DetailLevel,
  AudienceType,
  explainChange,
  explainChanges,
  explainChangeSet,
  setDefaultOptions
} from './explainer';

/**
 * @deprecated Use the modular explainer system from the 'explainer' directory instead
 */
export class ChangeExplainer {
  /**
   * Explain a code change
   * 
   * @deprecated Use explainChange from the explainer module instead
   */
  static explainChange(
    originalCode: string,
    modifiedCode: string,
    options: any = {}
  ): string {
    console.warn(
      'ChangeExplainer.explainChange is deprecated. ' + 
      'Use explainChange from the explainer module instead.'
    );
    
    // Convert to the new format
    const change: CodeChange = {
      originalCode,
      modifiedCode,
      componentId: options.componentId,
      filePath: options.filePath,
      metadata: options
    };
    
    // Convert options to the new format
    const newOptions: ExplanationOptions = this.convertOptions(options);
    
    // Use the new system to explain the change
    const result = explainChange(change, newOptions);
    
    // Return the explanation string
    return result.explanation;
  }
  
  /**
   * Explain multiple changes
   * 
   * @deprecated Use explainChanges from the explainer module instead
   */
  static explainChanges(
    changes: { original: string, modified: string }[],
    options: any = {}
  ): string[] {
    console.warn(
      'ChangeExplainer.explainChanges is deprecated. ' + 
      'Use explainChanges from the explainer module instead.'
    );
    
    // Convert to the new format
    const newChanges: CodeChange[] = changes.map(change => ({
      originalCode: change.original,
      modifiedCode: change.modified,
      metadata: options
    }));
    
    // Convert options to the new format
    const newOptions: ExplanationOptions = this.convertOptions(options);
    
    // Use the new system to explain the changes
    const results = explainChanges(newChanges, newOptions);
    
    // Return just the explanation strings
    return results.map(result => result.explanation);
  }
  
  /**
   * Explain a set of changes as a single explanation
   * 
   * @deprecated Use explainChangeSet from the explainer module instead
   */
  static explainChangeSet(
    changes: { original: string, modified: string }[],
    options: any = {}
  ): string {
    console.warn(
      'ChangeExplainer.explainChangeSet is deprecated. ' + 
      'Use explainChangeSet from the explainer module instead.'
    );
    
    // Convert to the new format
    const newChanges: CodeChange[] = changes.map(change => ({
      originalCode: change.original,
      modifiedCode: change.modified,
      metadata: options
    }));
    
    // Convert options to the new format
    const newOptions: ExplanationOptions = this.convertOptions(options);
    
    // Use the new system to explain the change set
    const result = explainChangeSet(newChanges, newOptions);
    
    // Return the explanation string
    return result.explanation;
  }
  
  /**
   * Set default options for explanations
   * 
   * @deprecated Use setDefaultOptions from the explainer module instead
   */
  static setDefaultOptions(options: any): void {
    console.warn(
      'ChangeExplainer.setDefaultOptions is deprecated. ' + 
      'Use setDefaultOptions from the explainer module instead.'
    );
    
    // Convert to the new format
    const newOptions: ExplanationOptions = this.convertOptions(options);
    
    // Use the new system to set default options
    setDefaultOptions(newOptions);
  }
  
  /**
   * Generate a diff explanation
   * 
   * @deprecated Use explainChange from the explainer module instead
   */
  static explainDiff(
    diff: string,
    options: any = {}
  ): string {
    console.warn(
      'ChangeExplainer.explainDiff is deprecated. ' + 
      'Use explainChange from the explainer module instead.'
    );
    
    // Parse the diff to extract original and modified code
    // This is a simplified implementation
    const originalCode: string[] = [];
    const modifiedCode: string[] = [];
    
    const diffLines = diff.split('\n');
    
    for (const line of diffLines) {
      if (line.startsWith('-')) {
        originalCode.push(line.substring(1));
      } else if (line.startsWith('+')) {
        modifiedCode.push(line.substring(1));
      } else {
        originalCode.push(line);
        modifiedCode.push(line);
      }
    }
    
    // Convert to the new format
    const change: CodeChange = {
      originalCode: originalCode.join('\n'),
      modifiedCode: modifiedCode.join('\n'),
      metadata: {
        ...options,
        isDiff: true
      }
    };
    
    // Convert options to the new format
    const newOptions: ExplanationOptions = this.convertOptions(options);
    
    // Use the new system to explain the change
    const result = explainChange(change, newOptions);
    
    // Return the explanation string
    return result.explanation;
  }
  
  /**
   * Convert from the old options format to the new one
   */
  private static convertOptions(oldOptions: any): ExplanationOptions {
    const newOptions: ExplanationOptions = {};
    
    // Convert format
    if (oldOptions.format) {
      switch (oldOptions.format.toLowerCase()) {
        case 'text':
          newOptions.format = ExplanationFormat.PLAIN_TEXT;
          break;
        case 'markdown':
          newOptions.format = ExplanationFormat.MARKDOWN;
          break;
        case 'html':
          newOptions.format = ExplanationFormat.HTML;
          break;
        case 'json':
          newOptions.format = ExplanationFormat.JSON;
          break;
        case 'comment':
          newOptions.format = ExplanationFormat.CODE_COMMENT;
          break;
      }
    }
    
    // Convert detail level
    if (oldOptions.detailLevel) {
      switch (oldOptions.detailLevel.toLowerCase()) {
        case 'brief':
          newOptions.detailLevel = DetailLevel.BRIEF;
          break;
        case 'standard':
          newOptions.detailLevel = DetailLevel.STANDARD;
          break;
        case 'detailed':
          newOptions.detailLevel = DetailLevel.DETAILED;
          break;
        case 'comprehensive':
          newOptions.detailLevel = DetailLevel.COMPREHENSIVE;
          break;
      }
    }
    
    // Convert audience
    if (oldOptions.audience) {
      switch (oldOptions.audience.toLowerCase()) {
        case 'non-technical':
        case 'nontechnical':
          newOptions.audience = AudienceType.NON_TECHNICAL;
          break;
        case 'beginner':
          newOptions.audience = AudienceType.BEGINNER;
          break;
        case 'intermediate':
          newOptions.audience = AudienceType.INTERMEDIATE;
          break;
        case 'expert':
          newOptions.audience = AudienceType.EXPERT;
          break;
      }
    }
    
    // Convert boolean options
    if (oldOptions.includeCodeSnippets !== undefined) {
      newOptions.includeCodeSnippets = !!oldOptions.includeCodeSnippets;
    }
    
    if (oldOptions.includeVisuals !== undefined) {
      newOptions.includeVisuals = !!oldOptions.includeVisuals;
    }
    
    if (oldOptions.includeTechnicalDetails !== undefined) {
      newOptions.includeTechnicalDetails = !!oldOptions.includeTechnicalDetails;
    }
    
    if (oldOptions.includeImpactAssessment !== undefined) {
      newOptions.includeImpactAssessment = !!oldOptions.includeImpactAssessment;
    }
    
    if (oldOptions.includeSuggestions !== undefined) {
      newOptions.includeSuggestions = !!oldOptions.includeSuggestions;
    }
    
    // Convert any custom formatting options
    if (oldOptions.formatting) {
      newOptions.formatting = { ...oldOptions.formatting };
    }
    
    return newOptions;
  }
}
import * as ts from 'typescript';
import { 
  ChangeType, 
  CodeChange, 
  ExplanationOptions, 
  DetailLevel, 
  AudienceType 
} from '../types';
import { ChangeExplainerBase } from '../ChangeExplainerBase';

/**
 * Explainer for code modification changes
 * Specializes in explaining what was modified and why
 */
export class ModificationExplainer extends ChangeExplainerBase {
  constructor() {
    super('ModificationExplainer', [
      ChangeType.MODIFICATION,
      ChangeType.REFACTOR,
      ChangeType.BUG_FIX,
      ChangeType.OPTIMIZATION
    ]);
  }
  
  /**
   * Generate an explanation for a code modification
   */
  protected generateExplanation(change: CodeChange, options: ExplanationOptions): string {
    // Get the original and modified code
    const originalCode = change.originalCode || '';
    const modifiedCode = change.modifiedCode || '';
    
    // Analyze the differences
    const differences = this.analyzeDifferences(originalCode, modifiedCode);
    
    // Build the explanation based on the detail level
    switch (options.detailLevel) {
      case DetailLevel.BRIEF:
        return this.generateBriefExplanation(change, differences);
      case DetailLevel.DETAILED:
        return this.generateDetailedExplanation(change, differences, options);
      case DetailLevel.COMPREHENSIVE:
        return this.generateComprehensiveExplanation(change, differences, options);
      case DetailLevel.STANDARD:
      default:
        return this.generateStandardExplanation(change, differences, options);
    }
  }
  
  /**
   * Analyze the differences between original and modified code
   */
  private analyzeDifferences(originalCode: string, modifiedCode: string): any {
    // Split the code into lines for comparison
    const originalLines = originalCode.split('\n');
    const modifiedLines = modifiedCode.split('\n');
    
    // Collect changes between the two versions
    const added: number[] = [];
    const removed: number[] = [];
    const modified: {original: number, modified: number}[] = [];
    
    // Simple approach to find differences (this would be more sophisticated in a real implementation)
    let i = 0, j = 0;
    
    while (i < originalLines.length || j < modifiedLines.length) {
      if (i >= originalLines.length) {
        // All remaining lines in modified are additions
        added.push(j);
        j++;
        continue;
      }
      
      if (j >= modifiedLines.length) {
        // All remaining lines in original are removals
        removed.push(i);
        i++;
        continue;
      }
      
      if (originalLines[i] === modifiedLines[j]) {
        // Lines are the same, move to next line in both
        i++;
        j++;
        continue;
      }
      
      // Check if this is a modification (lines are similar but not identical)
      if (this.calculateSimilarity(originalLines[i], modifiedLines[j]) > 0.5) {
        modified.push({original: i, modified: j});
        i++;
        j++;
        continue;
      }
      
      // Otherwise, treat as removal from original and addition to modified
      removed.push(i);
      added.push(j);
      i++;
      j++;
    }
    
    // Extract the context for each change
    const addedWithContext = added.map(line => ({
      line,
      content: modifiedLines[line],
      context: this.getContext(modifiedLines, line)
    }));
    
    const removedWithContext = removed.map(line => ({
      line,
      content: originalLines[line],
      context: this.getContext(originalLines, line)
    }));
    
    const modifiedWithContext = modified.map(({original, modified}) => ({
      originalLine: original,
      modifiedLine: modified,
      originalContent: originalLines[original],
      modifiedContent: modifiedLines[modified],
      context: this.getContext(modifiedLines, modified)
    }));
    
    // Try to classify the types of changes
    const changeTypes = this.classifyChanges(
      addedWithContext, 
      removedWithContext, 
      modifiedWithContext,
      originalCode,
      modifiedCode
    );
    
    return {
      added: addedWithContext,
      removed: removedWithContext,
      modified: modifiedWithContext,
      changeTypes
    };
  }
  
  /**
   * Calculate the similarity between two strings (0-1)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;
    
    // Simple Levenshtein distance implementation
    const len1 = str1.length;
    const len2 = str2.length;
    const maxDist = Math.max(len1, len2);
    
    // Use a simplified approach for performance in this example
    let matches = 0;
    const minLength = Math.min(len1, len2);
    
    for (let i = 0; i < minLength; i++) {
      if (str1[i] === str2[i]) matches++;
    }
    
    return matches / maxDist;
  }
  
  /**
   * Get the context around a specific line
   */
  private getContext(lines: string[], lineIndex: number, contextSize: number = 2): string[] {
    const startIndex = Math.max(0, lineIndex - contextSize);
    const endIndex = Math.min(lines.length - 1, lineIndex + contextSize);
    
    return lines.slice(startIndex, endIndex + 1);
  }
  
  /**
   * Classify the types of changes made
   */
  private classifyChanges(
    added: any[], 
    removed: any[], 
    modified: any[],
    originalCode: string,
    modifiedCode: string
  ): string[] {
    const classifications: string[] = [];
    
    // Check for variable/function renames
    if (this.detectRenames(modified)) {
      classifications.push('renames');
    }
    
    // Check for code refactoring
    if (this.detectRefactoring(originalCode, modifiedCode)) {
      classifications.push('refactoring');
    }
    
    // Check for bug fixes
    if (this.detectBugFixes(added, removed, modified)) {
      classifications.push('bug fixes');
    }
    
    // Check for performance optimizations
    if (this.detectOptimizations(originalCode, modifiedCode)) {
      classifications.push('optimizations');
    }
    
    // Check for style changes
    if (this.detectStyleChanges(modified)) {
      classifications.push('style changes');
    }
    
    // Default to "code modifications" if no specific classification
    if (classifications.length === 0) {
      classifications.push('code modifications');
    }
    
    return classifications;
  }
  
  /**
   * Detect if changes include renames
   */
  private detectRenames(modified: any[]): boolean {
    // Look for patterns like changing a variable or function name
    for (const mod of modified) {
      // Simple heuristic - check if the lines are mostly the same but with one word changed
      const words1 = mod.originalContent.match(/\w+/g) || [];
      const words2 = mod.modifiedContent.match(/\w+/g) || [];
      
      if (words1.length === words2.length) {
        let differences = 0;
        for (let i = 0; i < words1.length; i++) {
          if (words1[i] !== words2[i]) differences++;
        }
        
        // If exactly one or two words changed, likely a rename
        if (differences > 0 && differences <= 2) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Detect if changes represent refactoring
   */
  private detectRefactoring(originalCode: string, modifiedCode: string): boolean {
    // Look for patterns like extracting methods, changing structure, etc.
    // Very simplified implementation
    
    // Check if the code has been reorganized but functionality is similar
    const originalFunctionCount = (originalCode.match(/function\s+\w+/g) || []).length;
    const modifiedFunctionCount = (modifiedCode.match(/function\s+\w+/g) || []).length;
    
    // More functions could indicate extract method refactoring
    if (modifiedFunctionCount > originalFunctionCount) {
      return true;
    }
    
    // Check for changes in indentation patterns (suggesting restructuring)
    const originalIndentation = originalCode.match(/^\s+/gm);
    const modifiedIndentation = modifiedCode.match(/^\s+/gm);
    
    if (originalIndentation && modifiedIndentation && 
        originalIndentation.length !== modifiedIndentation.length) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Detect if changes include bug fixes
   */
  private detectBugFixes(added: any[], removed: any[], modified: any[]): boolean {
    // Look for patterns like null checks, try/catch, condition changes
    
    // Check for added null/undefined checks
    for (const add of added) {
      if (add.content.includes('null') || 
          add.content.includes('undefined') || 
          add.content.includes('try') || 
          add.content.includes('catch')) {
        return true;
      }
    }
    
    // Check for modified conditions
    for (const mod of modified) {
      if ((mod.originalContent.includes('if') && mod.modifiedContent.includes('if')) ||
          (mod.originalContent.includes('while') && mod.modifiedContent.includes('while')) ||
          (mod.originalContent.includes('for') && mod.modifiedContent.includes('for'))) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Detect if changes include optimizations
   */
  private detectOptimizations(originalCode: string, modifiedCode: string): boolean {
    // Look for patterns like caching, loop optimizations, etc.
    
    // Check for changes in loops
    const originalLoopCount = (originalCode.match(/for\s*\(/g) || []).length;
    const modifiedLoopCount = (modifiedCode.match(/for\s*\(/g) || []).length;
    
    if (originalLoopCount > modifiedLoopCount) {
      return true; // Reduction in loops could be optimization
    }
    
    // Check for addition of caching variables
    if (modifiedCode.includes('cache') && !originalCode.includes('cache')) {
      return true;
    }
    
    // Check for use of more efficient methods
    if (modifiedCode.includes('map') && originalCode.includes('forEach')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Detect if changes are primarily stylistic
   */
  private detectStyleChanges(modified: any[]): boolean {
    // Look for patterns like whitespace changes, formatting, etc.
    let styleChangesCount = 0;
    
    for (const mod of modified) {
      const orig = mod.originalContent.trim();
      const modified = mod.modifiedContent.trim();
      
      // If the trimmed content is the same, it's just whitespace changes
      if (orig === modified) {
        styleChangesCount++;
      }
    }
    
    // If more than half of the modifications are style changes
    return styleChangesCount > modified.length / 2;
  }
  
  /**
   * Generate a brief explanation of the changes
   */
  private generateBriefExplanation(change: CodeChange, differences: any): string {
    // Create a brief summary of what changed
    const { added, removed, modified, changeTypes } = differences;
    
    const addedCount = added.length;
    const removedCount = removed.length;
    const modifiedCount = modified.length;
    
    let explanation = '## Code Modification Summary\n\n';
    
    explanation += `This change ${changeTypes.join(', ')}.`;
    
    explanation += `\n\n${addedCount} lines added, ${removedCount} lines removed, and ${modifiedCount} lines modified.`;
    
    return explanation;
  }
  
  /**
   * Generate a standard explanation of the changes
   */
  private generateStandardExplanation(change: CodeChange, differences: any, options: ExplanationOptions): string {
    const { added, removed, modified, changeTypes } = differences;
    
    let explanation = '## Code Modification Summary\n\n';
    
    // Describe the overall change
    explanation += `This change involves ${changeTypes.join(', ')}.\n\n`;
    
    // Summarize the changes
    if (added.length > 0) {
      explanation += `### Added Code\n\n`;
      explanation += `${added.length} lines of code were added`;
      
      if (options.includeCodeSnippets && added.length > 0) {
        explanation += `, including:\n\n`;
        const sampleAdd = added[0]; // Show first addition as example
        explanation += '```\n';
        explanation += sampleAdd.context.join('\n');
        explanation += '\n```\n\n';
      } else {
        explanation += '.\n\n';
      }
    }
    
    if (removed.length > 0) {
      explanation += `### Removed Code\n\n`;
      explanation += `${removed.length} lines of code were removed`;
      
      if (options.includeCodeSnippets && removed.length > 0) {
        explanation += `, including:\n\n`;
        const sampleRemove = removed[0]; // Show first removal as example
        explanation += '```\n';
        explanation += sampleRemove.context.join('\n');
        explanation += '\n```\n\n';
      } else {
        explanation += '.\n\n';
      }
    }
    
    if (modified.length > 0) {
      explanation += `### Modified Code\n\n`;
      explanation += `${modified.length} lines of code were modified`;
      
      if (options.includeCodeSnippets && modified.length > 0) {
        explanation += `, for example:\n\n`;
        const sampleMod = modified[0]; // Show first modification as example
        explanation += '**Before:**\n';
        explanation += '```\n';
        explanation += sampleMod.originalContent;
        explanation += '\n```\n\n';
        explanation += '**After:**\n';
        explanation += '```\n';
        explanation += sampleMod.modifiedContent;
        explanation += '\n```\n\n';
      } else {
        explanation += '.\n\n';
      }
    }
    
    // Add purpose of the change
    explanation += `### Purpose\n\n`;
    
    if (changeTypes.includes('bug fixes')) {
      explanation += `This change appears to fix bugs in the code, possibly addressing issues with error handling or logic.\n\n`;
    }
    
    if (changeTypes.includes('optimizations')) {
      explanation += `This change includes optimizations to improve code performance.\n\n`;
    }
    
    if (changeTypes.includes('refactoring')) {
      explanation += `The code has been refactored to improve readability, maintainability, or to follow best practices.\n\n`;
    }
    
    if (changeTypes.includes('renames')) {
      explanation += `Variable or function names have been changed, possibly to improve clarity.\n\n`;
    }
    
    return explanation;
  }
  
  /**
   * Generate a detailed explanation of the changes
   */
  private generateDetailedExplanation(change: CodeChange, differences: any, options: ExplanationOptions): string {
    // Start with the standard explanation
    let explanation = this.generateStandardExplanation(change, differences, options);
    
    // Add more specific analysis
    explanation += `## Detailed Analysis\n\n`;
    
    const { added, removed, modified, changeTypes } = differences;
    
    // Add patterns detected
    explanation += `### Patterns Detected\n\n`;
    
    if (changeTypes.includes('bug fixes')) {
      explanation += `- **Bug Fix Patterns**: The changes include additional checks or corrected conditions\n`;
    }
    
    if (changeTypes.includes('optimizations')) {
      explanation += `- **Optimization Patterns**: The code has been streamlined or restructured for better performance\n`;
    }
    
    if (changeTypes.includes('refactoring')) {
      explanation += `- **Refactoring Patterns**: The code structure has been improved while maintaining functionality\n`;
    }
    
    // Add technical details if requested
    if (options.includeTechnicalDetails) {
      explanation += `\n### Technical Details\n\n`;
      
      if (modified.length > 0) {
        // Analyze a sample of modifications in detail
        const sampleSize = Math.min(3, modified.length);
        explanation += `Detailed analysis of ${sampleSize} modified sections:\n\n`;
        
        for (let i = 0; i < sampleSize; i++) {
          const mod = modified[i];
          explanation += `#### Modification ${i + 1}\n\n`;
          explanation += `Line ${mod.originalLine} was changed from:\n`;
          explanation += '```\n' + mod.originalContent + '\n```\n\n';
          explanation += `to line ${mod.modifiedLine}:\n`;
          explanation += '```\n' + mod.modifiedContent + '\n```\n\n';
          
          // Add specific analysis of what changed
          const differences = this.analyzeLineDifference(mod.originalContent, mod.modifiedContent);
          explanation += `Changes: ${differences}\n\n`;
        }
      }
    }
    
    return explanation;
  }
  
  /**
   * Generate a comprehensive explanation of the changes
   */
  private generateComprehensiveExplanation(change: CodeChange, differences: any, options: ExplanationOptions): string {
    // Start with the detailed explanation
    let explanation = this.generateDetailedExplanation(change, differences, options);
    
    // Add broader context and impact analysis
    explanation += `## Context and Impact\n\n`;
    
    // Add impact assessment if requested
    if (options.includeImpactAssessment) {
      explanation += `### Potential Impact\n\n`;
      explanation += this.assessImpact(change).join('\n- '); // Fixed: using assessImpact instead of analyzeImpact
      explanation += '\n\n';
    }
    
    // Add best practices and recommendations
    explanation += `### Best Practices\n\n`;
    explanation += `- The changes ${this.evaluateAgainstBestPractices(change, differences)}\n`;
    
    // Add suggestions for further improvements
    if (options.includeSuggestions) {
      explanation += `\n### Suggestions for Further Improvement\n\n`;
      const suggestions = this.generateSuggestions(change);
      if (suggestions.length > 0) {
        explanation += `- ${suggestions.join('\n- ')}\n\n`;
      } else {
        explanation += `No additional suggestions at this time.\n\n`;
      }
    }
    
    return explanation;
  }
  
  /**
   * Analyze what specifically changed between two lines
   */
  private analyzeLineDifference(original: string, modified: string): string {
    // This is a simplified analysis - a real implementation would be more sophisticated
    if (original === modified) return "No changes";
    
    const originalWords = original.match(/\w+/g) || [];
    const modifiedWords = modified.match(/\w+/g) || [];
    
    const originalOperators = original.match(/[+\-*/%=<>!&|^~?:]+/g) || [];
    const modifiedOperators = modified.match(/[+\-*/%=<>!&|^~?:]+/g) || [];
    
    const changes = [];
    
    // Check for added or removed words
    const wordDiff = modifiedWords.length - originalWords.length;
    if (wordDiff > 0) changes.push(`Added ${wordDiff} term(s)`);
    if (wordDiff < 0) changes.push(`Removed ${-wordDiff} term(s)`);
    
    // Check for changed operators
    const operatorDiff = modifiedOperators.length - originalOperators.length;
    if (operatorDiff !== 0) changes.push(`Changed operators`);
    
    // Check for specific patterns
    if (original.includes('if') && modified.includes('if')) {
      changes.push(`Modified condition`);
    }
    
    if ((original.includes('let') || original.includes('var') || original.includes('const')) &&
        (modified.includes('let') || modified.includes('var') || modified.includes('const'))) {
      changes.push(`Changed variable declaration or initialization`);
    }
    
    if (original.includes('return') && modified.includes('return')) {
      changes.push(`Modified return value`);
    }
    
    if (changes.length === 0) {
      changes.push(`Minor text changes`);
    }
    
    return changes.join(', ');
  }
  
  /**
   * Evaluate changes against common best practices
   */
  private evaluateAgainstBestPractices(change: CodeChange, differences: any): string {
    const { added, removed, modified, changeTypes } = differences;
    
    // Simplified evaluation
    if (changeTypes.includes('bug fixes')) {
      return "appropriately address potential issues, which follows best practices for defensive programming";
    }
    
    if (changeTypes.includes('optimizations')) {
      return "improve performance while maintaining readability, which is a good balance";
    }
    
    if (changeTypes.includes('refactoring')) {
      return "improve code structure without affecting functionality, which is a recommended approach";
    }
    
    if (changeTypes.includes('renames')) {
      return "make naming more clear and descriptive, which enhances code readability";
    }
    
    return "appear to follow standard coding practices";
  }
  
  /**
   * Generate warnings about potential issues with the changes
   */
  protected generateWarnings(change: CodeChange): string[] {
    const warnings = [];
    
    // Check for potential regression risks
    if (change.type === ChangeType.BUG_FIX) {
      warnings.push("Bug fixes should be accompanied by tests to prevent regressions");
    }
    
    // Check for large changes
    const originalLines = (change.originalCode || '').split('\n').length;
    const modifiedLines = (change.modifiedCode || '').split('\n').length;
    
    if (Math.abs(modifiedLines - originalLines) > 50) {
      warnings.push("Large changes increase the risk of introducing bugs - consider breaking into smaller changes");
    }
    
    return warnings;
  }
  
  /**
   * Assess the potential impact of changes
   */
  protected assessImpact(change: CodeChange): string[] {
    const impacts = [];
    
    // Assess potential performance impact
    if (change.type === ChangeType.OPTIMIZATION) {
      impacts.push("May improve performance for this component");
    }
    
    if (change.type === ChangeType.REFACTOR) {
      impacts.push("Improves code maintainability without changing behavior");
    }
    
    if (change.type === ChangeType.BUG_FIX) {
      impacts.push("Fixes incorrect behavior that may have affected users");
    }
    
    // Add generic impact if none determined
    if (impacts.length === 0) {
      impacts.push("Modifies component behavior - test thoroughly before deployment");
    }
    
    return impacts;
  }
  
  /**
   * Generate suggestions for improvements
   */
  protected generateSuggestions(change: CodeChange): string[] {
    const suggestions = [];
    
    if (change.type === ChangeType.BUG_FIX) {
      suggestions.push("Consider adding tests to verify the bug fix and prevent regressions");
    }
    
    if (change.type === ChangeType.OPTIMIZATION) {
      suggestions.push("Add performance metrics or benchmarks to measure the impact of the optimization");
    }
    
    if (change.type === ChangeType.REFACTOR) {
      suggestions.push("Document the refactoring approach to help future developers understand the code structure");
    }
    
    return suggestions;
  }
}
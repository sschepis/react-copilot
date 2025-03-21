import * as ts from 'typescript';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

/**
 * Explanation detail level
 */
export enum ExplanationLevel {
  BRIEF = 'brief',     // Short, high-level explanation
  DETAILED = 'detailed', // Detailed explanation of changes
  TECHNICAL = 'technical', // Technical explanation with implementation details
  EDUCATIONAL = 'educational' // Educational explanation with reasoning and best practices
}

/**
 * Configuration for change explanation
 */
export interface ExplainerOptions {
  /** Level of detail for explanations */
  detailLevel: ExplanationLevel;
  /** Include code snippets in explanations */
  includeSnippets?: boolean;
  /** Include inline comments in code */
  includeInlineComments?: boolean;
  /** Group similar changes together */
  groupSimilarChanges?: boolean;
  /** Sort changes by importance */
  sortByImportance?: boolean;
  /** Maximum number of changes to explain */
  maxChanges?: number;
  /** List of file extensions to process */
  fileExtensions?: string[];
}

/**
 * Categorized code change
 */
export enum ChangeType {
  ADDITION = 'addition',
  DELETION = 'deletion',
  MODIFICATION = 'modification',
  REFACTORING = 'refactoring',
  STYLING = 'styling',
  OPTIMIZATION = 'optimization',
  BUG_FIX = 'bug_fix',
  FEATURE_ADDITION = 'feature_addition',
  DOCUMENTATION = 'documentation',
  TYPE_CHANGE = 'type_change'
}

/**
 * Unit of code change with explanation
 */
export interface ChangeUnit {
  /** Type of change */
  type: ChangeType;
  /** File path */
  filePath: string;
  /** Start line in file */
  startLine: number;
  /** End line in file */
  endLine: number;
  /** Original code snippet */
  originalCode?: string;
  /** New code snippet */
  newCode?: string;
  /** Brief description of the change */
  description: string;
  /** Technical explanation of the change */
  technicalExplanation?: string;
  /** Purpose/reasoning behind the change */
  rationale?: string;
  /** Impact of the change */
  impact?: string;
  /** Code elements affected (functions, variables, etc.) */
  affectedElements?: string[];
  /** Inline comments added to the code */
  inlineComments?: Map<number, string>;
  /** Severity/importance of the change */
  importance: 'low' | 'medium' | 'high';
  /** Is this change a best practice improvement */
  isBestPractice: boolean;
}

/**
 * Complete explanation of code changes
 */
export interface ChangeExplanation {
  /** Summary of all changes */
  summary: string;
  /** Detailed changes grouped by type or file */
  changes: ChangeUnit[];
  /** Grouped by file */
  fileChanges: Map<string, ChangeUnit[]>;
  /** Grouped by type */
  typeChanges: Map<ChangeType, ChangeUnit[]>;
  /** List of best practices introduced */
  bestPractices?: string[];
  /** Potential risks or points of attention */
  attentionPoints?: string[];
  /** Next steps or further improvements */
  nextSteps?: string[];
}

/**
 * Simple diff operation
 */
interface DiffOp {
  /** Operation type: 0 = unchanged, 1 = inserted, -1 = deleted */
  op: number;
  /** Text content */
  text: string;
}

/**
 * Service for explaining code changes in natural language
 */
export class ChangeExplainer {
  private options: Required<ExplainerOptions>;
  
  constructor(options: ExplainerOptions) {
    // Set default options
    this.options = {
      detailLevel: options.detailLevel,
      includeSnippets: options.includeSnippets ?? true,
      includeInlineComments: options.includeInlineComments ?? true,
      groupSimilarChanges: options.groupSimilarChanges ?? true,
      sortByImportance: options.sortByImportance ?? true,
      maxChanges: options.maxChanges ?? 100,
      fileExtensions: options.fileExtensions ?? ['.js', '.jsx', '.ts', '.tsx']
    };
  }
  
  /**
   * Generate explanations for changes between original and new code
   * 
   * @param originalFiles Map of file paths to original content
   * @param newFiles Map of file paths to new content
   * @returns Explanation of the changes
   */
  explainChanges(
    originalFiles: Map<string, string>,
    newFiles: Map<string, string>
  ): ChangeExplanation {
    const changeUnits: ChangeUnit[] = [];
    const fileChanges = new Map<string, ChangeUnit[]>();
    const typeChanges = new Map<ChangeType, ChangeUnit[]>();
    const bestPractices: string[] = [];
    const attentionPoints: string[] = [];
    
    // Process each file that exists in both original and new versions
    for (const [filePath, newContent] of newFiles.entries()) {
      const originalContent = originalFiles.get(filePath);
      
      // Skip files that don't exist in the original version (new files)
      if (originalContent === undefined) {
        const fileChangeUnit = this.createFileAdditionChange(filePath, newContent);
        changeUnits.push(fileChangeUnit);
        
        // Add to file changes map
        fileChanges.set(filePath, [fileChangeUnit]);
        
        // Add to type changes map
        const typeChangeList = typeChanges.get(ChangeType.ADDITION) || [];
        typeChangeList.push(fileChangeUnit);
        typeChanges.set(ChangeType.ADDITION, typeChangeList);
        
        continue;
      }
      
      // Skip files without supported extensions
      const fileExtension = `.${filePath.split('.').pop()}`;
      if (!this.options.fileExtensions.includes(fileExtension)) {
        continue;
      }
      
      // Calculate diff between original and new content
      const fileChangeUnits = this.analyzeFileDiff(filePath, originalContent, newContent);
      changeUnits.push(...fileChangeUnits);
      
      // Group changes by file
      fileChanges.set(filePath, fileChangeUnits);
      
      // Group changes by type
      for (const unit of fileChangeUnits) {
        const typeChangeList = typeChanges.get(unit.type) || [];
        typeChangeList.push(unit);
        typeChanges.set(unit.type, typeChangeList);
        
        // Collect best practices
        if (unit.isBestPractice) {
          bestPractices.push(unit.description);
        }
        
        // Collect attention points for high importance changes
        if (unit.importance === 'high') {
          attentionPoints.push(`${unit.description} (${filePath}, lines ${unit.startLine}-${unit.endLine})`);
        }
      }
    }
    
    // Process each file that exists only in the original version (deleted files)
    for (const [filePath, originalContent] of originalFiles.entries()) {
      if (!newFiles.has(filePath)) {
        const fileChangeUnit = this.createFileDeletionChange(filePath, originalContent);
        changeUnits.push(fileChangeUnit);
        
        // Add to file changes map
        fileChanges.set(filePath, [fileChangeUnit]);
        
        // Add to type changes map
        const typeChangeList = typeChanges.get(ChangeType.DELETION) || [];
        typeChangeList.push(fileChangeUnit);
        typeChanges.set(ChangeType.DELETION, typeChangeList);
      }
    }
    
    // Sort changes by importance if enabled
    if (this.options.sortByImportance) {
      changeUnits.sort((a, b) => {
        const importanceValues = { high: 3, medium: 2, low: 1 };
        return importanceValues[b.importance] - importanceValues[a.importance];
      });
    }
    
    // Limit the number of changes if maxChanges is set
    const limitedChanges = this.options.maxChanges > 0 ? 
      changeUnits.slice(0, this.options.maxChanges) : 
      changeUnits;
    
    // Generate summary based on changes
    const summary = this.generateSummary(limitedChanges, fileChanges, typeChanges);
    
    // Generate next steps based on changes
    const nextSteps = this.generateNextSteps(limitedChanges);
    
    return {
      summary,
      changes: limitedChanges,
      fileChanges,
      typeChanges,
      bestPractices: bestPractices.length > 0 ? bestPractices : undefined,
      attentionPoints: attentionPoints.length > 0 ? attentionPoints : undefined,
      nextSteps: nextSteps.length > 0 ? nextSteps : undefined
    };
  }
  
  /**
   * Generate natural language summary of changes
   * 
   * @param changes Change units
   * @param fileChanges Changes grouped by file
   * @param typeChanges Changes grouped by type
   * @returns Summary text
   */
  private generateSummary(
    changes: ChangeUnit[],
    fileChanges: Map<string, ChangeUnit[]>,
    typeChanges: Map<ChangeType, ChangeUnit[]>
  ): string {
    if (changes.length === 0) {
      return "No changes detected.";
    }
    
    const totalFiles = fileChanges.size;
    const newFiles = Array.from(fileChanges.entries())
      .filter(([_, units]) => units.some(u => u.type === ChangeType.ADDITION && u.startLine === 1 && !u.originalCode))
      .length;
    const deletedFiles = Array.from(fileChanges.entries())
      .filter(([_, units]) => units.some(u => u.type === ChangeType.DELETION && !u.newCode))
      .length;
    const modifiedFiles = totalFiles - newFiles - deletedFiles;
    
    // Count changes by type
    const additionCount = typeChanges.get(ChangeType.ADDITION)?.length || 0;
    const deletionCount = typeChanges.get(ChangeType.DELETION)?.length || 0;
    const modificationCount = typeChanges.get(ChangeType.MODIFICATION)?.length || 0;
    const refactoringCount = typeChanges.get(ChangeType.REFACTORING)?.length || 0;
    const bugFixCount = typeChanges.get(ChangeType.BUG_FIX)?.length || 0;
    const featureCount = typeChanges.get(ChangeType.FEATURE_ADDITION)?.length || 0;
    
    // Build summary
    let summary = `This change affects ${totalFiles} file${totalFiles !== 1 ? 's' : ''} `;
    summary += `(${newFiles} new, ${modifiedFiles} modified, ${deletedFiles} deleted) `;
    summary += `with a total of ${changes.length} individual change${changes.length !== 1 ? 's' : ''}. `;
    
    // Add more detail for larger changes
    if (changes.length > 5) {
      summary += `The changes include `;
      const changeDescriptions = [];
      
      if (additionCount > 0) {
        changeDescriptions.push(`${additionCount} addition${additionCount !== 1 ? 's' : ''}`);
      }
      if (deletionCount > 0) {
        changeDescriptions.push(`${deletionCount} deletion${deletionCount !== 1 ? 's' : ''}`);
      }
      if (modificationCount > 0) {
        changeDescriptions.push(`${modificationCount} modification${modificationCount !== 1 ? 's' : ''}`);
      }
      if (refactoringCount > 0) {
        changeDescriptions.push(`${refactoringCount} refactoring${refactoringCount !== 1 ? 's' : ''}`);
      }
      if (bugFixCount > 0) {
        changeDescriptions.push(`${bugFixCount} bug fix${bugFixCount !== 1 ? 'es' : ''}`);
      }
      if (featureCount > 0) {
        changeDescriptions.push(`${featureCount} new feature${featureCount !== 1 ? 's' : ''}`);
      }
      
      summary += changeDescriptions.join(', ');
      summary += '. ';
    }
    
    // Add high-level summary based on change types
    const hasBugFixes = bugFixCount > 0;
    const hasRefactoring = refactoringCount > 0;
    const hasFeatures = featureCount > 0;
    
    if (hasBugFixes && hasRefactoring && hasFeatures) {
      summary += 'This change combines bug fixes, code refactoring, and new feature implementation.';
    } else if (hasBugFixes && hasRefactoring) {
      summary += 'This change focuses on bug fixes and code refactoring without adding new features.';
    } else if (hasBugFixes && hasFeatures) {
      summary += 'This change addresses bugs while adding new features.';
    } else if (hasRefactoring && hasFeatures) {
      summary += 'This change refactors existing code while implementing new features.';
    } else if (hasBugFixes) {
      summary += 'This change primarily addresses bug fixes.';
    } else if (hasRefactoring) {
      summary += 'This change is primarily a code refactoring.';
    } else if (hasFeatures) {
      summary += 'This change focuses on adding new features.';
    } else {
      summary += 'This change includes general code modifications.';
    }
    
    return summary;
  }
  
  /**
   * Generate next steps based on changes
   * 
   * @param changes Change units
   * @returns Array of next steps
   */
  private generateNextSteps(changes: ChangeUnit[]): string[] {
    const nextSteps: string[] = [];
    
    // Check for different types of changes that might suggest next steps
    const hasBugFixes = changes.some(c => c.type === ChangeType.BUG_FIX);
    const hasFeatureAdditions = changes.some(c => c.type === ChangeType.FEATURE_ADDITION);
    const hasRefactoring = changes.some(c => c.type === ChangeType.REFACTORING);
    const hasTypeChanges = changes.some(c => c.type === ChangeType.TYPE_CHANGE);
    const hasDocChanges = changes.some(c => c.type === ChangeType.DOCUMENTATION);
    
    if (hasBugFixes) {
      nextSteps.push("Test the fixed functionality to ensure the bugs have been properly resolved.");
    }
    
    if (hasFeatureAdditions) {
      nextSteps.push("Write tests for the new features to ensure they work as expected.");
    }
    
    if (hasRefactoring) {
      nextSteps.push("Run the test suite to ensure the refactoring hasn't introduced any regressions.");
    }
    
    if (hasTypeChanges) {
      nextSteps.push("Check if type changes impact other parts of the codebase that might need updating.");
    }
    
    if (!hasDocChanges && (hasFeatureAdditions || hasRefactoring)) {
      nextSteps.push("Consider updating the documentation to reflect the changes.");
    }
    
    // Add generic next steps
    if (changes.length > 0) {
      nextSteps.push("Review the changes to ensure they match the intended functionality.");
    }
    
    return nextSteps;
  }
  
  /**
   * Create a change unit for a new file
   * 
   * @param filePath File path
   * @param content File content
   * @returns Change unit
   */
  private createFileAdditionChange(filePath: string, content: string): ChangeUnit {
    return {
      type: ChangeType.ADDITION,
      filePath,
      startLine: 1,
      endLine: content.split('\n').length,
      newCode: this.options.includeSnippets ? content : undefined,
      description: `Added new file ${filePath}`,
      technicalExplanation: `Created a new file with ${content.split('\n').length} lines of code.`,
      rationale: "New file needed for implementation.",
      affectedElements: this.extractAffectedElements(content),
      importance: 'high',
      isBestPractice: false
    };
  }
  
  /**
   * Create a change unit for a deleted file
   * 
   * @param filePath File path
   * @param content Original file content
   * @returns Change unit
   */
  private createFileDeletionChange(filePath: string, content: string): ChangeUnit {
    return {
      type: ChangeType.DELETION,
      filePath,
      startLine: 1,
      endLine: content.split('\n').length,
      originalCode: this.options.includeSnippets ? content : undefined,
      description: `Removed file ${filePath}`,
      technicalExplanation: `Deleted file with ${content.split('\n').length} lines of code.`,
      rationale: "File no longer needed.",
      affectedElements: this.extractAffectedElements(content),
      importance: 'high',
      isBestPractice: false
    };
  }
  
  /**
   * Analyze diff between original and new content
   * 
   * @param filePath File path
   * @param originalContent Original file content
   * @param newContent New file content
   * @returns Array of change units
   */
  private analyzeFileDiff(
    filePath: string, 
    originalContent: string, 
    newContent: string
  ): ChangeUnit[] {
    const changeUnits: ChangeUnit[] = [];
    
    // Get line-by-line diff
    const diffResult = this.computeLineDiff(originalContent, newContent);
    
    // Convert diff to change units
    let lineIndex = 0;
    let inChange = false;
    let changeStart = 0;
    let originalLines: string[] = [];
    let newLines: string[] = [];
    
    for (let i = 0; i < diffResult.length; i++) {
      const { op, text } = diffResult[i];
      
      if (op === -1) {
        // Deletion
        if (!inChange) {
          inChange = true;
          changeStart = lineIndex;
        }
        originalLines.push(text);
      } else if (op === 1) {
        // Addition
        if (!inChange) {
          inChange = true;
          changeStart = lineIndex;
        }
        newLines.push(text);
      } else {
        // Context (unchanged)
        if (inChange) {
          // End of a change block, create a change unit
          const changeUnit = this.createChangeUnit(
            filePath,
            changeStart,
            lineIndex - 1,
            originalLines.join('\n'),
            newLines.join('\n')
          );
          
          if (changeUnit) {
            changeUnits.push(changeUnit);
          }
          
          // Reset change tracking
          inChange = false;
          originalLines = [];
          newLines = [];
        }
        
        lineIndex++;
      }
    }
    
    // Handle final change if any
    if (inChange) {
      const changeUnit = this.createChangeUnit(
        filePath,
        changeStart,
        lineIndex - 1,
        originalLines.join('\n'),
        newLines.join('\n')
      );
      
      if (changeUnit) {
        changeUnits.push(changeUnit);
      }
    }
    
    return changeUnits;
  }
  
  /**
   * Compute line-by-line diff (simplified implementation without external library)
   * 
   * @param originalContent Original content
   * @param newContent New content
   * @returns Array of diff operations
   */
  private computeLineDiff(originalContent: string, newContent: string): DiffOp[] {
    // Split content into lines
    const originalLines = originalContent.split('\n');
    const newLines = newContent.split('\n');
    
    // Compute diff for each line
    const result: DiffOp[] = [];
    
    // Use a simple diff algorithm (can be improved for larger files)
    let i = 0, j = 0;
    
    while (i < originalLines.length || j < newLines.length) {
      if (i < originalLines.length && j < newLines.length && originalLines[i] === newLines[j]) {
        // Lines are the same
        result.push({ op: 0, text: originalLines[i] });
        i++;
        j++;
      } else {
        // Try to find next matching line
        let nextMatch = -1;
        for (let k = i + 1; k < originalLines.length && nextMatch === -1; k++) {
          if (originalLines[k] === newLines[j]) {
            nextMatch = k;
          }
        }
        
        let nextMatch2 = -1;
        for (let k = j + 1; k < newLines.length && nextMatch2 === -1; k++) {
          if (originalLines[i] === newLines[k]) {
            nextMatch2 = k;
          }
        }
        
        if (nextMatch !== -1 && (nextMatch2 === -1 || nextMatch - i < nextMatch2 - j)) {
          // Delete lines until next match
          for (let k = i; k < nextMatch; k++) {
            result.push({ op: -1, text: originalLines[k] });
          }
          i = nextMatch;
        } else if (nextMatch2 !== -1) {
          // Add lines until next match
          for (let k = j; k < nextMatch2; k++) {
            result.push({ op: 1, text: newLines[k] });
          }
          j = nextMatch2;
        } else {
          // No match found, delete original line and add new line
          if (i < originalLines.length) {
            result.push({ op: -1, text: originalLines[i] });
            i++;
          }
          if (j < newLines.length) {
            result.push({ op: 1, text: newLines[j] });
            j++;
          }
        }
      }
    }
    
    return result;
  }
  
  /**
   * Create a change unit from diff information
   * 
   * @param filePath File path
   * @param startLine Start line
   * @param endLine End line
   * @param originalCode Original code
   * @param newCode New code
   * @returns Change unit or undefined if change is not significant
   */
  private createChangeUnit(
    filePath: string,
    startLine: number,
    endLine: number,
    originalCode: string,
    newCode: string
  ): ChangeUnit | undefined {
    // Skip empty changes
    if (!originalCode && !newCode) {
      return undefined;
    }
    
    // Determine change type and details
    const changeType = this.categorizeChange(originalCode, newCode);
    const [description, technicalExplanation, rationale] = this.generateChangeDescription(
      changeType,
      originalCode,
      newCode
    );
    
    // Extract affected elements
    const affectedElements = [
      ...this.extractAffectedElements(originalCode),
      ...this.extractAffectedElements(newCode)
    ];
    
    // Determine importance
    const importance = this.determineImportance(changeType, originalCode, newCode);
    
    // Determine if this is a best practice change
    const isBestPractice = this.isBestPracticeChange(changeType, originalCode, newCode);
    
    // Create inline comments if enabled
    const inlineComments = this.options.includeInlineComments ?
      this.generateInlineComments(newCode, changeType) :
      undefined;
    
    return {
      type: changeType,
      filePath,
      startLine,
      endLine,
      originalCode: this.options.includeSnippets ? originalCode : undefined,
      newCode: this.options.includeSnippets ? newCode : undefined,
      description,
      technicalExplanation,
      rationale,
      impact: this.assessImpact(changeType, affectedElements),
      affectedElements,
      inlineComments,
      importance,
      isBestPractice
    };
  }
  
  /**
   * Categorize the type of change
   * 
   * @param originalCode Original code
   * @param newCode New code
   * @returns Change type
   */
  private categorizeChange(originalCode: string, newCode: string): ChangeType {
    if (!originalCode && newCode) {
      return ChangeType.ADDITION;
    }
    
    if (originalCode && !newCode) {
      return ChangeType.DELETION;
    }
    
    // Check for specific change patterns
    if (this.isStyleChange(originalCode, newCode)) {
      return ChangeType.STYLING;
    }
    
    if (this.isRefactoring(originalCode, newCode)) {
      return ChangeType.REFACTORING;
    }
    
    if (this.isBugFix(originalCode, newCode)) {
      return ChangeType.BUG_FIX;
    }
    
    if (this.isFeatureAddition(originalCode, newCode)) {
      return ChangeType.FEATURE_ADDITION;
    }
    
    if (this.isDocumentationChange(originalCode, newCode)) {
      return ChangeType.DOCUMENTATION;
    }
    
    if (this.isTypeChange(originalCode, newCode)) {
      return ChangeType.TYPE_CHANGE;
    }
    
    if (this.isOptimization(originalCode, newCode)) {
      return ChangeType.OPTIMIZATION;
    }
    
    // Default to modification
    return ChangeType.MODIFICATION;
  }
  
  /**
   * Check if the change is primarily styling
   * 
   * @param originalCode Original code
   * @param newCode New code
   * @returns Whether the change is styling
   */
  private isStyleChange(originalCode: string, newCode: string): boolean {
    // Compare without whitespace and comments
    const stripped1 = this.stripWhitespaceAndComments(originalCode);
    const stripped2 = this.stripWhitespaceAndComments(newCode);
    
    // If the code is the same after stripping, it's a style change
    return stripped1 === stripped2 && originalCode !== newCode;
  }
  
  /**
   * Check if the change is a refactoring
   * 
   * @param originalCode Original code
   * @param newCode New code
   * @returns Whether the change is a refactoring
   */
  private isRefactoring(originalCode: string, newCode: string): boolean {
    // Check for common refactoring patterns
    const patterns = [
      // Function extraction
      { original: /function\s+\w+\s*\([^)]*\)\s*{([\s\S]+?)}/g, new: /function\s+\w+\s*\([^)]*\)\s*{\s*\w+\([^)]*\);?\s*}/g },
      // Variable renaming
      { original: /\b(\w+)\b/g, new: /\b(\w+)\b/g },
      // Destructuring
      { original: /const\s+\w+\s*=\s*\w+\.\w+/g, new: /const\s*{\s*\w+\s*}\s*=\s*\w+/g },
      // Method chaining
      { original: /\w+\(\);\s*\w+\(\);\s*\w+\(\);/g, new: /\w+\(\)\s*\.\s*\w+\(\)\s*\.\s*\w+\(\);/g }
    ];
    
    // Check if any refactoring pattern matches
    for (const pattern of patterns) {
      const originalMatches = originalCode.match(pattern.original);
      const newMatches = newCode.match(pattern.new);
      
      if (originalMatches && newMatches && originalMatches.length !== newMatches.length) {
        return true;
      }
    }
    
    // Check for structural similarity
    try {
      const originalAst = parse(originalCode, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      });
      
      const newAst = parse(newCode, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      });
      
      // If AST node count is similar but code is different, likely a refactoring
      let originalNodeCount = 0;
      let newNodeCount = 0;
      
      traverse(originalAst, {
        enter() {
          originalNodeCount++;
        }
      });
      
      traverse(newAst, {
        enter() {
          newNodeCount++;
        }
      });
      
      const nodeDiff = Math.abs(originalNodeCount - newNodeCount);
      const nodeRatio = Math.min(originalNodeCount, newNodeCount) / Math.max(originalNodeCount, newNodeCount);
      
      // Similar node count (within 20%) but different code
      return nodeRatio > 0.8 && nodeDiff < 20 && originalCode !== newCode;
    } catch {
      // If parsing fails, fall back to simpler heuristics
      return false;
    }
  }
  
  /**
   * Check if the change is a bug fix
   * 
   * @param originalCode Original code
   * @param newCode New code
   * @returns Whether the change is a bug fix
   */
  private isBugFix(originalCode: string, newCode: string): boolean {
    // Check for common bug fix patterns
    const patterns = [
      // Null/undefined checks
      { original: /(\w+)\./g, new: /(\w+)\s*\?\s*\./g },
      { original: /(\w+)\[/g, new: /(\w+)\s*\?\s*\[/g },
      // Default parameters
      { original: /function\s+\w+\s*\(([^)]*)\)/g, new: /function\s+\w+\s*\(([^=)]*=\s*[^,)]+)\)/g },
      // Condition fixes
      { original: /if\s*\([^)]+\)/g, new: /if\s*\([^)]+\)/g },
      // Exception handling
      { original: /try\s*{/g, new: /try\s*{/g }
    ];
    
    // Check if any bug fix pattern matches
    for (const pattern of patterns) {
      const originalMatches = originalCode.match(pattern.original);
      const newMatches = newCode.match(pattern.new);
      
      if (originalMatches && newMatches && 
          (originalMatches.length !== newMatches.length || 
           JSON.stringify(originalMatches) !== JSON.stringify(newMatches))) {
        return true;
      }
    }
    
    // Check for bug fix keywords in comments
    const bugFixKeywords = ['fix', 'bug', 'issue', 'problem', 'error', 'crash', 'exception'];
    const commentRegex = /\/\/.*?$|\/\*[\s\S]*?\*\//gm;
    const comments = newCode.match(commentRegex) || [];
    
    for (const comment of comments) {
      if (bugFixKeywords.some(keyword => comment.toLowerCase().includes(keyword))) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check if the change is a feature addition
   * 
   * @param originalCode Original code
   * @param newCode New code
   * @returns Whether the change is a feature addition
   */
  private isFeatureAddition(originalCode: string, newCode: string): boolean {
    // If the new code is significantly longer, it might be a feature addition
    if (newCode.length > originalCode.length * 1.5) {
      return true;
    }
    
    // Check for new function/method declarations
    const originalFunctions = this.extractFunctionDeclarations(originalCode);
    const newFunctions = this.extractFunctionDeclarations(newCode);
    
    if (newFunctions.length > originalFunctions.length) {
      const newFunctionNames = newFunctions.filter(fn => !originalFunctions.includes(fn));
      if (newFunctionNames.length > 0) {
        return true;
      }
    }
    
    // Check for feature keywords in comments
    const featureKeywords = ['feature', 'add', 'new', 'implement', 'enhance'];
    const commentRegex = /\/\/.*?$|\/\*[\s\S]*?\*\//gm;
    const comments = newCode.match(commentRegex) || [];
    
    for (const comment of comments) {
      if (featureKeywords.some(keyword => comment.toLowerCase().includes(keyword))) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check if the change is documentation
   * 
   * @param originalCode Original code
   * @param newCode New code
   * @returns Whether the change is documentation
   */
  private isDocumentationChange(originalCode: string, newCode: string): boolean {
    // Extract comments from both code versions
    const originalComments = this.extractComments(originalCode);
    const newComments = this.extractComments(newCode);
    
    // If only comments changed, it's a documentation change
    const strippedOriginal = this.stripComments(originalCode);
    const strippedNew = this.stripComments(newCode);
    
    if (strippedOriginal === strippedNew && originalComments !== newComments) {
      return true;
    }
    
    // Check for significant comment additions
    if (newComments.length > originalComments.length * 1.5) {
      return true;
    }
    
    // Check for JSDoc/documentation style comments
    const jsdocRegex = /\/\*\*[\s\S]*?\*\//g;
    const originalJSDoc = originalCode.match(jsdocRegex) || [];
    const newJSDoc = newCode.match(jsdocRegex) || [];
    
    if (newJSDoc.length > originalJSDoc.length) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if the change is a type change (TypeScript)
   * 
   * @param originalCode Original code
   * @param newCode New code
   * @returns Whether the change is a type change
   */
  private isTypeChange(originalCode: string, newCode: string): boolean {
    // Check for interface or type definitions
    const typeDefRegex = /\b(interface|type)\s+\w+/g;
    const originalTypeDefs = originalCode.match(typeDefRegex) || [];
    const newTypeDefs = newCode.match(typeDefRegex) || [];
    
    if (newTypeDefs.length !== originalTypeDefs.length) {
      return true;
    }
    
    // Check for type annotations
    const typeAnnotationRegex = /:\s*(\w+|{[^}]*}|\[[^\]]*\])</g;
    const originalAnnotations = originalCode.match(typeAnnotationRegex) || [];
    const newAnnotations = newCode.match(typeAnnotationRegex) || [];
    
    if (newAnnotations.length !== originalAnnotations.length) {
      return true;
    }
    
    // Check for generic type parameters
    const genericRegex = /<\s*\w+(\s*,\s*\w+)*\s*>/g;
    const originalGenerics = originalCode.match(genericRegex) || [];
    const newGenerics = newCode.match(genericRegex) || [];
    
    if (newGenerics.length !== originalGenerics.length) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if the change is an optimization
   * 
   * @param originalCode Original code
   * @param newCode New code
   * @returns Whether the change is an optimization
   */
  private isOptimization(originalCode: string, newCode: string): boolean {
    // Check for optimization keywords in comments
    const optimizationKeywords = ['optimize', 'performance', 'efficient', 'faster', 'speed'];
    const commentRegex = /\/\/.*?$|\/\*[\s\S]*?\*\//gm;
    const comments = newCode.match(commentRegex) || [];
    
    for (const comment of comments) {
      if (optimizationKeywords.some(keyword => comment.toLowerCase().includes(keyword))) {
        return true;
      }
    }
    
    // Check for common optimization patterns
    const patterns = [
      // Memoization
      { regex: /useMemo|useCallback|React\.memo/g, shouldIncrease: true },
      // Loop optimization
      { regex: /for\s*\([^)]+\)/g, shouldIncrease: false },
      // Conditional rendering optimization
      { regex: /\{.*\s*\?\s*.*\s*:\s*.*\}/g, shouldIncrease: false }
    ];
    
    for (const pattern of patterns) {
      const originalMatches = originalCode.match(pattern.regex) || [];
      const newMatches = newCode.match(pattern.regex) || [];
      
      if ((pattern.shouldIncrease && newMatches.length > originalMatches.length) ||
          (!pattern.shouldIncrease && newMatches.length < originalMatches.length)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Generate description, technical explanation, and rationale for a change
   * 
   * @param changeType Change type
   * @param originalCode Original code
   * @param newCode New code
   * @returns [description, technicalExplanation, rationale]
   */
  private generateChangeDescription(
    changeType: ChangeType,
    originalCode: string,
    newCode: string
  ): [string, string, string] {
    // Extract key elements from the code
    const originalFunctions = this.extractFunctionDeclarations(originalCode);
    const newFunctions = this.extractFunctionDeclarations(newCode);
    
    const addedFunctions = newFunctions.filter(fn => !originalFunctions.includes(fn));
    const removedFunctions = originalFunctions.filter(fn => !newFunctions.includes(fn));
    
    let description = '';
    let technicalExplanation = '';
    let rationale = '';
    
    switch (changeType) {
      case ChangeType.ADDITION:
        description = `Added new code ${addedFunctions.length > 0 ? `including function${addedFunctions.length > 1 ? 's' : ''} ${addedFunctions.join(', ')}` : ''}`;
        technicalExplanation = `Added ${newCode.split('\n').length} lines of code ${addedFunctions.length > 0 ? `with ${addedFunctions.length} new function${addedFunctions.length > 1 ? 's' : ''}` : ''}`;
        rationale = "Code addition to implement new functionality or enhance existing features.";
        break;
        
      case ChangeType.DELETION:
        description = `Removed code ${removedFunctions.length > 0 ? `including function${removedFunctions.length > 1 ? 's' : ''} ${removedFunctions.join(', ')}` : ''}`;
        technicalExplanation = `Deleted ${originalCode.split('\n').length} lines of code ${removedFunctions.length > 0 ? `with ${removedFunctions.length} function${removedFunctions.length > 1 ? 's' : ''}` : ''}`;
        rationale = "Code removal to clean up unused functionality or simplify implementation.";
        break;
        
      case ChangeType.MODIFICATION:
        description = "Modified existing code";
        technicalExplanation = `Changed ${originalCode.split('\n').length} lines to ${newCode.split('\n').length} lines`;
        rationale = "Code modification to change behavior or fix issues.";
        break;
        
      case ChangeType.REFACTORING:
        description = "Refactored code structure";
        technicalExplanation = `Reorganized code while preserving functionality, ${addedFunctions.length > 0 ? `extracting ${addedFunctions.length} new function${addedFunctions.length > 1 ? 's' : ''}` : 'improving readability'}`;
        rationale = "Refactoring to improve code quality, maintainability, and readability without changing behavior.";
        break;
        
      case ChangeType.STYLING:
        description = "Improved code formatting and style";
        technicalExplanation = "Updated code style, indentation, or whitespace without changing functionality";
        rationale = "Style changes to improve code readability and maintain consistent coding standards.";
        break;
        
      case ChangeType.OPTIMIZATION:
        description = "Optimized code for better performance";
        technicalExplanation = "Modified code to improve execution efficiency or resource usage";
        rationale = "Optimization to enhance performance and reduce resource consumption.";
        break;
        
      case ChangeType.BUG_FIX:
        description = "Fixed a bug in the code";
        technicalExplanation = "Corrected code logic to address an issue or unexpected behavior";
        rationale = "Bug fix to correct faulty behavior and ensure proper functionality.";
        break;
        
      case ChangeType.FEATURE_ADDITION:
        description = `Added new feature ${addedFunctions.length > 0 ? `with function${addedFunctions.length > 1 ? 's' : ''} ${addedFunctions.join(', ')}` : ''}`;
        technicalExplanation = `Implemented new functionality adding ${newCode.split('\n').length - (originalCode.split('\n').length || 0)} lines of code`;
        rationale = "Feature addition to enhance application capabilities.";
        break;
        
      case ChangeType.DOCUMENTATION:
        description = "Updated code documentation";
        technicalExplanation = "Added or improved comments, JSDoc, or other documentation";
        rationale = "Documentation enhancement to improve code understandability and maintainability.";
        break;
        
      case ChangeType.TYPE_CHANGE:
        description = "Updated type definitions or annotations";
        technicalExplanation = "Modified TypeScript types, interfaces, or type annotations";
        rationale = "Type system changes to improve type safety and code correctness.";
        break;
    }
    
    return [description, technicalExplanation, rationale];
  }
  
  /**
   * Extract function declarations from code
   * 
   * @param code Source code
   * @returns Array of function names
   */
  private extractFunctionDeclarations(code: string): string[] {
    if (!code) {
      return [];
    }
    
    const functions: string[] = [];
    
    // Match function declarations
    const functionRegex = /function\s+(\w+)\s*\(/g;
    let match: RegExpExecArray | null;
    
    while ((match = functionRegex.exec(code)) !== null) {
      functions.push(match[1]);
    }
    
    // Match arrow functions and method declarations
    const arrowFunctionRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=]*)\s*=>/g;
    while ((match = arrowFunctionRegex.exec(code)) !== null) {
      functions.push(match[1]);
    }
    
    // Match class methods
    const methodRegex = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*{/g;
    while ((match = methodRegex.exec(code)) !== null) {
      // Exclude constructor
      if (match[1] !== 'constructor') {
        functions.push(match[1]);
      }
    }
    
    return functions;
  }
  
  /**
   * Extract affected elements from code
   * 
   * @param code Source code
   * @returns Array of affected element names
   */
  private extractAffectedElements(code: string): string[] {
    if (!code) {
      return [];
    }
    
    const elements: string[] = [];
    
    // Extract function declarations
    elements.push(...this.extractFunctionDeclarations(code));
    
    // Extract variable declarations
    const varRegex = /(?:const|let|var)\s+(\w+)\s*=/g;
    let match: RegExpExecArray | null;
    
    while ((match = varRegex.exec(code)) !== null) {
      elements.push(match[1]);
    }
    
    // Extract class declarations
    const classRegex = /class\s+(\w+)/g;
    while ((match = classRegex.exec(code)) !== null) {
      elements.push(match[1]);
    }
    
    // Extract interface/type declarations
    const typeRegex = /(?:interface|type)\s+(\w+)/g;
    while ((match = typeRegex.exec(code)) !== null) {
      elements.push(match[1]);
    }
    
    return [...new Set(elements)]; // Remove duplicates
  }
  
  /**
   * Determine the importance of a change
   * 
   * @param changeType Change type
   * @param originalCode Original code
   * @param newCode New code
   * @returns Importance level
   */
  private determineImportance(
    changeType: ChangeType,
    originalCode: string,
    newCode: string
  ): 'low' | 'medium' | 'high' {
    // New files or deleted files are high importance
    if ((!originalCode && newCode) || (originalCode && !newCode)) {
      return 'high';
    }
    
    // Bug fixes and new features are high importance
    if (changeType === ChangeType.BUG_FIX || changeType === ChangeType.FEATURE_ADDITION) {
      return 'high';
    }
    
    // Refactoring and optimizations are medium importance
    if (changeType === ChangeType.REFACTORING || changeType === ChangeType.OPTIMIZATION) {
      return 'medium';
    }
    
    // Type changes are medium importance
    if (changeType === ChangeType.TYPE_CHANGE) {
      return 'medium';
    }
    
    // Style changes and documentation are low importance
    if (changeType === ChangeType.STYLING || changeType === ChangeType.DOCUMENTATION) {
      return 'low';
    }
    
    // For modifications, consider the size of the change
    if (changeType === ChangeType.MODIFICATION) {
      const originalLines = originalCode.split('\n').length;
      const newLines = newCode.split('\n').length;
      const changeRatio = Math.abs(newLines - originalLines) / Math.max(originalLines, 1);
      
      if (changeRatio > 0.5) {
        return 'high';
      } else if (changeRatio > 0.2) {
        return 'medium';
      } else {
        return 'low';
      }
    }
    
    return 'medium';
  }
  
  /**
   * Determine if a change represents a best practice improvement
   * 
   * @param changeType Change type
   * @param originalCode Original code
   * @param newCode New code
   * @returns Whether the change is a best practice improvement
   */
  private isBestPracticeChange(
    changeType: ChangeType,
    originalCode: string,
    newCode: string
  ): boolean {
    // Check for common best practice improvements
    const bestPracticePatterns = [
      // Error handling
      { original: /(?:^(?!\s*try).*?)throw\s+/gm, new: /try\s*{[\s\S]*?}\s*catch\s*\(.*?\)\s*{/g },
      // Early returns
      { original: /if\s*\([^)]+\)\s*{\s*return[^}]*}\s*(?:else\s*{\s*)?/g, new: /if\s*\([^)]+\)\s*{\s*return[^}]*}\s*(?:return|[^}]*$)/g },
      // Const over let
      { original: /let\s+(\w+)\s*=/g, new: /const\s+(\w+)\s*=/g },
      // Destructuring
      { original: /(\w+)\.(\w+)/g, new: /const\s*{\s*\w+\s*}\s*=\s*\w+/g },
      // Optional chaining
      { original: /if\s*\(\s*\w+\s*&&\s*\w+\.\w+\s*\)/g, new: /\w+\s*\?\.\s*\w+/g },
      // Null coalescing
      { original: /(\w+)\s*!==\s*(?:null|undefined)\s*\?\s*\1\s*:\s*(.+)/g, new: /\w+\s*\?\?\s*.+/g }
    ];
    
    for (const pattern of bestPracticePatterns) {
      const originalMatches = originalCode.match(pattern.original) || [];
      const newMatches = newCode.match(pattern.new) || [];
      
      if (newMatches.length > originalMatches.length) {
        return true;
      }
    }
    
    // Check comments for best practice mentions
    const bestPracticeKeywords = [
      'best practice', 'clean code', 'maintainable', 'readability',
      'consistent', 'standard', 'convention', 'idiomatic'
    ];
    
    const commentRegex = /\/\/.*?$|\/\*[\s\S]*?\*\//gm;
    const comments = newCode.match(commentRegex) || [];
    
    for (const comment of comments) {
      if (bestPracticeKeywords.some(keyword => comment.toLowerCase().includes(keyword))) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Generate inline comments for code
   * 
   * @param code Source code
   * @param changeType Change type
   * @returns Map of line numbers to comments
   */
  private generateInlineComments(code: string, changeType: ChangeType): Map<number, string> {
    const comments = new Map<number, string>();
    
    if (!code) {
      return comments;
    }
    
    const lines = code.split('\n');
    
    // Add comment for the first line based on change type
    if (lines.length > 0) {
      switch (changeType) {
        case ChangeType.ADDITION:
          comments.set(1, 'Added new code block');
          break;
        case ChangeType.MODIFICATION:
          comments.set(1, 'Modified code section');
          break;
        case ChangeType.REFACTORING:
          comments.set(1, 'Refactored for improved structure');
          break;
        case ChangeType.OPTIMIZATION:
          comments.set(1, 'Optimized for better performance');
          break;
        case ChangeType.BUG_FIX:
          comments.set(1, 'Fixed bug in this section');
          break;
        case ChangeType.FEATURE_ADDITION:
          comments.set(1, 'Added new feature');
          break;
      }
    }
    
    // Add comments for specific code patterns
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      
      // Skip if line already has a comment
      if (comments.has(lineNumber)) {
        continue;
      }
      
      // Function declarations
      if (/function\s+\w+\s*\(/.test(line) || /const\s+\w+\s*=\s*(\([^)]*\)|[^=]*)\s*=>/.test(line)) {
        comments.set(lineNumber, 'Function definition');
      }
      
      // Error handling
      else if (/try\s*{/.test(line)) {
        comments.set(lineNumber, 'Error handling block');
      }
      else if (/catch\s*\(/.test(line)) {
        comments.set(lineNumber, 'Error catch logic');
      }
      
      // Conditionals
      else if (/if\s*\([^)]+\)/.test(line)) {
        comments.set(lineNumber, 'Conditional check');
      }
      
      // Returns
      else if (/\breturn\b/.test(line)) {
        comments.set(lineNumber, 'Return statement');
      }
      
      // Variable declarations
      else if (/\b(const|let|var)\s+\w+\s*=/.test(line)) {
        comments.set(lineNumber, 'Variable declaration');
      }
      
      // API calls or async operations
      else if (/\bawait\b/.test(line) || /\.(get|post|put|delete|fetch)\(/.test(line)) {
        comments.set(lineNumber, 'Asynchronous operation');
      }
      
      // React hooks
      else if (/use[A-Z]\w+\(/.test(line)) {
        comments.set(lineNumber, 'React hook');
      }
      
      // JSX tags
      else if (/<\w+[^>]*>/.test(line) && !/<\/\w+>/.test(line)) {
        comments.set(lineNumber, 'JSX element start');
      }
      else if (/<\/\w+>/.test(line) && !/<\w+[^>]*>/.test(line)) {
        comments.set(lineNumber, 'JSX element end');
      }
    }
    
    return comments;
  }
  
  /**
   * Strip whitespace and comments from code
   * 
   * @param code Source code
   * @returns Stripped code
   */
  private stripWhitespaceAndComments(code: string): string {
    if (!code) {
      return '';
    }
    
    // Remove comments
    let strippedCode = code.replace(/\/\/.*?$|\/\*[\s\S]*?\*\//gm, '');
    
    // Remove whitespace
    strippedCode = strippedCode.replace(/\s+/g, '');
    
    return strippedCode;
  }
  
  /**
   * Extract comments from code
   * 
   * @param code Source code
   * @returns Array of comments
   */
  private extractComments(code: string): string[] {
    if (!code) {
      return [];
    }
    
    const commentRegex = /\/\/.*?$|\/\*[\s\S]*?\*\//gm;
    return code.match(commentRegex) || [];
  }
  
  /**
   * Strip comments from code
   * 
   * @param code Source code
   * @returns Code without comments
   */
  private stripComments(code: string): string {
    if (!code) {
      return '';
    }
    
    return code.replace(/\/\/.*?$|\/\*[\s\S]*?\*\//gm, '');
  }
  
  /**
   * Assess the impact of a change
   * 
   * @param changeType Change type
   * @param affectedElements Affected elements
   * @returns Impact description
   */
  private assessImpact(changeType: ChangeType, affectedElements: string[]): string {
    // No affected elements means minimal impact
    if (affectedElements.length === 0) {
      return 'Minimal impact on existing functionality.';
    }
    
    // Different impacts based on change type
    switch (changeType) {
      case ChangeType.ADDITION:
        return `Adds new functionality without affecting existing code.`;
        
      case ChangeType.DELETION:
        return `Removes ${affectedElements.length} element(s) from the codebase.`;
        
      case ChangeType.MODIFICATION:
        return `Modifies behavior of ${affectedElements.length} element(s).`;
        
      case ChangeType.REFACTORING:
        return `Improves code structure without changing external behavior.`;
        
      case ChangeType.STYLING:
        return `No functional impact, improves code readability.`;
        
      case ChangeType.OPTIMIZATION:
        return `Improves performance without changing functionality.`;
        
      case ChangeType.BUG_FIX:
        return `Corrects incorrect behavior in ${affectedElements.length} element(s).`;
        
      case ChangeType.FEATURE_ADDITION:
        return `Adds new capabilities to the application.`;
        
      case ChangeType.DOCUMENTATION:
        return `Improves code documentation with no functional impact.`;
        
      case ChangeType.TYPE_CHANGE:
        return `Enhances type safety without affecting runtime behavior.`;
        
      default:
        return `Affects ${affectedElements.length} element(s).`;
    }
  }
}

export default ChangeExplainer;
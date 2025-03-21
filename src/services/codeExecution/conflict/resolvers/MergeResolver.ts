import {
  Conflict,
  ResolutionResult,
  ResolutionStrategy,
  ConflictType,
  ConflictSeverity
} from '../types';
import { ConflictResolverBase } from '../ConflictResolverBase';

/**
 * Resolver that attempts to merge conflicting changes
 * Uses intelligent merging strategies based on the conflict type and content
 */
export class MergeResolver extends ConflictResolverBase {
  constructor() {
    super('MergeResolver', ResolutionStrategy.MERGE);
    
    // Default configuration
    this.options = {
      // Whether to use a three-way merge algorithm when possible
      useThreeWayMerge: true,
      // Whether to add conflict markers in the output
      addConflictMarkers: true,
      // Marker format to use
      markerFormat: 'standard', // 'standard', 'git', 'custom'
      // Maximum complexity for automatic merging
      maxMergeComplexity: 10,
      // Whether to attempt semantic merging
      attemptSemanticMerge: true
    };
  }
  
  /**
   * Resolve a conflict by merging the changes
   */
  resolveConflict(conflict: Conflict): ResolutionResult {
    // Check if this conflict is too complex for automatic merging
    if (this.isTooComplex(conflict)) {
      return this.createFailureResult(
        conflict,
        'Conflict is too complex for automatic merging'
      );
    }
    
    try {
      // Select the appropriate merge strategy based on the conflict type
      let resolvedCode: string;
      let description: string;
      let warnings: string[] = [];
      
      switch (conflict.type) {
        case ConflictType.OVERLAPPING:
          [resolvedCode, description, warnings] = this.mergeOverlappingChanges(conflict);
          break;
        case ConflictType.ADJACENT:
          [resolvedCode, description, warnings] = this.mergeAdjacentChanges(conflict);
          break;
        case ConflictType.RELATED:
          [resolvedCode, description, warnings] = this.mergeRelatedChanges(conflict);
          break;
        case ConflictType.IMPORT:
          [resolvedCode, description, warnings] = this.mergeImportChanges(conflict);
          break;
        default:
          // Default to basic merging for other conflict types
          resolvedCode = this.mergeCode(
            conflict.firstChange.modifiedCode,
            conflict.secondChange.modifiedCode
          );
          description = 'Changes merged using default merge strategy';
          warnings = ['Using default merge strategy for this conflict type'];
      }
      
      return this.createSuccessResult(conflict, resolvedCode, description, warnings);
    } catch (error) {
      return this.createFailureResult(
        conflict,
        `Error during merge: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Check if this resolver can handle the given conflict
   */
  canResolve(conflict: Conflict): boolean {
    // Override default implementation
    
    // If specifically suggested, use the parent's logic
    if (conflict.suggestedStrategy) {
      return super.canResolve(conflict);
    }
    
    // We can handle most overlapping conflicts
    if (conflict.type === ConflictType.OVERLAPPING) {
      // Except for critical severity ones
      return conflict.severity !== ConflictSeverity.CRITICAL;
    }
    
    // We can handle adjacent conflicts
    if (conflict.type === ConflictType.ADJACENT) {
      return true;
    }
    
    // We can handle import conflicts
    if (conflict.type === ConflictType.IMPORT) {
      return true;
    }
    
    // For other types, use the default logic
    return super.canResolve(conflict);
  }
  
  /**
   * Check if a conflict is too complex for automatic merging
   */
  private isTooComplex(conflict: Conflict): boolean {
    // Critical severity conflicts are too complex
    if (conflict.severity === ConflictSeverity.CRITICAL) {
      return true;
    }
    
    // Calculate a complexity score based on the conflict
    let complexityScore = 0;
    
    // More lines generally means more complex
    const lines1 = conflict.firstChange.modifiedCode.split('\n').length;
    const lines2 = conflict.secondChange.modifiedCode.split('\n').length;
    complexityScore += Math.max(lines1, lines2) / 10;
    
    // Overlapping conflicts are more complex
    if (conflict.type === ConflictType.OVERLAPPING) {
      complexityScore += 3;
    }
    
    // High severity conflicts are more complex
    if (conflict.severity === ConflictSeverity.HIGH) {
      complexityScore += 5;
    }
    
    return complexityScore > this.options.maxMergeComplexity;
  }
  
  /**
   * Merge overlapping changes
   * Returns [resolvedCode, description, warnings]
   */
  private mergeOverlappingChanges(conflict: Conflict): [string, string, string[]] {
    const change1 = conflict.firstChange;
    const change2 = conflict.secondChange;
    let warnings: string[] = []; // Changed from const to let to allow reassignment
    
    // If the changes make the exact same modification, take either one
    if (change1.modifiedCode === change2.modifiedCode) {
      return [
        change1.modifiedCode,
        'Both changes make identical modifications',
        []
      ];
    }
    
    // Get the original code and both modified versions
    const originalCode = change1.originalCode;
    const mod1 = change1.modifiedCode;
    const mod2 = change2.modifiedCode;
    
    let resolvedCode: string;
    
    if (this.options.useThreeWayMerge) {
      // Perform a three-way merge using the original as the base
      const mergeResult = this.performThreeWayMerge(originalCode, mod1, mod2);
      resolvedCode = mergeResult[0];
      warnings = mergeResult[1];
    } else {
      // Use the basic merge from the base class
      resolvedCode = super.mergeCode(mod1, mod2);
      warnings.push('Using basic merge strategy - results may need manual review');
    }
    
    return [
      resolvedCode,
      'Merged overlapping changes using three-way merge algorithm',
      warnings
    ];
  }
  
  /**
   * Merge adjacent changes
   * Returns [resolvedCode, description, warnings]
   */
  private mergeAdjacentChanges(conflict: Conflict): [string, string, string[]] {
    const change1 = conflict.firstChange;
    const change2 = conflict.secondChange;
    const warnings: string[] = [];
    
    // For adjacent changes, we want to apply both changes sequentially
    // We need to determine the correct order
    
    const isChange1First = change1.location.startLine < change2.location.startLine;
    
    let resolvedCode: string;
    
    if (isChange1First) {
      // Apply change1 followed by change2
      resolvedCode = this.applySequential(change1, change2);
    } else {
      // Apply change2 followed by change1
      resolvedCode = this.applySequential(change2, change1);
    }
    
    return [
      resolvedCode,
      'Merged adjacent changes by applying them sequentially',
      warnings
    ];
  }
  
  /**
   * Merge related changes
   * Returns [resolvedCode, description, warnings]
   */
  private mergeRelatedChanges(conflict: Conflict): [string, string, string[]] {
    // For related changes, we need a more sophisticated approach
    // This would involve semantic understanding of the code
    
    if (!this.options.attemptSemanticMerge) {
      // Fall back to the default merge if semantic merging is disabled
      return [
        super.mergeCode(conflict.firstChange.modifiedCode, conflict.secondChange.modifiedCode),
        'Merged related changes using basic merge strategy',
        ['Semantic merging disabled - results may need manual review']
      ];
    }
    
    // In a real implementation, this would use AST-based merging
    // For now, we'll use a placeholder implementation
    
    return [
      super.mergeCode(conflict.firstChange.modifiedCode, conflict.secondChange.modifiedCode),
      'Merged related changes using semantic analysis',
      ['Semantic merging is a placeholder - results may need manual review']
    ];
  }
  
  /**
   * Merge import changes
   * Returns [resolvedCode, description, warnings]
   */
  private mergeImportChanges(conflict: Conflict): [string, string, string[]] {
    // For import conflicts, we want to combine the imports intelligently
    // This is a simplified version - a real implementation would use AST parsing
    
    const warnings: string[] = [];
    
    // Split both changes into lines
    const lines1 = conflict.firstChange.modifiedCode.split('\n');
    const lines2 = conflict.secondChange.modifiedCode.split('\n');
    
    // Combine the lines, filtering out duplicates
    const combinedLines = new Set([...lines1, ...lines2]);
    
    // Sort the imports (simple heuristic)
    const sortedLines = Array.from(combinedLines).sort();
    
    return [
      sortedLines.join('\n'),
      'Merged import statements by combining and removing duplicates',
      warnings
    ];
  }
  
  /**
   * Apply changes sequentially
   * This is a simplified implementation - a real one would be more robust
   */
  private applySequential(first: { modifiedCode: string }, second: { modifiedCode: string }): string {
    // In a real implementation, this would properly calculate offsets and apply the changes
    // For now, we'll just concatenate the changes
    return `${first.modifiedCode}\n\n${second.modifiedCode}`;
  }
  
  /**
   * Perform a three-way merge
   * Returns [mergedCode, warnings]
   */
  private performThreeWayMerge(
    base: string,
    change1: string,
    change2: string
  ): [string, string[]] {
    const warnings: string[] = [];
    
    // Split into lines
    const baseLines = base.split('\n');
    const lines1 = change1.split('\n');
    const lines2 = change2.split('\n');
    
    // This is a simplified implementation
    // A real three-way merge would use a proper diff algorithm and conflict resolution
    
    // For now, we'll create a simple merge with conflict markers
    let result: string[] = [];
    let i = 0, j = 0, k = 0;
    
    while (i < baseLines.length || j < lines1.length || k < lines2.length) {
      // If both changes have the same line at this point, take it
      if (j < lines1.length && k < lines2.length && lines1[j] === lines2[k]) {
        result.push(lines1[j]);
        j++;
        k++;
        i++;
        continue;
      }
      
      // If change1 matches the base, take change2
      if (j < lines1.length && i < baseLines.length && lines1[j] === baseLines[i]) {
        result.push(lines2[k]);
        j++;
        k++;
        i++;
        continue;
      }
      
      // If change2 matches the base, take change1
      if (k < lines2.length && i < baseLines.length && lines2[k] === baseLines[i]) {
        result.push(lines1[j]);
        j++;
        k++;
        i++;
        continue;
      }
      
      // Conflict detected, add markers if enabled
      if (this.options.addConflictMarkers) {
        result.push('<<<<<<< CHANGE 1');
        while (j < lines1.length && (i >= baseLines.length || lines1[j] !== baseLines[i])) {
          result.push(lines1[j]);
          j++;
        }
        
        result.push('=======');
        
        while (k < lines2.length && (i >= baseLines.length || lines2[k] !== baseLines[i])) {
          result.push(lines2[k]);
          k++;
        }
        
        result.push('>>>>>>> CHANGE 2');
        
        warnings.push('Conflicts detected during merge - conflict markers added');
      } else {
        // Without markers, just include both sets of changes
        while (j < lines1.length && (i >= baseLines.length || lines1[j] !== baseLines[i])) {
          result.push(lines1[j]);
          j++;
        }
        
        while (k < lines2.length && (i >= baseLines.length || lines2[k] !== baseLines[i])) {
          result.push(lines2[k]);
          k++;
        }
        
        warnings.push('Conflicts detected during merge - both changes included');
      }
      
      // Move past the conflicting section in the base
      i++;
    }
    
    return [result.join('\n'), warnings];
  }
}
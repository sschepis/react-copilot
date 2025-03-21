import {
  ConflictType,
  ConflictSeverity,
  CodeChange,
  Conflict,
  ResolutionStrategy
} from '../types';
import { ConflictDetectorBase } from '../ConflictDetectorBase';

/**
 * Detector for overlapping code changes
 * Identifies conflicts when two changes modify the same lines of code
 */
export class OverlappingConflictDetector extends ConflictDetectorBase {
  constructor() {
    super('OverlappingConflictDetector', ConflictType.OVERLAPPING);
    
    // Default configuration
    this.options = {
      // How much the changes need to overlap to be considered a conflict (in lines)
      overlapThreshold: 1,
      // Whether to check for exact content matches when determining conflict severity
      checkExactContent: true,
      // Default severity for overlapping conflicts
      defaultSeverity: ConflictSeverity.MEDIUM
    };
  }
  
  /**
   * Detect if two code changes overlap
   */
  detectConflict(change1: CodeChange, change2: CodeChange): Conflict | null {
    // Skip if changes are in different files
    if (change1.location.filePath && change2.location.filePath && 
        change1.location.filePath !== change2.location.filePath) {
      return null;
    }
    
    // Check if the changes overlap
    if (!this.locationsOverlap(change1.location, change2.location)) {
      return null;
    }
    
    // Calculate how many lines overlap
    const overlapLines = this.calculateOverlapLines(change1.location, change2.location);
    
    // If overlap is below threshold, don't create a conflict
    if (overlapLines < this.options.overlapThreshold) {
      return null;
    }
    
    // Determine the severity of the conflict
    const severity = this.determineConflictSeverity(change1, change2, overlapLines);
    
    // Determine the suggested resolution strategy
    const suggestedStrategy = this.determineSuggestedStrategy(change1, change2, severity);
    
    // Create a description of the conflict
    const description = this.createConflictDescription(change1, change2, overlapLines);
    
    // Create and return the conflict
    const conflict = this.createConflict(
      change1,
      change2,
      severity,
      description,
      undefined, // use default location determination
      this.createConflictDetails(change1, change2, overlapLines)
    );
    
    // Add suggested strategy
    conflict.suggestedStrategy = suggestedStrategy;
    
    return conflict;
  }
  
  /**
   * Calculate how many lines overlap between two locations
   */
  private calculateOverlapLines(loc1: { startLine: number, endLine: number }, 
                               loc2: { startLine: number, endLine: number }): number {
    const overlapStart = Math.max(loc1.startLine, loc2.startLine);
    const overlapEnd = Math.min(loc1.endLine, loc2.endLine);
    
    return Math.max(0, overlapEnd - overlapStart + 1);
  }
  
  /**
   * Determine the severity of an overlapping conflict
   */
  private determineConflictSeverity(change1: CodeChange, change2: CodeChange, overlapLines: number): ConflictSeverity {
    // Calculate what percentage of each change is overlapping
    const percentOverlap1 = overlapLines / (change1.location.endLine - change1.location.startLine + 1);
    const percentOverlap2 = overlapLines / (change2.location.endLine - change2.location.startLine + 1);
    
    // If changes make the exact same modification, severity is NONE (no conflict)
    if (this.options.checkExactContent && 
        change1.modifiedCode === change2.modifiedCode) {
      return ConflictSeverity.NONE;
    }
    
    // If the changes completely overlap (100% of both changes)
    if (percentOverlap1 === 1 && percentOverlap2 === 1) {
      // And they result in different code, this is a HIGH severity conflict
      return ConflictSeverity.HIGH;
    }
    
    // If the overlap is significant but not complete
    if (percentOverlap1 > 0.5 || percentOverlap2 > 0.5) {
      return ConflictSeverity.MEDIUM;
    }
    
    // For minor overlaps
    return ConflictSeverity.LOW;
  }
  
  /**
   * Determine the suggested resolution strategy for the conflict
   */
  private determineSuggestedStrategy(
    change1: CodeChange, 
    change2: CodeChange, 
    severity: ConflictSeverity
  ): ResolutionStrategy {
    // For no actual conflict, take either change (they're the same)
    if (severity === ConflictSeverity.NONE) {
      return ResolutionStrategy.TAKE_FIRST;
    }
    
    // For high severity conflicts, manual resolution is safest
    if (severity === ConflictSeverity.HIGH || severity === ConflictSeverity.CRITICAL) {
      return ResolutionStrategy.MANUAL;
    }
    
    // For medium severity, try to merge
    if (severity === ConflictSeverity.MEDIUM) {
      return ResolutionStrategy.MERGE;
    }
    
    // For low severity, sequential application might work
    return ResolutionStrategy.SEQUENTIAL;
  }
  
  /**
   * Create a human-readable description of the conflict
   */
  private createConflictDescription(change1: CodeChange, change2: CodeChange, overlapLines: number): string {
    return `Overlapping code changes detected. ${overlapLines} line${overlapLines === 1 ? '' : 's'} of code are modified by both changes.`;
  }
  
  /**
   * Create detailed information about the conflict
   */
  private createConflictDetails(change1: CodeChange, change2: CodeChange, overlapLines: number): string {
    return `
Overlapping changes:
- First change modifies lines ${change1.location.startLine}-${change1.location.endLine}
- Second change modifies lines ${change2.location.startLine}-${change2.location.endLine}
- Overlap: ${overlapLines} line(s)

First change content:
\`\`\`
${change1.modifiedCode}
\`\`\`

Second change content:
\`\`\`
${change2.modifiedCode}
\`\`\`
`.trim();
  }
}
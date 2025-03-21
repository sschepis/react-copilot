import {
  ConflictType,
  ConflictSeverity,
  CodeChange,
  Conflict,
  ConflictLocation,
  IConflictDetector
} from './types';

/**
 * Base class for conflict detectors
 * Provides common functionality for detecting code conflicts
 */
export abstract class ConflictDetectorBase implements IConflictDetector {
  /** Detector name */
  readonly name: string;
  
  /** Conflict type this detector handles */
  readonly conflictType: ConflictType;
  
  /** Configuration options */
  protected options: Record<string, any> = {};
  
  constructor(name: string, conflictType: ConflictType) {
    this.name = name;
    this.conflictType = conflictType;
  }
  
  /**
   * Detect conflicts between two changes
   * This method must be implemented by specific detectors
   */
  abstract detectConflict(change1: CodeChange, change2: CodeChange): Conflict | null;
  
  /**
   * Configure the detector with specific options
   */
  configure(options: Record<string, any>): void {
    this.options = {
      ...this.options,
      ...options
    };
  }
  
  /**
   * Create a conflict object with standard fields
   */
  protected createConflict(
    change1: CodeChange,
    change2: CodeChange,
    severity: ConflictSeverity,
    description: string,
    location?: ConflictLocation,
    details?: string
  ): Conflict {
    return {
      type: this.conflictType,
      severity,
      firstChange: change1,
      secondChange: change2,
      description,
      location: location || this.determineConflictLocation(change1, change2),
      details
    };
  }
  
  /**
   * Determine the location of a conflict based on the changes
   */
  protected determineConflictLocation(change1: CodeChange, change2: CodeChange): ConflictLocation {
    // By default, use the union of both change locations
    const startLine = Math.min(change1.location.startLine, change2.location.startLine);
    const endLine = Math.max(change1.location.endLine, change2.location.endLine);
    
    return {
      startLine,
      endLine,
      filePath: change1.location.filePath || change2.location.filePath
    };
  }
  
  /**
   * Check if two locations overlap
   */
  protected locationsOverlap(loc1: ConflictLocation, loc2: ConflictLocation): boolean {
    // Different files can't overlap
    if (loc1.filePath && loc2.filePath && loc1.filePath !== loc2.filePath) {
      return false;
    }
    
    // Check for line overlap
    return !(loc1.endLine < loc2.startLine || loc1.startLine > loc2.endLine);
  }
  
  /**
   * Check if two locations are adjacent
   */
  protected locationsAdjacent(
    loc1: ConflictLocation,
    loc2: ConflictLocation,
    threshold: number = 3
  ): boolean {
    // Different files can't be adjacent
    if (loc1.filePath && loc2.filePath && loc1.filePath !== loc2.filePath) {
      return false;
    }
    
    // Check if they're within the threshold distance
    return (
      (loc1.endLine + threshold >= loc2.startLine && loc1.endLine < loc2.startLine) ||
      (loc2.endLine + threshold >= loc1.startLine && loc2.endLine < loc1.startLine)
    );
  }
  
  /**
   * Calculate the distance between two locations (in lines)
   */
  protected locationDistance(loc1: ConflictLocation, loc2: ConflictLocation): number {
    // Different files have infinite distance
    if (loc1.filePath && loc2.filePath && loc1.filePath !== loc2.filePath) {
      return Infinity;
    }
    
    // If they overlap, distance is 0
    if (this.locationsOverlap(loc1, loc2)) {
      return 0;
    }
    
    // Otherwise, calculate the gap
    return loc1.startLine > loc2.endLine
      ? loc1.startLine - loc2.endLine
      : loc2.startLine - loc1.endLine;
  }
}
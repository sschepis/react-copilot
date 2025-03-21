import {
  ConflictType,
  ConflictSeverity,
  Conflict,
  ResolutionStrategy,
  ResolutionResult,
  IConflictResolver
} from './types';

/**
 * Base class for conflict resolvers
 * Provides common functionality for resolving code conflicts
 */
export abstract class ConflictResolverBase implements IConflictResolver {
  /** Resolver name */
  readonly name: string;
  
  /** Resolution strategy this resolver implements */
  readonly strategy: ResolutionStrategy;
  
  /** Configuration options */
  protected options: Record<string, any> = {};
  
  constructor(name: string, strategy: ResolutionStrategy) {
    this.name = name;
    this.strategy = strategy;
  }
  
  /**
   * Resolve a conflict
   * This method must be implemented by specific resolvers
   */
  abstract resolveConflict(conflict: Conflict): ResolutionResult;
  
  /**
   * Check if this resolver can handle the given conflict
   * Override in specific resolvers for more precise handling
   */
  canResolve(conflict: Conflict): boolean {
    // By default, check if the conflict's suggested strategy matches this resolver's strategy
    if (conflict.suggestedStrategy) {
      return conflict.suggestedStrategy === this.strategy;
    }
    
    // Otherwise, use a default resolution check based on conflict type and severity
    return this.canHandleByDefault(conflict);
  }
  
  /**
   * Configure the resolver with specific options
   */
  configure(options: Record<string, any>): void {
    this.options = {
      ...this.options,
      ...options
    };
  }
  
  /**
   * Check if this resolver can handle the conflict by default
   * (when no suggested strategy is provided)
   */
  protected canHandleByDefault(conflict: Conflict): boolean {
    // Default implementation based on conflict severity
    // Higher severity conflicts typically require more sophisticated resolution strategies
    
    // Example: Simple strategies like TAKE_FIRST or TAKE_SECOND can handle low severity conflicts
    if ((this.strategy === ResolutionStrategy.TAKE_FIRST || 
         this.strategy === ResolutionStrategy.TAKE_SECOND) && 
        conflict.severity === ConflictSeverity.LOW) {
      return true;
    }
    
    // Example: MERGE strategy can handle medium severity conflicts
    if (this.strategy === ResolutionStrategy.MERGE && 
        (conflict.severity === ConflictSeverity.LOW || 
         conflict.severity === ConflictSeverity.MEDIUM)) {
      return true;
    }
    
    // Example: SEQUENTIAL strategy can handle specific conflict types
    if (this.strategy === ResolutionStrategy.SEQUENTIAL && 
        (conflict.type === ConflictType.ADJACENT || 
         conflict.type === ConflictType.RELATED)) {
      return true;
    }
    
    // Example: MANUAL strategy is required for critical conflicts
    if (this.strategy === ResolutionStrategy.MANUAL && 
        conflict.severity === ConflictSeverity.CRITICAL) {
      return true;
    }
    
    // By default, return false for unknown cases
    return false;
  }
  
  /**
   * Create a successful resolution result
   */
  protected createSuccessResult(
    conflict: Conflict,
    resolvedCode: string,
    description: string,
    warnings: string[] = []
  ): ResolutionResult {
    return {
      success: true,
      resolvedCode,
      description,
      strategy: this.strategy,
      originalConflict: conflict,
      warnings
    };
  }
  
  /**
   * Create a failed resolution result
   */
  protected createFailureResult(
    conflict: Conflict,
    error: string
  ): ResolutionResult {
    return {
      success: false,
      error,
      strategy: this.strategy,
      originalConflict: conflict
    };
  }
  
  /**
   * Merge two code blocks with a basic algorithm
   * Override this in specific resolvers for better merging algorithms
   */
  protected mergeCode(code1: string, code2: string): string {
    // This is a very simple merge - real implementations would be more sophisticated
    const lines1 = code1.split('\n');
    const lines2 = code2.split('\n');
    
    // Find common lines at the beginning
    let commonStart = 0;
    while (commonStart < lines1.length && 
           commonStart < lines2.length && 
           lines1[commonStart] === lines2[commonStart]) {
      commonStart++;
    }
    
    // Find common lines at the end
    let commonEnd = 0;
    while (commonEnd < lines1.length - commonStart && 
           commonEnd < lines2.length - commonStart && 
           lines1[lines1.length - 1 - commonEnd] === lines2[lines2.length - 1 - commonEnd]) {
      commonEnd++;
    }
    
    // Extract the common parts and the different middle parts
    const prefix = lines1.slice(0, commonStart);
    const suffix = lines1.slice(lines1.length - commonEnd);
    
    const middle1 = lines1.slice(commonStart, lines1.length - commonEnd);
    const middle2 = lines2.slice(commonStart, lines2.length - commonEnd);
    
    // Simple merge: combine the middle parts with a marker
    const merged = [
      ...prefix,
      "/* BEGIN MERGE */",
      ...middle1,
      "/* MERGE SEPARATOR */",
      ...middle2,
      "/* END MERGE */",
      ...suffix
    ];
    
    return merged.join('\n');
  }
}
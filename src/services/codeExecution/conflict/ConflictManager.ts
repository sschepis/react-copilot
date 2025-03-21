import {
  CodeChange,
  Conflict,
  ConflictDetectionOptions,
  ConflictResolutionOptions,
  ResolutionResult,
  ResolutionStrategy,
  IConflictDetector,
  IConflictResolver
} from './types';

// Import detectors
import { OverlappingConflictDetector } from './detectors/OverlappingConflictDetector';

// Import resolvers
import { MergeResolver } from './resolvers/MergeResolver';

/**
 * Manager for conflict detection and resolution
 * Coordinates the use of specialized detectors and resolvers
 */
export class ConflictManager {
  private detectors: Map<string, IConflictDetector> = new Map();
  private resolvers: Map<ResolutionStrategy, IConflictResolver> = new Map();
  
  private detectionOptions: ConflictDetectionOptions = {
    detectOverlapping: true,
    detectAdjacent: true,
    detectRelated: true,
    detectSemantic: true,
    detectImport: true,
    detectDependency: true,
    adjacencyThreshold: 3
  };
  
  private resolutionOptions: ConflictResolutionOptions = {
    defaultStrategy: ResolutionStrategy.MERGE,
    autoResolve: true
  };
  
  /**
   * Create a new ConflictManager with default detectors and resolvers
   */
  constructor() {
    // Register default detectors
    this.registerDetector(new OverlappingConflictDetector());
    
    // Register default resolvers
    this.registerResolver(new MergeResolver());
  }
  
  /**
   * Register a conflict detector
   */
  registerDetector(detector: IConflictDetector): void {
    this.detectors.set(detector.name, detector);
  }
  
  /**
   * Unregister a conflict detector
   */
  unregisterDetector(name: string): boolean {
    return this.detectors.delete(name);
  }
  
  /**
   * Register a conflict resolver
   */
  registerResolver(resolver: IConflictResolver): void {
    this.resolvers.set(resolver.strategy, resolver);
  }
  
  /**
   * Unregister a conflict resolver
   */
  unregisterResolver(strategy: ResolutionStrategy): boolean {
    return this.resolvers.delete(strategy);
  }
  
  /**
   * Configure conflict detection options
   */
  configureDetection(options: Partial<ConflictDetectionOptions>): void {
    this.detectionOptions = {
      ...this.detectionOptions,
      ...options
    };
    
    // Update detector configurations
    this.detectors.forEach(detector => {
      detector.configure(this.detectionOptions);
    });
  }
  
  /**
   * Configure conflict resolution options
   */
  configureResolution(options: Partial<ConflictResolutionOptions>): void {
    this.resolutionOptions = {
      ...this.resolutionOptions,
      ...options
    };
    
    // Update resolver configurations
    this.resolvers.forEach(resolver => {
      resolver.configure(this.resolutionOptions);
    });
  }
  
  /**
   * Detect conflicts between two sets of code changes
   */
  detectConflicts(changes1: CodeChange[], changes2: CodeChange[]): Conflict[] {
    const conflicts: Conflict[] = [];
    
    // Check all combinations of changes for conflicts
    for (const change1 of changes1) {
      for (const change2 of changes2) {
        // Run each detector
        for (const detector of this.detectors.values()) {
          try {
            const conflict = detector.detectConflict(change1, change2);
            if (conflict) {
              conflicts.push(conflict);
            }
          } catch (error) {
            console.error(`Error in ${detector.name}:`, error);
          }
        }
      }
    }
    
    return conflicts;
  }
  
  /**
   * Resolve a conflict using the appropriate resolver
   */
  resolveConflict(conflict: Conflict): ResolutionResult {
    // Determine which resolver to use
    // Ensure we have a valid strategy by providing fallbacks
    const strategy = conflict.suggestedStrategy ?? 
                     this.resolutionOptions.defaultStrategy ?? 
                     ResolutionStrategy.MANUAL;
    
    // Get the resolver for this strategy
    const resolver = this.resolvers.get(strategy);
    
    if (!resolver) {
      return {
        success: false,
        error: `No resolver available for strategy: ${strategy}`,
        strategy: ResolutionStrategy.MANUAL,
        originalConflict: conflict
      };
    }
    
    // Check if the resolver can handle this conflict
    if (!resolver.canResolve(conflict)) {
      return {
        success: false,
        error: `Resolver ${resolver.name} cannot resolve this conflict`,
        strategy: ResolutionStrategy.MANUAL,
        originalConflict: conflict
      };
    }
    
    try {
      // Attempt to resolve the conflict
      return resolver.resolveConflict(conflict);
    } catch (error) {
      return {
        success: false,
        error: `Error during resolution: ${error instanceof Error ? error.message : String(error)}`,
        strategy: ResolutionStrategy.MANUAL,
        originalConflict: conflict
      };
    }
  }
  
  /**
   * Resolve all conflicts automatically (when possible)
   */
  resolveConflicts(conflicts: Conflict[]): ResolutionResult[] {
    return conflicts.map(conflict => {
      // Skip auto-resolution if it's disabled
      if (!this.resolutionOptions.autoResolve) {
        return {
          success: false,
          error: 'Auto-resolution is disabled',
          strategy: ResolutionStrategy.MANUAL,
          originalConflict: conflict
        };
      }
      
      // Skip if the conflict severity is above the auto-resolve threshold
      if (this.resolutionOptions.autoResolveThreshold && 
          conflict.severity > this.resolutionOptions.autoResolveThreshold) {
        return {
          success: false,
          error: `Conflict severity (${conflict.severity}) exceeds auto-resolve threshold`,
          strategy: ResolutionStrategy.MANUAL,
          originalConflict: conflict
        };
      }
      
      // Attempt to resolve the conflict
      return this.resolveConflict(conflict);
    });
  }
  
  /**
   * Detect and resolve conflicts between two sets of changes
   * Returns both the conflicts and their resolutions
   */
  processChanges(changes1: CodeChange[], changes2: CodeChange[]): {
    conflicts: Conflict[];
    resolutions: ResolutionResult[];
  } {
    const conflicts = this.detectConflicts(changes1, changes2);
    const resolutions = this.resolveConflicts(conflicts);
    
    return {
      conflicts,
      resolutions
    };
  }
  
  /**
   * Get all registered detectors
   */
  getDetectors(): IConflictDetector[] {
    return Array.from(this.detectors.values());
  }
  
  /**
   * Get all registered resolvers
   */
  getResolvers(): IConflictResolver[] {
    return Array.from(this.resolvers.values());
  }
}
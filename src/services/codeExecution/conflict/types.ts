import * as ts from 'typescript';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

/**
 * Type of code change conflict
 */
export enum ConflictType {
  /** Changes in the same lines */
  OVERLAPPING = 'overlapping',
  /** Changes in adjacent lines that might affect each other */
  ADJACENT = 'adjacent',
  /** Changes in related code units (function, class, etc.) */
  RELATED = 'related',
  /** Changes that might cause semantic conflicts */
  SEMANTIC = 'semantic',
  /** Conflicts in import statements */
  IMPORT = 'import',
  /** Conflicts in dependency/package versions */
  DEPENDENCY = 'dependency'
}

/**
 * Severity level for conflicts
 */
export enum ConflictSeverity {
  /** No actual conflict, just informational */
  NONE = 'none',
  /** Low-risk conflict that can be automatically resolved */
  LOW = 'low',
  /** Medium-risk conflict that needs review but has a suggested resolution */
  MEDIUM = 'medium',
  /** High-risk conflict that requires manual resolution */
  HIGH = 'high',
  /** Critical conflict that must be resolved before proceeding */
  CRITICAL = 'critical'
}

/**
 * Strategy for resolving conflicts
 */
export enum ResolutionStrategy {
  /** Take the first change */
  TAKE_FIRST = 'take_first',
  /** Take the second change */
  TAKE_SECOND = 'take_second',
  /** Merge both changes if possible */
  MERGE = 'merge',
  /** Apply the changes sequentially */
  SEQUENTIAL = 'sequential',
  /** Custom resolution logic */
  CUSTOM = 'custom',
  /** Manual resolution required */
  MANUAL = 'manual'
}

/**
 * Location in code where a conflict occurs
 */
export interface ConflictLocation {
  /** Start line number (1-based) */
  startLine: number;
  /** End line number (1-based) */
  endLine: number;
  /** Start column (0-based) */
  startColumn?: number;
  /** End column (0-based) */
  endColumn?: number;
  /** Path to the file */
  filePath?: string;
  /** Affected code unit (function, class, variable, etc.) */
  codeUnit?: string;
  /** Type of code unit (function, class, variable, etc.) */
  codeUnitType?: string;
}

/**
 * Represents a code change
 */
export interface CodeChange {
  /** Original code */
  originalCode: string;
  /** Modified code */
  modifiedCode: string;
  /** Location of the change */
  location: ConflictLocation;
  /** Metadata about the change */
  metadata?: Record<string, any>;
  /** AST of the original code (if available) */
  originalAst?: ts.SourceFile | any;
  /** AST of the modified code (if available) */
  modifiedAst?: ts.SourceFile | any;
}

/**
 * Represents a conflict between code changes
 */
export interface Conflict {
  /** Type of conflict */
  type: ConflictType;
  /** Severity of the conflict */
  severity: ConflictSeverity;
  /** First change involved in the conflict */
  firstChange: CodeChange;
  /** Second change involved in the conflict */
  secondChange: CodeChange;
  /** Description of the conflict */
  description: string;
  /** Location of the conflict */
  location: ConflictLocation;
  /** Suggested resolution strategy */
  suggestedStrategy?: ResolutionStrategy;
  /** Additional information about the conflict */
  details?: string;
}

/**
 * Options for conflict detection
 */
export interface ConflictDetectionOptions {
  /** Whether to detect overlapping changes */
  detectOverlapping?: boolean;
  /** Whether to detect adjacent changes */
  detectAdjacent?: boolean;
  /** Whether to detect related changes */
  detectRelated?: boolean;
  /** Whether to detect semantic conflicts */
  detectSemantic?: boolean;
  /** Whether to detect import conflicts */
  detectImport?: boolean;
  /** Whether to detect dependency conflicts */
  detectDependency?: boolean;
  /** Maximum distance between adjacent changes to consider (in lines) */
  adjacencyThreshold?: number;
  /** Custom detection rules */
  customRules?: CustomDetectionRule[];
}

/**
 * Custom rule for conflict detection
 */
export interface CustomDetectionRule {
  /** Name of the rule */
  name: string;
  /** Function that detects conflicts */
  detect: (change1: CodeChange, change2: CodeChange) => Conflict | null;
}

/**
 * Result of a conflict resolution
 */
export interface ResolutionResult {
  /** Whether the resolution was successful */
  success: boolean;
  /** The resolved code */
  resolvedCode?: string;
  /** Error message if resolution failed */
  error?: string;
  /** Description of the resolution */
  description?: string;
  /** Strategy used for resolution */
  strategy: ResolutionStrategy;
  /** Original conflict that was resolved */
  originalConflict: Conflict;
  /** Warnings about the resolution */
  warnings?: string[];
}

/**
 * Options for conflict resolution
 */
export interface ConflictResolutionOptions {
  /** Default strategy to use for resolution */
  defaultStrategy?: ResolutionStrategy;
  /** Strategy overrides for specific conflict types */
  strategyOverrides?: Record<ConflictType, ResolutionStrategy>;
  /** Custom resolution functions */
  customResolvers?: Record<string, CustomResolver>;
  /** Whether to automatically resolve conflicts when possible */
  autoResolve?: boolean;
  /** Severity threshold above which conflicts should not be auto-resolved */
  autoResolveThreshold?: ConflictSeverity;
}

/**
 * Custom resolver function
 */
export interface CustomResolver {
  /** Name of the resolver */
  name: string;
  /** Function that resolves a conflict */
  resolve: (conflict: Conflict) => ResolutionResult;
}

/**
 * Interface for conflict detectors
 */
export interface IConflictDetector {
  /** Detector name */
  readonly name: string;
  /** Conflict type this detector handles */
  readonly conflictType: ConflictType;
  /** Detect conflicts between two changes */
  detectConflict(change1: CodeChange, change2: CodeChange): Conflict | null;
  /** Configure the detector */
  configure(options: Record<string, any>): void;
}

/**
 * Interface for conflict resolvers
 */
export interface IConflictResolver {
  /** Resolver name */
  readonly name: string;
  /** Resolution strategy this resolver implements */
  readonly strategy: ResolutionStrategy;
  /** Resolve a conflict */
  resolveConflict(conflict: Conflict): ResolutionResult;
  /** Check if this resolver can handle the given conflict */
  canResolve(conflict: Conflict): boolean;
  /** Configure the resolver */
  configure(options: Record<string, any>): void;
}
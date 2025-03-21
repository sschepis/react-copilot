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
  /** Skip both changes */
  SKIP_BOTH = 'skip_both',
  /** Resolve manually */
  MANUAL = 'manual'
}

/**
 * Represents a single code change
 */
export interface CodeChange {
  /** File path */
  filePath: string;
  /** Starting line */
  startLine: number;
  /** Ending line */
  endLine: number;
  /** Original content */
  oldContent: string;
  /** New content */
  newContent: string;
  /** Change ID or identifier */
  changeId: string;
  /** User or source that created the change */
  author?: string;
  /** Timestamp of the change */
  timestamp?: Date;
  /** Change description */
  description?: string;
}

/**
 * Represents a conflict between two code changes
 */
export interface ChangeConflict {
  /** First change */
  change1: CodeChange;
  /** Second change */
  change2: CodeChange;
  /** Type of conflict */
  type: ConflictType;
  /** Severity level */
  severity: ConflictSeverity;
  /** Suggested resolution strategy */
  suggestedStrategy: ResolutionStrategy;
  /** Conflict description */
  description: string;
  /** Merged content if available */
  mergedContent?: string;
  /** Lines of code affected by the conflict */
  affectedLines: number[];
  /** Code elements affected (functions, classes, etc.) */
  affectedElements?: string[];
  /** Alternative resolution strategies */
  alternativeStrategies?: ResolutionStrategy[];
}

/**
 * Configuration for conflict resolver
 */
export interface ConflictResolverOptions {
  /** Auto-resolve conflicts below this severity */
  autoResolveSeverity?: ConflictSeverity;
  /** Detection sensitivity (higher means more potential conflicts are detected) */
  detectionSensitivity?: number;
  /** Whether to perform semantic analysis for conflict detection */
  performSemanticAnalysis?: boolean;
  /** Whether to consider import conflicts */
  detectImportConflicts?: boolean;
  /** Maximum distance (in lines) to consider for adjacent conflicts */
  adjacentLinesThreshold?: number;
  /** Whether to attempt to merge overlapping changes */
  attemptMerge?: boolean;
  /** Whether to detect conflicts in related code elements */
  detectRelatedConflicts?: boolean;
}

/**
 * Result of conflict analysis
 */
export interface ConflictAnalysisResult {
  /** List of detected conflicts */
  conflicts: ChangeConflict[];
  /** Changes with no conflicts */
  nonConflictingChanges: CodeChange[];
  /** Auto-resolved conflicts */
  autoResolved: {
    conflict: ChangeConflict;
    strategyUsed: ResolutionStrategy;
    resolvedContent: string;
  }[];
  /** Unresolved conflicts */
  unresolvedConflicts: ChangeConflict[];
  /** Statistics about conflict detection */
  stats: {
    totalChanges: number;
    totalConflicts: number;
    autoResolved: number;
    unresolvedConflicts: number;
    bySeverity: Record<ConflictSeverity, number>;
    byType: Record<ConflictType, number>;
  };
}

/**
 * Service for detecting and resolving code change conflicts
 */
export class ConflictResolver {
  private options: Required<ConflictResolverOptions>;
  
  constructor(options: ConflictResolverOptions = {}) {
    // Set default options
    this.options = {
      autoResolveSeverity: options.autoResolveSeverity ?? ConflictSeverity.LOW,
      detectionSensitivity: options.detectionSensitivity ?? 0.7,
      performSemanticAnalysis: options.performSemanticAnalysis ?? true,
      detectImportConflicts: options.detectImportConflicts ?? true,
      adjacentLinesThreshold: options.adjacentLinesThreshold ?? 3,
      attemptMerge: options.attemptMerge ?? true,
      detectRelatedConflicts: options.detectRelatedConflicts ?? true
    };
  }
  
  /**
   * Detect and resolve conflicts in a list of changes
   * 
   * @param changes List of code changes
   * @returns Conflict analysis result
   */
  detectAndResolveConflicts(changes: CodeChange[]): ConflictAnalysisResult {
    // Group changes by file
    const changesByFile = this.groupChangesByFile(changes);
    
    // Initialize result
    const result: ConflictAnalysisResult = {
      conflicts: [],
      nonConflictingChanges: [],
      autoResolved: [],
      unresolvedConflicts: [],
      stats: {
        totalChanges: changes.length,
        totalConflicts: 0,
        autoResolved: 0,
        unresolvedConflicts: 0,
        bySeverity: {
          [ConflictSeverity.NONE]: 0,
          [ConflictSeverity.LOW]: 0,
          [ConflictSeverity.MEDIUM]: 0,
          [ConflictSeverity.HIGH]: 0,
          [ConflictSeverity.CRITICAL]: 0
        },
        byType: {
          [ConflictType.OVERLAPPING]: 0,
          [ConflictType.ADJACENT]: 0,
          [ConflictType.RELATED]: 0,
          [ConflictType.SEMANTIC]: 0,
          [ConflictType.IMPORT]: 0,
          [ConflictType.DEPENDENCY]: 0
        }
      }
    };
    
    // Detect conflicts within each file
    for (const [filePath, fileChanges] of changesByFile.entries()) {
      // Skip files with only one change
      if (fileChanges.length <= 1) {
        result.nonConflictingChanges.push(...fileChanges);
        continue;
      }
      
      // Sort changes by start line
      fileChanges.sort((a, b) => a.startLine - b.startLine);
      
      // Check for conflicts between all pairs of changes
      for (let i = 0; i < fileChanges.length; i++) {
        for (let j = i + 1; j < fileChanges.length; j++) {
          const conflict = this.detectConflict(fileChanges[i], fileChanges[j]);
          
          if (conflict) {
            result.conflicts.push(conflict);
            result.stats.totalConflicts++;
            result.stats.bySeverity[conflict.severity]++;
            result.stats.byType[conflict.type]++;
            
            // Try to auto-resolve if severity is below threshold
            if (this.canAutoResolve(conflict)) {
              const resolution = this.applyResolutionStrategy(conflict, conflict.suggestedStrategy);
              
              if (resolution) {
                result.autoResolved.push({
                  conflict,
                  strategyUsed: conflict.suggestedStrategy,
                  resolvedContent: resolution
                });
                result.stats.autoResolved++;
              } else {
                result.unresolvedConflicts.push(conflict);
                result.stats.unresolvedConflicts++;
              }
            } else {
              result.unresolvedConflicts.push(conflict);
              result.stats.unresolvedConflicts++;
            }
          }
        }
      }
      
      // Add changes without conflicts to non-conflicting list
      const conflictingChangeIds = new Set(
        result.conflicts.flatMap(conflict => [conflict.change1.changeId, conflict.change2.changeId])
      );
      
      for (const change of fileChanges) {
        if (!conflictingChangeIds.has(change.changeId)) {
          result.nonConflictingChanges.push(change);
        }
      }
    }
    
    return result;
  }
  
  /**
   * Apply a specific resolution strategy to a conflict
   * 
   * @param conflict Conflict to resolve
   * @param strategy Resolution strategy to apply
   * @returns Resolved content or undefined if resolution failed
   */
  applyResolutionStrategy(
    conflict: ChangeConflict, 
    strategy: ResolutionStrategy
  ): string | undefined {
    const { change1, change2 } = conflict;
    
    switch (strategy) {
      case ResolutionStrategy.TAKE_FIRST:
        return change1.newContent;
        
      case ResolutionStrategy.TAKE_SECOND:
        return change2.newContent;
        
      case ResolutionStrategy.MERGE:
        return this.mergeChanges(conflict);
        
      case ResolutionStrategy.SEQUENTIAL:
        // Apply first change, then apply second change to the result
        return this.applySequential(change1, change2);
        
      case ResolutionStrategy.SKIP_BOTH:
        return change1.oldContent;
        
      case ResolutionStrategy.MANUAL:
        // Can't auto-resolve with manual strategy
        return undefined;
        
      default:
        return undefined;
    }
  }
  
  /**
   * Apply changes sequentially (first change, then second)
   * 
   * @param change1 First change
   * @param change2 Second change
   * @returns Resolved content or undefined if resolution failed
   */
  private applySequential(change1: CodeChange, change2: CodeChange): string | undefined {
    try {
      // First, apply change1
      const intermediatePath = change1.filePath;
      const intermediateContent = change1.newContent;
      
      // Then, apply change2's diff to the intermediate content
      // For simplicity, we'll assume the changes are to different parts of the code
      // A more robust implementation would apply the actual diff
      
      // Convert contents to lines
      const intermediateLines = intermediateContent.split('\n');
      const oldLines = change2.oldContent.split('\n');
      const newLines = change2.newContent.split('\n');
      
      // Calculate the diff between old and new
      const diff = this.simpleDiff(oldLines, newLines);
      
      // Apply the diff to the intermediate content
      const resultLines = [...intermediateLines];
      
      // Apply deletes first (from back to front to avoid index issues)
      for (let i = diff.deletes.length - 1; i >= 0; i--) {
        const { line, count } = diff.deletes[i];
        if (line >= 0 && line < resultLines.length) {
          resultLines.splice(line, count);
        }
      }
      
      // Then apply inserts (from front to back)
      for (const { line, text } of diff.inserts) {
        if (line >= 0 && line <= resultLines.length) {
          resultLines.splice(line, 0, text);
        }
      }
      
      return resultLines.join('\n');
    } catch (error) {
      console.error('Error applying sequential changes:', error);
      return undefined;
    }
  }
  
  /**
   * Attempt to merge conflicting changes
   * 
   * @param conflict Conflict to resolve
   * @returns Merged content or undefined if merge failed
   */
  private mergeChanges(conflict: ChangeConflict): string | undefined {
    const { change1, change2, type } = conflict;
    
    // If the conflict already has merged content, use it
    if (conflict.mergedContent) {
      return conflict.mergedContent;
    }
    
    try {
      switch (type) {
        case ConflictType.IMPORT:
          return this.mergeImports(change1, change2);
          
        case ConflictType.OVERLAPPING:
          // For overlapping changes, we need a more sophisticated merge algorithm
          return this.mergeOverlappingChanges(change1, change2);
          
        case ConflictType.ADJACENT:
          // For adjacent changes, we can usually just concatenate them
          return this.mergeAdjacentChanges(change1, change2);
          
        case ConflictType.RELATED:
        case ConflictType.SEMANTIC:
          // These are harder to merge automatically
          return undefined;
          
        case ConflictType.DEPENDENCY:
          // For dependency conflicts, usually take the higher version
          return this.mergeDependencyChanges(change1, change2);
          
        default:
          return undefined;
      }
    } catch (error) {
      console.error('Error merging changes:', error);
      return undefined;
    }
  }
  
  /**
   * Merge changes to import statements
   * 
   * @param change1 First change
   * @param change2 Second change
   * @returns Merged content or undefined if merge failed
   */
  private mergeImports(change1: CodeChange, change2: CodeChange): string | undefined {
    try {
      // Parse imports from both changes
      const imports1 = this.extractImports(change1.newContent);
      const imports2 = this.extractImports(change2.newContent);
      
      // Combine unique imports
      const uniqueImports = new Map<string, string>();
      
      // Add imports from change1
      for (const [module, names] of imports1) {
        uniqueImports.set(module, names);
      }
      
      // Add or merge imports from change2
      for (const [module, names] of imports2) {
        if (uniqueImports.has(module)) {
          // Merge named imports
          const existingNames = uniqueImports.get(module) || '';
          const mergedNames = this.mergeNamedImports(existingNames, names);
          uniqueImports.set(module, mergedNames);
        } else {
          uniqueImports.set(module, names);
        }
      }
      
      // Reconstruct import statements
      const importStatements = Array.from(uniqueImports.entries()).map(([module, names]) => {
        if (!names || names === '*') {
          return `import '${module}';`;
        } else if (names === 'default') {
          return `import ${module.split('/').pop()} from '${module}';`;
        } else {
          return `import ${names} from '${module}';`;
        }
      });
      
      // Get the rest of the file content (excluding imports)
      const nonImportContent = this.getNonImportContent(change1.newContent, change2.newContent);
      
      // Combine imports and non-import content
      return [...importStatements, '', nonImportContent].join('\n');
    } catch (error) {
      console.error('Error merging imports:', error);
      return undefined;
    }
  }
  
  /**
   * Extract imports from code content
   * 
   * @param content Code content
   * @returns Map of module paths to import specifiers
   */
  private extractImports(content: string): Map<string, string> {
    const imports = new Map<string, string>();
    const importRegex = /import\s+([^;]+)\s+from\s+['"]([^'"]+)['"]/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const [_, importClause, modulePath] = match;
      imports.set(modulePath, importClause.trim());
    }
    
    return imports;
  }
  
  /**
   * Merge named imports from two import statements
   * 
   * @param names1 First import specifier
   * @param names2 Second import specifier
   * @returns Merged import specifier
   */
  private mergeNamedImports(names1: string, names2: string): string {
    // Handle default imports
    const hasDefault1 = /^\w+(?:,|$)/.test(names1);
    const hasDefault2 = /^\w+(?:,|$)/.test(names2);
    
    let defaultImport = '';
    if (hasDefault1) {
      defaultImport = names1.match(/^(\w+)(?:,|$)/)![1];
    } else if (hasDefault2) {
      defaultImport = names2.match(/^(\w+)(?:,|$)/)![1];
    }
    
    // Extract named imports
    const namedImports1 = new Set<string>();
    const namedImports2 = new Set<string>();
    
    if (names1.includes('{')) {
      const namedMatch = names1.match(/{\s*([^}]+)\s*}/);
      if (namedMatch) {
        namedMatch[1].split(',').map(name => namedImports1.add(name.trim()));
      }
    }
    
    if (names2.includes('{')) {
      const namedMatch = names2.match(/{\s*([^}]+)\s*}/);
      if (namedMatch) {
        namedMatch[1].split(',').map(name => namedImports2.add(name.trim()));
      }
    }
    
    // Combine named imports
    const allNamedImports = new Set([...namedImports1, ...namedImports2]);
    
    // Reconstruct import clause
    if (defaultImport && allNamedImports.size > 0) {
      return `${defaultImport}, { ${Array.from(allNamedImports).join(', ')} }`;
    } else if (defaultImport) {
      return defaultImport;
    } else if (allNamedImports.size > 0) {
      return `{ ${Array.from(allNamedImports).join(', ')} }`;
    } else {
      return names1 || names2; // Fallback to one of the original strings
    }
  }
  
  /**
   * Extract non-import content from two code changes
   * 
   * @param content1 First content
   * @param content2 Second content
   * @returns Non-import content
   */
  private getNonImportContent(content1: string, content2: string): string {
    // Simple implementation: take all content after the last import statement
    // from the longer content
    const getContentAfterImports = (content: string): string => {
      const lines = content.split('\n');
      let lastImportLine = -1;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
          lastImportLine = i;
        }
      }
      
      if (lastImportLine === -1) {
        return content;
      }
      
      return lines.slice(lastImportLine + 1).join('\n');
    };
    
    const nonImport1 = getContentAfterImports(content1);
    const nonImport2 = getContentAfterImports(content2);
    
    return nonImport1.length >= nonImport2.length ? nonImport1 : nonImport2;
  }
  
  /**
   * Merge overlapping changes
   * 
   * @param change1 First change
   * @param change2 Second change
   * @returns Merged content or undefined if merge failed
   */
  private mergeOverlappingChanges(change1: CodeChange, change2: CodeChange): string | undefined {
    // We need to find the precise overlap and merge the changes intelligently
    // This is a complex operation that might require AST-based merging
    
    // For simplicity, we'll implement a line-based merge
    const lines1 = change1.newContent.split('\n');
    const lines2 = change2.newContent.split('\n');
    
    // Determine overlapping lines
    const overlapStart = Math.max(change1.startLine, change2.startLine);
    const overlapEnd = Math.min(change1.endLine, change2.endLine);
    
    if (overlapStart > overlapEnd) {
      // No actual line overlap
      return this.mergeAdjacentChanges(change1, change2);
    }
    
    // Extract the overlapping sections
    const overlap1 = lines1.slice(
      overlapStart - change1.startLine, 
      overlapEnd - change1.startLine + 1
    );
    
    const overlap2 = lines2.slice(
      overlapStart - change2.startLine, 
      overlapEnd - change2.startLine + 1
    );
    
    // Check if the overlapping sections are identical
    if (JSON.stringify(overlap1) === JSON.stringify(overlap2)) {
      // If they're identical, we can merge them easily
      const result = [...lines1];
      
      // Insert any lines from change2 that aren't in the overlap
      if (change2.startLine < change1.startLine) {
        const prefixCount = change1.startLine - change2.startLine;
        result.unshift(...lines2.slice(0, prefixCount));
      }
      
      if (change2.endLine > change1.endLine) {
        const suffixStart = overlap2.length + (change1.endLine - overlapEnd);
        result.push(...lines2.slice(suffixStart));
      }
      
      return result.join('\n');
    }
    
    // If the overlapping sections are different, we need a more sophisticated merge
    // Here we'll use a simple approach of keeping change1's version of the overlap
    // A more sophisticated implementation would use a diff algorithm
    
    const warning = '// CONFLICTING CHANGES MERGED - PLEASE REVIEW\n';
    
    // Build the merged content
    const merged: string[] = [];
    
    // Add lines before overlap
    if (change1.startLine < overlapStart) {
      merged.push(...lines1.slice(0, overlapStart - change1.startLine));
    } else if (change2.startLine < overlapStart) {
      merged.push(...lines2.slice(0, overlapStart - change2.startLine));
    }
    
    // Add a comment indicating the conflict
    merged.push(warning);
    
    // Add both versions of the overlap with comments
    merged.push('// VERSION 1:');
    merged.push(...overlap1);
    merged.push('// VERSION 2:');
    merged.push(...overlap2);
    
    // For now, choose the first version
    merged.push('// MERGED (using version 1):');
    merged.push(...overlap1);
    
    // Add lines after overlap
    if (change1.endLine > overlapEnd) {
      merged.push(...lines1.slice(overlapEnd - change1.startLine + 1));
    } else if (change2.endLine > overlapEnd) {
      merged.push(...lines2.slice(overlapEnd - change2.startLine + 1));
    }
    
    return merged.join('\n');
  }
  
  /**
   * Merge adjacent changes
   * 
   * @param change1 First change
   * @param change2 Second change
   * @returns Merged content
   */
  private mergeAdjacentChanges(change1: CodeChange, change2: CodeChange): string {
    // Determine which change comes first
    const [first, second] = change1.startLine <= change2.startLine ?
      [change1, change2] : [change2, change1];
    
    // Get the original content to use as a base
    const originalLines = first.oldContent.split('\n');
    
    // Apply both changes
    const resultLines = [...originalLines];
    
    // Apply first change
    const firstChangeStart = first.startLine - 1; // Convert to 0-based
    const firstChangeEnd = first.endLine - 1;
    const firstChangeLines = first.newContent.split('\n');
    
    resultLines.splice(
      firstChangeStart,
      firstChangeEnd - firstChangeStart + 1,
      ...firstChangeLines
    );
    
    // Calculate the shift due to the first change
    const lengthDiff = firstChangeLines.length - (firstChangeEnd - firstChangeStart + 1);
    
    // Apply second change with adjusted line numbers
    const secondChangeStart = second.startLine - 1 + lengthDiff; // Adjust for first change
    const secondChangeEnd = second.endLine - 1 + lengthDiff;
    const secondChangeLines = second.newContent.split('\n');
    
    resultLines.splice(
      secondChangeStart,
      secondChangeEnd - secondChangeStart + 1,
      ...secondChangeLines
    );
    
    return resultLines.join('\n');
  }
  
  /**
   * Merge dependency changes
   * 
   * @param change1 First change
   * @param change2 Second change
   * @returns Merged content
   */
  private mergeDependencyChanges(change1: CodeChange, change2: CodeChange): string | undefined {
    try {
      // Parse the dependencies from both changes
      const deps1 = this.parseDependencies(change1.newContent);
      const deps2 = this.parseDependencies(change2.newContent);
      
      // Take the highest version for each dependency
      const mergedDeps = new Map<string, string>();
      
      // Add all dependencies from change1
      for (const [dep, version] of deps1) {
        mergedDeps.set(dep, version);
      }
      
      // Add or update dependencies from change2
      for (const [dep, version] of deps2) {
        if (mergedDeps.has(dep)) {
          // Compare versions and take the higher one
          const existingVersion = mergedDeps.get(dep) || '';
          const higherVersion = this.getHigherVersion(existingVersion, version);
          mergedDeps.set(dep, higherVersion);
        } else {
          mergedDeps.set(dep, version);
        }
      }
      
      // Reconstruct the dependency section
      let mergedContent = change1.newContent;
      
      // Replace the dependency section
      for (const [dep, version] of mergedDeps) {
        const regex = new RegExp(`("${dep}"\\s*:\\s*")([^"]+)(")`, 'g');
        mergedContent = mergedContent.replace(regex, `$1${version}$3`);
      }
      
      return mergedContent;
    } catch (error) {
      console.error('Error merging dependencies:', error);
      return undefined;
    }
  }
  
  /**
   * Parse dependencies from package.json content
   * 
   * @param content package.json content
   * @returns Map of dependency names to versions
   */
  private parseDependencies(content: string): Map<string, string> {
    const dependencies = new Map<string, string>();
    
    try {
      const packageJson = JSON.parse(content);
      
      // Handle regular dependencies
      if (packageJson.dependencies) {
        for (const [name, version] of Object.entries(packageJson.dependencies)) {
          dependencies.set(name, version as string);
        }
      }
      
      // Handle dev dependencies
      if (packageJson.devDependencies) {
        for (const [name, version] of Object.entries(packageJson.devDependencies)) {
          dependencies.set(`dev:${name}`, version as string);
        }
      }
    } catch (error) {
      console.error('Error parsing dependencies:', error);
    }
    
    return dependencies;
  }
  
  /**
   * Compare two semver versions and return the higher one
   * 
   * @param version1 First version
   * @param version2 Second version
   * @returns Higher version
   */
  private getHigherVersion(version1: string, version2: string): string {
    // Simple semver comparison (not handling all cases)
    // A proper implementation would use a semver library
    
    // Handle special cases
    if (version1.startsWith('^') && !version2.startsWith('^')) {
      return version1;
    }
    if (version2.startsWith('^') && !version1.startsWith('^')) {
      return version2;
    }
    
    // Remove prefix characters
    const cleanV1 = version1.replace(/[^\d.]/g, '');
    const cleanV2 = version2.replace(/[^\d.]/g, '');
    
    // Split into components
    const parts1 = cleanV1.split('.').map(Number);
    const parts2 = cleanV2.split('.').map(Number);
    
    // Pad with zeros
    while (parts1.length < 3) parts1.push(0);
    while (parts2.length < 3) parts2.push(0);
    
    // Compare major, minor, patch
    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return version1;
      if (parts2[i] > parts1[i]) return version2;
    }
    
    // Same version, prefer the original format
    return version1;
  }
  
  /**
   * Detect conflicts between two code changes
   * 
   * @param change1 First change
   * @param change2 Second change
   * @returns Detected conflict or undefined if no conflict
   */
  private detectConflict(change1: CodeChange, change2: CodeChange): ChangeConflict | undefined {
    // Check for overlapping changes
    if (this.isOverlapping(change1, change2)) {
      return this.createOverlapConflict(change1, change2);
    }
    
    // Check for adjacent changes
    if (this.isAdjacent(change1, change2)) {
      return this.createAdjacentConflict(change1, change2);
    }
    
    // Check for related code elements
    if (this.options.detectRelatedConflicts && this.isRelated(change1, change2)) {
      return this.createRelatedConflict(change1, change2);
    }
    
    // Check for semantic conflicts
    if (this.options.performSemanticAnalysis && this.hasSemanticConflict(change1, change2)) {
      return this.createSemanticConflict(change1, change2);
    }
    
    // Check for import conflicts
    if (this.options.detectImportConflicts && this.hasImportConflict(change1, change2)) {
      return this.createImportConflict(change1, change2);
    }
    
    // Check for dependency conflicts
    if (change1.filePath.endsWith('package.json') && change2.filePath.endsWith('package.json')) {
      const depConflict = this.checkDependencyConflict(change1, change2);
      if (depConflict) {
        return depConflict;
      }
    }
    
    return undefined;
  }
  
  /**
   * Check if two changes overlap
   * 
   * @param change1 First change
   * @param change2 Second change
   * @returns Whether the changes overlap
   */
  private isOverlapping(change1: CodeChange, change2: CodeChange): boolean {
    return change1.filePath === change2.filePath &&
      change1.startLine <= change2.endLine &&
      change2.startLine <= change1.endLine;
  }
  
  /**
   * Create a conflict for overlapping changes
   * 
   * @param change1 First change
   * @param change2 Second change
   * @returns Conflict object
   */
  private createOverlapConflict(change1: CodeChange, change2: CodeChange): ChangeConflict {
    // Determine affected lines
    const affectedLines = this.getOverlappingLines(change1, change2);
    
    // Determine severity based on the nature of the changes
    const severity = this.determineOverlapSeverity(change1, change2);
    
    // Extract affected code elements
    const affectedElements = [
      ...this.extractCodeElements(change1.newContent),
      ...this.extractCodeElements(change2.newContent)
    ];
    
    // Determine the suggested resolution strategy
    const suggestedStrategy = this.determineSuggestedStrategy(change1, change2, severity);
    
    // Create the conflict object
    return {
      change1,
      change2,
      type: ConflictType.OVERLAPPING,
      severity,
      suggestedStrategy,
      description: `Overlapping changes in ${change1.filePath} (lines ${affectedLines.join(', ')})`,
      affectedLines,
      affectedElements,
      alternativeStrategies: this.getAlternativeStrategies(suggestedStrategy)
    };
  }
  
  /**
   * Get lines affected by the overlap
   * 
   * @param change1 First change
   * @param change2 Second change
   * @returns Array of line numbers
   */
  private getOverlappingLines(change1: CodeChange, change2: CodeChange): number[] {
    const start = Math.max(change1.startLine, change2.startLine);
    const end = Math.min(change1.endLine, change2.endLine);
    
    const lines: number[] = [];
    for (let i = start; i <= end; i++) {
      lines.push(i);
    }
    
    return lines;
  }
  
  /**
   * Determine the severity of an overlap conflict
   * 
   * @param change1 First change
   * @param change2 Second change
   * @returns Conflict severity
   */
  private determineOverlapSeverity(change1: CodeChange, change2: CodeChange): ConflictSeverity {
    // Simple check - if the changes make very different modifications, consider it high severity
    const content1 = change1.newContent;
    const content2 = change2.newContent;
    
    // If the changes are identical, no conflict
    if (content1 === content2) {
      return ConflictSeverity.NONE;
    }
    
    // Calculate similarity between changes
    const similarity = this.calculateSimilarity(content1, content2);
    
    if (similarity > 0.9) {
      return ConflictSeverity.LOW;
    } else if (similarity > 0.7) {
      return ConflictSeverity.MEDIUM;
    } else if (similarity > 0.4) {
      return ConflictSeverity.HIGH;
    } else {
      return ConflictSeverity.CRITICAL;
    }
  }
  
  /**
   * Calculate similarity between two strings (0-1)
   * 
   * @param str1 First string
   * @param str2 Second string
   * @returns Similarity score (0-1)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    // Calculate Levenshtein distance
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    
    if (maxLength === 0) return 1;
    
    // Convert distance to similarity
    return 1 - distance / maxLength;
  }
  
  /**
   * Calculate Levenshtein distance between two strings
   * 
   * @param str1 First string
   * @param str2 Second string
   * @returns Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const track = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i;
    }
    
    for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const ind = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + ind // substitution
        );
      }
    }
    
    return track[str2.length][str1.length];
  }
  
  /**
   * Determine the best resolution strategy for a conflict
   * 
   * @param change1 First change
   * @param change2 Second change
   * @param severity Conflict severity
   * @returns Suggested resolution strategy
   */
  private determineSuggestedStrategy(
    change1: CodeChange, 
    change2: CodeChange, 
    severity: ConflictSeverity
  ): ResolutionStrategy {
    if (severity === ConflictSeverity.NONE) {
      // If changes are basically the same, use either one
      return ResolutionStrategy.TAKE_FIRST;
    }
    
    if (severity === ConflictSeverity.LOW) {
      // If changes are similar, try to merge them
      return ResolutionStrategy.MERGE;
    }
    
    if (severity === ConflictSeverity.MEDIUM) {
      // If changes are somewhat different, try to merge but may need manual review
      return this.options.attemptMerge ? 
        ResolutionStrategy.MERGE : 
        ResolutionStrategy.MANUAL;
    }
    
    // For high/critical severity, require manual resolution
    return ResolutionStrategy.MANUAL;
  }
  
  /**
   * Get alternative strategies for a suggested strategy
   * 
   * @param suggestedStrategy Suggested strategy
   * @returns Alternative strategies
   */
  private getAlternativeStrategies(suggestedStrategy: ResolutionStrategy): ResolutionStrategy[] {
    // Return all strategies except the suggested one and manual (which is always available)
    const allStrategies = [
      ResolutionStrategy.TAKE_FIRST,
      ResolutionStrategy.TAKE_SECOND,
      ResolutionStrategy.MERGE,
      ResolutionStrategy.SEQUENTIAL,
      ResolutionStrategy.SKIP_BOTH
    ];
    
    return allStrategies.filter(s => s !== suggestedStrategy);
  }
  
  /**
   * Check if two changes are adjacent
   * 
   * @param change1 First change
   * @param change2 Second change
   * @returns Whether the changes are adjacent
   */
  private isAdjacent(change1: CodeChange, change2: CodeChange): boolean {
    if (change1.filePath !== change2.filePath) {
      return false;
    }
    
    const threshold = this.options.adjacentLinesThreshold;
    
    // Adjacent if end of change1 is close to start of change2
    // or end of change2 is close to start of change1
    return (change1.endLine + threshold >= change2.startLine && 
            change1.endLine < change2.startLine) ||
           (change2.endLine + threshold >= change1.startLine && 
            change2.endLine < change1.startLine);
  }
  
  /**
   * Create a conflict for adjacent changes
   * 
   * @param change1 First change
   * @param change2 Second change
   * @returns Conflict object
   */
  private createAdjacentConflict(change1: CodeChange, change2: CodeChange): ChangeConflict {
    // Determine the gap between the changes
    const gap = change1.startLine > change2.endLine ?
      change1.startLine - change2.endLine :
      change2.startLine - change1.endLine;
    
    // Severity depends on the gap
    const severity = gap <= 1 ? ConflictSeverity.MEDIUM : ConflictSeverity.LOW;
    
    // Affected lines include both changes and the gap
    const affectedLines = this.getAdjacentLines(change1, change2);
    
    // Extract affected code elements
    const affectedElements = [
      ...this.extractCodeElements(change1.newContent),
      ...this.extractCodeElements(change2.newContent)
    ];
    
    // Most adjacent changes can be merged or applied sequentially
    const suggestedStrategy = ResolutionStrategy.SEQUENTIAL;
    
    return {
      change1,
      change2,
      type: ConflictType.ADJACENT,
      severity,
      suggestedStrategy,
      description: `Adjacent changes in ${change1.filePath} with ${gap} line${gap === 1 ? '' : 's'} between them`,
      affectedLines,
      affectedElements,
      alternativeStrategies: this.getAlternativeStrategies(suggestedStrategy)
    };
  }
  
  /**
   * Get lines affected by adjacent changes
   * 
   * @param change1 First change
   * @param change2 Second change
   * @returns Array of line numbers
   */
  private getAdjacentLines(change1: CodeChange, change2: CodeChange): number[] {
    let start: number, end: number;
    
    if (change1.startLine < change2.startLine) {
      start = change1.startLine;
      end = change2.endLine;
    } else {
      start = change2.startLine;
      end = change1.endLine;
    }
    
    const lines: number[] = [];
    for (let i = start; i <= end; i++) {
      lines.push(i);
    }
    
    return lines;
  }
  
  /**
   * Check if two changes are related (affect related code elements)
   * 
   * @param change1 First change
   * @param change2 Second change
   * @returns Whether the changes are related
   */
  private isRelated(change1: CodeChange, change2: CodeChange): boolean {
    if (change1.filePath !== change2.filePath) {
      return false;
    }
    
    const elements1 = this.extractCodeElements(change1.oldContent);
    const elements2 = this.extractCodeElements(change2.oldContent);
    
    // Check for shared elements
    for (const element of elements1) {
      if (elements2.includes(element)) {
        return true;
      }
    }
    
    // Check for references between elements
    const refs1 = this.extractReferences(change1.oldContent);
    const refs2 = this.extractReferences(change2.oldContent);
    
    for (const element of elements1) {
      if (refs2.includes(element)) {
        return true;
      }
    }
    
    for (const element of elements2) {
      if (refs1.includes(element)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Create a conflict for related changes
   * 
   * @param change1 First change
   * @param change2 Second change
   * @returns Conflict object
   */
  private createRelatedConflict(change1: CodeChange, change2: CodeChange): ChangeConflict {
    // Related changes usually have medium severity
    const severity = ConflictSeverity.MEDIUM;
    
    // Extract affected code elements
    const elements1 = this.extractCodeElements(change1.oldContent);
    const elements2 = this.extractCodeElements(change2.oldContent);
    
    // Find shared elements
    const sharedElements = elements1.filter(e => elements2.includes(e));
    
    // Find references between elements
    const refs1 = this.extractReferences(change1.oldContent);
    const refs2 = this.extractReferences(change2.oldContent);
    
    const relationElements = [
      ...elements1.filter(e => refs2.includes(e)),
      ...elements2.filter(e => refs1.includes(e))
    ];
    
    const affectedElements = [...new Set([...sharedElements, ...relationElements])];
    
    // Affected lines are all lines from both changes
    const affectedLines = [
      ...Array.from({ length: change1.endLine - change1.startLine + 1 }, (_, i) => change1.startLine + i),
      ...Array.from({ length: change2.endLine - change2.startLine + 1 }, (_, i) => change2.startLine + i)
    ];
    
    // Most related changes should be applied sequentially
    const suggestedStrategy = ResolutionStrategy.SEQUENTIAL;
    
    return {
      change1,
      change2,
      type: ConflictType.RELATED,
      severity,
      suggestedStrategy,
      description: `Related changes in ${change1.filePath} affecting ${affectedElements.join(', ')}`,
      affectedLines,
      affectedElements,
      alternativeStrategies: this.getAlternativeStrategies(suggestedStrategy)
    };
  }
  
  /**
   * Check if two changes have semantic conflicts
   * 
   * @param change1 First change
   * @param change2 Second change
   * @returns Whether the changes have semantic conflicts
   */
  private hasSemanticConflict(change1: CodeChange, change2: CodeChange): boolean {
    // This requires deep code analysis
    // For simplicity, we'll just check a few common cases
    
    if (change1.filePath !== change2.filePath) {
      return false;
    }
    
    // Check for function signature changes
    const signatures1 = this.extractFunctionSignatures(change1.newContent);
    const signatures2 = this.extractFunctionSignatures(change2.newContent);
    
    for (const [name, params1] of signatures1) {
      if (signatures2.has(name)) {
        const params2 = signatures2.get(name)!;
        if (params1 !== params2) {
          return true; // Function signature conflict
        }
      }
    }
    
    // Check for variable type changes
    const varTypes1 = this.extractVariableTypes(change1.newContent);
    const varTypes2 = this.extractVariableTypes(change2.newContent);
    
    for (const [name, type1] of varTypes1) {
      if (varTypes2.has(name)) {
        const type2 = varTypes2.get(name)!;
        if (type1 !== type2) {
          return true; // Variable type conflict
        }
      }
    }
    
    return false;
  }
  
  /**
   * Create a conflict for semantic conflicts
   * 
   * @param change1 First change
   * @param change2 Second change
   * @returns Conflict object
   */
  private createSemanticConflict(change1: CodeChange, change2: CodeChange): ChangeConflict {
    // Semantic conflicts are usually high severity
    const severity = ConflictSeverity.HIGH;
    
    // Find conflicting elements
    const conflicts: string[] = [];
    
    // Check for function signature conflicts
    const signatures1 = this.extractFunctionSignatures(change1.newContent);
    const signatures2 = this.extractFunctionSignatures(change2.newContent);
    
    for (const [name, params1] of signatures1) {
      if (signatures2.has(name)) {
        const params2 = signatures2.get(name)!;
        if (params1 !== params2) {
          conflicts.push(`Function ${name} (signature change)`);
        }
      }
    }
    
    // Check for variable type conflicts
    const varTypes1 = this.extractVariableTypes(change1.newContent);
    const varTypes2 = this.extractVariableTypes(change2.newContent);
    
    for (const [name, type1] of varTypes1) {
      if (varTypes2.has(name)) {
        const type2 = varTypes2.get(name)!;
        if (type1 !== type2) {
          conflicts.push(`Variable ${name} (type change)`);
        }
      }
    }
    
    // Affected elements
    const affectedElements = conflicts;
    
    // Affected lines are all lines from both changes
    const affectedLines = [
      ...Array.from({ length: change1.endLine - change1.startLine + 1 }, (_, i) => change1.startLine + i),
      ...Array.from({ length: change2.endLine - change2.startLine + 1 }, (_, i) => change2.startLine + i)
    ];
    
    // Semantic conflicts usually require manual resolution
    const suggestedStrategy = ResolutionStrategy.MANUAL;
    
    return {
      change1,
      change2,
      type: ConflictType.SEMANTIC,
      severity,
      suggestedStrategy,
      description: `Semantic conflicts in ${change1.filePath}: ${conflicts.join(', ')}`,
      affectedLines,
      affectedElements,
      alternativeStrategies: [
        ResolutionStrategy.TAKE_FIRST,
        ResolutionStrategy.TAKE_SECOND
      ]
    };
  }
  
  /**
   * Check if two changes have import conflicts
   * 
   * @param change1 First change
   * @param change2 Second change
   * @returns Whether the changes have import conflicts
   */
  private hasImportConflict(change1: CodeChange, change2: CodeChange): boolean {
    if (change1.filePath !== change2.filePath) {
      return false;
    }
    
    // Check if both changes modify import statements
    const importRegex = /import\s+.+\s+from\s+['"].+['"];?/g;
    const hasImports1 = importRegex.test(change1.newContent);
    
    // Reset regex state
    importRegex.lastIndex = 0;
    
    const hasImports2 = importRegex.test(change2.newContent);
    
    return hasImports1 && hasImports2;
  }
  
  /**
   * Create a conflict for import conflicts
   * 
   * @param change1 First change
   * @param change2 Second change
   * @returns Conflict object
   */
  private createImportConflict(change1: CodeChange, change2: CodeChange): ChangeConflict {
    // Import conflicts usually have low severity
    const severity = ConflictSeverity.LOW;
    
    // Extract imports
    const imports1 = this.extractImports(change1.newContent);
    const imports2 = this.extractImports(change2.newContent);
    
    // Find conflicting imports
    const conflictingImports: string[] = [];
    
    for (const [module, names1] of imports1) {
      if (imports2.has(module)) {
        const names2 = imports2.get(module)!;
        if (names1 !== names2 && names1 !== '*' && names2 !== '*') {
          conflictingImports.push(`Import from '${module}'`);
        }
      }
    }
    
    // Affected lines are typically at the top of the file
    const affectedLines = [
      ...Array.from({ length: 10 }, (_, i) => i + 1) // Assume imports are in the first 10 lines
    ];
    
    // Import conflicts can often be merged
    const suggestedStrategy = ResolutionStrategy.MERGE;
    
    return {
      change1,
      change2,
      type: ConflictType.IMPORT,
      severity,
      suggestedStrategy,
      description: `Import conflicts in ${change1.filePath}: ${conflictingImports.join(', ')}`,
      affectedLines,
      affectedElements: conflictingImports,
      mergedContent: this.mergeImports(change1, change2),
      alternativeStrategies: this.getAlternativeStrategies(suggestedStrategy)
    };
  }
  
  /**
   * Check for dependency conflicts in package.json
   * 
   * @param change1 First change
   * @param change2 Second change
   * @returns Conflict or undefined if no conflict
   */
  private checkDependencyConflict(change1: CodeChange, change2: CodeChange): ChangeConflict | undefined {
    try {
      // Parse dependencies
      const deps1 = this.parseDependencies(change1.newContent);
      const deps2 = this.parseDependencies(change2.newContent);
      
      // Check for version conflicts
      const conflicts: string[] = [];
      
      for (const [dep, version1] of deps1) {
        if (deps2.has(dep)) {
          const version2 = deps2.get(dep)!;
          if (version1 !== version2) {
            conflicts.push(`${dep}: ${version1} vs ${version2}`);
          }
        }
      }
      
      if (conflicts.length === 0) {
        return undefined;
      }
      
      // Dependency conflicts usually have medium severity
      const severity = ConflictSeverity.MEDIUM;
      
      // Try to merge by taking the highest version
      const mergedContent = this.mergeDependencyChanges(change1, change2);
      
      return {
        change1,
        change2,
        type: ConflictType.DEPENDENCY,
        severity,
        suggestedStrategy: ResolutionStrategy.MERGE,
        description: `Dependency version conflicts: ${conflicts.join(', ')}`,
        affectedLines: [],
        affectedElements: conflicts.map(c => c.split(':')[0]),
        mergedContent,
        alternativeStrategies: [
          ResolutionStrategy.TAKE_FIRST,
          ResolutionStrategy.TAKE_SECOND
        ]
      };
    } catch (error) {
      console.error('Error checking dependency conflicts:', error);
      return undefined;
    }
  }
  
  /**
   * Simple diff algorithm that identifies inserts and deletes
   * 
   * @param oldLines Old lines
   * @param newLines New lines
   * @returns Diff operations
   */
  private simpleDiff(oldLines: string[], newLines: string[]): {
    inserts: { line: number; text: string }[];
    deletes: { line: number; count: number }[];
  } {
    const inserts: { line: number; text: string }[] = [];
    const deletes: { line: number; count: number }[] = [];
    
    let i = 0, j = 0;
    
    while (i < oldLines.length || j < newLines.length) {
      if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
        // Lines match, move both pointers
        i++;
        j++;
      } else {
        // Lines don't match, try to find next match
        let matchInOld = -1;
        let matchInNew = -1;
        
        // Look ahead in old lines for a match
        for (let k = i + 1; k < oldLines.length && matchInOld === -1; k++) {
          if (oldLines[k] === newLines[j]) {
            matchInOld = k;
          }
        }
        
        // Look ahead in new lines for a match
        for (let k = j + 1; k < newLines.length && matchInNew === -1; k++) {
          if (oldLines[i] === newLines[k]) {
            matchInNew = k;
          }
        }
        
        if (matchInOld !== -1 && (matchInNew === -1 || matchInOld - i < matchInNew - j)) {
          // Delete lines from old until match
          deletes.push({ line: i, count: matchInOld - i });
          i = matchInOld;
        } else if (matchInNew !== -1) {
          // Insert lines from new until match
          for (let k = j; k < matchInNew; k++) {
            inserts.push({ line: i, text: newLines[k] });
          }
          j = matchInNew;
        } else {
          // No match found, delete old line and insert new line
          if (i < oldLines.length) {
            deletes.push({ line: i, count: 1 });
            i++;
          }
          if (j < newLines.length) {
            inserts.push({ line: i, text: newLines[j] });
            j++;
          }
        }
      }
    }
    
    return { inserts, deletes };
  }
  
  /**
   * Extract code elements (functions, classes, etc.) from code
   * 
   * @param code Source code
   * @returns Array of element names
   */
  private extractCodeElements(code: string): string[] {
    if (!code) {
      return [];
    }
    
    const elements: string[] = [];
    
    // Extract function declarations
    const functionRegex = /function\s+(\w+)/g;
    let match: RegExpExecArray | null;
    
    while ((match = functionRegex.exec(code)) !== null) {
      elements.push(match[1]);
    }
    
    // Extract class declarations
    const classRegex = /class\s+(\w+)/g;
    while ((match = classRegex.exec(code)) !== null) {
      elements.push(match[1]);
    }
    
    // Extract arrow functions and variables
    const arrowFunctionRegex = /const\s+(\w+)\s*=/g;
    while ((match = arrowFunctionRegex.exec(code)) !== null) {
      elements.push(match[1]);
    }
    
    // Extract interfaces and types
    const typeRegex = /(interface|type)\s+(\w+)/g;
    while ((match = typeRegex.exec(code)) !== null) {
      elements.push(match[2]);
    }
    
    return [...new Set(elements)];
  }
  
  /**
   * Extract references to code elements
   * 
   * @param code Source code
   * @returns Array of referenced names
   */
  private extractReferences(code: string): string[] {
    if (!code) {
      return [];
    }
    
    // This is a simplified implementation
    // A real implementation would parse the AST to find actual references
    
    // Extract all identifiers
    const identifierRegex = /\b([A-Z]\w*)\b/g;
    const matches = code.match(identifierRegex) || [];
    
    return [...new Set(matches)];
  }
  
  /**
   * Extract function signatures
   * 
   * @param code Source code
   * @returns Map of function names to parameter lists
   */
  private extractFunctionSignatures(code: string): Map<string, string> {
    const signatures = new Map<string, string>();
    
    // Match function declarations and their parameter lists
    const functionRegex = /function\s+(\w+)\s*\((.*?)\)/g;
    let match: RegExpExecArray | null;
    
    while ((match = functionRegex.exec(code)) !== null) {
      signatures.set(match[1], match[2]);
    }
    
    // Match arrow function declarations
    const arrowFunctionRegex = /const\s+(\w+)\s*=\s*(?:\((.*?)\)|(\w+))\s*=>/g;
    while ((match = arrowFunctionRegex.exec(code)) !== null) {
      signatures.set(match[1], match[2] || match[3] || '');
    }
    
    return signatures;
  }
  
  /**
   * Extract variable types
   * 
   * @param code Source code
   * @returns Map of variable names to types
   */
  private extractVariableTypes(code: string): Map<string, string> {
    const varTypes = new Map<string, string>();
    
    // Match variable declarations with type annotations
    const varRegex = /(?:const|let|var)\s+(\w+)\s*:\s*([^=;]+)/g;
    let match: RegExpExecArray | null;
    
    while ((match = varRegex.exec(code)) !== null) {
      varTypes.set(match[1], match[2].trim());
    }
    
    return varTypes;
  }
  
  /**
   * Group changes by file path
   * 
   * @param changes List of changes
   * @returns Map of file paths to changes
   */
  private groupChangesByFile(changes: CodeChange[]): Map<string, CodeChange[]> {
    const result = new Map<string, CodeChange[]>();
    
    for (const change of changes) {
      const fileChanges = result.get(change.filePath) || [];
      fileChanges.push(change);
      result.set(change.filePath, fileChanges);
    }
    
    return result;
  }
  
  /**
   * Check if a conflict can be auto-resolved
   * 
   * @param conflict Conflict to check
   * @returns Whether the conflict can be auto-resolved
   */
  private canAutoResolve(conflict: ChangeConflict): boolean {
    const { severity, suggestedStrategy } = conflict;
    
    const autoResolveSeverities = [
      ConflictSeverity.NONE,
      ConflictSeverity.LOW
    ];
    
    // Add medium severity if configured
    if (this.options.autoResolveSeverity === ConflictSeverity.MEDIUM) {
      autoResolveSeverities.push(ConflictSeverity.MEDIUM);
    }
    
    return autoResolveSeverities.includes(severity) && 
           suggestedStrategy !== ResolutionStrategy.MANUAL;
  }
}

export default ConflictResolver;
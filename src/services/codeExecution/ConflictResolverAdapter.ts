/**
 * Adapter for maintaining compatibility with the original ConflictResolver API
 * This allows existing code to continue working while transitioning to the new architecture
 */

import * as ts from 'typescript';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

import {
  ConflictType,
  ConflictSeverity,
  ResolutionStrategy,
  CodeChange,
  Conflict,
  ResolutionResult,
  defaultConflictManager,
  detectConflicts,
  resolveConflict,
  processChanges,
  configureDetection,
  configureResolution
} from './conflict';

/**
 * @deprecated Use the modular conflict resolution system from the 'conflict' directory instead
 */
export class ConflictResolver {
  /**
   * Detect conflicts between code changes
   * 
   * @deprecated Use detectConflicts from the conflict module instead
   */
  static detectConflicts(
    changes1: any[],
    changes2: any[],
    options: any = {}
  ): any[] {
    console.warn(
      'ConflictResolver.detectConflicts is deprecated. ' + 
      'Use detectConflicts from the conflict module instead.'
    );
    
    // Configure the default manager with provided options
    configureDetection(options);
    
    // Use the new system to detect conflicts
    return detectConflicts(changes1, changes2);
  }
  
  /**
   * Resolve a conflict between code changes
   * 
   * @deprecated Use resolveConflict from the conflict module instead
   */
  static resolveConflict(
    conflict: any,
    strategy: string = 'merge',
    options: any = {}
  ): any {
    console.warn(
      'ConflictResolver.resolveConflict is deprecated. ' + 
      'Use resolveConflict from the conflict module instead.'
    );
    
    // Ensure the conflict has a suggested strategy based on the provided parameter
    if (strategy) {
      // Map the old string-based strategy to the new enum
      let strategyEnum: ResolutionStrategy;
      
      switch (strategy) {
        case 'merge':
          strategyEnum = ResolutionStrategy.MERGE;
          break;
        case 'take_first':
          strategyEnum = ResolutionStrategy.TAKE_FIRST;
          break;
        case 'take_second':
          strategyEnum = ResolutionStrategy.TAKE_SECOND;
          break;
        case 'sequential':
          strategyEnum = ResolutionStrategy.SEQUENTIAL;
          break;
        case 'manual':
          strategyEnum = ResolutionStrategy.MANUAL;
          break;
        default:
          strategyEnum = ResolutionStrategy.MERGE;
      }
      
      // Set the suggested strategy on the conflict
      conflict.suggestedStrategy = strategyEnum;
    }
    
    // Configure the default manager with provided options
    configureResolution(options);
    
    // Use the new system to resolve the conflict
    return resolveConflict(conflict);
  }
  
  /**
   * Check if conflicts can be auto-resolved
   * 
   * @deprecated Use processChanges from the conflict module instead
   */
  static canAutoResolve(conflict: any): boolean {
    console.warn(
      'ConflictResolver.canAutoResolve is deprecated. ' + 
      'Use the conflict module instead.'
    );
    
    // In the new system, this would depend on the conflict severity and available resolvers
    // For compatibility, we'll check if any resolver can handle it
    const result = resolveConflict(conflict);
    return result.success;
  }
  
  /**
   * Get the type of a conflict
   * 
   * @deprecated Use conflict.type from the conflict module instead
   */
  static getConflictType(change1: any, change2: any): string {
    console.warn(
      'ConflictResolver.getConflictType is deprecated. ' + 
      'Use the conflict module instead.'
    );
    
    // Detect conflicts between these two changes
    const conflicts = detectConflicts([change1], [change2]);
    
    // Return the type of the first conflict found, or 'none'
    return conflicts.length > 0 ? conflicts[0].type : 'none';
  }
  
  /**
   * Get the severity of a conflict
   * 
   * @deprecated Use conflict.severity from the conflict module instead
   */
  static getConflictSeverity(conflict: any): string {
    console.warn(
      'ConflictResolver.getConflictSeverity is deprecated. ' + 
      'Use conflict.severity from the conflict module instead.'
    );
    
    return conflict.severity || 'low';
  }
  
  /**
   * Check if locations overlap
   * 
   * @deprecated Use the conflict module instead
   */
  static locationsOverlap(loc1: any, loc2: any): boolean {
    console.warn(
      'ConflictResolver.locationsOverlap is deprecated. ' + 
      'Use the conflict module instead.'
    );
    
    // Different files can't overlap
    if (loc1.filePath && loc2.filePath && loc1.filePath !== loc2.filePath) {
      return false;
    }
    
    // Check for line overlap
    return !(loc1.endLine < loc2.startLine || loc1.startLine > loc2.endLine);
  }
}
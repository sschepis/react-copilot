/**
 * Code Execution Services
 * 
 * This module provides services for analyzing, generating, and executing code changes
 * in a safe and controlled manner.
 */

// Re-export from enhanced code execution
export * from './enhancedCodeExecution';

// Re-export from the new modular style system
export * from './style';

// Selective re-exports from conflict and explainer to avoid naming conflicts
// Conflict module exports
import {
  ConflictType,
  ConflictSeverity,
  ResolutionStrategy,
  Conflict,
  ResolutionResult,
  detectConflicts,
  resolveConflict,
  processChanges as processConflicts,
  ConflictDetectorBase,
  ConflictResolverBase,
  ConflictManager,
  defaultConflictManager
} from './conflict';

export {
  ConflictType,
  ConflictSeverity,
  ResolutionStrategy,
  Conflict,
  ResolutionResult,
  detectConflicts,
  resolveConflict,
  processConflicts,
  ConflictDetectorBase,
  ConflictResolverBase,
  ConflictManager,
  defaultConflictManager
};

// Explainer module exports
import {
  ExplanationFormat,
  DetailLevel,
  AudienceType,
  ChangeType,
  ExplanationOptions,
  ExplanationResult,
  explainChange,
  explainChanges,
  explainChangeSet,
  setDefaultOptions as setExplainerDefaultOptions,
  ChangeExplainerBase,
  ChangeExplainerFactory,
  ChangeExplainerManager,
  defaultManager as defaultExplainerManager
} from './explainer';

export {
  ExplanationFormat,
  DetailLevel,
  AudienceType,
  ChangeType,
  ExplanationOptions,
  ExplanationResult,
  explainChange,
  explainChanges,
  explainChangeSet,
  setExplainerDefaultOptions,
  ChangeExplainerBase,
  ChangeExplainerFactory,
  ChangeExplainerManager,
  defaultExplainerManager
};

// Documentation module exports
import {
  DocumentationFormat,
  DocumentationStyle,
  DocumentationScope,
  CodeType,
  DocumentationOptions,
  DocumentationResult,
  DocumentationContext,
  generateDocumentation,
  generateMultipleDocumentations,
  generateConsolidatedDocumentation,
  setDefaultOptions as setDocumentationDefaultOptions,
  DocumentationGeneratorBase,
  DocumentationGeneratorFactory,
  DocumentationManager,
  documentationManager
} from './documentation';

export {
  DocumentationFormat,
  DocumentationStyle,
  DocumentationScope,
  CodeType,
  DocumentationOptions,
  DocumentationResult,
  DocumentationContext,
  generateDocumentation,
  generateMultipleDocumentations,
  generateConsolidatedDocumentation,
  setDocumentationDefaultOptions,
  DocumentationGeneratorBase,
  DocumentationGeneratorFactory,
  DocumentationManager,
  documentationManager
};

// Test module exports
import {
  TestFramework,
  TestType,
  CoverageLevel,
  AssertionStyle,
  TestStructure,
  MockingApproach,
  TestGenerationOptions,
  TestContext,
  CodeToTest,
  TestGenerationResult,
  generateTests,
  generateMultipleTests,
  generateTestSuite,
  generateUnitTests,
  generateComponentTests,
  generateSnapshotTests,
  generateIntegrationTests,
  setDefaultOptions as setTestDefaultOptions,
  TestGeneratorBase,
  TestGeneratorFactory,
  TestManager,
  testManager
} from './test';

export {
  TestFramework,
  TestType,
  CoverageLevel,
  AssertionStyle,
  TestStructure,
  MockingApproach,
  TestGenerationOptions,
  TestContext,
  CodeToTest,
  TestGenerationResult,
  generateTests,
  generateMultipleTests,
  generateTestSuite,
  generateUnitTests,
  generateComponentTests,
  generateSnapshotTests,
  generateIntegrationTests,
  setTestDefaultOptions,
  TestGeneratorBase,
  TestGeneratorFactory,
  TestManager,
  testManager
};

// Re-export types with aliases to avoid conflicts
import { CodeChange as ConflictCodeChange } from './conflict';
import { CodeChange as ExplainerCodeChange } from './explainer';
import { CodeToDocument } from './documentation';

export { ConflictCodeChange, ExplainerCodeChange, CodeToDocument };

// Export adapters for backward compatibility
export { StyleGenerator } from './StyleGeneratorAdapter';
export { ConflictResolver } from './ConflictResolverAdapter';
export { ChangeExplainer } from './ChangeExplainerAdapter';
export { DocumentationGenerator } from './DocumentationGeneratorAdapter';
export { TestGenerator } from './TestGeneratorAdapter';

// Export other services
export * from './PropTypeInference';
export * from './SafeCodeApplication';

// Core code execution function
import { CodeChangeRequest, CodeChangeResult } from '../../utils/types';

/**
 * Executes a code change request
 * 
 * @param request The code change request to execute
 * @returns A result of the code change operation
 */
export async function executeCodeChange(request: CodeChangeRequest): Promise<CodeChangeResult> {
  try {
    // Log the code change request for debugging
    console.log(`Executing code change for component: ${request.componentId}`);
    
    // Validate the source code
    if (!request.sourceCode || request.sourceCode.trim() === '') {
      return {
        success: false,
        error: 'Source code cannot be empty',
        componentId: request.componentId
      };
    }
    
    // Apply the code change
    // In a real implementation, this would analyze the code and perform the change
    // For now, we'll just return the new source code
    return {
      success: true,
      componentId: request.componentId,
      newSourceCode: request.sourceCode,
      // You might include additional metadata about the change
      diff: 'Placeholder for diff output'
    };
  } catch (error) {
    console.error('Error executing code change:', error);
    
    // Return a proper error result
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      componentId: request.componentId
    };
  }
}
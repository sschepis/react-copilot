import * as ts from 'typescript';

/**
 * Format for change explanations
 */
export enum ExplanationFormat {
  /** Plain text explanation */
  PLAIN_TEXT = 'plain_text',
  /** Markdown formatted explanation */
  MARKDOWN = 'markdown',
  /** HTML formatted explanation */
  HTML = 'html',
  /** JSON structured explanation */
  JSON = 'json',
  /** Code comment format */
  CODE_COMMENT = 'code_comment'
}

/**
 * Level of detail for explanations
 */
export enum DetailLevel {
  /** Brief summary of changes */
  BRIEF = 'brief',
  /** Standard level of detail */
  STANDARD = 'standard',
  /** Detailed explanation with technical specifics */
  DETAILED = 'detailed',
  /** Comprehensive explanation with contextual information */
  COMPREHENSIVE = 'comprehensive'
}

/**
 * Audience for the explanation (affects terminology and focus)
 */
export enum AudienceType {
  /** Non-technical users */
  NON_TECHNICAL = 'non_technical',
  /** Beginner developers */
  BEGINNER = 'beginner',
  /** Intermediate developers */
  INTERMEDIATE = 'intermediate',
  /** Expert developers */
  EXPERT = 'expert'
}

/**
 * Type of code change to explain
 */
export enum ChangeType {
  /** Adding new code (function, class, variable, etc.) */
  ADDITION = 'addition',
  /** Removing code */
  DELETION = 'deletion',
  /** Modifying existing code */
  MODIFICATION = 'modification',
  /** Moving code to a different location */
  MOVE = 'move',
  /** Renaming entities */
  RENAME = 'rename',
  /** Refactoring code structure without changing functionality */
  REFACTOR = 'refactor',
  /** Fixing bugs */
  BUG_FIX = 'bug_fix',
  /** Optimizing performance */
  OPTIMIZATION = 'optimization',
  /** Adding or modifying comments */
  DOCUMENTATION = 'documentation',
  /** Changing styles */
  STYLE = 'style',
  /** Complex changes involving multiple types */
  COMPLEX = 'complex'
}

/**
 * Code change to explain
 */
export interface CodeChange {
  /** Original code */
  originalCode: string;
  /** Modified code */
  modifiedCode: string;
  /** Original AST (if available) */
  originalAST?: ts.SourceFile;
  /** Modified AST (if available) */
  modifiedAST?: ts.SourceFile;
  /** Path to the file (if applicable) */
  filePath?: string;
  /** Type of change (if known) */
  type?: ChangeType;
  /** Component ID (if applicable) */
  componentId?: string;
  /** Additional metadata about the change */
  metadata?: Record<string, any>;
}

/**
 * Options for generating explanations
 */
export interface ExplanationOptions {
  /** Format for the explanation */
  format?: ExplanationFormat;
  /** Level of detail to include */
  detailLevel?: DetailLevel;
  /** Target audience for the explanation */
  audience?: AudienceType;
  /** Include code snippets in the explanation */
  includeCodeSnippets?: boolean;
  /** Include visual elements (only applicable to certain formats) */
  includeVisuals?: boolean;
  /** Include technical details about the change */
  includeTechnicalDetails?: boolean;
  /** Include impact assessment of the change */
  includeImpactAssessment?: boolean;
  /** Include suggestions for related changes */
  includeSuggestions?: boolean;
  /** Custom formatting options */
  formatting?: Record<string, any>;
}

/**
 * Result of an explanation generation
 */
export interface ExplanationResult {
  /** The generated explanation */
  explanation: string;
  /** Format of the explanation */
  format: ExplanationFormat;
  /** Type of change that was explained */
  changeType: ChangeType;
  /** Key points extracted from the change */
  keyPoints?: string[];
  /** Suggestions for related changes or improvements */
  suggestions?: string[];
  /** Potential impacts of the change */
  impacts?: string[];
  /** Warnings about the change */
  warnings?: string[];
  /** Additional data about the explanation */
  metadata?: Record<string, any>;
}

/**
 * Interface that all change explainers must implement
 */
export interface IChangeExplainer {
  /** Name of the explainer for identification */
  readonly name: string;
  
  /** Change types supported by this explainer */
  readonly supportedChangeTypes: ChangeType[];
  
  /**
   * Generate an explanation for the given code change
   */
  explainChange(change: CodeChange, options?: ExplanationOptions): ExplanationResult;
  
  /**
   * Check if this explainer can handle the given change
   */
  canExplain(change: CodeChange): boolean;
  
  /**
   * Configure the explainer with specific options
   */
  configure(options: Record<string, any>): void;
}
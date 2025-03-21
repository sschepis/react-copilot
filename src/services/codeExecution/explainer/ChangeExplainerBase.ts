import * as ts from 'typescript';
import { 
  IChangeExplainer, 
  CodeChange, 
  ExplanationOptions, 
  ExplanationResult, 
  ExplanationFormat, 
  DetailLevel, 
  AudienceType, 
  ChangeType
} from './types';

/**
 * Base class for change explainers
 * Provides common functionality for analyzing code changes and generating explanations
 */
export abstract class ChangeExplainerBase implements IChangeExplainer {
  /** Name of this explainer */
  readonly name: string;
  
  /** Change types this explainer can handle */
  readonly supportedChangeTypes: ChangeType[];
  
  /** Configuration options */
  protected options: Record<string, any> = {};
  
  /** Default explanation options */
  protected defaultExplanationOptions: ExplanationOptions = {
    format: ExplanationFormat.MARKDOWN,
    detailLevel: DetailLevel.STANDARD,
    audience: AudienceType.INTERMEDIATE,
    includeCodeSnippets: true,
    includeVisuals: false,
    includeTechnicalDetails: true,
    includeImpactAssessment: true,
    includeSuggestions: true
  };
  
  constructor(name: string, supportedChangeTypes: ChangeType[]) {
    this.name = name;
    this.supportedChangeTypes = supportedChangeTypes;
  }
  
  /**
   * Generate an explanation for the given code change
   * This is the main method that clients will call
   */
  explainChange(change: CodeChange, options?: ExplanationOptions): ExplanationResult {
    // Merge with default options
    const mergedOptions = {
      ...this.defaultExplanationOptions,
      ...options
    };
    
    // Determine the change type if not provided
    const changeType = change.type || this.detectChangeType(change);
    
    // Create a copy of the change with the detected type
    change = {
      ...change,
      type: changeType
    };
    
    // Check if this explainer can handle the change
    if (!this.canExplain(change)) {
      throw new Error(`Explainer ${this.name} cannot explain change of type ${changeType}`);
    }
    
    // Parse ASTs if not provided
    if (!change.originalAST && change.originalCode) {
      try {
        change = {
          ...change,
          originalAST: this.parseAST(change.originalCode)
        };
      } catch (error) {
        console.warn('Failed to parse original code AST:', error);
      }
    }
    
    if (!change.modifiedAST && change.modifiedCode) {
      try {
        change = {
          ...change,
          modifiedAST: this.parseAST(change.modifiedCode)
        };
      } catch (error) {
        console.warn('Failed to parse modified code AST:', error);
      }
    }
    
    // Generate the explanation using the specific implementation
    const explanation = this.generateExplanation(change, mergedOptions);
    
    // Format the explanation according to the specified format
    const formattedExplanation = this.formatExplanation(
      explanation,
      mergedOptions.format || ExplanationFormat.MARKDOWN
    );
    
    // Generate suggestions if requested
    const suggestions = mergedOptions.includeSuggestions 
      ? this.generateSuggestions(change)
      : undefined;
    
    // Generate impact assessment if requested
    const impacts = mergedOptions.includeImpactAssessment 
      ? this.assessImpact(change)
      : undefined;
    
    // Extract key points
    const keyPoints = this.extractKeyPoints(explanation);
    
    // Generate warnings if any
    const warnings = this.generateWarnings(change);
    
    // Return the final result
    return {
      explanation: formattedExplanation,
      format: mergedOptions.format || ExplanationFormat.MARKDOWN,
      changeType, // Now we're sure this is a valid ChangeType
      keyPoints,
      suggestions,
      impacts,
      warnings,
      metadata: this.generateMetadata(change, mergedOptions)
    };
  }
  
  /**
   * Check if this explainer can handle the given change
   */
  canExplain(change: CodeChange): boolean {
    // If no specific type is specified, try to detect it
    const changeType = change.type || this.detectChangeType(change);
    return this.supportedChangeTypes.includes(changeType);
  }
  
  /**
   * Configure the explainer with specific options
   */
  configure(options: Record<string, any>): void {
    this.options = {
      ...this.options,
      ...options
    };
    
    // Update default explanation options if provided
    if (options.defaultExplanationOptions) {
      this.defaultExplanationOptions = {
        ...this.defaultExplanationOptions,
        ...options.defaultExplanationOptions
      };
    }
  }
  
  /**
   * Generate an explanation for the given code change
   * This method must be implemented by specific explainers
   */
  protected abstract generateExplanation(
    change: CodeChange, 
    options: ExplanationOptions
  ): string;
  
  /**
   * Detect the type of change
   */
  protected detectChangeType(change: CodeChange): ChangeType {
    // This is a simple implementation; specific explainers can override with more sophisticated detection
    if (!change.originalCode && change.modifiedCode) {
      return ChangeType.ADDITION;
    }
    
    if (change.originalCode && !change.modifiedCode) {
      return ChangeType.DELETION;
    }
    
    if (change.originalCode === change.modifiedCode) {
      return ChangeType.DOCUMENTATION; // No actual code change, assume documentation
    }
    
    // Default to modification for any other case
    return ChangeType.MODIFICATION;
  }
  
  /**
   * Parse code into an AST
   */
  protected parseAST(code: string): ts.SourceFile {
    return ts.createSourceFile(
      'temp.ts',
      code,
      ts.ScriptTarget.Latest,
      true
    );
  }
  
  /**
   * Format an explanation according to the specified format
   */
  protected formatExplanation(explanation: string, format: ExplanationFormat): string {
    switch (format) {
      case ExplanationFormat.PLAIN_TEXT:
        return this.formatAsPlainText(explanation);
      case ExplanationFormat.HTML:
        return this.formatAsHTML(explanation);
      case ExplanationFormat.JSON:
        return this.formatAsJSON(explanation);
      case ExplanationFormat.CODE_COMMENT:
        return this.formatAsCodeComment(explanation);
      case ExplanationFormat.MARKDOWN:
      default:
        return this.formatAsMarkdown(explanation);
    }
  }
  
  /**
   * Format an explanation as plain text
   */
  protected formatAsPlainText(explanation: string): string {
    // Strip any markdown formatting
    return explanation
      .replace(/#{1,6}\s+/g, '') // Remove headings
      .replace(/\*\*/g, '')      // Remove bold
      .replace(/\*/g, '')        // Remove italic
      .replace(/`/g, '\'')       // Replace code ticks with quotes
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with just text
      .replace(/```[a-z]*\n([\s\S]*?)```/g, '$1'); // Remove code blocks
  }
  
  /**
   * Format an explanation as markdown
   */
  protected formatAsMarkdown(explanation: string): string {
    return explanation; // Already in markdown format
  }
  
  /**
   * Format an explanation as HTML
   */
  protected formatAsHTML(explanation: string): string {
    // Convert markdown to HTML (simplified version)
    return explanation
      .replace(/#{6}\s+(.*)/g, '<h6>$1</h6>')
      .replace(/#{5}\s+(.*)/g, '<h5>$1</h5>')
      .replace(/#{4}\s+(.*)/g, '<h4>$1</h4>')
      .replace(/#{3}\s+(.*)/g, '<h3>$1</h3>')
      .replace(/#{2}\s+(.*)/g, '<h2>$1</h2>')
      .replace(/#{1}\s+(.*)/g, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/```[a-z]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  }
  
  /**
   * Format an explanation as JSON
   */
  protected formatAsJSON(explanation: string): string {
    // Create a structured JSON representation
    const sections = explanation.split(/#{2,3}\s+/).filter(Boolean);
    const structured = {
      summary: sections[0]?.trim() || explanation,
      sections: sections.slice(1).map(section => {
        const lines = section.split('\n');
        const title = lines[0]?.trim() || 'Section';
        const content = lines.slice(1).join('\n').trim();
        return { title, content };
      })
    };
    
    return JSON.stringify(structured, null, 2);
  }
  
  /**
   * Format an explanation as code comments
   */
  protected formatAsCodeComment(explanation: string): string {
    // Convert to code comments format
    const lines = explanation.split('\n');
    return '/**\n' + lines.map(line => ` * ${line}`).join('\n') + '\n */';
  }
  
  /**
   * Generate suggestions for related changes or improvements
   */
  protected generateSuggestions(change: CodeChange): string[] {
    // Default implementation returns no suggestions
    // Specific explainers should override this method
    return [];
  }
  
  /**
   * Assess the potential impact of a change
   */
  protected assessImpact(change: CodeChange): string[] {
    // Default implementation returns no impact assessment
    // Specific explainers should override this method
    return [];
  }
  
  /**
   * Extract key points from an explanation
   */
  protected extractKeyPoints(explanation: string): string[] {
    // Simple extraction of key points from headings and lists
    const points: string[] = [];
    
    // Extract headings (level 2 and 3)
    const headings = explanation.match(/#{2,3}\s+(.*)/g);
    if (headings) {
      points.push(...headings.map(h => h.replace(/^#{2,3}\s+/, '')));
    }
    
    // Extract list items
    const listItems = explanation.match(/[-*]\s+(.*)/g);
    if (listItems) {
      points.push(...listItems.map(li => li.replace(/^[-*]\s+/, '')));
    }
    
    // Limit to 5 key points
    return points.slice(0, 5);
  }
  
  /**
   * Generate warnings about potential issues with the change
   */
  protected generateWarnings(change: CodeChange): string[] {
    // Default implementation returns no warnings
    // Specific explainers should override this method
    return [];
  }
  
  /**
   * Generate metadata about the explanation
   */
  protected generateMetadata(change: CodeChange, options: ExplanationOptions): Record<string, any> {
    return {
      explainer: this.name,
      detailLevel: options.detailLevel,
      audience: options.audience,
      timestamp: new Date().toISOString()
    };
  }
}
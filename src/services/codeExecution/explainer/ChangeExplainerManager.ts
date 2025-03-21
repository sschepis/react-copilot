import {
  CodeChange,
  ExplanationOptions,
  ExplanationResult,
  IChangeExplainer,
  ChangeType,
} from './types';
import { ChangeExplainerFactory } from './ChangeExplainerFactory';

/**
 * Manager for coordinating change explanations
 * Provides a high-level API for generating explanations
 */
export class ChangeExplainerManager {
  private explainers: Map<string, IChangeExplainer> = new Map();
  private defaultOptions: Partial<ExplanationOptions> = {};
  
  /**
   * Create a new manager with default explainers
   */
  constructor() {
    // Register default explainers from the factory
    ChangeExplainerFactory.getAllExplainers().forEach(explainer => {
      this.registerExplainer(explainer);
    });
  }
  
  /**
   * Register an explainer with this manager
   */
  registerExplainer(explainer: IChangeExplainer): void {
    this.explainers.set(explainer.name, explainer);
  }
  
  /**
   * Unregister an explainer by name
   */
  unregisterExplainer(name: string): boolean {
    return this.explainers.delete(name);
  }
  
  /**
   * Set default options for all explanations
   */
  setDefaultOptions(options: Partial<ExplanationOptions>): void {
    this.defaultOptions = {
      ...this.defaultOptions,
      ...options
    };
  }
  
  /**
   * Get an explainer for a specific change
   */
  getExplainerForChange(change: CodeChange): IChangeExplainer {
    // Try to find an explainer from our local registry first
    for (const explainer of this.explainers.values()) {
      if (explainer.canExplain(change)) {
        return explainer;
      }
    }
    
    // Fall back to the factory
    return ChangeExplainerFactory.getExplainer(change);
  }
  
  /**
   * Generate an explanation for a code change
   */
  explainChange(change: CodeChange, options?: ExplanationOptions): ExplanationResult {
    // Merge options with defaults
    const mergedOptions = {
      ...this.defaultOptions,
      ...options
    };
    
    // Get the appropriate explainer
    const explainer = this.getExplainerForChange(change);
    
    // Generate and return the explanation
    return explainer.explainChange(change, mergedOptions);
  }
  
  /**
   * Categorize a list of changes and explain each
   */
  explainChanges(changes: CodeChange[], options?: ExplanationOptions): ExplanationResult[] {
    return changes.map(change => this.explainChange(change, options));
  }
  
  /**
   * Generate a consolidated explanation for multiple changes
   */
  explainChangeSet(changes: CodeChange[], options?: ExplanationOptions): ExplanationResult {
    // Check if there are any changes to explain
    if (changes.length === 0) {
      throw new Error('No changes to explain');
    }
    
    // Merge options with defaults
    const mergedOptions = {
      ...this.defaultOptions,
      ...options
    };
    
    // If there's only one change, just explain it
    if (changes.length === 1) {
      return this.explainChange(changes[0], mergedOptions);
    }
    
    // Generate individual explanations
    const individualExplanations = this.explainChanges(changes, mergedOptions);
    
    // Categorize the changes
    const categorizedChanges = this.categorizeChanges(changes);
    
    // Generate a consolidated explanation
    const consolidated = this.consolidateExplanations(
      individualExplanations,
      categorizedChanges,
      mergedOptions
    );
    
    return consolidated;
  }
  
  /**
   * Categorize changes by type
   */
  private categorizeChanges(changes: CodeChange[]): Record<ChangeType, CodeChange[]> {
    const categorized: Partial<Record<ChangeType, CodeChange[]>> = {};
    
    // Initialize with empty arrays for each change type
    Object.values(ChangeType).forEach(type => {
      categorized[type] = [];
    });
    
    // Categorize each change
    changes.forEach(change => {
      const type = change.type || this.detectChangeType(change);
      categorized[type]!.push(change);
    });
    
    return categorized as Record<ChangeType, CodeChange[]>;
  }
  
  /**
   * Detect the type of a change
   */
  private detectChangeType(change: CodeChange): ChangeType {
    // If we have an explainer for this change, use its detection
    const explainer = this.getExplainerForChange(change);
    
    // Use the explainer to detect the change type
    // Call canExplain which will likely detect the type
    explainer.canExplain(change);
    
    // Check if the change now has a type
    if (change.type) {
      return change.type;
    }
    
    // Default detection logic
    if (!change.originalCode && change.modifiedCode) {
      return ChangeType.ADDITION;
    }
    
    if (change.originalCode && !change.modifiedCode) {
      return ChangeType.DELETION;
    }
    
    // Default to modification
    return ChangeType.MODIFICATION;
  }
  
  /**
   * Consolidate multiple explanations into one
   */
  private consolidateExplanations(
    explanations: ExplanationResult[],
    categorizedChanges: Record<ChangeType, CodeChange[]>,
    options: ExplanationOptions
  ): ExplanationResult {
    // Create a consolidated explanation
    let consolidatedText = '# Consolidated Change Explanation\n\n';
    
    // Add a summary of all changes
    consolidatedText += '## Summary\n\n';
    consolidatedText += 'This set of changes includes:\n\n';
    
    Object.entries(categorizedChanges).forEach(([type, changes]) => {
      if (changes.length > 0) {
        consolidatedText += `- **${type}**: ${changes.length} changes\n`;
      }
    });
    
    // Add details for each type of change
    Object.entries(categorizedChanges).forEach(([type, changes]) => {
      if (changes.length > 0) {
        consolidatedText += `\n## ${type} Changes (${changes.length})\n\n`;
        
        // For each change of this type, include a brief summary
        changes.forEach((change, index) => {
          // Find the corresponding explanation
          const explanation = explanations.find(e => 
            e.changeType === change.type && 
            (change.componentId ? e.metadata?.componentId === change.componentId : true)
          );
          
          if (explanation) {
            // Extract a brief summary from the explanation
            const summary = this.extractSummary(explanation.explanation);
            consolidatedText += `### Change ${index + 1}: ${change.filePath || ''}\n\n`;
            consolidatedText += `${summary}\n\n`;
          }
        });
      }
    });
    
    // Collect all key points, suggestions, impacts, and warnings
    const allKeyPoints: string[] = [];
    const allSuggestions: string[] = [];
    const allImpacts: string[] = [];
    const allWarnings: string[] = [];
    
    explanations.forEach(explanation => {
      if (explanation.keyPoints) allKeyPoints.push(...explanation.keyPoints);
      if (explanation.suggestions) allSuggestions.push(...explanation.suggestions);
      if (explanation.impacts) allImpacts.push(...explanation.impacts);
      if (explanation.warnings) allWarnings.push(...explanation.warnings);
    });
    
    // Add a section for key points if there are any
    if (allKeyPoints.length > 0) {
      consolidatedText += '## Key Points\n\n';
      // Deduplicate key points
      [...new Set(allKeyPoints)].slice(0, 10).forEach(point => {
        consolidatedText += `- ${point}\n`;
      });
      consolidatedText += '\n';
    }
    
    // Add a section for suggestions if requested
    if (options.includeSuggestions && allSuggestions.length > 0) {
      consolidatedText += '## Suggestions\n\n';
      // Deduplicate suggestions
      [...new Set(allSuggestions)].forEach(suggestion => {
        consolidatedText += `- ${suggestion}\n`;
      });
      consolidatedText += '\n';
    }
    
    // Add a section for impacts if requested
    if (options.includeImpactAssessment && allImpacts.length > 0) {
      consolidatedText += '## Potential Impacts\n\n';
      // Deduplicate impacts
      [...new Set(allImpacts)].forEach(impact => {
        consolidatedText += `- ${impact}\n`;
      });
      consolidatedText += '\n';
    }
    
    // Add a section for warnings if there are any
    if (allWarnings.length > 0) {
      consolidatedText += '## Warnings\n\n';
      // Deduplicate warnings
      [...new Set(allWarnings)].forEach(warning => {
        consolidatedText += `- ${warning}\n`;
      });
      consolidatedText += '\n';
    }
    
    // Determine the primary change type
    let primaryChangeType = ChangeType.COMPLEX;
    let maxChanges = 0;
    
    Object.entries(categorizedChanges).forEach(([type, changes]) => {
      if (changes.length > maxChanges) {
        maxChanges = changes.length;
        primaryChangeType = type as ChangeType;
      }
    });
    
    // Return the consolidated explanation
    return {
      explanation: consolidatedText,
      format: options.format || explanations[0].format,
      changeType: primaryChangeType,
      keyPoints: [...new Set(allKeyPoints)].slice(0, 10),
      suggestions: [...new Set(allSuggestions)],
      impacts: [...new Set(allImpacts)],
      warnings: [...new Set(allWarnings)],
      metadata: {
        consolidatedFrom: explanations.length,
        changeTypes: Object.keys(categorizedChanges).filter(type => 
          categorizedChanges[type as ChangeType].length > 0
        )
      }
    };
  }
  
  /**
   * Extract a brief summary from a detailed explanation
   */
  private extractSummary(explanation: string): string {
    // Look for a summary section
    const summaryMatch = explanation.match(/## Summary\n\n([\s\S]*?)(?=\n\n##|$)/);
    if (summaryMatch && summaryMatch[1]) {
      return summaryMatch[1].trim();
    }
    
    // If no summary section, take the first paragraph
    const firstParagraphMatch = explanation.match(/(?:^|\n\n)(.*?)(?=\n\n|$)/);
    if (firstParagraphMatch && firstParagraphMatch[1]) {
      return firstParagraphMatch[1].trim();
    }
    
    // Fall back to the first 100 characters
    return explanation.substring(0, 100).trim() + '...';
  }
  
  /**
   * Get all registered explainers
   */
  getAllExplainers(): IChangeExplainer[] {
    return Array.from(this.explainers.values());
  }
}
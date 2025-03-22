import * as ts from 'typescript';
import { InferredProp } from './PropTypeInference';
import {
  LegacyTestAdapter,
  LegacyTestGeneratorOptions as TestGeneratorOptions,
  LegacyTestGenerationResult as TestGenerationResult,
  LegacyTestCase as TestCase
} from './test/LegacyTestAdapter';

// Re-export the types for backward compatibility
export { TestGeneratorOptions, TestGenerationResult, TestCase };

/**
 * Component analysis result (internal interface)
 * @private
 */
interface ComponentAnalysis {
  name: string;
  props: InferredProp[];
  events: string[];
  stateVars: string[];
  renderBranches: number;
  imports: string[];
  hooks: string[];
}

/**
 * Generates automated tests for React components
 * @deprecated Use the new TestManager from './test' instead
 */
export class TestGenerator {
  private adapter: LegacyTestAdapter;
  
  constructor(options: TestGeneratorOptions) {
    this.adapter = new LegacyTestAdapter(options);
  }
  
  /**
   * Generate tests for a component
   * 
   * @param componentPath Path to the component file
   * @param componentCode Component source code
   * @param inferredProps Optional pre-analyzed props
   * @returns Test generation result
   */
  generateTests(
    componentPath: string,
    componentCode: string,
    inferredProps?: InferredProp[]
  ): TestGenerationResult {
    return this.adapter.generateTests(
      componentPath,
      componentCode,
      inferredProps
    );
  }
}
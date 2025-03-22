import * as ts from 'typescript';
import { ModifiableComponent } from '../../utils/types';
import {
  CodeSource,
  InferenceResult as NewInferenceResult,
  InferredPropType as NewInferredPropType,
  PropInferenceOptions
} from './propInference/types';
import { defaultPropTypeInferenceManager } from './propInference/PropTypeInferenceManager';

/**
 * Types of props that can be inferred
 */
export enum InferredPropType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  ARRAY = 'array',
  FUNCTION = 'function',
  DATE = 'Date',
  ELEMENT = 'React.ReactElement',
  NODE = 'React.ReactNode',
  ENUM = 'enum',
  ANY = 'any',
  UNION = 'union'
}

/**
 * Information about an inferred prop
 */
export interface InferredProp {
  name: string;
  type: InferredPropType | string;
  required: boolean;
  defaultValue?: any;
  description?: string;
  enumValues?: string[];
  unionTypes?: string[];
  arrayType?: string;
  usage: number;
  inference: 'definite' | 'probable' | 'possible';
}

/**
 * Result of prop type inference
 */
export interface InferenceResult {
  componentName: string;
  props: InferredProp[];
  interfaceText: string;
  propsDestructuring: string;
  propDefaultsCode: string;
  propTypesCode?: string;
}

/**
 * Service for inferring prop types and TypeScript interfaces from component usage
 * @deprecated Use the new PropTypeInferenceManager from './propInference' instead
 */
export class PropTypeInference {
  /**
   * Analyze component usage across the codebase to infer prop types
   * 
   * @param componentId ID of the target component
   * @param componentCode Source code of the component
   * @param usageExamples Usage examples of the component from the codebase
   * @returns Inference result with prop types and interface
   */
  analyzeComponentUsage(
    componentId: string,
    componentCode: string,
    usageExamples: string[]
  ): InferenceResult {
    // Create a code source object for the new API
    const codeSource: CodeSource = {
      componentCode,
      usageExamples,
      metadata: {
        componentName: componentId
      }
    };
    
    // Configure options
    const options: PropInferenceOptions = {
      generateTypeScriptInterfaces: true,
      generatePropTypes: true,
      generateDefaults: true,
      includeDescriptions: true
    };
    
    // Use the new implementation
    const result = defaultPropTypeInferenceManager.inferPropTypes(codeSource, options);
    
    // Convert the result to the old format (no conversion needed as the formats are compatible)
    return result as InferenceResult;
  }
  
  /**
   * Apply inferred types to component code
   * 
   * @param componentCode Source code of the component
   * @param inferenceResult Result of prop type inference
   * @returns Updated component code with applied types
   */
  applyInferredTypes(componentCode: string, inferenceResult: InferenceResult): string {
    return defaultPropTypeInferenceManager.applyInferredTypes(
      componentCode, 
      inferenceResult as unknown as NewInferenceResult,
      { forceUpdate: true }
    );
  }
}
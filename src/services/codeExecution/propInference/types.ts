import * as ts from 'typescript';

/**
 * Types of props that can be inferred
 */
export enum InferredPropType {
  /** String primitive type */
  STRING = 'string',
  /** Number primitive type */
  NUMBER = 'number',
  /** Boolean primitive type */
  BOOLEAN = 'boolean',
  /** Generic object type */
  OBJECT = 'object',
  /** Array type */
  ARRAY = 'array',
  /** Function type */
  FUNCTION = 'function',
  /** Date object type */
  DATE = 'Date',
  /** React element */
  ELEMENT = 'React.ReactElement',
  /** React node (elements, strings, etc.) */
  NODE = 'React.ReactNode',
  /** Enum type */
  ENUM = 'enum',
  /** Any type */
  ANY = 'any',
  /** Union type */
  UNION = 'union'
}

/**
 * Information about an inferred prop
 */
export interface InferredProp {
  /** Property name */
  name: string;
  /** Inferred property type */
  type: InferredPropType | string;
  /** Whether the prop is required */
  required: boolean;
  /** Default value for the prop (if any) */
  defaultValue?: any;
  /** Documentation/description of the prop */
  description?: string;
  /** For enum types, the possible values */
  enumValues?: string[];
  /** For union types, the constituent types */
  unionTypes?: string[];
  /** For array types, the type of array elements */
  arrayType?: string;
  /** Number of times the prop is used in examples */
  usage: number;
  /** Confidence level of the type inference */
  inference: 'definite' | 'probable' | 'possible';
}

/**
 * Result of prop type inference
 */
export interface InferenceResult {
  /** Component name */
  componentName: string;
  /** Inferred props */
  props: InferredProp[];
  /** Generated TypeScript interface */
  interfaceText: string;
  /** Props destructuring pattern */
  propsDestructuring: string;
  /** Default values code */
  propDefaultsCode: string;
  /** PropTypes validation code */
  propTypesCode?: string;
}

/**
 * Options for prop type inference
 */
export interface PropInferenceOptions {
  /** Generate TypeScript interfaces */
  generateTypeScriptInterfaces?: boolean;
  /** Generate PropTypes validation code */
  generatePropTypes?: boolean;
  /** Generate default values */
  generateDefaults?: boolean;
  /** Include descriptions in generated code */
  includeDescriptions?: boolean;
  /** Infer required/optional status */
  inferRequired?: boolean;
  /** Minimum confidence level to include a prop */
  minConfidence?: 'definite' | 'probable' | 'possible';
  /** Additional TypeScript types to recognize */
  customTypes?: Record<string, string>;
  /** Custom formatter for generated code */
  customFormatter?: (code: string) => string;
  /** Custom options */
  customOptions?: Record<string, any>;
}

/**
 * Context for prop type inference
 */
export interface PropInferenceContext {
  /** Component name */
  componentName?: string;
  /** Path to the component file */
  filePath?: string;
  /** Target language (TypeScript or JavaScript) */
  language?: 'typescript' | 'javascript';
  /** Component style (functional or class) */
  componentStyle?: 'functional' | 'class';
  /** Currently existing prop types */
  existingPropTypes?: Record<string, string>;
  /** Usage examples from the codebase */
  usageExamples?: string[];
  /** Additional context information */
  additionalContext?: Record<string, any>;
}

/**
 * Code source for inference
 */
export interface CodeSource {
  /** Component source code */
  componentCode: string;
  /** AST for the component code */
  componentAst?: ts.SourceFile;
  /** File path of the component */
  filePath?: string;
  /** Usage examples of the component */
  usageExamples?: string[];
  /** ASTs for the usage examples */
  usageAsts?: ts.SourceFile[];
  /** Additional metadata about the code */
  metadata?: Record<string, any>;
}

/**
 * Interface that all prop type inferencers must implement
 */
export interface IPropTypeInferencer {
  /** Name of the inferencer */
  readonly name: string;
  
  /** Component types this inferencer can handle */
  readonly supportedComponentTypes: string[];
  
  /**
   * Infer prop types from code
   */
  inferPropTypes(
    code: CodeSource, 
    options?: PropInferenceOptions, 
    context?: PropInferenceContext
  ): InferenceResult;
  
  /**
   * Check if this inferencer can handle the given code
   */
  canInferPropTypes(code: CodeSource, componentType: string): boolean;
  
  /**
   * Configure the inferencer with specific options
   */
  configure(options: Record<string, any>): void;
}
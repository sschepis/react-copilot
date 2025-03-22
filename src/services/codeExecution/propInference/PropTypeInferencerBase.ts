import * as ts from 'typescript';
import {
  IPropTypeInferencer,
  CodeSource,
  PropInferenceOptions,
  PropInferenceContext,
  InferenceResult,
  InferredProp,
  InferredPropType
} from './types';

/**
 * Base class for prop type inferencers
 * Provides common functionality for analyzing component code and inferring types
 */
export abstract class PropTypeInferencerBase implements IPropTypeInferencer {
  /** Inferencer name */
  readonly name: string;
  
  /** Component types this inferencer can handle */
  readonly supportedComponentTypes: string[];
  
  /** Configuration options */
  protected options: Record<string, any> = {};
  
  /** Default inference options */
  protected defaultOptions: PropInferenceOptions = {
    generateTypeScriptInterfaces: true,
    generatePropTypes: true,
    generateDefaults: true,
    includeDescriptions: true,
    inferRequired: true,
    minConfidence: 'probable'
  };
  
  constructor(name: string, supportedComponentTypes: string[]) {
    this.name = name;
    this.supportedComponentTypes = supportedComponentTypes;
  }
  
  /**
   * Infer prop types from code
   * This is the main method that clients will call
   */
  inferPropTypes(
    code: CodeSource,
    options?: PropInferenceOptions,
    context?: PropInferenceContext
  ): InferenceResult {
    // Merge with default options
    const mergedOptions = {
      ...this.defaultOptions,
      ...options
    };
    
    // Ensure we have an AST
    if (!code.componentAst && code.componentCode) {
      try {
        code = {
          ...code,
          componentAst: this.parseAST(code.componentCode, code.filePath)
        };
      } catch (error) {
        console.warn('Failed to parse component AST:', error);
      }
    }
    
    // Parse usage examples if provided
    if (code.usageExamples && code.usageExamples.length > 0 && !code.usageAsts) {
      code = {
        ...code,
        usageAsts: code.usageExamples.map(example => {
          try {
            return this.parseAST(example);
          } catch (error) {
            console.warn('Failed to parse usage example AST:', error);
            return undefined;
          }
        }).filter(Boolean) as ts.SourceFile[]
      };
    }
    
    // Create context if not provided
    const fullContext: PropInferenceContext = {
      componentName: this.extractComponentName(code),
      filePath: code.filePath,
      language: this.detectLanguage(code),
      componentStyle: this.detectComponentStyle(code),
      ...(context || {})
    };
    
    // Execute the specific implementation to infer prop types
    return this.inferPropTypesImplementation(code, mergedOptions, fullContext);
  }
  
  /**
   * Implementation of the prop type inference logic
   * To be implemented by derived classes
   */
  protected abstract inferPropTypesImplementation(
    code: CodeSource,
    options: PropInferenceOptions,
    context: PropInferenceContext
  ): InferenceResult;
  
  /**
   * Check if this inferencer can handle the given code
   */
  canInferPropTypes(code: CodeSource, componentType: string): boolean {
    return this.supportedComponentTypes.includes(componentType);
  }
  
  /**
   * Configure the inferencer with specific options
   */
  configure(options: Record<string, any>): void {
    this.options = {
      ...this.options,
      ...options
    };
  }
  
  /**
   * Parse source code into an AST
   */
  protected parseAST(sourceCode: string, filePath?: string): ts.SourceFile {
    return ts.createSourceFile(
      filePath || 'temp.tsx',
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );
  }
  
  /**
   * Extract the component name from the code
   */
  protected extractComponentName(code: CodeSource): string {
    let componentName = 'Component';
    
    if (code.metadata?.componentName) {
      return code.metadata.componentName;
    }
    
    try {
      const sourceCode = code.componentCode;
      const ast = code.componentAst || this.parseAST(sourceCode);
      
      // Extract the component name
      const functionMatch = /function\s+([A-Z]\w+)\s*\(/g.exec(sourceCode);
      const arrowMatch = /const\s+([A-Z]\w+)\s*=\s*\(?[^)]*\)?\s*=>/g.exec(sourceCode);
      const classMatch = /class\s+([A-Z]\w+)\s+extends\s+React\.Component/g.exec(sourceCode);
      
      if (functionMatch) {
        componentName = functionMatch[1];
      } else if (arrowMatch) {
        componentName = arrowMatch[1];
      } else if (classMatch) {
        componentName = classMatch[1];
      } else {
        // Try to find export default
        const exportMatches = /export\s+default\s+(\w+)/g.exec(sourceCode);
        if (exportMatches) {
          componentName = exportMatches[1];
        } else if (code.filePath) {
          // Try to use file name
          const path = require('path');
          const filename = path.basename(code.filePath, path.extname(code.filePath));
          componentName = filename.charAt(0).toUpperCase() + filename.slice(1);
        }
      }
    } catch (error) {
      console.warn('Error extracting component name:', error);
    }
    
    return componentName;
  }
  
  /**
   * Detect if the code is written in TypeScript or JavaScript
   */
  protected detectLanguage(code: CodeSource): 'typescript' | 'javascript' {
    // Check file extension
    if (code.filePath) {
      if (code.filePath.endsWith('.ts') || code.filePath.endsWith('.tsx')) {
        return 'typescript';
      }
      if (code.filePath.endsWith('.js') || code.filePath.endsWith('.jsx')) {
        return 'javascript';
      }
    }
    
    // Check for TypeScript-specific syntax
    const tsPatterns = [
      /:\s*[A-Z][A-Za-z]+(\[\])?\s*[,=)]/, // Type annotations
      /<[A-Z][A-Za-z]+>/, // Generic type parameters
      /interface\s+[A-Z][A-Za-z]+\s*\{/, // Interface declarations
      /type\s+[A-Z][A-Za-z]+\s*=/ // Type aliases
    ];
    
    for (const pattern of tsPatterns) {
      if (pattern.test(code.componentCode)) {
        return 'typescript';
      }
    }
    
    return 'javascript';
  }
  
  /**
   * Detect if the component is a class or functional component
   */
  protected detectComponentStyle(code: CodeSource): 'functional' | 'class' {
    if (code.componentCode.includes('extends React.Component') || 
        code.componentCode.includes('extends Component')) {
      return 'class';
    }
    return 'functional';
  }
  
  /**
   * Map TypeScript type to our internal InferredPropType
   */
  protected mapTypeScriptTypeToInferredType(tsType: string): InferredPropType | string {
    // Strip out whitespace and brackets for clean comparison
    const normalizedType = tsType.replace(/\s/g, '');
    
    // Common type patterns
    if (normalizedType === 'string') return InferredPropType.STRING;
    if (normalizedType === 'number') return InferredPropType.NUMBER;
    if (normalizedType === 'boolean') return InferredPropType.BOOLEAN;
    if (normalizedType === 'any' || normalizedType === 'unknown') return InferredPropType.ANY;
    if (normalizedType === 'object') return InferredPropType.OBJECT;
    if (normalizedType.match(/^(Array<|.*\[\])$/)) return InferredPropType.ARRAY;
    if (normalizedType.match(/^(Function|.*=>.*|\(.+\)=>.*|{.*})$/)) return InferredPropType.FUNCTION;
    if (normalizedType === 'Date') return InferredPropType.DATE;
    if (normalizedType.match(/^React\.ReactElement|JSX\.Element$/)) return InferredPropType.ELEMENT;
    if (normalizedType.match(/^React\.ReactNode|React\.Node$/)) return InferredPropType.NODE;
    if (normalizedType.includes('|')) return InferredPropType.UNION;
    
    // If it's capitalized and not matched above, it's likely a custom type
    if (/^[A-Z]/.test(normalizedType)) return normalizedType;
    
    // Default to any for unrecognized types
    return InferredPropType.ANY;
  }
  
  /**
   * Generate TypeScript interface from inferred props
   */
  protected generateInterface(componentName: string, props: InferredProp[]): string {
    // Skip if no props
    if (props.length === 0) {
      return `interface ${componentName}Props {}\n`;
    }
    
    let interfaceText = `interface ${componentName}Props {\n`;
    
    // Generate each prop definition
    for (const prop of props) {
      // Add JSDoc comment if there's a description
      if (prop.description) {
        interfaceText += `  /**\n   * ${prop.description}\n   */\n`;
      }
      
      // Generate the property with its type
      const typeStr = this.getTypeScriptType(prop);
      interfaceText += `  ${prop.name}${prop.required ? '' : '?'}: ${typeStr};\n`;
    }
    
    interfaceText += '}\n';
    return interfaceText;
  }
  
  /**
   * Convert InferredProp to TypeScript type string
   */
  protected getTypeScriptType(prop: InferredProp): string {
    // Handle union types
    if (prop.type === InferredPropType.UNION && prop.unionTypes && prop.unionTypes.length > 0) {
      return prop.unionTypes.join(' | ');
    }
    
    // Handle enum types
    if (prop.type === InferredPropType.ENUM && prop.enumValues && prop.enumValues.length > 0) {
      return prop.enumValues.map(v => typeof v === 'string' ? `'${v}'` : v).join(' | ');
    }
    
    // Handle array types
    if (prop.type === InferredPropType.ARRAY) {
      if (prop.arrayType) {
        return `${prop.arrayType}[]`;
      }
      return 'any[]';
    }
    
    // For all other types, use the string representation
    return prop.type.toString();
  }
  
  /**
   * Generate props destructuring pattern
   */
  protected generatePropsDestructuring(componentName: string, props: InferredProp[]): string {
    if (props.length === 0) {
      return `function ${componentName}() {`;
    }
    
    // Generate destructuring with default values where available
    const destructuredProps = props.map(prop => {
      if (prop.defaultValue !== undefined) {
        return `${prop.name} = ${this.stringifyDefaultValue(prop.defaultValue)}`;
      }
      return prop.name;
    });
    
    return `function ${componentName}({ ${destructuredProps.join(', ')} }) {`;
  }
  
  /**
   * Convert a default value to a string representation
   */
  protected stringifyDefaultValue(value: any): string {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    
    if (typeof value === 'string') return `'${value}'`;
    if (typeof value === 'number' || typeof value === 'boolean') return value.toString();
    
    if (Array.isArray(value)) {
      return `[${value.map(item => this.stringifyDefaultValue(item)).join(', ')}]`;
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    // For functions or other complex types, just return a placeholder
    return '/* default value omitted */';
  }
  
  /**
   * Generate PropTypes validation code
   */
  protected generatePropTypes(componentName: string, props: InferredProp[]): string {
    if (props.length === 0) {
      return '';
    }
    
    let propTypesCode = `${componentName}.propTypes = {\n`;
    
    for (const prop of props) {
      let propTypeExpr = 'PropTypes.any';
      
      // Map our internal type to PropTypes
      switch (prop.type) {
        case InferredPropType.STRING:
          propTypeExpr = 'PropTypes.string';
          break;
        case InferredPropType.NUMBER:
          propTypeExpr = 'PropTypes.number';
          break;
        case InferredPropType.BOOLEAN:
          propTypeExpr = 'PropTypes.bool';
          break;
        case InferredPropType.OBJECT:
          propTypeExpr = 'PropTypes.object';
          break;
        case InferredPropType.ARRAY:
          propTypeExpr = 'PropTypes.array';
          if (prop.arrayType) {
            propTypeExpr = `PropTypes.arrayOf(PropTypes.${this.mapInferredTypeToPropType(prop.arrayType)})`;
          }
          break;
        case InferredPropType.FUNCTION:
          propTypeExpr = 'PropTypes.func';
          break;
        case InferredPropType.DATE:
          propTypeExpr = 'PropTypes.instanceOf(Date)';
          break;
        case InferredPropType.ELEMENT:
          propTypeExpr = 'PropTypes.element';
          break;
        case InferredPropType.NODE:
          propTypeExpr = 'PropTypes.node';
          break;
        case InferredPropType.ENUM:
          if (prop.enumValues && prop.enumValues.length > 0) {
            propTypeExpr = `PropTypes.oneOf([${prop.enumValues.map(v => typeof v === 'string' ? `'${v}'` : v).join(', ')}])`;
          }
          break;
        case InferredPropType.UNION:
          if (prop.unionTypes && prop.unionTypes.length > 0) {
            propTypeExpr = `PropTypes.oneOfType([${prop.unionTypes.map(t => `PropTypes.${this.mapInferredTypeToPropType(t)}`).join(', ')}])`;
          }
          break;
      }
      
      // Add isRequired if needed
      if (prop.required) {
        propTypeExpr += '.isRequired';
      }
      
      propTypesCode += `  ${prop.name}: ${propTypeExpr},\n`;
    }
    
    propTypesCode += '};\n';
    return propTypesCode;
  }
  
  /**
   * Map inferred type to PropTypes type
   */
  protected mapInferredTypeToPropType(inferredType: string): string {
    switch (inferredType) {
      case InferredPropType.STRING:
        return 'string';
      case InferredPropType.NUMBER:
        return 'number';
      case InferredPropType.BOOLEAN:
        return 'bool';
      case InferredPropType.OBJECT:
        return 'object';
      case InferredPropType.ARRAY:
        return 'array';
      case InferredPropType.FUNCTION:
        return 'func';
      case InferredPropType.ELEMENT:
        return 'element';
      case InferredPropType.NODE:
        return 'node';
      case InferredPropType.DATE:
        return 'instanceOf(Date)';
      default:
        return 'any';
    }
  }
}
import * as ts from 'typescript';
import { ModifiableComponent } from '../../utils/types';

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
    // Extract any existing prop types/interface from the component
    const existingProps = this.extractExistingPropTypes(componentCode);
    
    // Collect prop values from usage examples
    const propsFromUsage = this.extractPropsFromUsage(usageExamples);
    
    // Merge existing props with usage-derived props, giving precedence to existing definitions
    const mergedProps = this.mergeProps(existingProps, propsFromUsage);
    
    // Generate TypeScript interface
    const interfaceText = this.generateInterface(componentId, mergedProps);
    
    // Generate props destructuring pattern
    const propsDestructuring = this.generatePropsDestructuring(mergedProps);
    
    // Generate prop defaults code
    const propDefaultsCode = this.generatePropDefaults(mergedProps);
    
    // Generate PropTypes validation (for non-TypeScript)
    const propTypesCode = this.generatePropTypes(componentId, mergedProps);
    
    return {
      componentName: componentId,
      props: mergedProps,
      interfaceText,
      propsDestructuring,
      propDefaultsCode,
      propTypesCode
    };
  }
  
  /**
   * Extract existing prop types from component source code
   * 
   * @param componentCode Source code of the component
   * @returns Array of inferred props based on existing types
   */
  private extractExistingPropTypes(componentCode: string): InferredProp[] {
    const inferredProps: InferredProp[] = [];
    
    try {
      // Create a source file from the component code
      const sourceFile = ts.createSourceFile(
        'component.tsx',
        componentCode,
        ts.ScriptTarget.Latest,
        true
      );
      
      // Visitor function to extract interfaces and type declarations
      const visit = (node: ts.Node) => {
        // Check for interfaces
        if (ts.isInterfaceDeclaration(node) && 
            node.name.text.includes('Props')) {
          // Found a Props interface
          if (node.members) {
            node.members.forEach(member => {
              if (ts.isPropertySignature(member) && member.name) {
                const propName = member.name.getText(sourceFile);
                const type = member.type ? member.type.getText(sourceFile) : 'any';
                const isOptional = member.questionToken !== undefined;
                const jsDocComment = ts.getJSDocCommentsAndTags(member)[0];
                const description = jsDocComment ? 
                  jsDocComment.getFullText(sourceFile) : undefined;
                
                inferredProps.push({
                  name: propName,
                  type: this.mapTypeScriptTypeToInferredType(type),
                  required: !isOptional,
                  description,
                  usage: 1, // Assume used at least once if defined
                  inference: 'definite'
                });
              }
            });
          }
        }
        
        // Check for type aliases that could be Props
        if (ts.isTypeAliasDeclaration(node) && 
            node.name.text.includes('Props')) {
          if (ts.isTypeLiteralNode(node.type)) {
            node.type.members.forEach(member => {
              if (ts.isPropertySignature(member) && member.name) {
                const propName = member.name.getText(sourceFile);
                const type = member.type ? member.type.getText(sourceFile) : 'any';
                const isOptional = member.questionToken !== undefined;
                
                inferredProps.push({
                  name: propName,
                  type: this.mapTypeScriptTypeToInferredType(type),
                  required: !isOptional,
                  usage: 1,
                  inference: 'definite'
                });
              }
            });
          }
        }
        
        // Look for destructured props in function components
        if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
          const params = node.parameters;
          if (params.length > 0) {
            const firstParam = params[0];
            
            // Check if the first parameter is a props destructure
            if (firstParam.name && ts.isObjectBindingPattern(firstParam.name)) {
              firstParam.name.elements.forEach(element => {
                if (ts.isBindingElement(element) && element.name) {
                  const propName = element.name.getText(sourceFile);
                  let type = 'any';
                  
                  // Try to get the type from parameter type annotation
                  if (firstParam.type && ts.isTypeLiteralNode(firstParam.type)) {
                    const propSignature = firstParam.type.members.find(m => 
                      ts.isPropertySignature(m) && 
                      m.name && 
                      m.name.getText(sourceFile) === propName
                    );
                    
                    if (propSignature && ts.isPropertySignature(propSignature) && propSignature.type) {
                      type = propSignature.type.getText(sourceFile);
                    }
                  }
                  
                  // Check for default value
                  let defaultValue;
                  if (element.initializer) {
                    defaultValue = element.initializer.getText(sourceFile);
                  }
                  
                  inferredProps.push({
                    name: propName,
                    type: this.mapTypeScriptTypeToInferredType(type),
                    required: defaultValue === undefined,
                    defaultValue,
                    usage: 1,
                    inference: 'definite'
                  });
                }
              });
            }
          }
        }
        
        // Continue traversing
        ts.forEachChild(node, visit);
      };
      
      // Start traversal
      ts.forEachChild(sourceFile, visit);
      
    } catch (error) {
      console.error('Error extracting existing prop types:', error);
      // Continue with whatever props we found
    }
    
    return inferredProps;
  }
  
  /**
   * Extract props from component usage examples
   * 
   * @param usageExamples Array of code snippets showing component usage
   * @returns Array of inferred props based on usage
   */
  private extractPropsFromUsage(usageExamples: string[]): InferredProp[] {
    const propMap = new Map<string, InferredProp>();
    
    for (const usage of usageExamples) {
      try {
        // Create a source file from the usage example
        const sourceFile = ts.createSourceFile(
          'usage.tsx',
          usage,
          ts.ScriptTarget.Latest,
          true
        );
        
        // Visitor function to extract JSX usages
        const visit = (node: ts.Node) => {
          if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
            // Check attributes
            const attributes = node.attributes.properties;
            
            attributes.forEach(attr => {
              if (ts.isJsxAttribute(attr) && attr.name) {
                const propName = attr.name.getText(sourceFile);
                let inferredType: InferredPropType | string = InferredPropType.ANY;
                let inferredValue: any = undefined;
                
                // Analyze attribute value to infer type
                if (attr.initializer) {
                  if (ts.isStringLiteral(attr.initializer)) {
                    inferredType = InferredPropType.STRING;
                    inferredValue = attr.initializer.text;
                  } 
                  else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
                    const expr = attr.initializer.expression;
                    
                    if (ts.isNumericLiteral(expr)) {
                      inferredType = InferredPropType.NUMBER;
                      inferredValue = Number(expr.text);
                    }
                    else if (expr.kind === ts.SyntaxKind.TrueKeyword || 
                             expr.kind === ts.SyntaxKind.FalseKeyword) {
                      inferredType = InferredPropType.BOOLEAN;
                      inferredValue = expr.kind === ts.SyntaxKind.TrueKeyword;
                    }
                    else if (ts.isArrayLiteralExpression(expr)) {
                      inferredType = InferredPropType.ARRAY;
                      // Try to infer the array type
                      inferredValue = [];
                    }
                    else if (ts.isObjectLiteralExpression(expr)) {
                      inferredType = InferredPropType.OBJECT;
                      inferredValue = {};
                    }
                    else if (ts.isArrowFunction(expr) || ts.isFunctionExpression(expr)) {
                      inferredType = InferredPropType.FUNCTION;
                    }
                    else if (ts.isJsxElement(expr) || ts.isJsxFragment(expr) || 
                             ts.isJsxSelfClosingElement(expr)) {
                      inferredType = InferredPropType.ELEMENT;
                    }
                  }
                  else {
                    // Boolean prop with no value (e.g., <Component isActive />)
                    inferredType = InferredPropType.BOOLEAN;
                    inferredValue = true;
                  }
                }
                
                // Update the prop map
                if (propMap.has(propName)) {
                  const existing = propMap.get(propName)!;
                  existing.usage++;
                  
                  // Refine the type if we have a more specific one
                  if (existing.type === InferredPropType.ANY && inferredType !== InferredPropType.ANY) {
                    existing.type = inferredType;
                  }
                  // If we have different types, consider it a union
                  else if (existing.type !== inferredType && inferredType !== InferredPropType.ANY) {
                    existing.type = InferredPropType.UNION;
                    existing.unionTypes = existing.unionTypes || [existing.type.toString()];
                    if (!existing.unionTypes.includes(inferredType.toString())) {
                      existing.unionTypes.push(inferredType.toString());
                    }
                  }
                } else {
                  propMap.set(propName, {
                    name: propName,
                    type: inferredType,
                    required: true, // Assume required until we find examples without it
                    defaultValue: inferredValue,
                    usage: 1,
                    inference: 'probable'
                  });
                }
              }
            });
          }
          
          // Continue traversal
          ts.forEachChild(node, visit);
        };
        
        // Start traversal
        ts.forEachChild(sourceFile, visit);
        
      } catch (error) {
        console.error('Error extracting props from usage:', error);
        // Continue with the next example
      }
    }
    
    // Convert the map to an array
    return Array.from(propMap.values());
  }
  
  /**
   * Merge existing props with props derived from usage
   * 
   * @param existingProps Props from existing type definitions
   * @param usageProps Props derived from usage examples
   * @returns Merged prop array
   */
  private mergeProps(existingProps: InferredProp[], usageProps: InferredProp[]): InferredProp[] {
    const mergedProps = [...existingProps];
    const existingPropNames = new Set(existingProps.map(p => p.name));
    
    // Add props from usage that don't exist in the component definition
    for (const usageProp of usageProps) {
      if (!existingPropNames.has(usageProp.name)) {
        mergedProps.push(usageProp);
      } else {
        // Update usage count for existing props
        const existingProp = mergedProps.find(p => p.name === usageProp.name);
        if (existingProp) {
          existingProp.usage += usageProp.usage;
          
          // Keep existing type, but note union possibilities
          if (usageProp.type !== existingProp.type) {
            existingProp.unionTypes = existingProp.unionTypes || [existingProp.type.toString()];
            if (usageProp.type !== InferredPropType.ANY &&
                !existingProp.unionTypes.includes(usageProp.type.toString())) {
              existingProp.unionTypes.push(usageProp.type.toString());
            }
          }
        }
      }
    }
    
    return mergedProps;
  }
  
  /**
   * Generate TypeScript interface for component props
   * 
   * @param componentName Name of the component
   * @param props Inferred props array
   * @returns TypeScript interface code
   */
  private generateInterface(componentName: string, props: InferredProp[]): string {
    // Create a clean component name (without prefix like "App")
    const cleanName = componentName.replace(/[^a-zA-Z0-9]/g, '');
    
    let interfaceCode = `interface ${cleanName}Props {\n`;
    
    for (const prop of props) {
      // Add JSDoc comment if available
      if (prop.description) {
        interfaceCode += `  /**\n   * ${prop.description}\n   */\n`;
      }
      
      // Generate the property with its type
      let typeStr = this.getTypeScriptType(prop);
      interfaceCode += `  ${prop.name}${prop.required ? '' : '?'}: ${typeStr};\n`;
    }
    
    interfaceCode += '}\n';
    return interfaceCode;
  }
  
  /**
   * Generate props destructuring pattern for function components
   * 
   * @param props Inferred props array
   * @returns Destructuring pattern code
   */
  private generatePropsDestructuring(props: InferredProp[]): string {
    if (props.length === 0) {
      return 'function Component() {';
    }
    
    // Generate destructuring with default values where available
    const destructuredProps = props.map(prop => {
      if (prop.defaultValue !== undefined) {
        return `${prop.name} = ${this.stringifyDefaultValue(prop.defaultValue)}`;
      }
      return prop.name;
    });
    
    return `function Component({ ${destructuredProps.join(', ')} }) {`;
  }
  
  /**
   * Generate prop defaults code
   * 
   * @param props Inferred props array
   * @returns Prop defaults code
   */
  private generatePropDefaults(props: InferredProp[]): string {
    const propsWithDefaults = props.filter(p => p.defaultValue !== undefined);
    
    if (propsWithDefaults.length === 0) {
      return '';
    }
    
    let defaultsCode = 'Component.defaultProps = {\n';
    
    for (const prop of propsWithDefaults) {
      defaultsCode += `  ${prop.name}: ${this.stringifyDefaultValue(prop.defaultValue)},\n`;
    }
    
    defaultsCode += '};\n';
    return defaultsCode;
  }
  
  /**
   * Generate PropTypes validation code for non-TypeScript projects
   * 
   * @param componentName Name of the component
   * @param props Inferred props array
   * @returns PropTypes validation code
   */
  private generatePropTypes(componentName: string, props: InferredProp[]): string {
    if (props.length === 0) {
      return '';
    }
    
    let propTypesCode = 'Component.propTypes = {\n';
    
    for (const prop of props) {
      let propTypeExpr = 'PropTypes.any';
      
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
            const enumValues = prop.enumValues.map(v => `'${v}'`).join(', ');
            propTypeExpr = `PropTypes.oneOf([${enumValues}])`;
          }
          break;
        case InferredPropType.UNION:
          if (prop.unionTypes && prop.unionTypes.length > 0) {
            const unionTypes = prop.unionTypes.map(t => 
              `PropTypes.${this.mapInferredTypeToPropType(t)}`
            ).join(', ');
            propTypeExpr = `PropTypes.oneOfType([${unionTypes}])`;
          }
          break;
      }
      
      // Make required if needed
      if (prop.required) {
        propTypeExpr += '.isRequired';
      }
      
      propTypesCode += `  ${prop.name}: ${propTypeExpr},\n`;
    }
    
    propTypesCode += '};\n';
    return propTypesCode;
  }
  
  /**
   * Map TypeScript type string to our InferredPropType enum
   * 
   * @param tsType TypeScript type string
   * @returns Mapped InferredPropType or original string
   */
  private mapTypeScriptTypeToInferredType(tsType: string): InferredPropType | string {
    if (tsType.includes('string')) return InferredPropType.STRING;
    if (tsType.includes('number')) return InferredPropType.NUMBER;
    if (tsType.includes('boolean')) return InferredPropType.BOOLEAN;
    if (tsType.includes('Date')) return InferredPropType.DATE;
    if (tsType.includes('ReactElement')) return InferredPropType.ELEMENT;
    if (tsType.includes('ReactNode')) return InferredPropType.NODE;
    if (tsType.includes('Array') || tsType.includes('[]')) return InferredPropType.ARRAY;
    if (tsType.includes('Function') || tsType.includes('=>')) return InferredPropType.FUNCTION;
    if (tsType.includes('Record') || tsType.includes('{')) return InferredPropType.OBJECT;
    if (tsType.includes('|')) return InferredPropType.UNION;
    
    // Return the original type if no match
    return tsType;
  }
  
  /**
   * Convert InferredPropType to PropTypes equivalent
   * 
   * @param inferredType The inferred type string
   * @returns PropTypes equivalent
   */
  private mapInferredTypeToPropType(inferredType: string): string {
    switch (inferredType) {
      case InferredPropType.STRING: return 'string';
      case InferredPropType.NUMBER: return 'number';
      case InferredPropType.BOOLEAN: return 'bool';
      case InferredPropType.OBJECT: return 'object';
      case InferredPropType.ARRAY: return 'array';
      case InferredPropType.FUNCTION: return 'func';
      case InferredPropType.DATE: return 'instanceOf(Date)';
      case InferredPropType.ELEMENT: return 'element';
      case InferredPropType.NODE: return 'node';
      default: return 'any';
    }
  }
  
  /**
   * Get TypeScript type string for an inferred prop
   * 
   * @param prop The inferred prop
   * @returns TypeScript type string
   */
  private getTypeScriptType(prop: InferredProp): string {
    if (prop.type === InferredPropType.UNION && prop.unionTypes) {
      return prop.unionTypes.join(' | ');
    }
    
    if (prop.type === InferredPropType.ENUM && prop.enumValues) {
      return prop.enumValues.map(v => `'${v}'`).join(' | ');
    }
    
    if (prop.type === InferredPropType.ARRAY && prop.arrayType) {
      return `${prop.arrayType}[]`;
    }
    
    switch (prop.type) {
      case InferredPropType.STRING: return 'string';
      case InferredPropType.NUMBER: return 'number';
      case InferredPropType.BOOLEAN: return 'boolean';
      case InferredPropType.OBJECT: return 'Record<string, any>';
      case InferredPropType.ARRAY: return 'any[]';
      case InferredPropType.FUNCTION: return '() => void';
      case InferredPropType.DATE: return 'Date';
      case InferredPropType.ELEMENT: return 'React.ReactElement';
      case InferredPropType.NODE: return 'React.ReactNode';
      default: return prop.type.toString();
    }
  }
  
  /**
   * Convert a default value to a string representation
   * 
   * @param value The default value
   * @returns String representation
   */
  private stringifyDefaultValue(value: any): string {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    
    if (typeof value === 'string') return `'${value}'`;
    if (typeof value === 'boolean' || typeof value === 'number') return value.toString();
    
    if (Array.isArray(value)) return '[]';
    if (typeof value === 'object') return '{}';
    
    return 'undefined';
  }
  
  /**
   * Apply inferred types to component code
   * 
   * @param componentCode Original component code
   * @param inferenceResult Inference result
   * @returns Updated component code with type information
   */
  applyInferredTypes(componentCode: string, inferenceResult: InferenceResult): string {
    try {
      // Create a source file from the component code
      const sourceFile = ts.createSourceFile(
        'component.tsx',
        componentCode,
        ts.ScriptTarget.Latest,
        true
      );
      
      // Check if the component already has a Props interface
      let hasPropsInterface = false;
      let hasPropsType = false;
      
      // Visitor function to check for existing Props interface/type
      const checkExisting = (node: ts.Node) => {
        if (ts.isInterfaceDeclaration(node) && node.name.text.includes('Props')) {
          hasPropsInterface = true;
        }
        if (ts.isTypeAliasDeclaration(node) && node.name.text.includes('Props')) {
          hasPropsType = true;
        }
        ts.forEachChild(node, checkExisting);
      };
      
      // Start traversal
      ts.forEachChild(sourceFile, checkExisting);
      
      // If no Props interface/type exists, add one
      let updatedCode = componentCode;
      if (!hasPropsInterface && !hasPropsType) {
        // Find import statements to add the interface after them
        const importRegex = /^import.*?;(\r?\n|$)/gm;
        const lastImportMatch = [...componentCode.matchAll(importRegex)].pop();
        
        if (lastImportMatch) {
          const insertPos = lastImportMatch.index! + lastImportMatch[0].length;
          updatedCode = componentCode.substring(0, insertPos) + 
                       '\n' + inferenceResult.interfaceText + '\n' + 
                       componentCode.substring(insertPos);
        } else {
          // No imports, add at the beginning
          updatedCode = inferenceResult.interfaceText + '\n\n' + componentCode;
        }
      }
      
      // Update the component function/class to use the props
      const functionRegex = /function\s+(\w+)\s*\([^)]*\)/;
      const arrowRegex = /const\s+(\w+)\s*=\s*(\([^)]*\)|[^=]*)\s*=>/;
      const classRegex = /class\s+(\w+)\s+extends\s+React\.Component/;
      
      // Update function component
      const functionMatch = updatedCode.match(functionRegex);
      if (functionMatch) {
        const componentName = functionMatch[1];
        const oldFunctionDef = functionMatch[0];
        
        // Format a new function definition with props type
        const newFunctionDef = `function ${componentName}(props: ${componentName}Props)`;
        
        // Replace the function definition
        updatedCode = updatedCode.replace(oldFunctionDef, newFunctionDef);
        
        // Add destructuring if needed
        if (inferenceResult.props.length > 0 && !updatedCode.includes('{')) {
          const bodyStartRegex = new RegExp(`function\\s+${componentName}\\s*\\([^)]*\\)\\s*{`);
          const bodyStartMatch = updatedCode.match(bodyStartRegex);
          
          if (bodyStartMatch) {
            const oldBodyStart = bodyStartMatch[0];
            const destructureNames = inferenceResult.props.map(p => p.name).join(', ');
            const newBodyStart = `${oldBodyStart}\n  const { ${destructureNames} } = props;`;
            
            updatedCode = updatedCode.replace(oldBodyStart, newBodyStart);
          }
        }
      }
      
      // Update arrow function component
      const arrowMatch = updatedCode.match(arrowRegex);
      if (arrowMatch) {
        const componentName = arrowMatch[1];
        const oldArrowDef = arrowMatch[0];
        
        // Format a new arrow function definition with props type
        const newArrowDef = `const ${componentName} = (props: ${componentName}Props) =>`;
        
        // Replace the arrow definition
        updatedCode = updatedCode.replace(oldArrowDef, newArrowDef);
        
        // Add destructuring if needed (similar to function component above)
        if (inferenceResult.props.length > 0 && !updatedCode.includes('{')) {
          const bodyStartRegex = new RegExp(`const\\s+${componentName}\\s*=\\s*\\([^)]*\\)\\s*=>\\s*{`);
          const bodyStartMatch = updatedCode.match(bodyStartRegex);
          
          if (bodyStartMatch) {
            const oldBodyStart = bodyStartMatch[0];
            const destructureNames = inferenceResult.props.map(p => p.name).join(', ');
            const newBodyStart = `${oldBodyStart}\n  const { ${destructureNames} } = props;`;
            
            updatedCode = updatedCode.replace(oldBodyStart, newBodyStart);
          }
        }
      }
      
      // Update class component
      const classMatch = updatedCode.match(classRegex);
      if (classMatch) {
        const componentName = classMatch[1];
        const oldClassDef = classMatch[0];
        
        // Format a new class definition with props type
        const newClassDef = `class ${componentName} extends React.Component<${componentName}Props>`;
        
        // Replace the class definition
        updatedCode = updatedCode.replace(oldClassDef, newClassDef);
      }
      
      // Add defaultProps if any props have default values
      if (inferenceResult.propDefaultsCode && updatedCode.indexOf('defaultProps') === -1) {
        // Find the component end to add defaultProps
        const exportIndex = updatedCode.lastIndexOf('export default');
        if (exportIndex !== -1) {
          // Add before export
          updatedCode = updatedCode.substring(0, exportIndex) + 
                       '\n' + inferenceResult.propDefaultsCode + '\n\n' + 
                       updatedCode.substring(exportIndex);
        } else {
          // Add at the end
          updatedCode += '\n\n' + inferenceResult.propDefaultsCode;
        }
      }
      
      return updatedCode;
    } catch (error) {
      console.error('Error applying inferred types:', error);
      return componentCode;
    }
  }
}

export default PropTypeInference;
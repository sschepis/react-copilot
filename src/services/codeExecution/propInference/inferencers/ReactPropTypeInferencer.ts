import * as ts from 'typescript';
import { PropTypeInferencerBase } from '../PropTypeInferencerBase';
import {
  CodeSource,
  PropInferenceOptions,
  PropInferenceContext,
  InferenceResult,
  InferredProp,
  InferredPropType
} from '../types';

/**
 * Specialized inferencer for React component prop types
 */
export class ReactPropTypeInferencer extends PropTypeInferencerBase {
  constructor() {
    super('ReactPropTypeInferencer', [
      'react-component',
      'react-functional-component',
      'react-class-component'
    ]);
  }
  
  /**
   * Implementation of the prop type inference for React components
   */
  protected inferPropTypesImplementation(
    code: CodeSource,
    options: PropInferenceOptions,
    context: PropInferenceContext
  ): InferenceResult {
    // Extract component name
    const componentName = context.componentName || 'Component';
    
    // Extract existing props from component code
    const existingProps = this.extractExistingPropTypes(code);
    
    // Extract props from usage examples
    const usageProps = code.usageExamples && code.usageExamples.length > 0 ? 
      this.extractPropsFromUsage(code) : [];
    
    // Merge existing props with usage-derived props
    const mergedProps = this.mergeProps(existingProps, usageProps);
    
    // Generate TypeScript interface
    const interfaceText = options.generateTypeScriptInterfaces ? 
      this.generateInterface(componentName, mergedProps) : '';
    
    // Generate props destructuring pattern
    const propsDestructuring = this.generatePropsDestructuring(componentName, mergedProps);
    
    // Generate prop defaults code
    const propDefaultsCode = options.generateDefaults ? 
      this.generatePropDefaults(componentName, mergedProps) : '';
    
    // Generate PropTypes validation
    const propTypesCode = options.generatePropTypes ? 
      this.generatePropTypes(componentName, mergedProps) : '';
    
    return {
      componentName,
      props: mergedProps,
      interfaceText,
      propsDestructuring,
      propDefaultsCode,
      propTypesCode
    };
  }
  
  /**
   * Extract existing prop types from component source code
   */
  private extractExistingPropTypes(code: CodeSource): InferredProp[] {
    const inferredProps: InferredProp[] = [];
    
    try {
      // Get the AST
      const sourceFile = code.componentAst || 
        this.parseAST(code.componentCode, code.filePath);
      
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
   */
  private extractPropsFromUsage(code: CodeSource): InferredProp[] {
    const propMap = new Map<string, InferredProp>();
    
    // Process usage examples
    const usageExamples = code.usageExamples || [];
    const usageAsts = code.usageAsts || [];
    
    // Process each usage example
    for (let i = 0; i < usageExamples.length; i++) {
      try {
        // Get the AST (or parse it if we don't have it)
        const sourceFile = usageAsts[i] || 
          this.parseAST(usageExamples[i]);
        
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
   * Generate prop defaults code
   */
  private generatePropDefaults(componentName: string, props: InferredProp[]): string {
    const propsWithDefaults = props.filter(p => p.defaultValue !== undefined);
    
    if (propsWithDefaults.length === 0) {
      return '';
    }
    
    let defaultsCode = `${componentName}.defaultProps = {\n`;
    
    for (const prop of propsWithDefaults) {
      defaultsCode += `  ${prop.name}: ${this.stringifyDefaultValue(prop.defaultValue)},\n`;
    }
    
    defaultsCode += '};\n';
    return defaultsCode;
  }
}
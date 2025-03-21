import * as ts from 'typescript';
import { StyleApproach, StyleGeneratorOptions } from './types';

/**
 * Utility functions for style generation
 */
export class StyleUtils {
  /**
   * Detect the most appropriate style approach based on project configuration
   */
  static detectStyleApproach(ast: ts.SourceFile, dependencies: string[]): StyleApproach {
    // Check for styled-components
    if (dependencies.includes('styled-components')) {
      return StyleApproach.STYLED_COMPONENTS;
    }
    
    // Check for emotion
    if (dependencies.includes('@emotion/react') || dependencies.includes('@emotion/styled')) {
      return StyleApproach.EMOTION;
    }
    
    // Check for Material UI
    if (dependencies.includes('@mui/material') || dependencies.includes('@material-ui/core')) {
      return StyleApproach.MATERIAL_UI;
    }
    
    // Check for Chakra UI
    if (dependencies.includes('@chakra-ui/react')) {
      return StyleApproach.CHAKRA_UI;
    }
    
    // Check for Tailwind
    if (dependencies.includes('tailwindcss')) {
      return StyleApproach.TAILWIND;
    }
    
    // Check for import statements in the file
    const importStatements = ast.statements.filter(ts.isImportDeclaration);
    for (const importStmt of importStatements) {
      const importPath = importStmt.moduleSpecifier.getText().replace(/['"]/g, '');
      
      if (importPath.endsWith('.scss')) {
        return StyleApproach.SCSS;
      }
      
      if (importPath.endsWith('.less')) {
        return StyleApproach.LESS;
      }
      
      if (importPath.includes('css-modules') || importPath.match(/\.module\.css$/)) {
        return StyleApproach.CSS_MODULES;
      }
    }
    
    // Default to plain CSS
    return StyleApproach.CSS;
  }
  
  /**
   * Extract component props from AST
   */
  static extractComponentProps(ast: ts.SourceFile): Record<string, any> {
    const props: Record<string, any> = {};
    
    // Find component props interface/type
    const interfaces = ast.statements.filter(ts.isInterfaceDeclaration);
    for (const interfaceDecl of interfaces) {
      if (interfaceDecl.name.text.includes('Props')) {
        // Extract prop names and types
        for (const member of interfaceDecl.members) {
          if (ts.isPropertySignature(member) && member.name) {
            const propName = member.name.getText();
            props[propName] = undefined; // Default to undefined
            
            // Try to extract default values from JSDoc or type annotations
            // Note: PropertySignature doesn't have an initializer property
            // We'd need to look elsewhere for default values (e.g., in component initialization)
            
            // Get property type if available
            if (member.type) {
              const typeText = member.type.getText();
              if (typeText.includes('string')) {
                props[propName] = '';
              } else if (typeText.includes('number')) {
                props[propName] = 0;
              } else if (typeText.includes('boolean')) {
                props[propName] = false;
              }
            }
          }
        }
      }
    }
    
    return props;
  }
  
  /**
   * Extract color names from component code
   */
  static extractColorNames(ast: ts.SourceFile): string[] {
    const colorNames: Set<string> = new Set();
    const colorRegex = /color|background|border|fill|stroke/i;
    
    // Function to recursively visit nodes and extract color-related identifiers
    const visitNode = (node: ts.Node) => {
      if (ts.isIdentifier(node) && colorRegex.test(node.text)) {
        colorNames.add(node.text);
      }
      
      node.forEachChild(visitNode);
    };
    
    // Visit all nodes in the AST
    visitNode(ast);
    
    return Array.from(colorNames);
  }
  
  /**
   * Create default style options based on component analysis
   */
  static createDefaultOptions(
    ast: ts.SourceFile,
    dependencies: string[]
  ): StyleGeneratorOptions {
    const approach = this.detectStyleApproach(ast, dependencies);
    const props = this.extractComponentProps(ast);
    const colorNames = this.extractColorNames(ast);
    
    // Create default options based on analysis
    const options: StyleGeneratorOptions = {
      approach,
      typography: {
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSizes: {
          xs: '0.75rem',
          sm: '0.875rem',
          md: '1rem',
          lg: '1.125rem',
          xl: '1.25rem'
        },
        fontWeights: {
          normal: 400,
          medium: 500,
          bold: 700
        }
      },
      colors: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        background: '#ffffff',
        text: '#1f2937'
      },
      spacing: {
        unit: 'rem',
        scale: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem'
        }
      },
      breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px'
      }
    };
    
    return options;
  }
  
  /**
   * Generate CSS-in-JS friendly class name from component name
   */
  static generateClassName(componentName: string): string {
    // Remove non-alphanumeric characters and convert to camelCase
    const cleanName = componentName.replace(/[^a-zA-Z0-9]/g, '');
    return cleanName.charAt(0).toLowerCase() + cleanName.slice(1);
  }
  
  /**
   * Convert color to specific format (hex, rgb, etc)
   */
  static convertColorFormat(color: string, format: 'hex' | 'rgb' | 'rgba'): string {
    // Basic implementation - would need to be expanded for production use
    if (format === 'hex' && color.startsWith('#')) {
      return color;
    }
    
    if (format === 'rgb' && color.startsWith('rgb(')) {
      return color;
    }
    
    if (format === 'rgba' && color.startsWith('rgba(')) {
      return color;
    }
    
    // Simple hex to rgb conversion
    if (format === 'rgb' && color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgb(${r}, ${g}, ${b})`;
    }
    
    // Default return original color
    return color;
  }
  
  /**
   * Extract meaningful property name from prop value
   * E.g., "#ff0000" might be "red", "2px solid black" might be "borderBlack"
   */
  static inferPropertyName(value: string, defaultPrefix: string = 'prop'): string {
    // Color handling
    const colorMap: Record<string, string> = {
      '#ff0000': 'red',
      '#00ff00': 'green',
      '#0000ff': 'blue',
      '#ffff00': 'yellow',
      '#ff00ff': 'magenta',
      '#00ffff': 'cyan',
      '#000000': 'black',
      '#ffffff': 'white',
      // Add more common colors
    };
    
    // Check if value is a mapped color
    if (colorMap[value]) {
      return colorMap[value];
    }
    
    // Check for common patterns
    if (value.includes('px')) {
      if (value.includes('solid') || value.includes('dashed') || value.includes('dotted')) {
        return 'border';
      }
      return 'size';
    }
    
    if (value.includes('rem') || value.includes('em')) {
      return 'spacing';
    }
    
    if (value.includes('flex')) {
      return 'flex';
    }
    
    // Default to generic name
    return `${defaultPrefix}${Math.floor(Math.random() * 1000)}`;
  }
}
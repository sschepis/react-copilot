import { Permissions } from './types';
import * as acorn from 'acorn';
import * as acornWalk from 'acorn-walk';
// Import the default export from acorn-jsx
import jsx from 'acorn-jsx';

// Create a parser with JSX support
const parser = acorn.Parser.extend(jsx());

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates code changes against security rules and permissions
 * 
 * @param newCode - The new code to validate
 * @param oldCode - The original code for comparison
 * @param permissions - User permissions
 * @returns Validation result
 */
export function validateCode(
  newCode: string,
  oldCode: string,
  permissions: Permissions
): ValidationResult {
  try {
    // Parse the code into an AST
    const ast = parser.parse(newCode, {
      ecmaVersion: 2020,
      sourceType: 'module',
    });
    
    // Check if component creation is allowed
    if (!permissions.allowComponentCreation) {
      const componentDefinitionCount = countComponentDefinitions(ast);
      const oldComponentDefinitionCount = countComponentDefinitions(
        parser.parse(oldCode, {
          ecmaVersion: 2020,
          sourceType: 'module',
        })
      );
      
      if (componentDefinitionCount > oldComponentDefinitionCount) {
        return {
          isValid: false,
          error: 'Component creation is not allowed with current permissions'
        };
      }
    }
    
    // Check if network requests are allowed
    if (!permissions.allowNetworkRequests && hasNetworkRequests(ast)) {
      return {
        isValid: false,
        error: 'Network requests are not allowed with current permissions'
      };
    }
    
    // Check if style changes are allowed
    if (!permissions.allowStyleChanges && hasStyleChanges(newCode, oldCode)) {
      return {
        isValid: false,
        error: 'Style changes are not allowed with current permissions'
      };
    }
    
    // Check if logic changes are allowed
    if (!permissions.allowLogicChanges && hasLogicChanges(newCode, oldCode)) {
      return {
        isValid: false,
        error: 'Logic changes are not allowed with current permissions'
      };
    }
    
    // Check for potentially dangerous code
    const dangerousCode = checkForDangerousCode(ast);
    if (dangerousCode) {
      return {
        isValid: false,
        error: `Potentially dangerous code detected: ${dangerousCode}`
      };
    }
    
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `Code validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Count component definitions in the AST
 */
function countComponentDefinitions(ast: any): number {
  let count = 0;
  
  acornWalk.simple(ast, {
    FunctionDeclaration(node: any) {
      if (node.id && /^[A-Z]/.test(node.id.name)) {
        count++;
      }
    },
    VariableDeclarator(node: any) {
      if (
        node.id &&
        node.id.type === 'Identifier' &&
        /^[A-Z]/.test(node.id.name) &&
        node.init &&
        (node.init.type === 'ArrowFunctionExpression' || node.init.type === 'FunctionExpression')
      ) {
        count++;
      }
    },
    ClassDeclaration(node: any) {
      if (node.id && /^[A-Z]/.test(node.id.name)) {
        count++;
      }
    }
  });
  
  return count;
}

/**
 * Check if the code contains network requests
 */
function hasNetworkRequests(ast: any): boolean {
  let found = false;
  
  acornWalk.simple(ast, {
    Identifier(node: any) {
      if (
        ['fetch', 'XMLHttpRequest', 'axios'].includes(node.name) ||
        (node.name.toLowerCase().includes('http') && node.name.toLowerCase().includes('request'))
      ) {
        found = true;
      }
    },
    Literal(node: any) {
      if (
        typeof node.value === 'string' &&
        (node.value.startsWith('http://') || node.value.startsWith('https://'))
      ) {
        found = true;
      }
    }
  });
  
  return found;
}

/**
 * Check if the code contains style changes
 */
function hasStyleChanges(newCode: string, oldCode: string): boolean {
  // Simple check for style-related keywords
  const styleRegex = /style|className|css|margin|padding|color|background|font|width|height/g;
  
  const newMatches = newCode.match(styleRegex) || [];
  const oldMatches = oldCode.match(styleRegex) || [];
  
  return newMatches.length !== oldMatches.length;
}

/**
 * Check if the code contains logic changes
 */
function hasLogicChanges(newCode: string, oldCode: string): boolean {
  // Simple check for logic-related keywords
  const logicRegex = /if|else|for|while|switch|case|return|function|=>/g;
  
  const newMatches = newCode.match(logicRegex) || [];
  const oldMatches = oldCode.match(logicRegex) || [];
  
  return newMatches.length !== oldMatches.length;
}

/**
 * Check for potentially dangerous code
 */
function checkForDangerousCode(ast: any): string | null {
  let dangerousCode = null;
  
  acornWalk.simple(ast, {
    Identifier(node: any) {
      // Check for dangerous globals
      const dangerousGlobals = [
        'eval', 'Function', 'setTimeout', 'setInterval',
        'document.write', 'window.open', 'localStorage',
        'sessionStorage', 'indexedDB', 'document.cookie'
      ];
      
      if (dangerousGlobals.includes(node.name)) {
        dangerousCode = node.name;
      }
    },
    MemberExpression(node: any) {
      // Check for dangerous methods
      if (
        node.object.type === 'Identifier' &&
        node.object.name === 'document' &&
        node.property.type === 'Identifier' &&
        ['write', 'writeln'].includes(node.property.name)
      ) {
        dangerousCode = `document.${node.property.name}`;
      }
      
      // Check for script injection
      if (
        node.property.type === 'Identifier' &&
        node.property.name === 'innerHTML'
      ) {
        dangerousCode = 'innerHTML (potential XSS)';
      }
    }
  });
  
  return dangerousCode;
}

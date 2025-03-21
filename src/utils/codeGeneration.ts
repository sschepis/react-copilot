import { Message } from './types';

/**
 * Extracts code blocks from an LLM response
 * 
 * @param content - The message content from the LLM
 * @returns Array of extracted code blocks
 */
export function extractCodeBlocks(content: string): string[] {
  // Match code blocks with ```jsx, ```tsx, ```javascript, or ```typescript delimiters
  const codeBlockRegex = /```(?:jsx|tsx|javascript|typescript)?\s*([\s\S]*?)```/g;
  const codeBlocks: string[] = [];
  let match;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Extract the code inside the code block (match[1])
    const code = match[1].trim();
    if (code) {
      codeBlocks.push(code);
    }
  }
  
  return codeBlocks;
}

/**
 * Creates a prompt for generating code changes
 * 
 * @param component - The component to modify
 * @param request - The user's request
 * @returns A prompt for the LLM
 */
export function createCodeGenerationPrompt(
  componentName: string,
  sourceCode: string,
  request: string
): string {
  return `You are tasked with modifying a React component based on a user request.

Component Name: ${componentName}
Current Source Code:
\`\`\`jsx
${sourceCode}
\`\`\`

User Request: ${request}

Please provide an updated version of this component that fulfills the user's request.
Make sure to maintain the existing functionality unless explicitly asked to change it.
Return the full component code, not just the changes.

Your response should have this format:
1. A brief explanation of the changes you're making
2. The complete updated component code in a code block with \`\`\`jsx delimiters
3. A summary of what was changed and why

Updated Component:`;
}

/**
 * Analyzes the component structure to provide context to the LLM
 * 
 * @param sourceCode - The component source code
 * @returns Analysis of the component structure
 */
export function analyzeComponentStructure(sourceCode: string): {
  imports: string[];
  hooks: string[];
  jsx: string;
} {
  // Simple regex-based analysis (in a real implementation, use AST parsing)
  const importRegex = /import\s+.*?from\s+['"].*?['"]/g;
  const hooksRegex = /use[A-Z]\w+\(/g;
  const jsxStartRegex = /return\s*\(\s*</;
  
  const imports = (sourceCode.match(importRegex) || []).map(imp => imp.trim());
  const hooks = (sourceCode.match(hooksRegex) || []).map(hook => hook.trim());
  
  // Extract JSX (very simplified approach)
  let jsx = "";
  const jsxStartMatch = jsxStartRegex.exec(sourceCode);
  if (jsxStartMatch) {
    const startIndex = jsxStartMatch.index;
    let braceCount = 0;
    let inJsx = false;
    
    for (let i = startIndex; i < sourceCode.length; i++) {
      if (sourceCode[i] === '(') {
        braceCount++;
        if (!inJsx) inJsx = true;
      } else if (sourceCode[i] === ')') {
        braceCount--;
        if (braceCount === 0 && inJsx) {
          jsx = sourceCode.substring(startIndex, i + 1);
          break;
        }
      }
    }
  }
  
  return {
    imports,
    hooks,
    jsx
  };
}

/**
 * Creates a system message for the LLM with app context
 * 
 * @param components - List of available components
 * @returns System message with context
 */
export function createSystemContextMessage(
  components: { id: string; name: string }[]
): Message {
  return {
    id: 'system-context',
    role: 'system',
    content: `You are a UI assistant that can modify React components in a web application.
    
Available components:
${components.map(c => `- ${c.name} (id: ${c.id})`).join('\n')}

When asked to make UI changes:
1. Identify which component(s) need to be modified
2. Ask clarifying questions if needed
3. Explain what changes you'll make
4. Provide the complete updated code
5. Explain the changes made

You can modify styles, layout, functionality, and create new components as needed.
Always return the complete code for modified components.`,
    timestamp: Date.now()
  };
}

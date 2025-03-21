import { Message } from './types';
/**
 * Extracts code blocks from an LLM response
 *
 * @param content - The message content from the LLM
 * @returns Array of extracted code blocks
 */
export declare function extractCodeBlocks(content: string): string[];
/**
 * Creates a prompt for generating code changes
 *
 * @param component - The component to modify
 * @param request - The user's request
 * @returns A prompt for the LLM
 */
export declare function createCodeGenerationPrompt(componentName: string, sourceCode: string, request: string): string;
/**
 * Analyzes the component structure to provide context to the LLM
 *
 * @param sourceCode - The component source code
 * @returns Analysis of the component structure
 */
export declare function analyzeComponentStructure(sourceCode: string): {
    imports: string[];
    hooks: string[];
    jsx: string;
};
/**
 * Creates a system message for the LLM with app context
 *
 * @param components - List of available components
 * @returns System message with context
 */
export declare function createSystemContextMessage(components: {
    id: string;
    name: string;
}[]): Message;

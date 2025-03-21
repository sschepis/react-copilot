import { CodeChangeRequest, CodeChangeResult } from '../utils/types';
/**
 * Executes code changes on a component
 *
 * @param request - The code change request
 * @returns Result of the code change operation
 */
export declare function executeCodeChange(request: CodeChangeRequest): Promise<CodeChangeResult>;

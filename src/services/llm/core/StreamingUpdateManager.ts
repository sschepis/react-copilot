import { EventEmitter } from '../../../utils/EventEmitter';
import { IStreamingUpdateManager, StreamingUpdateEvents } from './types';

/**
 * Manager for handling streaming updates from LLM providers
 * Processes text chunks, detects code blocks, and maintains state
 */
export class StreamingUpdateManager extends EventEmitter implements IStreamingUpdateManager {
  private componentName: string = '';
  private currentStream: string = '';
  private currentCode: string | null = null;
  private isStreamActive: boolean = false;
  
  /**
   * Begin a new streaming session
   * 
   * @param componentName The component being streamed
   */
  beginStream(componentName: string): void {
    this.componentName = componentName;
    this.currentStream = '';
    this.currentCode = null;
    this.isStreamActive = true;
    
    this.emit(StreamingUpdateEvents.STREAM_STARTED, {
      componentName,
      timestamp: Date.now()
    });
  }
  
  /**
   * Process a streaming chunk
   * 
   * @param chunk The chunk to process
   */
  processChunk(chunk: string): void {
    if (!this.isStreamActive) {
      return;
    }
    
    // Add chunk to current stream
    this.currentStream += chunk;
    
    // Emit chunk event
    this.emit(StreamingUpdateEvents.STREAM_CHUNK, {
      componentName: this.componentName,
      chunk,
      timestamp: Date.now()
    });
    
    // Try to extract code from the current stream
    this.extractCodeFromStream();
  }
  
  /**
   * Complete the current stream
   */
  completeStream(): void {
    if (!this.isStreamActive) {
      return;
    }
    
    // Do a final code extraction attempt
    this.extractCodeFromStream();
    
    this.isStreamActive = false;
    
    this.emit(StreamingUpdateEvents.STREAM_COMPLETED, {
      componentName: this.componentName,
      finalStream: this.currentStream,
      finalCode: this.currentCode,
      timestamp: Date.now()
    });
  }
  
  /**
   * Handle a streaming error
   * 
   * @param error The error that occurred
   */
  handleError(error: Error | string): void {
    const errorMessage = error instanceof Error ? error.message : error;
    
    this.isStreamActive = false;
    
    this.emit(StreamingUpdateEvents.STREAM_ERROR, {
      componentName: this.componentName,
      error: errorMessage,
      partialStream: this.currentStream,
      partialCode: this.currentCode,
      timestamp: Date.now()
    });
  }
  
  /**
   * Get the current generated code
   * 
   * @returns The current state of the generated code
   */
  getCurrentCode(): string | null {
    return this.currentCode;
  }
  
  /**
   * Extract code from the current stream
   * Uses regex to find code blocks in markdown format
   */
  private extractCodeFromStream(): void {
    // Look for code blocks in markdown format
    const codeBlockRegex = /```(?:jsx?|tsx?|react)?\s*([\s\S]*?)```/g;
    const matches = Array.from(this.currentStream.matchAll(codeBlockRegex));
    
    if (matches.length > 0) {
      // Get the last code block
      const lastMatch = matches[matches.length - 1];
      const codeContent = lastMatch[1].trim();
      
      // Check if this is new or updated code
      const isNewDetection = this.currentCode === null;
      const isDifferentCode = this.currentCode !== codeContent;
      
      if (isNewDetection || isDifferentCode) {
        // Update current code
        this.currentCode = codeContent;
        
        if (isNewDetection) {
          // Emit code detected event
          this.emit(StreamingUpdateEvents.CODE_DETECTED, {
            componentName: this.componentName,
            code: codeContent,
            timestamp: Date.now()
          });
        } else {
          // Emit code updated event
          this.emit(StreamingUpdateEvents.CODE_UPDATED, {
            componentName: this.componentName,
            code: codeContent,
            timestamp: Date.now()
          });
        }
      }
    } else {
      // If no code block is found but the stream contains an entire code file,
      // treat the whole stream as code if it looks like JavaScript/TypeScript
      
      // Check if stream starts with imports, function declarations, etc.
      const looksLikeCode = 
        (this.currentStream.includes('import ') || 
         this.currentStream.includes('function ') || 
         this.currentStream.includes('class ') || 
         this.currentStream.includes('const ')) &&
        (this.currentStream.includes('return') &&
         this.currentStream.includes('export'));
      
      if (looksLikeCode && this.currentCode === null) {
        this.currentCode = this.currentStream.trim();
        
        this.emit(StreamingUpdateEvents.CODE_DETECTED, {
          componentName: this.componentName,
          code: this.currentCode,
          timestamp: Date.now()
        });
      }
    }
  }
}

// Export default instance for backward compatibility
export default StreamingUpdateManager;
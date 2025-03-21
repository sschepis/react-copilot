import { Message } from '../../../utils/types';
import { 
  LLMProviderAdapter, 
  LLMProviderConfig, 
  LLMCapabilities, 
  ModelOption 
} from '../LLMProviderAdapter';

interface ClaudeMessage {
  role: string;
  content: string;
}

interface ClaudeRequestBody {
  model: string;
  messages: ClaudeMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * Anthropic Claude provider adapter implementing the LLMProviderAdapter interface
 */
export class AnthropicProvider implements LLMProviderAdapter {
  id = 'anthropic';
  name = 'Anthropic Claude';
  
  capabilities: LLMCapabilities = {
    streaming: true,
    multiModal: true, // Claude 3 models support images
    functionCalling: false, // Claude doesn't fully support function calling at the current version
    embeddings: false,
    contextSize: 100000, // Claude 3 Opus context window
    supportedLanguages: ['en'], // Will be expanded
  };

  private apiKey: string = '';
  private model: string = 'claude-3-opus-20240229';
  private temperature: number = 0.7;
  private maxTokens: number = 4000;
  private apiUrl: string = 'https://api.anthropic.com/v1';
  private isInitialized: boolean = false;

  /**
   * Initialize the Anthropic Claude provider with configuration
   */
  async initialize(config: LLMProviderConfig): Promise<void> {
    this.apiKey = config.apiKey || this.getApiKeyFromEnv() || '';
    this.model = config.model || 'claude-3-opus-20240229';
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 4000;
    this.apiUrl = config.apiUrl || 'https://api.anthropic.com/v1';

    if (!this.apiKey) {
      throw new Error('Anthropic API key is required');
    }

    // Update capabilities based on the selected model
    this.updateCapabilitiesForModel(this.model);
    this.isInitialized = true;
  }

  /**
   * Update capabilities based on the selected model
   */
  private updateCapabilitiesForModel(model: string): void {
    // Set capabilities based on model
    if (model.includes('claude-3-opus')) {
      this.capabilities.contextSize = 100000;
    } else if (model.includes('claude-3-sonnet')) {
      this.capabilities.contextSize = 200000;
    } else if (model.includes('claude-3-haiku')) {
      this.capabilities.contextSize = 200000;
    } else if (model.includes('claude-2')) {
      this.capabilities.contextSize = 100000;
      this.capabilities.multiModal = false;
    } else if (model.includes('claude-instant')) {
      this.capabilities.contextSize = 100000;
      this.capabilities.multiModal = false;
    }
  }

  /**
   * Get Anthropic API key from environment variables
   */
  private getApiKeyFromEnv(): string | undefined {
    if (typeof window !== 'undefined') {
      // Browser environment
      return (window as any).env?.ANTHROPIC_API_KEY || 
             process.env?.REACT_APP_ANTHROPIC_API_KEY;
    } else {
      // Node environment
      return process.env?.ANTHROPIC_API_KEY;
    }
  }

  /**
   * Send messages to Anthropic Claude and get a response
   */
  async sendMessage(messages: Message[]): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Anthropic provider not initialized');
    }

    try {
      // Convert from our message format to Claude's format
      const claudeMessages: ClaudeMessage[] = messages.map(msg => {
        return {
          role: msg.role === 'assistant' ? 'assistant' : msg.role === 'user' ? 'user' : 'system',
          content: msg.content
        };
      });

      const requestBody: ClaudeRequestBody = {
        model: this.model,
        messages: claudeMessages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      };

      const response = await fetch(`${this.apiUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Anthropic API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Error calling Anthropic API:', error);
      throw error;
    }
  }

  /**
   * Stream a response from Anthropic Claude
   */
  async streamResponse(messages: Message[], onChunk: (chunk: string) => void): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Anthropic provider not initialized');
    }

    try {
      // Convert from our message format to Claude's format
      const claudeMessages: ClaudeMessage[] = messages.map(msg => {
        return {
          role: msg.role === 'assistant' ? 'assistant' : msg.role === 'user' ? 'user' : 'system',
          content: msg.content
        };
      });

      const requestBody: ClaudeRequestBody = {
        model: this.model,
        messages: claudeMessages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        stream: true
      };

      const response = await fetch(`${this.apiUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Anthropic API error: ${errorData.error?.message || response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        
        // Parse SSE format
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'content_block_delta' && data.delta?.text) {
                onChunk(data.delta.text);
              }
            } catch (error) {
              // Skip non-JSON data
              if (line.slice(6) !== '[DONE]') {
                console.error('Error parsing SSE message:', error);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error streaming from Anthropic API:', error);
      throw error;
    }
  }

  /**
   * Get available models from Anthropic
   */
  async getModelOptions(): Promise<ModelOption[]> {
    // Anthropic doesn't have a model list endpoint, so we provide a hardcoded list
    return [
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        contextSize: 100000,
        description: 'Most powerful Claude model for complex tasks'
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        contextSize: 200000,
        description: 'Balanced Claude model for most tasks'
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        contextSize: 200000,
        description: 'Fastest and most compact Claude model'
      },
      {
        id: 'claude-2.1',
        name: 'Claude 2.1',
        contextSize: 100000,
        description: 'Previous generation Claude model'
      },
      {
        id: 'claude-instant-1.2',
        name: 'Claude Instant 1.2',
        contextSize: 100000,
        description: 'Fast and efficient Claude model'
      }
    ];
  }

  /**
   * Check if the Anthropic provider is available (has API key)
   */
  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }
}
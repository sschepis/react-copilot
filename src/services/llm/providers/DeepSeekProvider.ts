import { createParser, ParsedEvent, ReconnectInterval } from 'eventsource-parser';
import { Message } from '../../../utils/types';
import { 
  LLMProviderAdapter, 
  LLMProviderConfig, 
  LLMCapabilities, 
  ModelOption 
} from '../LLMProviderAdapter';

interface DeepSeekMessage {
  role: string;
  content: string;
}

interface DeepSeekRequestBody {
  model: string;
  messages: DeepSeekMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * DeepSeek provider adapter implementing the LLMProviderAdapter interface
 * DeepSeek uses OpenAI's API format but with a different base URL
 */
export class DeepSeekProvider implements LLMProviderAdapter {
  id = 'deepseek';
  name = 'DeepSeek';
  
  capabilities: LLMCapabilities = {
    streaming: true,
    multiModal: false,
    functionCalling: true,
    embeddings: true,
    contextSize: 8192, // Default, will be updated based on model
    supportedLanguages: ['en'], // Will be expanded
  };

  private apiKey: string = '';
  private model: string = 'deepseek-chat';
  private temperature: number = 0.7;
  private maxTokens: number = 2000;
  private apiUrl: string = 'https://api.deepseek.com/v1';
  private isInitialized: boolean = false;

  /**
   * Initialize the DeepSeek provider with configuration
   */
  async initialize(config: LLMProviderConfig): Promise<void> {
    this.apiKey = config.apiKey || this.getApiKeyFromEnv() || '';
    this.model = config.model || 'deepseek-chat';
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 2000;
    this.apiUrl = config.apiUrl || 'https://api.deepseek.com/v1';

    if (!this.apiKey) {
      throw new Error('DeepSeek API key is required');
    }

    this.isInitialized = true;
  }

  /**
   * Get DeepSeek API key from environment variables
   */
  private getApiKeyFromEnv(): string | undefined {
    if (typeof window !== 'undefined') {
      // Browser environment
      return (window as any).env?.DEEPSEEK_API_KEY || 
             process.env?.REACT_APP_DEEPSEEK_API_KEY;
    } else {
      // Node environment
      return process.env?.DEEPSEEK_API_KEY;
    }
  }

  /**
   * Send messages to DeepSeek and get a response
   */
  async sendMessage(messages: Message[]): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('DeepSeek provider not initialized');
    }

    try {
      // Convert from our message format to DeepSeek's format (which follows OpenAI's format)
      const deepseekMessages: DeepSeekMessage[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const requestBody: DeepSeekRequestBody = {
        model: this.model,
        messages: deepseekMessages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        stream: false
      };

      const response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`DeepSeek API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling DeepSeek API:', error);
      throw error;
    }
  }

  /**
   * Stream a response from DeepSeek
   */
  async streamResponse(messages: Message[], onChunk: (chunk: string) => void): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('DeepSeek provider not initialized');
    }

    try {
      const deepseekMessages: DeepSeekMessage[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const requestBody: DeepSeekRequestBody = {
        model: this.model,
        messages: deepseekMessages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        stream: true
      };

      const response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`DeepSeek API error: ${errorData.error?.message || response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const parser = createParser((event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          try {
            const data = JSON.parse(event.data);
            if (data.choices && data.choices[0]?.delta?.content) {
              onChunk(data.choices[0].delta.content);
            }
          } catch (error) {
            console.error('Error parsing SSE message:', error);
          }
        }
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        parser.feed(chunk);
      }
    } catch (error) {
      console.error('Error streaming from DeepSeek API:', error);
      throw error;
    }
  }

  /**
   * Get available models from DeepSeek
   */
  async getModelOptions(): Promise<ModelOption[]> {
    return this.getDefaultModelOptions();
  }

  /**
   * Fallback model options for DeepSeek
   */
  private getDefaultModelOptions(): ModelOption[] {
    return [
      {
        id: 'deepseek-chat',
        name: 'DeepSeek Chat',
        contextSize: 8192,
        description: 'DeepSeek Chat - Standard model'
      },
      {
        id: 'deepseek-coder',
        name: 'DeepSeek Coder',
        contextSize: 16384,
        description: 'DeepSeek Coder - Specialized for code generation'
      }
    ];
  }

  /**
   * Check if the DeepSeek provider is available (has API key)
   */
  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }
}
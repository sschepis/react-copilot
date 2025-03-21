import { createParser, ParsedEvent, ReconnectInterval } from 'eventsource-parser';
import { Message } from '../../../utils/types';
import { 
  LLMProviderAdapter, 
  LLMProviderConfig, 
  LLMCapabilities, 
  ModelOption 
} from '../LLMProviderAdapter';

interface OpenAIMessage {
  role: string;
  content: string;
}

interface OpenAIRequestBody {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * OpenAI provider adapter implementing the LLMProviderAdapter interface
 */
export class OpenAIProvider implements LLMProviderAdapter {
  id = 'openai';
  name = 'OpenAI';
  
  capabilities: LLMCapabilities = {
    streaming: true,
    multiModal: false, // Base capability, will be updated based on model
    functionCalling: true,
    embeddings: true,
    contextSize: 8192, // Default, will be updated based on model
    supportedLanguages: ['en'], // Will be expanded
  };

  private apiKey: string = '';
  private model: string = 'gpt-4';
  private temperature: number = 0.7;
  private maxTokens: number = 2000;
  private apiUrl: string = 'https://api.openai.com/v1';
  private isInitialized: boolean = false;

  /**
   * Initialize the OpenAI provider with configuration
   */
  async initialize(config: LLMProviderConfig): Promise<void> {
    this.apiKey = config.apiKey || this.getApiKeyFromEnv() || '';
    this.model = config.model || 'gpt-4';
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 2000;
    this.apiUrl = config.apiUrl || 'https://api.openai.com/v1';

    if (!this.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    // Update capabilities based on the selected model
    await this.updateCapabilitiesForModel(this.model);
    this.isInitialized = true;
  }

  /**
   * Update capabilities based on the selected model
   */
  private async updateCapabilitiesForModel(model: string): Promise<void> {
    // Set capabilities based on model
    if (model.includes('gpt-4')) {
      this.capabilities.contextSize = model.includes('32k') ? 32768 : 8192;
      this.capabilities.multiModal = model.includes('vision');
    } else if (model.includes('gpt-3.5-turbo')) {
      this.capabilities.contextSize = model.includes('16k') ? 16384 : 4096;
    }
  }

  /**
   * Get OpenAI API key from environment variables
   */
  private getApiKeyFromEnv(): string | undefined {
    if (typeof window !== 'undefined') {
      // Browser environment
      return (window as any).env?.OPENAI_API_KEY || 
             process.env?.REACT_APP_OPENAI_API_KEY;
    } else {
      // Node environment
      return process.env?.OPENAI_API_KEY;
    }
  }

  /**
   * Send messages to OpenAI and get a response
   */
  async sendMessage(messages: Message[]): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('OpenAI provider not initialized');
    }

    try {
      // Convert from our message format to OpenAI's format
      const openaiMessages: OpenAIMessage[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const requestBody: OpenAIRequestBody = {
        model: this.model,
        messages: openaiMessages,
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
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }

  /**
   * Stream a response from OpenAI
   */
  async streamResponse(messages: Message[], onChunk: (chunk: string) => void): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('OpenAI provider not initialized');
    }

    try {
      const openaiMessages: OpenAIMessage[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const requestBody: OpenAIRequestBody = {
        model: this.model,
        messages: openaiMessages,
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
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
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
      console.error('Error streaming from OpenAI API:', error);
      throw error;
    }
  }

  /**
   * Get available models from OpenAI
   */
  async getModelOptions(): Promise<ModelOption[]> {
    if (!this.apiKey) {
      return this.getDefaultModelOptions();
    }

    try {
      const response = await fetch(`${this.apiUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        return this.getDefaultModelOptions();
      }

      const data = await response.json();
      
      // Filter and map OpenAI models to our format
      return data.data
        .filter((model: any) => 
          model.id.includes('gpt-4') || 
          model.id.includes('gpt-3.5-turbo')
        )
        .map((model: any) => {
          const contextSize = 
            model.id.includes('gpt-4-32k') ? 32768 :
            model.id.includes('gpt-4') ? 8192 :
            model.id.includes('gpt-3.5-turbo-16k') ? 16384 : 4096;
          
          return {
            id: model.id,
            name: model.id,
            contextSize,
            description: `OpenAI ${model.id}`,
            capabilities: {
              multiModal: model.id.includes('vision')
            }
          };
        });
    } catch (error) {
      console.error('Error fetching OpenAI models:', error);
      return this.getDefaultModelOptions();
    }
  }

  /**
   * Fallback model options when API is not available
   */
  private getDefaultModelOptions(): ModelOption[] {
    return [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        contextSize: 8192,
        description: 'OpenAI GPT-4 (Standard)'
      },
      {
        id: 'gpt-4-32k',
        name: 'GPT-4 32k',
        contextSize: 32768,
        description: 'OpenAI GPT-4 with extended context window'
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        contextSize: 4096,
        description: 'OpenAI GPT-3.5 Turbo (Standard)'
      },
      {
        id: 'gpt-3.5-turbo-16k',
        name: 'GPT-3.5 Turbo 16k',
        contextSize: 16384,
        description: 'OpenAI GPT-3.5 Turbo with extended context window'
      }
    ];
  }

  /**
   * Check if the OpenAI provider is available (has API key)
   */
  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }
}
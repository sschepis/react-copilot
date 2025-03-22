import { LLMProviderAdapter, LLMCapabilities, ModelOption, LLMProviderConfig } from '../LLMProviderAdapter';
import { Message } from '../../../utils/types';
import { nanoid } from 'nanoid';

/**
 * LM Studio Provider adapter for interacting with LM Studio's local API
 * LM Studio provides a local API compatible with OpenAI's API format
 * Default URL: http://localhost:1234/v1
 */
export class LMStudioProvider implements LLMProviderAdapter {
  id: string = 'lmstudio';
  name: string = 'LM Studio';
  capabilities: LLMCapabilities = {
    streaming: true,
    multiModal: false,
    functionCalling: false,
    embeddings: false,
    contextSize: 4096,
    supportedLanguages: ['en'],
  };

  private apiKey: string | undefined;
  private apiUrl: string;
  private apiVersion: string;
  private model: string = 'local-model';
  private temperature: number = 0.7;
  private maxTokens: number = 1024;
  private abortController: AbortController | null = null;

  constructor() {
    this.apiKey = undefined; // Usually not required for local LM Studio
    this.apiUrl = 'http://localhost:1234'; // Default LM Studio server URL
    this.apiVersion = 'v1';
  }

  /**
   * Initialize the provider with configuration
   */
  async initialize(config: LLMProviderConfig): Promise<void> {
    if (config.apiUrl) this.apiUrl = config.apiUrl;
    if (config.apiKey) this.apiKey = config.apiKey;
    if (config.model) this.model = config.model;
    if (config.temperature !== undefined) this.temperature = config.temperature;
    if (config.maxTokens !== undefined) this.maxTokens = config.maxTokens;
    if (config.apiVersion) this.apiVersion = config.apiVersion;
  }

  /**
   * Get available models for this provider
   */
  async getModelOptions(): Promise<ModelOption[]> {
    try {
      // Try to fetch models from LM Studio API
      const response = await fetch(
        `${this.apiUrl}/${this.apiVersion}/models`,
        {
          headers: this.getHeaders(),
          method: 'GET',
        }
      );

      if (!response.ok) {
        console.warn('Failed to fetch models from LM Studio, using defaults');
        return this.getDefaultModels();
      }

      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        return data.data.map((model: any) => ({
          id: model.id,
          name: model.id,
          contextLength: 4096,
          supported: true,
        }));
      }
      
      return this.getDefaultModels();
    } catch (error) {
      console.warn('Error fetching LM Studio models:', error);
      return this.getDefaultModels();
    }
  }

  /**
   * Get default models when API doesn't return any
   */
  private getDefaultModels(): ModelOption[] {
    return [
      {
        id: 'local-model',
        name: 'Local LM Studio Model',
        contextSize: 4096,
        description: 'Currently loaded model in LM Studio'
      },
      {
        id: 'phi-2',
        name: 'Phi 2',
        contextSize: 2048,
        description: 'Microsoft Phi-2 small language model'
      },
      {
        id: 'mistral-7b',
        name: 'Mistral 7B',
        contextSize: 8192,
        description: 'Mistral AI 7B model'
      },
      {
        id: 'llama2-7b',
        name: 'Llama 2 7B',
        contextSize: 4096,
        description: 'Meta Llama 2 7B model'
      }
    ];
  }

  /**
   * Create HTTP headers for API requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  /**
   * Convert internal message format to LM Studio API format
   */
  private formatMessages(messages: Message[]): any[] {
    return messages.map(message => ({
      role: message.role,
      content: message.content,
    }));
  }

  /**
   * Check if the provider is available and properly configured
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/${this.apiVersion}/models`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      return response.ok;
    } catch (error) {
      console.warn('LM Studio not available:', error);
      return false;
    }
  }

  /**
   * Send a message to the LM Studio API
   */
  async sendMessage(messages: Message[]): Promise<string> {
    // Cancel any ongoing request
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    try {
      const response = await fetch(
        `${this.apiUrl}/${this.apiVersion}/chat/completions`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            model: this.model,
            messages: this.formatMessages(messages),
            temperature: this.temperature,
            max_tokens: this.maxTokens,
            stream: false,
          }),
          signal,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LM Studio API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Request was cancelled');
      }
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Stream a response from the provider (if supported)
   */
  async streamResponse(
    messages: Message[],
    onChunk: (chunk: string) => void
  ): Promise<void> {
    // Cancel any ongoing request
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    try {
      const response = await fetch(
        `${this.apiUrl}/${this.apiVersion}/chat/completions`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            model: this.model,
            messages: this.formatMessages(messages),
            temperature: this.temperature,
            max_tokens: this.maxTokens,
            stream: true,
          }),
          signal,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LM Studio API error: ${response.status} - ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk
          .split('\n')
          .filter(line => line.trim() !== '' && line.trim() !== 'data: [DONE]');

        for (const line of lines) {
          try {
            const match = line.match(/^data: (.*)$/);
            if (!match) continue;

            const data = JSON.parse(match[1]);
            
            if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
              const contentChunk = data.choices[0].delta.content;
              onChunk(contentChunk);
            }
          } catch (error) {
            console.warn('Error parsing chunk:', line, error);
          }
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Request was cancelled');
      }
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Stop any ongoing streaming
   */
  stopStreaming(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
import { LLMConfig, Message } from '../../../utils/types';
import { getEnvVariable } from '../index';

// Simple interface for LLM service functionality
interface LLMService {
  sendMessages(messages: Message[]): Promise<string>;
  streamMessages?(messages: Message[], onChunk: (chunk: string) => void): Promise<void>;
}
import { createParser, ParsedEvent, ReconnectInterval } from 'eventsource-parser';

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

export class ClaudeService implements LLMService {
  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private apiUrl: string;
  private apiVersion: string;

  constructor(config: LLMConfig) {
    this.apiKey = config.apiKey || getEnvVariable('ANTHROPIC_API_KEY') || '';
    this.model = config.model || 'claude-3-sonnet-20240229';
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 2000;
    this.apiUrl = config.apiUrl || 'https://api.anthropic.com';
    this.apiVersion = config.apiVersion || '2023-06-01';

    if (!this.apiKey) {
      throw new Error('Anthropic API key is required');
    }
  }

  async sendMessages(messages: Message[]): Promise<string> {
    try {
      // Convert from our message format to Claude's format
      const claudeMessages: ClaudeMessage[] = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : msg.role === 'user' ? 'user' : 'system',
        content: msg.content
      }));

      const requestBody: ClaudeRequestBody = {
        model: this.model,
        messages: claudeMessages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        stream: false
      };

      const response = await fetch(`${this.apiUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion
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
      console.error('Error calling Claude API:', error);
      throw error;
    }
  }

  // Method for streaming responses (optional implementation)
  async streamMessages(messages: Message[], onChunk: (chunk: string) => void): Promise<void> {
    try {
      const claudeMessages: ClaudeMessage[] = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : msg.role === 'user' ? 'user' : 'system',
        content: msg.content
      }));

      const requestBody: ClaudeRequestBody = {
        model: this.model,
        messages: claudeMessages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        stream: true
      };

      const response = await fetch(`${this.apiUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion
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

      const parser = createParser((event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'content_block_delta' && data.delta.text) {
              onChunk(data.delta.text);
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
      console.error('Error streaming from Claude API:', error);
      throw error;
    }
  }
}

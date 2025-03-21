import { LLMConfig, Message } from '../../../utils/types';
import { getEnvVariable } from '../index';

// Simple interface for LLM service functionality
interface LLMService {
  sendMessages(messages: Message[]): Promise<string>;
  streamMessages?(messages: Message[], onChunk: (chunk: string) => void): Promise<void>;
}
import { createParser, ParsedEvent, ReconnectInterval } from 'eventsource-parser';

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

export class OpenAIService implements LLMService {
  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private apiUrl: string;

  constructor(config: LLMConfig) {
    this.apiKey = config.apiKey || getEnvVariable('OPENAI_API_KEY') || '';
    this.model = config.model || 'gpt-4';
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 2000;
    this.apiUrl = config.apiUrl || 'https://api.openai.com/v1';

    if (!this.apiKey) {
      throw new Error('OpenAI API key is required');
    }
  }

  async sendMessages(messages: Message[]): Promise<string> {
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

  // Method for streaming responses (optional implementation)
  async streamMessages(messages: Message[], onChunk: (chunk: string) => void): Promise<void> {
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
}

import { LLMConfig, Message } from '../../../utils/types';
interface LLMService {
    sendMessages(messages: Message[]): Promise<string>;
    streamMessages?(messages: Message[], onChunk: (chunk: string) => void): Promise<void>;
}
export declare class OpenAIService implements LLMService {
    private apiKey;
    private model;
    private temperature;
    private maxTokens;
    private apiUrl;
    constructor(config: LLMConfig);
    sendMessages(messages: Message[]): Promise<string>;
    streamMessages(messages: Message[], onChunk: (chunk: string) => void): Promise<void>;
}
export {};

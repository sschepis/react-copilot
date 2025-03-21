import { LLMConfig, Message } from '../../../utils/types';
interface LLMService {
    sendMessages(messages: Message[]): Promise<string>;
    streamMessages?(messages: Message[], onChunk: (chunk: string) => void): Promise<void>;
}
export declare class ClaudeService implements LLMService {
    private apiKey;
    private model;
    private temperature;
    private maxTokens;
    private apiUrl;
    private apiVersion;
    constructor(config: LLMConfig);
    sendMessages(messages: Message[]): Promise<string>;
    streamMessages(messages: Message[], onChunk: (chunk: string) => void): Promise<void>;
}
export {};

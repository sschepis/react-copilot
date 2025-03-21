import { Message } from '../utils/types';
/**
 * Hook for chat functionality with component awareness
 */
export declare function useChat(): {
    messages: Message[];
    sendMessage: (content: string) => Promise<Message>;
    isProcessing: boolean;
    error: string | null;
    clearChat: () => void;
};

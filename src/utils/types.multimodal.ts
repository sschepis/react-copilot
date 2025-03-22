import { ReactNode, RefObject } from 'react';

/**
 * Chat overlay props interface used by chat components
 */
export interface ChatOverlayProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  initialOpen?: boolean;
  width?: number | string;
  height?: number | string;
}

/**
 * The type of content in a message
 */
export enum ContentType {
  TEXT = 'text',
  IMAGE = 'image',
  // Can be extended for other content types like audio, video, etc.
}

/**
 * Base interface for all content types
 */
export interface BaseContent {
  type: ContentType;
}

/**
 * Text content in a message
 */
export interface TextContent extends BaseContent {
  type: ContentType.TEXT;
  text: string;
}

/**
 * Image content in a message
 */
export interface ImageContent extends BaseContent {
  type: ContentType.IMAGE;
  imageUrl: string;
  altText?: string;
  width?: number;
  height?: number;
  mimeType?: string;
}

/**
 * Union type of all possible content types
 */
export type MessageContent = TextContent | ImageContent;

/**
 * Enhanced message interface with multi-modal support
 */
export interface MultiModalMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  // Either the legacy string content or an array of different content types
  content: string | MessageContent[];
  timestamp: number;
}

/**
 * Enhanced chat session with multi-modal support
 */
export interface MultiModalChatSession {
  id: string;
  messages: MultiModalMessage[];
  title?: string;
  timestamp?: number;
  lastUpdated?: number;
  metadata?: Record<string, any>;
}

/**
 * Helper functions for working with multi-modal messages
 */
export const MultiModalHelpers = {
  /**
   * Create a text-only message
   */
  createTextMessage(
    role: 'user' | 'assistant' | 'system',
    text: string,
    id?: string
  ): MultiModalMessage {
    return {
      id: id || crypto.randomUUID(),
      role,
      content: [
        {
          type: ContentType.TEXT,
          text
        }
      ],
      timestamp: Date.now()
    };
  },

  /**
   * Create a message with an image
   */
  createImageMessage(
    role: 'user' | 'assistant' | 'system',
    imageUrl: string,
    altText?: string,
    id?: string
  ): MultiModalMessage {
    return {
      id: id || crypto.randomUUID(),
      role,
      content: [
        {
          type: ContentType.IMAGE,
          imageUrl,
          altText
        }
      ],
      timestamp: Date.now()
    };
  },

  /**
   * Create a mixed content message with text and images
   */
  createMixedMessage(
    role: 'user' | 'assistant' | 'system',
    contents: MessageContent[],
    id?: string
  ): MultiModalMessage {
    return {
      id: id || crypto.randomUUID(),
      role,
      content: contents,
      timestamp: Date.now()
    };
  },

  /**
   * Convert legacy string content to a MessageContent array
   */
  contentToArray(content: string | MessageContent[]): MessageContent[] {
    if (typeof content === 'string') {
      return [
        {
          type: ContentType.TEXT,
          text: content
        }
      ];
    }
    return content;
  },

  /**
   * Extract all text content from a message and concatenate it
   */
  extractTextContent(message: MultiModalMessage): string {
    if (typeof message.content === 'string') {
      return message.content;
    }
    
    return message.content
      .filter(content => content.type === ContentType.TEXT)
      .map(content => (content as TextContent).text)
      .join('\n');
  },

  /**
   * Extract all image URLs from a message
   */
  extractImageUrls(message: MultiModalMessage): string[] {
    if (typeof message.content === 'string') {
      return [];
    }
    
    return message.content
      .filter(content => content.type === ContentType.IMAGE)
      .map(content => (content as ImageContent).imageUrl);
  },

  /**
   * Convert a legacy Message to a MultiModalMessage
   */
  fromLegacyMessage(legacyMessage: { 
    id: string; 
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
  }): MultiModalMessage {
    return {
      ...legacyMessage,
      content: [
        {
          type: ContentType.TEXT,
          text: legacyMessage.content
        }
      ]
    };
  },

  /**
   * Convert a MultiModalMessage to a legacy format (text only)
   */
  toLegacyMessage(multiModalMessage: MultiModalMessage): {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
  } {
    return {
      id: multiModalMessage.id,
      role: multiModalMessage.role,
      content: typeof multiModalMessage.content === 'string' 
        ? multiModalMessage.content
        : MultiModalHelpers.extractTextContent(multiModalMessage),
      timestamp: multiModalMessage.timestamp
    };
  }
};
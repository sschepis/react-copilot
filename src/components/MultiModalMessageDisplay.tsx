import React from 'react';
import { 
  MultiModalMessage, 
  MessageContent, 
  ContentType,
  TextContent,
  ImageContent,
  MultiModalHelpers
} from '../utils/types.multimodal';

interface MultiModalMessageDisplayProps {
  message: MultiModalMessage;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Component that renders a multi-modal message with different content types
 */
export const MultiModalMessageDisplay: React.FC<MultiModalMessageDisplayProps> = ({ 
  message, 
  className,
  style
}) => {
  const isUser = message.role === 'user';
  
  // Function to render a specific content item
  const renderContent = (content: MessageContent, index: number) => {
    switch (content.type) {
      case ContentType.TEXT:
        return renderTextContent(content as TextContent, index);
      case ContentType.IMAGE:
        return renderImageContent(content as ImageContent, index);
      default:
        return null;
    }
  };
  
  // Function to render text content
  const renderTextContent = (content: TextContent, index: number) => (
    <div 
      key={`text-${index}`}
      className="text-content"
      style={{
        marginBottom: '8px',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word'
      }}
    >
      {content.text}
    </div>
  );
  
  // Function to render image content
  const renderImageContent = (content: ImageContent, index: number) => (
    <div 
      key={`image-${index}`}
      className="image-content"
      style={{
        marginBottom: '8px',
        maxWidth: '100%'
      }}
    >
      <img 
        src={content.imageUrl} 
        alt={content.altText || 'Image'} 
        style={{
          maxWidth: '100%',
          maxHeight: '300px',
          borderRadius: '8px',
          width: content.width ? `${content.width}px` : 'auto',
          height: content.height ? `${content.height}px` : 'auto',
        }} 
      />
      {content.altText && (
        <div 
          className="image-caption"
          style={{
            fontSize: '0.85em',
            color: '#666',
            marginTop: '4px',
            textAlign: 'center'
          }}
        >
          {content.altText}
        </div>
      )}
    </div>
  );
  
  // Extract content array from the message
  const contentArray = typeof message.content === 'string' 
    ? [{ type: ContentType.TEXT, text: message.content } as TextContent]
    : message.content;
  
  return (
    <div 
      className={`multi-modal-message ${isUser ? 'user-message' : 'assistant-message'} ${className || ''}`}
      style={{
        padding: '12px 16px',
        borderRadius: '12px',
        marginBottom: '8px',
        maxWidth: '80%',
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        backgroundColor: isUser ? '#007aff' : '#f0f0f0',
        color: isUser ? 'white' : 'black',
        ...style
      }}
    >
      {contentArray.map((content, index) => renderContent(content, index))}
    </div>
  );
};

/**
 * HOC to convert a legacy Message to a MultiModalMessage display
 */
export const LegacyMessageAdapter: React.FC<{
  message: {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
  };
  className?: string;
  style?: React.CSSProperties;
}> = ({ message, className, style }) => {
  const multiModalMessage = MultiModalHelpers.fromLegacyMessage(message);
  
  return (
    <MultiModalMessageDisplay 
      message={multiModalMessage}
      className={className}
      style={style}
    />
  );
};
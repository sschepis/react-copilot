import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../utils/types';
import { ChatOverlayProps } from '../utils/types.multimodal';
import { useLLM } from '../hooks/useLLM';
import { 
  MultiModalMessage, 
  ContentType, 
  MessageContent,
  MultiModalHelpers 
} from '../utils/types.multimodal';
import { MultiModalMessageDisplay, LegacyMessageAdapter } from './MultiModalMessageDisplay';

export interface MultiModalChatOverlayProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  initialOpen?: boolean;
  width?: number | string;
  height?: number | string;
  enableImageUpload?: boolean;
  maxImageSize?: number; // in MB
  acceptedImageTypes?: string; // e.g. "image/png,image/jpeg"
}

/**
 * Enhanced chat overlay component with multi-modal support
 */
export const MultiModalChatOverlay: React.FC<MultiModalChatOverlayProps> = ({
  position = 'bottom-right',
  initialOpen = false,
  width = 350,
  height = 500,
  enableImageUpload = true,
  maxImageSize = 5, // 5MB default
  acceptedImageTypes = "image/png,image/jpeg,image/gif"
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [inputValue, setInputValue] = useState('');
  const [uploadedImages, setUploadedImages] = useState<Array<{
    url: string;
    file: File;
    altText: string;
  }>>([]);
  const [showImagePreview, setShowImagePreview] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { sendMessage, messages, isProcessing } = useLLM();
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  // Handle toggle
  const handleToggle = () => {
    setIsOpen((prev: boolean) => !prev);
  };
  
  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newImages: Array<{url: string; file: File; altText: string}> = [];
    
    Array.from(files).forEach(file => {
      // Check file size
      if (file.size > maxImageSize * 1024 * 1024) {
        alert(`Image ${file.name} exceeds the maximum size of ${maxImageSize}MB.`);
        return;
      }
      
      // Create a URL for the file
      const url = URL.createObjectURL(file);
      newImages.push({ 
        url, 
        file,
        altText: file.name
      });
    });
    
    if (newImages.length > 0) {
      setUploadedImages(prev => [...prev, ...newImages]);
      setShowImagePreview(true);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Handle removing an uploaded image
  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => {
      const newImages = [...prev];
      
      // Revoke the object URL to free memory
      URL.revokeObjectURL(newImages[index].url);
      
      newImages.splice(index, 1);
      return newImages;
    });
    
    if (uploadedImages.length <= 1) {
      setShowImagePreview(false);
    }
  };
  
  // Handle updating image alt text
  const handleUpdateAltText = (index: number, altText: string) => {
    setUploadedImages(prev => {
      const newImages = [...prev];
      newImages[index].altText = altText;
      return newImages;
    });
  };
  
  // Convert uploaded images to message content
  const createMessageContents = (): MessageContent[] => {
    const contents: MessageContent[] = [];
    
    // Add text content if there's any
    if (inputValue.trim()) {
      contents.push({
        type: ContentType.TEXT,
        text: inputValue.trim()
      });
    }
    
    // Add image contents
    uploadedImages.forEach(image => {
      contents.push({
        type: ContentType.IMAGE,
        imageUrl: image.url,
        altText: image.altText,
        mimeType: image.file.type
      });
    });
    
    return contents;
  };
  
  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasText = inputValue.trim().length > 0;
    const hasImages = uploadedImages.length > 0;
    
    if ((!hasText && !hasImages) || isProcessing) return;
    
    try {
      // For now, the LLM hook expects a string message
      // In the future, this would be updated to support multi-modal content
      
      // For text-only messages, use the normal flow
      if (hasText && !hasImages) {
        setInputValue('');
        await sendMessage(inputValue);
      } 
      // For messages with images, we need to create a more descriptive text
      else {
        let messageText = inputValue.trim();
        
        // Create descriptions of the images if there are any
        if (hasImages) {
          if (messageText) {
            messageText += '\n\n';
          }
          
          messageText += 'I\'m also sending the following images:\n';
          
          uploadedImages.forEach((image, index) => {
            messageText += `${index + 1}. ${image.file.name}${image.altText ? ` - ${image.altText}` : ''}\n`;
          });
          
          // This is a temporary solution until the LLM hook supports multi-modal content
          // In a real implementation, the `sendMessage` function would be updated to handle
          // multi-modal content directly
        }
        
        setInputValue('');
        setUploadedImages([]);
        setShowImagePreview(false);
        
        await sendMessage(messageText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  // Render a message
  const renderMessage = (message: Message) => {
    return <LegacyMessageAdapter key={message.id} message={message} />;
  };
  
  // Get position styles
  const getPositionStyles = () => {
    switch (position) {
      case 'bottom-right':
        return { bottom: '20px', right: '20px' };
      case 'bottom-left':
        return { bottom: '20px', left: '20px' };
      case 'top-right':
        return { top: '20px', right: '20px' };
      case 'top-left':
        return { top: '20px', left: '20px' };
      default:
        return { bottom: '20px', right: '20px' };
    }
  };
  
  return (
    <div 
      className="chat-overlay-container"
      style={{
        position: 'fixed',
        ...getPositionStyles(),
        zIndex: 9999,
      }}
    >
      {/* Chat toggle button */}
      <button
        className="chat-toggle-button"
        onClick={handleToggle}
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: '#007aff',
          color: 'white',
          border: 'none',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          position: 'absolute',
          bottom: isOpen ? '10px' : '0',
          right: isOpen ? '10px' : '0',
        }}
      >
        {isOpen ? '×' : '💬'}
      </button>
      
      {/* Chat window */}
      {isOpen && (
        <div 
          className="chat-window"
          style={{
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            marginBottom: '60px',
            overflow: 'hidden',
          }}
        >
          {/* Chat header */}
          <div 
            className="chat-header"
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e0e0e0',
              fontWeight: 'bold',
              backgroundColor: '#f8f8f8',
            }}
          >
            React Copilot Assistant
          </div>
          
          {/* Messages area */}
          <div 
            className="chat-messages"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {messages.length === 0 ? (
              <div 
                className="empty-state"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#888',
                  textAlign: 'center',
                  padding: '0 20px',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>👋</div>
                <p>
                  Hello! I'm your UI assistant. Ask me to modify your app or create new components.
                </p>
                {enableImageUpload && (
                  <p style={{ fontSize: '0.9em', marginTop: '10px' }}>
                    You can also send images by clicking the upload button below.
                  </p>
                )}
              </div>
            ) : (
              messages.map(renderMessage)
            )}
            
            {/* Indicator when the LLM is thinking */}
            {isProcessing && (
              <div 
                style={{
                  padding: '8px 12px',
                  borderRadius: '12px',
                  marginBottom: '8px',
                  alignSelf: 'flex-start',
                  backgroundColor: '#f0f0f0',
                  color: '#888',
                }}
              >
                Thinking...
              </div>
            )}
            
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Image preview area */}
          {showImagePreview && (
            <div
              className="image-preview-area"
              style={{
                padding: '12px',
                borderTop: '1px solid #e0e0e0',
                backgroundColor: '#f8f8f8',
                maxHeight: '150px',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                {uploadedImages.map((image, index) => (
                  <div
                    key={`img-${index}`}
                    style={{
                      position: 'relative',
                      width: '100px',
                    }}
                  >
                    <img
                      src={image.url}
                      alt={image.altText}
                      style={{
                        width: '100px',
                        height: '100px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                      }}
                    />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                      }}
                    >
                      ×
                    </button>
                    <input
                      type="text"
                      value={image.altText}
                      onChange={(e) => handleUpdateAltText(index, e.target.value)}
                      placeholder="Add alt text"
                      style={{
                        width: '100px',
                        padding: '4px 6px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '12px',
                        marginTop: '4px',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Input area */}
          <form 
            onSubmit={handleSubmit}
            style={{
              padding: '12px',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              flexDirection: 'column', // Changed to column to accommodate the upload button row
            }}
          >
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me to modify your app..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '20px',
                border: '1px solid #e0e0e0',
                resize: 'none',
                minHeight: '40px',
                maxHeight: '120px',
                lineHeight: '1.4',
                marginBottom: '8px', // Added margin to separate from the button row
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            
            {/* Buttons row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              {/* Image upload button section */}
              {enableImageUpload && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptedImageTypes}
                    onChange={handleFileChange}
                    multiple
                    style={{ display: 'none' }}
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 12px',
                      height: '40px',
                      backgroundColor: '#f0f0f0',
                      color: '#333',
                      border: 'none',
                      borderRadius: '20px',
                      cursor: 'pointer',
                    }}
                  >
                    📷 Upload
                  </label>
                </div>
              )}
              
              {/* Send button */}
              <button
                type="submit"
                disabled={isProcessing}
                style={{
                  padding: '0 16px',
                  height: '40px',
                  backgroundColor: isProcessing ? '#ccc' : '#007aff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                }}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
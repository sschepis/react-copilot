import React, { useState, useRef, useEffect } from 'react';
import { ChatOverlayProps, Message } from '../utils/types';
import { useLLM } from '../hooks/useLLM';

/**
 * Chat overlay component for interacting with the LLM
 */
export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  position = 'bottom-right',
  initialOpen = false,
  width = 350,
  height = 500
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
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
    setIsOpen(prev => !prev);
  };
  
  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isProcessing) return;
    
    try {
      setInputValue('');
      await sendMessage(inputValue);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  // Render a message
  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    
    return (
      <div 
        key={message.id} 
        className={`chat-message ${isUser ? 'user-message' : 'assistant-message'}`}
        style={{
          padding: '8px 12px',
          borderRadius: '12px',
          marginBottom: '8px',
          maxWidth: '80%',
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          backgroundColor: isUser ? '#007aff' : '#f0f0f0',
          color: isUser ? 'white' : 'black',
        }}
      >
        {message.content}
      </div>
    );
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
          
          {/* Input area */}
          <form 
            onSubmit={handleSubmit}
            style={{
              padding: '12px',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
            }}
          >
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me to modify your app..."
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '20px',
                border: '1px solid #e0e0e0',
                resize: 'none',
                minHeight: '40px',
                maxHeight: '120px',
                lineHeight: '1.4',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={isProcessing}
              style={{
                marginLeft: '8px',
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
          </form>
        </div>
      )}
    </div>
  );
};

// src/components/Chat/ChatMessage.jsx - Safe Implementation
import React from 'react';

const ChatMessage = ({ message, isLoading = false }) => {
  // Safety check for message object
  if (!message || typeof message !== 'object') {
    return null;
  }

  const { type, content, timestamp, isError = false } = message;
  const isUser = type === 'user';
  const isAI = type === 'ai';

  // Format timestamp
  const formatTime = (date) => {
    if (!date) return '';
    
    try {
      const timeObj = date instanceof Date ? date : new Date(date);
      return timeObj.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '';
    }
  };

  // Format message content with line breaks
  const formatContent = (text) => {
    if (!text || typeof text !== 'string') return '';
    
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
            isUser 
              ? 'bg-blue-500' 
              : isError 
                ? 'bg-red-500' 
                : 'bg-green-500'
          }`}>
            {isUser ? '👤' : isError ? '❌' : '🤖'}
          </div>
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Message Bubble */}
          <div className={`relative px-4 py-3 rounded-lg shadow-sm ${
            isUser 
              ? 'bg-blue-500 text-white' 
              : isError 
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-gray-100 text-gray-800'
          }`}>
            {/* Loading indicator for AI */}
            {isLoading && isAI && (
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-500">AI กำลังคิด...</span>
              </div>
            )}

            {/* Message content */}
            {!isLoading && (
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {formatContent(content)}
              </div>
            )}

            {/* Message tail */}
            <div className={`absolute top-3 ${
              isUser 
                ? 'right-0 transform translate-x-1' 
                : 'left-0 transform -translate-x-1'
            }`}>
              <div className={`w-3 h-3 rotate-45 ${
                isUser 
                  ? 'bg-blue-500' 
                  : isError 
                    ? 'bg-red-50 border-l border-b border-red-200'
                    : 'bg-gray-100'
              }`}></div>
            </div>
          </div>

          {/* Timestamp */}
          {timestamp && (
            <div className={`text-xs text-gray-500 mt-1 ${
              isUser ? 'text-right' : 'text-left'
            }`}>
              {formatTime(timestamp)}
            </div>
          )}

          {/* Message actions */}
          {!isLoading && isAI && (
            <div className="flex items-center space-x-2 mt-2">
              <button 
                onClick={() => {
                  if (navigator.clipboard && content) {
                    navigator.clipboard.writeText(content).then(() => {
                      // Could add a toast notification here
                      console.log('Message copied to clipboard');
                    });
                  }
                }}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                title="คัดลอกข้อความ"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>คัดลอก</span>
              </button>
              
              {isError && (
                <button 
                  onClick={() => {
                    // Could implement retry functionality here
                    console.log('Retry message');
                  }}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center space-x-1"
                  title="ลองใหม่"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>ลองใหม่</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
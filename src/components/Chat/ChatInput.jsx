// src/components/Chat/ChatInput.jsx - Safe Implementation
import React, { useState, useRef } from 'react';

const ChatInput = ({ onSendMessage, isLoading = false, disabled = false }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  // Handle input change with safety checks
  const handleInputChange = (e) => {
    if (e && e.target && typeof e.target.value === 'string') {
      setMessage(e.target.value);
    }
  };

  // Handle send message with validation
  const handleSend = () => {
    // Safety checks
    if (!message || typeof message !== 'string') {
      return;
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return;
    }

    if (isLoading || disabled) {
      return;
    }

    // Call parent handler
    if (onSendMessage && typeof onSendMessage === 'function') {
      onSendMessage(trimmedMessage);
      setMessage(''); // Clear input after sending
    }
  };

  // Handle key press with safety checks
  const handleKeyPress = (e) => {
    if (!e) return;

    // Check for Enter key (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle Ctrl+Enter to add new line
  const handleKeyDown = (e) => {
    if (!e) return;

    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      setMessage(prev => (prev || '') + '\n');
    }
  };

  // Auto-resize textarea
  const handleTextareaChange = (e) => {
    handleInputChange(e);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  // Quick action buttons
  const quickActions = [
    { text: 'แสดงสถิติ', icon: '📊' },
    { text: 'ตรวจสอบความปลอดภัย', icon: '🔒' },
    { text: 'วิเคราะห์แนวโน้ม', icon: '📈' },
    { text: 'สร้างรายงาน', icon: '📋' }
  ];

  const handleQuickAction = (actionText) => {
    if (isLoading || disabled) return;
    
    if (onSendMessage && typeof onSendMessage === 'function') {
      onSendMessage(actionText);
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      {/* Quick Actions */}
      <div className="mb-3">
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleQuickAction(action.text)}
              disabled={isLoading || disabled}
              className="inline-flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="mr-1">{action.icon}</span>
              {action.text}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="flex items-end space-x-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message || ''}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            onKeyDown={handleKeyDown}
            placeholder={
              isLoading 
                ? 'AI กำลังตอบ...' 
                : disabled 
                  ? 'ไม่สามารถส่งข้อความได้ในขณะนี้'
                  : 'พิมพ์คำถามหรือคำสั่งที่นี่... (Enter เพื่อส่ง, Ctrl+Enter เพื่อขึ้นบรรทัดใหม่)'
            }
            disabled={isLoading || disabled}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed min-h-[50px] max-h-[150px]"
            rows={1}
          />
          
          {/* Character count */}
          {message && (
            <div className="absolute bottom-1 right-2 text-xs text-gray-400">
              {message.length}/1000
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!message?.trim() || isLoading || disabled}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <span>กำลังส่ง...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>ส่ง</span>
            </>
          )}
        </button>
      </div>

      {/* Tips */}
      <div className="mt-2 text-xs text-gray-500">
        💡 <strong>เคล็ดลับ:</strong> ลองพิมพ์ "ช่วย" เพื่อดูคำสั่งทั้งหมด หรือคลิกปุ่มด่วนด้านบน
      </div>
    </div>
  );
};

export default ChatInput;
// src/components/Chat/ChatPage.jsx - Ollama Optimized
import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../../hooks/useChat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

const ChatPage = () => {
  const {
    messages,
    isLoading,
    error,
    handleSendMessage,
    clearMessages,
    clearError,
    testOllamaConnection,
    modelInfo
  } = useChat();

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('checking');

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages, isLoading]);

  // Check Ollama connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${modelInfo.url}/api/tags`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        
        if (response.ok) {
          const data = await response.json();
          const hasModel = data.models?.some(model => model.name === modelInfo.name);
          setConnectionStatus(hasModel ? 'connected' : 'model-missing');
        } else {
          setConnectionStatus('error');
        }
      } catch (error) {
        setConnectionStatus('error');
      }
    };

    checkConnection();
  }, [modelInfo.url, modelInfo.name]);

  // Clear error after 10 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Connection status indicator
  const getConnectionStatusInfo = () => {
    switch (connectionStatus) {
      case 'connected':
        return { 
          color: 'green', 
          icon: '🟢', 
          text: `เชื่อมต่อ ${modelInfo.name}`,
          bgColor: 'bg-green-100',
          textColor: 'text-green-800'
        };
      case 'model-missing':
        return { 
          color: 'yellow', 
          icon: '🟡', 
          text: `โมเดลไม่พบ: ${modelInfo.name}`,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800'
        };
      case 'error':
        return { 
          color: 'red', 
          icon: '🔴', 
          text: 'ไม่สามารถเชื่อมต่อ Ollama',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800'
        };
      default:
        return { 
          color: 'gray', 
          icon: '⚪', 
          text: 'กำลังตรวจสอบ...',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800'
        };
    }
  };

  const statusInfo = getConnectionStatusInfo();

  // Quick setup commands
  const setupCommands = [
    {
      title: 'เริ่มต้น Ollama',
      command: 'ollama serve',
      description: 'เริ่มต้นเซิร์ฟเวอร์ Ollama'
    },
    {
      title: 'ตรวจสอบโมเดล',
      command: 'ollama list',
      description: 'ดูรายการโมเดลที่ติดตั้งแล้ว'
    },
    {
      title: 'ติดตั้งโมเดลแนะนำ',
      command: `ollama pull ${modelInfo.name}`,
      description: 'ติดตั้งโมเดลที่ใช้ในระบบ'
    },
    {
      title: 'ติดตั้งโมเดลเล็ก (เร็ว)',
      command: 'ollama pull llama3.2:1b',
      description: 'โมเดลขนาดเล็ก เหมาะกับทดสอบ'
    }
  ];

  // Sample questions optimized for Thai context
  const sampleQuestions = [
    'วิเคราะห์สถิติการเข้าถึงรวมของระบบ',
    'ตรวจสอบพฤติกรรมการเข้าถึงที่ผิดปกติ',
    'แสดงแนวโน้มการเข้าถึงตามช่วงเวลา',
    'สร้างรายงานสรุปสำหรับผู้บริหาร',
    'วิเคราะห์การใช้งานของแต่ละสถานที่',
    'ตรวจสอบการเข้าถึงนอกเวลาทำการ'
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              🤖 AI Assistant - Ollama Local Model
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              วิเคราะห์ Access Log ด้วย AI ที่รันอยู่บนเครื่องของคุณ
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className={`flex items-center px-3 py-1 rounded-full text-xs ${statusInfo.bgColor} ${statusInfo.textColor}`}>
              <span className="mr-1">{statusInfo.icon}</span>
              {statusInfo.text}
            </div>
            
            {/* Test Connection Button */}
            <button
              onClick={testOllamaConnection}
              disabled={isLoading}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              ทดสอบการเชื่อมต่อ
            </button>
            
            {/* Clear Chat Button */}
            <button
              onClick={clearMessages}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              ล้างการสนทนา
            </button>
          </div>
        </div>
      </div>

      {/* Connection Error Banner */}
      {connectionStatus === 'error' && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                ไม่สามารถเชื่อมต่อ Ollama ได้
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>กรุณาตรวจสอบว่า Ollama ทำงานอยู่ที่ <code className="bg-red-100 px-1 rounded">{modelInfo.url}</code></p>
              </div>
              
              {/* Setup Commands */}
              <div className="mt-4">
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-red-800 hover:text-red-900">
                    📋 คำสั่งติดตั้งและแก้ไข
                  </summary>
                  <div className="mt-2 space-y-2">
                    {setupCommands.map((cmd, index) => (
                      <div key={index} className="bg-red-100 p-2 rounded text-xs">
                        <div className="font-medium text-red-900">{cmd.title}</div>
                        <code className="block bg-red-200 p-1 rounded mt-1 text-red-800 font-mono">
                          {cmd.command}
                        </code>
                        <div className="text-red-700 mt-1">{cmd.description}</div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model Missing Banner */}
      {connectionStatus === 'model-missing' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-6 mt-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                ไม่พบโมเดล: {modelInfo.name}
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>กรุณาติดตั้งโมเดลที่ต้องการใช้งาน</p>
                <code className="block bg-yellow-100 p-2 rounded mt-2 font-mono">
                  ollama pull {modelInfo.name}
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Regular Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
      >
        {messages.length === 1 ? (
          // Welcome state with setup info
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-2xl">
              <div className="mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🤖</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  AI Assistant พร้อมใช้งาน
                </h3>
                <p className="text-gray-600 mb-4">
                  ใช้ Ollama Local Model เพื่อวิเคราะห์ Access Log บนเครื่องของคุณ
                </p>
                
                {/* Model Info */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-blue-900">โมเดล:</span>
                      <div className="text-blue-700">{modelInfo.name}</div>
                    </div>
                    <div>
                      <span className="font-medium text-blue-900">URL:</span>
                      <div className="text-blue-700 font-mono text-xs">{modelInfo.url}</div>
                    </div>
                    <div>
                      <span className="font-medium text-blue-900">Timeout:</span>
                      <div className="text-blue-700">{modelInfo.timeout / 1000}s</div>
                    </div>
                    <div>
                      <span className="font-medium text-blue-900">Debug:</span>
                      <div className="text-blue-700">{modelInfo.debug ? 'เปิด' : 'ปิด'}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Sample questions */}
              <div className="space-y-4">
                <p className="text-lg font-medium text-gray-700 mb-4">ลองถามคำถามเหล่านี้:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sampleQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(question)}
                      disabled={isLoading || connectionStatus === 'error'}
                      className="text-left px-4 py-3 text-sm bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    >
                      <div className="font-medium text-gray-900 mb-1">
                        {question}
                      </div>
                      <div className="text-xs text-gray-500">
                        คลิกเพื่อส่งคำถามนี้
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Setup if needed */}
              {connectionStatus === 'error' && (
                <div className="mt-8 p-4 bg-gray-100 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">🛠️ ติดตั้งด่วน:</h4>
                  <div className="text-left space-y-2 text-sm">
                    <div className="bg-white p-2 rounded border">
                      <code className="text-blue-600">curl -fsSL https://ollama.ai/install.sh | sh</code>
                      <div className="text-gray-600 text-xs mt-1">ติดตั้ง Ollama</div>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <code className="text-blue-600">ollama serve</code>
                      <div className="text-gray-600 text-xs mt-1">เริ่มต้นเซิร์ฟเวอร์</div>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <code className="text-blue-600">ollama pull {modelInfo.name}</code>
                      <div className="text-gray-600 text-xs mt-1">ติดตั้งโมเดล</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Messages list
          <>
            {messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message}
                isLoading={false}
              />
            ))}
            
            {/* Loading message for AI response */}
            {isLoading && (
              <ChatMessage 
                message={{
                  id: 'loading',
                  type: 'ai',
                  content: '',
                  timestamp: new Date()
                }}
                isLoading={true}
              />
            )}
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Chat Input */}
      <ChatInput 
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        disabled={connectionStatus === 'error'}
      />

      {/* Footer Info */}
      <div className="bg-gray-100 px-6 py-2 text-xs text-gray-500 text-center">
        <p>
          🤖 Ollama Local AI • 
          {modelInfo.name} • 
          Privacy-First • 
          <a 
            href="https://ollama.ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 ml-1"
          >
            เรียนรู้เพิ่มเติม
          </a> • 
          <button 
            onClick={() => window.open('/api', '_blank')}
            className="text-blue-600 hover:text-blue-800 ml-1"
          >
            API Docs
          </button>
        </p>
      </div>
    </div>
  );
};

export default ChatPage;
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';
import './CopilotPanel.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface CopilotSettings {
  endpoint: string;
  model: string;
  apiKey: string;
  maxTokens: number;
  temperature: number;
}

const CopilotPanel: React.FC = () => {
  const { settings, updateSettings } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const defaultSettings: CopilotSettings = {
    endpoint: 'http://localhost:1234/v1',
    model: 'local-model',
    apiKey: 'lm-studio',
    maxTokens: 2048,
    temperature: 0.7
  };

  const copilotSettings = { ...defaultSettings, ...(settings.copilot || {}) };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // 初期メッセージを追加
    if (messages.length === 0) {
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: 'こんにちは！Arduino開発のお手伝いをします。コードの質問、デバッグ、回路設計など、何でもお聞きください。',
        timestamp: new Date()
      }]);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const testConnection = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${copilotSettings.endpoint}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${copilotSettings.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setIsConnected(true);
        return true;
      } else {
        setIsConnected(false);
        return false;
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setIsConnected(false);
      return false;
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date()
    };

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // システムプロンプトでArduino専門アシスタントとして設定
      const systemPrompt = `あなたはArduino開発の専門アシスタントです。以下のガイドラインに従ってください：
      
1. Arduino/C++プログラミングに関する質問に答える
2. 回路設計やハードウェアの接続について説明する
3. コードの不具合やエラーを解決する
4. ライブラリの使用方法を教える
5. 最適化やベストプラクティスを提案する
6. 初心者にも分かりやすく説明する

日本語で簡潔かつ正確に回答してください。`;

      const response = await fetch(`${copilotSettings.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${copilotSettings.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: copilotSettings.model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.filter(m => !m.isLoading).slice(-10).map(m => ({
              role: m.role,
              content: m.content
            })),
            { role: 'user', content: userMessage.content }
          ],
          max_tokens: copilotSettings.maxTokens,
          temperature: copilotSettings.temperature,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const assistantResponse = data.choices?.[0]?.message?.content || 'すみません、応答を生成できませんでした。';

      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? { ...msg, content: assistantResponse, isLoading: false }
          : msg
      ));

    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = `エラー: ${error instanceof Error ? error.message : '不明なエラーが発生しました'}`;
      
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? { ...msg, content: errorMessage, isLoading: false }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: 'チャットをクリアしました。新しい質問をどうぞ！',
      timestamp: new Date()
    }]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const updateCopilotSetting = (key: keyof CopilotSettings, value: string | number) => {
    const newSettings = {
      ...copilotSettings,
      [key]: value
    };
    updateSettings('copilot', key, value);
  };

  return (
    <div className="copilot-panel">
      <div className="copilot-header">
        <div className="header-left">
          <h3>🤖 AI Copilot</h3>
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="btn secondary"
            onClick={() => testConnection()}
            title="Test connection"
          >
            🔌
          </button>
          <button 
            className="btn secondary"
            onClick={clearChat}
            title="Clear chat"
          >
            🗑️
          </button>
          <button 
            className={`btn secondary ${showSettings ? 'active' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="copilot-settings">
          <h4>AI Settings</h4>
          
          <div className="setting-group">
            <label>API Endpoint</label>
            <input
              type="text"
              className="input"
              value={copilotSettings.endpoint}
              onChange={(e) => updateCopilotSetting('endpoint', e.target.value)}
              placeholder="http://localhost:1234/v1"
            />
            <span className="setting-hint">LM Studio default: http://localhost:1234/v1</span>
          </div>

          <div className="setting-group">
            <label>Model</label>
            <input
              type="text"
              className="input"
              value={copilotSettings.model}
              onChange={(e) => updateCopilotSetting('model', e.target.value)}
              placeholder="local-model"
            />
            <span className="setting-hint">Model name from your LLM server</span>
          </div>

          <div className="setting-group">
            <label>API Key</label>
            <input
              type="password"
              className="input"
              value={copilotSettings.apiKey}
              onChange={(e) => updateCopilotSetting('apiKey', e.target.value)}
              placeholder="lm-studio"
            />
            <span className="setting-hint">LM Studio default: lm-studio</span>
          </div>

          <div className="setting-row">
            <div className="setting-group">
              <label>Max Tokens</label>
              <input
                type="number"
                className="input"
                value={copilotSettings.maxTokens}
                onChange={(e) => updateCopilotSetting('maxTokens', parseInt(e.target.value))}
                min="256"
                max="8192"
              />
            </div>
            
            <div className="setting-group">
              <label>Temperature</label>
              <input
                type="number"
                className="input"
                value={copilotSettings.temperature}
                onChange={(e) => updateCopilotSetting('temperature', parseFloat(e.target.value))}
                min="0"
                max="2"
                step="0.1"
              />
            </div>
          </div>
        </div>
      )}

      <div className="chat-container">
        <div className="messages-area">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.role}`}>
              <div className="message-header">
                <span className="message-role">
                  {message.role === 'user' ? '👤 あなた' : '🤖 AI'}
                </span>
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className="message-content">
                {message.isLoading ? (
                  <div className="loading-indicator">
                    <div className="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span>考え中...</span>
                  </div>
                ) : (
                  <pre className="message-text">{message.content}</pre>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <div className="input-container">
            <textarea
              className="chat-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Arduino開発について質問してください... (Shift+Enterで改行)"
              disabled={isLoading}
              rows={3}
            />
            <button 
              className="send-button"
              onClick={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? '⏳' : '📤'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CopilotPanel;
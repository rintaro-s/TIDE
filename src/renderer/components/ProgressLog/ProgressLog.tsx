import React, { useState, useEffect, useRef } from 'react';
import './ProgressLog.css';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'success' | 'warning' | 'error' | 'debug';
  message: string;
  details?: string;
  command?: string;
}

interface ProgressLogProps {
  isVisible: boolean;
  onClose: () => void;
}

const ProgressLog: React.FC<ProgressLogProps> = ({ isVisible, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible) return;

    // ログエントリをリッスン
    const handleLogEntry = (event: CustomEvent<LogEntry>) => {
      setLogs(prev => [...prev, event.detail]);
    };

    // レンダラープロセスのログをキャッチ
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    };

    console.log = (...args) => {
      originalConsole.log(...args);
      if (args.length > 0 && typeof args[0] === 'string') {
        const logEntry: LogEntry = {
          id: Date.now().toString(),
          timestamp: new Date(),
          level: 'info',
          message: args.join(' ')
        };
        setLogs(prev => [...prev, logEntry]);
      }
    };

    console.error = (...args) => {
      originalConsole.error(...args);
      if (args.length > 0 && typeof args[0] === 'string') {
        const logEntry: LogEntry = {
          id: Date.now().toString(),
          timestamp: new Date(),
          level: 'error',
          message: args.join(' ')
        };
        setLogs(prev => [...prev, logEntry]);
      }
    };

    console.warn = (...args) => {
      originalConsole.warn(...args);
      if (args.length > 0 && typeof args[0] === 'string') {
        const logEntry: LogEntry = {
          id: Date.now().toString(),
          timestamp: new Date(),
          level: 'warning',
          message: args.join(' ')
        };
        setLogs(prev => [...prev, logEntry]);
      }
    };

    // カスタムログイベントリスナー
    window.addEventListener('progressLog', handleLogEntry as EventListener);

    return () => {
      // コンソールを復元
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
      
      window.removeEventListener('progressLog', handleLogEntry as EventListener);
    };
  }, [isVisible]);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] ${log.message}${log.details ? '\n' + log.details : ''}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tova-ide-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.level === filter;
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'debug': return '🔍';
      default: return 'ℹ️';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="progress-log-overlay">
      <div className="progress-log">
        <div className="progress-log-header">
          <h3>進捗ログ</h3>
          <div className="progress-log-controls">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="log-filter"
            >
              <option value="all">すべて</option>
              <option value="info">情報</option>
              <option value="success">成功</option>
              <option value="warning">警告</option>
              <option value="error">エラー</option>
              <option value="debug">デバッグ</option>
            </select>
            
            <label className="auto-scroll-toggle">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
              />
              自動スクロール
            </label>
            
            <button onClick={clearLogs} className="clear-logs-btn">
              クリア
            </button>
            
            <button onClick={exportLogs} className="export-logs-btn">
              エクスポート
            </button>
            
            <button onClick={onClose} className="close-log-btn">
              ✕
            </button>
          </div>
        </div>
        
        <div className="progress-log-content" ref={logContainerRef}>
          {filteredLogs.length === 0 ? (
            <div className="no-logs">ログエントリがありません</div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className={`log-entry log-${log.level}`}>
                <span className="log-time">{formatTime(log.timestamp)}</span>
                <span className="log-icon">{getLogIcon(log.level)}</span>
                <span className="log-message">{log.message}</span>
                {log.details && (
                  <div className="log-details">{log.details}</div>
                )}
                {log.command && (
                  <div className="log-command">$ {log.command}</div>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="progress-log-footer">
          <span className="log-count">
            {filteredLogs.length} / {logs.length} エントリ
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProgressLog;
import React, { useState, useEffect } from 'react';
import BuildManager from '../BuildManager/BuildManager';
import SerialMonitor from '../SerialMonitor/SerialMonitor';
import { buildService, BuildProgress } from '../../services/BuildService';
import './BottomPanel.css';

interface BottomPanelProps {
  height: number;
  onResize: (height: number) => void;
  onToggle: () => void;
}

const BottomPanel: React.FC<BottomPanelProps> = ({ height, onToggle }) => {
  const [activeTab, setActiveTab] = useState<'output' | 'terminal' | 'problems' | 'serial'>('output');
  const [buildLogs, setBuildLogs] = useState<BuildProgress[]>([]);
  const [buildOutput, setBuildOutput] = useState<{ message: string; type: string; timestamp: Date }[]>([]);
  const [buildErrors, setBuildErrors] = useState<{ message: string; type: string; source: string }[]>([]);

  useEffect(() => {
    // Subscribe to build progress for output tab
    const unsubscribe = buildService.onBuildProgress((progress) => {
      setBuildLogs(prev => [...prev, progress]);
    });

    // Listen for build output from QuickBuildPanel
    const handleBuildOutput = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { message, type } = customEvent.detail;
      setBuildOutput(prev => [...prev, {
        message,
        type,
        timestamp: new Date()
      }]);
    };

    // Listen for build errors from QuickBuildPanel
    const handleBuildError = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { message, type, source } = customEvent.detail;
      setBuildErrors(prev => [...prev, {
        message,
        type,
        source
      }]);
    };

    window.addEventListener('buildOutput', handleBuildOutput);
    window.addEventListener('buildError', handleBuildError);

    return () => {
      unsubscribe();
      window.removeEventListener('buildOutput', handleBuildOutput);
      window.removeEventListener('buildError', handleBuildError);
    };
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'output':
        return (
          <div className="output-content">
            {buildLogs.length === 0 ? (
              <div className="empty-output">
                ビルド出力がここに表示されます...
              </div>
            ) : (
              buildLogs.map((log, index) => (
                <div 
                  key={index}
                  className={`output-line ${log.phase === 'error' ? 'error' : log.phase === 'completed' ? 'success' : ''}`}
                >
                  <span className="timestamp">
                    [{log.timestamp.toLocaleTimeString('ja-JP', { hour12: false })}]
                  </span>
                  <span className="phase-indicator">
                    {log.phase === 'compiling' && '🔨'}
                    {log.phase === 'linking' && '🔗'}
                    {log.phase === 'uploading' && '�'}
                    {log.phase === 'completed' && '✅'}
                    {log.phase === 'error' && '❌'}
                  </span>
                  <span className="output-text">{log.message}</span>
                  {log.percentage > 0 && log.percentage < 100 && (
                    <span className="progress-info">({log.percentage}%)</span>
                  )}
                </div>
              ))
            )}
          </div>
        );
      
      case 'terminal':
        return (
          <div className="terminal-content">
            <div className="terminal-header">
              <span>PowerShell Terminal</span>
              <button className="terminal-clear">Clear</button>
            </div>
            <div className="terminal-output">
              <div className="terminal-line">
                <span className="prompt">PS E:\github\TIDE\tova-ide&gt;</span>
                <span className="command">npm run build</span>
              </div>
              <div className="terminal-line output">
                ビルドが完了しました。
              </div>
              <div className="terminal-line">
                <span className="prompt">PS E:\github\TIDE\tova-ide&gt;</span>
                <span className="cursor">_</span>
              </div>
            </div>
          </div>
        );
      
      case 'problems':
        return (
          <div className="problems-content">
            {buildErrors.length === 0 ? (
              <div className="empty-problems">
                <div className="problems-summary">
                  <span className="error-count">❌ 0 エラー</span>
                  <span className="warning-count">⚠️ 0 警告</span>
                </div>
                <div className="no-problems">
                  問題は見つかりませんでした
                </div>
              </div>
            ) : (
              <>
                <div className="problems-summary">
                  <span className="error-count">
                    ❌ {buildErrors.filter(e => e.type === 'error').length} エラー
                  </span>
                  <span className="warning-count">
                    ⚠️ {buildErrors.filter(e => e.type === 'warning').length} 警告
                  </span>
                </div>
                <div className="problems-list">
                  {buildErrors.map((error, index) => (
                    <div 
                      key={index}
                      className={`problem-item ${error.type}`}
                    >
                      <span className="problem-icon">
                        {error.type === 'error' ? '❌' : error.type === 'warning' ? '⚠️' : 'ℹ️'}
                      </span>
                      <span className="problem-source">[{error.source}]</span>
                      <span className="problem-message">{error.message}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      
      case 'serial':
        return <SerialMonitor />;
      
      default:
        return <div>タブが選択されていません</div>;
    }
  };

  return (
    <div className="bottom-panel" style={{ height: `${height}px` }}>
      <div className="bottom-panel-header">
        <div className="panel-tabs">
          <div 
            className={`panel-tab ${activeTab === 'output' ? 'active' : ''}`}
            onClick={() => setActiveTab('output')}
          >
            📋 出力
          </div>
          <div 
            className={`panel-tab ${activeTab === 'terminal' ? 'active' : ''}`}
            onClick={() => setActiveTab('terminal')}
          >
            🔧 ターミナル
          </div>
          <div 
            className={`panel-tab ${activeTab === 'problems' ? 'active' : ''}`}
            onClick={() => setActiveTab('problems')}
          >
            🚫 問題
          </div>
          <div 
            className={`panel-tab ${activeTab === 'serial' ? 'active' : ''}`}
            onClick={() => setActiveTab('serial')}
          >
            📊 シリアルモニター
          </div>
        </div>
        <div className="panel-actions">
          {activeTab === 'output' && (
            <button className="action-btn" onClick={() => setBuildLogs([])}>
              🗑️ クリア
            </button>
          )}
          <button className="panel-close" onClick={onToggle}>×</button>
        </div>
      </div>
      
      <div className="panel-content">
        {renderTabContent()}
      </div>
      
      <div className="panel-resize-handle"></div>
    </div>
  );
};

export default BottomPanel;
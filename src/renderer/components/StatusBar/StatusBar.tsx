import React from 'react';
import './StatusBar.css';

interface StatusBarProps {
  mode?: 'arduino' | 'platformio' | null;
  onToggleBottomPanel: () => void;
}

const StatusBar: React.FC<StatusBarProps> = ({ mode, onToggleBottomPanel }) => {
  return (
    <div className="status-bar">
      <div className="status-left">
        <div className="status-item mode">
          <span className="status-icon">{mode === 'arduino' ? '🔧' : '⚙️'}</span>
          <span>{mode === 'arduino' ? 'Arduino CLI' : 'PlatformIO'}</span>
        </div>
        
        <div className="status-item">
          <span className="status-icon">📋</span>
          <span>Arduino Uno</span>
        </div>
        
        <div className="status-item">
          <span className="status-icon">🔌</span>
          <span>COM3</span>
        </div>
      </div>
      
      <div className="status-center">
        <div className="status-item clickable" onClick={onToggleBottomPanel}>
          <span className="status-icon">📊</span>
          <span>出力パネル</span>
        </div>
      </div>
      
      <div className="status-right">
        <div className="status-item">
          <span className="status-icon">✅</span>
          <span>準備完了</span>
        </div>
        
        <div className="status-item">
          <span>行 1, 列 1</span>
        </div>
        
        <div className="status-item">
          <span>UTF-8</span>
        </div>
        
        <div className="status-item">
          <span>C++</span>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
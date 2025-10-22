import React, { useState } from 'react';
import './StatusBar.css';

interface StatusBarProps {
  mode?: 'arduino' | 'platformio' | null;
  onToggleBottomPanel: () => void;
}

const StatusBar: React.FC<StatusBarProps> = ({ mode, onToggleBottomPanel }) => {
  const [statusMessage, setStatusMessage] = useState('');

  return (
    <div className="status-bar">
      <div className="status-left">
        <div className="status-item mode">
          <span>{mode === 'arduino' ? 'Arduino CLI' : 'PlatformIO'}</span>
        </div>
        
        <div className="status-item">
          <span>Arduino Uno</span>
        </div>
        
        <div className="status-item">
          <span>COM3</span>
        </div>
        
        <div className="status-message">{statusMessage}</div>
      </div>
      
      <div className="status-center">
        <div className="panel-toggles">
          <button className="panel-toggle-btn" onClick={onToggleBottomPanel} title="出力パネル">
            出力
          </button>
          <button className="panel-toggle-btn" onClick={onToggleBottomPanel} title="ターミナル">
            ターミナル
          </button>
          <button className="panel-toggle-btn" onClick={onToggleBottomPanel} title="問題">
            問題
          </button>
          <button className="panel-toggle-btn" onClick={onToggleBottomPanel} title="シリアルモニター">
            シリアルモニター
          </button>
        </div>
      </div>
      
      <div className="status-right">
        <div className="status-item">
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
import React, { useState, useEffect } from 'react';
import { globalCompileCache } from '../../services/GlobalCompileCacheService';

interface CacheStatus {
  nodes: number;
  cacheSize: number;
  serverRunning: boolean;
}

const GlobalCacheStatus: React.FC = () => {
  const [status, setStatus] = useState<CacheStatus>({
    nodes: 0,
    cacheSize: 0,
    serverRunning: false
  });

  useEffect(() => {
    const updateStatus = () => {
      const networkStatus = globalCompileCache.getNetworkStatus();
      setStatus(networkStatus);
    };

    // Initial update
    updateStatus();

    // Update every 5 seconds
    const interval = setInterval(updateStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleClearCache = () => {
    globalCompileCache.clearCache();
    setStatus(prev => ({ ...prev, cacheSize: 0 }));
  };

  const getStatusColor = () => {
    if (!status.serverRunning) return '#ff6b6b';
    if (status.nodes === 0) return '#ffa726';
    return '#4caf50';
  };

  const getStatusText = () => {
    if (!status.serverRunning) return 'サーバー停止';
    if (status.nodes === 0) return 'ネットワーク上にノードが見つかりません';
    return `${status.nodes}台のPCが利用可能`;
  };

  return (
    <div className="global-cache-status">
      <div className="cache-status-header">
        <div className="status-indicator" style={{ backgroundColor: getStatusColor() }}></div>
        <span className="status-text">{getStatusText()}</span>
      </div>
      
      <div className="cache-stats">
        <div className="stat-item">
          <span className="stat-label">接続ノード:</span>
          <span className="stat-value">{status.nodes}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">ローカルキャッシュ:</span>
          <span className="stat-value">{status.cacheSize}個</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">サーバー状態:</span>
          <span className="stat-value">{status.serverRunning ? '動作中' : '停止中'}</span>
        </div>
      </div>

      {status.cacheSize > 0 && (
        <button 
          onClick={handleClearCache}
          className="btn secondary small"
          title="ローカルキャッシュをクリア"
        >
          キャッシュクリア
        </button>
      )}
    </div>
  );
};

export default GlobalCacheStatus;
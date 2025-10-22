import React, { useState, useEffect } from 'react';
import './LANShareManager.css';

interface SharedBoard {
  id: string;
  name: string;
  platform: string;
  version: string;
  size: string;
  sharedBy: string;
  ipAddress: string;
  lastSeen: Date;
  downloadUrl: string;
}

interface LANShareManagerProps {
  isVisible: boolean;
  onClose: () => void;
}

const LANShareManager: React.FC<LANShareManagerProps> = ({ isVisible, onClose }) => {
  const [sharedBoards, setSharedBoards] = useState<SharedBoard[]>([]);
  const [localShares, setLocalShares] = useState<SharedBoard[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [sharePort, setSharePort] = useState(3000);

  useEffect(() => {
    if (isVisible) {
      scanForSharedBoards();
    }
  }, [isVisible]);

  const scanForSharedBoards = async () => {
    setIsScanning(true);
    try {
      // LAN内のTova IDEインスタンスをスキャン
      const discoveries = await window.electronAPI?.network?.discoverPeers();
      
      if (discoveries) {
        const boards: SharedBoard[] = [];
        
        for (const peer of discoveries) {
          try {
            const response = await fetch(`http://${peer.ip}:${peer.port}/api/shared-boards`);
            if (response.ok) {
              const peerBoards = await response.json();
              boards.push(...peerBoards.map((board: any) => ({
                ...board,
                sharedBy: peer.name || peer.ip,
                ipAddress: peer.ip,
                lastSeen: new Date(),
                downloadUrl: `http://${peer.ip}:${peer.port}/api/download-board/${board.id}`
              })));
            }
          } catch (error) {
            console.warn(`Failed to fetch boards from ${peer.ip}:`, error);
          }
        }
        
        setSharedBoards(boards);
      }
    } catch (error) {
      console.error('Failed to scan for shared boards:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const startSharing = async () => {
    try {
      setIsSharing(true);
      
      // ローカルのボードパッケージを取得
      const localBoards = await getLocalBoardPackages();
      setLocalShares(localBoards);
      
      // HTTPサーバーを開始
      await window.electronAPI?.network?.startSharingServer(sharePort, localBoards);
      
      console.log(`Board sharing server started on port ${sharePort}`);
    } catch (error) {
      console.error('Failed to start sharing:', error);
      setIsSharing(false);
    }
  };

  const stopSharing = async () => {
    try {
      await window.electronAPI?.network?.stopSharingServer();
      setIsSharing(false);
      setLocalShares([]);
      console.log('Board sharing server stopped');
    } catch (error) {
      console.error('Failed to stop sharing:', error);
    }
  };

  const getLocalBoardPackages = async (): Promise<SharedBoard[]> => {
    try {
      // PlatformIOのパッケージディレクトリをスキャン
      const platformioHome = await window.electronAPI?.system?.getEnv('PLATFORMIO_HOME') || 
                            `${await window.electronAPI?.system?.getHomePath()}/.platformio`;
      
      const packagesPath = `${platformioHome}/packages`;
      const packages = await window.electronAPI?.fs?.readdir(packagesPath);
      
      const boards: SharedBoard[] = [];
      
      for (const packageName of packages || []) {
        try {
          const packagePath = `${packagesPath}/${packageName}`;
          const manifestPath = `${packagePath}/package.json`;
          
          if (await window.electronAPI?.fs?.exists(manifestPath)) {
            const manifest = JSON.parse(await window.electronAPI?.fs?.readFile(manifestPath));
            const stats = await window.electronAPI?.fs?.stat(packagePath);
            
            boards.push({
              id: packageName,
              name: manifest.name || packageName,
              platform: manifest.platform || 'unknown',
              version: manifest.version || '1.0.0',
              size: formatFileSize(stats.size || 0),
              sharedBy: 'Local',
              ipAddress: 'localhost',
              lastSeen: new Date(),
              downloadUrl: ''
            });
          }
        } catch (error) {
          console.warn(`Failed to read package ${packageName}:`, error);
        }
      }
      
      return boards;
    } catch (error) {
      console.error('Failed to get local board packages:', error);
      return [];
    }
  };

  const downloadBoard = async (board: SharedBoard) => {
    try {
      console.log(`Downloading board ${board.name} from ${board.sharedBy}...`);
      
      const response = await fetch(board.downloadUrl);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      
      // PlatformIOパッケージディレクトリに保存
      const platformioHome = await window.electronAPI?.system?.getEnv('PLATFORMIO_HOME') || 
                            `${await window.electronAPI?.system?.getHomePath()}/.platformio`;
      
      const packagePath = `${platformioHome}/packages/${board.id}`;
      await window.electronAPI?.fs?.mkdir(packagePath);
      
      // ZIPファイルを展開（簡単な実装）
      await window.electronAPI?.fs?.writeBinary(`${packagePath}/package.zip`, buffer);
      
      console.log(`Board ${board.name} downloaded successfully`);
      
      // ダウンロード後に再スキャン
      await scanForSharedBoards();
    } catch (error) {
      console.error(`Failed to download board ${board.name}:`, error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}時間前`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}日前`;
  };

  if (!isVisible) return null;

  return (
    <div className="lan-share-overlay">
      <div className="lan-share-manager">
        <div className="lan-share-header">
          <h3>LAN内ボード共有</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        
        <div className="lan-share-content">
          <div className="share-controls">
            <div className="sharing-status">
              <span className={`status-indicator ${isSharing ? 'active' : 'inactive'}`}>
                {isSharing ? '●' : '○'}
              </span>
              <span>共有ステータス: {isSharing ? 'アクティブ' : '非アクティブ'}</span>
            </div>
            
            <div className="port-setting">
              <label>共有ポート:</label>
              <input
                type="number"
                value={sharePort}
                onChange={(e) => setSharePort(parseInt(e.target.value))}
                disabled={isSharing}
                min="1024"
                max="65535"
              />
            </div>
            
            <div className="share-actions">
              {!isSharing ? (
                <button onClick={startSharing} className="start-sharing-btn">
                  共有を開始
                </button>
              ) : (
                <button onClick={stopSharing} className="stop-sharing-btn">
                  共有を停止
                </button>
              )}
              
              <button 
                onClick={scanForSharedBoards} 
                disabled={isScanning}
                className="scan-btn"
              >
                {isScanning ? 'スキャン中...' : '再スキャン'}
              </button>
            </div>
          </div>
          
          <div className="boards-section">
            <h4>利用可能なボード ({sharedBoards.length})</h4>
            
            {sharedBoards.length === 0 ? (
              <div className="no-boards">
                LAN内に共有されているボードが見つかりません
              </div>
            ) : (
              <div className="boards-list">
                {sharedBoards.map((board) => (
                  <div key={`${board.ipAddress}-${board.id}`} className="board-item">
                    <div className="board-info">
                      <div className="board-name">{board.name}</div>
                      <div className="board-details">
                        <span className="platform">{board.platform}</span>
                        <span className="version">v{board.version}</span>
                        <span className="size">{board.size}</span>
                      </div>
                      <div className="board-source">
                        <span className="shared-by">共有者: {board.sharedBy}</span>
                        <span className="last-seen">最終確認: {formatTimeAgo(board.lastSeen)}</span>
                      </div>
                    </div>
                    
                    <div className="board-actions">
                      <button 
                        onClick={() => downloadBoard(board)}
                        className="download-btn"
                      >
                        ダウンロード
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {isSharing && (
            <div className="local-shares-section">
              <h4>共有中のボード ({localShares.length})</h4>
              
              <div className="boards-list">
                {localShares.map((board) => (
                  <div key={board.id} className="board-item local">
                    <div className="board-info">
                      <div className="board-name">{board.name}</div>
                      <div className="board-details">
                        <span className="platform">{board.platform}</span>
                        <span className="version">v{board.version}</span>
                        <span className="size">{board.size}</span>
                      </div>
                    </div>
                    
                    <div className="board-status">
                      <span className="sharing-indicator">📤 共有中</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LANShareManager;
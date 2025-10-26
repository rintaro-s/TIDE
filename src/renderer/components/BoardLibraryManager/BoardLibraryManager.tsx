import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { logger, toast } from '../../utils/logger';
import './BoardLibraryManager.css';

// キャッシュストレージキー
const CACHE_KEY_PREFIX = 'tide_cache_';
const CACHE_EXPIRY_MS = 1000 * 60 * 60 * 24; // 24時間

interface BoardManagerProps {
  type: 'board' | 'library';
}

interface Board {
  id: string;
  name: string;
  platform: string;
  version?: string;
}

interface Library {
  name: string;
  version: string;
  author?: string;
  description?: string;
  website?: string;
  availableVersions?: string[];
  selectedVersion?: string;
}

const BoardLibraryManager: React.FC<BoardManagerProps> = ({ type }) => {
  const { mode } = useApp();
  const [items, setItems] = useState<(Board | Library)[]>([]);
  const [filteredItems, setFilteredItems] = useState<(Board | Library)[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [installing, setInstalling] = useState<Set<string>>(new Set());
  const [selectedVersions, setSelectedVersions] = useState<Map<string, string>>(new Map());
  const [cacheInfo, setCacheInfo] = useState<{ lastUpdate: number; source: string } | null>(null);

  // キャッシュ関連の関数
  const getCacheKey = (cacheType: string) => `${CACHE_KEY_PREFIX}${mode}_${cacheType}_${type}`;
  
  const getCachedData = (cacheType: string) => {
    try {
      const key = getCacheKey(cacheType);
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      const now = Date.now();
      
      if (now - data.timestamp > CACHE_EXPIRY_MS) {
        localStorage.removeItem(key);
        return null;
      }
      
      setCacheInfo({ lastUpdate: data.timestamp, source: 'cache' });
      return data.items;
    } catch (error) {
      console.error('Failed to load cached data:', error);
      return null;
    }
  };

  const setCachedData = (cacheType: string, items: any[]) => {
    try {
      const key = getCacheKey(cacheType);
      const data = {
        timestamp: Date.now(),
        items: items
      };
      localStorage.setItem(key, JSON.stringify(data));
      setCacheInfo({ lastUpdate: data.timestamp, source: 'network' });
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  };

  const clearCache = () => {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(CACHE_KEY_PREFIX));
      keys.forEach(key => localStorage.removeItem(key));
      setCacheInfo(null);
      toast.success('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast.error('Failed to clear cache');
    }
  };

  // 初期データロード
  useEffect(() => {
    if (mode) {
      loadItems();
    }
  }, [mode, type]);

  // 検索フィルタリング
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredItems(items);
      return;
    }

    const query = searchText.toLowerCase();
    const filtered = items.filter(item => {
      const name = item.name.toLowerCase();
      if ('platform' in item) {
        // Board
        const platform = item.platform.toLowerCase();
        return name.includes(query) || platform.includes(query);
      } else {
        // Library
        const desc = (item.description || '').toLowerCase();
        const author = (item.author || '').toLowerCase();
        return name.includes(query) || desc.includes(query) || author.includes(query);
      }
    });
    setFilteredItems(filtered);
  }, [searchText, items]);

  const loadItems = async (forceRefresh = false) => {
    if (!mode) return;

    // キャッシュから読み込みを試行
    if (!forceRefresh) {
      const cachedData = getCachedData('items');
      if (cachedData) {
        setItems(cachedData);
        setFilteredItems(cachedData);
        return;
      }
    }

    setLoading(true);
    try {
      let data: any[] = [];

      if (type === 'board') {
        if (mode === 'arduino') {
          try {
            logger.info('Fetching boards...');
            const result = await window.electronAPI.executeCommand('arduino-cli board listall --format json');
            
            if (result.success && result.output) {
              try {
                const data_parsed = JSON.parse(result.output);
                const boardList = data_parsed.boards?.map((b: any) => ({
                  id: b.fqbn,
                  name: b.name,
                  platform: b.platform || 'Unknown',
                  version: b.version
                })) || [];
                
                logger.success(`Found ${boardList.length} boards`);
                data = boardList;  // すべてのボードを表示
              } catch (parseError) {
                logger.error('Failed to parse boards JSON', String(parseError));
                data = [];
              }
            } else {
              logger.error('Failed to fetch boards', result.error || 'Unknown error');
              data = [];
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            logger.error('Board fetch error', errorMsg);
            data = [];
          }
        } else if (mode === 'platformio') {
          // TODO: Implement PlatformIO board listing
          logger.warning('PlatformIO board manager not yet implemented');
          data = [];
        }
      } else {
        // Libraries
        if (mode === 'arduino') {
          try {
            logger.info('Fetching libraries...');
            const result = await window.electronAPI.executeCommand('arduino-cli lib search ""');
            
            if (result.success && result.output) {
              try {
                const data_parsed = JSON.parse(result.output);
                const libList = data_parsed.libraries?.map((l: any) => ({
                  name: l.name,
                  version: l.latest?.version || '1.0.0',
                  author: l.latest?.author || 'Unknown',
                  description: l.latest?.description || '',
                  website: l.latest?.website || ''
                })) || [];
                
                logger.success(`Found ${libList.length} libraries`);
                data = libList;  // すべてのライブラリを表示
              } catch (parseError) {
                logger.error('Failed to parse libraries JSON', String(parseError));
                data = [];
              }
            } else {
              logger.error('Failed to fetch libraries', result.error || 'Unknown error');
              data = [];
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            logger.error('Library fetch error', errorMsg);
            data = [];
          }
        } else if (mode === 'platformio') {
          // TODO: Implement PlatformIO library listing
          logger.warning('PlatformIO library manager not yet implemented');
          data = [];
        }
      }

      // キャッシュに保存
      setCachedData('items', data);
      
      setItems(data);
      setFilteredItems(data);
    } catch (error) {
      console.error(`Failed to load ${type}s:`, error);
      // エラー時は空配列を表示
      setItems([]);
      setFilteredItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchText.trim()) {
      // 検索語句が空の場合は全アイテムを表示
      setFilteredItems(items);
      return;
    }

    // キャッシュされたデータからクライアントサイドでフィルタリング
    // これにより高速な検索が可能
    const query = searchText.toLowerCase();
    const filtered = items.filter(item => {
      const name = item.name.toLowerCase();
      if ('platform' in item) {
        // Board
        const platform = item.platform.toLowerCase();
        return name.includes(query) || platform.includes(query);
      } else {
        // Library
        const desc = (item.description || '').toLowerCase();
        const author = (item.author || '').toLowerCase();
        return name.includes(query) || desc.includes(query) || author.includes(query);
      }
    });
    
    setFilteredItems(filtered);
  };

  const handleInstall = async (item: Board | Library) => {
    const itemId = 'id' in item ? item.id : item.name;
    
    if (installing.has(itemId)) return;

    setInstalling(prev => new Set(prev).add(itemId));

    try {
      if (type === 'board') {
        // ボードのインストールはcore/platformのインストール
        toast.warning('Board installation not yet implemented');
      } else {
        // ライブラリのインストール
        if (mode === 'arduino') {
          const lib = item as Library;
          const selectedVersion = selectedVersions.get(lib.name) || lib.version;
          
          // First check if already installed
          const checkCommand = `arduino-cli lib list --format json`;
          const checkResult = await window.electronAPI.executeCommand(checkCommand);
          
          let isAlreadyInstalled = false;
          if (checkResult.success && checkResult.output) {
            try {
              const installed = JSON.parse(checkResult.output);
              const libs = installed.installed_libraries || [];
              isAlreadyInstalled = libs.some((l: any) => l.name === lib.name);
            } catch (e) {
              logger.warning('Failed to parse installed libraries list', String(e));
            }
          }
          
          if (isAlreadyInstalled) {
            logger.info(`Library "${lib.name}" is already installed`);
            toast.info('既にインストール済み', `${lib.name} はすでにインストールされています`);
          } else {
            const installCommand = `arduino-cli lib install "${lib.name}@${selectedVersion}"`;
            
            logger.info(`Installing library: ${lib.name}@${selectedVersion}`);
            const result = await window.electronAPI.executeCommand(installCommand);
            
            if (result.success) {
              logger.success(`Library "${lib.name}@${selectedVersion}" installed successfully`);
              toast.success('ライブラリをインストール', `${lib.name} v${selectedVersion} をインストールしました`);
            } else {
              logger.error(`Installation failed for ${lib.name}`, result.error || 'Unknown error');
              toast.error('インストール失敗', result.error || 'Unknown error');
            }
          }
        } else {
          toast.warning('PlatformIO library installation not yet implemented');
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Installation failed', errorMsg);
      toast.error('インストールエラー', errorMsg);
    } finally {
      setInstalling(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleVersionChange = (libraryName: string, version: string) => {
    setSelectedVersions(prev => {
      const next = new Map(prev);
      next.set(libraryName, version);
      return next;
    });
  };

  const isBoard = (item: Board | Library): item is Board => {
    return 'platform' in item;
  };

  return (
    <div className="board-library-manager">
      <div className="manager-header">
        <div className="header-top">
          <h3>{type === 'board' ? 'Board Manager' : 'Library Manager'}</h3>
          <div className="header-actions">
            <button 
              className="btn secondary"
              onClick={() => loadItems(true)}
              disabled={loading}
              title="Force refresh from server"
            >
              🔄 Re-index
            </button>
            <button 
              className="btn secondary"
              onClick={clearCache}
              title="Clear cached data"
            >
              🗑️ Clear Cache
            </button>
          </div>
        </div>
        
        <p>
          {type === 'board' 
            ? 'Essential development boards (cached for fast access)' 
            : 'Popular libraries and search results (cached for fast access)'}
        </p>
        
        {cacheInfo && (
          <div className="cache-info">
            <span className="cache-status">
              📦 Cached data from {cacheInfo.source} • 
              Last updated: {new Date(cacheInfo.lastUpdate).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className="search-controls">
        <form onSubmit={handleSearch} className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder={`Search ${type === 'board' ? 'boards' : 'libraries'}...`}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="search-btn" disabled={loading}>
            Search
          </button>
          <button 
            type="button"
            className="refresh-btn" 
            onClick={() => loadItems(true)}
            disabled={loading}
          >
            Refresh
          </button>
        </form>
      </div>

      <div className="items-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading {type === 'board' ? 'boards' : 'libraries'}...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <p>No {type === 'board' ? 'boards' : 'libraries'} found</p>
            <p className="hint">Try adjusting your search or click Refresh</p>
          </div>
        ) : (
          <div className="items-grid">
            {filteredItems.map((item, index) => {
              const itemId = isBoard(item) ? item.id : item.name;
              const isInstalling = installing.has(itemId);

              return (
                <div key={itemId || index} className={`${type}-item`}>
                  <div className="item-header">
                    <h4 className="item-name">{item.name}</h4>
                    {isBoard(item) ? (
                      <span className="platform-badge">{item.platform}</span>
                    ) : (
                      <span className="version-badge">v{item.version}</span>
                    )}
                  </div>

                  {!isBoard(item) && (
                    <div className="library-meta">
                      <p className="library-description">{item.description}</p>
                      {item.author && (
                        <div className="meta-item">
                          <span className="meta-label">Author:</span>
                          <span className="meta-value">{item.author}</span>
                        </div>
                      )}
                      {item.website && (
                        <div className="meta-item">
                          <span className="meta-label">Website:</span>
                          <a 
                            href={item.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="meta-value"
                          >
                            {item.website}
                          </a>
                        </div>
                      )}
                      <div className="meta-item version-selector">
                        <span className="meta-label">Version:</span>
                        <select
                          value={selectedVersions.get(item.name) || item.version}
                          onChange={(e) => handleVersionChange(item.name, e.target.value)}
                          disabled={isInstalling}
                        >
                          <option value={item.version}>{item.version} (latest)</option>
                          {item.availableVersions?.filter(v => v !== item.version).map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {isBoard(item) && item.version && (
                    <div className="board-meta">
                      <span className="meta-label">Version:</span>
                      <span className="meta-value">{item.version}</span>
                    </div>
                  )}

                  <div className="item-actions">
                    <button
                      className="install-btn"
                      onClick={() => handleInstall(item)}
                      disabled={isInstalling}
                    >
                      {isInstalling ? 'Installing...' : 'Install'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardLibraryManager;

import React, { useState, useEffect } from 'react';
import { ArduinoCLIService } from '../../services/ArduinoService';
import { PlatformIOService } from '../../services/PlatformIOService';
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
}

const BoardLibraryManager: React.FC<BoardManagerProps> = ({ type }) => {
  const { mode } = useApp();
  const [items, setItems] = useState<(Board | Library)[]>([]);
  const [filteredItems, setFilteredItems] = useState<(Board | Library)[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [installing, setInstalling] = useState<Set<string>>(new Set());
  const [cacheInfo, setCacheInfo] = useState<{ lastUpdate: number; source: string } | null>(null);

  const arduinoService = ArduinoCLIService.getInstance();
  const platformioService = PlatformIOService.getInstance();

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
        // 基本的なボードのみを表示（最も使用頻度の高いもの）
        const commonBoards = [
          { id: 'arduino:avr:uno', name: 'Arduino Uno', platform: 'Arduino AVR', version: '1.8.6' },
          { id: 'arduino:avr:nano', name: 'Arduino Nano', platform: 'Arduino AVR', version: '1.8.6' },
          { id: 'arduino:avr:mega', name: 'Arduino Mega 2560', platform: 'Arduino AVR', version: '1.8.6' },
          { id: 'arduino:avr:leonardo', name: 'Arduino Leonardo', platform: 'Arduino AVR', version: '1.8.6' },
          { id: 'esp32:esp32:esp32', name: 'ESP32 Dev Module', platform: 'ESP32', version: '3.0.0' },
          { id: 'esp8266:esp8266:nodemcuv2', name: 'NodeMCU 1.0 (ESP-12E)', platform: 'ESP8266', version: '3.1.2' },
        ];

        if (mode === 'arduino') {
          try {
            const installed = await arduinoService.checkInstallation();
            if (installed) {
              const boards = await arduinoService.listBoards();
              // インストール済みボードがあれば、それを優先表示
              if (boards && boards.length > 0) {
                data = boards.slice(0, 10).map((b: any) => ({
                  id: b.fqbn || b.id,
                  name: b.name,
                  platform: b.core || b.platform || 'Unknown',
                  version: b.version
                }));
              } else {
                data = commonBoards;
              }
            } else {
              data = commonBoards;
            }
          } catch (error) {
            console.warn('Arduino CLI not available, using common boards');
            data = commonBoards;
          }
        } else {
          // PlatformIO用の基本ボード
          data = [
            { id: 'uno', name: 'Arduino Uno', platform: 'atmelavr', version: '4.2.0' },
            { id: 'esp32dev', name: 'ESP32 Dev Module', platform: 'espressif32', version: '6.5.0' },
            { id: 'nodemcuv2', name: 'NodeMCU 1.0', platform: 'espressif8266', version: '4.2.1' },
            { id: 'leonardo', name: 'Arduino Leonardo', platform: 'atmelavr', version: '4.2.0' },
          ];
        }
      } else {
        // 人気ライブラリの厳選リスト
        const popularLibraries = [
          {
            name: 'ArduinoJson',
            version: '7.0.4',
            author: 'Benoit Blanchon',
            description: 'JSON library for embedded C++ with zero-copy parser',
            website: 'https://arduinojson.org'
          },
          {
            name: 'WiFi',
            version: '1.2.7',
            author: 'Arduino',
            description: 'WiFi library for Arduino',
            website: 'https://www.arduino.cc/en/Reference/WiFi'
          },
          {
            name: 'Servo',
            version: '1.2.1',
            author: 'Michael Margolis',
            description: 'Control servo motors',
            website: 'https://www.arduino.cc/reference/en/libraries/servo/'
          },
          {
            name: 'SPI',
            version: '1.0',
            author: 'Arduino',
            description: 'Serial Peripheral Interface library',
            website: 'https://www.arduino.cc/en/reference/SPI'
          },
          {
            name: 'Wire',
            version: '1.0',
            author: 'Arduino',
            description: 'I2C communication library',
            website: 'https://www.arduino.cc/en/reference/wire'
          },
          {
            name: 'LiquidCrystal',
            version: '1.0.7',
            author: 'Arduino',
            description: 'Control liquid crystal displays (LCDs)',
            website: 'https://www.arduino.cc/en/Reference/LiquidCrystal'
          }
        ];

        if (mode === 'arduino') {
          try {
            const installed = await arduinoService.checkInstallation();
            if (installed) {
              // 常に全ライブラリを取得してキャッシュ（検索語句によらず）
              const libs = await arduinoService.searchLibraries('*'); // '*'で全ライブラリを取得
              if (libs && libs.length > 0) {
                data = libs.map((l: any) => ({
                  name: l.name,
                  version: l.latest || l.version || '1.0.0',
                  author: l.author || 'Unknown',
                  description: l.sentence || l.description || '',
                  website: l.website || ''
                }));
              } else {
                // APIが空の場合は人気ライブラリを使用
                data = popularLibraries;
              }
            } else {
              data = popularLibraries;
            }
          } catch (error) {
            console.warn('Arduino CLI library fetch failed, using popular libraries');
            data = popularLibraries;
          }
        } else {
          data = popularLibraries;
        }
      }

      // キャッシュに保存
      setCachedData('items', data);
      
      setItems(data);
      setFilteredItems(data);
    } catch (error) {
      console.error(`Failed to load ${type}s:`, error);
      // エラー時は基本データを表示
      const fallbackData = type === 'board' 
        ? [{ id: 'arduino:avr:uno', name: 'Arduino Uno', platform: 'Arduino AVR', version: '1.8.6' }]
        : [{ name: 'ArduinoJson', version: '7.0.4', author: 'Benoit Blanchon', description: 'JSON library for embedded C++' }];
      
      setItems(fallbackData);
      setFilteredItems(fallbackData);
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
        alert(`Board installation not yet implemented for ${item.name}`);
      } else {
        // ライブラリのインストール
        if (mode === 'arduino') {
          const lib = item as Library;
          await arduinoService.installLibrary(lib.name);
          alert(`Library "${lib.name}" installed successfully!`);
        } else {
          alert(`Library installation not yet implemented for PlatformIO`);
        }
      }
    } catch (error) {
      console.error('Installation failed:', error);
      alert(`Installation failed: ${error}`);
    } finally {
      setInstalling(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
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

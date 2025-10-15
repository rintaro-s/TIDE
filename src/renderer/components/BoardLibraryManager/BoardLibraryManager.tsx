import React, { useState, useEffect } from 'react';
import { ArduinoCLIService } from '../../services/ArduinoService';
import { PlatformIOService } from '../../services/PlatformIOService';
import { useApp } from '../../contexts/AppContext';
import { logger, toast } from '../../utils/logger';
import './BoardLibraryManager.css';

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

  const arduinoService = ArduinoCLIService.getInstance();
  const platformioService = PlatformIOService.getInstance();

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

  const loadItems = async () => {
    if (!mode) return;

    setLoading(true);
    try {
      let data: any[] = [];

      if (type === 'board') {
        // ボードリストを取得
        if (mode === 'arduino') {
          const installed = await arduinoService.checkInstallation();
          if (installed) {
            const boards = await arduinoService.listBoards();
            data = boards.map((b: any) => ({
              id: b.fqbn || b.id,
              name: b.name,
              platform: b.core || b.platform || 'Unknown',
              version: b.version
            }));
          } else {
            throw new Error('Arduino CLI is not installed');
          }
        } else {
          const installed = await platformioService.checkInstallation();
          if (installed) {
            const boards = await platformioService.listAllBoards();
            data = boards.map((b: any) => ({
              id: b.id,
              name: b.name,
              platform: b.platform || 'PlatformIO',
              version: b.version
            }));
          } else {
            throw new Error('PlatformIO is not installed');
          }
        }
      } else {
        // ライブラリリストを取得
        if (mode === 'arduino') {
          const installed = await arduinoService.checkInstallation();
          if (installed) {
            // デフォルトで人気のライブラリを検索
            const libs = await arduinoService.searchLibraries('');
            data = libs.map((l: any) => ({
              name: l.name,
              version: l.latest || l.version || '1.0.0',
              author: l.author || 'Unknown',
              description: l.sentence || l.description || '',
              website: l.website || ''
            }));
          } else {
            throw new Error('Arduino CLI is not installed');
          }
        } else {
          // PlatformIOのライブラリ検索
          data = [
            {
              name: 'ArduinoJson',
              version: '6.21.3',
              author: 'Benoit Blanchon',
              description: 'JSON library for embedded C++',
              website: 'https://arduinojson.org'
            },
            {
              name: 'Adafruit GFX Library',
              version: '1.11.9',
              author: 'Adafruit',
              description: 'Graphics core library',
              website: 'https://github.com/adafruit/Adafruit-GFX-Library'
            }
          ];
        }
      }

      setItems(data);
      setFilteredItems(data);
    } catch (error) {
      console.error(`Failed to load ${type}s:`, error);
      alert(`Failed to load ${type}s: ${error}`);
      setItems([]);
      setFilteredItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchText.trim() || !mode) {
      setFilteredItems(items);
      return;
    }

    // ライブラリの場合は実際に検索APIを呼ぶ
    if (type === 'library' && mode === 'arduino') {
      setLoading(true);
      try {
        const results = await arduinoService.searchLibraries(searchText);
        const data = results.map((l: any) => ({
          name: l.name,
          version: l.latest || l.version || '1.0.0',
          author: l.author || 'Unknown',
          description: l.sentence || l.description || '',
          website: l.website || ''
        }));
        setItems(data);
        setFilteredItems(data);
      } catch (error) {
        console.error('Search failed:', error);
        alert('Search failed: ' + error);
      } finally {
        setLoading(false);
      }
    }
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
        <h3>{type === 'board' ? 'Board Manager' : 'Library Manager'}</h3>
        <p>
          {type === 'board' 
            ? 'Browse and install development boards' 
            : 'Search and install libraries for your projects'}
        </p>
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
            onClick={loadItems}
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

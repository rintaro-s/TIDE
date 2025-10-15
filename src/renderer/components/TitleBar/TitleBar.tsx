import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './TitleBar.css';

interface TitleBarProps {
  mode?: 'arduino' | 'platformio' | null;
  onNewProject?: () => void;
}

const TitleBar: React.FC<TitleBarProps> = ({ mode, onNewProject }) => {
  const { theme, toggleTheme } = useTheme();

  const handleMenuClick = async (menuItem: string) => {
    switch (menuItem) {
      case 'new-project':
        if (onNewProject) {
          onNewProject();
        }
        break;
      case 'open-folder':
        try {
          const result = await window.electronAPI?.dialog.showOpenDialog({
            title: 'フォルダを開く',
            properties: ['openDirectory']
          });
          if (result && !result.canceled && result.filePaths.length > 0) {
            // プロジェクト開く処理
            console.log('Opening folder:', result.filePaths[0]);
          }
        } catch (error) {
          console.error('Failed to open folder:', error);
        }
        break;
      case 'save':
        // 保存処理
        break;
      default:
        break;
    }
  };

  return (
    <div className="title-bar">
      <div className="title-bar-left">
        <div className="app-icon">T</div>
        <span className="app-title">Tova IDE</span>
        <span className="mode-indicator">{mode === 'arduino' ? 'Arduino CLI' : 'PlatformIO'}</span>
      </div>

      <div className="title-bar-center">
        <div className="menu-bar">
          <div className="menu-item dropdown">
            <span>ファイル</span>
            <div className="dropdown-content">
              <div className="menu-option" onClick={() => handleMenuClick('new-project')}>
                新規プロジェクト
              </div>
              <div className="menu-option" onClick={() => handleMenuClick('open-folder')}>
                フォルダを開く
              </div>
              <div className="menu-separator"></div>
              <div className="menu-option" onClick={() => handleMenuClick('save')}>
                保存
              </div>
              <div className="menu-option" onClick={() => handleMenuClick('save-as')}>
                名前を付けて保存
              </div>
            </div>
          </div>
          <div className="menu-item dropdown">
            <span>編集</span>
            <div className="dropdown-content">
              <div className="menu-option">元に戻す</div>
              <div className="menu-option">やり直し</div>
              <div className="menu-separator"></div>
              <div className="menu-option">切り取り</div>
              <div className="menu-option">コピー</div>
              <div className="menu-option">貼り付け</div>
            </div>
          </div>
          <div className="menu-item dropdown">
            <span>ビルド</span>
            <div className="dropdown-content">
              <div className="menu-option">ビルド</div>
              <div className="menu-option">アップロード</div>
              <div className="menu-option">ビルド＆アップロード</div>
            </div>
          </div>
          <div className="menu-item dropdown">
            <span>ツール</span>
            <div className="dropdown-content">
              <div className="menu-option">ボードマネージャー</div>
              <div className="menu-option">ライブラリマネージャー</div>
              <div className="menu-option">シリアルモニター</div>
            </div>
          </div>
          <div className="menu-item dropdown">
            <span>ヘルプ</span>
            <div className="dropdown-content">
              <div className="menu-option">ドキュメント</div>
              <div className="menu-option">バージョン情報</div>
            </div>
          </div>
        </div>
      </div>

      <div className="title-bar-right">
        <button className="title-btn theme-btn" onClick={toggleTheme} title="テーマ切り替え">
          {theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'Blue'}
        </button>
        
        <button 
          className="window-control minimize" 
          onClick={() => window.electronAPI?.window.minimize()}
          title="最小化"
        >
          _
        </button>
        <button 
          className="window-control maximize" 
          onClick={() => window.electronAPI?.window.maximize()}
          title="最大化"
        >
          []
        </button>
        <button 
          className="window-control close" 
          onClick={() => window.electronAPI?.window.close()}
          title="閉じる"
        >
          X
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
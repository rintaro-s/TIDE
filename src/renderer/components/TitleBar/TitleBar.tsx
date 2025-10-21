import React, { useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import './TitleBar.css';

interface TitleBarProps {
  mode?: 'arduino' | 'platformio' | null;
  onNewProject?: () => void;
}

const TitleBar: React.FC<TitleBarProps> = ({ mode, onNewProject }) => {
  const { theme, toggleTheme } = useTheme();
  const { currentProject } = useApp();
  
  console.log('🎬 TitleBar rendered', { mode, theme });

  const handleMenuClick = useCallback(async (menuItem: string) => {
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
            // メニューアクション経由でファイルを開く
            window.electronAPI?.onMenuAction((action: string) => {
              if (action === 'open-folder') {
                console.log('Opening folder:', result.filePaths[0]);
              }
            });
            console.log('Opening folder:', result.filePaths[0]);
          }
        } catch (error) {
          console.error('Failed to open folder:', error);
        }
        break;
      
      case 'save':
        try {
          // Save current document
          console.log('Save command');
        } catch (error) {
          console.error('Failed to save:', error);
        }
        break;
      
      case 'save-all':
        try {
          console.log('Save all command');
        } catch (error) {
          console.error('Failed to save all:', error);
        }
        break;

      case 'undo':
        document.execCommand('undo');
        break;
      
      case 'redo':
        document.execCommand('redo');
        break;
      
      case 'cut':
        document.execCommand('cut');
        break;
      
      case 'copy':
        document.execCommand('copy');
        break;
      
      case 'paste':
        document.execCommand('paste');
        break;

      case 'build':
        console.log('Build command');
        break;
      
      case 'upload':
        console.log('Upload command');
        break;
      
      case 'build-upload':
        console.log('Build & upload command');
        break;

      default:
        console.log('Menu item clicked:', menuItem);
        break;
    }
  }, [onNewProject]);

  return (
    <div className="title-bar">
      <div className="title-bar-left">
        <div className="app-icon">T</div>
        <span className="app-title">Tova IDE</span>
        <span className="mode-indicator">{mode === 'arduino' ? 'Arduino CLI' : 'PlatformIO'}</span>
      </div>

      <div className="title-bar-center">
        <div className="menu-bar">
          {/* File Menu */}
          <div className="menu-item dropdown">
            <span>ファイル</span>
            <div className="dropdown-content">
              <div className="menu-option" onClick={() => handleMenuClick('new-project')}>
                <span>新規プロジェクト</span>
                <span className="shortcut">Ctrl+N</span>
              </div>
              <div className="menu-option" onClick={() => handleMenuClick('open-folder')}>
                <span>フォルダを開く</span>
                <span className="shortcut">Ctrl+O</span>
              </div>
              <div className="menu-separator"></div>
              <div className="menu-option" onClick={() => handleMenuClick('save')}>
                <span>保存</span>
                <span className="shortcut">Ctrl+S</span>
              </div>
              <div className="menu-option" onClick={() => handleMenuClick('save-all')}>
                <span>すべて保存</span>
                <span className="shortcut">Ctrl+Shift+S</span>
              </div>
              <div className="menu-separator"></div>
              <div className="menu-option" onClick={() => window.electronAPI?.window.close()}>
                <span>終了</span>
                <span className="shortcut">Ctrl+Q</span>
              </div>
            </div>
          </div>

          {/* Edit Menu */}
          <div className="menu-item dropdown">
            <span>編集</span>
            <div className="dropdown-content">
              <div className="menu-option" onClick={() => handleMenuClick('undo')}>
                <span>元に戻す</span>
                <span className="shortcut">Ctrl+Z</span>
              </div>
              <div className="menu-option" onClick={() => handleMenuClick('redo')}>
                <span>やり直し</span>
                <span className="shortcut">Ctrl+Y</span>
              </div>
              <div className="menu-separator"></div>
              <div className="menu-option" onClick={() => handleMenuClick('cut')}>
                <span>切り取り</span>
                <span className="shortcut">Ctrl+X</span>
              </div>
              <div className="menu-option" onClick={() => handleMenuClick('copy')}>
                <span>コピー</span>
                <span className="shortcut">Ctrl+C</span>
              </div>
              <div className="menu-option" onClick={() => handleMenuClick('paste')}>
                <span>貼り付け</span>
                <span className="shortcut">Ctrl+V</span>
              </div>
            </div>
          </div>

          {/* Build Menu */}
          <div className="menu-item dropdown">
            <span>ビルド</span>
            <div className="dropdown-content">
              <div className="menu-option" onClick={() => handleMenuClick('build')}>
                <span>ビルド</span>
                <span className="shortcut">Ctrl+B</span>
              </div>
              <div className="menu-option" onClick={() => handleMenuClick('upload')}>
                <span>アップロード</span>
                <span className="shortcut">Ctrl+U</span>
              </div>
              <div className="menu-option" onClick={() => handleMenuClick('build-upload')}>
                <span>ビルド＆アップロード</span>
                <span className="shortcut">Ctrl+Shift+U</span>
              </div>
            </div>
          </div>

          {/* Tools Menu */}
          <div className="menu-item dropdown">
            <span>ツール</span>
            <div className="dropdown-content">
              <div className="menu-option" onClick={() => console.log('Board manager')}>
                ボードマネージャー
              </div>
              <div className="menu-option" onClick={() => console.log('Library manager')}>
                ライブラリマネージャー
              </div>
              <div className="menu-option" onClick={() => console.log('Serial monitor')}>
                シリアルモニター
              </div>
            </div>
          </div>

          {/* Help Menu */}
          <div className="menu-item dropdown">
            <span>ヘルプ</span>
            <div className="dropdown-content">
              <div className="menu-option" onClick={() => window.open('https://docs.tova-ide.local', '_blank')}>
                ドキュメント
              </div>
              <div className="menu-option" onClick={() => window.open('https://github.com/tova-ide', '_blank')}>
                GitHub
              </div>
              <div className="menu-separator"></div>
              <div className="menu-option" onClick={() => console.log('About dialog')}>
                バージョン情報
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="title-bar-right">
        <span className="project-indicator">
          {currentProject?.name || 'プロジェクトなし'}
        </span>

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
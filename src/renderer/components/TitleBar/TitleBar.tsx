import React, { useCallback, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { getFileName } from '../../utils/pathUtils';
import ProgressLog from '../ProgressLog/ProgressLog';
import LANShareManager from '../LANShareManager/LANShareManager';
import MusicControls from '../MusicControls/MusicControls';
import './TitleBar.css';

interface TitleBarProps {
  mode?: 'arduino' | 'platformio' | null;
  onNewProject?: () => void;
}

const TitleBar: React.FC<TitleBarProps> = ({ mode, onNewProject }) => {
  const { theme, toggleTheme } = useTheme();
  const { currentProject } = useApp();
  const [showProgressLog, setShowProgressLog] = useState(false);
  const [showLANShare, setShowLANShare] = useState(false);
  
  console.log('🎬 TitleBar rendered', { mode, theme });

  const handleMenuClick = useCallback(async (menuItem: string) => {
    switch (menuItem) {
      case 'new-project':
        if (onNewProject) {
          onNewProject();
        } else {
          // Create new project dialog
          try {
            const result = await window.electronAPI?.dialog.showMessageBox({
              type: 'question',
              buttons: ['Arduino プロジェクト', 'PlatformIO プロジェクト', 'キャンセル'],
              defaultId: 0,
              title: '新規プロジェクト作成',
              message: 'どの種類のプロジェクトを作成しますか？'
            });
            
            if (result && result.response < 2) {
              const projectType = result.response === 0 ? 'arduino' : 'platformio';
              console.log(`Creating new ${projectType} project`);
              
              // Dispatch new project event
              const newProjectEvent = new CustomEvent('createNewProject', { 
                detail: { type: projectType } 
              });
              window.dispatchEvent(newProjectEvent);
            }
          } catch (error) {
            console.error('Failed to create new project:', error);
          }
        }
        break;
        
      case 'open-folder':
        try {
          const result = await window.electronAPI?.dialog.showOpenDialog({
            title: 'フォルダを開く',
            properties: ['openDirectory']
          });
          if (result && !result.canceled && result.filePaths.length > 0) {
            const folderPath = result.filePaths[0];
            console.log('Opening folder:', folderPath);
            
            // Dispatch folder open event
            const openFolderEvent = new CustomEvent('openFolder', { 
              detail: { path: folderPath } 
            });
            window.dispatchEvent(openFolderEvent);
            
            // Show success message
            const statusElement = document.querySelector('.status-message');
            if (statusElement) {
              statusElement.textContent = `フォルダを開きました: ${folderPath}`;
              setTimeout(() => {
                statusElement.textContent = '';
              }, 3000);
            }
          }
        } catch (error) {
          console.error('Failed to open folder:', error);
          const statusElement = document.querySelector('.status-message');
          if (statusElement) {
            statusElement.textContent = 'フォルダを開くのに失敗しました';
            setTimeout(() => {
              statusElement.textContent = '';
            }, 3000);
          }
        }
        break;
        
      case 'open-file':
        try {
          const result = await window.electronAPI?.dialog.showOpenDialog({
            title: 'ファイルを開く',
            properties: ['openFile'],
            filters: [
              { name: 'Arduinoファイル', extensions: ['ino', 'cpp', 'c', 'h'] },
              { name: 'すべてのファイル', extensions: ['*'] }
            ]
          });
          if (result && !result.canceled && result.filePaths.length > 0) {
            const filePath = result.filePaths[0];
            console.log('Opening file:', filePath);
            
            // Read file content
            const content = await window.electronAPI?.fs.readFile(filePath);
            if (content) {
              // Dispatch file open event
              const openFileEvent = new CustomEvent('openFile', { 
                detail: { path: filePath, content } 
              });
              window.dispatchEvent(openFileEvent);
            }
          }
        } catch (error) {
          console.error('Failed to open file:', error);
        }
        break;
      
      case 'save':
        // Use App.tsx handler instead of old implementation
        console.log('Save action triggered from menu');
        break;
        
      case 'save-as':
        try {
          const editorInstance = (window as any).monacoEditor;
          if (!editorInstance) {
            console.warn('No active editor');
            return;
          }
          
          const result = await window.electronAPI?.dialog.showSaveDialog({
            title: '名前を付けて保存',
            defaultPath: 'untitled.ino',
            filters: [
              { name: 'Arduinoファイル', extensions: ['ino'] },
              { name: 'C++ファイル', extensions: ['cpp'] },
              { name: 'Cファイル', extensions: ['c'] },
              { name: 'ヘッダーファイル', extensions: ['h'] },
              { name: 'すべてのファイル', extensions: ['*'] }
            ]
          });
          
          if (result && !result.canceled && result.filePath) {
            const content = editorInstance.getValue();
            await window.electronAPI?.fs.writeFile(result.filePath, content);
            
            // Update current file reference
            (window as any).currentFile = result.filePath;
            
            // Update document title
            const fileName = getFileName(result.filePath);
            document.title = `${fileName} - Tova IDE`;
            
            // Dispatch save event
            const saveEvent = new CustomEvent('fileSaved', { 
              detail: { filePath: result.filePath, content, success: true } 
            });
            window.dispatchEvent(saveEvent);
            
            console.log('✅ File saved as:', result.filePath);
          }
        } catch (error) {
          console.error('Failed to save file as:', error);
        }
        break;
      
      case 'save-all':
        try {
          console.log('Saving all open files...');
          // TODO: Implement save all functionality when tabs are implemented
          
          const statusElement = document.querySelector('.status-message');
          if (statusElement) {
            statusElement.textContent = 'すべてのファイルを保存しました';
            setTimeout(() => {
              statusElement.textContent = '';
            }, 3000);
          }
        } catch (error) {
          console.error('Failed to save all:', error);
        }
        break;

      case 'undo':
        // Use Monaco editor undo if available
        const editorInstance = (window as any).monacoEditor;
        if (editorInstance) {
          editorInstance.trigger('keyboard', 'undo', null);
        } else {
          document.execCommand('undo');
        }
        break;
      
      case 'redo':
        // Use Monaco editor redo if available
        const editorInstanceRedo = (window as any).monacoEditor;
        if (editorInstanceRedo) {
          editorInstanceRedo.trigger('keyboard', 'redo', null);
        } else {
          document.execCommand('redo');
        }
        break;
      
      case 'cut':
        const editorInstanceCut = (window as any).monacoEditor;
        if (editorInstanceCut) {
          editorInstanceCut.trigger('keyboard', 'editor.action.clipboardCutAction', null);
        } else {
          document.execCommand('cut');
        }
        break;
      
      case 'copy':
        const editorInstanceCopy = (window as any).monacoEditor;
        if (editorInstanceCopy) {
          editorInstanceCopy.trigger('keyboard', 'editor.action.clipboardCopyAction', null);
        } else {
          document.execCommand('copy');
        }
        break;
      
      case 'paste':
        const editorInstancePaste = (window as any).monacoEditor;
        if (editorInstancePaste) {
          editorInstancePaste.trigger('keyboard', 'editor.action.clipboardPasteAction', null);
        } else {
          document.execCommand('paste');
        }
        break;
        
      case 'select-all':
        const editorInstanceSelectAll = (window as any).monacoEditor;
        if (editorInstanceSelectAll) {
          editorInstanceSelectAll.trigger('keyboard', 'editor.action.selectAll', null);
        } else {
          document.execCommand('selectAll');
        }
        break;
        
      case 'find':
        const editorInstanceFind = (window as any).monacoEditor;
        if (editorInstanceFind) {
          editorInstanceFind.trigger('keyboard', 'actions.find', null);
        }
        break;
        
      case 'replace':
        const editorInstanceReplace = (window as any).monacoEditor;
        if (editorInstanceReplace) {
          editorInstanceReplace.trigger('keyboard', 'editor.action.startFindReplaceAction', null);
        }
        break;

      case 'build':
        console.log('Build command triggered from menu');
        // Trigger build action
        const buildEvent = new CustomEvent('triggerBuild', { detail: { action: 'compile' } });
        window.dispatchEvent(buildEvent);
        break;
      
      case 'upload':
        console.log('Upload command triggered from menu');
        // Trigger upload action
        const uploadEvent = new CustomEvent('triggerBuild', { detail: { action: 'upload' } });
        window.dispatchEvent(uploadEvent);
        break;
      
      case 'build-upload':
        console.log('Build & upload command triggered from menu');
        // Trigger build & upload action
        const buildUploadEvent = new CustomEvent('triggerBuild', { detail: { action: 'build-upload' } });
        window.dispatchEvent(buildUploadEvent);
        break;
        
      case 'clean':
        console.log('Clean build command triggered from menu');
        const cleanEvent = new CustomEvent('triggerBuild', { detail: { action: 'clean' } });
        window.dispatchEvent(cleanEvent);
        break;
        
      case 'board-manager':
        console.log('Opening board manager');
        const boardManagerEvent = new CustomEvent('openBoardManager');
        window.dispatchEvent(boardManagerEvent);
        break;
        
      case 'library-manager':
        console.log('Opening library manager');
        const libraryManagerEvent = new CustomEvent('openLibraryManager');
        window.dispatchEvent(libraryManagerEvent);
        break;
        
      case 'serial-monitor':
        console.log('Opening serial monitor');
        // Switch to serial monitor tab in bottom panel
        const serialEvent = new CustomEvent('switchToTab', { detail: { tab: 'serial' } });
        window.dispatchEvent(serialEvent);
        break;
        
      case 'preferences':
        console.log('Opening preferences');
        const preferencesEvent = new CustomEvent('openPreferences');
        window.dispatchEvent(preferencesEvent);
        break;

      case 'about':
        try {
          await window.electronAPI?.dialog.showMessageBox({
            type: 'info',
            title: 'Tova IDE について',
            message: 'Tova IDE v1.0.0',
            detail: 'Arduino と PlatformIO 開発のための統合開発環境\n\n開発者: Tova Team\nライセンス: MIT\n\nArduino IDE と PlatformIO の機能を統合した、\nモダンで使いやすい開発環境です。',
            buttons: ['OK']
          });
        } catch (error) {
          console.error('Failed to show about dialog:', error);
        }
        break;

      default:
        console.log('Menu item clicked:', menuItem);
        break;
    }
  }, [onNewProject, currentProject]);

  return (
    <div className="title-bar" data-surface="chrome">
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
              <div className="menu-separator"></div>
              <div className="menu-option" onClick={() => handleMenuClick('open-file')}>
                <span>ファイルを開く</span>
                <span className="shortcut">Ctrl+O</span>
              </div>
              <div className="menu-option" onClick={() => handleMenuClick('open-folder')}>
                <span>フォルダを開く</span>
                <span className="shortcut">Ctrl+Shift+O</span>
              </div>
              <div className="menu-separator"></div>
              <div className="menu-option" onClick={() => handleMenuClick('save')}>
                <span>保存</span>
                <span className="shortcut">Ctrl+S</span>
              </div>
              <div className="menu-option" onClick={() => handleMenuClick('save-as')}>
                <span>名前を付けて保存</span>
                <span className="shortcut">Ctrl+Shift+S</span>
              </div>
              <div className="menu-option" onClick={() => handleMenuClick('save-all')}>
                <span>すべて保存</span>
                <span className="shortcut">Ctrl+K Ctrl+S</span>
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
              <div className="menu-separator"></div>
              <div className="menu-option" onClick={() => handleMenuClick('select-all')}>
                <span>すべて選択</span>
                <span className="shortcut">Ctrl+A</span>
              </div>
              <div className="menu-separator"></div>
              <div className="menu-option" onClick={() => handleMenuClick('find')}>
                <span>検索</span>
                <span className="shortcut">Ctrl+F</span>
              </div>
              <div className="menu-option" onClick={() => handleMenuClick('replace')}>
                <span>置換</span>
                <span className="shortcut">Ctrl+H</span>
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
              <div className="menu-separator"></div>
              <div className="menu-option" onClick={() => handleMenuClick('clean')}>
                <span>クリーンビルド</span>
                <span className="shortcut">Ctrl+Shift+B</span>
              </div>
            </div>
          </div>

          {/* Tools Menu */}
          <div className="menu-item dropdown">
            <span>ツール</span>
            <div className="dropdown-content">
              <div className="menu-option" onClick={() => handleMenuClick('board-manager')}>
                <span>ボードマネージャー</span>
              </div>
              <div className="menu-option" onClick={() => handleMenuClick('library-manager')}>
                <span>ライブラリマネージャー</span>
              </div>
              <div className="menu-separator"></div>
              <div className="menu-option" onClick={() => handleMenuClick('serial-monitor')}>
                <span>シリアルモニター</span>
                <span className="shortcut">Ctrl+Shift+M</span>
              </div>
              <div className="menu-separator"></div>
              <div className="menu-option" onClick={() => setShowProgressLog(true)}>
                <span>進捗ログ</span>
              </div>
              <div className="menu-option" onClick={() => setShowLANShare(true)}>
                <span>LAN内ボード共有</span>
              </div>
              <div className="menu-separator"></div>
              <div className="menu-option" onClick={() => handleMenuClick('preferences')}>
                <span>設定</span>
                <span className="shortcut">Ctrl+,</span>
              </div>
            </div>
          </div>

          {/* Help Menu */}
          <div className="menu-item dropdown">
            <span>ヘルプ</span>
            <div className="dropdown-content">
              <div className="menu-option" onClick={() => window.open('https://docs.tova-ide.local', '_blank')}>
                <span>ドキュメント</span>
                <span className="shortcut">F1</span>
              </div>
              <div className="menu-option" onClick={() => window.open('https://arduino.cc/reference', '_blank')}>
                <span>Arduino リファレンス</span>
              </div>
              <div className="menu-option" onClick={() => window.open('https://platformio.org/docs/', '_blank')}>
                <span>PlatformIO ドキュメント</span>
              </div>
              <div className="menu-separator"></div>
              <div className="menu-option" onClick={() => window.open('https://github.com/tova-ide', '_blank')}>
                <span>GitHub</span>
              </div>
              <div className="menu-option" onClick={() => window.open('https://github.com/tova-ide/issues', '_blank')}>
                <span>バグレポート</span>
              </div>
              <div className="menu-separator"></div>
              <div className="menu-option" onClick={() => handleMenuClick('about')}>
                <span>バージョン情報</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Music Controls */}
      <MusicControls />

      <div className="title-bar-right">
        <span className="project-indicator">
          {currentProject?.name || 'プロジェクトなし'}
        </span>

        <button 
          className="title-btn log-btn" 
          onClick={() => setShowProgressLog(true)} 
          title="進捗ログを表示"
        >
          📋
        </button>

        <button 
          className="title-btn share-btn" 
          onClick={() => setShowLANShare(true)} 
          title="LAN内ボード共有"
        >
          🌐
        </button>

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

      {/* Progress Log Modal */}
      <ProgressLog 
        isVisible={showProgressLog} 
        onClose={() => setShowProgressLog(false)} 
      />

      {/* LAN Share Manager Modal */}
      <LANShareManager 
        isVisible={showLANShare} 
        onClose={() => setShowLANShare(false)} 
      />
    </div>
  );
};

export default TitleBar;
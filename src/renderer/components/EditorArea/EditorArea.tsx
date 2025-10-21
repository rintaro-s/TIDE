import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import AdvancedEditor from '../AdvancedEditor/AdvancedEditor';
import './EditorArea.css';

interface FileContent {
  [filePath: string]: string;
}

const EditorArea: React.FC = () => {
  const { state, closeFile, setActiveFile, settings } = useApp();
  const [fileContents, setFileContents] = useState<FileContent>({});
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  console.log('📝 EditorArea rendered', { openFilesCount: state.openFiles.length, activeFile: state.activeFile });

  // ファイルが開かれたら実際の内容をロード
  useEffect(() => {
    const loadFileContents = async () => {
      const newContents: FileContent = {};
      
      for (const file of state.openFiles) {
        if (!fileContents[file.path]) {
          try {
            const content = await window.electronAPI.fs.readFile(file.path);
            newContents[file.path] = content;
          } catch (error) {
            console.error('Failed to load file:', file.path, error);
            newContents[file.path] = file.content || '';
          }
        }
      }
      
      if (Object.keys(newContents).length > 0) {
        setFileContents(prev => ({ ...prev, ...newContents }));
      }
    };
    
    loadFileContents();
  }, [state.openFiles]);

  const getFileLanguage = (filePath: string): string => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'cpp': case 'c': case 'cc': case 'ino': return 'cpp';
      case 'h': case 'hpp': return 'cpp';
      case 'md': return 'markdown';
      case 'json': return 'json';
      case 'ini': return 'ini';
      case 'txt': return 'plaintext';
      default: return 'plaintext';
    }
  };

  const getFileIcon = (filePath: string) => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'cpp': case 'c': case 'cc': return '⚡';
      case 'h': case 'hpp': return '📋';
      case 'ino': return '🔧';
      case 'json': return '⚙️';
      case 'md': return '📖';
      case 'txt': return '📄';
      case 'ini': return '⚙️';
      default: return '📄';
    }
  };

  const saveFileContent = async (filePath: string, content: string) => {
    try {
      await window.electronAPI.fs.writeFile(filePath, content);
      console.log('File saved:', filePath);
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  const handleFileContentChange = (filePath: string, content: string) => {
    setFileContents(prev => ({
      ...prev,
      [filePath]: content
    }));
    
    // Handle auto-save based on settings
    const autoSaveMode = settings.general?.autoSave || 'off';
    
    if (autoSaveMode === 'afterDelay') {
      // Clear existing timer
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      
      // Set new timer (1 second delay)
      const timer = setTimeout(() => {
        saveFileContent(filePath, content);
      }, 1000);
      
      setAutoSaveTimer(timer);
    }
    // 'onFocusChange' mode is handled by window blur event
    // 'off' mode requires manual save (Ctrl+S)
  };

  // Handle save on focus change
  useEffect(() => {
    const handleBlur = () => {
      if (settings.general?.autoSave === 'onFocusChange' && state.activeFile) {
        const activeFile = state.openFiles.find(f => f.id === state.activeFile);
        if (activeFile && fileContents[activeFile.path]) {
          saveFileContent(activeFile.path, fileContents[activeFile.path]);
        }
      }
    };

    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('blur', handleBlur);
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [settings.general?.autoSave, state.activeFile, state.openFiles, fileContents, autoSaveTimer]);

  const handleNewFile = async () => {
    try {
      const result = await window.electronAPI?.dialog.showSaveDialog({
        title: '新規ファイルを保存',
        defaultPath: 'untitled.cpp',
        filters: [
          { name: 'C++ Files', extensions: ['cpp', 'c', 'h', 'hpp'] },
          { name: 'Arduino Sketch', extensions: ['ino'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result && !result.canceled && result.filePath) {
        const content = '// New file\n\nvoid setup() {\n  \n}\n\nvoid loop() {\n  \n}\n';
        await window.electronAPI?.fs.writeFile(result.filePath, content);
        console.log('File created:', result.filePath);
        // TODO: ファイルを開く処理
      }
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  };

  const handleOpenFolder = async () => {
    try {
      const result = await window.electronAPI?.dialog.showOpenDialog({
        title: 'フォルダを開く',
        properties: ['openDirectory']
      });

      if (result && !result.canceled && result.filePaths.length > 0) {
        console.log('Opening folder:', result.filePaths[0]);
        // TODO: フォルダ内のファイルをロード
      }
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  };

  if (state.openFiles.length === 0) {
    return (
      <div className="editor-area">
        <div className="editor-container">
          <div className="editor-welcome">
            <div className="welcome-content">
              <div className="welcome-icon">⚡</div>
              <h2>Tova IDEへようこそ</h2>
              <p>Arduinoとプラットフォーム開発のための統合環境</p>
              
              <div className="quick-actions">
                <button className="btn btn-primary" onClick={handleNewFile}>
                  New File
                </button>
                <button className="btn" onClick={handleOpenFolder}>
                  Open Folder
                </button>
              </div>
              
              <div className="shortcuts">
                <h3>ショートカットキー</h3>
                <div className="shortcut-list">
                  <div className="shortcut-item">
                    <span className="shortcut-key">Ctrl+N</span>
                    <span className="shortcut-desc">新規ファイル</span>
                  </div>
                  <div className="shortcut-item">
                    <span className="shortcut-key">Ctrl+O</span>
                    <span className="shortcut-desc">フォルダを開く</span>
                  </div>
                  <div className="shortcut-item">
                    <span className="shortcut-key">Ctrl+S</span>
                    <span className="shortcut-desc">保存</span>
                  </div>
                  <div className="shortcut-item">
                    <span className="shortcut-key">F7</span>
                    <span className="shortcut-desc">ビルド</span>
                  </div>
                  <div className="shortcut-item">
                    <span className="shortcut-key">F5</span>
                    <span className="shortcut-desc">アップロード</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-area">
      <div className="editor-tabs">
        {state.openFiles.map(file => {
          const fileName = file.name;
          const isActive = state.activeFile === file.id;
          
          return (
            <div 
              key={file.id}
              className={`editor-tab ${isActive ? 'active' : ''}`}
              onClick={() => setActiveFile(file.id)}
            >
              <span className="tab-icon">{getFileIcon(file.path)}</span>
              <span className="tab-name">{fileName}</span>
              <button 
                className="tab-close" 
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(file.id);
                }}
              >
                ×
              </button>
            </div>
          );
        })}
        <button className="new-tab-btn" onClick={handleNewFile}>+</button>
      </div>
      
      <div className="editor-container">
        {state.activeFile && (() => {
          const activeFile = state.openFiles.find(f => f.id === state.activeFile);
          if (!activeFile) return null;
          
          return (
            <AdvancedEditor
              key={activeFile.id}
              filePath={activeFile.path}
              value={fileContents[activeFile.path] || ''}
              onChange={(content: string) => handleFileContentChange(activeFile.path, content)}
              language={getFileLanguage(activeFile.path)}
            />
          );
        })()}
      </div>
    </div>
  );
};

export default EditorArea;
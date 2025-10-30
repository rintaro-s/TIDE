import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import { logger, toast } from '../../utils/logger';
import { joinPaths } from '../../utils/crossPlatformPath';
import './FileExplorer.css';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  expanded?: boolean;
}

interface FileExplorerProps {
  rootPath?: string;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ rootPath }) => {
  const { openFile, state, updateFileContent } = useApp();
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    node: FileNode | null;
  }>({ visible: false, x: 0, y: 0, node: null });

  const loadDirectory = useCallback(async (path?: string) => {
    const targetPath = path || state.currentProject?.path;
    
    if (!targetPath) {
      logger.info('No project path, clearing file tree');
      setFileTree([]);
      return;
    }

    setLoading(true);
    logger.info('Loading directory', { path: targetPath });

    try {
      // Check if electronAPI is available
      if (!window.electronAPI?.fs) {
        throw new Error('Electron API not available');
      }

      const exists = await window.electronAPI.fs.exists(targetPath);
      if (!exists) {
        logger.error('Directory does not exist', { path: targetPath });
        toast.error('ディレクトリが見つかりません', targetPath);
        setFileTree([]);
        setLoading(false);
        return;
      }

      const stat = await window.electronAPI.fs.stat(targetPath);
      if (!stat.isDirectory) {
        logger.error('Path is not a directory', { path: targetPath });
        toast.error('パスはディレクトリではありません', targetPath);
        setFileTree([]);
        setLoading(false);
        return;
      }

      const files = await window.electronAPI.fs.readdir(targetPath);
      logger.info('Directory contents loaded', { count: files.length });
      
      const nodes: FileNode[] = [];

      for (const file of files) {
        // Skip hidden files and common build artifacts
        if (file.startsWith('.') || file === 'node_modules' || file === 'build' || file === 'dist') {
          continue;
        }
        
        const filePath = joinPaths(targetPath, file);
        
        try {
          const fileStat = await window.electronAPI.fs.stat(filePath);
          
          nodes.push({
            name: file,
            path: filePath,
            type: fileStat.isDirectory ? 'folder' : 'file',
            children: fileStat.isDirectory ? [] : undefined,
            expanded: false
          });
        } catch (err) {
          logger.error('Failed to stat file', { file, error: err });
          // Continue with other files
        }
      }

      // Sort: folders first, then files
      nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      logger.success('File tree loaded', { nodes: nodes.length });
      setFileTree(nodes);
      toast.success('プロジェクトを読み込みました', `${nodes.length}個のファイル/フォルダ`);
    } catch (error) {
      logger.error('Failed to load directory', { error });
      toast.error('ディレクトリの読み込みに失敗', String(error));
      setFileTree([]);
    } finally {
      setLoading(false);
    }
  }, [state.currentProject?.path]);

  useEffect(() => {
    logger.info('FileExplorer: Project changed, reloading', { 
      path: state.currentProject?.path,
      name: state.currentProject?.name 
    });
    loadDirectory();
  }, [state.currentProject?.path, refreshKey]);

  const toggleFolder = async (node: FileNode) => {
    if (node.type !== 'folder') return;

    logger.info('Toggling folder', { name: node.name, expanded: node.expanded });

    // フォルダが未展開の場合、子要素をロード
    if (!node.expanded) {
      try {
        const files = await window.electronAPI.fs.readdir(node.path);
        const children: FileNode[] = [];

        for (const file of files) {
          if (file.startsWith('.') || file === 'node_modules') continue;
          
          const filePath = joinPaths(node.path, file);
          
          try {
            const fileStat = await window.electronAPI.fs.stat(filePath);
            
            children.push({
              name: file,
              path: filePath,
              type: fileStat.isDirectory ? 'folder' : 'file',
              children: fileStat.isDirectory ? [] : undefined,
              expanded: false
            });
          } catch (err) {
            logger.error('Failed to stat file in folder', { file, error: err });
          }
        }

        // Sort: folders first, then files
        children.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });

        node.children = children;
        logger.success('Folder contents loaded', { count: children.length });
      } catch (error) {
        logger.error('Failed to load folder', { error });
        toast.error('フォルダの読み込みに失敗', node.name);
        return;
      }
    }

    // 展開状態をトグル
    const updateNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(n => {
        if (n.path === node.path) {
          return { ...n, expanded: !n.expanded, children: node.children };
        }
        if (n.children) {
          return { ...n, children: updateNode(n.children) };
        }
        return n;
      });
    };
    
    setFileTree(updateNode(fileTree));
  };

  const handleFileClick = async (node: FileNode) => {
    if (node.type === 'file') {
      logger.info('Opening file', { name: node.name, path: node.path });
      
      try {
        // パスを正規化（Windowsのバックスラッシュに統一）
        const normalizedPath = node.path.replace(/\//g, '\\');
        
        // ファイルの内容を読み込む
        const content = await window.electronAPI.fs.readFile(normalizedPath);
        
        logger.success('File content loaded', { 
          name: node.name, 
          size: content.length 
        });
        
        const fileTab = {
          id: normalizedPath,
          name: node.name,
          path: normalizedPath,
          content: content,
          isDirty: false
        };
        
        openFile(fileTab);
        toast.success('ファイルを開きました', node.name);
      } catch (error) {
        logger.error('Failed to read file', { error, path: node.path });
        toast.error('ファイルの読み込みに失敗', node.name);
      }
    } else {
      toggleFolder(node);
    }
  };

  const handleRightClick = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      node: node
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, node: null });
  };

  const handleContextAction = async (action: string) => {
    if (!contextMenu.node && action !== 'newFile' && action !== 'newFolder') return;
    
    const node = contextMenu.node;
    const basePath = state.currentProject?.path || '';
    
    try {
      switch (action) {
        case 'open':
          if (node && node.type === 'file') {
            await handleFileClick(node);
          }
          break;
          
        case 'rename':
          if (!node) break;
          const result = await window.electronAPI.dialog.showInputBox({
            title: '名前を変更',
            message: '新しい名前を入力してください:',
            defaultValue: node.name
          });
          
          if (result && result !== node.name) {
            const newPath = node.path.replace(node.name, result);
            await window.electronAPI.fs.rename(node.path, newPath);
            logger.success('File renamed', { from: node.name, to: result });
            toast.success('名前を変更しました', `${node.name} → ${result}`);
            setRefreshKey(k => k + 1);
          }
          break;
          
        case 'delete':
          if (!node) break;
          if (confirm(`"${node.name}" を削除してもよろしいですか？`)) {
            if (node.type === 'folder') {
              await window.electronAPI.fs.rmdir(node.path);
            } else {
              await window.electronAPI.fs.unlink(node.path);
            }
            logger.success('File deleted', { name: node.name });
            toast.success('削除しました', node.name);
            setRefreshKey(k => k + 1);
          }
          break;
          
        case 'copy':
          if (!node) break;
          await navigator.clipboard.writeText(node.path);
          logger.info('Path copied to clipboard', { path: node.path });
          toast.info('パスをコピーしました', node.path);
          break;
          
        case 'newFile':
          const fileResult = await window.electronAPI.dialog.showInputBox({
            title: '新規ファイル',
            message: 'ファイル名を入力してください:',
            defaultValue: 'newfile.ino'
          });
          
          if (fileResult) {
            const parentPath = node?.type === 'folder' ? node.path : basePath;
            const newFilePath = joinPaths(parentPath, fileResult);
            await window.electronAPI.fs.writeFile(newFilePath, '// New file\n');
            logger.success('File created', { path: newFilePath });
            toast.success('ファイルを作成しました', fileResult);
            setRefreshKey(k => k + 1);
          }
          break;
          
        case 'newFolder':
          const folderResult = await window.electronAPI.dialog.showInputBox({
            title: '新規フォルダ',
            message: 'フォルダ名を入力してください:',
            defaultValue: 'newfolder'
          });
          
          if (folderResult) {
            const parentPath = node?.type === 'folder' ? node.path : basePath;
            const newFolderPath = joinPaths(parentPath, folderResult);
            await window.electronAPI.fs.mkdir(newFolderPath);
            logger.success('Folder created', { path: newFolderPath });
            toast.success('フォルダを作成しました', folderResult);
            setRefreshKey(k => k + 1);
          }
          break;
      }
    } catch (error) {
      logger.error('Context action failed', { action, error });
      toast.error('操作に失敗しました', String(error));
    }
    
    closeContextMenu();
  };

  const getFileIcon = (name: string, type: 'file' | 'folder', expanded?: boolean) => {
    if (type === 'folder') {
      return expanded ? '▼' : '▶';
    }
    
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'cpp': case 'c': case 'cc': return 'C++';
      case 'h': case 'hpp': return 'H';
      case 'ino': return 'INO';
      case 'json': return 'JSON';
      case 'md': return 'MD';
      case 'txt': return 'TXT';
      default: return 'FILE';
    }
  };

  const renderFileNode = (node: FileNode, level: number = 0): React.ReactElement => {
    const isActive = state.activeFile === node.path;
    const indent = level * 16;

    return (
      <div key={node.path}>
        <div 
          className={`file-item ${isActive ? 'active' : ''} ${node.type}`}
          style={{ paddingLeft: `${8 + indent}px` }}
          onClick={() => handleFileClick(node)}
          onContextMenu={(e) => handleRightClick(e, node)}
        >
          <span className="file-icon">
            {getFileIcon(node.name, node.type, node.expanded)}
          </span>
          <span className="file-name">{node.name}</span>
        </div>
        
        {node.type === 'folder' && node.expanded && node.children && (
          <div className="folder-contents">
            {node.children.map(child => renderFileNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const handleClick = () => closeContextMenu();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="file-explorer">
      <div className="explorer-header">
        <div className="section-title">Files</div>
        <div className="explorer-actions">
          <button 
            className="action-btn" 
            title="新規ファイル" 
            onClick={() => handleContextAction('newFile')}
            disabled={!state.currentProject}
          >
            +F
          </button>
          <button 
            className="action-btn" 
            title="新規フォルダ" 
            onClick={() => handleContextAction('newFolder')}
            disabled={!state.currentProject}
          >
            +D
          </button>
          <button 
            className="action-btn" 
            title="更新" 
            onClick={() => setRefreshKey(k => k + 1)}
            disabled={!state.currentProject || loading}
          >
            R
          </button>
        </div>
      </div>
      
      {loading && (
        <div className="explorer-loading">
          <div className="loading-spinner"></div>
          <p>読み込み中...</p>
        </div>
      )}
      
      {!loading && !state.currentProject && (
        <div className="explorer-empty">
          <p>プロジェクトが開かれていません</p>
          <p className="hint">プロジェクトを開いてください</p>
        </div>
      )}
      
      {!loading && state.currentProject && fileTree.length === 0 && (
        <div className="explorer-empty">
          <p>フォルダは空です</p>
        </div>
      )}
      
      <div className="file-tree">
        {fileTree.map(node => renderFileNode(node))}
      </div>
      
      {contextMenu.visible && (
        <div 
          className="context-menu"
          style={{ 
            left: contextMenu.x, 
            top: contextMenu.y,
            position: 'fixed',
            zIndex: 10000 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.node?.type === 'file' && (
            <div className="context-item" onClick={() => handleContextAction('open')}>
              Open
            </div>
          )}
          <div className="context-item" onClick={() => handleContextAction('rename')}>
            Rename
          </div>
          <div className="context-item" onClick={() => handleContextAction('copy')}>
            Copy Path
          </div>
          <div className="context-separator"></div>
          {contextMenu.node?.type === 'folder' && (
            <>
              <div className="context-item" onClick={() => handleContextAction('newFile')}>
                New File
              </div>
              <div className="context-item" onClick={() => handleContextAction('newFolder')}>
                New Folder
              </div>
              <div className="context-separator"></div>
            </>
          )}
          <div className="context-item delete" onClick={() => handleContextAction('delete')}>
            Delete
          </div>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;
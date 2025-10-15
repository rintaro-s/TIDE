import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
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
  const { openFile, state } = useApp();
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    node: FileNode | null;
  }>({ visible: false, x: 0, y: 0, node: null });

  const loadDirectory = async (path?: string) => {
    const targetPath = path || state.currentProject?.path;
    if (!targetPath) {
      setFileTree([]);
      return;
    }

    try {
      const exists = await window.electronAPI.fs.exists(targetPath);
      if (!exists) {
        setFileTree([]);
        return;
      }

      const stat = await window.electronAPI.fs.stat(targetPath);
      if (!stat.isDirectory()) {
        setFileTree([]);
        return;
      }

      const files = await window.electronAPI.fs.readdir(targetPath);
      const nodes: FileNode[] = [];

      for (const file of files) {
        if (file.startsWith('.')) continue; // Skip hidden files
        
        const filePath = targetPath + '/' + file;
        const fileStat = await window.electronAPI.fs.stat(filePath);
        
        nodes.push({
          name: file,
          path: filePath,
          type: fileStat.isDirectory() ? 'folder' : 'file',
          children: fileStat.isDirectory() ? [] : undefined,
          expanded: false
        });
      }

      // Sort: folders first, then files
      nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      setFileTree(nodes);
    } catch (error) {
      console.error('Failed to load directory:', error);
      setFileTree([]);
    }
  };

  useEffect(() => {
    loadDirectory();
  }, [state.currentProject]);

  const toggleFolder = async (node: FileNode) => {
    if (node.type !== 'folder') return;

    // フォルダが未展開の場合、子要素をロード
    if (!node.expanded) {
      try {
        const files = await window.electronAPI.fs.readdir(node.path);
        const children: FileNode[] = [];

        for (const file of files) {
          if (file.startsWith('.')) continue;
          
          const filePath = `${node.path}/${file}`;
          const fileStat = await window.electronAPI.fs.stat(filePath);
          
          children.push({
            name: file,
            path: filePath,
            type: fileStat.isDirectory() ? 'folder' : 'file',
            children: fileStat.isDirectory() ? [] : undefined,
            expanded: false
          });
        }

        // Sort: folders first, then files
        children.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });

        node.children = children;
      } catch (error) {
        console.error('Failed to load folder:', error);
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
      try {
        // ファイルの内容を読み込む
        const content = await window.electronAPI.fs.readFile(node.path);
        
        const fileTab = {
          id: node.path,
          name: node.name,
          path: node.path,
          content: content,
          isDirty: false
        };
        openFile(fileTab);
      } catch (error) {
        console.error('Failed to read file:', error);
        // エラーでも空のファイルとして開く
        const fileTab = {
          id: node.path,
          name: node.name,
          path: node.path,
          content: '',
          isDirty: false
        };
        openFile(fileTab);
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
    if (!contextMenu.node) return;
    
    const node = contextMenu.node;
    
    switch (action) {
      case 'open':
        if (node.type === 'file') {
          await handleFileClick(node);
        }
        break;
        
      case 'rename':
        try {
          const result = await window.electronAPI.dialog.showInputBox({
            title: '名前を変更',
            message: '新しい名前を入力してください:',
            defaultValue: node.name
          });
          
          if (result && result !== node.name) {
            const newPath = node.path.replace(node.name, result);
            await window.electronAPI.fs.rename(node.path, newPath);
            // ファイルツリーを再読み込み
            window.location.reload();
          }
        } catch (error) {
          console.error('Failed to rename:', error);
          alert('名前の変更に失敗しました: ' + error);
        }
        break;
        
      case 'delete':
        if (confirm(`"${node.name}" を削除してもよろしいですか？`)) {
          try {
            if (node.type === 'folder') {
              await window.electronAPI.fs.rmdir(node.path);
            } else {
              await window.electronAPI.fs.unlink(node.path);
            }
            // ファイルツリーを再読み込み
            window.location.reload();
          } catch (error) {
            console.error('Failed to delete:', error);
            alert('削除に失敗しました: ' + error);
          }
        }
        break;
        
      case 'copy':
        try {
          await navigator.clipboard.writeText(node.path);
          console.log('Path copied to clipboard:', node.path);
        } catch (error) {
          console.error('Failed to copy path:', error);
        }
        break;
        
      case 'newFile':
        try {
          const parentPath = node.type === 'folder' ? node.path : node.path.substring(0, node.path.lastIndexOf('/'));
          const result = await window.electronAPI.dialog.showInputBox({
            title: '新規ファイル',
            message: 'ファイル名を入力してください:',
            defaultValue: 'newfile.cpp'
          });
          
          if (result) {
            const newFilePath = `${parentPath}/${result}`;
            await window.electronAPI.fs.writeFile(newFilePath, '');
            // ファイルツリーを再読み込み
            window.location.reload();
          }
        } catch (error) {
          console.error('Failed to create file:', error);
          alert('ファイルの作成に失敗しました: ' + error);
        }
        break;
        
      case 'newFolder':
        try {
          const parentPath = node.type === 'folder' ? node.path : node.path.substring(0, node.path.lastIndexOf('/'));
          const result = await window.electronAPI.dialog.showInputBox({
            title: '新規フォルダ',
            message: 'フォルダ名を入力してください:',
            defaultValue: 'newfolder'
          });
          
          if (result) {
            const newFolderPath = `${parentPath}/${result}`;
            await window.electronAPI.fs.mkdir(newFolderPath);
            // ファイルツリーを再読み込み
            window.location.reload();
          }
        } catch (error) {
          console.error('Failed to create folder:', error);
          alert('フォルダの作成に失敗しました: ' + error);
        }
        break;
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
        <div className="section-title">エクスプローラー</div>
        <div className="explorer-actions">
          <button className="action-btn" title="新規ファイル" onClick={() => handleContextAction('newFile')}>
            +F
          </button>
          <button className="action-btn" title="新規フォルダ" onClick={() => handleContextAction('newFolder')}>
            +D
          </button>
          <button className="action-btn" title="更新" onClick={() => loadDirectory()}>
            R
          </button>
        </div>
      </div>
      
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
            zIndex: 1000 
          }}
        >
          {contextMenu.node?.type === 'file' && (
            <div className="context-item" onClick={() => handleContextAction('open')}>
              開く
            </div>
          )}
          <div className="context-item" onClick={() => handleContextAction('rename')}>
            名前を変更
          </div>
          <div className="context-item" onClick={() => handleContextAction('copy')}>
            コピー
          </div>
          <div className="context-separator"></div>
          {contextMenu.node?.type === 'folder' && (
            <>
              <div className="context-item" onClick={() => handleContextAction('newFile')}>
                新規ファイル
              </div>
              <div className="context-item" onClick={() => handleContextAction('newFolder')}>
                新規フォルダ
              </div>
              <div className="context-separator"></div>
            </>
          )}
          <div className="context-item delete" onClick={() => handleContextAction('delete')}>
            削除
          </div>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;
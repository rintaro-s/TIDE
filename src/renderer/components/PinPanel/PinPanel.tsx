import React, { useState, useEffect } from 'react';
import './PinPanel.css';

interface PinnedItem {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'command' | 'url';
  path: string;
  icon: string;
  description?: string;
}

const PinPanel: React.FC = () => {
  const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState<Partial<PinnedItem>>({
    name: '',
    type: 'file',
    path: '',
    icon: '📄'
  });

  useEffect(() => {
    loadPinnedItems();
  }, []);

  const loadPinnedItems = async () => {
    try {
      const items = await window.electronAPI.store.get('pinnedItems') || [];
      setPinnedItems(items);
    } catch (error) {
      console.error('Failed to load pinned items:', error);
    }
  };

  const savePinnedItems = async (items: PinnedItem[]) => {
    try {
      await window.electronAPI.store.set('pinnedItems', items);
      setPinnedItems(items);
    } catch (error) {
      console.error('Failed to save pinned items:', error);
    }
  };

  const addPinnedItem = () => {
    if (!newItem.name || !newItem.path) return;

    const item: PinnedItem = {
      id: Date.now().toString(),
      name: newItem.name!,
      type: newItem.type as PinnedItem['type'],
      path: newItem.path!,
      icon: newItem.icon || getDefaultIcon(newItem.type as PinnedItem['type']),
      description: newItem.description
    };

    const updatedItems = [...pinnedItems, item];
    savePinnedItems(updatedItems);
    
    setNewItem({ name: '', type: 'file', path: '', icon: '📄' });
    setIsAddingItem(false);
  };

  const removePinnedItem = (id: string) => {
    const updatedItems = pinnedItems.filter(item => item.id !== id);
    savePinnedItems(updatedItems);
  };

  const openPinnedItem = async (item: PinnedItem) => {
    try {
      switch (item.type) {
        case 'file':
          // Open file in editor
          break;
        case 'folder':
          await window.electronAPI.showItemInFolder(item.path);
          break;
        case 'url':
          await window.electronAPI.openExternal(item.path);
          break;
        case 'command':
          // Execute command
          await window.electronAPI.process.exec(item.path, [], {});
          break;
      }
    } catch (error) {
      console.error('Failed to open pinned item:', error);
    }
  };

  const getDefaultIcon = (type: PinnedItem['type']): string => {
    switch (type) {
      case 'file': return '📄';
      case 'folder': return '📁';
      case 'command': return '⚡';
      case 'url': return '🌐';
      default: return '📌';
    }
  };

  return (
    <div className="pin-panel">
      <div className="pin-header">
        <h4>Pinned Items</h4>
        <button 
          className="add-pin-btn"
          onClick={() => setIsAddingItem(true)}
          title="Add Pin"
        >
          +
        </button>
      </div>

      {isAddingItem && (
        <div className="add-pin-form">
          <input
            type="text"
            placeholder="Name"
            value={newItem.name || ''}
            onChange={(e) => setNewItem({...newItem, name: e.target.value})}
            className="pin-input"
          />
          <select
            value={newItem.type || 'file'}
            onChange={(e) => setNewItem({...newItem, type: e.target.value as PinnedItem['type']})}
            className="pin-select"
          >
            <option value="file">File</option>
            <option value="folder">Folder</option>
            <option value="command">Command</option>
            <option value="url">URL</option>
          </select>
          <input
            type="text"
            placeholder="Path/URL/Command"
            value={newItem.path || ''}
            onChange={(e) => setNewItem({...newItem, path: e.target.value})}
            className="pin-input"
          />
          <input
            type="text"
            placeholder="Icon (emoji)"
            value={newItem.icon || ''}
            onChange={(e) => setNewItem({...newItem, icon: e.target.value})}
            className="pin-input"
          />
          <div className="pin-form-actions">
            <button className="pin-save-btn" onClick={addPinnedItem}>Save</button>
            <button className="pin-cancel-btn" onClick={() => setIsAddingItem(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="pin-list">
        {pinnedItems.length === 0 ? (
          <div className="pin-empty">
            <p>No pinned items</p>
            <p>Click + to add frequently used files, folders, or commands</p>
          </div>
        ) : (
          pinnedItems.map(item => (
            <div key={item.id} className="pin-item">
              <div className="pin-content" onClick={() => openPinnedItem(item)}>
                <span className="pin-icon">{item.icon}</span>
                <div className="pin-details">
                  <span className="pin-name">{item.name}</span>
                  <span className="pin-type">{item.type}</span>
                  {item.description && (
                    <span className="pin-description">{item.description}</span>
                  )}
                </div>
              </div>
              <button 
                className="pin-remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  removePinnedItem(item.id);
                }}
                title="Remove Pin"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      <div className="pin-quick-actions">
        <h5>Quick Actions</h5>
        <div className="quick-action-grid">
          <button 
            className="quick-action-btn"
            onClick={() => setNewItem({...newItem, name: 'Arduino CLI', type: 'command', path: 'arduino-cli', icon: '🔧'})}
          >
            🔧 Arduino CLI
          </button>
          <button 
            className="quick-action-btn"
            onClick={() => setNewItem({...newItem, name: 'PlatformIO', type: 'command', path: 'pio', icon: '⚙️'})}
          >
            ⚙️ PlatformIO
          </button>
          <button 
            className="quick-action-btn"
            onClick={() => setNewItem({...newItem, name: 'Serial Monitor', type: 'command', path: 'arduino-cli monitor', icon: '📡'})}
          >
            📡 Serial Mon
          </button>
          <button 
            className="quick-action-btn"
            onClick={() => setNewItem({...newItem, name: 'Project Docs', type: 'folder', path: './docs', icon: '📚'})}
          >
            📚 Docs
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinPanel;
import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import arduinoService, { ArduinoCLIService, ArduinoBoard, ArduinoPort } from '../../services/ArduinoService';
import platformioService, { PlatformIOService, PlatformIOBoard } from '../../services/PlatformIOService';
import './QuickBuildPanel.css';

interface QuickBuildPanelProps {
  isExpanded: boolean;
}

const QuickBuildPanel: React.FC<QuickBuildPanelProps> = ({ isExpanded }) => {
  const { state } = useApp();
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [availableBoards, setAvailableBoards] = useState<(ArduinoBoard | PlatformIOBoard)[]>([]);
  const [availablePorts, setAvailablePorts] = useState<ArduinoPort[]>([]);
  const [recentBoards, setRecentBoards] = useState<string[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildStatus, setBuildStatus] = useState<'idle' | 'compiling' | 'uploading' | 'success' | 'error'>('idle');
  const [boardSearchTerm, setBoardSearchTerm] = useState('');
  const [showBoardSearch, setShowBoardSearch] = useState(false);
  
  const arduinoService = ArduinoCLIService.getInstance();
  const platformioService = PlatformIOService.getInstance();

  useEffect(() => {
    loadBoardsAndPorts();
    loadRecentBoards();
  }, [state.mode, state.currentProject]);

  const loadBoardsAndPorts = async () => {
    if (!state.mode) return;

    try {
      let boards: (ArduinoBoard | PlatformIOBoard)[] = [];
      let ports: ArduinoPort[] = [];

      if (state.mode === 'arduino') {
        const installed = await arduinoService.checkInstallation();
        if (installed) {
          boards = await arduinoService.listBoards();
          ports = await arduinoService.listPorts();
        }
      } else if (state.mode === 'platformio') {
        const installed = await platformioService.checkInstallation();
        if (installed) {
          boards = await platformioService.listAllBoards();
          // ports = await platformioService.listDevices();
        }
      }

      setAvailableBoards(boards);
      setAvailablePorts(ports);

      // Auto-select first available if none selected
      if (boards.length > 0 && !selectedBoard) {
        const boardId = 'id' in boards[0] ? boards[0].id : boards[0].fqbn;
        setSelectedBoard(boardId);
      }
      if (ports.length > 0 && !selectedPort) {
        setSelectedPort(ports[0].address);
      }
    } catch (error) {
      console.error('Failed to load boards and ports:', error);
    }
  };

  const loadRecentBoards = async () => {
    try {
      const recent = await window.electronAPI?.store.get('recentBoards') || [];
      setRecentBoards(recent.slice(0, 5));
    } catch (error) {
      console.error('Failed to load recent boards:', error);
    }
  };

  const saveRecentBoard = async (boardId: string) => {
    try {
      const recent = await window.electronAPI?.store.get('recentBoards') || [];
      const updated = [boardId, ...recent.filter((id: string) => id !== boardId)].slice(0, 10);
      await window.electronAPI?.store.set('recentBoards', updated);
      setRecentBoards(updated.slice(0, 5));
    } catch (error) {
      console.error('Failed to save recent board:', error);
    }
  };

  const handleQuickCompile = async () => {
    if (!state.currentProject || !selectedBoard || isBuilding) return;

    setIsBuilding(true);
    setBuildStatus('compiling');
    
    try {
      let success = false;
      
      if (state.mode === 'arduino') {
        const result = await arduinoService.compile(state.currentProject.path, selectedBoard);
        success = result.success;
      } else {
        const result = await platformioService.compile(state.currentProject.path);
        success = result.success;
      }
      
      setBuildStatus(success ? 'success' : 'error');
      await saveRecentBoard(selectedBoard);
      
      // Cache compiled result for quick upload
      if (success) {
        await window.electronAPI?.store.set('lastCompiledProject', {
          projectPath: state.currentProject.path,
          board: selectedBoard,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      setBuildStatus('error');
    } finally {
      setIsBuilding(false);
      setTimeout(() => setBuildStatus('idle'), 2000);
    }
  };

  const handleQuickUpload = async () => {
    if (!state.currentProject || !selectedBoard || !selectedPort || isBuilding) return;

    setIsBuilding(true);
    setBuildStatus('uploading');
    
    try {
      // Check if we have a cached compile for this project
      const lastCompiled = await window.electronAPI?.store.get('lastCompiledProject');
      const needsCompile = !lastCompiled || 
        lastCompiled.projectPath !== state.currentProject.path ||
        lastCompiled.board !== selectedBoard ||
        (Date.now() - lastCompiled.timestamp) > 300000; // 5 minutes

      if (needsCompile) {
        setBuildStatus('compiling');
        await handleQuickCompile();
      }

      setBuildStatus('uploading');
      
      let success = false;
      if (state.mode === 'arduino') {
        const result = await arduinoService.upload(state.currentProject.path, selectedBoard, selectedPort);
        success = result.success;
      } else {
        const result = await platformioService.upload(state.currentProject.path);
        success = result.success;
      }
      
      setBuildStatus(success ? 'success' : 'error');
      await saveRecentBoard(selectedBoard);
    } catch (error) {
      setBuildStatus('error');
    } finally {
      setIsBuilding(false);
      setTimeout(() => setBuildStatus('idle'), 2000);
    }
  };

  const refreshPorts = async () => {
    try {
      let ports: ArduinoPort[] = [];
      if (state.mode === 'arduino') {
        ports = await arduinoService.listPorts();
      }
      setAvailablePorts(ports);
    } catch (error) {
      console.error('Failed to refresh ports:', error);
    }
  };

  const filteredBoards = availableBoards.filter(board => {
    const name = board.name.toLowerCase();
    const platform = ('platform' in board ? board.platform : '').toLowerCase();
    return name.includes(boardSearchTerm.toLowerCase()) || platform.includes(boardSearchTerm.toLowerCase());
  });

  const getStatusIcon = () => {
    switch (buildStatus) {
      case 'compiling': return '🔨';
      case 'uploading': return '📤';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⚡';
    }
  };

  const getStatusText = () => {
    switch (buildStatus) {
      case 'compiling': return 'Compiling...';
      case 'uploading': return 'Uploading...';
      case 'success': return 'Success!';
      case 'error': return 'Failed';
      default: return 'Ready';
    }
  };

  if (!isExpanded) {
    // Collapsed view - show only essential buttons
    return (
      <div className="quick-build-panel collapsed">
        <div className="quick-actions">
          <button 
            className={`quick-btn compile-btn ${buildStatus}`}
            onClick={handleQuickCompile}
            disabled={!state.currentProject || !selectedBoard || isBuilding}
            title="Quick Compile (F7)"
          >
            {getStatusIcon()}
          </button>
          <button 
            className={`quick-btn upload-btn ${buildStatus}`}
            onClick={handleQuickUpload}
            disabled={!state.currentProject || !selectedBoard || !selectedPort || isBuilding}
            title="Compile & Upload (F5)"
          >
            📤
          </button>
        </div>
      </div>
    );
  }

  // Expanded view - show full interface
  return (
    <div className="quick-build-panel expanded">
      <div className="panel-header">
        <h3>⚡ Quick Build</h3>
        <div className="status-indicator">
          <span className={`status-dot ${buildStatus}`}></span>
          <span className="status-text">{getStatusText()}</span>
        </div>
      </div>

      {!state.currentProject ? (
        <div className="no-project">
          <p>📁 No project opened</p>
          <small>Open or create a project to enable build features</small>
        </div>
      ) : (
        <>
          <div className="board-selection">
            <div className="section-header">
              <label>🎯 Target Board</label>
              <button 
                className="search-toggle"
                onClick={() => setShowBoardSearch(!showBoardSearch)}
                title="Search boards"
              >
                🔍
              </button>
            </div>

            {showBoardSearch && (
              <input
                type="text"
                className="board-search"
                placeholder="Search boards..."
                value={boardSearchTerm}
                onChange={(e) => setBoardSearchTerm(e.target.value)}
              />
            )}

            <select
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value)}
              className="board-select"
            >
              <option value="">Select board...</option>
              {recentBoards.length > 0 && (
                <optgroup label="Recently Used">
                  {recentBoards.map(boardId => {
                    const board = availableBoards.find(b => 
                      ('id' in b ? b.id : b.fqbn) === boardId
                    );
                    return board ? (
                      <option key={boardId} value={boardId}>
                        ⭐ {board.name}
                      </option>
                    ) : null;
                  })}
                </optgroup>
              )}
              <optgroup label="Available Boards">
                {filteredBoards.map(board => {
                  const boardId = 'id' in board ? board.id : board.fqbn;
                  return (
                    <option key={boardId} value={boardId}>
                      {board.name}
                    </option>
                  );
                })}
              </optgroup>
            </select>
          </div>

          <div className="port-selection">
            <div className="section-header">
              <label>🔌 Serial Port</label>
              <button 
                className="refresh-btn"
                onClick={refreshPorts}
                title="Refresh ports"
              >
                🔄
              </button>
            </div>
            <select
              value={selectedPort}
              onChange={(e) => setSelectedPort(e.target.value)}
              className="port-select"
            >
              <option value="">Select port...</option>
              {availablePorts.map(port => (
                <option key={port.address} value={port.address}>
                  {port.address} ({port.label || 'Unknown'})
                </option>
              ))}
            </select>
          </div>

          <div className="build-actions">
            <button 
              className={`action-btn compile-only ${buildStatus}`}
              onClick={handleQuickCompile}
              disabled={!selectedBoard || isBuilding}
            >
              🔨 Compile
            </button>
            
            <button 
              className={`action-btn compile-upload ${buildStatus}`}
              onClick={handleQuickUpload}
              disabled={!selectedBoard || !selectedPort || isBuilding}
            >
              ⚡ Compile & Upload
            </button>
          </div>

          {isBuilding && (
            <div className="build-progress">
              <div className="progress-bar">
                <div className="progress-fill animating"></div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QuickBuildPanel;
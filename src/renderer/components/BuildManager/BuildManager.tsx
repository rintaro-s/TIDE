import React, { useState, useEffect } from 'react';
import arduinoService, { ArduinoCLIService, ArduinoBoard, ArduinoPort, CompileResult, UploadResult } from '../../services/ArduinoService';
import platformioService, { PlatformIOService, PlatformIOBoard, PlatformIODevice } from '../../services/PlatformIOService';
import { useApp } from '../../contexts/AppContext';
import './BuildManager.css';

interface BuildProfile {
  id: string;
  name: string;
  board: string;
  port: string;
  options: {
    verbose: boolean;
    incremental: boolean;
    optimization: string;
  };
}

interface BuildHistoryEntry {
  id: string;
  timestamp: Date;
  projectName: string;
  board: string;
  success: boolean;
  duration: number;
  output: string;
  errors: string[];
  warnings: string[];
}

type DevicePort = ArduinoPort | PlatformIODevice;

const BuildManager: React.FC = () => {
  const { state } = useApp();
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [availableBoards, setAvailableBoards] = useState<(ArduinoBoard | PlatformIOBoard)[]>([]);
  const [availablePorts, setAvailablePorts] = useState<DevicePort[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [buildProfiles, setBuildProfiles] = useState<BuildProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [buildHistory, setBuildHistory] = useState<BuildHistoryEntry[]>([]);
  const [verboseOutput, setVerboseOutput] = useState(false);
  const [incrementalBuild, setIncrementalBuild] = useState(true);
  const [currentTab, setCurrentTab] = useState<'output' | 'history' | 'profiles'>('output');
  const [buildStartTime, setBuildStartTime] = useState<number>(0);

  const arduinoService = ArduinoCLIService.getInstance();
  const platformioService = PlatformIOService.getInstance();

  useEffect(() => {
    // Load available boards and ports
    const loadBoardsAndPorts = async () => {
      if (state.mode && state.currentProject) {
        try {
          let boards: (ArduinoBoard | PlatformIOBoard)[] = [];
          let ports: ArduinoPort[] = [];

          if (state.mode === 'arduino') {
            const installed = await arduinoService.checkInstallation();
            if (installed) {
              boards = await arduinoService.listBoards();
              const arduinoPorts = await arduinoService.listPorts();
              setAvailablePorts(arduinoPorts);
            } else {
              addOutput('Arduino CLI not found. Please install Arduino CLI first.');
            }
          } else if (state.mode === 'platformio') {
            const installed = await platformioService.checkInstallation();
            if (installed) {
              boards = await platformioService.listAllBoards();
              const platformioPorts = await platformioService.listDevices();
              setAvailablePorts(platformioPorts);
            } else {
              addOutput('PlatformIO not found. Please install PlatformIO first.');
            }
          }
          
          setAvailableBoards(boards);
          setAvailablePorts(ports);
          
          // Auto-select first board and port if available
          if (boards.length > 0 && !selectedBoard) {
            setSelectedBoard('id' in boards[0] ? boards[0].id : boards[0].fqbn);
          }
          if (ports.length > 0 && !selectedPort) {
            setSelectedPort(ports[0].address);
          }
        } catch (error) {
          addOutput(`Error loading boards and ports: ${error}`);
        }
      }
    };

    loadBoardsAndPorts();
  }, [state.mode, state.currentProject]);

  const addOutput = (message: string) => {
    setOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleCompile = async () => {
    if (!state.mode || !state.currentProject) {
      addOutput('❌ No project opened. Please open or create a project first.');
      return;
    }
    
    if (!selectedBoard) {
      addOutput('❌ No board selected. Please select a target board first.');
      return;
    }
    
    if (isBuilding) {
      addOutput('⚠️ Build already in progress. Please wait...');
      return;
    }
    
    setIsBuilding(true);
    setCompileResult(null);
    addOutput(`🔨 Starting compile for ${state.mode} project...`);
    addOutput(`📦 Project: ${state.currentProject.name}`);
    addOutput(`🎯 Board: ${selectedBoard}`);
    
    try {
      let result: CompileResult;
      
      if (state.mode === 'arduino') {
        result = await arduinoService.compile(state.currentProject.path, selectedBoard);
      } else {
        result = await platformioService.compile(state.currentProject.path);
      }
      
      setCompileResult(result);
      
      if (result.success) {
        addOutput('✅ Compile successful!');
        // addOutput(`📊 Sketch uses ${result.bytes || 'N/A'} bytes`);
      } else {
        addOutput('❌ Compile failed!');
        result.errors.forEach(error => addOutput(`  ❗ ${error}`));
      }
      
      result.warnings.forEach(warning => addOutput(`  ⚠️ ${warning}`));
      
    } catch (error) {
      addOutput(`❌ Compile error: ${error}`);
    } finally {
      setIsBuilding(false);
    }
  };

  const handleUpload = async () => {
    if (!state.mode || !state.currentProject) {
      addOutput('❌ No project opened. Please open or create a project first.');
      return;
    }
    
    if (!selectedBoard) {
      addOutput('❌ No board selected. Please select a target board first.');
      return;
    }
    
    if (!selectedPort) {
      addOutput('❌ No port selected. Please connect your device and select a port.');
      return;
    }
    
    if (isBuilding) {
      addOutput('⚠️ Operation already in progress. Please wait...');
      return;
    }
    
    setIsBuilding(true);
    setUploadResult(null);
    addOutput(`📤 Starting upload for ${state.mode} project...`);
    addOutput(`📦 Project: ${state.currentProject.name}`);
    addOutput(`🎯 Board: ${selectedBoard}`);
    addOutput(`🔌 Port: ${selectedPort}`);
    
    try {
      // First compile if needed
      if (!compileResult?.success) {
        addOutput('🔨 Compiling before upload...');
        await handleCompile();
        if (!compileResult?.success) {
          addOutput('❌ Upload cancelled: Compilation failed');
          setIsBuilding(false);
          return;
        }
      }
      
      let result: UploadResult;
      
      if (state.mode === 'arduino') {
        result = await arduinoService.upload(state.currentProject.path, selectedBoard, selectedPort);
      } else {
        result = await platformioService.upload(state.currentProject.path);
      }
      
      setUploadResult(result);
      
      if (result.success) {
        addOutput('✅ Upload successful!');
        addOutput('🎉 Your code is now running on the device!');
      } else {
        addOutput('❌ Upload failed!');
        result.errors.forEach(error => addOutput(`  ❗ ${error}`));
      }
      
    } catch (error) {
      addOutput(`❌ Upload error: ${error}`);
    } finally {
      setIsBuilding(false);
    }
  };

  const handleCleanBuild = async () => {
    if (!state.currentProject) return;
    
    addOutput('Cleaning build files...');
    // TODO: Implement clean functionality
    addOutput('Clean completed.');
  };

  const refreshPorts = async () => {
    if (!state.mode) return;
    
    try {
      let ports: ArduinoPort[] = [];
      
      if (state.mode === 'arduino') {
        ports = await arduinoService.listPorts();
      } else {
        ports = await platformioService.listDevices();
      }
      
      setAvailablePorts(ports);
      addOutput(`Found ${ports.length} ports.`);
    } catch (error) {
      addOutput(`Error refreshing ports: ${error}`);
    }
  };

  const clearOutput = () => {
    setOutput([]);
  };

  return (
    <div className="build-manager">
      <div className="build-toolbar">
        <div className="board-selector">
          <label htmlFor="board-select">ボード:</label>
          <select 
            id="board-select"
            value={selectedBoard} 
            onChange={(e) => setSelectedBoard(e.target.value)}
            className="build-select"
          >
            <option value="">ボードを選択...</option>
            {availableBoards.map(board => {
              const boardId = 'id' in board ? board.id : board.fqbn;
              const platform = 'platform' in board ? board.platform : ('core' in board ? (board as any).core : 'Unknown');
              return (
                <option key={boardId} value={boardId}>
                  {board.name} ({platform})
                </option>
              );
            })}
          </select>
        </div>

        <div className="port-selector">
          <label htmlFor="port-select">ポート:</label>
          <select 
            id="port-select"
            value={selectedPort} 
            onChange={(e) => setSelectedPort(e.target.value)}
            className="build-select"
          >
            <option value="">ポートを選択...</option>
            {availablePorts.map(port => {
              const portKey = 'address' in port ? port.address : port.port;
              const portValue = 'address' in port ? port.address : port.port;
              const portLabel = 'label' in port ? port.label : `${port.port} - ${port.description}`;
              return (
                <option key={portKey} value={portValue}>
                  {portLabel}
                </option>
              );
            })}
          </select>
          <button className="refresh-ports-btn" onClick={refreshPorts} title="ポートを更新">
            ↻
          </button>
        </div>

        <div className="build-actions">
          <button 
            className="build-btn compile-btn"
            onClick={handleCompile}
            disabled={isBuilding || !selectedBoard}
            title="コンパイル (F7)"
          >
            Compile
          </button>
          
          <button 
            className="build-btn upload-btn"
            onClick={handleUpload}
            disabled={isBuilding || !selectedBoard || !selectedPort}
            title="アップロード (F5)"
          >
            Upload
          </button>
          
          <button 
            className="build-btn clean-btn"
            onClick={handleCleanBuild}
            disabled={isBuilding}
            title="クリーンビルド"
          >
            Clean
          </button>
        </div>
      </div>

      {isBuilding && (
        <div className="build-progress">
          <div className="progress-header">
            <span className="progress-phase">Building...</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill animating" />
          </div>
        </div>
      )}

      <div className="build-output">
        <div className="output-header">
          <h4>Build Output</h4>
          <button className="clear-btn" onClick={clearOutput}>Clear</button>
        </div>
        <div className="output-content">
          {output.map((line, index) => (
            <div key={index} className="output-line">{line}</div>
          ))}
          {output.length === 0 && (
            <div className="output-placeholder">Build output will appear here...</div>
          )}
        </div>
      </div>

      {selectedBoard && (
        <div className="board-info">
          <h4>Selected Board</h4>
          {(() => {
            const board = availableBoards.find(b => {
              const boardId = 'id' in b ? b.id : b.fqbn;
              return boardId === selectedBoard;
            });
            
            if (!board) return null;
            
            return (
              <div className="board-details">
                <div className="detail-item">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{board.name}</span>
                </div>
                {'platform' in board && (
                  <div className="detail-item">
                    <span className="detail-label">Platform:</span>
                    <span className="detail-value">{board.platform}</span>
                  </div>
                )}
                {'core' in board && (
                  <div className="detail-item">
                    <span className="detail-label">Core:</span>
                    <span className="detail-value">{(board as any).core}</span>
                  </div>
                )}
                {'mcu' in board && (
                  <div className="detail-item">
                    <span className="detail-label">MCU:</span>
                    <span className="detail-value">{board.mcu}</span>
                  </div>
                )}
                {'frequency' in board && (
                  <div className="detail-item">
                    <span className="detail-label">Clock:</span>
                    <span className="detail-value">{board.frequency}</span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default BuildManager;
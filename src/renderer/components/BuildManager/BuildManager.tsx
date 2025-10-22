import React, { useState, useEffect } from 'react';
import arduinoService, { ArduinoCLIService, ArduinoBoard, ArduinoPort, CompileResult, UploadResult } from '../../services/ArduinoService';
import platformioService, { PlatformIOService, PlatformIOBoard, PlatformIODevice } from '../../services/PlatformIOService';
import { useApp } from '../../contexts/AppContext';
import './BuildManager.css';

interface BuildProfile {
  id: string;
  name: string;
  description: string;
  board: string;
  port: string;
  options: {
    verbose: boolean;
    incremental: boolean;
    optimization: 'none' | 'size' | 'speed' | 'debug';
    warnings: 'none' | 'basic' | 'all';
    uploadSpeed: string;
    customFlags: string;
  };
  preset: boolean;
  createdAt: Date;
  lastUsed?: Date;
}

interface BuildPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  settings: BuildProfile['options'];
  category: 'beginner' | 'development' | 'production' | 'custom';
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
  buildSize?: number;
  memoryUsage?: {
    flash: number;
    ram: number;
  };
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  optional?: boolean;
}

type DevicePort = ArduinoPort | PlatformIODevice;
type TabType = 'wizard' | 'advanced' | 'profiles' | 'history' | 'output';

const BuildManager: React.FC = () => {
  const { state } = useApp();
  
  // Core state
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [availableBoards, setAvailableBoards] = useState<(ArduinoBoard | PlatformIOBoard)[]>([]);
  const [availablePorts, setAvailablePorts] = useState<DevicePort[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildPhase, setBuildPhase] = useState<'idle' | 'compiling' | 'uploading' | 'complete' | 'error'>('idle');
  const [output, setOutput] = useState<string[]>([]);
  
  // Profile and settings state
  const [buildProfiles, setBuildProfiles] = useState<BuildProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [buildHistory, setBuildHistory] = useState<BuildHistoryEntry[]>([]);
  const [currentSettings, setCurrentSettings] = useState<BuildProfile['options']>({
    verbose: false,
    incremental: true,
    optimization: 'none',
    warnings: 'basic',
    uploadSpeed: 'auto',
    customFlags: ''
  });
  
  // UI state
  const [currentTab, setCurrentTab] = useState<TabType>('wizard');
  const [buildStartTime, setBuildStartTime] = useState<number>(0);
  const [buildProgress, setBuildProgress] = useState<number>(0);
  const [isWizardMode, setIsWizardMode] = useState(true);
  const [wizardStep, setWizardStep] = useState<number>(0);
  const [searchBoard, setSearchBoard] = useState<string>('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  
  // Services
  const arduinoService = ArduinoCLIService.getInstance();
  const platformioService = PlatformIOService.getInstance();

  // Build presets for easy configuration
  const buildPresets: BuildPreset[] = [
    {
      id: 'beginner',
      name: 'Beginner',
      description: 'Basic settings with detailed error messages.',
      icon: 'BASIC',
      category: 'beginner',
      settings: {
        verbose: true,
        incremental: true,
        optimization: 'none',
        warnings: 'all',
        uploadSpeed: 'auto',
        customFlags: ''
      }
    },
    {
      id: 'development',
      name: 'Development',
      description: 'Optimized for debugging with fast compilation.',
      icon: 'DEV',
      category: 'development',
      settings: {
        verbose: false,
        incremental: true,
        optimization: 'debug',
        warnings: 'basic',
        uploadSpeed: 'auto',
        customFlags: '-g'
      }
    },
    {
      id: 'production',
      name: 'Production',
      description: 'Size optimized for minimal binary size.',
      icon: 'PROD',
      category: 'production',
      settings: {
        verbose: false,
        incremental: false,
        optimization: 'size',
        warnings: 'none',
        uploadSpeed: 'auto',
        customFlags: '-Os'
      }
    },
    {
      id: 'speed',
      name: 'Speed Optimized',
      description: 'Optimized for execution speed.',
      icon: 'SPEED',
      category: 'production',
      settings: {
        verbose: false,
        incremental: false,
        optimization: 'speed',
        warnings: 'basic',
        uploadSpeed: 'auto',
        customFlags: '-O3'
      }
    }
  ];

  // Wizard steps
  const wizardSteps: WizardStep[] = [
    {
      id: 'project',
      title: 'Project Check',
      description: 'Verify that a project is selected for building',
      completed: !!state.currentProject
    },
    {
      id: 'board',
      title: 'Board Selection',
      description: 'Select target board',
      completed: !!selectedBoard
    },
    {
      id: 'port',
      title: 'ポート選択',
      description: 'デバイスが接続されているポートを選択します',
      completed: !!selectedPort,
      optional: true
    },
    {
      id: 'settings',
      title: 'ビルド設定',
      description: 'ビルドオプションを設定します',
      completed: !!selectedPreset
    },
    {
      id: 'ready',
      title: '準備完了',
      description: 'ビルドまたはアップロードを実行できます',
      completed: !!selectedBoard && !!selectedPreset
    }
  ];

  useEffect(() => {
    loadBoardsAndPorts();
    loadBuildProfiles();
    loadBuildHistory();
  }, [state.mode, state.currentProject]);

  const loadBoardsAndPorts = async () => {
    if (state.mode && state.currentProject) {
      try {
        let boards: (ArduinoBoard | PlatformIOBoard)[] = [];
        let ports: DevicePort[] = [];

        if (state.mode === 'arduino') {
          const installed = await arduinoService.checkInstallation();
          if (installed) {
            boards = await arduinoService.listBoards();
            ports = await arduinoService.listPorts();
          } else {
            addOutput('❌ Arduino CLI が見つかりません。Arduino CLI をインストールしてください。');
          }
        } else if (state.mode === 'platformio') {
          const installed = await platformioService.checkInstallation();
          if (installed) {
            boards = await platformioService.listAllBoards();
            ports = await platformioService.listDevices();
          } else {
            addOutput('❌ PlatformIO が見つかりません。PlatformIO をインストールしてください。');
          }
        }
        
        setAvailableBoards(boards);
        setAvailablePorts(ports);
        
        // Auto-select based on project or previous selection
        if (boards.length > 0 && !selectedBoard) {
          const defaultBoard = boards.find(b => 
            b.name.toLowerCase().includes('uno') || 
            b.name.toLowerCase().includes('esp32') ||
            ('id' in b && b.id.includes('uno'))
          );
          if (defaultBoard) {
            const boardId = 'id' in defaultBoard ? defaultBoard.id : defaultBoard.fqbn;
            setSelectedBoard(boardId);
          }
        }

        if (ports.length === 1) {
          const portValue = 'address' in ports[0] ? ports[0].address : ports[0].port;
          setSelectedPort(portValue);
        }
        
      } catch (error) {
        addOutput(`❌ ボードとポートの読み込みエラー: ${error}`);
      }
    }
  };

  const loadBuildProfiles = () => {
    // Load from localStorage or create default profiles
    const saved = localStorage.getItem('buildProfiles');
    if (saved) {
      try {
        setBuildProfiles(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load build profiles:', error);
      }
    }
  };

  const loadBuildHistory = () => {
    const saved = localStorage.getItem('buildHistory');
    if (saved) {
      try {
        const history = JSON.parse(saved).map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
        setBuildHistory(history);
      } catch (error) {
        console.error('Failed to load build history:', error);
      }
    }
  };

  const saveBuildProfiles = (profiles: BuildProfile[]) => {
    localStorage.setItem('buildProfiles', JSON.stringify(profiles));
    setBuildProfiles(profiles);
  };

  const saveBuildHistory = (history: BuildHistoryEntry[]) => {
    localStorage.setItem('buildHistory', JSON.stringify(history));
    setBuildHistory(history);
  };

  const addOutput = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setOutput(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const appendOutput = (data: string) => {
    const lines = data.split('\n').filter(line => line.trim() !== '');
    lines.forEach(line => {
      setOutput(prev => [...prev, line]);
    });
    
    // Auto-scroll to bottom
    setTimeout(() => {
      const outputElement = document.querySelector('.build-output .output-content');
      if (outputElement) {
        outputElement.scrollTop = outputElement.scrollHeight;
      }
    }, 10);
  };

  const simulateBuildProgress = () => {
    setBuildProgress(0);
    const interval = setInterval(() => {
      setBuildProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 200);
  };

  const applyPreset = (presetId: string) => {
    const preset = buildPresets.find(p => p.id === presetId);
    if (preset) {
      setCurrentSettings(preset.settings);
      setSelectedPreset(presetId);
      addOutput(`📋 プリセット "${preset.name}" を適用しました`);
    }
  };

  const handleCompile = async () => {
    if (!validateBuildSetup()) return;
    
    setIsBuilding(true);
    setBuildPhase('compiling');
    setCompileResult(null);
    setBuildStartTime(Date.now());
    simulateBuildProgress();
    
    addOutput(`🔨 ${state.currentProject?.name} のコンパイルを開始...`);
    addOutput(`🎯 ボード: ${selectedBoard}`);
    addOutput(`⚙️ 最適化: ${currentSettings.optimization}`);
    
    try {
      let result: CompileResult;
      
      if (state.mode === 'arduino') {
        result = await arduinoService.compile(state.currentProject!.path, selectedBoard);
      } else {
        result = await platformioService.compile(state.currentProject!.path);
      }
      
      setCompileResult(result);
      const duration = ((Date.now() - buildStartTime) / 1000).toFixed(2);
      
      if (result.output) {
        appendOutput(result.output);
      }
      
      if (result.success) {
        setBuildPhase('complete');
        addOutput(`✅ コンパイル成功! (${duration}秒)`);
        
        // Add to history
        addToBuildHistory(result, duration, false);
      } else {
        setBuildPhase('error');
        addOutput(`❌ コンパイル失敗! (${duration}秒)`);
        result.errors.forEach(error => addOutput(`  ❗ ${error}`));
      }
      
      result.warnings.forEach(warning => addOutput(`  ⚠️ ${warning}`));
      
    } catch (error) {
      setBuildPhase('error');
      const duration = ((Date.now() - buildStartTime) / 1000).toFixed(2);
      addOutput(`❌ コンパイルエラー: ${error} (${duration}秒)`);
    } finally {
      setIsBuilding(false);
    }
  };

  const handleUpload = async () => {
    if (!validateBuildSetup() || !selectedPort) {
      addOutput('❌ アップロードにはポートの選択が必要です');
      return;
    }
    
    setIsBuilding(true);
    setBuildPhase('uploading');
    setUploadResult(null);
    setBuildStartTime(Date.now());
    simulateBuildProgress();
    
    addOutput(`📤 ${state.currentProject?.name} のアップロードを開始...`);
    addOutput(`🔌 ポート: ${selectedPort}`);
    
    try {
      // Compile first if needed
      if (!compileResult?.success) {
        addOutput('🔨 アップロード前にコンパイル中...');
        await handleCompile();
        if (!compileResult?.success) {
          addOutput('❌ コンパイル失敗のためアップロードをキャンセル');
          return;
        }
      }
      
      let result: UploadResult;
      
      if (state.mode === 'arduino') {
        result = await arduinoService.upload(state.currentProject!.path, selectedBoard, selectedPort);
      } else {
        result = await platformioService.upload(state.currentProject!.path);
      }
      
      setUploadResult(result);
      const duration = ((Date.now() - buildStartTime) / 1000).toFixed(2);
      
      if (result.output) {
        appendOutput(result.output);
      }
      
      if (result.success) {
        setBuildPhase('complete');
        addOutput(`✅ アップロード成功! (${duration}秒)`);
        addOutput('🎉 コードがデバイスで実行中です!');
        
        // Add to history
        addToBuildHistory(result, duration, true);
      } else {
        setBuildPhase('error');
        addOutput(`❌ アップロード失敗! (${duration}秒)`);
        result.errors.forEach(error => addOutput(`  ❗ ${error}`));
      }
      
    } catch (error) {
      setBuildPhase('error');
      const duration = ((Date.now() - buildStartTime) / 1000).toFixed(2);
      addOutput(`❌ アップロードエラー: ${error} (${duration}秒)`);
    } finally {
      setIsBuilding(false);
    }
  };

  const validateBuildSetup = (): boolean => {
    if (!state.mode || !state.currentProject) {
      addOutput('❌ プロジェクトが開かれていません');
      return false;
    }
    
    if (!selectedBoard) {
      addOutput('❌ ボードが選択されていません');
      return false;
    }
    
    if (isBuilding) {
      addOutput('⚠️ ビルドが既に実行中です');
      return false;
    }
    
    return true;
  };

  const addToBuildHistory = (result: CompileResult | UploadResult, duration: string, isUpload: boolean) => {
    const historyEntry: BuildHistoryEntry = {
      id: `build_${Date.now()}`,
      timestamp: new Date(),
      projectName: state.currentProject!.name,
      board: selectedBoard,
      success: result.success,
      duration: parseFloat(duration),
      output: result.output,
      errors: result.errors,
      warnings: 'warnings' in result ? result.warnings : []
    };
    
    const newHistory = [historyEntry, ...buildHistory.slice(0, 49)]; // Keep last 50
    saveBuildHistory(newHistory);
  };

  const getFilteredBoards = () => {
    if (!searchBoard.trim()) return availableBoards;
    
    const search = searchBoard.toLowerCase();
    return availableBoards.filter(board => 
      board.name.toLowerCase().includes(search) ||
      ('platform' in board && board.platform && board.platform.toLowerCase().includes(search)) ||
      ('mcu' in board && board.mcu && board.mcu.toLowerCase().includes(search))
    );
  };

  const refreshPorts = async () => {
    if (!state.mode) return;
    
    addOutput('🔄 ポートを更新中...');
    try {
      let ports: DevicePort[] = [];
      
      if (state.mode === 'arduino') {
        ports = await arduinoService.listPorts();
      } else {
        ports = await platformioService.listDevices();
      }
      
      setAvailablePorts(ports);
      addOutput(`✅ ${ports.length} 個のポートが見つかりました`);
    } catch (error) {
      addOutput(`❌ ポート更新エラー: ${error}`);
    }
  };

  const clearOutput = () => {
    setOutput([]);
  };

  const nextWizardStep = () => {
    if (wizardStep < wizardSteps.length - 1) {
      setWizardStep(wizardStep + 1);
    }
  };

  const prevWizardStep = () => {
    if (wizardStep > 0) {
      setWizardStep(wizardStep - 1);
    }
  };

  const renderWizardContent = () => {
    const currentStep = wizardSteps[wizardStep];
    
    switch (currentStep.id) {
      case 'project':
        return (
          <div className="wizard-step-content">
            <div className="step-icon">📁</div>
            <h3>プロジェクト確認</h3>
            {state.currentProject ? (
              <div className="project-info-card">
                <div className="project-name">{state.currentProject.name}</div>
                <div className="project-path">{state.currentProject.path}</div>
                <div className="project-mode">モード: {state.mode}</div>
                <div className="status-badge success">✅ プロジェクトが選択されています</div>
              </div>
            ) : (
              <div className="no-project-info">
                <div className="status-badge error">❌ プロジェクトが選択されていません</div>
                <p>ファイルメニューから新規作成または既存プロジェクトを開いてください。</p>
              </div>
            )}
          </div>
        );
        
      case 'board':
        return (
          <div className="wizard-step-content">
            <div className="step-icon">🎯</div>
            <h3>ボード選択</h3>
            <div className="board-search-section">
              <input
                type="text"
                placeholder="ボードを検索..."
                value={searchBoard}
                onChange={(e) => setSearchBoard(e.target.value)}
                className="board-search-input"
              />
            </div>
            <div className="board-grid">
              {getFilteredBoards().slice(0, 6).map(board => {
                const boardId = 'id' in board ? board.id : board.fqbn;
                const platform = 'platform' in board ? board.platform : ('core' in board ? (board as any).core : 'Unknown');
                const isSelected = selectedBoard === boardId;
                
                return (
                  <div 
                    key={boardId}
                    className={`board-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedBoard(boardId)}
                  >
                    <div className="board-icon">
                      {board.name.toLowerCase().includes('esp') ? '📡' : 
                       board.name.toLowerCase().includes('uno') ? '🔷' :
                       board.name.toLowerCase().includes('nano') ? '🔹' : '⚡'}
                    </div>
                    <div className="board-name">{board.name}</div>
                    <div className="board-platform">{platform}</div>
                    {isSelected && <div className="selected-indicator">✅</div>}
                  </div>
                );
              })}
            </div>
            {getFilteredBoards().length > 6 && (
              <div className="board-overflow">
                ...他 {getFilteredBoards().length - 6} 個のボード
              </div>
            )}
          </div>
        );
        
      case 'port':
        return (
          <div className="wizard-step-content">
            <div className="step-icon">🔌</div>
            <h3>ポート選択</h3>
            <div className="port-actions">
              <button className="refresh-btn" onClick={refreshPorts}>
                🔄 ポートを更新
              </button>
            </div>
            <div className="port-list">
              {availablePorts.length === 0 ? (
                <div className="no-ports">
                  <div className="status-badge warning">⚠️ ポートが見つかりません</div>
                  <p>デバイスを接続して「ポートを更新」をクリックしてください。</p>
                  <small>注: コンパイルのみの場合はポート選択は不要です。</small>
                </div>
              ) : (
                availablePorts.map(port => {
                  const portValue = 'address' in port ? port.address : port.port;
                  const portLabel = 'label' in port ? port.label : `${port.port} - ${port.description}`;
                  const isSelected = selectedPort === portValue;
                  
                  return (
                    <div 
                      key={portValue}
                      className={`port-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedPort(portValue)}
                    >
                      <div className="port-icon">🔌</div>
                      <div className="port-details">
                        <div className="port-name">{portValue}</div>
                        <div className="port-description">{portLabel}</div>
                      </div>
                      {isSelected && <div className="selected-indicator">✅</div>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
        
      case 'settings':
        return (
          <div className="wizard-step-content">
            <div className="step-icon">⚙️</div>
            <h3>ビルド設定</h3>
            <div className="preset-grid">
              {buildPresets.map(preset => (
                <div 
                  key={preset.id}
                  className={`preset-card ${selectedPreset === preset.id ? 'selected' : ''}`}
                  onClick={() => applyPreset(preset.id)}
                >
                  <div className="preset-icon">{preset.icon}</div>
                  <div className="preset-name">{preset.name}</div>
                  <div className="preset-description">{preset.description}</div>
                  {selectedPreset === preset.id && <div className="selected-indicator">✅</div>}
                </div>
              ))}
            </div>
            <div className="advanced-toggle">
              <button 
                className="toggle-btn"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              >
                {showAdvancedSettings ? '🔼' : '🔽'} 詳細設定
              </button>
            </div>
            {showAdvancedSettings && (
              <div className="advanced-settings-panel">
                {/* Advanced settings content */}
                <div className="setting-group">
                  <label>最適化レベル:</label>
                  <select 
                    value={currentSettings.optimization}
                    onChange={(e) => setCurrentSettings({...currentSettings, optimization: e.target.value as any})}
                  >
                    <option value="none">なし (デバッグ向け)</option>
                    <option value="size">サイズ最適化</option>
                    <option value="speed">速度最適化</option>
                    <option value="debug">デバッグ情報付き</option>
                  </select>
                </div>
                
                <div className="setting-group">
                  <label>警告レベル:</label>
                  <select 
                    value={currentSettings.warnings}
                    onChange={(e) => setCurrentSettings({...currentSettings, warnings: e.target.value as any})}
                  >
                    <option value="none">なし</option>
                    <option value="basic">基本</option>
                    <option value="all">すべて</option>
                  </select>
                </div>
                
                <div className="setting-group checkbox-group">
                  <label>
                    <input 
                      type="checkbox"
                      checked={currentSettings.verbose}
                      onChange={(e) => setCurrentSettings({...currentSettings, verbose: e.target.checked})}
                    />
                    詳細ログ出力
                  </label>
                </div>
                
                <div className="setting-group checkbox-group">
                  <label>
                    <input 
                      type="checkbox"
                      checked={currentSettings.incremental}
                      onChange={(e) => setCurrentSettings({...currentSettings, incremental: e.target.checked})}
                    />
                    インクリメンタルビルド
                  </label>
                </div>
              </div>
            )}
          </div>
        );
        
      case 'ready':
        return (
          <div className="wizard-step-content">
            <div className="step-icon">🚀</div>
            <h3>準備完了</h3>
            <div className="build-summary">
              <div className="summary-item">
                <span className="summary-label">プロジェクト:</span>
                <span className="summary-value">{state.currentProject?.name}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">ボード:</span>
                <span className="summary-value">{selectedBoard}</span>
              </div>
              {selectedPort && (
                <div className="summary-item">
                  <span className="summary-label">ポート:</span>
                  <span className="summary-value">{selectedPort}</span>
                </div>
              )}
              <div className="summary-item">
                <span className="summary-label">設定:</span>
                <span className="summary-value">{buildPresets.find(p => p.id === selectedPreset)?.name || 'カスタム'}</span>
              </div>
            </div>
            
            <div className="ready-actions">
              <button 
                className="action-btn compile-btn"
                onClick={handleCompile}
                disabled={isBuilding}
              >
                🔨 コンパイル
              </button>
              
              <button 
                className="action-btn upload-btn"
                onClick={handleUpload}
                disabled={isBuilding || !selectedPort}
              >
                📤 コンパイル + アップロード
              </button>
            </div>
            
            {!selectedPort && (
              <div className="upload-note">
                <small>⚠️ アップロードにはポートの選択が必要です</small>
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="build-manager-new">
      <div className="build-manager-header">
        <h2>ビルドマネージャー</h2>
        <div className="mode-toggle">
          <button 
            className={`mode-btn ${isWizardMode ? 'active' : ''}`}
            onClick={() => setIsWizardMode(true)}
          >
            🧙 ウィザード
          </button>
          <button 
            className={`mode-btn ${!isWizardMode ? 'active' : ''}`}
            onClick={() => setIsWizardMode(false)}
          >
            ⚙️ 詳細設定
          </button>
        </div>
      </div>

      {isWizardMode ? (
        <div className="wizard-container">
          <div className="wizard-progress">
            {wizardSteps.map((step, index) => (
              <div 
                key={step.id}
                className={`wizard-step ${index === wizardStep ? 'active' : ''} ${step.completed ? 'completed' : ''}`}
                onClick={() => setWizardStep(index)}
              >
                <div className="step-number">{index + 1}</div>
                <div className="step-info">
                  <div className="step-title">{step.title}</div>
                  <div className="step-desc">{step.description}</div>
                </div>
                {step.completed && <div className="step-check">✅</div>}
              </div>
            ))}
          </div>
          
          <div className="wizard-content">
            {renderWizardContent()}
          </div>
          
          <div className="wizard-navigation">
            <button 
              className="nav-btn prev-btn"
              onClick={prevWizardStep}
              disabled={wizardStep === 0}
            >
              ← 前へ
            </button>
            
            <div className="step-indicator">
              {wizardStep + 1} / {wizardSteps.length}
            </div>
            
            <button 
              className="nav-btn next-btn"
              onClick={nextWizardStep}
              disabled={wizardStep === wizardSteps.length - 1}
            >
              次へ →
            </button>
          </div>
        </div>
      ) : (
        <div className="advanced-container">
          <div className="build-tabs">
            <button 
              className={`tab-btn ${currentTab === 'advanced' ? 'active' : ''}`}
              onClick={() => setCurrentTab('advanced')}
            >
              詳細設定
            </button>
            <button 
              className={`tab-btn ${currentTab === 'profiles' ? 'active' : ''}`}
              onClick={() => setCurrentTab('profiles')}
            >
              プロファイル
            </button>
            <button 
              className={`tab-btn ${currentTab === 'history' ? 'active' : ''}`}
              onClick={() => setCurrentTab('history')}
            >
              履歴
            </button>
            <button 
              className={`tab-btn ${currentTab === 'output' ? 'active' : ''}`}
              onClick={() => setCurrentTab('output')}
            >
              出力
            </button>
          </div>
          
          <div className="tab-content">
            {/* Tab content will be implemented in the next part */}
            <div className="coming-soon">
              詳細設定モードは実装中です...
            </div>
          </div>
        </div>
      )}

      {(isBuilding || buildPhase !== 'idle') && (
        <div className="build-status-overlay">
          <div className="build-status-card">
            <div className="status-header">
              <div className="status-icon">
                {buildPhase === 'compiling' ? '🔨' : 
                 buildPhase === 'uploading' ? '📤' : 
                 buildPhase === 'complete' ? '✅' : '❌'}
              </div>
              <div className="status-text">
                {buildPhase === 'compiling' ? 'コンパイル中...' : 
                 buildPhase === 'uploading' ? 'アップロード中...' : 
                 buildPhase === 'complete' ? '完了' : 'エラー'}
              </div>
            </div>
            
            {isBuilding && (
              <div className="build-progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${buildProgress}%` }}
                />
              </div>
            )}
            
            <div className="build-output-mini">
              {output.slice(-3).map((line, index) => (
                <div key={index} className="output-line-mini">{line}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildManager;
import React, { useState, useEffect } from 'react';import React, { useState, useEffect } from 'react';import React from 'react';import React, { useState, useEffect } from 'react';import React, { useState, useEffect } from 'react';import React, { useState, useEffect, useRef } from 'react';import React, { useState, useEffect, useRef } from 'react';import React, { useState, useEffect, useRef } from 'react';

import { useApp } from '../../contexts/AppContext';

import './QuickBuildPanel.css';import { useApp } from '../../contexts/AppContext';



interface BuildPanelProps {import './QuickBuildPanel.css';

  isExpanded?: boolean;

}



interface CacheEntry {interface QuickBuildPanelProps {const QuickBuildPanel: React.FC = () => {import { useApp } from '../../contexts/AppContext';

  boardId: string;

  projectPath: string;  isExpanded?: boolean;

  compiledBinary: string;

  timestamp: number;}  return (

  success: boolean;

}



const BuildPanel: React.FC<BuildPanelProps> = ({ isExpanded = false }) => {const QuickBuildPanel: React.FC<QuickBuildPanelProps> = ({ isExpanded = false }) => {    <div className="quick-build-panel">import './QuickBuildPanel.css';import { useApp } from '../../contexts/AppContext';

  const { state } = useApp();

    const { state } = useApp();

  // State

  const [selectedBoard, setSelectedBoard] = useState<string>('');        <h3>Quick Build Panel</h3>

  const [selectedPort, setSelectedPort] = useState<string>('');

  const [isBuilding, setIsBuilding] = useState(false);  const [selectedBoard, setSelectedBoard] = useState('');

  const [buildStatus, setBuildStatus] = useState<'idle' | 'compiling' | 'uploading' | 'success' | 'error'>('idle');

  const [buildCache, setBuildCache] = useState<CacheEntry[]>([]);  const [selectedPort, setSelectedPort] = useState('');      <p>Working correctly!</p>

  const [showOutput, setShowOutput] = useState(false);

  const [buildOutput, setBuildOutput] = useState<string>('');  const [isBuilding, setIsBuilding] = useState(false);



  // Mock data  const [buildStatus, setBuildStatus] = useState<'idle' | 'compiling' | 'uploading' | 'success' | 'error'>('idle');    </div>

  const boards = [

    { id: 'arduino:avr:uno', name: 'Arduino Uno' },  const [buildProgress, setBuildProgress] = useState(0);

    { id: 'arduino:avr:nano', name: 'Arduino Nano' },

    { id: 'arduino:avr:mega', name: 'Arduino Mega 2560' },  const [buildOutput, setBuildOutput] = useState<string[]>([]);  );interface QuickBuildPanelProps {import './QuickBuildPanel.css';import { useApp } from '../../contexts/AppContext';

    { id: 'esp32:esp32:esp32', name: 'ESP32 Dev Module' },

    { id: 'esp8266:esp8266:nodemcuv2', name: 'NodeMCU 1.0' }

  ];

  // Mock data};

  const ports = [

    { id: 'COM3', name: 'COM3 (USB Serial Port)' },  const mockBoards = [

    { id: 'COM4', name: 'COM4 (Arduino USB Port)' },

    { id: 'COM5', name: 'COM5 (ESP32 Serial Port)' }    { fqbn: 'arduino:avr:uno', name: 'Arduino Uno' },  isExpanded?: boolean;

  ];

    { fqbn: 'arduino:avr:nano', name: 'Arduino Nano' },

  // Auto select first options

  useEffect(() => {    { fqbn: 'esp32:esp32:esp32', name: 'ESP32 Dev Module' }export default QuickBuildPanel;

    if (!selectedBoard && boards.length > 0) {

      setSelectedBoard(boards[0].id);  ];}

    }

    if (!selectedPort && ports.length > 0) {

      setSelectedPort(ports[0].id);

    }  const mockPorts = [

  }, []);

    { address: 'COM3', desc: 'USB Serial Port' },

  // Load build cache from localStorage

  useEffect(() => {    { address: 'COM4', desc: 'Arduino USB Port' }const QuickBuildPanel: React.FC<QuickBuildPanelProps> = ({ isExpanded = false }) => {interface QuickBuildPanelProps {import './QuickBuildPanel.css';import { useApp } from '../../contexts/AppContext';import { useApp } from '../../contexts/AppContext';

    const cached = localStorage.getItem('buildCache');

    if (cached) {  ];

      try {

        setBuildCache(JSON.parse(cached));  const { state } = useApp();

      } catch (e) {

        console.warn('Failed to parse build cache');  useEffect(() => {

      }

    }    if (!selectedBoard && mockBoards.length > 0) {    isExpanded?: boolean;

  }, []);

      setSelectedBoard(mockBoards[0].fqbn);

  // Save build cache to localStorage

  const saveBuildCache = (cache: CacheEntry[]) => {    }  // Basic state

    setBuildCache(cache);

    localStorage.setItem('buildCache', JSON.stringify(cache));    if (!selectedPort && mockPorts.length > 0) {

  };

      setSelectedPort(mockPorts[0].address);  const [selectedBoard, setSelectedBoard] = useState<string>('');}

  // Check if we have a cached build for current project/board

  const getCachedBuild = (): CacheEntry | null => {    }

    if (!state.currentProject || !selectedBoard) return null;

      }, []);  const [selectedPort, setSelectedPort] = useState<string>('');

    const cached = buildCache.find(entry => 

      entry.boardId === selectedBoard && 

      entry.projectPath === state.currentProject!.path &&

      entry.success  const handleCompile = async () => {  const [isBuilding, setIsBuilding] = useState(false);

    );

        console.log('Compile clicked', { selectedBoard, project: state.currentProject });

    return cached || null;

  };      const [buildStatus, setBuildStatus] = useState<'idle' | 'compiling' | 'uploading' | 'success' | 'error'>('idle');



  // Add output message    if (!selectedBoard || !state.currentProject) {

  const addOutput = (message: string) => {

    setBuildOutput(prev => prev + message + '\n');      setBuildOutput(prev => [...prev, 'Please select a board and open a project']);  const [buildProgress, setBuildProgress] = useState(0);const QuickBuildPanel: React.FC<QuickBuildPanelProps> = ({ isExpanded = false }) => {interface QuickBuildPanelProps {import arduinoService, { ArduinoCLIService, ArduinoBoard, ArduinoPort } from '../../services/ArduinoService';import arduinoService, { ArduinoCLIService, ArduinoBoard, ArduinoPort } from '../../services/ArduinoService';

  };

      return;

  // Compile function

  const handleCompile = async () => {    }  const [buildOutput, setBuildOutput] = useState<string[]>([]);

    if (!selectedBoard || !state.currentProject) {

      addOutput('❌ Please select a board and open a project');

      return;

    }    setIsBuilding(true);  const { state } = useApp();



    console.log('Starting compilation for:', selectedBoard, state.currentProject.path);    setBuildStatus('compiling');

    

    setIsBuilding(true);    setBuildProgress(0);  // Mock data for testing

    setBuildStatus('compiling');

    setBuildOutput('');

    setShowOutput(true);

        // Simulate progress  const mockBoards = [    isExpanded?: boolean;

    addOutput(`🔨 Compiling ${state.currentProject.name} for ${selectedBoard}...`);

    addOutput(`📁 Project path: ${state.currentProject.path}`);    const interval = setInterval(() => {



    try {      setBuildProgress(prev => {    { id: 'arduino:avr:uno', name: 'Arduino Uno', fqbn: 'arduino:avr:uno' },

      // Simulate compilation process

      await new Promise(resolve => setTimeout(resolve, 1000));        if (prev >= 100) {

      addOutput('📦 Collecting source files...');

                clearInterval(interval);    { id: 'arduino:avr:nano', name: 'Arduino Nano', fqbn: 'arduino:avr:nano' },  // Basic state

      await new Promise(resolve => setTimeout(resolve, 1500));

      addOutput('⚙️ Linking libraries...');          return 100;

      

      await new Promise(resolve => setTimeout(resolve, 1000));        }    { id: 'esp32:esp32:esp32', name: 'ESP32 Dev Module', fqbn: 'esp32:esp32:esp32' }

      addOutput('🎯 Generating binary...');

        return prev + 10;

      // Simulate successful compilation

      const mockBinary = `compiled_${selectedBoard}_${Date.now()}.bin`;      });  ];  const [selectedBoard, setSelectedBoard] = useState<string>('');}import platformioService, { PlatformIOService, PlatformIOBoard, PlatformIODevice } from '../../services/PlatformIOService';import platformioService, { PlatformIOService, PlatformIOBoard, PlatformIODevice } from '../../services/PlatformIOService';

      

      // Cache the compiled result    }, 200);

      const cacheEntry: CacheEntry = {

        boardId: selectedBoard,

        projectPath: state.currentProject.path,

        compiledBinary: mockBinary,    try {

        timestamp: Date.now(),

        success: true      setBuildOutput(prev => [...prev, `Compiling for ${selectedBoard}...`]);  const mockPorts = [  const [selectedPort, setSelectedPort] = useState<string>('');

      };

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Add to cache (keep last 10 builds)

      const newCache = [cacheEntry, ...buildCache].slice(0, 10);          { address: 'COM3', desc: 'USB Serial Port' },

      saveBuildCache(newCache);

      setBuildStatus('success');

      setBuildStatus('success');

      addOutput('✅ Compilation successful!');      setBuildOutput(prev => [...prev, 'Compilation successful!']);    { address: 'COM4', desc: 'Arduino USB Port' },  const [isBuilding, setIsBuilding] = useState(false);

      addOutput(`💾 Binary cached: ${mockBinary}`);

      addOutput(`📊 Sketch uses 924 bytes (2%) of program storage space`);    } catch (error) {

      addOutput(`🧠 Global variables use 9 bytes (0%) of dynamic memory`);

      setBuildStatus('error');    { address: 'COM5', desc: 'ESP32 Serial Port' }

    } catch (error) {

      setBuildStatus('error');      setBuildOutput(prev => [...prev, 'Compilation failed!']);

      addOutput(`❌ Compilation failed: ${error}`);

    } finally {    } finally {  ];  const [buildStatus, setBuildStatus] = useState<'idle' | 'compiling' | 'uploading' | 'success' | 'error'>('idle');

      setIsBuilding(false);

      setTimeout(() => setBuildStatus('idle'), 3000);      setIsBuilding(false);

    }

  };      setTimeout(() => {



  // Upload function        setBuildStatus('idle');

  const handleUpload = async () => {

    if (!selectedBoard || !selectedPort || !state.currentProject) {        setBuildProgress(0);  // Auto-select first options on loadinterface BuildOutput {import './QuickBuildPanel.css';import './QuickBuildPanel.css';

      addOutput('❌ Please select board, port, and open a project');

      return;      }, 3000);

    }

    }  useEffect(() => {

    // Check for cached build first

    const cached = getCachedBuild();  };

    

    console.log('Starting upload to:', selectedPort);    if (!selectedBoard && mockBoards.length > 0) {  // Mock data for testing

    

    setIsBuilding(true);  const handleUpload = async () => {

    setBuildStatus('uploading');

        console.log('Upload clicked', { selectedBoard, selectedPort, project: state.currentProject });      setSelectedBoard(mockBoards[0].fqbn);

    if (!showOutput) {

      setBuildOutput('');    

      setShowOutput(true);

    }    if (!selectedBoard || !selectedPort || !state.currentProject) {    }  const mockBoards = [  message: string;



    try {      setBuildOutput(prev => [...prev, 'Please select board, port, and open a project']);

      if (cached) {

        addOutput(`📦 Using cached binary: ${cached.compiledBinary}`);      return;    if (!selectedPort && mockPorts.length > 0) {

        addOutput(`⏰ Compiled: ${new Date(cached.timestamp).toLocaleString()}`);

      } else {    }

        addOutput('⚠️ No cached binary found, compiling first...');

        await handleCompile();      setSelectedPort(mockPorts[0].address);    { id: 'arduino:avr:uno', name: 'Arduino Uno', fqbn: 'arduino:avr:uno' },

        if (buildStatus === 'error') return;

      }    setIsBuilding(true);



      addOutput(`📡 Uploading to ${selectedPort}...`);    setBuildStatus('uploading');    }

      addOutput('🔌 Connecting to board...');

          setBuildProgress(0);

      await new Promise(resolve => setTimeout(resolve, 1000));

      addOutput('🔄 Resetting board...');  }, [selectedBoard, selectedPort]);    { id: 'arduino:avr:nano', name: 'Arduino Nano', fqbn: 'arduino:avr:nano' },  type: 'info' | 'success' | 'warning' | 'error';

      

      await new Promise(resolve => setTimeout(resolve, 1500));    // Simulate progress

      addOutput('📤 Writing firmware...');

          const interval = setInterval(() => {

      await new Promise(resolve => setTimeout(resolve, 2000));

      addOutput('✅ Upload successful!');      setBuildProgress(prev => {

      addOutput('🚀 Board is ready to run');

        if (prev >= 100) {  // Listen for external build events (F7, F5, menu actions)    { id: 'esp32:esp32:esp32', name: 'ESP32 Dev Module', fqbn: 'esp32:esp32:esp32' }

      setBuildStatus('success');

          clearInterval(interval);

    } catch (error) {

      setBuildStatus('error');          return 100;  useEffect(() => {

      addOutput(`❌ Upload failed: ${error}`);

    } finally {        }

      setIsBuilding(false);

      setTimeout(() => setBuildStatus('idle'), 3000);        return prev + 15;    const handleBuildEvent = (event: Event) => {  ];  timestamp: Date;

    }

  };      });



  // Compile and upload    }, 300);      const customEvent = event as CustomEvent;

  const handleCompileAndUpload = async () => {

    await handleCompile();

    if (buildStatus !== 'error') {

      await new Promise(resolve => setTimeout(resolve, 500));    try {      if (customEvent.detail && customEvent.detail.action) {

      await handleUpload();

    }      setBuildOutput(prev => [...prev, `Uploading to ${selectedPort}...`]);

  };

      await new Promise(resolve => setTimeout(resolve, 3000));        const { action } = customEvent.detail;

  // Clean build cache

  const handleClean = () => {      

    setBuildCache([]);

    localStorage.removeItem('buildCache');      setBuildStatus('success');          const mockPorts = [}interface QuickBuildPanelProps {interface QuickBuildPanelProps {

    addOutput('🧹 Build cache cleared');

    setShowOutput(true);      setBuildOutput(prev => [...prev, 'Upload successful!']);

  };

    } catch (error) {        switch (action) {

  const getStatusText = () => {

    switch (buildStatus) {      setBuildStatus('error');

      case 'compiling': return 'コンパイル中...';

      case 'uploading': return 'アップロード中...';      setBuildOutput(prev => [...prev, 'Upload failed!']);          case 'compile':    { address: 'COM3', desc: 'USB Serial Port' },

      case 'success': return '完了';

      case 'error': return 'エラー';    } finally {

      default: return '準備完了';

    }      setIsBuilding(false);            handleCompile();

  };

      setTimeout(() => {

  const cachedBuild = getCachedBuild();

        setBuildStatus('idle');            break;    { address: 'COM4', desc: 'Arduino USB Port' },

  return (

    <div className={`quick-build-panel ${isExpanded ? 'expanded' : ''}`}>        setBuildProgress(0);

      <div className="panel-header">

        <h3>ビルド設定</h3>      }, 3000);          case 'upload':

        <div className={`build-status ${buildStatus}`}>

          {getStatusText()}    }

        </div>

      </div>  };            handleUpload();    { address: 'COM5', desc: 'ESP32 Serial Port' }



      <div className="panel-content">

        {/* Board Selection */}

        <div className="config-section">  const getStatusText = () => {            break;

          <label>ボード</label>

          <select     switch (buildStatus) {

            value={selectedBoard} 

            onChange={(e) => setSelectedBoard(e.target.value)}      case 'compiling': return 'COMPILING';          case 'build-upload':  ];const QuickBuildPanel: React.FC<QuickBuildPanelProps> = ({ isExpanded = false }) => {  isExpanded?: boolean;  isExpanded?: boolean;

            disabled={isBuilding}

          >      case 'uploading': return 'UPLOADING';

            {boards.map(board => (

              <option key={board.id} value={board.id}>      case 'success': return 'SUCCESS';            handleCompileAndUpload();

                {board.name}

              </option>      case 'error': return 'ERROR';

            ))}

          </select>      default: return 'READY';            break;

        </div>

    }

        {/* Port Selection */}

        <div className="config-section">  };        }

          <label>ポート</label>

          <select 

            value={selectedPort} 

            onChange={(e) => setSelectedPort(e.target.value)}  if (!state.currentProject) {      }  // Auto-select first options on load  const { state } = useApp();

            disabled={isBuilding}

          >    return (

            {ports.map(port => (

              <option key={port.id} value={port.id}>      <div className="quick-build-panel">    };

                {port.name}

              </option>        <div className="panel-header">

            ))}

          </select>          <h3>Build Configuration</h3>  useEffect(() => {

        </div>

        </div>

        {/* Cache Info */}

        {cachedBuild && (        <div className="no-project">    window.addEventListener('triggerBuild', handleBuildEvent);

          <div className="cache-info">

            <small>          <div className="no-project-icon">🛠️</div>

              💾 キャッシュあり: {new Date(cachedBuild.timestamp).toLocaleTimeString()}

            </small>          <p>No Project Open</p>    return () => window.removeEventListener('triggerBuild', handleBuildEvent);    if (!selectedBoard && mockBoards.length > 0) {  }}

          </div>

        )}          <small>Open a project to enable build functionality</small>



        {/* Action Buttons */}        </div>  }, [selectedBoard, selectedPort]);

        <div className="action-buttons">

          <button       </div>

            onClick={handleCompile}

            disabled={isBuilding || !selectedBoard}    );      setSelectedBoard(mockBoards[0].fqbn);

            className="btn-primary"

          >  }

            {buildStatus === 'compiling' ? 'コンパイル中...' : 'コンパイル'}

          </button>  const addBuildOutput = (message: string, type: string = 'info') => {

          

          <button   if (!state.mode) {

            onClick={handleUpload}

            disabled={isBuilding || !selectedPort}    return (    const timestamp = new Date().toLocaleTimeString();    }  // Board and port selection

            className="btn-secondary"

          >      <div className="quick-build-panel">

            {buildStatus === 'uploading' ? 'アップロード中...' : 'アップロード'}

          </button>        <div className="panel-header">    const formattedMessage = `[${timestamp}] ${message}`;

          

          <button           <h3>Build Configuration</h3>

            onClick={handleCompileAndUpload}

            disabled={isBuilding || !selectedBoard || !selectedPort}        </div>    setBuildOutput(prev => [...prev.slice(-4), formattedMessage]);    if (!selectedPort && mockPorts.length > 0) {

            className="btn-tertiary"

          >        <div className="no-project">

            ビルド & アップロード

          </button>          <div className="no-project-icon">⚙️</div>    

        </div>

          <p>No Project Type Selected</p>

        {/* Utility buttons */}

        <div className="utility-buttons">          <small>Please select Arduino or PlatformIO mode</small>    // Also dispatch to global event system      setSelectedPort(mockPorts[0].address);  const [selectedBoard, setSelectedBoard] = useState<string>('');

          <button onClick={() => setShowOutput(!showOutput)} className="btn-small">

            {showOutput ? '出力を隠す' : '出力を表示'}        </div>

          </button>

          <button onClick={handleClean} className="btn-small">      </div>    window.dispatchEvent(new CustomEvent('buildOutput', {

            キャッシュクリア

          </button>    );

        </div>

  }      detail: { message, type, timestamp: new Date() }    }

        {/* Build Output */}

        {showOutput && (

          <div className="build-output">

            <div className="output-header">ビルド出力</div>  if (!isExpanded) {    }));

            <pre className="output-content">

              {buildOutput || 'ビルド出力はここに表示されます...'}    return (

            </pre>

          </div>      <div className="quick-build-panel collapsed">  };  }, [selectedBoard, selectedPort]);  const [selectedPort, setSelectedPort] = useState<string>('');

        )}

        <div className="panel-header">

        {/* Project Info */}

        {state.currentProject && (          <h3>Build</h3>

          <div className="project-info">

            <div>プロジェクト: {state.currentProject.name}</div>          <div className="status-indicator">

            <div>モード: {state.mode}</div>

            <div>キャッシュ数: {buildCache.length}</div>            <div className={`status-dot ${buildStatus}`}></div>  const simulateProgress = (duration: number = 2000) => {

          </div>

        )}            <span className="status-text">{getStatusText()}</span>

      </div>

    </div>          </div>    const steps = 20;

  );

};        </div>



export default BuildPanel;            const interval = duration / steps;  const handleCompile = async () => {  const [availableBoards, setAvailableBoards] = useState<any[]>([]);interface BuildOutput {type BuildStatus = 'idle' | 'compiling' | 'uploading' | 'success' | 'error' | 'warning';

        <div className="quick-actions">

          <button     let step = 0;

            className={`quick-btn compile-only ${buildStatus === 'compiling' ? 'compiling' : ''}`}

            onClick={handleCompile}    console.log('Compile clicked', { selectedBoard, project: state.currentProject });

            disabled={isBuilding || !selectedBoard}

            title="Compile project (F7)"    const progressInterval = setInterval(() => {

          >

            🔨      step++;      const [availablePorts, setAvailablePorts] = useState<any[]>([]);

          </button>

          <button       setBuildProgress((step / steps) * 100);

            className={`quick-btn upload-only ${buildStatus === 'uploading' ? 'uploading' : ''}`}

            onClick={handleUpload}          if (!selectedBoard || !state.currentProject) {

            disabled={isBuilding || !selectedBoard || !selectedPort}

            title="Upload to board (F5)"      if (step >= steps) {

          >

            📤        clearInterval(progressInterval);      alert('Please select a board and open a project');  const [boardSearchTerm, setBoardSearchTerm] = useState('');  message: string;

          </button>

        </div>        setBuildProgress(100);



        {isBuilding && (      }      return;

          <div className="mini-progress">

            <div     }, interval);

              className="mini-progress-fill"

              style={{     }  

                width: `${buildProgress}%`,

                background: buildStatus === 'compiling' ? '#ff8c42' : '#2196F3'    return progressInterval;

              }}

            />  };

          </div>

        )}

      </div>

    );  const handleCompile = async () => {    setIsBuilding(true);  // Build state  type: 'info' | 'success' | 'warning' | 'error';interface BuildOutput {

  }

    console.log('Compile started', { selectedBoard, project: state.currentProject });

  return (

    <div className="quick-build-panel expanded">        setBuildStatus('compiling');

      <div className="panel-header">

        <h3>Build Configuration</h3>    if (!selectedBoard || !state.currentProject) {

        <div className="header-controls">

          <div className="status-indicator">      addBuildOutput('Please select a board and open a project', 'error');  const [isBuilding, setIsBuilding] = useState(false);

            <div className={`status-dot ${buildStatus}`}></div>

            <span className="status-text">{getStatusText()}</span>      return;

          </div>

        </div>    }    try {

      </div>



      <div className="project-info">

        <div className="project-name">{state.currentProject.name}</div>    setIsBuilding(true);      // Simulate compilation  const [buildStatus, setBuildStatus] = useState<'idle' | 'compiling' | 'uploading' | 'success' | 'error'>('idle');  timestamp: Date;  message: string;

        <div className="project-mode">{state.mode?.toUpperCase()}</div>

      </div>    setBuildStatus('compiling');



      <div className="board-selection">    setBuildProgress(0);      await new Promise(resolve => setTimeout(resolve, 2000));

        <div className="section-header">

          <label>Target Board</label>    setBuildOutput([]);

        </div>

        <select       setBuildStatus('success');  const [buildProgress, setBuildProgress] = useState(0);

          value={selectedBoard} 

          onChange={(e) => setSelectedBoard(e.target.value)}    try {

          className="board-select"

          disabled={isBuilding}      addBuildOutput(`Compiling for ${selectedBoard}...`);      alert('Compilation successful!');

        >

          <option value="">Select board...</option>      

          {mockBoards.map(board => (

            <option key={board.fqbn} value={board.fqbn}>      const progressInterval = simulateProgress(2000);    } catch (error) {  const [buildOutput, setBuildOutput] = useState<BuildOutput[]>([]);}  type: 'info' | 'success' | 'warning' | 'error';

              {board.name}

            </option>      

          ))}

        </select>      // Simulate compilation      setBuildStatus('error');

      </div>

      await new Promise(resolve => setTimeout(resolve, 2000));

      <div className="port-selection">

        <div className="section-header">            alert('Compilation failed!');  

          <label>Serial Port</label>

        </div>      clearInterval(progressInterval);

        <select 

          value={selectedPort}       setBuildProgress(100);    } finally {

          onChange={(e) => setSelectedPort(e.target.value)}

          className="port-select"      setBuildStatus('success');

          disabled={isBuilding}

        >      addBuildOutput('Compilation successful!', 'success');      setIsBuilding(false);  // Options  timestamp: Date;

          <option value="">Select port...</option>

          {mockPorts.map(port => (      addBuildOutput('Sketch uses 924 bytes (2%) of program storage space');

            <option key={port.address} value={port.address}>

              {port.address} {port.desc && `(${port.desc})`}            setTimeout(() => setBuildStatus('idle'), 3000);

            </option>

          ))}    } catch (error) {

        </select>

      </div>      setBuildStatus('error');    }  const [autoUpload, setAutoUpload] = useState(false);



      {isBuilding && (      addBuildOutput(`Compilation failed: ${error}`, 'error');

        <div className="build-progress">

          <div className="progress-header">    } finally {  };

            <div className="progress-phase">

              {buildStatus === 'compiling' ? 'Compiling...' : 'Uploading...'}      setIsBuilding(false);

            </div>

            <div className="progress-percent">{Math.round(buildProgress)}%</div>      setTimeout(() => {  const [verboseOutput, setVerboseOutput] = useState(false);const QuickBuildPanel: React.FC<QuickBuildPanelProps> = ({ isExpanded = false }) => {}

          </div>

          <div className="progress-bar">        setBuildStatus('idle');

            <div 

              className="progress-fill animating"        setBuildProgress(0);  const handleUpload = async () => {

              style={{ 

                width: `${buildProgress}%`,      }, 3000);

                background: buildStatus === 'compiling' ? 

                  'linear-gradient(90deg, #ff8c42, #ff6b1a)' :     }    console.log('Upload clicked', { selectedBoard, selectedPort, project: state.currentProject });  

                  'linear-gradient(90deg, #2196F3, #1976D2)'

              }}  };

            />

          </div>    

        </div>

      )}  const handleUpload = async () => {



      <div className="build-actions">    console.log('Upload started', { selectedBoard, selectedPort, project: state.currentProject });    if (!selectedBoard || !selectedPort || !state.currentProject) {  // Build timing  const { state } = useApp();

        <div className="action-row">

          <button     

            className={`action-btn compile-only ${buildStatus === 'compiling' ? 'compiling' : ''}`}

            onClick={handleCompile}    if (!selectedBoard || !selectedPort || !state.currentProject) {      alert('Please select board, port, and open a project');

            disabled={isBuilding || !selectedBoard}

          >      addBuildOutput('Please select board, port, and open a project', 'error');

            🔨 Compile

          </button>      return;      return;  const buildStartTime = useRef<number>(0);

          <button 

            className={`action-btn upload-only ${buildStatus === 'uploading' ? 'uploading' : ''}`}    }

            onClick={handleUpload}

            disabled={isBuilding || !selectedBoard || !selectedPort}    }

          >

            📤 Upload    setIsBuilding(true);

          </button>

        </div>    setBuildStatus('uploading');  interface BuildMetrics {

      </div>

    setBuildProgress(0);

      {buildOutput.length > 0 && (

        <div className="quick-output">    setIsBuilding(true);

          <div className="output-header">

            <label>Build Output</label>    try {

          </div>

          <div className="output-content">      addBuildOutput(`Uploading to ${selectedPort}...`);    setBuildStatus('uploading');  // Load boards and ports when component mounts

            {buildOutput.slice(-5).map((line, index) => (

              <div key={index} className="output-line">      

                {line}

              </div>      const progressInterval = simulateProgress(3000);

            ))}

          </div>      

        </div>

      )}      // Simulate upload    try {  useEffect(() => {  // Board and port selection  compileTime?: number;

    </div>

  );      await new Promise(resolve => setTimeout(resolve, 3000));

};

            // Simulate upload

export default QuickBuildPanel;
      clearInterval(progressInterval);

      setBuildProgress(100);      await new Promise(resolve => setTimeout(resolve, 3000));    loadBoardsAndPorts();

      setBuildStatus('success');

      addBuildOutput('Upload successful!', 'success');      setBuildStatus('success');

      addBuildOutput('Hard resetting via RTS pin...');

            alert('Upload successful!');  }, [state.mode, state.currentProject]);  const [selectedBoard, setSelectedBoard] = useState<string>('');  uploadTime?: number;

    } catch (error) {

      setBuildStatus('error');    } catch (error) {

      addBuildOutput(`Upload failed: ${error}`, 'error');

    } finally {      setBuildStatus('error');

      setIsBuilding(false);

      setTimeout(() => {      alert('Upload failed!');

        setBuildStatus('idle');

        setBuildProgress(0);    } finally {  // Listen for external build events (F7, F5, menu actions)  const [selectedPort, setSelectedPort] = useState<string>('');  sketchSize?: number;

      }, 3000);

    }      setIsBuilding(false);

  };

      setTimeout(() => setBuildStatus('idle'), 3000);  useEffect(() => {

  const handleCompileAndUpload = async () => {

    await handleCompile();    }

    if (buildStatus === 'success') {

      setTimeout(() => handleUpload(), 1000);  };    const handleBuildEvent = (event: Event) => {  const [availableBoards, setAvailableBoards] = useState<(ArduinoBoard | PlatformIOBoard)[]>([]);  memoryUsage?: number;

    }

  };



  const getStatusText = () => {  const getStatusDisplay = () => {      const customEvent = event as CustomEvent;

    switch (buildStatus) {

      case 'compiling': return 'COMPILING';    switch (buildStatus) {

      case 'uploading': return 'UPLOADING';

      case 'success': return 'SUCCESS';      case 'compiling': return 'COMPILING';      const { action } = customEvent.detail;  const [availablePorts, setAvailablePorts] = useState<(ArduinoPort | PlatformIODevice)[]>([]);  flashUsage?: number;

      case 'error': return 'ERROR';

      default: return 'READY';      case 'uploading': return 'UPLOADING';

    }

  };      case 'success': return 'SUCCESS';      



  // Show no-project message if no project is open      case 'error': return 'ERROR';

  if (!state.currentProject) {

    return (      default: return 'READY';      switch (action) {  const [boardSearchTerm, setBoardSearchTerm] = useState('');}

      <div className="quick-build-panel">

        <div className="panel-header">    }

          <h3>Build Configuration</h3>

        </div>  };        case 'compile':

        <div className="no-project">

          <div className="no-project-icon">🛠️</div>

          <p>No Project Open</p>

          <small>Open a project to enable build functionality</small>  if (!state.mode) {          handleCompile();  

        </div>

      </div>    return (

    );

  }      <div className="quick-build-panel">          break;



  // Show mode selection if no mode is set        <div className="panel-header">

  if (!state.mode) {

    return (          <h3>Build Configuration</h3>        case 'upload':  // Build stateconst QuickBuildPanel: React.FC<QuickBuildPanelProps> = ({ isExpanded = false }) => {

      <div className="quick-build-panel">

        <div className="panel-header">        </div>

          <h3>Build Configuration</h3>

        </div>        <div className="no-mode-message">          handleUpload();

        <div className="no-project">

          <div className="no-project-icon">⚙️</div>          <p>Please select a project type (Arduino or PlatformIO) to enable build functionality</p>

          <p>No Project Type Selected</p>

          <small>Please select Arduino or PlatformIO mode to enable building</small>        </div>          break;  const [isBuilding, setIsBuilding] = useState(false);  const { state } = useApp();

        </div>

      </div>      </div>

    );

  }    );        case 'build-upload':



  // Collapsed view (minimal)  }

  if (!isExpanded) {

    return (          handleCompileAndUpload();  const [buildStatus, setBuildStatus] = useState<'idle' | 'compiling' | 'uploading' | 'success' | 'error'>('idle');  const [selectedBoard, setSelectedBoard] = useState<string>('');

      <div className="quick-build-panel collapsed">

        <div className="panel-header">  return (

          <h3>Build</h3>

          <div className="status-indicator">    <div className={`quick-build-panel ${isExpanded ? 'expanded' : ''}`}>          break;

            <div className={`status-dot ${buildStatus}`}></div>

            <span className="status-text">{getStatusText()}</span>      <div className="panel-header">

          </div>

        </div>        <h3>Build Configuration</h3>        case 'clean':  const [buildProgress, setBuildProgress] = useState(0);  const [selectedPort, setSelectedPort] = useState<string>('');

        

        <div className="quick-actions">        <div className={`build-status ${buildStatus}`}>

          <button 

            className={`quick-btn compile-only ${buildStatus === 'compiling' ? 'compiling' : ''}`}          <span className="status-text">{getStatusDisplay()}</span>          handleClean();

            onClick={handleCompile}

            disabled={isBuilding || !selectedBoard}        </div>

            title="Compile project (F7)"

          >      </div>          break;  const [buildOutput, setBuildOutput] = useState<BuildOutput[]>([]);  const [availableBoards, setAvailableBoards] = useState<(ArduinoBoard | PlatformIOBoard)[]>([]);

            🔨

          </button>

          <button 

            className={`quick-btn upload-only ${buildStatus === 'uploading' ? 'uploading' : ''}`}      <div className="panel-content">      }

            onClick={handleUpload}

            disabled={isBuilding || !selectedBoard || !selectedPort}        {/* Board Selection */}

            title="Upload to board (F5)"

          >        <div className="config-section">    };    const [availablePorts, setAvailablePorts] = useState<(ArduinoPort | PlatformIODevice)[]>([]);

            📤

          </button>          <label className="config-label">Target Board</label>

          <button 

            className="quick-btn compile-upload"          <select 

            onClick={handleCompileAndUpload}

            disabled={isBuilding || !selectedBoard || !selectedPort}            value={selectedBoard} 

            title="Compile and Upload"

          >            onChange={(e) => setSelectedBoard(e.target.value)}    window.addEventListener('triggerBuild', handleBuildEvent);  // Options  const [recentBoards, setRecentBoards] = useState<string[]>([]);

            ⚡

          </button>            className="config-select"

        </div>

            disabled={isBuilding}    return () => window.removeEventListener('triggerBuild', handleBuildEvent);

        {isBuilding && (

          <div className="mini-progress">          >

            <div 

              className="mini-progress-fill"            <option value="">Select board...</option>  }, [selectedBoard, selectedPort]);  const [autoUpload, setAutoUpload] = useState(false);  const [isBuilding, setIsBuilding] = useState(false);

              style={{ 

                width: `${buildProgress}%`,            {mockBoards.map(board => (

                background: buildStatus === 'compiling' ? '#ff8c42' : '#2196F3'

              }}              <option key={board.fqbn} value={board.fqbn}>

            />

          </div>                {board.name}

        )}

      </div>              </option>  const loadBoardsAndPorts = async () => {  const [verboseOutput, setVerboseOutput] = useState(false);  const [buildStatus, setBuildStatus] = useState<BuildStatus>('idle');

    );

  }            ))}



  // Expanded view (full functionality)          </select>    console.log('Loading boards and ports for mode:', state.mode);

  return (

    <div className="quick-build-panel expanded">        </div>

      <div className="panel-header">

        <h3>Build Configuration</h3>        const [buildProgress, setBuildProgress] = useState<number>(0);

        <div className="header-controls">

          <div className="status-indicator">        {/* Port Selection */}

            <div className={`status-dot ${buildStatus}`}></div>

            <span className="status-text">{getStatusText()}</span>        <div className="config-section">    // Mock board data for now - will be replaced with actual service calls

          </div>

        </div>          <label className="config-label">Serial Port</label>

      </div>

          <select     const mockBoards = [  // Services  const [buildMetrics, setBuildMetrics] = useState<BuildMetrics>({});

      {/* Project Info */}

      <div className="project-info">            value={selectedPort} 

        <div className="project-name">{state.currentProject.name}</div>

        <div className="project-mode">{state.mode?.toUpperCase()}</div>            onChange={(e) => setSelectedPort(e.target.value)}      { id: 'arduino:avr:uno', name: 'Arduino Uno', fqbn: 'arduino:avr:uno' },

      </div>

            className="config-select"

      {/* Board Selection */}

      <div className="board-selection">            disabled={isBuilding}      { id: 'arduino:avr:nano', name: 'Arduino Nano', fqbn: 'arduino:avr:nano' },  const arduinoServiceInstance = ArduinoCLIService.getInstance();  const [buildOutput, setBuildOutput] = useState<BuildOutput[]>([]);

        <div className="section-header">

          <label>Target Board</label>          >

          <div className="section-controls">

            <button className="control-btn" title="Refresh boards">↻</button>            <option value="">Select port...</option>      { id: 'arduino:avr:mega', name: 'Arduino Mega 2560', fqbn: 'arduino:avr:mega' },

          </div>

        </div>            {mockPorts.map(port => (

        <select 

          value={selectedBoard}               <option key={port.address} value={port.address}>      { id: 'esp32:esp32:esp32', name: 'ESP32 Dev Module', fqbn: 'esp32:esp32:esp32' },  const platformioServiceInstance = PlatformIOService.getInstance();  const [boardSearchTerm, setBoardSearchTerm] = useState('');

          onChange={(e) => setSelectedBoard(e.target.value)}

          className="board-select"                {port.address} {port.desc && `(${port.desc})`}

          disabled={isBuilding}

        >              </option>    ];

          <option value="">Select board...</option>

          {mockBoards.map(board => (            ))}

            <option key={board.fqbn} value={board.fqbn}>

              {board.name}          </select>        const [autoUpload, setAutoUpload] = useState(false);

            </option>

          ))}        </div>

        </select>

      </div>    // Mock port data



      {/* Port Selection */}        {/* Action Buttons */}

      <div className="port-selection">

        <div className="section-header">        <div className="action-buttons">    const mockPorts = [  // Build timing  const [verboseOutput, setVerboseOutput] = useState(false);

          <label>Serial Port</label>

          <div className="section-controls">          <button 

            <button className="control-btn" title="Refresh ports">↻</button>

          </div>            className="btn-primary"      { address: 'COM3', desc: 'USB Serial Port' },

        </div>

        <select             onClick={handleCompile}

          value={selectedPort} 

          onChange={(e) => setSelectedPort(e.target.value)}            disabled={isBuilding || !selectedBoard}      { address: 'COM4', desc: 'Arduino USB Port' },  const buildStartTime = useRef<number>(0);  

          className="port-select"

          disabled={isBuilding}            title="Compile project (F7)"

        >

          <option value="">Select port...</option>          >      { address: 'COM5', desc: 'ESP32 Serial Port' },

          {mockPorts.map(port => (

            <option key={port.address} value={port.address}>            {isBuilding && buildStatus === 'compiling' ? 'Compiling...' : 'Compile'}

              {port.address} {port.desc && `(${port.desc})`}

            </option>          </button>    ];  const buildStartTime = useRef<number>(0);

          ))}

        </select>          <button 

      </div>

            className="btn-secondary"

      {/* Build Progress */}

      {isBuilding && (            onClick={handleUpload}

        <div className="build-progress">

          <div className="progress-header">            disabled={isBuilding || !selectedBoard || !selectedPort}    setAvailableBoards(mockBoards);  // Load boards and ports when component mounts or mode changes  const uploadStartTime = useRef<number>(0);

            <div className="progress-phase">

              {buildStatus === 'compiling' ? 'Compiling...' : 'Uploading...'}            title="Upload to board (F5)"

            </div>

            <div className="progress-percent">{Math.round(buildProgress)}%</div>          >    setAvailablePorts(mockPorts);

          </div>

          <div className="progress-bar">            {isBuilding && buildStatus === 'uploading' ? 'Uploading...' : 'Upload'}

            <div 

              className="progress-fill animating"          </button>  useEffect(() => {  

              style={{ 

                width: `${buildProgress}%`,        </div>

                background: buildStatus === 'compiling' ? 

                  'linear-gradient(90deg, #ff8c42, #ff6b1a)' :     // Auto-select first available options if none selected

                  'linear-gradient(90deg, #2196F3, #1976D2)'

              }}        {/* Project Info */}

            />

          </div>        {state.currentProject && (    if (!selectedBoard && mockBoards.length > 0) {    loadBoardsAndPorts();  const arduinoServiceInstance = ArduinoCLIService.getInstance();

        </div>

      )}          <div className="project-info">



      {/* Build Actions */}            <small>Project: {state.currentProject.name}</small>      setSelectedBoard(mockBoards[0].fqbn);

      <div className="build-actions">

        <div className="action-row">            <small>Mode: {state.mode}</small>

          <button 

            className={`action-btn compile-only ${buildStatus === 'compiling' ? 'compiling' : ''}`}          </div>    }  }, [state.mode, state.currentProject]);  const platformioServiceInstance = PlatformIOService.getInstance();

            onClick={handleCompile}

            disabled={isBuilding || !selectedBoard}        )}

          >

            🔨 Compile      </div>    

          </button>

          <button     </div>

            className={`action-btn upload-only ${buildStatus === 'uploading' ? 'uploading' : ''}`}

            onClick={handleUpload}  );    if (!selectedPort && mockPorts.length > 0) {

            disabled={isBuilding || !selectedBoard || !selectedPort}

          >};

            📤 Upload

          </button>      setSelectedPort(mockPorts[0].address);

        </div>

        <div className="action-row">export default QuickBuildPanel;

          <button     }  // Listen for external build events (F7, F5, menu actions)  useEffect(() => {

            className="action-btn compile-upload"

            onClick={handleCompileAndUpload}

            disabled={isBuilding || !selectedBoard || !selectedPort}

          >    addBuildOutput('Boards and ports loaded', 'info');  useEffect(() => {    loadBoardsAndPorts();

            ⚡ Build & Upload

          </button>  };

          <button 

            className="action-btn clean-build"    const handleBuildEvent = (event: Event) => {    loadUserPreferences();

            disabled={isBuilding}

          >  const addBuildOutput = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {

            🧹 Clean

          </button>    const output: BuildOutput = {      const customEvent = event as CustomEvent;  }, [state.mode, state.currentProject]);

        </div>

      </div>      message,



      {/* Quick Output */}      type,      const { action } = customEvent.detail;

      {buildOutput.length > 0 && (

        <div className="quick-output">      timestamp: new Date()

          <div className="output-header">

            <label>Build Output</label>    };        useEffect(() => {

          </div>

          <div className="output-content">    

            {buildOutput.map((line, index) => (

              <div key={index} className="output-line">    setBuildOutput(prev => [...prev, output]);      switch (action) {    // Listen for build events from other components

                {line}

              </div>    

            ))}

          </div>    // Dispatch to BottomPanel for display        case 'compile':    const handleBuildEvent = (event: Event) => {

        </div>

      )}    const outputEvent = new CustomEvent('buildOutput', {

    </div>

  );      detail: output          handleCompile();      const customEvent = event as CustomEvent;

};

    });

export default QuickBuildPanel;
    window.dispatchEvent(outputEvent);          break;      const { action } = customEvent.detail;

  };

        case 'upload':      switch (action) {

  const handleCompile = async () => {

    console.log('Starting compilation...', { selectedBoard, selectedPort, project: state.currentProject });          handleUpload();        case 'compile':

    

    if (!selectedBoard || !state.currentProject) {          break;          handleQuickCompile();

      addBuildOutput('Please select a board and open a project', 'error');

      return;        case 'build-upload':          break;

    }

          handleCompileAndUpload();        case 'upload':

    setIsBuilding(true);

    setBuildStatus('compiling');          break;          handleQuickUpload();

    setBuildProgress(0);

    setBuildOutput([]);        case 'clean':          break;

    buildStartTime.current = Date.now();

          handleClean();        case 'build-upload':

    // Progress simulation

    const progressInterval = setInterval(() => {          break;          handleBuildAndUpload();

      setBuildProgress(prev => Math.min(prev + 10, 90));

    }, 200);      }          break;



    try {    };        case 'clean':

      addBuildOutput(`Compiling for ${selectedBoard}...`, 'info');

                handleCleanBuild();

      // Simulate compilation process

      await new Promise(resolve => setTimeout(resolve, 2000));    window.addEventListener('triggerBuild', handleBuildEvent);          break;

      

      clearInterval(progressInterval);    return () => window.removeEventListener('triggerBuild', handleBuildEvent);      }

      setBuildProgress(100);

  }, [selectedBoard, selectedPort]);    };

      const compileTime = Date.now() - buildStartTime.current;

      setBuildStatus('success');

      addBuildOutput(`Compilation successful! (${compileTime}ms)`, 'success');

        const loadBoardsAndPorts = async () => {    window.addEventListener('triggerBuild', handleBuildEvent);

      if (verboseOutput) {

        addBuildOutput('Sketch uses 924 bytes (2%) of program storage space.', 'info');    if (!state.mode) return;    return () => window.removeEventListener('triggerBuild', handleBuildEvent);

        addBuildOutput('Global variables use 9 bytes (0%) of dynamic memory.', 'info');

      }  }, [selectedBoard, selectedPort]);



      // Auto upload if enabled    try {

      if (autoUpload && selectedPort) {

        setTimeout(() => handleUpload(), 1000);      let boards: (ArduinoBoard | PlatformIOBoard)[] = [];  const loadBoardsAndPorts = async () => {

      }

    } catch (error) {      let ports: (ArduinoPort | PlatformIODevice)[] = [];    if (!state.mode) return;

      clearInterval(progressInterval);

      setBuildStatus('error');

      const errorMessage = error instanceof Error ? error.message : String(error);

      addBuildOutput(`Compilation error: ${errorMessage}`, 'error');      if (state.mode === 'arduino') {    try {

    } finally {

      setIsBuilding(false);        const installed = await arduinoServiceInstance.checkInstallation();      let boards: (ArduinoBoard | PlatformIOBoard)[] = [];

      setTimeout(() => {

        setBuildStatus('idle');        if (installed) {      let ports: (ArduinoPort | PlatformIODevice)[] = [];

        setBuildProgress(0);

      }, 3000);          boards = await arduinoServiceInstance.listBoards();

    }

  };          ports = await arduinoServiceInstance.listPorts();      if (state.mode === 'arduino') {



  const handleUpload = async () => {        } else {        const installed = await arduinoServiceInstance.checkInstallation();

    console.log('Starting upload...', { selectedBoard, selectedPort, project: state.currentProject });

              addBuildOutput('Arduino CLI not found. Please install Arduino CLI first.', 'error');        if (installed) {

    if (!selectedBoard || !selectedPort || !state.currentProject) {

      addBuildOutput('Please select board, port, and open a project', 'error');        }          boards = await arduinoServiceInstance.listBoards();

      return;

    }      } else if (state.mode === 'platformio') {          const arduinoPorts = await arduinoServiceInstance.listPorts();



    setIsBuilding(true);        const installed = await platformioServiceInstance.checkInstallation();          ports = arduinoPorts;

    setBuildStatus('uploading');

    setBuildProgress(0);        if (installed) {        } else {



    const progressInterval = setInterval(() => {          boards = await platformioServiceInstance.listAllBoards();          addBuildOutput('Arduino CLI not found. Please install Arduino CLI first.', 'error');

      setBuildProgress(prev => Math.min(prev + 15, 90));

    }, 300);          try {        }



    try {            ports = await platformioServiceInstance.listDevices();      } else if (state.mode === 'platformio') {

      addBuildOutput(`Uploading to ${selectedPort}...`, 'info');

                } catch (error) {        const installed = await platformioServiceInstance.checkInstallation();

      // Simulate upload process

      await new Promise(resolve => setTimeout(resolve, 3000));            console.warn('Failed to load PlatformIO devices:', error);        if (installed) {

      

      clearInterval(progressInterval);          }          boards = await platformioServiceInstance.listAllBoards();

      setBuildProgress(100);

        } else {          try {

      setBuildStatus('success');

      addBuildOutput('Upload successful!', 'success');          addBuildOutput('PlatformIO not found. Please install PlatformIO first.', 'error');            ports = await platformioServiceInstance.listDevices();

      

      if (verboseOutput) {        }          } catch (error) {

        addBuildOutput(`Writing at 0x00008000... (100%)`, 'info');

        addBuildOutput('Hard resetting via RTS pin...', 'info');      }            console.warn('Failed to load PlatformIO devices:', error);

      }

    } catch (error) {          }

      clearInterval(progressInterval);

      setBuildStatus('error');      setAvailableBoards(boards);        } else {

      const errorMessage = error instanceof Error ? error.message : String(error);

      addBuildOutput(`Upload error: ${errorMessage}`, 'error');      setAvailablePorts(ports);          addBuildOutput('PlatformIO not found. Please install PlatformIO first.', 'error');

    } finally {

      setIsBuilding(false);        }

      setTimeout(() => {

        setBuildStatus('idle');      // Auto-select first available options if none selected      }

        setBuildProgress(0);

      }, 3000);      if (!selectedBoard && boards.length > 0) {

    }

  };        const firstBoard = boards[0];      setAvailableBoards(boards);



  const handleCompileAndUpload = async () => {        const boardId = (firstBoard as ArduinoBoard).fqbn || (firstBoard as PlatformIOBoard).id || '';      setAvailablePorts(ports);

    await handleCompile();

    // Upload will be triggered by auto-upload if enabled        setSelectedBoard(boardId);

  };

      }      // Auto-select first available board and port if none selected

  const handleClean = async () => {

    console.log('Cleaning project...', { project: state.currentProject });            if (!selectedBoard && boards.length > 0) {

    

    if (!state.currentProject) {      if (!selectedPort && ports.length > 0) {        setSelectedBoard(boards[0].fqbn || boards[0].id || '');

      addBuildOutput('No project open', 'error');

      return;        const firstPort = ports[0];      }

    }

        const portId = (firstPort as ArduinoPort).address || (firstPort as PlatformIODevice).device || '';      if (!selectedPort && ports.length > 0) {

    setIsBuilding(true);

    setBuildStatus('compiling');        setSelectedPort(portId);        setSelectedPort(ports[0].port || (ports[0] as any).device || '');

    setBuildOutput([]);

      }      }

    try {

      addBuildOutput('Cleaning build files...', 'info');

      

      // Simulate clean process    } catch (error) {    } catch (error) {

      await new Promise(resolve => setTimeout(resolve, 1000));

            console.error('Failed to load boards and ports:', error);      console.error('Failed to load boards and ports:', error);

      addBuildOutput('Clean completed', 'success');

      setBuildStatus('success');      addBuildOutput('Failed to load boards and ports', 'error');      addBuildOutput('Failed to load boards and ports', 'error');

    } catch (error) {

      setBuildStatus('error');    }    }

      const errorMessage = error instanceof Error ? error.message : String(error);

      addBuildOutput(`Clean error: ${errorMessage}`, 'error');  };  };

    } finally {

      setIsBuilding(false);

      setTimeout(() => setBuildStatus('idle'), 2000);

    }  const addBuildOutput = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {  const loadUserPreferences = async () => {

  };

    const output: BuildOutput = {    try {

  const refreshPorts = async () => {

    console.log('Refreshing ports...');      message,      const recent = await window.electronAPI?.store.get('recentBoards') || [];

    try {

      // Mock refresh - will be replaced with actual service calls      type,      const autoUploadPref = await window.electronAPI?.store.get('autoUpload') || false;

      const mockPorts = [

        { address: 'COM3', desc: 'USB Serial Port' },      timestamp: new Date()      const verbosePref = await window.electronAPI?.store.get('verboseOutput') || false;

        { address: 'COM4', desc: 'Arduino USB Port' },

        { address: 'COM5', desc: 'ESP32 Serial Port' },    };      

        { address: 'COM6', desc: 'New Device' },

      ];          setRecentBoards(recent);



      setAvailablePorts(mockPorts);    setBuildOutput(prev => [...prev, output]);      setAutoUpload(autoUploadPref);

      addBuildOutput('Ports refreshed', 'info');

    } catch (error) {          setVerboseOutput(verbosePref);

      addBuildOutput('Failed to refresh ports', 'error');

    }    // Dispatch to BottomPanel for display    } catch (error) {

  };

    const outputEvent = new CustomEvent('buildOutput', {      console.error('Failed to load user preferences:', error);

  const getStatusDisplay = () => {

    switch (buildStatus) {      detail: output    }

      case 'compiling': return 'COMPILING';

      case 'uploading': return 'UPLOADING';    });  };

      case 'success': return 'SUCCESS';

      case 'error': return 'ERROR';    window.dispatchEvent(outputEvent);

      default: return 'READY';

    }  };  const saveRecentBoard = async (board: string) => {

  };

    try {

  // Filter boards based on search term

  const filteredBoards = availableBoards.filter(board =>   const handleCompile = async () => {      const recent = [...recentBoards.filter(b => b !== board), board].slice(-5);

    board.name.toLowerCase().includes(boardSearchTerm.toLowerCase())

  );    if (!selectedBoard || !state.currentProject) {      setRecentBoards(recent);



  if (!state.mode) {      addBuildOutput('Please select a board and open a project', 'error');      await window.electronAPI?.store.set('recentBoards', recent);

    return (

      <div className="quick-build-panel">      return;    } catch (error) {

        <div className="panel-header">

          <h3>Build Configuration</h3>    }      console.error('Failed to save recent board:', error);

        </div>

        <div className="no-mode-message">    }

          <p>Please select a project type (Arduino or PlatformIO) to enable build functionality</p>

        </div>    setIsBuilding(true);  };

      </div>

    );    setBuildStatus('compiling');

  }

    setBuildProgress(0);  const addBuildOutput = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {

  return (

    <div className={`quick-build-panel ${isExpanded ? 'expanded' : ''}`}>    setBuildOutput([]);    const output: BuildOutput = {

      <div className="panel-header">

        <h3>Build Configuration</h3>    buildStartTime.current = Date.now();      message,

        <div className={`build-status ${buildStatus}`}>

          <span className="status-text">{getStatusDisplay()}</span>      type,

        </div>

      </div>    // Progress simulation      timestamp: new Date()



      <div className="panel-content">    const progressInterval = setInterval(() => {    };

        {/* Board Selection */}

        <div className="config-section">      setBuildProgress(prev => Math.min(prev + 10, 90));    

          <label className="config-label">Target Board</label>

          <div className="input-group">    }, 200);    setBuildOutput(prev => [...prev, output]);

            <input

              type="text"    

              className="search-input"

              placeholder="Search boards..."    try {    // Dispatch to BottomPanel

              value={boardSearchTerm}

              onChange={(e) => setBoardSearchTerm(e.target.value)}      addBuildOutput('Starting compilation...', 'info');    const outputEvent = new CustomEvent('buildOutput', {

              disabled={isBuilding}

            />      detail: output

            <select 

              value={selectedBoard}       let result;    });

              onChange={(e) => setSelectedBoard(e.target.value)}

              className="config-select"      if (state.mode === 'arduino') {    window.dispatchEvent(outputEvent);

              disabled={isBuilding}

            >        result = await arduinoServiceInstance.compile(selectedBoard, state.currentProject.path);  };

              <option value="">Select board...</option>

              {filteredBoards.map(board => (      } else if (state.mode === 'platformio') {

                <option key={board.fqbn} value={board.fqbn}>

                  {board.name}        result = await platformioServiceInstance.build(state.currentProject.path);  const handleQuickCompile = async () => {

                </option>

              ))}      }    if (!selectedBoard || !state.currentProject) {

            </select>

            <button       addBuildOutput('Board not selected or no project open', 'error');

              className="refresh-btn"

              onClick={loadBoardsAndPorts}      clearInterval(progressInterval);      return;

              disabled={isBuilding}

              title="Refresh boards"      setBuildProgress(100);    }

            >

              ↻

            </button>

          </div>      const compileTime = Date.now() - buildStartTime.current;    setIsBuilding(true);

        </div>

    setBuildStatus('compiling');

        {/* Port Selection */}

        <div className="config-section">      if (result && result.success) {    setBuildProgress(0);

          <label className="config-label">Serial Port</label>

          <div className="input-group">        setBuildStatus('success');    setBuildOutput([]);

            <select 

              value={selectedPort}         addBuildOutput(`Compilation successful! (${compileTime}ms)`, 'success');    buildStartTime.current = Date.now();

              onChange={(e) => setSelectedPort(e.target.value)}

              className="config-select"        

              disabled={isBuilding}

            >        if (verboseOutput && result.output) {    try {

              <option value="">Select port...</option>

              {availablePorts.map(port => (          addBuildOutput(result.output, 'info');      let result;

                <option key={port.address} value={port.address}>

                  {port.address} {port.desc && `(${port.desc})`}        }      const progressInterval = setInterval(() => {

                </option>

              ))}        setBuildProgress(prev => Math.min(prev + 10, 90));

            </select>

            <button         // Auto upload if enabled      }, 200);

              className="refresh-btn"

              onClick={refreshPorts}        if (autoUpload && selectedPort) {

              disabled={isBuilding}

              title="Refresh ports"          setTimeout(() => handleUpload(), 1000);      addBuildOutput('Starting compilation...', 'info');

            >

              ↻        }

            </button>

          </div>      } else {      if (state.mode === 'arduino') {

        </div>

        setBuildStatus('error');        result = await arduinoServiceInstance.compile(

        {/* Build Progress */}

        {isBuilding && (        addBuildOutput('Compilation failed', 'error');          selectedBoard,

          <div className="build-progress">

            <div className="progress-bar">        if (result && result.error) {          state.currentProject.path

              <div 

                className="progress-fill"           addBuildOutput(result.error, 'error');        );

                style={{ width: `${buildProgress}%` }}

              />        }      } else if (state.mode === 'platformio') {

            </div>

            <span className="progress-text">{buildProgress}%</span>      }        result = await platformioServiceInstance.build(

          </div>

        )}    } catch (error) {          state.currentProject.path



        {/* Action Buttons */}      clearInterval(progressInterval);        );

        <div className="action-buttons">

          <button       setBuildStatus('error');      }

            className="btn-primary"

            onClick={handleCompile}      const errorMessage = error instanceof Error ? error.message : String(error);

            disabled={isBuilding || !selectedBoard}

            title="Compile project (F7)"      addBuildOutput(`Compilation error: ${errorMessage}`, 'error');      clearInterval(progressInterval);

          >

            Compile    } finally {      setBuildProgress(100);

          </button>

          <button       setIsBuilding(false);

            className="btn-secondary"

            onClick={handleUpload}      setTimeout(() => {      const compileTime = Date.now() - buildStartTime.current;

            disabled={isBuilding || !selectedBoard || !selectedPort}

            title="Upload to board (F5)"        setBuildStatus('idle');      const newMetrics = {

          >

            Upload        setBuildProgress(0);        ...buildMetrics,

          </button>

          <button       }, 3000);        compileTime,

            className="btn-tertiary"

            onClick={handleCompileAndUpload}    }        sketchSize: result.bytes || buildMetrics.sketchSize,

            disabled={isBuilding || !selectedBoard || !selectedPort}

            title="Compile and Upload"  };        memoryUsage: result.memoryUsage || buildMetrics.memoryUsage,

          >

            Build & Upload        flashUsage: result.flashUsage || buildMetrics.flashUsage

          </button>

        </div>  const handleUpload = async () => {      };



        {/* Build Options */}    if (!selectedBoard || !selectedPort || !state.currentProject) {

        <div className="build-options">

          <label className="option-label">      addBuildOutput('Please select board, port, and open a project', 'error');      setBuildMetrics(newMetrics);

            <input 

              type="checkbox"      return;      await saveRecentBoard(selectedBoard);

              checked={autoUpload}

              onChange={(e) => setAutoUpload(e.target.checked)}    }

              disabled={isBuilding}

            />      if (result.success) {

            Auto-upload after compilation

          </label>    setIsBuilding(true);        setBuildStatus('success');

          <label className="option-label">

            <input     setBuildStatus('uploading');        addBuildOutput(`Compilation successful! (${compileTime}ms)`, 'success');

              type="checkbox"

              checked={verboseOutput}    setBuildProgress(0);        if (result.bytes) {

              onChange={(e) => setVerboseOutput(e.target.checked)}

              disabled={isBuilding}          addBuildOutput(`Sketch uses ${result.bytes} bytes of program storage space`, 'info');

            />

            Verbose output    const progressInterval = setInterval(() => {        }

          </label>

        </div>      setBuildProgress(prev => Math.min(prev + 15, 90));        if (result.warnings && result.warnings.length > 0) {



        {/* Recent Build Output */}    }, 300);          result.warnings.forEach((warning: string) => {

        {buildOutput.length > 0 && (

          <div className="recent-output">            addBuildOutput(warning, 'warning');

            <div className="output-header">Recent Output</div>

            <div className="output-list">    try {          });

              {buildOutput.slice(-3).map((output, index) => (

                <div key={index} className={`output-item ${output.type}`}>      addBuildOutput(`Starting upload to ${selectedPort}...`, 'info');        }

                  <span className="output-time">

                    {output.timestamp.toLocaleTimeString()}

                  </span>

                  <span className="output-message">{output.message}</span>      let result;        if (autoUpload && selectedPort) {

                </div>

              ))}      if (state.mode === 'arduino') {          setTimeout(() => handleQuickUpload(), 500);

            </div>

          </div>        result = await arduinoServiceInstance.upload(selectedBoard, selectedPort, state.currentProject.path);        }

        )}

      </div>      } else if (state.mode === 'platformio') {      } else {

    </div>

  );        result = await platformioServiceInstance.upload(state.currentProject.path);        setBuildStatus('error');

};

      }        addBuildOutput('Compilation failed', 'error');

export default QuickBuildPanel;
        if (result.error) {

      clearInterval(progressInterval);          addBuildOutput(result.error, 'error');

      setBuildProgress(100);        }

      }

      if (result && result.success) {    } catch (error) {

        setBuildStatus('success');      setBuildStatus('error');

        addBuildOutput('Upload successful!', 'success');      const errorMessage = error instanceof Error ? error.message : String(error);

              addBuildOutput(`Compilation error: ${errorMessage}`, 'error');

        if (verboseOutput && result.output) {    } finally {

          addBuildOutput(result.output, 'info');      setIsBuilding(false);

        }      setTimeout(() => {

      } else {        setBuildStatus('idle');

        setBuildStatus('error');        setBuildProgress(0);

        addBuildOutput('Upload failed', 'error');      }, 3000);

        if (result && result.error) {    }

          addBuildOutput(result.error, 'error');  };

        }

      }  const handleQuickUpload = async () => {

    } catch (error) {    if (!selectedBoard || !selectedPort || !state.currentProject) {

      clearInterval(progressInterval);      addBuildOutput('Board, port not selected or no project open', 'error');

      setBuildStatus('error');      return;

      const errorMessage = error instanceof Error ? error.message : String(error);    }

      addBuildOutput(`Upload error: ${errorMessage}`, 'error');

    } finally {    setIsBuilding(true);

      setIsBuilding(false);    setBuildStatus('uploading');

      setTimeout(() => {    setBuildProgress(0);

        setBuildStatus('idle');    uploadStartTime.current = Date.now();

        setBuildProgress(0);

      }, 3000);    try {

    }      let result;

  };      const progressInterval = setInterval(() => {

        setBuildProgress(prev => Math.min(prev + 15, 90));

  const handleCompileAndUpload = async () => {      }, 300);

    await handleCompile();

    // Upload will be triggered by auto-upload if enabled, or manually      addBuildOutput('Starting upload...', 'info');

  };

      if (state.mode === 'arduino') {

  const handleClean = async () => {        result = await arduinoServiceInstance.upload(

    if (!state.currentProject) {          selectedBoard,

      addBuildOutput('No project open', 'error');          selectedPort,

      return;          state.currentProject.path

    }        );

      } else if (state.mode === 'platformio') {

    setIsBuilding(true);        result = await platformioServiceInstance.upload(

    setBuildStatus('compiling');          state.currentProject.path

    setBuildOutput([]);        );

      }

    try {

      addBuildOutput('Cleaning build files...', 'info');      clearInterval(progressInterval);

      setBuildProgress(100);

      if (state.mode === 'platformio') {

        await platformioServiceInstance.clean(state.currentProject.path);      const uploadTime = Date.now() - uploadStartTime.current;

        addBuildOutput('Clean completed', 'success');      const newMetrics = {

      } else {        ...buildMetrics,

        // Arduino doesn't have explicit clean        uploadTime

        addBuildOutput('Clean not available for Arduino projects', 'warning');      };

      }

      setBuildStatus('success');      setBuildMetrics(newMetrics);

    } catch (error) {

      setBuildStatus('error');      if (result.success) {

      const errorMessage = error instanceof Error ? error.message : String(error);        setBuildStatus('success');

      addBuildOutput(`Clean error: ${errorMessage}`, 'error');        addBuildOutput(`Upload successful! (${uploadTime}ms)`, 'success');

    } finally {      } else {

      setIsBuilding(false);        setBuildStatus('error');

      setTimeout(() => setBuildStatus('idle'), 2000);        addBuildOutput('Upload failed', 'error');

    }        if (result.error) {

  };          addBuildOutput(result.error, 'error');

        }

  const refreshPorts = async () => {      }

    try {    } catch (error) {

      let ports: (ArduinoPort | PlatformIODevice)[] = [];      setBuildStatus('error');

      const errorMessage = error instanceof Error ? error.message : String(error);

      if (state.mode === 'arduino') {      addBuildOutput(`Upload error: ${errorMessage}`, 'error');

        ports = await arduinoServiceInstance.listPorts();    } finally {

      } else if (state.mode === 'platformio') {      setIsBuilding(false);

        ports = await platformioServiceInstance.listDevices();      setTimeout(() => {

      }        setBuildStatus('idle');

        setBuildProgress(0);

      setAvailablePorts(ports);      }, 3000);

      addBuildOutput('Ports refreshed', 'info');    }

    } catch (error) {  };

      addBuildOutput('Failed to refresh ports', 'error');

    }  const handleBuildAndUpload = async () => {

  };    await handleQuickCompile();

    if (buildStatus === 'success') {

  const getStatusDisplay = () => {      setTimeout(() => handleQuickUpload(), 1000);

    switch (buildStatus) {    }

      case 'compiling': return 'COMPILING';  };

      case 'uploading': return 'UPLOADING';

      case 'success': return 'SUCCESS';  const handleCleanBuild = async () => {

      case 'error': return 'ERROR';    if (!state.currentProject) {

      default: return 'READY';      addBuildOutput('No project open', 'error');

    }      return;

  };    }



  // Filter boards based on search term    setIsBuilding(true);

  const filteredBoards = availableBoards.filter(board =>     setBuildStatus('compiling');

    board.name.toLowerCase().includes(boardSearchTerm.toLowerCase())    setBuildOutput([]);

  );

    try {

  if (!state.mode) {      addBuildOutput('Cleaning build files...', 'info');

    return (

      <div className="quick-build-panel">      if (state.mode === 'arduino') {

        <div className="panel-header">        // Arduino doesn't have explicit clean, just recompile

          <h3>Build Configuration</h3>        await handleQuickCompile();

        </div>      } else if (state.mode === 'platformio') {

        <div className="no-mode-message">        await platformioServiceInstance.clean(state.currentProject.path);

          <p>Please select a project type (Arduino or PlatformIO) to enable build functionality</p>        addBuildOutput('Clean completed', 'success');

        </div>        setBuildStatus('success');

      </div>      }

    );    } catch (error) {

  }      setBuildStatus('error');

      const errorMessage = error instanceof Error ? error.message : String(error);

  return (      addBuildOutput(`Clean error: ${errorMessage}`, 'error');

    <div className={`quick-build-panel ${isExpanded ? 'expanded' : ''}`}>    } finally {

      <div className="panel-header">      setIsBuilding(false);

        <h3>Build Configuration</h3>      setTimeout(() => {

        <div className={`build-status ${buildStatus}`}>        setBuildStatus('idle');

          <span className="status-text">{getStatusDisplay()}</span>      }, 2000);

        </div>    }

      </div>  };



      <div className="panel-content">  const refreshPorts = async () => {

        {/* Board Selection */}    try {

        <div className="config-section">      let ports: (ArduinoPort | PlatformIODevice)[] = [];

          <label className="config-label">Target Board</label>

          <div className="input-group">      if (state.mode === 'arduino') {

            <input        ports = await arduinoServiceInstance.listPorts();

              type="text"      } else if (state.mode === 'platformio') {

              className="search-input"        ports = await platformioServiceInstance.listDevices();

              placeholder="Search boards..."      }

              value={boardSearchTerm}

              onChange={(e) => setBoardSearchTerm(e.target.value)}      setAvailablePorts(ports);

              disabled={isBuilding}      addBuildOutput('Ports refreshed', 'info');

            />    } catch (error) {

            <select       addBuildOutput('Failed to refresh ports', 'error');

              value={selectedBoard}     }

              onChange={(e) => setSelectedBoard(e.target.value)}  };

              className="config-select"

              disabled={isBuilding}  const getStatusIcon = () => {

            >    switch (buildStatus) {

              <option value="">Select board...</option>      case 'compiling': return 'COMPILING';

              {filteredBoards.map(board => {      case 'uploading': return 'UPLOADING';

                const boardId = (board as ArduinoBoard).fqbn || (board as PlatformIOBoard).id || '';      case 'success': return 'SUCCESS';

                return (      case 'error': return 'ERROR';

                  <option key={boardId} value={boardId}>      case 'warning': return 'WARNING';

                    {board.name}      default: return 'READY';

                  </option>    }

                );  };

              })}

            </select>  const getStatusClass = () => {

            <button     switch (buildStatus) {

              className="refresh-btn"      case 'compiling': 

              onClick={loadBoardsAndPorts}      case 'uploading': 

              disabled={isBuilding}        return 'building';

              title="Refresh boards"      case 'success': return 'success';

            >      case 'error': return 'error';

              ↻      case 'warning': return 'warning';

            </button>      default: return 'idle';

          </div>    }

        </div>  };



        {/* Port Selection */}  if (!state.mode) {

        <div className="config-section">    return (

          <label className="config-label">Serial Port</label>      <div className="quick-build-panel">

          <div className="input-group">        <div className="panel-header">

            <select           <h3>Build Configuration</h3>

              value={selectedPort}         </div>

              onChange={(e) => setSelectedPort(e.target.value)}        <div className="no-mode-message">

              className="config-select"          Please select a project type to enable build functionality

              disabled={isBuilding}        </div>

            >      </div>

              <option value="">Select port...</option>    );

              {availablePorts.map(port => {  }

                const portId = (port as ArduinoPort).address || (port as PlatformIODevice).device || '';

                const portDesc = (port as ArduinoPort).desc || (port as PlatformIODevice).description || '';  const filteredBoards = availableBoards.filter(board => 

                return (    (board.name || board.id || '').toLowerCase().includes(boardSearchTerm.toLowerCase())

                  <option key={portId} value={portId}>  );

                    {portId} {portDesc && `(${portDesc})`}

                  </option>  return (

                );    <div className={`quick-build-panel ${isExpanded ? 'expanded' : ''}`}>

              })}      <div className="panel-header">

            </select>        <h3>Build Configuration</h3>

            <button         <div className={`build-status ${getStatusClass()}`}>

              className="refresh-btn"          <span className="status-indicator">{getStatusIcon()}</span>

              onClick={refreshPorts}        </div>

              disabled={isBuilding}      </div>

              title="Refresh ports"

            >      <div className="panel-content">

              ↻        {/* Board Selection */}

            </button>        <div className="config-section">

          </div>          <label className="config-label">Target Board</label>

        </div>          <div className="board-selector">

            <input

        {/* Build Progress */}              type="text"

        {isBuilding && (              className="search-input"

          <div className="build-progress">              placeholder="Search boards..."

            <div className="progress-bar">              value={boardSearchTerm}

              <div               onChange={(e) => setBoardSearchTerm(e.target.value)}

                className="progress-fill"               disabled={isBuilding}

                style={{ width: `${buildProgress}%` }}            />

              />            <select 

            </div>              value={selectedBoard} 

            <span className="progress-text">{buildProgress}%</span>              onChange={(e) => setSelectedBoard(e.target.value)}

          </div>              className="config-select"

        )}              disabled={isBuilding}

            >

        {/* Action Buttons */}              <option value="">Select board...</option>

        <div className="action-buttons">              {recentBoards.length > 0 && (

          <button                 <optgroup label="Recent">

            className="btn-primary"                  {recentBoards.map(board => (

            onClick={handleCompile}                    <option key={`recent-${board}`} value={board}>

            disabled={isBuilding || !selectedBoard}                      {availableBoards.find(b => (b.fqbn || b.id) === board)?.name || board}

            title="Compile project (F7)"                    </option>

          >                  ))}

            Compile                </optgroup>

          </button>              )}

          <button               <optgroup label="Available Boards">

            className="btn-secondary"                {filteredBoards.map(board => (

            onClick={handleUpload}                  <option key={board.fqbn || board.id} value={board.fqbn || board.id}>

            disabled={isBuilding || !selectedBoard || !selectedPort}                    {board.name}

            title="Upload to board (F5)"                  </option>

          >                ))}

            Upload              </optgroup>

          </button>            </select>

          <button             <button 

            className="btn-tertiary"              className="refresh-btn"

            onClick={handleCompileAndUpload}              onClick={loadBoardsAndPorts}

            disabled={isBuilding || !selectedBoard || !selectedPort}              disabled={isBuilding}

            title="Compile and Upload"              title="Refresh boards"

          >            >

            Build & Upload              ↻

          </button>            </button>

        </div>          </div>

        </div>

        {/* Build Options */}

        <div className="build-options">        {/* Port Selection */}

          <label className="option-label">        <div className="config-section">

            <input           <label className="config-label">Serial Port</label>

              type="checkbox"          <div className="port-selector">

              checked={autoUpload}            <select 

              onChange={(e) => setAutoUpload(e.target.checked)}              value={selectedPort} 

              disabled={isBuilding}              onChange={(e) => setSelectedPort(e.target.value)}

            />              className="config-select"

            Auto-upload after compilation              disabled={isBuilding}

          </label>            >

          <label className="option-label">              <option value="">Select port...</option>

            <input               {availablePorts.map(port => (

              type="checkbox"                <option key={port.port || (port as any).device} value={port.port || (port as any).device}>

              checked={verboseOutput}                  {port.port || (port as any).device} 

              onChange={(e) => setVerboseOutput(e.target.checked)}                  {port.desc && ` (${port.desc})`}

              disabled={isBuilding}                </option>

            />              ))}

            Verbose output            </select>

          </label>            <button 

        </div>              className="refresh-btn"

              onClick={refreshPorts}

        {/* Recent Build Output */}              disabled={isBuilding}

        {buildOutput.length > 0 && (              title="Refresh ports"

          <div className="recent-output">            >

            <div className="output-header">Recent Output</div>              ↻

            <div className="output-list">            </button>

              {buildOutput.slice(-3).map((output, index) => (          </div>

                <div key={index} className={`output-item ${output.type}`}>        </div>

                  <span className="output-time">

                    {output.timestamp.toLocaleTimeString()}        {/* Build Progress */}

                  </span>        {isBuilding && (

                  <span className="output-message">{output.message}</span>          <div className="build-progress">

                </div>            <div className="progress-bar">

              ))}              <div 

            </div>                className="progress-fill" 

          </div>                style={{ width: `${buildProgress}%` }}

        )}              />

      </div>            </div>

    </div>            <span className="progress-text">{buildProgress}%</span>

  );          </div>

};        )}



export default QuickBuildPanel;        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            className="btn-primary"
            onClick={handleQuickCompile}
            disabled={isBuilding || !selectedBoard}
            title="Compile (F7)"
          >
            Compile
          </button>
          <button 
            className="btn-secondary"
            onClick={handleQuickUpload}
            disabled={isBuilding || !selectedBoard || !selectedPort}
            title="Upload (F5)"
          >
            Upload
          </button>
          <button 
            className="btn-tertiary"
            onClick={handleBuildAndUpload}
            disabled={isBuilding || !selectedBoard || !selectedPort}
            title="Compile & Upload"
          >
            Build & Upload
          </button>
        </div>

        {/* Build Options */}
        <div className="build-options">
          <label className="option-label">
            <input 
              type="checkbox"
              checked={autoUpload}
              onChange={(e) => setAutoUpload(e.target.checked)}
            />
            Auto-upload after compilation
          </label>
          <label className="option-label">
            <input 
              type="checkbox"
              checked={verboseOutput}
              onChange={(e) => setVerboseOutput(e.target.checked)}
            />
            Verbose output
          </label>
        </div>

        {/* Build Metrics */}
        {(buildMetrics.compileTime || buildMetrics.sketchSize) && (
          <div className="build-metrics">
            <div className="metrics-header">Last Build</div>
            <div className="metrics-grid">
              {buildMetrics.compileTime && (
                <div className="metric">
                  <span className="metric-label">Compile Time</span>
                  <span className="metric-value">{buildMetrics.compileTime}ms</span>
                </div>
              )}
              {buildMetrics.sketchSize && (
                <div className="metric">
                  <span className="metric-label">Sketch Size</span>
                  <span className="metric-value">{buildMetrics.sketchSize} bytes</span>
                </div>
              )}
              {buildMetrics.memoryUsage && (
                <div className="metric">
                  <span className="metric-label">Memory Usage</span>
                  <span className="metric-value">{buildMetrics.memoryUsage}%</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickBuildPanel;
          </button>
        </div>
      ) : currentStep === 'confirming' ? (
        <div className="confirm-content">
          <div className="confirm-box">
            <h4>ビルド確認</h4>
            <div className="confirm-item">
              <span className="label">プロジェクト:</span>
              <span className="value">{state.currentProject?.name}</span>
            </div>
            <div className="confirm-item">
              <span className="label">ボード:</span>
              <span className="value">{selectedBoard}</span>
            </div>
            {selectedPort && (
              <div className="confirm-item">
                <span className="label">ポート:</span>
                <span className="value">{selectedPort}</span>
              </div>
            )}
          </div>

          <div className="action-buttons">
            <button className="btn-secondary" onClick={handleReset}>
              キャンセル
            </button>
            <button className="btn-primary" onClick={handleConfirmBuild}>
              ビルド実行
            </button>
          </div>
        </div>
      ) : currentStep === 'building' ? (
        <div className="building-content">
          <div className="progress">
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
          </div>
          <p className="status-message">ビルド中...</p>
          <div className="output-box">
            <pre>{buildOutput}</pre>
          </div>
        </div>
      ) : currentStep === 'complete' ? (
        <div className="result-content success">
          <div className="result-icon">✓</div>
          <h4>ビルド完了</h4>
          <p>コンパイルに成功しました</p>
          <button className="btn-primary" onClick={handleReset}>
            完了
          </button>
        </div>
      ) : currentStep === 'error' ? (
        <div className="result-content error">
          <div className="result-icon">✗</div>
          <h4>ビルド失敗</h4>
          {buildError && <p className="error-text">{buildError}</p>}
          <div className="output-box">
            <pre>{buildOutput}</pre>
          </div>
          <button className="btn-primary" onClick={handleReset}>
            戻る
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default QuickBuildPanel;

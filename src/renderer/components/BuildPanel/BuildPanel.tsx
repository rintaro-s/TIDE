import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import './BuildPanel.css';

interface BuildPanelProps {
  isExpanded?: boolean;
}

interface Board {
  fqbn: string;
  name: string;
  platform?: string;
}

interface Port {
  address: string;
  protocol: string;
  description?: string;
}

interface BuildCache {
  board: string;
  project: string;
  binaryPath: string;
  timestamp: number;
}

const BuildPanel: React.FC<BuildPanelProps> = ({ isExpanded = false }) => {
  const { state } = useApp();
  
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [boards, setBoards] = useState<Board[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildOutput, setBuildOutput] = useState<string>('');
  const [showOutput, setShowOutput] = useState(true);
  const [isLoadingBoards, setIsLoadingBoards] = useState(false);
  const [isLoadingPorts, setIsLoadingPorts] = useState(false);
  const [buildCache, setBuildCache] = useState<BuildCache | null>(null);

  useEffect(() => {
    loadBoards();
    loadPorts();
    loadBuildCache();
  }, [state.mode]);

  const addOutput = (text: string) => {
    setBuildOutput(prev => prev + text + '\n');
    console.log('[BuildPanel]', text);
  };

  const loadBuildCache = () => {
    const cached = localStorage.getItem('buildCache');
    if (cached) {
      try {
        const cache = JSON.parse(cached);
        setBuildCache(cache);
        addOutput(`Cached build found: ${new Date(cache.timestamp).toLocaleString()}`);
      } catch (e) {
        console.error('Failed to parse cache:', e);
      }
    }
  };

  const saveBuildCache = (binaryPath: string) => {
    if (!state.currentProject || !selectedBoard) return;
    
    const cache: BuildCache = {
      board: selectedBoard,
      project: state.currentProject.path,
      binaryPath,
      timestamp: Date.now()
    };
    
    setBuildCache(cache);
    localStorage.setItem('buildCache', JSON.stringify(cache));
    addOutput(`Build cached: ${binaryPath}`);
  };

  const loadBoards = async () => {
    setIsLoadingBoards(true);
    addOutput('Loading boards...');

    try {
      if (state.mode === 'arduino') {
        const result = await window.electronAPI.executeCommand('arduino-cli board listall --format json');
        if (result.success && result.output) {
          const data = JSON.parse(result.output);
          const boardList: Board[] = data.boards?.map((b: any) => ({
            fqbn: b.fqbn,
            name: b.name,
            platform: b.platform
          })) || [];
          setBoards(boardList);
          addOutput(`Loaded ${boardList.length} Arduino boards`);
          if (boardList.length > 0 && !selectedBoard) {
            setSelectedBoard(boardList[0].fqbn);
          }
        }
      } else if (state.mode === 'platformio') {
        const result = await window.electronAPI.executeCommand('pio boards --json-output');
        if (result.success && result.output) {
          const data = JSON.parse(result.output);
          const boardList: Board[] = Object.values(data).map((b: any) => ({
            fqbn: b.id,
            name: b.name,
            platform: b.platform
          }));
          setBoards(boardList);
          addOutput(`Loaded ${boardList.length} PlatformIO boards`);
          if (boardList.length > 0 && !selectedBoard) {
            setSelectedBoard(boardList[0].fqbn);
          }
        }
      }
    } catch (error) {
      addOutput(`Failed to load boards: ${error}`);
      console.error('Board loading error:', error);
    } finally {
      setIsLoadingBoards(false);
    }
  };

  const loadPorts = async () => {
    setIsLoadingPorts(true);
    addOutput('Scanning ports...');

    try {
      if (state.mode === 'arduino') {
        const result = await window.electronAPI.executeCommand('arduino-cli board list --format json');
        if (result.success && result.output) {
          const data = JSON.parse(result.output);
          const portList: Port[] = data.detected_ports?.map((p: any) => ({
            address: p.port.address,
            protocol: p.port.protocol,
            description: p.port.label || p.matching_boards?.[0]?.name
          })) || [];
          setPorts(portList);
          addOutput(`Found ${portList.length} ports`);
          if (portList.length > 0 && !selectedPort) {
            setSelectedPort(portList[0].address);
          }
        }
      } else if (state.mode === 'platformio') {
        const result = await window.electronAPI.executeCommand('pio device list --json-output');
        if (result.success && result.output) {
          const data = JSON.parse(result.output);
          const portList: Port[] = data.map((p: any) => ({
            address: p.port,
            protocol: 'serial',
            description: p.description
          }));
          setPorts(portList);
          addOutput(`Found ${portList.length} ports`);
          if (portList.length > 0 && !selectedPort) {
            setSelectedPort(portList[0].address);
          }
        }
      }
    } catch (error) {
      addOutput(`Failed to scan ports: ${error}`);
      console.error('Port scanning error:', error);
    } finally {
      setIsLoadingPorts(false);
    }
  };

  const handleCompile = async () => {
    if (!state.currentProject) {
      addOutput('ERROR: No project open');
      return;
    }

    if (!selectedBoard) {
      addOutput('ERROR: No board selected');
      return;
    }

    setIsBuilding(true);
    setBuildOutput('');
    setShowOutput(true);
    
    addOutput(`Starting compilation...`);
    addOutput(`Project: ${state.currentProject.name}`);
    addOutput(`Board: ${selectedBoard}`);
    addOutput(`Path: ${state.currentProject.path}`);
    addOutput('---');

    try {
      let result;
      
      if (state.mode === 'arduino') {
        const cmd = `arduino-cli compile --fqbn ${selectedBoard} "${state.currentProject.path}"`;
        addOutput(`Command: ${cmd}`);
        result = await window.electronAPI.executeCommand(cmd);
      } else if (state.mode === 'platformio') {
        const cmd = `pio run -d "${state.currentProject.path}"`;
        addOutput(`Command: ${cmd}`);
        result = await window.electronAPI.executeCommand(cmd);
      }

      if (result?.success) {
        addOutput('---');
        addOutput('COMPILATION SUCCESSFUL');
        if (result.output) {
          addOutput(result.output);
        }
        
        // Save to cache
        const binaryPath = state.mode === 'arduino' 
          ? `${state.currentProject.path}/build`
          : `${state.currentProject.path}/.pio/build`;
        saveBuildCache(binaryPath);
      } else {
        addOutput('---');
        addOutput('COMPILATION FAILED');
        if (result?.error) {
          addOutput(result.error);
        }
      }
    } catch (error) {
      addOutput('---');
      addOutput(`COMPILATION ERROR: ${error}`);
      console.error('Compilation error:', error);
    } finally {
      setIsBuilding(false);
    }
  };

  const handleUpload = async () => {
    if (!state.currentProject) {
      addOutput('ERROR: No project open');
      return;
    }

    if (!selectedBoard) {
      addOutput('ERROR: No board selected');
      return;
    }

    if (!selectedPort) {
      addOutput('ERROR: No port selected');
      return;
    }

    // Check if we have cached build
    const canUseCached = buildCache && 
      buildCache.board === selectedBoard && 
      buildCache.project === state.currentProject.path;

    if (!canUseCached) {
      addOutput('No cached build found. Compiling first...');
      await handleCompile();
      if (!buildCache) return;
    }

    setIsBuilding(true);
    if (!showOutput) {
      setBuildOutput('');
      setShowOutput(true);
    }
    
    addOutput('---');
    addOutput(`Starting upload...`);
    addOutput(`Port: ${selectedPort}`);
    addOutput(`Board: ${selectedBoard}`);
    addOutput('---');

    try {
      let result;
      
      if (state.mode === 'arduino') {
        const cmd = `arduino-cli upload -p ${selectedPort} --fqbn ${selectedBoard} "${state.currentProject.path}"`;
        addOutput(`Command: ${cmd}`);
        result = await window.electronAPI.executeCommand(cmd);
      } else if (state.mode === 'platformio') {
        const cmd = `pio run -d "${state.currentProject.path}" -t upload --upload-port ${selectedPort}`;
        addOutput(`Command: ${cmd}`);
        result = await window.electronAPI.executeCommand(cmd);
      }

      if (result?.success) {
        addOutput('---');
        addOutput('UPLOAD SUCCESSFUL');
        if (result.output) {
          addOutput(result.output);
        }
      } else {
        addOutput('---');
        addOutput('UPLOAD FAILED');
        if (result?.error) {
          addOutput(result.error);
        }
      }
    } catch (error) {
      addOutput('---');
      addOutput(`UPLOAD ERROR: ${error}`);
      console.error('Upload error:', error);
    } finally {
      setIsBuilding(false);
    }
  };

  const handleCompileAndUpload = async () => {
    await handleCompile();
    if (buildCache) {
      await new Promise(r => setTimeout(r, 500));
      await handleUpload();
    }
  };

  const handleClearCache = () => {
    localStorage.removeItem('buildCache');
    setBuildCache(null);
    addOutput('Build cache cleared');
  };

  return (
    <div className="build-panel">
      <div className="panel-header">
        <h3>ビルド・書き込み</h3>
        <div className="panel-mode">{state.mode === 'arduino' ? 'Arduino' : state.mode === 'platformio' ? 'PlatformIO' : '設定なし'}</div>
      </div>
      
      <div className="config-section">
        <div className="config-row">
          <label>マイコンボード</label>
          <div className="config-controls">
            <select 
              value={selectedBoard} 
              onChange={e => setSelectedBoard(e.target.value)}
              disabled={isLoadingBoards || isBuilding}
            >
              {boards.length === 0 ? (
                <option value="">ボードがありません</option>
              ) : (
                <>
                  <option value="">選択してください</option>
                  {boards.map(b => (
                    <option key={b.fqbn} value={b.fqbn}>
                      {b.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            <button 
              onClick={loadBoards} 
              disabled={isLoadingBoards || isBuilding}
              className="btn-refresh"
              title="ボード一覧を更新"
            >
              {isLoadingBoards ? '読込中...' : '更新'}
            </button>
          </div>
          {boards.length > 0 && (
            <div className="config-hint">{boards.length}個のボードが利用可能</div>
          )}
        </div>

        <div className="config-row">
          <label>接続ポート</label>
          <div className="config-controls">
            <select 
              value={selectedPort} 
              onChange={e => setSelectedPort(e.target.value)}
              disabled={isLoadingPorts || isBuilding}
            >
              {ports.length === 0 ? (
                <option value="">ポートが見つかりません</option>
              ) : (
                <>
                  <option value="">選択してください</option>
                  {ports.map(p => (
                    <option key={p.address} value={p.address}>
                      {p.address} {p.description && `- ${p.description}`}
                    </option>
                  ))}
                </>
              )}
            </select>
            <button 
              onClick={loadPorts} 
              disabled={isLoadingPorts || isBuilding}
              className="btn-refresh"
              title="ポート一覧を更新"
            >
              {isLoadingPorts ? '読込中...' : '更新'}
            </button>
          </div>
          {ports.length > 0 && (
            <div className="config-hint">{ports.length}個のポートを検出</div>
          )}
        </div>
      </div>

      <div className="action-section">
        <button 
          onClick={handleCompile} 
          disabled={isBuilding || !selectedBoard}
          className="btn-action btn-compile"
          title="プログラムをビルド（コンパイル）して実行ファイルを生成"
        >
          {isBuilding ? 'ビルド中...' : 'ビルドのみ'}
        </button>
        <button 
          onClick={handleCompileAndUpload} 
          disabled={isBuilding || !selectedBoard || !selectedPort}
          className="btn-action btn-both"
          title="ビルドしてマイコンに書き込む（最もよく使います）"
        >
          {isBuilding ? '処理中...' : 'ビルド＆書き込み'}
        </button>
        <button 
          onClick={handleUpload} 
          disabled={isBuilding || !selectedPort}
          className="btn-action btn-upload"
          title="前回ビルドしたファイルを書き込む（高速）"
        >
          {isBuilding ? '書き込み中...' : '書き込みのみ'}
        </button>
      </div>

      {buildCache && buildCache.board === selectedBoard && (
        <div className="cache-status">
          <span>前回のビルド結果を保存中（書き込みのみボタンで使用）</span>
          <button onClick={handleClearCache} className="btn-clear-cache" title="キャッシュを削除">
            削除
          </button>
        </div>
      )}

      <div className="output-section">
        <div className="output-header">
          <span>Build Output</span>
          <button 
            onClick={() => setShowOutput(!showOutput)}
            className="btn-toggle"
          >
            {showOutput ? 'Hide' : 'Show'}
          </button>
        </div>
        {showOutput && (
          <div className="output-content">
            <pre>{buildOutput || 'No output yet...'}</pre>
          </div>
        )}
      </div>

      {state.currentProject && (
        <div className="project-status">
          <div className="status-row">
            <span className="status-label">Project:</span>
            <span className="status-value">{state.currentProject.name}</span>
          </div>
          <div className="status-row">
            <span className="status-label">Path:</span>
            <span className="status-value status-path">{state.currentProject.path}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildPanel;

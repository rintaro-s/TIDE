import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';
import './BottomPanelTabs.css';

interface BottomPanelTabsProps {
  isVisible: boolean;
  onToggle: () => void;
}

type TabType = 'output' | 'terminal' | 'problems' | 'serial';

interface Problem {
  type: 'error' | 'warning' | 'info';
  message: string;
  file?: string;
  line?: number;
  column?: number;
  source?: string;
}

const BottomPanelTabs: React.FC<BottomPanelTabsProps> = ({ isVisible, onToggle }) => {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('output');
  const [output, setOutput] = useState<string[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [serialData, setSerialData] = useState<string[]>([]);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentCommand, setCurrentCommand] = useState('');
  const [isCommandRunning, setIsCommandRunning] = useState(false);
  const [serialPort, setSerialPort] = useState('');
  const [serialBaudRate, setSerialBaudRate] = useState('115200');
  const [serialConnected, setSerialConnected] = useState(false);
  
  const outputRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const problemsRef = useRef<HTMLDivElement>(null);
  const serialRef = useRef<HTMLDivElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Listen for build/compile output
    const handleBuildOutput = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { message, type } = customEvent.detail;
      addOutput(message, type || 'info');
    };

    const handleBuildError = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { file, line, column, message, type } = customEvent.detail;
      addProblem({
        type: type || 'error',
        message,
        file,
        line,
        column,
        source: 'build'
      });
    };

    const handleFileSaved = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { filePath } = customEvent.detail;
      addOutput(`✅ ファイルを保存しました: ${filePath}`, 'success');
    };

    const handleFileSaveError = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { filePath, error } = customEvent.detail;
      addOutput(`❌ ファイル保存エラー: ${filePath} - ${error}`, 'error');
      addProblem({
        type: 'error',
        message: `保存エラー: ${error}`,
        file: filePath,
        source: 'file-system'
      });
    };

    // Register event listeners
    window.addEventListener('buildOutput', handleBuildOutput);
    window.addEventListener('buildError', handleBuildError);
    window.addEventListener('fileSaved', handleFileSaved);
    window.addEventListener('fileSaveError', handleFileSaveError);

    return () => {
      window.removeEventListener('buildOutput', handleBuildOutput);
      window.removeEventListener('buildError', handleBuildError);
      window.removeEventListener('fileSaved', handleFileSaved);
      window.removeEventListener('fileSaveError', handleFileSaveError);
    };
  }, []);

  // Auto-scroll to bottom when content is added
  useEffect(() => {
    if (activeTab === 'output' && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output, activeTab]);

  useEffect(() => {
    if (activeTab === 'terminal' && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput, activeTab]);

  useEffect(() => {
    if (activeTab === 'serial' && serialRef.current) {
      serialRef.current.scrollTop = serialRef.current.scrollHeight;
    }
  }, [serialData, activeTab]);

  const addOutput = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = `[${timestamp}] ${message}`;
    setOutput(prev => [...prev, formattedMessage]);
  };

  const addProblem = (problem: Problem) => {
    setProblems(prev => {
      // Remove duplicate problems
      const filtered = prev.filter(p => 
        !(p.file === problem.file && p.line === problem.line && p.message === problem.message)
      );
      return [...filtered, problem];
    });
  };

  const clearOutput = () => setOutput([]);
  const clearProblems = () => setProblems([]);
  const clearSerial = () => setSerialData([]);
  const clearTerminal = () => setTerminalOutput([]);

  const executeTerminalCommand = async (command: string) => {
    if (!command.trim()) return;

    setIsCommandRunning(true);
    const timestamp = new Date().toLocaleTimeString();
    setTerminalOutput(prev => [...prev, `PS E:\\github\\TIDE [${timestamp}] > ${command}`]);
    
    // Add to history
    setTerminalHistory(prev => {
      const newHistory = [command, ...prev.filter(h => h !== command)].slice(0, 100);
      return newHistory;
    });
    setHistoryIndex(-1);

    try {
      if (command.toLowerCase() === 'clear' || command.toLowerCase() === 'cls') {
        clearTerminal();
      } else if (command.toLowerCase() === 'help') {
        setTerminalOutput(prev => [...prev, 
          '利用可能なコマンド:',
          '  clear/cls    - ターミナルをクリア',
          '  help         - このヘルプを表示',
          '  dir/ls       - ディレクトリの内容を表示',
          '  cd <path>    - ディレクトリを移動',
          '  echo <text>  - テキストを出力',
          '  pio --help   - PlatformIOヘルプ',
          '  arduino-cli  - Arduino CLIコマンド',
          '  その他のPowerShellコマンドも使用可能'
        ]);
      } else if (command.toLowerCase().startsWith('echo ')) {
        const text = command.substring(5);
        setTerminalOutput(prev => [...prev, text]);
      } else {
        // Execute actual command through electron API
        const result = await window.electronAPI?.process.exec(
          'powershell.exe', 
          ['-Command', command], 
          { cwd: state.currentProject?.path || 'E:\\github\\TIDE' }
        );
        
        if (result) {
          if (result.stdout) {
            const lines = result.stdout.split('\n');
            setTerminalOutput(prev => [...prev, ...lines.filter(line => line.trim())]);
          }
          if (result.stderr) {
            const lines = result.stderr.split('\n');
            setTerminalOutput(prev => [...prev, ...lines.filter(line => line.trim()).map(line => `ERROR: ${line}`)]);
          }
          if (result.exitCode !== 0) {
            setTerminalOutput(prev => [...prev, `Process exited with code ${result.exitCode}`]);
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setTerminalOutput(prev => [...prev, `ERROR: ${errorMessage}`]);
    } finally {
      setIsCommandRunning(false);
    }
  };

  const handleCommandKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isCommandRunning) {
      executeTerminalCommand(currentCommand);
      setCurrentCommand('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < terminalHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(terminalHistory[newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(terminalHistory[newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentCommand('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple tab completion for common commands
      const commonCommands = ['dir', 'ls', 'cd', 'echo', 'clear', 'cls', 'help', 'pio', 'arduino-cli'];
      const matches = commonCommands.filter(cmd => cmd.startsWith(currentCommand.toLowerCase()));
      if (matches.length === 1) {
        setCurrentCommand(matches[0] + ' ');
      }
    }
  };

  const toggleSerialConnection = async () => {
    if (serialConnected) {
      setSerialConnected(false);
      addSerialData('❌ シリアル接続を切断しました');
    } else {
      if (!serialPort) {
        addSerialData('❌ ポートが選択されていません');
        return;
      }
      
      try {
        // Simulate serial connection - in real implementation use electron IPC
        setSerialConnected(true);
        addSerialData(`✅ ${serialPort} (${serialBaudRate}) に接続しました`);
        addSerialData('シリアルモニターが開始されました...');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        addSerialData(`❌ 接続エラー: ${errorMessage}`);
      }
    }
  };

  const addSerialData = (data: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSerialData(prev => [...prev, `[${timestamp}] ${data}`]);
  };

  const sendSerialData = (data: string) => {
    if (!serialConnected) {
      addSerialData('❌ シリアルポートに接続されていません');
      return;
    }
    
    addSerialData(`>>> ${data}`);
    
    // Simulate echo response
    setTimeout(() => {
      addSerialData(`<<< Echo: ${data}`);
    }, 100);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'output':
        return (
          <div className="tab-content">
            <div className="tab-header">
              <span className="tab-title">出力</span>
              <div className="tab-actions">
                <button className="tab-btn" onClick={clearOutput} title="クリア">
                  クリア
                </button>
              </div>
            </div>
            <div className="content-area output-content" ref={outputRef}>
              {output.length === 0 ? (
                <div className="placeholder">ビルド出力がここに表示されます...</div>
              ) : (
                output.map((line, index) => {
                  let className = "output-line";
                  if (line.includes('✅') || line.includes('SUCCESS')) className += " success";
                  else if (line.includes('❌') || line.includes('ERROR')) className += " error";  
                  else if (line.includes('⚠️') || line.includes('WARNING')) className += " warning";
                  
                  return (
                    <div key={index} className={className}>{line}</div>
                  );
                })
              )}
            </div>
          </div>
        );

      case 'terminal':
        return (
          <div className="tab-content">
            <div className="tab-header">
              <span className="tab-title">PowerShell ターミナル</span>
              <div className="tab-actions">
                <span className="current-dir">
                  {state.currentProject?.path || 'E:\\github\\TIDE'}
                </span>
                <button className="tab-btn" onClick={clearTerminal} title="クリア">
                  クリア
                </button>
              </div>
            </div>
            <div className="content-area terminal-content" ref={terminalRef}>
              {terminalOutput.map((line, index) => (
                <div key={index} className="terminal-line">{line}</div>
              ))}
              <div className="terminal-input-line">
                <span className="prompt">PS E:\\github\\TIDE &gt; </span>
                <input
                  ref={commandInputRef}
                  type="text"
                  className="terminal-input"
                  value={currentCommand}
                  onChange={(e) => setCurrentCommand(e.target.value)}
                  onKeyDown={handleCommandKeyDown}
                  placeholder={isCommandRunning ? "実行中..." : "コマンドを入力..."}
                  disabled={isCommandRunning}
                  autoFocus={activeTab === 'terminal'}
                />
              </div>
            </div>
          </div>
        );

      case 'problems':
        return (
          <div className="tab-content">
            <div className="tab-header">
              <span className="tab-title">問題</span>
              <div className="tab-actions">
                <span className="problem-count">
                  {problems.filter(p => p.type === 'error').length} エラー, {' '}
                  {problems.filter(p => p.type === 'warning').length} 警告
                </span>
                <button className="tab-btn" onClick={clearProblems} title="クリア">
                  クリア
                </button>
              </div>
            </div>
            <div className="content-area problems-content" ref={problemsRef}>
              {problems.length === 0 ? (
                <div className="placeholder">問題は検出されませんでした</div>
              ) : (
                problems.map((problem, index) => (
                  <div key={index} className={`problem-item ${problem.type}`} onClick={() => {
                    if (problem.file && problem.line) {
                      console.log(`Jump to ${problem.file}:${problem.line}`);
                      // Implement file navigation
                    }
                  }}>
                    <span className="problem-icon">
                      {problem.type === 'error' ? '❌' : problem.type === 'warning' ? '⚠️' : 'ℹ️'}
                    </span>
                    <div className="problem-details">
                      <div className="problem-message">{problem.message}</div>
                      {problem.file && (
                        <div className="problem-location">
                          {problem.file}
                          {problem.line && `:${problem.line}`}
                          {problem.column && `:${problem.column}`}
                        </div>
                      )}
                    </div>
                    <div className="problem-source">{problem.source}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'serial':
        return (
          <div className="tab-content">
            <div className="tab-header">
              <span className="tab-title">シリアルモニター</span>
              <div className="tab-actions">
                <select 
                  className="serial-port-select"
                  value={serialPort}
                  onChange={(e) => setSerialPort(e.target.value)}
                >
                  <option value="">ポートを選択</option>
                  <option value="COM1">COM1</option>
                  <option value="COM3">COM3</option>
                  <option value="COM4">COM4</option>
                  <option value="COM5">COM5</option>
                </select>
                <select 
                  className="baud-select"
                  value={serialBaudRate}
                  onChange={(e) => setSerialBaudRate(e.target.value)}
                >
                  <option value="9600">9600</option>
                  <option value="19200">19200</option>
                  <option value="38400">38400</option>
                  <option value="57600">57600</option>
                  <option value="115200">115200</option>
                  <option value="230400">230400</option>
                </select>
                <button 
                  className={`connect-btn ${serialConnected ? 'connected' : ''}`}
                  onClick={toggleSerialConnection}
                >
                  {serialConnected ? '切断' : '接続'}
                </button>
                <button className="tab-btn" onClick={clearSerial} title="クリア">
                  クリア
                </button>
              </div>
            </div>
            <div className="content-area serial-content" ref={serialRef}>
              {serialData.length === 0 ? (
                <div className="placeholder">
                  シリアルデータがここに表示されます...
                  <br />
                  ポートを選択して「接続」をクリックしてください
                </div>
              ) : (
                serialData.map((line, index) => (
                  <div key={index} className="serial-line">{line}</div>
                ))
              )}
            </div>
            <div className="serial-input-section">
              <input
                type="text"
                className="serial-input"
                placeholder="送信するデータを入力..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.currentTarget;
                    if (input.value.trim()) {
                      sendSerialData(input.value.trim());
                      input.value = '';
                    }
                  }
                }}
                disabled={!serialConnected}
              />
              <button 
                className="send-btn"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  if (input.value.trim()) {
                    sendSerialData(input.value.trim());
                    input.value = '';
                  }
                }}
                disabled={!serialConnected}
              >
                送信
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bottom-panel-tabs">
      <div className="tab-bar">
        <button
          className={`tab-button ${activeTab === 'output' ? 'active' : ''}`}
          onClick={() => setActiveTab('output')}
        >
          出力
          {output.length > 0 && <span className="badge">{output.length}</span>}
        </button>
        <button
          className={`tab-button ${activeTab === 'terminal' ? 'active' : ''}`}
          onClick={() => setActiveTab('terminal')}
        >
          ターミナル
          {isCommandRunning && <span className="badge running">実行中</span>}
        </button>
        <button
          className={`tab-button ${activeTab === 'problems' ? 'active' : ''}`}
          onClick={() => setActiveTab('problems')}
        >
          問題
          {problems.length > 0 && (
            <span className={`badge ${problems.some(p => p.type === 'error') ? 'error' : 'warning'}`}>
              {problems.length}
            </span>
          )}
        </button>
        <button
          className={`tab-button ${activeTab === 'serial' ? 'active' : ''}`}
          onClick={() => setActiveTab('serial')}
        >
          シリアルモニター
          {serialConnected && <span className="badge connected">接続中</span>}
        </button>
        
        <div className="tab-controls">
          <button className="toggle-btn" onClick={onToggle} title="パネルを閉じる">
            ▼
          </button>
        </div>
      </div>
      
      {renderTabContent()}
    </div>
  );
};

export default BottomPanelTabs;
import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import './UploadSettingsPanel.css';

interface PlatformIOEnvironment {
  name: string;
  platform?: string;
  board?: string;
  framework?: string;
  upload_port?: string;
}

export const UploadSettingsPanel: React.FC = () => {
  const { state, setState } = useApp();
  const [environments, setEnvironments] = useState<PlatformIOEnvironment[]>([]);
  const [ports, setPorts] = useState<string[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState('');
  const [selectedPort, setSelectedPort] = useState('');
  const [selectedBoard, setSelectedBoard] = useState('');
  const [arduinoBoards, setArduinoBoards] = useState<Array<{ fqbn: string; name: string }>>([]);

  const isPlatformIO = state.currentProject?.type === 'platformio';

  // Load PlatformIO environments from platformio.ini
  useEffect(() => {
    if (isPlatformIO && state.currentProject) {
      loadPlatformIOEnvironments();
    }
  }, [isPlatformIO, state.currentProject]);

  // Load Arduino CLI boards
  useEffect(() => {
    if (!isPlatformIO) {
      loadArduinoBoards();
    }
  }, [isPlatformIO]);

  // Load ports
  useEffect(() => {
    loadPorts();
  }, [isPlatformIO]);

  const loadPlatformIOEnvironments = async () => {
    if (!state.currentProject) return;
    
    try {
      const iniPath = `${state.currentProject.path}/platformio.ini`;
      const content = await window.electronAPI.fs.readFile(iniPath);
      
      const envs: PlatformIOEnvironment[] = [];
      const lines = content.split('\n');
      let currentEnv: PlatformIOEnvironment | null = null;

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('[env:')) {
          if (currentEnv) envs.push(currentEnv);
          const name = trimmed.substring(5, trimmed.length - 1);
          currentEnv = { name };
        } else if (currentEnv && trimmed.includes('=')) {
          const [key, value] = trimmed.split('=').map(s => s.trim());
          if (key === 'platform') currentEnv.platform = value;
          else if (key === 'board') currentEnv.board = value;
          else if (key === 'framework') currentEnv.framework = value;
          else if (key === 'upload_port') currentEnv.upload_port = value;
        }
      }
      if (currentEnv) envs.push(currentEnv);

      setEnvironments(envs);
      if (envs.length > 0 && !selectedEnvironment) {
        setSelectedEnvironment(envs[0].name);
      }
    } catch (error) {
      console.error('[UploadSettings] Failed to load platformio.ini:', error);
    }
  };

  const loadArduinoBoards = async () => {
    try {
      const result = await window.electronAPI.executeCommand('arduino-cli board listall --format json');
      if (result.success && result.output) {
        const data = JSON.parse(result.output);
        if (data.boards) {
          setArduinoBoards(data.boards);
        }
      }
    } catch (error) {
      console.error('[UploadSettings] Failed to load Arduino boards:', error);
    }
  };

  const loadPorts = async () => {
    try {
      const command = isPlatformIO 
        ? 'pio device list --json-output'
        : 'arduino-cli board list --format json';
      
      const result = await window.electronAPI.executeCommand(command);
      if (result.success && result.output) {
        const data = JSON.parse(result.output);
        
        let portList: string[] = [];
        if (isPlatformIO) {
          portList = data.map((p: any) => p.port);
        } else {
          portList = data.detected_ports?.map((p: any) => p.port?.address) || [];
        }
        
        setPorts(portList);
        if (portList.length > 0 && !selectedPort) {
          setSelectedPort(portList[0]);
        }
      }
    } catch (error) {
      console.error('[UploadSettings] Failed to load ports:', error);
    }
  };

  const handleSave = () => {
    if (isPlatformIO) {
      window.electronAPI.store.set('appSettings', {
        ...state.settings,
        platformio: {
          ...state.settings.platformio,
          environment: selectedEnvironment,
          port: selectedPort
        }
      });
    } else {
      window.electronAPI.store.set('appSettings', {
        ...state.settings,
        arduino: {
          ...state.settings.arduino,
          board: selectedBoard,
          port: selectedPort
        }
      });
    }
    
    window.location.reload();
  };

  return (
    <div className="upload-settings-panel">
      <div className="upload-settings-header">
        <h2>アップロード設定</h2>
      </div>

      <div className="upload-settings-content">
        {isPlatformIO ? (
          <>
            <div className="setting-group">
              <label>環境</label>
              <select 
                value={selectedEnvironment} 
                onChange={(e) => setSelectedEnvironment(e.target.value)}
              >
                {environments.map(env => (
                  <option key={env.name} value={env.name}>
                    {env.name}
                    {env.board && ` (${env.board})`}
                  </option>
                ))}
              </select>
            </div>

            {selectedEnvironment && environments.find(e => e.name === selectedEnvironment) && (
              <div className="env-info">
                <div className="info-row">
                  <span className="info-label">Platform:</span>
                  <span className="info-value">{environments.find(e => e.name === selectedEnvironment)?.platform || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Board:</span>
                  <span className="info-value">{environments.find(e => e.name === selectedEnvironment)?.board || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Framework:</span>
                  <span className="info-value">{environments.find(e => e.name === selectedEnvironment)?.framework || 'N/A'}</span>
                </div>
              </div>
            )}

            <div className="setting-group">
              <label>ポート</label>
              <select 
                value={selectedPort} 
                onChange={(e) => setSelectedPort(e.target.value)}
              >
                <option value="">自動検出</option>
                {ports.map(port => (
                  <option key={port} value={port}>{port}</option>
                ))}
              </select>
            </div>

            <div className="note">
              <p>環境を追加・変更するには、platformio.iniを直接編集してください。</p>
            </div>
          </>
        ) : (
          <>
            <div className="setting-group">
              <label>ボード</label>
              <select 
                value={selectedBoard} 
                onChange={(e) => setSelectedBoard(e.target.value)}
              >
                <option value="">選択してください</option>
                {arduinoBoards.map(board => (
                  <option key={board.fqbn} value={board.fqbn}>
                    {board.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="setting-group">
              <label>ポート</label>
              <select 
                value={selectedPort} 
                onChange={(e) => setSelectedPort(e.target.value)}
              >
                <option value="">選択してください</option>
                {ports.map(port => (
                  <option key={port} value={port}>{port}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="button-group">
          <button className="save-button" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

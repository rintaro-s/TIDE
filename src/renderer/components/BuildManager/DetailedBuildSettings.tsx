import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import arduinoService, { ArduinoCLIService, ArduinoBoard, ArduinoPort } from '../../services/ArduinoService';
import platformioService, { PlatformIOService, PlatformIOBoard, PlatformIODevice } from '../../services/PlatformIOService';
import './DetailedBuildSettings.css';

interface BuildConfiguration {
  // Common settings
  verbose: boolean;
  clean: boolean;
  parallelJobs: number;
  
  // Arduino specific
  arduino: {
    board: string;
    port: string;
    fqbn: string;
    programmer: string;
    protocol: string;
    warnings: 'none' | 'default' | 'more' | 'all';
    optimizeForDebug: boolean;
    exportBinaries: boolean;
    verifyAfterUpload: boolean;
    buildPath: string;
    outputDir: string;
    libraries: string[];
    buildProperties: { [key: string]: string };
  };
  
  // PlatformIO specific
  platformio: {
    environment: string;
    targets: string[];
    uploadPort: string;
    monitorPort: string;
    projectDir: string;
    projectConf: string;
    disableAutoClean: boolean;
    silent: boolean;
    programArgs: string[];
  };
}

const DetailedBuildSettings: React.FC = () => {
  const { state } = useApp();
  const [config, setConfig] = useState<BuildConfiguration>({
    verbose: false,
    clean: false,
    parallelJobs: 4,
    arduino: {
      board: '',
      port: '',
      fqbn: '',
      programmer: '',
      protocol: 'serial',
      warnings: 'none',
      optimizeForDebug: false,
      exportBinaries: false,
      verifyAfterUpload: true,
      buildPath: '',
      outputDir: '',
      libraries: [],
      buildProperties: {}
    },
    platformio: {
      environment: '',
      targets: ['build'],
      uploadPort: '',
      monitorPort: '',
      projectDir: '',
      projectConf: '',
      disableAutoClean: false,
      silent: false,
      programArgs: []
    }
  });

  const [availableBoards, setAvailableBoards] = useState<(ArduinoBoard | PlatformIOBoard)[]>([]);
  const [availablePorts, setAvailablePorts] = useState<(ArduinoPort | PlatformIODevice)[]>([]);
  const [environments, setEnvironments] = useState<string[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildOutput, setBuildOutput] = useState<string[]>([]);

  const arduinoService = ArduinoCLIService.getInstance();
  const platformioService = PlatformIOService.getInstance();

  useEffect(() => {
    loadBoardsAndPorts();
    loadPlatformIOEnvironments();
  }, [state.mode, state.currentProject]);

  const loadBoardsAndPorts = async () => {
    if (!state.mode || !state.currentProject) return;
    
    try {
      if (state.mode === 'arduino') {
        const installed = await arduinoService.checkInstallation();
        if (installed) {
          const boards = await arduinoService.listBoards();
          const ports = await arduinoService.listPorts();
          setAvailableBoards(boards);
          setAvailablePorts(ports);
        }
      } else if (state.mode === 'platformio') {
        const installed = await platformioService.checkInstallation();
        if (installed) {
          const boards = await platformioService.listAllBoards();
          const devices = await platformioService.listDevices();
          setAvailableBoards(boards);
          setAvailablePorts(devices);
        }
      }
    } catch (error) {
      console.error('Failed to load boards and ports:', error);
    }
  };

  const loadPlatformIOEnvironments = async () => {
    if (state.mode === 'platformio' && state.currentProject) {
      try {
        // Read platformio.ini to get environments
        const iniPath = `${state.currentProject.path}/platformio.ini`;
        const content = await window.electronAPI?.fs.readFile(iniPath);
        if (content) {
          const envMatches = content.match(/\[env:([^\]]+)\]/g);
          if (envMatches) {
            const envs = envMatches.map(match => match.replace(/\[env:([^\]]+)\]/, '$1'));
            setEnvironments(envs);
          }
        }
      } catch (error) {
        console.error('Failed to load PlatformIO environments:', error);
      }
    }
  };

  const updateConfig = (section: 'common' | 'arduino' | 'platformio', field: string, value: any) => {
    setConfig(prev => {
      if (section === 'common') {
        return { ...prev, [field]: value };
      } else {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value
          }
        };
      }
    });
  };

  const addBuildProperty = () => {
    const key = prompt('プロパティ名を入力してください:');
    const value = prompt('プロパティ値を入力してください:');
    if (key && value) {
      updateConfig('arduino', 'buildProperties', {
        ...config.arduino.buildProperties,
        [key]: value
      });
    }
  };

  const removeBuildProperty = (key: string) => {
    const newProperties = { ...config.arduino.buildProperties };
    delete newProperties[key];
    updateConfig('arduino', 'buildProperties', newProperties);
  };

  const addLibraryPath = () => {
    const path = prompt('ライブラリパスを入力してください:');
    if (path) {
      updateConfig('arduino', 'libraries', [...config.arduino.libraries, path]);
    }
  };

  const removeLibraryPath = (index: number) => {
    const newLibraries = config.arduino.libraries.filter((_, i) => i !== index);
    updateConfig('arduino', 'libraries', newLibraries);
  };

  const addProgramArg = () => {
    const arg = prompt('プログラム引数を入力してください:');
    if (arg) {
      updateConfig('platformio', 'programArgs', [...config.platformio.programArgs, arg]);
    }
  };

  const removeProgramArg = (index: number) => {
    const newArgs = config.platformio.programArgs.filter((_, i) => i !== index);
    updateConfig('platformio', 'programArgs', newArgs);
  };

  const addOutput = (message: string) => {
    setBuildOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const executeBuild = async () => {
    if (!state.currentProject || !state.mode) {
      addOutput('❌ プロジェクトまたはモードが選択されていません');
      return;
    }

    setIsBuilding(true);
    setBuildOutput([]);
    addOutput(`🔨 詳細ビルドを開始します (${state.mode})`);

    try {
      if (state.mode === 'arduino') {
        await executeArduinoBuild();
      } else {
        await executePlatformIOBuild();
      }
    } catch (error) {
      addOutput(`❌ ビルドエラー: ${error}`);
    } finally {
      setIsBuilding(false);
    }
  };

  const executeArduinoBuild = async () => {
    if (!config.arduino.fqbn) {
      addOutput('❌ ボード（FQBN）が指定されていません');
      return;
    }

    addOutput(`📋 設定: ${JSON.stringify(config.arduino, null, 2)}`);
    
    const result = await arduinoService.compile(
      state.currentProject!.path,
      config.arduino.fqbn
    );

    if (result.output) {
      result.output.split('\n').forEach(line => {
        if (line.trim()) setBuildOutput(prev => [...prev, line]);
      });
    }

    if (result.success) {
      addOutput('✅ Arduinoビルドが成功しました');
    } else {
      addOutput('❌ Arduinoビルドが失敗しました');
      result.errors.forEach(error => addOutput(`  ❗ ${error}`));
    }

    result.warnings.forEach(warning => addOutput(`  ⚠️ ${warning}`));
  };

  const executePlatformIOBuild = async () => {
    addOutput(`📋 設定: ${JSON.stringify(config.platformio, null, 2)}`);
    
    const result = await platformioService.compile(state.currentProject!.path);

    if (result.output) {
      result.output.split('\n').forEach(line => {
        if (line.trim()) setBuildOutput(prev => [...prev, line]);
      });
    }

    if (result.success) {
      addOutput('✅ PlatformIOビルドが成功しました');
    } else {
      addOutput('❌ PlatformIOビルドが失敗しました');
      result.errors.forEach(error => addOutput(`  ❗ ${error}`));
    }

    result.warnings.forEach(warning => addOutput(`  ⚠️ ${warning}`));
  };

  const saveConfiguration = async () => {
    try {
      const configPath = `${state.currentProject?.path}/.tova-build-config.json`;
      await window.electronAPI?.fs.writeFile(configPath, JSON.stringify(config, null, 2));
      addOutput('✅ ビルド設定を保存しました');
    } catch (error) {
      addOutput(`❌ 設定保存エラー: ${error}`);
    }
  };

  const loadConfiguration = async () => {
    try {
      const configPath = `${state.currentProject?.path}/.tova-build-config.json`;
      const content = await window.electronAPI?.fs.readFile(configPath);
      if (content) {
        setConfig(JSON.parse(content));
        addOutput('✅ ビルド設定を読み込みました');
      }
    } catch (error) {
      addOutput(`❌ 設定読み込みエラー: ${error}`);
    }
  };

  return (
    <div className="detailed-build-settings">
      <div className="settings-header">
        <h3>詳細ビルド設定</h3>
        <div className="header-actions">
          <button onClick={loadConfiguration} className="load-config-btn">
            設定読み込み
          </button>
          <button onClick={saveConfiguration} className="save-config-btn">
            設定保存
          </button>
          <button 
            onClick={executeBuild} 
            className="execute-build-btn"
            disabled={isBuilding}
          >
            {isBuilding ? 'ビルド中...' : 'ビルド実行'}
          </button>
        </div>
      </div>

      <div className="settings-content">
        <div className="settings-panel">
          <div className="common-settings">
            <h4>共通設定</h4>
            <div className="setting-group">
              <label>
                <input
                  type="checkbox"
                  checked={config.verbose}
                  onChange={(e) => updateConfig('common', 'verbose', e.target.checked)}
                />
                詳細出力 (verbose)
              </label>
            </div>
            <div className="setting-group">
              <label>
                <input
                  type="checkbox"
                  checked={config.clean}
                  onChange={(e) => updateConfig('common', 'clean', e.target.checked)}
                />
                クリーンビルド
              </label>
            </div>
            <div className="setting-group">
              <label>
                並列ジョブ数:
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={config.parallelJobs}
                  onChange={(e) => updateConfig('common', 'parallelJobs', parseInt(e.target.value))}
                />
              </label>
            </div>
          </div>

          {state.mode === 'arduino' && (
            <div className="arduino-settings">
              <h4>Arduino CLI設定</h4>
              
              <div className="setting-group">
                <label>
                  ボード (FQBN):
                  <select
                    value={config.arduino.fqbn}
                    onChange={(e) => updateConfig('arduino', 'fqbn', e.target.value)}
                  >
                    <option value="">選択してください</option>
                    {availableBoards.map(board => (
                      <option key={'fqbn' in board ? board.fqbn : board.id} value={'fqbn' in board ? board.fqbn : board.id}>
                        {board.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="setting-group">
                <label>
                  ポート:
                  <select
                    value={config.arduino.port}
                    onChange={(e) => updateConfig('arduino', 'port', e.target.value)}
                  >
                    <option value="">選択してください</option>
                    {availablePorts.map(port => (
                      <option key={'address' in port ? port.address : port.port} value={'address' in port ? port.address : port.port}>
                        {'address' in port ? `${port.address} - ${port.label}` : `${port.port} - ${port.description}`}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="setting-group">
                <label>
                  警告レベル:
                  <select
                    value={config.arduino.warnings}
                    onChange={(e) => updateConfig('arduino', 'warnings', e.target.value)}
                  >
                    <option value="none">なし</option>
                    <option value="default">デフォルト</option>
                    <option value="more">詳細</option>
                    <option value="all">すべて</option>
                  </select>
                </label>
              </div>

              <div className="setting-group">
                <label>
                  <input
                    type="checkbox"
                    checked={config.arduino.optimizeForDebug}
                    onChange={(e) => updateConfig('arduino', 'optimizeForDebug', e.target.checked)}
                  />
                  デバッグ用に最適化
                </label>
              </div>

              <div className="setting-group">
                <label>
                  <input
                    type="checkbox"
                    checked={config.arduino.exportBinaries}
                    onChange={(e) => updateConfig('arduino', 'exportBinaries', e.target.checked)}
                  />
                  バイナリをエクスポート
                </label>
              </div>

              <div className="setting-group">
                <label>
                  ビルドパス:
                  <input
                    type="text"
                    value={config.arduino.buildPath}
                    onChange={(e) => updateConfig('arduino', 'buildPath', e.target.value)}
                    placeholder="カスタムビルドパス (オプション)"
                  />
                </label>
              </div>

              <div className="setting-group">
                <h5>ライブラリパス</h5>
                {config.arduino.libraries.map((lib, index) => (
                  <div key={index} className="array-item">
                    <span>{lib}</span>
                    <button onClick={() => removeLibraryPath(index)}>削除</button>
                  </div>
                ))}
                <button onClick={addLibraryPath} className="add-btn">ライブラリパス追加</button>
              </div>

              <div className="setting-group">
                <h5>ビルドプロパティ</h5>
                {Object.entries(config.arduino.buildProperties).map(([key, value]) => (
                  <div key={key} className="property-item">
                    <span>{key} = {value}</span>
                    <button onClick={() => removeBuildProperty(key)}>削除</button>
                  </div>
                ))}
                <button onClick={addBuildProperty} className="add-btn">プロパティ追加</button>
              </div>
            </div>
          )}

          {state.mode === 'platformio' && (
            <div className="platformio-settings">
              <h4>PlatformIO設定</h4>
              
              <div className="setting-group">
                <label>
                  環境:
                  <select
                    value={config.platformio.environment}
                    onChange={(e) => updateConfig('platformio', 'environment', e.target.value)}
                  >
                    <option value="">すべて</option>
                    {environments.map(env => (
                      <option key={env} value={env}>{env}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="setting-group">
                <label>
                  アップロードポート:
                  <select
                    value={config.platformio.uploadPort}
                    onChange={(e) => updateConfig('platformio', 'uploadPort', e.target.value)}
                  >
                    <option value="">自動検出</option>
                    {availablePorts.map(port => (
                      <option key={'address' in port ? port.address : port.port} value={'address' in port ? port.address : port.port}>
                        {'address' in port ? `${port.address} - ${port.label}` : `${port.port} - ${port.description}`}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="setting-group">
                <label>
                  プロジェクト設定ファイル:
                  <input
                    type="text"
                    value={config.platformio.projectConf}
                    onChange={(e) => updateConfig('platformio', 'projectConf', e.target.value)}
                    placeholder="platformio.ini (デフォルト)"
                  />
                </label>
              </div>

              <div className="setting-group">
                <label>
                  <input
                    type="checkbox"
                    checked={config.platformio.disableAutoClean}
                    onChange={(e) => updateConfig('platformio', 'disableAutoClean', e.target.checked)}
                  />
                  自動クリーンを無効化
                </label>
              </div>

              <div className="setting-group">
                <label>
                  <input
                    type="checkbox"
                    checked={config.platformio.silent}
                    onChange={(e) => updateConfig('platformio', 'silent', e.target.checked)}
                  />
                  サイレントモード
                </label>
              </div>

              <div className="setting-group">
                <h5>プログラム引数</h5>
                {config.platformio.programArgs.map((arg, index) => (
                  <div key={index} className="array-item">
                    <span>{arg}</span>
                    <button onClick={() => removeProgramArg(index)}>削除</button>
                  </div>
                ))}
                <button onClick={addProgramArg} className="add-btn">引数追加</button>
              </div>
            </div>
          )}
        </div>

        <div className="output-panel">
          <h4>ビルド出力</h4>
          <div className="build-output">
            {buildOutput.length === 0 ? (
              <div className="output-placeholder">ビルド出力がここに表示されます...</div>
            ) : (
              buildOutput.map((line, index) => (
                <div key={index} className="output-line">{line}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedBuildSettings;
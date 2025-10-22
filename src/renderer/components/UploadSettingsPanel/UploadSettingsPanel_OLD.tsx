import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { logger, toast } from '../../utils/logger';
import ArduinoService from '../../services/ArduinoService';
import PlatformIOService from '../../services/PlatformIOService';
import './UploadSettingsPanel.css';

interface ArduinoSettings {
  board: string;
  port: string;
  programmer: string;
  baudrate: number;
  verifyAfterUpload: boolean;
}

interface PlatformIOSettings {
  environment: string;
  port: string;
  uploadProtocol: string;
  uploadSpeed: number;
  uploadFlags: string[];
}

const UploadSettingsPanel: React.FC = () => {
  const { state, settings, updateSettings } = useApp();
  const [boards, setBoards] = useState<any[]>([]);
  const [ports, setPorts] = useState<string[]>([]);
  const [environments, setEnvironments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const arduinoService = ArduinoService;
  const platformioService = PlatformIOService;

  const [arduinoSettings, setArduinoSettings] = useState<ArduinoSettings>({
    board: settings.arduino?.board || '',
    port: settings.arduino?.port || '',
    programmer: settings.arduino?.programmer || 'arduino',
    baudrate: settings.arduino?.baudrate || 115200,
    verifyAfterUpload: settings.arduino?.verifyAfterUpload !== false
  });

  const [pioSettings, setPioSettings] = useState<PlatformIOSettings>({
    environment: settings.platformio?.environment || 'default',
    port: settings.platformio?.port || '',
    uploadProtocol: settings.platformio?.uploadProtocol || 'serial',
    uploadSpeed: settings.platformio?.uploadSpeed || 921600,
    uploadFlags: settings.platformio?.uploadFlags || []
  });

  useEffect(() => {
    loadSettings();
  }, [state.mode]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      if (state.mode === 'arduino') {
        // Load Arduino boards
        const boardList = await arduinoService.listBoards();
        setBoards(boardList);

        // Load serial ports
        const portList = await loadSerialPorts();
        setPorts(portList);
      } else if (state.mode === 'platformio') {
        // Load PlatformIO boards
        const boardList = await platformioService.listAllBoards();
        setBoards(boardList);

        // Load serial ports
        const portList = await loadSerialPorts();
        setPorts(portList);

        // Load environments from platformio.ini
        if (state.currentProject?.path) {
          const envList = await loadPlatformIOEnvironments(state.currentProject.path);
          setEnvironments(envList);
        }
      }
    } catch (error) {
      logger.error('Failed to load upload settings', { error });
      toast.error('設定の読み込みに失敗', String(error));
    } finally {
      setLoading(false);
    }
  };

  const loadSerialPorts = async (): Promise<string[]> => {
    try {
      if (state.mode === 'arduino') {
        const ports = await arduinoService.listPorts();
        return ports.map((p: any) => p.port);
      } else {
        const devices = await platformioService.listDevices();
        return devices.map((d: any) => d.port);
      }
    } catch (error) {
      logger.error('Failed to load serial ports', { error });
      return [];
    }
  };

  const loadPlatformIOEnvironments = async (projectPath: string): Promise<string[]> => {
    try {
      const iniPath = `${projectPath}/platformio.ini`;
      const content = await window.electronAPI.fs.readFile(iniPath);
      const lines = content.split('\n');
      const envs: string[] = [];

      lines.forEach(line => {
        const match = line.match(/\[env:(\w+)\]/);
        if (match) {
          envs.push(match[1]);
        }
      });

      return envs;
    } catch (error) {
      logger.error('Failed to load platformio.ini', { error });
      return ['default'];
    }
  };

  const handleArduinoSettingChange = (key: keyof ArduinoSettings, value: any) => {
    const newSettings = { ...arduinoSettings, [key]: value };
    setArduinoSettings(newSettings);
    updateSettings('arduino', key, value);
  };

  const handlePioSettingChange = (key: keyof PlatformIOSettings, value: any) => {
    const newSettings = { ...pioSettings, [key]: value };
    setPioSettings(newSettings);
    updateSettings('platformio', key, value);
  };

  const handleSaveSettings = async () => {
    try {
      if (state.mode === 'arduino') {
        await window.electronAPI.store.set('arduino', arduinoSettings);
        logger.success('Arduino settings saved');
        toast.success('Arduino設定を保存しました');
      } else {
        await window.electronAPI.store.set('platformio', pioSettings);
        logger.success('PlatformIO settings saved');
        toast.success('PlatformIO設定を保存しました');
      }
    } catch (error) {
      logger.error('Failed to save settings', { error });
      toast.error('設定の保存に失敗', String(error));
    }
  };

  const handleTestUpload = async () => {
    if (!state.currentProject?.path) {
      toast.warning('プロジェクトが開かれていません');
      return;
    }

    setLoading(true);
    try {
      if (state.mode === 'arduino') {
        if (!arduinoSettings.board || !arduinoSettings.port) {
          toast.warning('ボードとポートを選択してください');
          return;
        }

        toast.info('アップロードをテスト中...', 'コンパイルとアップロードを実行します');
        const result = await arduinoService.compile(
          state.currentProject.path,
          arduinoSettings.board
        );

        if (result.success) {
          toast.success('アップロードテスト成功', '設定は正しく動作します');
        } else {
          toast.error('アップロードテスト失敗', result.errors.join('\n'));
        }
      } else {
        if (!pioSettings.port) {
          toast.warning('ポートを選択してください');
          return;
        }

        toast.info('アップロードをテスト中...', 'ビルドとアップロードを実行します');
        const result = await platformioService.buildAndUpload(
          state.currentProject.path,
          pioSettings.port
        );

        if (result.success) {
          toast.success('アップロードテスト成功', '設定は正しく動作します');
        } else {
          toast.error('アップロードテスト失敗', result.errors.join('\n'));
        }
      }
    } catch (error) {
      logger.error('Upload test failed', { error });
      toast.error('テストに失敗', String(error));
    } finally {
      setLoading(false);
    }
  };

  if (loading && boards.length === 0) {
    return (
      <div className="upload-settings-panel">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>設定を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="upload-settings-panel">
      <div className="panel-header">
        <h3>⚡ アップロード設定</h3>
        <button onClick={loadSettings} className="refresh-btn" disabled={loading}>
          🔄
        </button>
      </div>

      <div className="mode-indicator">
        <span className={`mode-badge ${state.mode}`}>
          {state.mode === 'arduino' ? '🔷 Arduino-CLI' : '⚡ PlatformIO'}
        </span>
      </div>

      {state.mode === 'arduino' && (
        <div className="settings-section arduino-settings">
          <h4>Arduino-CLI 設定</h4>

          <div className="setting-item">
            <label>ボード (FQBN)</label>
            <select
              value={arduinoSettings.board}
              onChange={(e) => handleArduinoSettingChange('board', e.target.value)}
            >
              <option value="">ボードを選択...</option>
              {boards.map((board: any) => (
                <option key={board.fqbn} value={board.fqbn}>
                  {board.name} ({board.fqbn})
                </option>
              ))}
            </select>
          </div>

          <div className="setting-item">
            <label>シリアルポート</label>
            <select
              value={arduinoSettings.port}
              onChange={(e) => handleArduinoSettingChange('port', e.target.value)}
            >
              <option value="">ポートを選択...</option>
              {ports.map((port: string) => (
                <option key={port} value={port}>
                  {port}
                </option>
              ))}
            </select>
          </div>

          <div className="setting-item">
            <label>プログラマー</label>
            <select
              value={arduinoSettings.programmer}
              onChange={(e) => handleArduinoSettingChange('programmer', e.target.value)}
            >
              <option value="arduino">Arduino as ISP</option>
              <option value="usbtinyisp">USBtinyISP</option>
              <option value="usbasp">USBasp</option>
              <option value="avrisp">AVR ISP</option>
              <option value="stk500v1">STK500 v1</option>
              <option value="stk500v2">STK500 v2</option>
            </select>
          </div>

          <div className="setting-item">
            <label>ボーレート</label>
            <select
              value={arduinoSettings.baudrate}
              onChange={(e) => handleArduinoSettingChange('baudrate', parseInt(e.target.value))}
            >
              <option value={9600}>9600</option>
              <option value={19200}>19200</option>
              <option value={38400}>38400</option>
              <option value={57600}>57600</option>
              <option value={115200}>115200</option>
              <option value={230400}>230400</option>
              <option value={460800}>460800</option>
              <option value={921600}>921600</option>
            </select>
          </div>

          <div className="setting-item checkbox">
            <input
              type="checkbox"
              id="verify-upload"
              checked={arduinoSettings.verifyAfterUpload}
              onChange={(e) => handleArduinoSettingChange('verifyAfterUpload', e.target.checked)}
            />
            <label htmlFor="verify-upload">アップロード後に検証</label>
          </div>
        </div>
      )}

      {state.mode === 'platformio' && (
        <div className="settings-section pio-settings">
          <h4>PlatformIO 設定</h4>

          <div className="setting-item">
            <label>環境 (Environment)</label>
            <select
              value={pioSettings.environment}
              onChange={(e) => handlePioSettingChange('environment', e.target.value)}
            >
              {environments.map((env: string) => (
                <option key={env} value={env}>
                  {env}
                </option>
              ))}
            </select>
          </div>

          <div className="setting-item">
            <label>シリアルポート</label>
            <select
              value={pioSettings.port}
              onChange={(e) => handlePioSettingChange('port', e.target.value)}
            >
              <option value="">ポートを選択...</option>
              {ports.map((port: string) => (
                <option key={port} value={port}>
                  {port}
                </option>
              ))}
            </select>
          </div>

          <div className="setting-item">
            <label>アップロードプロトコル</label>
            <select
              value={pioSettings.uploadProtocol}
              onChange={(e) => handlePioSettingChange('uploadProtocol', e.target.value)}
            >
              <option value="serial">Serial (UART)</option>
              <option value="esptool">ESP Tool</option>
              <option value="jlink">J-Link</option>
              <option value="stlink">ST-Link</option>
              <option value="dfu">DFU</option>
              <option value="sam-ba">SAM-BA</option>
              <option value="blackmagic">Black Magic Probe</option>
            </select>
          </div>

          <div className="setting-item">
            <label>アップロード速度 (bps)</label>
            <select
              value={pioSettings.uploadSpeed}
              onChange={(e) => handlePioSettingChange('uploadSpeed', parseInt(e.target.value))}
            >
              <option value={115200}>115200</option>
              <option value={230400}>230400</option>
              <option value={460800}>460800</option>
              <option value={921600}>921600</option>
              <option value={1500000}>1500000</option>
              <option value={2000000}>2000000</option>
            </select>
          </div>

          <div className="setting-item">
            <label>アップロードフラグ（オプション）</label>
            <textarea
              value={pioSettings.uploadFlags.join('\n')}
              onChange={(e) => handlePioSettingChange('uploadFlags', e.target.value.split('\n').filter(f => f.trim()))}
              placeholder="--erase-flash&#10;--verify&#10;--no-stub"
              rows={3}
            />
            <small>1行に1つのフラグを入力</small>
          </div>
        </div>
      )}

      <div className="panel-actions">
        <button onClick={handleSaveSettings} className="btn primary" disabled={loading}>
          💾 設定を保存
        </button>
        <button onClick={handleTestUpload} className="btn secondary" disabled={loading}>
          🧪 アップロードテスト
        </button>
      </div>

      <div className="settings-tips">
        <h4>💡 ヒント</h4>
        <ul>
          {state.mode === 'arduino' ? (
            <>
              <li>FQBNは完全なボード識別子です (例: arduino:avr:uno)</li>
              <li>正しいポートを選択すると、アップロード成功率が上がります</li>
              <li>検証を有効にすると、書き込みエラーを検出できます</li>
              <li>USBシリアルデバイスが認識されない場合、ドライバーを確認してください</li>
            </>
          ) : (
            <>
              <li>platformio.iniで複数の環境を定義できます</li>
              <li>ESP32/ESP8266はesptoolプロトコルを使用します</li>
              <li>アップロード速度が高いほど書き込みが速くなりますが、エラーが発生する可能性があります</li>
              <li>アップロードフラグでESP32のフラッシュ消去などを制御できます</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default UploadSettingsPanel;

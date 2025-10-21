export interface BuildProgress {
  phase: 'compiling' | 'linking' | 'uploading' | 'completed' | 'error';
  message: string;
  percentage: number;
  timestamp: Date;
}

export interface SerialData {
  data: string;
  timestamp: Date;
  type: 'incoming' | 'outgoing' | 'system';
}

export interface BoardInfo {
  id: string;
  name: string;
  platform: string;
  cpu?: string;
  frequency?: string;
  upload?: {
    protocol: string;
    maximum_size: number;
    maximum_data_size: number;
  };
}

export interface PortInfo {
  address: string;
  label: string;
  protocol: string;
  protocolLabel: string;
  properties?: { [key: string]: string };
}

export class BuildService {
  private buildCallbacks: ((progress: BuildProgress) => void)[] = [];
  private serialCallbacks: ((data: SerialData) => void)[] = [];
  private buildSettings: any = null;

  // Set build settings from app context
  setBuildSettings(settings: any): void {
    this.buildSettings = settings;
  }

  // Build system integration
  onBuildProgress(callback: (progress: BuildProgress) => void): () => void {
    this.buildCallbacks.push(callback);
    return () => {
      const index = this.buildCallbacks.indexOf(callback);
      if (index > -1) this.buildCallbacks.splice(index, 1);
    };
  }

  private notifyBuildProgress(progress: BuildProgress): void {
    this.buildCallbacks.forEach(callback => callback(progress));
  }

  async compile(mode: 'arduino' | 'platformio', projectPath: string): Promise<boolean> {
    try {
      const verboseOutput = this.buildSettings?.build?.verboseOutput || false;
      const parallelBuild = this.buildSettings?.build?.parallelBuild || false;
      
      this.notifyBuildProgress({
        phase: 'compiling',
        message: 'コンパイル開始...',
        percentage: 0,
        timestamp: new Date()
      });

      if (mode === 'arduino') {
        return await this.compileArduino(projectPath, verboseOutput, parallelBuild);
      } else {
        return await this.compilePlatformIO(projectPath, verboseOutput, parallelBuild);
      }
    } catch (error) {
      this.notifyBuildProgress({
        phase: 'error',
        message: `コンパイルエラー: ${error}`,
        percentage: 0,
        timestamp: new Date()
      });
      return false;
    }
  }

  private async compileArduino(projectPath: string, verbose: boolean, parallel: boolean): Promise<boolean> {
    const cliPath = this.buildSettings?.build?.arduinoCliPath || 'arduino-cli';
    
    this.notifyBuildProgress({
      phase: 'compiling',
      message: verbose ? `実行: ${cliPath} compile` : 'ソースファイルをコンパイル中...',
      percentage: 25,
      timestamp: new Date()
    });

    // Actual Arduino CLI compilation would go here
    // For now, using window.electronAPI to execute commands
    try {
      const args = ['compile', projectPath];
      if (verbose) args.push('--verbose');
      if (parallel) args.push('--jobs', '0'); // 0 means use all cores
      
      // TODO: Implement actual Arduino CLI execution via electronAPI
      // For now, using simulation with settings applied
      await this.delay(500);
      this.notifyBuildProgress({
        phase: 'compiling',
        message: verbose ? `[詳細] ライブラリをスキャン中...` : 'ライブラリを処理中...',
        percentage: 50,
        timestamp: new Date()
      });
      
      await this.delay(800);
      this.notifyBuildProgress({
        phase: 'linking',
        message: verbose ? `[詳細] ${cliPath} を使用してリンク中` : 'リンク中...',
        percentage: 75,
        timestamp: new Date()
      });
      
      await this.delay(600);
      this.notifyBuildProgress({
        phase: 'completed',
        message: verbose ? `[詳細] コンパイル成功\n使用: ${cliPath} compile ${args.join(' ')}` : 'コンパイル完了',
        percentage: 100,
        timestamp: new Date()
      });
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  private async compilePlatformIO(projectPath: string, verbose: boolean, parallel: boolean): Promise<boolean> {
    const pioPath = this.buildSettings?.build?.platformioPath || 'pio';
    
    this.notifyBuildProgress({
      phase: 'compiling',
      message: verbose ? `実行: ${pioPath} run` : 'ソースファイルをコンパイル中...',
      percentage: 25,
      timestamp: new Date()
    });

    try {
      const args = ['run', '-d', projectPath];
      if (verbose) args.push('-v');
      if (parallel) args.push('-j', '0');
      
      // TODO: Implement actual PlatformIO execution via electronAPI
      // For now, using simulation with settings applied
      await this.delay(500);
      this.notifyBuildProgress({
        phase: 'compiling',
        message: verbose ? `[詳細] 環境を構成中...` : 'ライブラリを処理中...',
        percentage: 50,
        timestamp: new Date()
      });
      
      await this.delay(800);
      this.notifyBuildProgress({
        phase: 'linking',
        message: verbose ? `[詳細] ${pioPath} を使用してリンク中` : 'リンク中...',
        percentage: 75,
        timestamp: new Date()
      });
      
      await this.delay(600);
      this.notifyBuildProgress({
        phase: 'completed',
        message: verbose ? `[詳細] ビルド成功\n使用: ${pioPath} ${args.join(' ')}` : 'コンパイル完了',
        percentage: 100,
        timestamp: new Date()
      });
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  async upload(mode: 'arduino' | 'platformio', port: string): Promise<boolean> {
    try {
      this.notifyBuildProgress({
        phase: 'uploading',
        message: 'アップロード開始...',
        percentage: 0,
        timestamp: new Date()
      });

      await this.delay(800);
      this.notifyBuildProgress({
        phase: 'uploading',
        message: `${port}にアップロード中...`,
        percentage: 50,
        timestamp: new Date()
      });

      await this.delay(1200);
      this.notifyBuildProgress({
        phase: 'completed',
        message: 'アップロード完了',
        percentage: 100,
        timestamp: new Date()
      });

      return true;
    } catch (error) {
      this.notifyBuildProgress({
        phase: 'error',
        message: `アップロードエラー: ${error}`,
        percentage: 0,
        timestamp: new Date()
      });
      return false;
    }
  }

  // Serial Monitor
  onSerialData(callback: (data: SerialData) => void): () => void {
    this.serialCallbacks.push(callback);
    return () => {
      const index = this.serialCallbacks.indexOf(callback);
      if (index > -1) this.serialCallbacks.splice(index, 1);
    };
  }

  private notifySerialData(data: SerialData): void {
    this.serialCallbacks.forEach(callback => callback(data));
  }

  async openSerialPort(port: string, baudRate: number): Promise<boolean> {
    try {
      this.notifySerialData({
        data: `シリアルポート ${port} を ${baudRate} bpsで開いています...`,
        timestamp: new Date(),
        type: 'system'
      });

      // Simulate opening serial port
      await this.delay(500);
      
      this.notifySerialData({
        data: `シリアルポート接続完了`,
        timestamp: new Date(),
        type: 'system'
      });

      // Simulate incoming data
      this.simulateSerialData();
      
      return true;
    } catch (error) {
      this.notifySerialData({
        data: `シリアルポートエラー: ${error}`,
        timestamp: new Date(),
        type: 'system'
      });
      return false;
    }
  }

  async closeSerialPort(): Promise<void> {
    this.notifySerialData({
      data: 'シリアルポートを閉じています...',
      timestamp: new Date(),
      type: 'system'
    });
  }

  async sendSerialData(data: string): Promise<void> {
    this.notifySerialData({
      data: data,
      timestamp: new Date(),
      type: 'outgoing'
    });
  }

  private simulateSerialData(): void {
    const messages = [
      'Arduino initialized',
      'Sensor reading: 23.5°C',
      'LED state: ON',
      'Free memory: 1024 bytes',
      'Loop iteration: 1',
      'LED state: OFF',
      'Sensor reading: 23.7°C',
      'Loop iteration: 2'
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < messages.length) {
        this.notifySerialData({
          data: messages[index],
          timestamp: new Date(),
          type: 'incoming'
        });
        index++;
      } else {
        clearInterval(interval);
      }
    }, 2000);
  }

  // Board and Port detection
  async getAvailableBoards(mode: 'arduino' | 'platformio'): Promise<BoardInfo[]> {
    // Mock board data
    const arduinoBoards: BoardInfo[] = [
      {
        id: 'arduino:avr:uno',
        name: 'Arduino Uno',
        platform: 'Arduino AVR Boards',
        cpu: 'ATmega328P',
        frequency: '16MHz',
        upload: {
          protocol: 'arduino',
          maximum_size: 32256,
          maximum_data_size: 2048
        }
      },
      {
        id: 'arduino:avr:nano',
        name: 'Arduino Nano',
        platform: 'Arduino AVR Boards',
        cpu: 'ATmega328P',
        frequency: '16MHz'
      },
      {
        id: 'esp32:esp32:esp32',
        name: 'ESP32 Dev Module',
        platform: 'ESP32 Arduino',
        cpu: 'ESP32',
        frequency: '240MHz'
      }
    ];

    const platformioBoards: BoardInfo[] = [
      {
        id: 'uno',
        name: 'Arduino Uno',
        platform: 'atmelavr'
      },
      {
        id: 'esp32dev',
        name: 'ESP32 Dev Module',
        platform: 'espressif32'
      },
      {
        id: 'nodemcuv2',
        name: 'NodeMCU 1.0',
        platform: 'espressif8266'
      }
    ];

    await this.delay(300); // Simulate API call
    return mode === 'arduino' ? arduinoBoards : platformioBoards;
  }

  async getAvailablePorts(): Promise<PortInfo[]> {
    // Mock port data
    const ports: PortInfo[] = [
      {
        address: 'COM3',
        label: 'COM3 (Arduino Uno)',
        protocol: 'serial',
        protocolLabel: 'Serial Port',
        properties: {
          pid: '0043',
          vid: '2341',
          serialNumber: '85439303738351F03170'
        }
      },
      {
        address: 'COM4',
        label: 'COM4',
        protocol: 'serial',
        protocolLabel: 'Serial Port'
      }
    ];

    await this.delay(200); // Simulate port detection
    return ports;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const buildService = new BuildService();
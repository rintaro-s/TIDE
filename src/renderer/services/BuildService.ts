import { globalCompileCache } from './GlobalCompileCacheService';

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
      const useGlobalCache = this.buildSettings?.build?.useGlobalCache !== false; // Default to true
      
      this.notifyBuildProgress({
        phase: 'compiling',
        message: 'コンパイル開始...',
        percentage: 0,
        timestamp: new Date()
      });

      // Check global cache if enabled
      if (useGlobalCache) {
        const cacheResult = await this.checkGlobalCache(projectPath, mode);
        if (cacheResult.found) {
          this.notifyBuildProgress({
            phase: 'completed',
            message: `グローバルキャッシュからコンパイル済みバイナリを取得しました (ソース: ${cacheResult.sourceNode})`,
            percentage: 100,
            timestamp: new Date()
          });
          return true;
        }
      }

      let result: boolean;
      if (mode === 'arduino') {
        result = await this.compileArduino(projectPath, verboseOutput, parallelBuild);
      } else {
        result = await this.compilePlatformIO(projectPath, verboseOutput, parallelBuild);
      }

      // Store in global cache if compilation was successful
      if (result && useGlobalCache) {
        await this.storeInGlobalCache(projectPath, mode);
      }

      return result;
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
    try {
      if (mode === 'arduino') {
        // Use ArduinoCLIService to get real boards
        const { ArduinoCLIService } = await import('./ArduinoService');
        const arduinoService = ArduinoCLIService.getInstance();
        const boards = await arduinoService.listBoards();
        return boards.map(b => ({
          id: b.fqbn || b.name,
          name: b.name,
          platform: b.platform || 'Unknown',
          cpu: '',
          frequency: '',
          upload: {
            protocol: 'serial',
            maximum_size: 0,
            maximum_data_size: 0
          }
        }));
      } else if (mode === 'platformio') {
        // Use PlatformIOService for platformio boards
        const { PlatformIOService } = await import('./PlatformIOService');
        const platformioService = PlatformIOService.getInstance();
        const boards = await platformioService.listAllBoards();
        return boards.map(b => ({
          id: b.id,
          name: b.name,
          platform: b.platform || 'platformio',
          cpu: '',
          frequency: ''
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to get available boards:', error);
      return [];
    }
  }

  async getAvailablePorts(): Promise<PortInfo[]> {
    try {
      // Use ArduinoCLIService to get real ports
      const { ArduinoCLIService } = await import('./ArduinoService');
      const arduinoService = ArduinoCLIService.getInstance();
      const ports = await arduinoService.listPorts();
      return ports.map(p => ({
        address: p.address,
        label: p.label,
        protocol: p.protocol,
        protocolLabel: p.protocolLabel
      }));
    } catch (error) {
      console.error('Failed to get available ports:', error);
      return [];
    }
  }

  // Global Cache Integration
  private async checkGlobalCache(projectPath: string, mode: 'arduino' | 'platformio'): Promise<{ found: boolean; sourceNode?: string }> {
    try {
      const cacheRequest = await this.createCacheRequest(projectPath, mode);
      const response = await globalCompileCache.queryGlobalCache(cacheRequest);
      
      if (response.found) {
        this.notifyBuildProgress({
          phase: 'compiling',
          message: `グローバルキャッシュをチェック中... 見つかりました！`,
          percentage: 50,
          timestamp: new Date()
        });
        
        return {
          found: true,
          sourceNode: response.sourceNode || 'unknown'
        };
      }
      
      this.notifyBuildProgress({
        phase: 'compiling',
        message: 'グローバルキャッシュをチェック中... 見つかりませんでした',
        percentage: 10,
        timestamp: new Date()
      });
      
      return { found: false };
    } catch (error) {
      console.error('Cache check error:', error);
      return { found: false };
    }
  }

  private async storeInGlobalCache(projectPath: string, mode: 'arduino' | 'platformio'): Promise<void> {
    try {
      const cacheRequest = await this.createCacheRequest(projectPath, mode);
      const binaryPath = this.getBinaryPath(projectPath, mode);
      
      if (await window.electronAPI.fs.exists(binaryPath)) {
        await globalCompileCache.storeCacheEntry(cacheRequest, binaryPath);
        console.log('Compilation result stored in global cache');
      }
    } catch (error) {
      console.error('Failed to store in global cache:', error);
    }
  }

  private async createCacheRequest(projectPath: string, mode: 'arduino' | 'platformio'): Promise<import('./GlobalCompileCacheService').CacheRequest> {
    const sourceFiles = await this.getSourceFiles(projectPath);
    const libraries = await this.getUsedLibraries(projectPath, mode);
    const boardConfig = this.getBoardConfig(mode);
    
    return {
      projectHash: '', // Will be calculated by cache service
      sourceFiles,
      libraries,
      boardConfig
    };
  }

  private async getSourceFiles(projectPath: string): Promise<string[]> {
    try {
      const files: string[] = [];
      const entries = await window.electronAPI.fs.readdir(projectPath);
      
      for (const entry of entries) {
        const fullPath = `${projectPath}/${entry}`;
        const stat = await window.electronAPI.fs.stat(fullPath);
        
        if (stat.isFile && (entry.endsWith('.ino') || entry.endsWith('.cpp') || entry.endsWith('.c') || entry.endsWith('.h'))) {
          const content = await window.electronAPI.fs.readFile(fullPath);
          files.push(`${entry}:${content}`);
        }
      }
      
      return files.sort();
    } catch (error) {
      console.error('Failed to get source files:', error);
      return [];
    }
  }

  private async getUsedLibraries(projectPath: string, mode: 'arduino' | 'platformio'): Promise<string[]> {
    try {
      if (mode === 'platformio') {
        const platformioIniPath = `${projectPath}/platformio.ini`;
        if (await window.electronAPI.fs.exists(platformioIniPath)) {
          const content = await window.electronAPI.fs.readFile(platformioIniPath);
          const libRegex = /lib_deps\s*=\s*(.*)/g;
          const libraries: string[] = [];
          let match;
          
          while ((match = libRegex.exec(content)) !== null) {
            libraries.push(...match[1].split(/[,\n]/).map(lib => lib.trim()).filter(lib => lib));
          }
          
          return libraries.sort();
        }
      } else {
        // Arduino mode - scan for #include statements
        const sourceFiles = await window.electronAPI.fs.readdir(projectPath);
        const includes = new Set<string>();
        
        for (const file of sourceFiles) {
          if (file.endsWith('.ino') || file.endsWith('.cpp') || file.endsWith('.h')) {
            const content = await window.electronAPI.fs.readFile(`${projectPath}/${file}`);
            const includeRegex = /#include\s*[<"]([^>"]+)[>"]/g;
            let match;
            
            while ((match = includeRegex.exec(content)) !== null) {
              includes.add(match[1]);
            }
          }
        }
        
        return Array.from(includes).sort();
      }
      
      return [];
    } catch (error) {
      console.error('Failed to get used libraries:', error);
      return [];
    }
  }

  private getBoardConfig(mode: 'arduino' | 'platformio'): string {
    const board = this.buildSettings?.board?.selected;
    const port = this.buildSettings?.board?.port;
    
    return JSON.stringify({
      mode,
      board,
      port,
      buildFlags: this.buildSettings?.build?.flags || []
    });
  }

  private getBinaryPath(projectPath: string, mode: 'arduino' | 'platformio'): string {
    if (mode === 'platformio') {
      return `${projectPath}/.pio/build/default/firmware.bin`;
    } else {
      const projectName = projectPath.split('/').pop() || projectPath.split('\\').pop() || 'project';
      return `${projectPath}/build/${projectName}.hex`;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const buildService = new BuildService();
// PlatformIO CLI service - 実際のコマンドに基づいた完全実装

import { logger, toast } from '../utils/logger';

export interface PlatformIOBoard {
  id: string;
  name: string;
  platform: string;
  mcu: string;
  frequency: string;
  flash: string;
  ram: string;
}

export interface PlatformIOLibrary {
  id: number;
  name: string;
  description: string;
  keywords: string[];
  version: string;
  homepage: string;
  repository: string;
}

export interface PlatformIODevice {
  port: string;
  description: string;
  hwid: string;
}

export interface CompileResult {
  success: boolean;
  output: string;
  errors: string[];
  warnings: string[];
  binaryPath?: string;
}

export interface UploadResult {
  success: boolean;
  output: string;
  errors: string[];
}

export class PlatformIOService {
  private static instance: PlatformIOService;
  
  public static getInstance(): PlatformIOService {
    if (!PlatformIOService.instance) {
      PlatformIOService.instance = new PlatformIOService();
    }
    return PlatformIOService.instance;
  }

  private async executeCommand(
    command: string, 
    args: string[], 
    options?: { cwd?: string }
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    try {
      return await window.electronAPI.process.exec(command, args, options || {});
    } catch (error) {
      console.error('Command execution error:', error);
      throw error;
    }
  }

  // バージョンチェック・初期化

  async checkInstallation(): Promise<boolean> {
    try {
      const result = await this.executeCommand('pio', ['--version']);
      return result.exitCode === 0;
    } catch (error) {
      return false;
    }
  }

  async upgrade(): Promise<boolean> {
    try {
      const result = await this.executeCommand('pio', ['upgrade']);
      return result.exitCode === 0;
    } catch (error) {
      console.error('Failed to upgrade PlatformIO:', error);
      return false;
    }
  }

  // ボード関連コマンド

  /**
   * 全てのボードを一覧表示
   * pio boards --json-output
   */
  async listAllBoards(): Promise<PlatformIOBoard[]> {
    try {
      const result = await this.executeCommand('pio', ['boards', '--json-output']);
      if (result.exitCode === 0 && result.stdout) {
        const data = JSON.parse(result.stdout);
        
        // PlatformIO boards --json-output returns an array of board objects
        if (Array.isArray(data)) {
          return data.map((board: any) => ({
            id: board.id || '',
            name: board.name || '',
            platform: board.platform || '',
            mcu: board.mcu || '',
            frequency: board.fcpu || '',
            flash: board.rom || '',
            ram: board.ram || ''
          }));
        }
      }
      return [];
    } catch (error) {
      console.error('Failed to list boards:', error);
      return [];
    }
  }

  /**
   * ボードを検索
   * pio boards [query] --json-output
   */
  async searchBoards(query: string): Promise<PlatformIOBoard[]> {
    try {
      const result = await this.executeCommand('pio', ['boards', query, '--json-output']);
      if (result.exitCode === 0 && result.stdout) {
        const data = JSON.parse(result.stdout);
        
        // PlatformIO boards command returns an array
        if (Array.isArray(data)) {
          return data.map((board: any) => ({
            id: board.id || '',
            name: board.name || '',
            platform: board.platform || '',
            mcu: board.mcu || '',
            frequency: board.fcpu || '',
            flash: board.rom || '',
            ram: board.ram || ''
          }));
        }
      }
      return [];
    } catch (error) {
      console.error('Failed to search boards:', error);
      return [];
    }
  }

  /**
   * インストール済みボードを一覧表示
   * pio boards --installed --json-output
   */
  async listInstalledBoards(): Promise<PlatformIOBoard[]> {
    try {
      const result = await this.executeCommand('pio', ['boards', '--installed', '--json-output']);
      if (result.exitCode === 0 && result.stdout) {
        const data = JSON.parse(result.stdout);
        return Object.entries(data).map(([id, board]: [string, any]) => ({
          id,
          name: board.name || '',
          platform: board.platform || '',
          mcu: board.mcu || '',
          frequency: board.fcpu || '',
          flash: board.rom || '',
          ram: board.ram || ''
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to list installed boards:', error);
      return [];
    }
  }

  // デバイス関連コマンド

  /**
   * 接続されているデバイスを一覧表示
   * pio device list --json-output
   */
  async listDevices(): Promise<PlatformIODevice[]> {
    try {
      const result = await this.executeCommand('pio', ['device', 'list', '--json-output']);
      if (result.exitCode === 0 && result.stdout) {
        const data = JSON.parse(result.stdout);
        return data.map((device: any) => ({
          port: device.port || '',
          description: device.description || '',
          hwid: device.hwid || ''
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to list devices:', error);
      return [];
    }
  }

  /**
   * シリアルモニターを開く
   * pio device monitor --port <port> --baud <baudrate>
   */
  async startMonitor(port: string, baudRate: number = 9600): Promise<any> {
    try {
      const result = await this.executeCommand('pio', [
        'device',
        'monitor',
        '--port', port,
        '--baud', baudRate.toString()
      ]);
      return result;
    } catch (error) {
      console.error('Failed to start monitor:', error);
      throw error;
    }
  }

  // パッケージ関連コマンド

  /**
   * ライブラリを検索
   * pio pkg search [query] --json-output
   */
  async searchLibraries(query: string): Promise<PlatformIOLibrary[]> {
    try {
      const result = await this.executeCommand('pio', ['pkg', 'search', query, '--json-output']);
      if (result.exitCode === 0 && result.stdout) {
        const data = JSON.parse(result.stdout);
        return data.items?.map((lib: any) => ({
          id: lib.id || 0,
          name: lib.name || '',
          description: lib.description || '',
          keywords: lib.keywords || [],
          version: lib.version?.name || '',
          homepage: lib.homepage || '',
          repository: lib.repository?.url || ''
        })) || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to search libraries:', error);
      return [];
    }
  }

  /**
   * インストール済みライブラリを一覧表示
   * pio pkg list --json-output
   */
  async listInstalledLibraries(projectPath?: string): Promise<PlatformIOLibrary[]> {
    try {
      const options = projectPath ? { cwd: projectPath } : {};
      const result = await this.executeCommand('pio', ['pkg', 'list', '--json-output'], options);
      if (result.exitCode === 0 && result.stdout) {
        const data = JSON.parse(result.stdout);
        return data.items?.map((lib: any) => ({
          id: lib.id || 0,
          name: lib.name || '',
          description: lib.description || '',
          keywords: lib.keywords || [],
          version: lib.version?.name || '',
          homepage: lib.homepage || '',
          repository: lib.repository?.url || ''
        })) || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to list installed libraries:', error);
      return [];
    }
  }

  /**
   * ライブラリをインストール
   * pio pkg install <library>
   */
  async installLibrary(name: string, projectPath?: string): Promise<boolean> {
    try {
      const options = projectPath ? { cwd: projectPath } : {};
      const result = await this.executeCommand('pio', ['pkg', 'install', name], options);
      return result.exitCode === 0;
    } catch (error) {
      console.error('Failed to install library:', error);
      return false;
    }
  }

  /**
   * ライブラリをアンインストール
   * pio pkg uninstall <library>
   */
  async uninstallLibrary(name: string, projectPath?: string): Promise<boolean> {
    try {
      const options = projectPath ? { cwd: projectPath } : {};
      const result = await this.executeCommand('pio', ['pkg', 'uninstall', name], options);
      return result.exitCode === 0;
    } catch (error) {
      console.error('Failed to uninstall library:', error);
      return false;
    }
  }

  /**
   * パッケージを更新
   * pio pkg update
   */
  async updatePackages(projectPath?: string): Promise<boolean> {
    try {
      const options = projectPath ? { cwd: projectPath } : {};
      const result = await this.executeCommand('pio', ['pkg', 'update'], options);
      return result.exitCode === 0;
    } catch (error) {
      console.error('Failed to update packages:', error);
      return false;
    }
  }

  // プロジェクト関連コマンド

  /**
   * Arduino ボードIDをPlatformIOボードIDに変換
   */
  private mapArduinoToPlatformIOBoard(boardId: string): string {
    const mapping: { [key: string]: string } = {
      'arduino:avr:uno': 'uno',
      'arduino:avr:nano': 'nanoatmega328',
      'arduino:avr:mini': 'mini',
      'arduino:avr:leonardo': 'leonardo',
      'arduino:avr:mega': 'megaatmega2560',
      'arduino:avr:micro': 'micro',
      'arduino:avr:pro': 'pro16MHzatmega328',
      'arduino:avr:diecimila': 'diecimila',
      'arduino:avr:bt': 'bt',
      'arduino:avr:lilypad': 'lilypadatmega328',
      'arduino:avr:fio': 'fio',
      'arduino:avr:gemma': 'gemma',
      'arduino:avr:circuitplay32u4cat': 'circuitplay32u4cat',
      'arduino:avr:yunmini': 'yunmini',
      'arduino:avr:chiwawa': 'chiwawa',
      'arduino:avr:one': 'one',
      'arduino:avr:unowifi': 'unowifi',
      'esp32:esp32:esp32': 'esp32dev',
      'esp8266:esp8266:nodemcuv2': 'nodemcuv2'
    };

    // マッピングテーブルに存在する場合は変換
    if (mapping[boardId]) {
      logger.debug(`Board ID mapped: ${boardId} -> ${mapping[boardId]}`);
      return mapping[boardId];
    }

    // 既にPlatformIO形式の場合はそのまま返す
    if (!boardId.includes(':')) {
      logger.debug(`Board ID already in PlatformIO format: ${boardId}`);
      return boardId;
    }

    // デフォルトは uno
    logger.warning(`Unknown board ID: ${boardId}, defaulting to 'uno'`);
    return 'uno';
  }

  /**
   * 新しいプロジェクトを初期化
   * pio project init --board <board-id>
   */
  async initProject(projectPath: string, boardId: string): Promise<boolean> {
    try {
      // Arduino形式のボードIDをPlatformIO形式に変換
      const platformioBoardId = this.mapArduinoToPlatformIOBoard(boardId);
      
      logger.debug('initProject called with parameters', { 
        projectPath, 
        originalBoardId: boardId,
        mappedBoardId: platformioBoardId,
        boardIdType: typeof boardId,
        boardIdString: String(boardId)
      });
      logger.info('PlatformIO プロジェクトを作成中...', `ボード: ${platformioBoardId} (元: ${boardId})\nパス: ${projectPath}`, 'pio project init');
      
      // プロジェクトディレクトリを作成
      logger.debug('ディレクトリを作成中...', projectPath);
      await window.electronAPI.fs.mkdir(projectPath);
      
      // PlatformIOプロジェクトを初期化
      logger.debug('PlatformIO を初期化中...');
      const result = await this.executeCommand('pio', [
        'project',
        'init',
        '--board', platformioBoardId
      ], { cwd: projectPath });
      
      if (result.exitCode === 0) {
        logger.debug('main.cpp を作成中...');
        // デフォルトのmain.cppファイルを作成
        const mainContent = `#include <Arduino.h>

void setup() {
  Serial.begin(9600);
  Serial.println("Hello from Tova IDE!");
}

void loop() {
  // Your code here
}`;
        
        const srcPath = `${projectPath}/src`;
        await window.electronAPI.fs.mkdir(srcPath);
        await window.electronAPI.fs.writeFile(`${srcPath}/main.cpp`, mainContent);
        
        logger.success('PlatformIO プロジェクトを作成しました', projectPath);
        toast.success('プロジェクトを作成しました', `${projectPath}`);
        return true;
      } else {
        logger.error('プロジェクトの作成に失敗しました', result.stderr);
        toast.error('プロジェクトの作成に失敗', result.stderr);
        return false;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Failed to init project:', errorMsg);
      toast.error('プロジェクト作成エラー', errorMsg);
      return false;
    }
  }

  /**
   * プロジェクト設定を取得
   * pio project config --json-output
   */
  async getProjectConfig(projectPath: string): Promise<any> {
    try {
      const result = await this.executeCommand('pio', [
        'project',
        'config',
        '--json-output'
      ], { cwd: projectPath });
      
      if (result.exitCode === 0 && result.stdout) {
        return JSON.parse(result.stdout);
      }
      return null;
    } catch (error) {
      console.error('Failed to get project config:', error);
      return null;
    }
  }

  // ビルド・アップロード関連コマンド

  /**
   * プロジェクトをビルド
   * pio run
   */
  async build(projectPath: string, verbose: boolean = false): Promise<CompileResult> {
    try {
      logger.info('Starting PlatformIO build process...', projectPath);
      
      // Check if project exists and has platformio.ini
      const iniPath = `${projectPath}/platformio.ini`;
      const iniExists = await window.electronAPI.fs.exists(iniPath);
      if (!iniExists) {
        throw new Error('platformio.ini not found. Is this a valid PlatformIO project?');
      }
      
      // Build the arguments
      const args = ['run'];
      if (verbose) {
        args.push('--verbose');
      }
      
      logger.info('Executing PlatformIO build command...', args.join(' '));
      
      const result = await this.executeCommand('pio', args, { cwd: projectPath });
      
      const output = result.stdout + '\n' + result.stderr;
      const errors: string[] = [];
      const warnings: string[] = [];

      // Parse output for errors and warnings
      if (result.stderr) {
        const lines = result.stderr.split('\n');
        lines.forEach(line => {
          if (line.includes('error:') || line.includes('Error') || line.includes('FAILED')) {
            errors.push(line.trim());
          } else if (line.includes('warning:') || line.includes('Warning')) {
            warnings.push(line.trim());
          }
        });
      }
      
      // Also check stdout for build information
      if (result.stdout) {
        const lines = result.stdout.split('\n');
        lines.forEach(line => {
          if (line.includes('error:') || line.includes('Error') || line.includes('FAILED')) {
            errors.push(line.trim());
          } else if (line.includes('warning:') || line.includes('Warning')) {
            warnings.push(line.trim());
          }
        });
      }
      
      const success = result.exitCode === 0 && errors.length === 0;
      
      if (success) {
        logger.success('PlatformIO build completed successfully');
      } else {
        logger.error('PlatformIO build failed', `Exit code: ${result.exitCode}, Errors: ${errors.length}`);
      }
      
      return {
        success,
        output,
        errors,
        warnings,
        binaryPath: success ? `${projectPath}/.pio/build` : undefined
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('PlatformIO build exception:', errorMsg);
      return {
        success: false,
        output: '',
        errors: [`Build failed: ${errorMsg}`],
        warnings: []
      };
    }
  }

  /**
   * コンパイル（buildのエイリアス）
   */
  async compile(projectPath: string, verbose: boolean = false): Promise<CompileResult> {
    return this.build(projectPath, verbose);
  }

  /**
   * プロジェクトをアップロード
   * pio run --target upload
   */
  async upload(projectPath: string, port?: string): Promise<UploadResult> {
    try {
      const args = ['run', '--target', 'upload'];
      if (port) {
        args.push('--upload-port', port);
      }
      
      const result = await this.executeCommand('pio', args, { cwd: projectPath });
      
      const output = result.stdout + '\n' + result.stderr;
      const errors: string[] = [];

      if (result.stderr) {
        const lines = result.stderr.split('\n');
        lines.forEach(line => {
          if (line.includes('error:') || line.includes('Error')) {
            errors.push(line);
          }
        });
      }
      
      return {
        success: result.exitCode === 0,
        output,
        errors
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        errors: [`Upload failed: ${error}`]
      };
    }
  }

  /**
   * プロジェクトをクリーン
   * pio run --target clean
   */
  async clean(projectPath: string): Promise<boolean> {
    try {
      const result = await this.executeCommand('pio', [
        'run',
        '--target', 'clean'
      ], { cwd: projectPath });
      return result.exitCode === 0;
    } catch (error) {
      console.error('Failed to clean project:', error);
      return false;
    }
  }

  /**
   * ビルドとアップロードを一度に実行
   * pio run --target upload
   */
  async buildAndUpload(projectPath: string, port?: string): Promise<CompileResult> {
    try {
      const args = ['run', '--target', 'upload'];
      if (port) {
        args.push('--upload-port', port);
      }
      
      const result = await this.executeCommand('pio', args, { cwd: projectPath });
      
      const output = result.stdout + '\n' + result.stderr;
      const errors: string[] = [];
      const warnings: string[] = [];

      if (result.stderr) {
        const lines = result.stderr.split('\n');
        lines.forEach(line => {
          if (line.includes('error:') || line.includes('Error')) {
            errors.push(line);
          } else if (line.includes('warning:') || line.includes('Warning')) {
            warnings.push(line);
          }
        });
      }
      
      return {
        success: result.exitCode === 0,
        output,
        errors,
        warnings
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        errors: [`Build and upload failed: ${error}`],
        warnings: []
      };
    }
  }

  // テスト関連コマンド

  /**
   * テストを実行
   * pio test
   */
  async runTests(projectPath: string): Promise<CompileResult> {
    try {
      const result = await this.executeCommand('pio', ['test'], { cwd: projectPath });
      
      const output = result.stdout + '\n' + result.stderr;
      const errors: string[] = [];
      const warnings: string[] = [];

      if (result.stderr) {
        const lines = result.stderr.split('\n');
        lines.forEach(line => {
          if (line.includes('FAILED') || line.includes('Error')) {
            errors.push(line);
          }
        });
      }
      
      return {
        success: result.exitCode === 0,
        output,
        errors,
        warnings
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        errors: [`Test failed: ${error}`],
        warnings: []
      };
    }
  }

  // デバッグ関連コマンド

  /**
   * デバッグを開始
   * pio debug
   */
  async startDebug(projectPath: string): Promise<boolean> {
    try {
      const result = await this.executeCommand('pio', ['debug'], { cwd: projectPath });
      return result.exitCode === 0;
    } catch (error) {
      console.error('Failed to start debug:', error);
      return false;
    }
  }

  // 静的解析

  /**
   * コード静的解析を実行
   * pio check
   */
  async runStaticAnalysis(projectPath: string): Promise<CompileResult> {
    try {
      const result = await this.executeCommand('pio', ['check'], { cwd: projectPath });
      
      const output = result.stdout + '\n' + result.stderr;
      const errors: string[] = [];
      const warnings: string[] = [];

      if (result.stdout) {
        const lines = result.stdout.split('\n');
        lines.forEach(line => {
          if (line.includes('error:')) {
            errors.push(line);
          } else if (line.includes('warning:')) {
            warnings.push(line);
          }
        });
      }
      
      return {
        success: result.exitCode === 0,
        output,
        errors,
        warnings
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        errors: [`Static analysis failed: ${error}`],
        warnings: []
      };
    }
  }
}

export default PlatformIOService.getInstance();

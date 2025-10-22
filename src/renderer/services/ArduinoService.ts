// Arduino CLI Service - Complete implementation based on actual commands

import { logger, toast } from '../utils/logger';
import CompileCacheService from './CompileCacheService';

export interface ArduinoBoard {
  name: string;
  fqbn: string;
  port?: string;
  connected?: boolean;
  platform?: string;
}

export interface ArduinoLibrary {
  name: string;
  version: string;
  author?: string;
  description?: string;
  installed?: boolean;
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

export interface ArduinoPort {
  address: string;
  label: string;
  protocol: string;
  protocolLabel: string;
}

export class ArduinoCLIService {
  private static instance: ArduinoCLIService;
  
  public static getInstance(): ArduinoCLIService {
    if (!ArduinoCLIService.instance) {
      ArduinoCLIService.instance = new ArduinoCLIService();
    }
    return ArduinoCLIService.instance;
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

  // Installation check and initialization

  async checkInstallation(): Promise<boolean> {
    try {
      const result = await this.executeCommand('arduino-cli', ['version']);
      return result.exitCode === 0;
    } catch (error) {
      return false;
    }
  }

  async initConfig(): Promise<boolean> {
    try {
      const result = await this.executeCommand('arduino-cli', ['config', 'init']);
      return result.exitCode === 0;
    } catch (error) {
      console.error('Failed to init config:', error);
      return false;
    }
  }

  async updateCoreIndex(): Promise<boolean> {
    try {
      const result = await this.executeCommand('arduino-cli', ['core', 'update-index']);
      return result.exitCode === 0;
    } catch (error) {
      console.error('Failed to update core index:', error);
      return false;
    }
  }

  async updateLibraryIndex(): Promise<boolean> {
    try {
      const result = await this.executeCommand('arduino-cli', ['lib', 'update-index']);
      return result.exitCode === 0;
    } catch (error) {
      console.error('Failed to update library index:', error);
      return false;
    }
  }

  // Board management commands

  /**
   * List connected boards
   * arduino-cli board list --format json
   */
  async listConnectedBoards(): Promise<ArduinoBoard[]> {
    try {
      const result = await this.executeCommand('arduino-cli', ['board', 'list', '--format', 'json']);
      if (result.exitCode === 0 && result.stdout) {
        const data = JSON.parse(result.stdout);
        return data.detected_ports?.map((port: any) => ({
          name: port.matching_boards?.[0]?.name || 'Unknown Board',
          fqbn: port.matching_boards?.[0]?.fqbn || '',
          port: port.port?.address || '',
          connected: true,
          platform: port.matching_boards?.[0]?.fqbn?.split(':')[0] || ''
        })) || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to list connected boards:', error);
      return [];
    }
  }

  /**
   * List all boards (connected + installed cores)
   * Called by ProjectManager and other components
   */
  async listBoards(): Promise<ArduinoBoard[]> {
    try {
      const connected = await this.listConnectedBoards();
      
      const result = await this.executeCommand('arduino-cli', ['board', 'listall', '--format', 'json']);
      if (result.exitCode === 0 && result.stdout) {
        const data = JSON.parse(result.stdout);
        const allBoards = data.boards?.map((board: any) => ({
          name: board.name || '',
          fqbn: board.fqbn || '',
          platform: board.platform?.metadata?.id || '',
          connected: false
        })) || [];
        
        return [...connected, ...allBoards.slice(0, 20)];
      }
      
      return connected;
    } catch (error) {
      console.error('Failed to list boards:', error);
      return [];
    }
  }

  /**
   * Search all supported boards
   * arduino-cli board listall [query] --format json
   */
  async searchAllBoards(query: string = ''): Promise<ArduinoBoard[]> {
    try {
      const args = ['board', 'listall'];
      if (query) args.push(query);
      args.push('--format', 'json');
      
      const result = await this.executeCommand('arduino-cli', args);
      if (result.exitCode === 0 && result.stdout) {
        const data = JSON.parse(result.stdout);
        return data.boards?.map((board: any) => ({
          name: board.name || '',
          fqbn: board.fqbn || '',
          platform: board.platform?.metadata?.id || '',
          connected: false
        })) || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to search all boards:', error);
      return [];
    }
  }

  /**
   * Search boards in board manager
   * arduino-cli board search [query] --format json
   */
  async searchBoards(query: string): Promise<ArduinoBoard[]> {
    try {
      const result = await this.executeCommand('arduino-cli', ['board', 'search', query, '--format', 'json']);
      if (result.exitCode === 0 && result.stdout) {
        const data = JSON.parse(result.stdout);
        return data.boards?.map((board: any) => ({
          name: board.name || '',
          fqbn: board.fqbn || '',
          platform: board.platform?.name || '',
          connected: false
        })) || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to search boards:', error);
      return [];
    }
  }

  /**
   * Get board details
   * arduino-cli board details -b <fqbn> --format json
   */
  async getBoardDetails(fqbn: string): Promise<any> {
    try {
      const result = await this.executeCommand('arduino-cli', ['board', 'details', '-b', fqbn, '--format', 'json']);
      if (result.exitCode === 0 && result.stdout) {
        return JSON.parse(result.stdout);
      }
      return null;
    } catch (error) {
      console.error('Failed to get board details:', error);
      return null;
    }
  }

  /**
   * List serial ports
   * arduino-cli board list --format json
   */
  async listPorts(): Promise<ArduinoPort[]> {
    try {
      const result = await this.executeCommand('arduino-cli', ['board', 'list', '--format', 'json']);
      if (result.exitCode === 0 && result.stdout) {
        const data = JSON.parse(result.stdout);
        return data.detected_ports?.map((port: any) => ({
          address: port.port?.address || '',
          label: port.port?.label || port.port?.address || '',
          protocol: port.port?.protocol || 'serial',
          protocolLabel: port.port?.protocol_label || 'Serial'
        })) || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to list ports:', error);
      return [];
    }
  }

  // Library management commands

  /**
   * Search libraries
   * arduino-cli lib search [query] --format json
   */
  async searchLibraries(query: string): Promise<ArduinoLibrary[]> {
    try {
      const result = await this.executeCommand('arduino-cli', ['lib', 'search', query, '--format', 'json']);
      if (result.exitCode === 0 && result.stdout) {
        const data = JSON.parse(result.stdout);
        return data.libraries?.map((lib: any) => {
          const latest = lib.releases ? Object.values(lib.releases).pop() as any : lib.latest;
          return {
            name: lib.name || '',
            version: latest?.version || '',
            author: latest?.author || '',
            description: latest?.sentence || '',
            installed: false
          };
        }) || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to search libraries:', error);
      return [];
    }
  }

  /**
   * List installed libraries
   * arduino-cli lib list --format json
   */
  async listInstalledLibraries(): Promise<ArduinoLibrary[]> {
    try {
      const result = await this.executeCommand('arduino-cli', ['lib', 'list', '--format', 'json']);
      if (result.exitCode === 0 && result.stdout) {
        const data = JSON.parse(result.stdout);
        return data.installed_libraries?.map((lib: any) => ({
          name: lib.library?.name || '',
          version: lib.library?.version || '',
          author: lib.library?.author || '',
          description: lib.library?.sentence || '',
          installed: true
        })) || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to list installed libraries:', error);
      return [];
    }
  }

  /**
   * List libraries (alias for listInstalledLibraries)
   */
  async listLibraries(): Promise<ArduinoLibrary[]> {
    return this.listInstalledLibraries();
  }

  /**
   * Install library
   * arduino-cli lib install <library>
   */
  async installLibrary(name: string): Promise<boolean> {
    try {
      const result = await this.executeCommand('arduino-cli', ['lib', 'install', name]);
      return result.exitCode === 0;
    } catch (error) {
      console.error('Failed to install library:', error);
      return false;
    }
  }

  /**
   * Uninstall library
   * arduino-cli lib uninstall <library>
   */
  async uninstallLibrary(name: string): Promise<boolean> {
    try {
      const result = await this.executeCommand('arduino-cli', ['lib', 'uninstall', name]);
      return result.exitCode === 0;
    } catch (error) {
      console.error('Failed to uninstall library:', error);
      return false;
    }
  }

  // Sketch management commands

  /**
   * Create new sketch
   * arduino-cli sketch new <sketch-name>
   */
  async createSketch(path: string, name: string): Promise<boolean> {
    try {
      logger.info('Creating Arduino sketch...', `Name: ${name}, Path: ${path}`, 'arduino-cli sketch new');
      const result = await this.executeCommand('arduino-cli', ['sketch', 'new', name], { cwd: path });
      
      if (result.exitCode === 0) {
        logger.success('Arduino sketch created', `${name} created in ${path}`);
        toast.success('Sketch created', name);
        return true;
      } else {
        logger.error('Failed to create sketch', result.stderr);
        toast.error('Failed to create sketch', result.stderr);
        return false;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Failed to create sketch:', errorMsg);
      toast.error('Sketch creation error', errorMsg);
      return false;
    }
  }

  /**
   * Create Arduino project (alias for createSketch + folder creation)
   */
  async createProject(name: string, path: string, board: string): Promise<boolean> {
    try {
      logger.info(`Creating Arduino project "${name}"...`, { board, path });
      
      const parentPath = path.split(/[/\\]/).slice(0, -1).join('/');
      await this.executeCommand('mkdir', ['-p', path], { cwd: parentPath });
      logger.debug('Project directory created', path);
      
      const result = await this.createSketch(parentPath, name);
      
      if (result) {
        logger.success(`Arduino project "${name}" created`, { board, path });
        return true;
      }
      
      return false;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Failed to create Arduino project', { error: errorMsg, name, path, board });
      return false;
    }
  }

  // Compile and Upload commands

  /**
   * Compile sketch
   * arduino-cli compile --fqbn <fqbn> <sketch-path>
   */
  async compile(sketchPath: string, fqbn: string, verbose: boolean = false): Promise<CompileResult> {
    try {
      logger.info('Starting Arduino compilation...', `${sketchPath} for ${fqbn}`);
      
      // コンパイル前にハッシュを計算
      const cacheService = CompileCacheService.getInstance();
      const codeHash = await cacheService.computeHash(sketchPath);
      
      // LAN 内のキャッシュサーバーから取得を試みる
      if (codeHash) {
        const cachedBinary = await cacheService.fetchCompiledBinary(
          codeHash,
          fqbn.split(':')[1] || 'unknown',
          fqbn.split(':')[0] || 'unknown'
        );

        if (cachedBinary) {
          logger.success('Compile cache hit', `Using cached binary for ${fqbn}`);
          return {
            success: true,
            output: 'Using cached compilation result',
            errors: [],
            warnings: [],
            binaryPath: cachedBinary
          };
        }
      }

      // Build compilation arguments
      const args = ['compile', '--fqbn', fqbn];
      if (verbose) {
        args.push('--verbose');
      }
      args.push(sketchPath);

      logger.info('Executing Arduino compilation...', args.join(' '));

      // キャッシュミスの場合、通常のコンパイルを実行
      const result = await this.executeCommand('arduino-cli', args);
      
      const output = result.stdout + '\n' + result.stderr;
      const errors: string[] = [];
      const warnings: string[] = [];

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

      // コンパイル成功時にローカルキャッシュに保存
      if (success && codeHash) {
        const binaryPath = `${sketchPath}/build`;
        await cacheService.cacheLocally(codeHash, binaryPath, fqbn.split(':')[1], fqbn.split(':')[0]);
        logger.success('Arduino compilation completed successfully');
      } else {
        logger.error('Arduino compilation failed', `Exit code: ${result.exitCode}, Errors: ${errors.length}`);
      }
      
      return {
        success: result.exitCode === 0,
        output,
        errors,
        warnings,
        binaryPath: result.exitCode === 0 ? `${sketchPath}/build` : undefined
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        errors: [`Compile failed: ${error}`],
        warnings: []
      };
    }
  }

  /**
   * Upload sketch
   * arduino-cli upload -p <port> --fqbn <fqbn> <sketch-path>
   */
  async upload(sketchPath: string, fqbn: string, port: string): Promise<UploadResult> {
    try {
      const result = await this.executeCommand('arduino-cli', [
        'upload',
        '-p', port,
        '--fqbn', fqbn,
        sketchPath
      ]);
      
      const output = result.stdout + '\n' + result.stderr;
      const errors: string[] = [];

      if (result.exitCode !== 0 && result.stderr) {
        errors.push(result.stderr);
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
   * Start serial monitor
   * arduino-cli monitor -p <port> -c baudrate=<baudrate>
   */
  async startMonitor(port: string, baudRate: number = 9600): Promise<any> {
    try {
      const result = await this.executeCommand('arduino-cli', [
        'monitor',
        '-p', port,
        '-c', `baudrate=${baudRate}`
      ]);
      return result;
    } catch (error) {
      console.error('Failed to start monitor:', error);
      throw error;
    }
  }
}

// Export singleton instance and class
const arduinoService = ArduinoCLIService.getInstance();
export default arduinoService;

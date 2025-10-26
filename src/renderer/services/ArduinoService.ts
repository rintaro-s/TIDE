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

export interface ArduinoCorePackage {
  id: string;
  name: string;
  maintainer?: string;
  description?: string;
  latestVersion?: string;
  website?: string;
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
      // Try with full path first (Windows)
      let result: any;
      try {
        result = await window.electronAPI.process.exec(command, args, options || {});
      } catch (err) {
        // If command not found, try with 'where' to locate it
        if (command === 'arduino-cli') {
          console.warn('arduino-cli not found in PATH, attempting to locate...');
          const whereResult = await window.electronAPI.process.exec('where', ['arduino-cli']);
          if (whereResult.exitCode === 0 && whereResult.stdout) {
            const foundPath = whereResult.stdout.trim().split('\n')[0];
            console.log('Found arduino-cli at:', foundPath);
            result = await window.electronAPI.process.exec(foundPath, args, options || {});
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }
      return result;
    } catch (error) {
      console.error(`Command execution error for "${command}":`, error);
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
      
      if (result.exitCode !== 0) {
        logger.warning('Failed to list connected boards', result.stderr);
        return [];
      }
      
      if (!result.stdout || result.stdout.trim() === '') {
        logger.debug('No connected boards found');
        return [];
      }
      
      try {
        const data = JSON.parse(result.stdout);
        const boards = data.detected_ports?.map((port: any) => ({
          name: port.matching_boards?.[0]?.name || 'Unknown Board',
          fqbn: port.matching_boards?.[0]?.fqbn || '',
          port: port.port?.address || '',
          connected: true,
          platform: port.matching_boards?.[0]?.fqbn?.split(':')[0] || ''
        })) || [];
        
        logger.debug(`Found ${boards.length} connected boards`);
        return boards;
      } catch (parseError) {
        const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
        logger.warning('Failed to parse connected boards JSON', errorMsg);
        return [];
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.warning('Failed to list connected boards', errorMsg);
      return [];
    }
  }

  /**
   * List all boards (connected + installed cores)
   * Called by ProjectManager and other components
   */
  async listBoards(): Promise<ArduinoBoard[]> {
    try {
      logger.info('Listing Arduino boards...');
      
      // First get connected boards
      const connected = await this.listConnectedBoards();
      logger.debug(`Found ${connected.length} connected boards`);
      
      // Then get all available boards
      const result = await this.executeCommand('arduino-cli', ['board', 'listall', '--format', 'json']);
      
      if (result.exitCode !== 0) {
        logger.warning(`arduino-cli board listall failed with code ${result.exitCode}`, result.stderr);
        // Return only connected boards on failure
        return connected;
      }
      
      if (!result.stdout || result.stdout.trim() === '') {
        logger.warning('No output from arduino-cli board listall');
        return connected;
      }
      
      try {
        const data = JSON.parse(result.stdout);
        const allBoards = data.boards?.map((board: any) => ({
          name: board.name || 'Unknown',
          fqbn: board.fqbn || '',
          platform: board.platform?.id || board.platform?.name || board.core || '',
          connected: false
        })) || [];
        
        logger.success(`Retrieved ${allBoards.length} available boards`);
        
        // Combine connected and available, removing duplicates
        const boardMap = new Map<string, ArduinoBoard>();
        allBoards.forEach((b: ArduinoBoard) => {
          if (b.fqbn) boardMap.set(b.fqbn, b);
        });
        connected.forEach((c) => {
          boardMap.set(c.fqbn || c.name, { ...c, connected: true });
        });
        
        return Array.from(boardMap.values());
      } catch (parseError) {
        const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
        logger.error('Failed to parse JSON from arduino-cli', errorMsg);
        console.error('JSON parse error - raw output:', result.stdout.substring(0, 500));
        return connected;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Failed to list boards', errorMsg);
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
      logger.info('Searching boards...', query);
      const result = await this.executeCommand('arduino-cli', ['board', 'search', query, '--format', 'json']);
      
      if (result.exitCode !== 0) {
        logger.warning(`Board search failed: ${query}`, result.stderr);
        return [];
      }
      
      if (!result.stdout || result.stdout.trim() === '') {
        logger.debug('No boards found matching query', query);
        return [];
      }
      
      try {
        const data = JSON.parse(result.stdout);
        const boards = data.boards?.map((board: any) => ({
          name: board.name || '',
          fqbn: board.fqbn || '',
          platform: board.platform?.name || '',
          connected: false
        })) || [];
        
        logger.success(`Found ${boards.length} boards matching "${query}"`);
        return boards;
      } catch (parseError) {
        const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
        logger.warning('Failed to parse board search results', errorMsg);
        return [];
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Failed to search boards', errorMsg);
      return [];
    }
  }

  /**
   * Search board core packages (Board Manager entries)
   * arduino-cli core search [query] --format json
   */
  async searchCorePackages(query: string = ''): Promise<ArduinoCorePackage[]> {
    try {
      const args = ['core', 'search'];
      if (query && query.trim()) {
        args.push(query.trim());
      }
      args.push('--format', 'json');

      logger.info('Searching core packages...', query || '<all>');
      const result = await this.executeCommand('arduino-cli', args);

      if (result.exitCode !== 0) {
        logger.warning(`Core search failed: ${query}`, result.stderr);
        return [];
      }

      if (!result.stdout || result.stdout.trim() === '') {
        logger.debug('No core packages found matching query', query);
        return [];
      }

      try {
        const data = JSON.parse(result.stdout);

        const extractItems = (node: any): any[] => {
          if (!node) return [];
          if (Array.isArray(node)) return node;
          if (node.items && Array.isArray(node.items)) return node.items;
          if (node.result && Array.isArray(node.result)) return node.result;
          if (node.results && Array.isArray(node.results)) return node.results;
          if (node.packages && Array.isArray(node.packages)) return node.packages;
          if (node.search_response && Array.isArray(node.search_response.items)) {
            return node.search_response.items;
          }
          if (typeof node === 'object') {
            for (const key of Object.keys(node)) {
              const nested = extractItems(node[key]);
              if (nested.length) return nested;
            }
          }
          return [];
        };

        const pickString = (...values: any[]): string | undefined => {
          for (const value of values) {
            if (typeof value === 'string' && value.trim()) {
              return value.trim();
            }
          }
          for (const value of values) {
            if (value && typeof value === 'object') {
              const nested = pickString(...Object.values(value));
              if (nested) return nested;
            }
          }
          return undefined;
        };

        const items = extractItems(data);
        const packages = items
          .map((item: any) => {
            const id = pickString(item.id, item.ID, item.package, item.Package);
            const name = pickString(item.name, item.Name, item.title, item.Title);
            const maintainer = pickString(item.maintainer, item.Maintainer, item.author, item.Author);
            const latestVersion = pickString(item.latest_version, item.latestVersion, item.version, item.Version);
            const description = pickString(item.description, item.Description, item.sentence, item.Sentence);
            const website = pickString(item.website, item.Website, item.url, item.Url, item.URL, item.help, item.Help, item.homepage, item.Homepage);

            const resolvedId = id || name;
            if (!resolvedId) {
              return null;
            }

            return {
              id: resolvedId,
              name: name || resolvedId,
              maintainer: maintainer || undefined,
              description: description || undefined,
              latestVersion: latestVersion || undefined,
              website: website || undefined,
            } as ArduinoCorePackage;
          })
          .filter((pkg): pkg is ArduinoCorePackage => Boolean(pkg));

        logger.success(`Found ${packages.length} core packages matching "${query || 'all'}"`);
        return packages;
      } catch (parseError) {
        const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
        logger.warning('Failed to parse core search results', errorMsg);
        return [];
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Failed to search core packages', errorMsg);
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
      logger.info('Searching libraries...', query);
      const result = await this.executeCommand('arduino-cli', ['lib', 'search', query, '--format', 'json']);
      
      if (result.exitCode !== 0) {
        logger.warning(`Library search failed: ${query}`, result.stderr);
        return [];
      }
      
      if (!result.stdout || result.stdout.trim() === '') {
        logger.debug('No libraries found matching query', query);
        return [];
      }
      
      try {
        const data = JSON.parse(result.stdout);
        const libraries = data.libraries?.map((lib: any) => {
          // latest が無い場合、releases の最新版を取得
          let latest = lib.latest;
          if (!latest && lib.releases) {
            const releaseKeys = Object.keys(lib.releases).sort((a, b) => 
              b.localeCompare(a, undefined, {numeric: true})
            );
            if (releaseKeys.length > 0) {
              latest = lib.releases[releaseKeys[0]];
            }
          }
          
          // latest が確実に object であることを確認
          const latestData = typeof latest === 'object' && latest !== null ? latest : {};
          
          return {
            name: lib.name || '',
            version: latestData.version || lib.version || '1.0.0',
            author: latestData.author || lib.author || '',
            description: latestData.sentence || latestData.description || lib.sentence || lib.description || '',
            installed: false
          };
        }) || [];
        
        logger.success(`Found ${libraries.length} libraries matching "${query}"`);
        return libraries;
      } catch (parseError) {
        const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
        logger.warning('Failed to parse library search results', errorMsg);
        return [];
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Failed to search libraries', errorMsg);
      return [];
    }
  }

  /**
   * List installed libraries
   * arduino-cli lib list --format json
   */
  async listInstalledLibraries(): Promise<ArduinoLibrary[]> {
    try {
      logger.info('Listing installed libraries...');
      const result = await this.executeCommand('arduino-cli', ['lib', 'list', '--format', 'json']);
      
      if (result.exitCode !== 0) {
        logger.warning('Failed to list installed libraries', result.stderr);
        return [];
      }
      
      if (!result.stdout || result.stdout.trim() === '') {
        logger.debug('No installed libraries found');
        return [];
      }
      
      try {
        const data = JSON.parse(result.stdout);
        const libraries = data.installed_libraries?.map((lib: any) => ({
          name: lib.library?.name || '',
          version: lib.library?.version || '',
          author: lib.library?.author || '',
          description: lib.library?.sentence || lib.library?.description || '',
          installed: true
        })) || [];
        
        logger.success(`Found ${libraries.length} installed libraries`);
        return libraries;
      } catch (parseError) {
        const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
        logger.warning('Failed to parse installed libraries JSON', errorMsg);
        return [];
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.warning('Failed to list installed libraries', errorMsg);
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

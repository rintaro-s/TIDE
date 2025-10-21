interface CacheEntry {
  hash: string;
  timestamp: number;
  binPath: string;
  size: number;
  deviceIp: string;
}

interface CacheServer {
  ip: string;
  port: number;
  lastSeen: number;
  isTrusted: boolean;
}

export class CompileCacheService {
  private static instance: CompileCacheService;
  private cacheServers: Map<string, CacheServer> = new Map();
  private localCache: Map<string, CacheEntry> = new Map();
  private discoveryInterval: ReturnType<typeof setInterval> | null = null;
  private trustedServers: Set<string> = new Set();

  private constructor() {
    this.loadTrustedServers();
  }

  static getInstance(): CompileCacheService {
    if (!CompileCacheService.instance) {
      CompileCacheService.instance = new CompileCacheService();
    }
    return CompileCacheService.instance;
  }

  /**
   * コンパイル済みバイナリのハッシュを計算
   */
  async computeHash(filePath: string): Promise<string> {
    try {
      const content = await window.electronAPI?.fs.readFile(filePath);
      if (!content) return '';
      
      // Web Crypto API を使用
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      const hashBuffer = await (window.crypto || (globalThis as any).crypto).subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      return hashHex;
    } catch (error) {
      console.error('Failed to compute hash:', error);
      return '';
    }
  }

  /**
   * LAN 内のキャッシュサーバーを検出
   */
  async discoverCacheServers(): Promise<CacheServer[]> {
    const servers: CacheServer[] = [];

    try {
      // 現在のマシンのローカル IP を取得（簡易実装）
      const localIp = this.getLocalIpAddress();
      const baseIp = localIp.substring(0, localIp.lastIndexOf('.'));

      // LAN 内の他のマシンをスキャン
      for (let i = 1; i < 256; i++) {
        const ip = `${baseIp}.${i}`;
        
        // タイムアウト付きでポーティング
        const isAlive = await this.pingServer(ip, 15000);
        
        if (isAlive && ip !== localIp) {
          const server: CacheServer = {
            ip,
            port: 15000,
            lastSeen: Date.now(),
            isTrusted: this.trustedServers.has(ip)
          };
          
          servers.push(server);
          this.cacheServers.set(ip, server);
        }
      }
    } catch (error) {
      console.error('Failed to discover cache servers:', error);
    }

    return servers;
  }

  /**
   * ローカル IP アドレスを取得（簡易版）
   */
  private getLocalIpAddress(): string {
    // Electron の環境では localhost:127.0.0.1 として扱う
    // 実際の実装では os.networkInterfaces() を使用
    return '192.168.1.100'; // デフォルト値
  }

  /**
   * サーバーへの接続テスト
   */
  private async pingServer(
    ip: string,
    port: number,
    timeout: number = 1000
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve(false);
      }, timeout);

      try {
        // AbortController を使ってタイムアウトを実装
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        fetch(`http://${ip}:${port}/health`, { 
          method: 'GET',
          mode: 'no-cors',
          signal: controller.signal
        })
          .then(() => {
            clearTimeout(id);
            clearTimeout(timeoutId);
            resolve(true);
          })
          .catch(() => {
            clearTimeout(id);
            clearTimeout(timeoutId);
            resolve(false);
          });
      } catch {
        clearTimeout(timeoutId);
        resolve(false);
      }
    });
  }

  /**
   * リモートサーバーからコンパイル済みバイナリを取得
   */
  async fetchCompiledBinary(
    codeHash: string,
    board: string,
    core: string
  ): Promise<string | null> {
    for (const [ip, server] of this.cacheServers) {
      if (!server.isTrusted) continue;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(
          `http://${ip}:${server.port}/api/cache/get?hash=${codeHash}&board=${board}&core=${core}`,
          {
            method: 'GET',
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          
          // バイナリをローカル一時フォルダに保存
          const tempPath = await this.saveTempBinary(arrayBuffer, codeHash);
          return tempPath;
        }
      } catch (error) {
        console.error(`Failed to fetch from ${ip}:`, error);
      }
    }

    return null;
  }

  /**
   * 一時バイナリを保存
   */
  private async saveTempBinary(
    buffer: ArrayBuffer,
    hash: string
  ): Promise<string> {
    const tempDir = `${process.env.TEMP || '/tmp'}/tide-cache`;
    await window.electronAPI?.fs.mkdir(tempDir);

    const filePath = `${tempDir}/${hash}.bin`;
    // バイナリファイルの保存（実装省略）
    
    return filePath;
  }

  /**
   * ローカル キャッシュに保存
   */
  async cacheLocally(
    codeHash: string,
    binPath: string,
    board: string,
    core: string
  ): Promise<void> {
    try {
      const stat = await window.electronAPI?.fs.stat(binPath);
      
      const entry: CacheEntry = {
        hash: codeHash,
        timestamp: Date.now(),
        binPath,
        size: stat?.size || 0,
        deviceIp: this.getLocalIpAddress()
      };

      this.localCache.set(codeHash, entry);
      
      // electron-store に保存
      await window.electronAPI?.store.set('compileCacheEntries', 
        Array.from(this.localCache.values())
      );
    } catch (error) {
      console.error('Failed to cache locally:', error);
    }
  }

  /**
   * 信頼できるサーバーを追加
   */
  async trustServer(ip: string): Promise<void> {
    this.trustedServers.add(ip);
    
    // electron-store に保存
    await window.electronAPI?.store.set(
      'trustedCacheServers',
      Array.from(this.trustedServers)
    );

    const server = this.cacheServers.get(ip);
    if (server) {
      server.isTrusted = true;
    }
  }

  /**
   * 信頼できるサーバーを読み込み
   */
  private async loadTrustedServers(): Promise<void> {
    try {
      const servers = await window.electronAPI?.store.get('trustedCacheServers');
      if (Array.isArray(servers)) {
        this.trustedServers = new Set(servers);
      }
    } catch (error) {
      console.error('Failed to load trusted servers:', error);
    }
  }

  /**
   * ファイアウォール許可をリクエスト
   */
  async requestFirewallPermission(): Promise<boolean> {
    try {
      // Main プロセスに IPC でリクエスト
      const result = await window.electronAPI?.process.exec('netsh', [
        'advfirewall',
        'firewall',
        'add',
        'rule',
        'name=TIDE Cache Service',
        'dir=in',
        'action=allow',
        'protocol=tcp',
        'localport=15000'
      ]);

      return result?.exitCode === 0;
    } catch (error) {
      console.error('Failed to request firewall permission:', error);
      return false;
    }
  }

  /**
   * キャッシュの自動検出と同期を開始
   */
  startAutoDiscovery(intervalMs: number = 60000): void {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
    }

    this.discoveryInterval = setInterval(async () => {
      await this.discoverCacheServers();
    }, intervalMs);
  }

  /**
   * キャッシュサーバーの自動検出を停止
   */
  stopAutoDiscovery(): void {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }
  }
}

export default CompileCacheService;

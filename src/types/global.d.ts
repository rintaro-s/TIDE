declare global {
  interface Window {
    electronAPI: {
      store: {
        get: (key: string) => Promise<any>;
        set: (key: string, value: any) => Promise<void>;
      };
      fs: {
        exists: (filePath: string) => Promise<boolean>;
        readFile: (filePath: string) => Promise<string>;
        writeFile: (filePath: string, content: string) => Promise<void>;
        mkdir: (dirPath: string, options?: { recursive?: boolean }) => Promise<void>;
        readdir: (dirPath: string) => Promise<string[]>;
        stat: (path: string) => Promise<any>;
        rename: (oldPath: string, newPath: string) => Promise<void>;
        unlink: (filePath: string) => Promise<void>;
        rmdir: (dirPath: string) => Promise<void>;
        readBinary: (filePath: string) => Promise<ArrayBuffer>;
        writeBinary: (filePath: string, data: ArrayBuffer) => Promise<void>;
        getFileHash: (filePath: string) => Promise<string>;
        copy: (src: string, dest: string) => Promise<void>;
      };
      network: {
        startServer: (options: {
          port: number;
          routes: Record<string, (request: any) => Promise<any>>;
        }) => Promise<void>;
        stopServer: () => Promise<void>;
        broadcastUDP: (options: {
          port: number;
          message: string;
          interval: number;
        }) => Promise<void>;
        onUDPMessage: (callback: (message: string, address: string) => void) => void;
        httpRequest: (url: string, options?: any) => Promise<any>;
        startCacheServer: (peerId: string) => Promise<{ success: boolean; port: number }>;
        stopCacheServer: () => Promise<void>;
        broadcastPresence: (info: any) => Promise<void>;
        discoverTeamMembers: () => Promise<any[]>;
        startCollaborationServer: (options: any) => Promise<{ success: boolean; port: number }>;
        stopCollaborationServer: () => Promise<void>;
      };
      system: {
        requestFirewallPermission: (options: {
          ports: number[];
          reason: string;
        }) => Promise<{ granted: boolean; message?: string }>;
        getNetworkInterfaces: () => Promise<any[]>;
      };
      os: {
        hostname: () => Promise<string>;
        username: () => Promise<string>;
        platform: () => Promise<string>;
        arch: () => Promise<string>;
        cpus: () => Promise<any[]>;
        totalmem: () => Promise<number>;
      };
      path: {
        getAppDataPath: () => Promise<string>;
      };
      dialog: {
        showOpenDialog: (options: any) => Promise<any>;
        showSaveDialog: (options: any) => Promise<any>;
        showMessageBox: (options: any) => Promise<any>;
        showInputBox: (options: { title: string; message: string; defaultValue?: string }) => Promise<string | null>;
      };
      process: {
        exec: (command: string, args: string[], options?: any) => Promise<{
          stdout: string;
          stderr: string;
          exitCode: number;
        }>;
      };
      window: {
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
      };
      onMenuAction: (callback: (action: string, data?: any) => void) => void;
    };
  }
}

export {};
// Global type definitions for the renderer process

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
      };
      network: {
        start: () => Promise<{ success: boolean; error?: string }>;
        stop: () => Promise<{ success: boolean; error?: string }>;
        getTeamMembers: () => Promise<any[]>;
        sendMessage: (targetId: string, message: any) => Promise<{ success: boolean; error?: string }>;
        broadcast: (message: any) => Promise<{ success: boolean; error?: string }>;
        getLocalInfo: () => Promise<any>;
        startFileTransfer: (targetId: string, filePath: string) => Promise<{ success: boolean; error?: string }>;
        updatePresence: (presence: any) => Promise<{ success: boolean; error?: string }>;
        onMessage: (callback: (message: any) => void) => void;
        onTeamMemberUpdated: (callback: (member: any) => void) => void;
        onTeamMemberLeft: (callback: (memberId: string) => void) => void;
        // Legacy support
        startServer: (options: any) => Promise<any>;
        stopServer: () => Promise<any>;
        broadcastUDP: (options: any) => Promise<any>;
        onUDPMessage: (callback: (message: string, address: string) => void) => void;
        httpRequest: (url: string, options?: any) => Promise<any>;
        discoverPeers: () => Promise<any>;
        startSharingServer: (port: number, boards: any[]) => Promise<any>;
        stopSharingServer: () => Promise<any>;
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
      executeCommand: (command: string) => Promise<{
        success: boolean;
        output?: string;
        error?: string;
      }>;
      window: {
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
      };
      openExternal: (url: string) => Promise<void>;
      showItemInFolder: (path: string) => void;
      onMenuAction: (callback: (action: string, data?: any) => void) => void;
    };
  }
}

// JSON module support
declare module '*.json' {
  const value: any;
  export default value;
}

// Export empty object to make this a module
export {};
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
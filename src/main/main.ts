import { app, BrowserWindow, Menu, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import { existsSync } from 'fs';
import Store from 'electron-store';

// Store for persistent settings
const store = new Store();

class TovaIDE {
  private mainWindow: BrowserWindow | null = null;
  private isDev = process.env.NODE_ENV === 'development';

  constructor() {
    this.init();
  }

  private init(): void {
    // App event handlers
    app.whenReady().then(() => this.createMainWindow());
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });

    // IPC handlers
    this.setupIpcHandlers();
  }

  private createMainWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1000,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
      show: false,
      titleBarStyle: 'default',
      icon: path.join(__dirname, '../assets/icon.png'),
    });

    // Load the app
    if (this.isDev) {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    // Create menu
    this.createMenu();
  }

  private createMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'ファイル',
        submenu: [
          {
            label: '新規ファイル',
            accelerator: 'Ctrl+N',
            click: () => this.mainWindow?.webContents.send('menu:new-file'),
          },
          {
            label: 'フォルダを開く',
            accelerator: 'Ctrl+O',
            click: async () => {
              const result = await dialog.showOpenDialog(this.mainWindow!, {
                properties: ['openDirectory'],
              });
              if (!result.canceled && result.filePaths.length > 0) {
                this.mainWindow?.webContents.send('menu:open-folder', result.filePaths[0]);
              }
            },
          },
          { type: 'separator' },
          {
            label: '保存',
            accelerator: 'Ctrl+S',
            click: () => this.mainWindow?.webContents.send('menu:save'),
          },
          {
            label: '名前を付けて保存',
            accelerator: 'Ctrl+Shift+S',
            click: () => this.mainWindow?.webContents.send('menu:save-as'),
          },
          { type: 'separator' },
          {
            label: '終了',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            },
          },
        ],
      },
      {
        label: '編集',
        submenu: [
          { label: '元に戻す', accelerator: 'Ctrl+Z', role: 'undo' },
          { label: 'やり直し', accelerator: 'Ctrl+Y', role: 'redo' },
          { type: 'separator' },
          { label: '切り取り', accelerator: 'Ctrl+X', role: 'cut' },
          { label: 'コピー', accelerator: 'Ctrl+C', role: 'copy' },
          { label: '貼り付け', accelerator: 'Ctrl+V', role: 'paste' },
          { type: 'separator' },
          {
            label: '検索',
            accelerator: 'Ctrl+F',
            click: () => this.mainWindow?.webContents.send('menu:search'),
          },
          {
            label: '置換',
            accelerator: 'Ctrl+H',
            click: () => this.mainWindow?.webContents.send('menu:replace'),
          },
        ],
      },
      {
        label: 'ビルド',
        submenu: [
          {
            label: 'コンパイル',
            accelerator: 'F7',
            click: () => this.mainWindow?.webContents.send('menu:compile'),
          },
          {
            label: 'アップロード',
            accelerator: 'F5',
            click: () => this.mainWindow?.webContents.send('menu:upload'),
          },
          { type: 'separator' },
          {
            label: 'クリーンビルド',
            click: () => this.mainWindow?.webContents.send('menu:clean-build'),
          },
        ],
      },
      {
        label: 'ツール',
        submenu: [
          {
            label: 'シリアルモニター',
            accelerator: 'Ctrl+Shift+M',
            click: () => this.mainWindow?.webContents.send('menu:serial-monitor'),
          },
          { type: 'separator' },
          {
            label: 'ボード設定',
            click: () => this.mainWindow?.webContents.send('menu:board-config'),
          },
          {
            label: 'ライブラリ管理',
            click: () => this.mainWindow?.webContents.send('menu:library-manager'),
          },
          { type: 'separator' },
          {
            label: '設定',
            accelerator: 'Ctrl+,',
            click: () => this.mainWindow?.webContents.send('menu:preferences'),
          },
        ],
      },
      {
        label: 'ヘルプ',
        submenu: [
          {
            label: 'Tova IDEについて',
            click: () => {
              dialog.showMessageBox(this.mainWindow!, {
                type: 'info',
                title: 'Tova IDE について',
                message: 'Tova IDE v1.0.0',
                detail: 'Arduino/PlatformIO統合開発環境\\nNexus Assistant IDE (NAI)',
              });
            },
          },
          {
            label: 'ドキュメント',
            click: () => {
              shell.openExternal('https://github.com/tova-ide/docs');
            },
          },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupIpcHandlers(): void {
    // Settings management
    ipcMain.handle('store:get', (_, key: string) => {
      return store.get(key);
    });

    ipcMain.handle('store:set', (_, key: string, value: any) => {
      store.set(key, value);
    });

    // File operations
    ipcMain.handle('fs:exists', (_, filePath: string) => {
      return existsSync(filePath);
    });

    ipcMain.handle('fs:readFile', async (_, filePath: string) => {
      const { readFile } = await import('fs/promises');
      return await readFile(filePath, 'utf-8');
    });

    ipcMain.handle('fs:writeFile', async (_, filePath: string, content: string) => {
      const { writeFile } = await import('fs/promises');
      await writeFile(filePath, content, 'utf-8');
    });

    ipcMain.handle('fs:mkdir', async (_, dirPath: string) => {
      const { mkdir } = await import('fs/promises');
      await mkdir(dirPath, { recursive: true });
    });

    ipcMain.handle('fs:readdir', async (_, dirPath: string) => {
      const { readdir } = await import('fs/promises');
      return await readdir(dirPath);
    });

    ipcMain.handle('fs:stat', async (_, path: string) => {
      const { stat } = await import('fs/promises');
      const stats = await stat(path);
      // Serialize stats object with methods as properties
      return {
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        isSymbolicLink: stats.isSymbolicLink(),
        size: stats.size,
        mtime: stats.mtime,
        ctime: stats.ctime,
        atime: stats.atime
      };
    });

    ipcMain.handle('fs:rename', async (_, oldPath: string, newPath: string) => {
      const { rename } = await import('fs/promises');
      await rename(oldPath, newPath);
    });

    ipcMain.handle('fs:unlink', async (_, filePath: string) => {
      const { unlink } = await import('fs/promises');
      await unlink(filePath);
    });

    ipcMain.handle('fs:rmdir', async (_, dirPath: string) => {
      const { rm } = await import('fs/promises');
      await rm(dirPath, { recursive: true, force: true });
    });

    // Dialog operations
    ipcMain.handle('dialog:showOpenDialog', async (_, options) => {
      return await dialog.showOpenDialog(this.mainWindow!, options);
    });

    ipcMain.handle('dialog:showSaveDialog', async (_, options) => {
      return await dialog.showSaveDialog(this.mainWindow!, options);
    });

    ipcMain.handle('dialog:showMessageBox', async (_, options) => {
      return await dialog.showMessageBox(this.mainWindow!, options);
    });

    ipcMain.handle('dialog:showInputBox', async (_, options: { title: string; message: string; defaultValue?: string }) => {
      const { BrowserWindow } = await import('electron');
      
      // Create a simple input dialog using HTML
      const inputWindow = new BrowserWindow({
        width: 400,
        height: 200,
        parent: this.mainWindow!,
        modal: true,
        show: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
        },
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              padding: 20px;
              margin: 0;
              background: #f5f5f5;
            }
            .dialog {
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h2 { margin: 0 0 10px 0; font-size: 16px; }
            p { margin: 0 0 15px 0; font-size: 13px; color: #666; }
            input {
              width: 100%;
              padding: 8px;
              border: 1px solid #ddd;
              border-radius: 4px;
              font-size: 13px;
              box-sizing: border-box;
            }
            .buttons {
              margin-top: 15px;
              text-align: right;
            }
            button {
              padding: 6px 16px;
              margin-left: 8px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 13px;
            }
            .ok { background: #0078d4; color: white; }
            .cancel { background: #e1e1e1; }
          </style>
        </head>
        <body>
          <div class="dialog">
            <h2>${options.title}</h2>
            <p>${options.message}</p>
            <input type="text" id="input" value="${options.defaultValue || ''}" autofocus />
            <div class="buttons">
              <button class="cancel" onclick="window.close()">キャンセル</button>
              <button class="ok" onclick="submit()">OK</button>
            </div>
          </div>
          <script>
            const { ipcRenderer } = require('electron');
            document.getElementById('input').focus();
            document.getElementById('input').select();
            document.getElementById('input').addEventListener('keypress', (e) => {
              if (e.key === 'Enter') submit();
            });
            function submit() {
              const value = document.getElementById('input').value;
              ipcRenderer.send('input-result', value);
              window.close();
            }
          </script>
        </body>
        </html>
      `;

      inputWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));
      
      return new Promise((resolve) => {
        ipcMain.once('input-result', (_, result) => {
          resolve(result);
        });
        
        inputWindow.once('closed', () => {
          resolve(null);
        });
        
        inputWindow.show();
      });
    });

    // Process operations
    ipcMain.handle('process:exec', async (_, command: string, args: string[], options?: any) => {
      const { spawn } = await import('child_process');
      
      return new Promise((resolve, reject) => {
        const isWindows = process.platform === 'win32';
        let child;
        
        if (isWindows) {
          // WindowsではPowerShellを使用してコマンドを実行
          const fullCommand = `${command} ${args.join(' ')}`;
          child = spawn('powershell.exe', ['-Command', fullCommand], {
            cwd: options?.cwd || process.cwd(),
            windowsHide: true,
            ...options
          });
        } else {
          child = spawn(command, args, {
            cwd: options?.cwd || process.cwd(),
            shell: true,
            ...options
          });
        }

        let stdout = '';
        let stderr = '';

        if (child.stdout) {
          child.stdout.on('data', (data) => {
            stdout += data.toString();
          });
        }

        if (child.stderr) {
          child.stderr.on('data', (data) => {
            stderr += data.toString();
          });
        }

        child.on('close', (code) => {
          resolve({
            stdout,
            stderr,
            exitCode: code || 0
          });
        });

        child.on('error', (error) => {
          reject(error);
        });
      });
    });

    // Window operations
    ipcMain.handle('window:minimize', () => {
      this.mainWindow?.minimize();
    });

    ipcMain.handle('window:maximize', () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow?.maximize();
      }
    });

    ipcMain.handle('window:close', () => {
      this.mainWindow?.close();
    });
  }
}

// Start the application
new TovaIDE();
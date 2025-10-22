"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs_1 = require("fs");
const electron_store_1 = __importDefault(require("electron-store"));
const NetworkService_1 = __importDefault(require("./services/NetworkService"));
// Store for persistent settings
const store = new electron_store_1.default();
// Logger setup
const log = (prefix, ...args) => {
    console.log(`[Electron Main] ${prefix}`, ...args);
};
log('🚀', 'Electron main process starting...');
class TovaIDE {
    constructor() {
        this.mainWindow = null;
        // isDev は webpack.config.js と同様に environment 変数で判定
        this.isDev = process.env.NODE_ENV === 'development';
        this.networkService = new NetworkService_1.default();
        this.init();
    }
    init() {
        log('ℹ️', 'Initializing Tova IDE...');
        // App event handlers
        electron_1.app.whenReady().then(() => {
            log('✅', 'App ready');
            this.createMainWindow();
        });
        electron_1.app.on('window-all-closed', () => {
            log('👋', 'All windows closed');
            this.networkService.stopService();
            if (process.platform !== 'darwin') {
                electron_1.app.quit();
            }
        });
        electron_1.app.on('activate', () => {
            log('🔄', 'App activated');
            if (electron_1.BrowserWindow.getAllWindows().length === 0) {
                this.createMainWindow();
            }
        });
        // IPC handlers
        this.setupIpcHandlers();
        // Initialize network service
        this.networkService.startService();
    }
    createMainWindow() {
        log('🪟', 'Creating main window...');
        // Check if icon exists
        const iconPath = path.join(__dirname, '../assets/icon.png');
        const iconExists = (0, fs_1.existsSync)(iconPath);
        this.mainWindow = new electron_1.BrowserWindow({
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
            ...(iconExists && { icon: iconPath }),
        });
        log('ℹ️', 'isDev:', this.isDev);
        // Load the app
        if (this.isDev) {
            log('🔗', 'Loading from localhost:3000');
            this.mainWindow.loadURL('http://localhost:3000');
            this.mainWindow.webContents.openDevTools();
        }
        else {
            const filePath = path.join(__dirname, '../renderer/index.html');
            log('📄', 'Loading from file:', filePath);
            this.mainWindow.loadFile(filePath);
        }
        // Capture renderer console messages
        this.mainWindow.webContents.on('console-message', (level, message, line, sourceId) => {
            log('🎨 RENDERER', `[${line}:${sourceId}]`, message);
        });
        // Capture renderer errors
        this.mainWindow.webContents.on('crashed', () => {
            log('💥', 'Renderer process crashed!');
        });
        // Show window when ready
        this.mainWindow.once('ready-to-show', () => {
            log('✨', 'Window ready to show');
            this.mainWindow?.show();
        });
        // Create menu
        this.createMenu();
    }
    createMenu() {
        log('📋', 'Creating menu...');
        const template = [
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
                            const result = await electron_1.dialog.showOpenDialog(this.mainWindow, {
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
                            electron_1.app.quit();
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
                            electron_1.dialog.showMessageBox(this.mainWindow, {
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
                            electron_1.shell.openExternal('https://github.com/tova-ide/docs');
                        },
                    },
                ],
            },
        ];
        const menu = electron_1.Menu.buildFromTemplate(template);
        electron_1.Menu.setApplicationMenu(menu);
    }
    setupIpcHandlers() {
        log('🔌', 'Setting up IPC handlers...');
        // Settings management
        electron_1.ipcMain.handle('store:get', (_, key) => {
            log('📖', 'store:get', key);
            return store.get(key);
        });
        electron_1.ipcMain.handle('store:set', (_, key, value) => {
            log('💾', 'store:set', key, value);
            store.set(key, value);
        });
        // File operations
        electron_1.ipcMain.handle('fs:exists', (_, filePath) => {
            log('🔍', 'fs:exists', filePath);
            return (0, fs_1.existsSync)(filePath);
        });
        electron_1.ipcMain.handle('fs:readFile', async (_, filePath) => {
            const { normalize } = await Promise.resolve().then(() => __importStar(require('path')));
            const normalizedPath = normalize(filePath);
            log('📄', 'fs:readFile', normalizedPath);
            const { readFile } = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            return await readFile(normalizedPath, 'utf-8');
        });
        electron_1.ipcMain.handle('fs:writeFile', async (_, filePath, content) => {
            const { normalize } = await Promise.resolve().then(() => __importStar(require('path')));
            const normalizedPath = normalize(filePath);
            log('✍️', 'fs:writeFile', normalizedPath);
            log('📝', 'Content to write (first 100 chars):', content.substring(0, 100));
            log('📏', 'Content length:', content.length);
            try {
                const { writeFile } = await Promise.resolve().then(() => __importStar(require('fs/promises')));
                await writeFile(normalizedPath, content, 'utf-8');
                log('✅', 'File written successfully:', normalizedPath);
                // Verify the write
                const { readFile } = await Promise.resolve().then(() => __importStar(require('fs/promises')));
                const verifyContent = await readFile(normalizedPath, 'utf-8');
                log('🔍', 'Verification read (first 100 chars):', verifyContent.substring(0, 100));
                if (verifyContent === content) {
                    log('✅', 'Write verification successful');
                }
                else {
                    log('⚠️', 'Write verification FAILED - content mismatch!');
                }
            }
            catch (error) {
                log('❌', 'Failed to write file:', normalizedPath, error);
                throw error;
            }
        });
        electron_1.ipcMain.handle('fs:mkdir', async (_, dirPath) => {
            const { mkdir } = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            await mkdir(dirPath, { recursive: true });
        });
        electron_1.ipcMain.handle('fs:readdir', async (_, dirPath) => {
            const { readdir } = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            return await readdir(dirPath);
        });
        electron_1.ipcMain.handle('fs:stat', async (_, path) => {
            const { stat } = await Promise.resolve().then(() => __importStar(require('fs/promises')));
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
        electron_1.ipcMain.handle('fs:rename', async (_, oldPath, newPath) => {
            const { rename } = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            await rename(oldPath, newPath);
        });
        electron_1.ipcMain.handle('fs:unlink', async (_, filePath) => {
            const { unlink } = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            await unlink(filePath);
        });
        electron_1.ipcMain.handle('fs:rmdir', async (_, dirPath) => {
            const { rm } = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            await rm(dirPath, { recursive: true, force: true });
        });
        // Dialog operations
        electron_1.ipcMain.handle('dialog:showOpenDialog', async (_, options) => {
            return await electron_1.dialog.showOpenDialog(this.mainWindow, options);
        });
        electron_1.ipcMain.handle('dialog:showSaveDialog', async (_, options) => {
            return await electron_1.dialog.showSaveDialog(this.mainWindow, options);
        });
        electron_1.ipcMain.handle('dialog:showMessageBox', async (_, options) => {
            return await electron_1.dialog.showMessageBox(this.mainWindow, options);
        });
        electron_1.ipcMain.handle('dialog:showInputBox', async (_, options) => {
            const { BrowserWindow } = await Promise.resolve().then(() => __importStar(require('electron')));
            // Create a simple input dialog using HTML
            const inputWindow = new BrowserWindow({
                width: 400,
                height: 200,
                parent: this.mainWindow,
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
                electron_1.ipcMain.once('input-result', (_, result) => {
                    resolve(result);
                });
                inputWindow.once('closed', () => {
                    resolve(null);
                });
                inputWindow.show();
            });
        });
        // Process operations
        electron_1.ipcMain.handle('process:exec', async (_, command, args, options) => {
            const { spawn } = await Promise.resolve().then(() => __importStar(require('child_process')));
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
                }
                else {
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
        // Execute command handler
        electron_1.ipcMain.handle('execute:command', async (_, command) => {
            const { exec } = await Promise.resolve().then(() => __importStar(require('child_process')));
            const { promisify } = await Promise.resolve().then(() => __importStar(require('util')));
            const execAsync = promisify(exec);
            try {
                log('⚙️', 'Executing command:', command);
                const { stdout, stderr } = await execAsync(command, {
                    maxBuffer: 1024 * 1024 * 10, // 10MB buffer
                    windowsHide: true,
                });
                log('✅', 'Command executed successfully');
                return {
                    success: true,
                    output: stdout,
                    error: stderr || undefined,
                };
            }
            catch (error) {
                log('❌', 'Command execution failed:', error.message);
                return {
                    success: false,
                    output: error.stdout || undefined,
                    error: error.stderr || error.message,
                };
            }
        });
        // Window operations
        electron_1.ipcMain.handle('window:minimize', () => {
            this.mainWindow?.minimize();
        });
        electron_1.ipcMain.handle('window:maximize', () => {
            if (this.mainWindow?.isMaximized()) {
                this.mainWindow.unmaximize();
            }
            else {
                this.mainWindow?.maximize();
            }
        });
        electron_1.ipcMain.handle('window:close', () => {
            this.mainWindow?.close();
        });
    }
}
// Start the application
new TovaIDE();
//# sourceMappingURL=main.js.map
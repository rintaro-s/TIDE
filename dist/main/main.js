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
    console.log(`[Electron Main] [${prefix}]`, ...args);
};
log('START', 'Electron main process starting...');
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
                    {
                        label: 'テスト: 音声再生 (yt-dlp)',
                        click: async () => {
                            // Quick test: resolve a known YouTube video audio URL via yt-dlp and open in default browser
                            const testVideoId = 'dQw4w9WgXcQ';
                            const videoUrl = `https://www.youtube.com/watch?v=${testVideoId}`;
                            try {
                                const { execFile } = await Promise.resolve().then(() => __importStar(require('child_process')));
                                execFile('yt-dlp', ['-f', 'bestaudio', '-g', videoUrl], { shell: true, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
                                    if (error || !stdout) {
                                        log('⚠️', 'yt-dlp test failed:', stderr || (error && error.message));
                                        this.mainWindow?.webContents.send('menu:yt-dlp-test-result', { success: false, error: stderr || (error && error.message) });
                                        return;
                                    }
                                    const lines = stdout.trim().split(/\r?\n/).filter(Boolean);
                                    const resolved = lines[0];
                                    log('✅', 'yt-dlp test resolved URL:', resolved);
                                    // Open resolved URL in default browser (plays in external browser)
                                    const { shell } = require('electron');
                                    shell.openExternal(resolved);
                                    this.mainWindow?.webContents.send('menu:yt-dlp-test-result', { success: true, url: resolved });
                                });
                            }
                            catch (err) {
                                log('❌', 'yt-dlp test error:', err?.message || err);
                                this.mainWindow?.webContents.send('menu:yt-dlp-test-result', { success: false, error: err?.message || String(err) });
                            }
                        }
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
        electron_1.ipcMain.handle('fs:readFile', async (_, filePath, encoding) => {
            const { normalize } = await Promise.resolve().then(() => __importStar(require('path')));
            const normalizedPath = normalize(filePath);
            log('📄', 'fs:readFile', normalizedPath, encoding || 'utf-8');
            const { readFile } = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            return await readFile(normalizedPath, (encoding || 'utf-8'));
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
            const { execFile } = await Promise.resolve().then(() => __importStar(require('child_process')));
            return new Promise((resolve, reject) => {
                const isWindows = process.platform === 'win32';
                // Increase buffer size for large outputs (e.g., arduino-cli board listall)
                const maxBuffer = options?.maxBuffer || 10 * 1024 * 1024; // 10MB default
                let child;
                // Use execFile with shell option for cross-platform compatibility
                // shell: true allows the system to handle the command properly on all platforms
                child = execFile(command, args, {
                    cwd: options?.cwd || process.cwd(),
                    shell: true,
                    windowsHide: isWindows,
                    maxBuffer,
                    encoding: 'utf-8',
                    ...options
                }, (error, stdout, stderr) => {
                    if (error && error.code !== 0) {
                        // Command failed, but still return output for parsing
                        resolve({
                            stdout: stdout || '',
                            stderr: stderr || error.message,
                            exitCode: error.code || 1
                        });
                    }
                    else {
                        resolve({
                            stdout: stdout || '',
                            stderr: stderr || '',
                            exitCode: 0
                        });
                    }
                });
                if (!child) {
                    reject(new Error('Failed to spawn process'));
                }
            });
        });
        // Simple HTTP request proxy for renderer to avoid CORS issues
        electron_1.ipcMain.handle('network:httpRequest', async (_, url, options) => {
            log('🌐', 'network:httpRequest', url, options?.method || 'GET');
            try {
                const controller = new AbortController();
                const timeout = options?.timeout || 15000;
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                const response = await fetch(url, {
                    method: options?.method || 'GET',
                    headers: options?.headers || {},
                    body: options?.body,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                const text = await response.text();
                // Serialize headers into a plain object
                const headersObj = {};
                try {
                    response.headers.forEach((value, key) => {
                        headersObj[key] = value;
                    });
                }
                catch (e) {
                    // fallback: leave headersObj empty
                }
                // Return a simple serializable object (include both 'body' and legacy 'data')
                return {
                    success: true,
                    status: response.status,
                    headers: headersObj,
                    body: text,
                    data: text
                };
            }
            catch (err) {
                log('❌', 'network:httpRequest failed:', err?.message || err);
                return {
                    success: false,
                    error: err?.message || String(err)
                };
            }
        });
        // Execute command handler
        electron_1.ipcMain.handle('execute:command', async (_, command) => {
            const { exec } = await Promise.resolve().then(() => __importStar(require('child_process')));
            const isWindows = process.platform === 'win32';
            return new Promise((resolve) => {
                try {
                    log('⚙️', 'Executing command:', command);
                    // Use exec with cross-platform support
                    const maxBuffer = 50 * 1024 * 1024; // 50MB
                    exec(command, {
                        maxBuffer,
                        windowsHide: isWindows,
                        encoding: 'utf-8',
                        shell: isWindows ? undefined : '/bin/sh', // Use default shell on Unix
                    }, (error, stdout, stderr) => {
                        if (error) {
                            log('⚠️', 'Command stderr:', stderr);
                        }
                        log('✅', 'Command executed');
                        resolve({
                            success: !error || error.code === 0,
                            output: stdout || '',
                            error: stderr || error?.message || undefined,
                        });
                    });
                }
                catch (error) {
                    log('❌', 'Command execution error:', error.message);
                    resolve({
                        success: false,
                        output: '',
                        error: error.message,
                    });
                }
            });
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
        // Music: Get audio stream URL using yt-dlp (reliable system tool)
        electron_1.ipcMain.handle('music:getAudioUrl', async (_, videoId) => {
            log('🎵', 'Fetching audio URL for video:', videoId);
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            try {
                const { execFile } = await Promise.resolve().then(() => __importStar(require('child_process')));
                const os = await Promise.resolve().then(() => __importStar(require('os')));
                const fs = await Promise.resolve().then(() => __importStar(require('fs')));
                log('🔧', 'Running yt-dlp to download and extract audio');
                // Create temp directory for audio files
                const tempDir = path.join(os.tmpdir(), 'tova-ide-audio');
                if (!(0, fs_1.existsSync)(tempDir)) {
                    (0, fs_1.mkdirSync)(tempDir, { recursive: true });
                }
                // If a cached file for this videoId already exists, return it immediately.
                try {
                    const cachedFiles = fs.readdirSync(tempDir).filter((f) => f.endsWith('.mp3'));
                    const matched = cachedFiles.find((f) => f.startsWith(`${videoId}_`));
                    if (matched) {
                        const localFilePath = path.join(tempDir, matched);
                        log('ℹ️', 'Cache hit for videoId, returning cached file:', localFilePath);
                        return {
                            success: true,
                            url: `file://${localFilePath}`,
                            source: 'yt-dlp-local-cache'
                        };
                    }
                }
                catch (e) {
                    // ignore cache lookup errors and continue to download
                }
                // Output template for mp3 file
                const outputTemplate = path.join(tempDir, `%(id)s_%(title)s.%(ext)s`);
                // yt-dlp args to DOWNLOAD mp3 file (not just get URL with -g)
                const ytDlpArgs = [
                    '--no-playlist',
                    '-f', 'bestaudio[ext=mp3]/bestaudio[ext=m4a]/bestaudio',
                    '--extract-audio',
                    '--audio-format', 'mp3',
                    '--audio-quality', '128K',
                    '-o', outputTemplate,
                    videoUrl
                ];
                const ytResult = await new Promise((resolve, reject) => {
                    try {
                        execFile('yt-dlp', ytDlpArgs, { shell: true, maxBuffer: 10 * 1024 * 1024, timeout: 120000 }, (error, stdout, stderr) => {
                            if (error && error.code !== 0) {
                                const exitCode = (error && typeof error.code === 'number') ? error.code : Number(error.code) || 1;
                                resolve({ stdout: stdout || '', stderr: stderr || error.message, exitCode });
                            }
                            else {
                                resolve({ stdout: stdout || '', stderr: stderr || '', exitCode: 0 });
                            }
                        });
                    }
                    catch (err) {
                        reject(err);
                    }
                });
                if (ytResult.exitCode === 0) {
                    log('✅', 'yt-dlp downloaded audio file successfully');
                    // Find the downloaded file that matches the videoId (output template uses %(id)s_...)
                    const files = fs.readdirSync(tempDir);
                    const mp3Files = files.filter((f) => f.endsWith('.mp3'));
                    // Prefer exact prefix match videoId_ (safer against unrelated files)
                    let matchedFile = mp3Files.find((f) => f.startsWith(`${videoId}_`));
                    // Fallback: any file that contains the id
                    if (!matchedFile) {
                        matchedFile = mp3Files.find((f) => f.indexOf(videoId) !== -1);
                    }
                    if (matchedFile) {
                        const localFilePath = path.join(tempDir, matchedFile);
                        log('✅', 'Local file path (matched):', localFilePath);
                        return {
                            success: true,
                            url: `file://${localFilePath}`,
                            source: 'yt-dlp-local'
                        };
                    }
                    else {
                        log('❌', 'No matching mp3 file found for videoId in temp directory');
                        return {
                            success: false,
                            error: 'yt-dlp did not produce an mp3 file for the requested video'
                        };
                    }
                }
                else {
                    log('❌', 'yt-dlp failed with exit code:', ytResult.exitCode);
                    if (ytResult.stderr) {
                        log('   stderr:', ytResult.stderr.substring(0, 500));
                    }
                    return {
                        success: false,
                        error: `yt-dlp failed with exit code ${ytResult.exitCode}`
                    };
                }
            }
            catch (err) {
                log('❌', 'yt-dlp exception:', err?.message || err);
                return {
                    success: false,
                    error: 'yt-dlp is not installed or not in PATH. Install from https://github.com/yt-dlp/yt-dlp'
                };
            }
        });
        // Clear audio cache (temp files)
        electron_1.ipcMain.handle('music:clearCache', async () => {
            try {
                const os = await Promise.resolve().then(() => __importStar(require('os')));
                const fsPromises = await Promise.resolve().then(() => __importStar(require('fs/promises')));
                const tempDir = path.join((await Promise.resolve().then(() => __importStar(require('os')))).tmpdir(), 'tova-ide-audio');
                log('🧹', 'Clearing audio cache at', tempDir);
                await fsPromises.rm(tempDir, { recursive: true, force: true });
                // Recreate directory so subsequent calls don't fail
                const { existsSync, mkdirSync } = await Promise.resolve().then(() => __importStar(require('fs')));
                if (!existsSync(tempDir))
                    mkdirSync(tempDir, { recursive: true });
                return { success: true };
            }
            catch (err) {
                log('❌', 'Failed to clear audio cache:', err?.message || err);
                return { success: false, error: String(err) };
            }
        });
        // Music: Search using yt-dlp ytsearch
        electron_1.ipcMain.handle('music:search', async (_, query, limit = 10) => {
            log('🔍 Searching YouTube for:', query, 'limit:', limit);
            try {
                const { spawn } = await Promise.resolve().then(() => __importStar(require('child_process')));
                const limit_clamped = Math.min(limit, 50);
                const result = await new Promise((resolve) => {
                    let stdout = '';
                    let stderr = '';
                    const proc = spawn('yt-dlp', [
                        '--quiet',
                        '--no-warnings',
                        '--flat-playlist',
                        `ytsearch${limit_clamped}:${query}`,
                        '--print', '%(id)s|%(title)s|%(duration)s'
                    ]);
                    proc.stdout.on('data', (data) => {
                        stdout += data.toString('utf8');
                    });
                    proc.stderr.on('data', (data) => {
                        stderr += data.toString('utf8');
                    });
                    proc.on('close', (code) => {
                        resolve({ stdout, stderr, exitCode: code || 0 });
                    });
                    proc.on('error', (err) => {
                        resolve({ stdout: '', stderr: err.message, exitCode: 1 });
                    });
                    // Timeout after 30 seconds
                    setTimeout(() => {
                        proc.kill();
                        resolve({ stdout, stderr: 'Timeout', exitCode: 1 });
                    }, 30000);
                });
                if (result.exitCode !== 0) {
                    log('❌ Search failed:', result.stderr?.substring(0, 100) || 'unknown error');
                    return { success: false, error: result.stderr?.substring(0, 200) || 'Search failed' };
                }
                if (!result.stdout || result.stdout.trim().length === 0) {
                    log('⚠️  No results found');
                    return { success: true, items: [] };
                }
                // Parse line-by-line: id|title|duration
                const lines = result.stdout.trim().split('\n').filter((line) => line.trim());
                const items = lines
                    .map((line) => {
                    const parts = line.split('|');
                    const id = parts[0]?.trim();
                    const title = parts[1]?.trim() || 'Unknown';
                    const durationStr = parts[2]?.trim();
                    if (!id)
                        return null;
                    return {
                        id,
                        title,
                        duration: durationStr ? parseInt(durationStr) : 0,
                        thumbnail: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
                        url: `https://www.youtube.com/watch?v=${id}`,
                    };
                })
                    .filter((i) => i !== null)
                    .slice(0, limit);
                log('✅ Search found:', items.length, 'videos');
                return { success: true, items };
            }
            catch (err) {
                log('❌ Search error:', err?.message || err);
                return { success: false, error: String(err) };
            }
        });
        // Music: Get playlist tracks using yt-dlp --print (fast & lightweight)
        electron_1.ipcMain.handle('music:getPlaylist', async (_, playlistUrl, limit = 20) => {
            log('📋 Fetching playlist:', playlistUrl, 'limit:', limit);
            try {
                const { spawn } = await Promise.resolve().then(() => __importStar(require('child_process')));
                const result = await new Promise((resolve) => {
                    let stdout = '';
                    let stderr = '';
                    const proc = spawn('yt-dlp', [
                        '--quiet',
                        '--no-warnings',
                        '--flat-playlist',
                        '--playlist-items', `1-${limit}`,
                        '--print', '%(id)s|%(title)s|%(webpage_url)s',
                        playlistUrl
                    ]);
                    proc.stdout.on('data', (data) => {
                        stdout += data.toString('utf8');
                    });
                    proc.stderr.on('data', (data) => {
                        stderr += data.toString('utf8');
                    });
                    proc.on('close', (code) => {
                        resolve({ stdout, stderr, exitCode: code || 0 });
                    });
                    proc.on('error', (err) => {
                        resolve({ stdout: '', stderr: err.message, exitCode: 1 });
                    });
                    // Timeout after 30 seconds
                    setTimeout(() => {
                        proc.kill();
                        resolve({ stdout, stderr: 'Timeout', exitCode: 1 });
                    }, 30000);
                });
                if (result.exitCode !== 0) {
                    log('❌ Playlist fetch failed:', result.stderr?.substring(0, 100) || 'unknown error');
                    return { success: false, error: result.stderr?.substring(0, 200) || 'Playlist fetch failed' };
                }
                if (!result.stdout || result.stdout.trim().length === 0) {
                    log('⚠️  Playlist empty');
                    return { success: true, items: [] };
                }
                // Parse line-by-line: id|title|url
                const lines = result.stdout.trim().split('\n').filter((line) => line.trim());
                const items = lines
                    .map((line) => {
                    const parts = line.split('|');
                    const id = parts[0]?.trim();
                    const title = parts[1]?.trim() || 'Unknown';
                    const url = parts[2]?.trim();
                    if (!id || !url)
                        return null;
                    return {
                        id,
                        title,
                        duration: 0,
                        thumbnail: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
                        url,
                    };
                })
                    .filter((i) => i !== null);
                log('✅ Playlist loaded:', items.length, 'tracks');
                return { success: true, items };
            }
            catch (err) {
                log('❌ Playlist error:', err?.message || err);
                return { success: false, error: String(err) };
            }
        });
        // Music: Import a YouTube playlist (return metadata only, do not download)
        electron_1.ipcMain.handle('music:importPlaylist', async (_, playlistUrl, limit = 20) => {
            log('📥', 'Importing playlist:', playlistUrl, 'limit:', limit);
            try {
                const { execFile } = await Promise.resolve().then(() => __importStar(require('child_process')));
                const ytArgs = ['--dump-single-json', playlistUrl];
                const result = await new Promise((resolve) => {
                    try {
                        execFile('yt-dlp', ytArgs, { shell: true, maxBuffer: 20 * 1024 * 1024, timeout: 120000 }, (error, stdout, stderr) => {
                            if (error && error.code !== 0) {
                                const exitCode = (error && typeof error.code === 'number') ? error.code : Number(error.code) || 1;
                                resolve({ stdout: stdout || '', stderr: stderr || error.message, exitCode });
                            }
                            else {
                                resolve({ stdout: stdout || '', stderr: stderr || '', exitCode: 0 });
                            }
                        });
                    }
                    catch (err) {
                        resolve({ stdout: '', stderr: String(err), exitCode: 1 });
                    }
                });
                // If initial fetch failed, attempt a flat-playlist fallback (less metadata but more robust)
                if (result.exitCode !== 0) {
                    log('⚠️', 'yt-dlp playlist fetch failed, trying flat-playlist fallback:', result.stderr?.substring(0, 300));
                    const fallbackArgs = ['--flat-playlist', '--dump-single-json', playlistUrl];
                    const fallbackResult = await new Promise((resolve) => {
                        try {
                            execFile('yt-dlp', fallbackArgs, { shell: true, maxBuffer: 20 * 1024 * 1024, timeout: 120000 }, (error, stdout, stderr) => {
                                if (error && error.code !== 0) {
                                    const exitCode = (error && typeof error.code === 'number') ? error.code : Number(error.code) || 1;
                                    resolve({ stdout: stdout || '', stderr: stderr || error.message, exitCode });
                                }
                                else {
                                    resolve({ stdout: stdout || '', stderr: stderr || '', exitCode: 0 });
                                }
                            });
                        }
                        catch (err) {
                            resolve({ stdout: '', stderr: String(err), exitCode: 1 });
                        }
                    });
                    if (fallbackResult.exitCode !== 0) {
                        log('❌', 'yt-dlp playlist fallback also failed:', fallbackResult.stderr?.substring(0, 300));
                        return { success: false, error: fallbackResult.stderr || result.stderr || 'yt-dlp playlist failed' };
                    }
                    // Use fallback output as primary
                    result.stdout = fallbackResult.stdout;
                    result.stderr = fallbackResult.stderr;
                    result.exitCode = fallbackResult.exitCode;
                }
                if (!result.stdout || result.stdout.trim().length === 0) {
                    return { success: true, items: [] };
                }
                let parsed;
                try {
                    parsed = JSON.parse(result.stdout);
                }
                catch (err) {
                    log('❌', 'Failed to parse yt-dlp playlist JSON:', err);
                    return { success: false, error: 'Failed to parse yt-dlp output' };
                }
                const entries = Array.isArray(parsed.entries) ? parsed.entries : (parsed?.entries || []);
                const sliced = entries.slice(0, limit || 20);
                const items = sliced.map((e) => ({
                    id: e.id || e.video_id || e.url?.match(/v=([a-zA-Z0-9_-]{11})/)?.[1] || null,
                    title: e.title || e.alt_title || 'Unknown',
                    duration: typeof e.duration === 'number' ? e.duration : (e._duration_raw ? Number(e._duration_raw) : 0),
                    thumbnail: e.thumbnail || e.thumbnails?.[0]?.url || null,
                    url: e.webpage_url || e.url || (e.id ? `https://www.youtube.com/watch?v=${e.id}` : null),
                })).filter((i) => i.id && i.url);
                return { success: true, items };
            }
            catch (err) {
                log('❌', 'music:importPlaylist exception:', err?.message || err);
                return { success: false, error: String(err) };
            }
        });
    }
}
// Start the application
new TovaIDE();
//# sourceMappingURL=main.js.map
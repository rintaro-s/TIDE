import { app, BrowserWindow, Menu, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import { existsSync, mkdirSync } from 'fs';
import Store from 'electron-store';
import NetworkService from './services/NetworkService';

// Store for persistent settings
const store = new Store();

// Logger setup
const log = (prefix: string, ...args: any[]) => {
  console.log(`[Electron Main] [${prefix}]`, ...args);
};

log('START', 'Electron main process starting...');

class TovaIDE {
  private mainWindow: BrowserWindow | null = null;
  // isDev は webpack.config.js と同様に environment 変数で判定
  private isDev = process.env.NODE_ENV === 'development';
  private networkService = new NetworkService();

  constructor() {
    this.init();
  }

  private init(): void {
    log('ℹ️', 'Initializing Tova IDE...');
    // App event handlers
    app.whenReady().then(() => {
      log('✅', 'App ready');
      this.createMainWindow();
    });
    app.on('window-all-closed', () => {
      log('👋', 'All windows closed');
      this.networkService.stopService();
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
    app.on('activate', () => {
      log('🔄', 'App activated');
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });

    // IPC handlers
    this.setupIpcHandlers();
    
    // Initialize network service
    this.networkService.startService();
  }

  private createMainWindow(): void {
    log('🪟', 'Creating main window...');
    
    // Check if icon exists
    const iconPath = path.join(__dirname, '../assets/icon.png');
    const iconExists = existsSync(iconPath);
    
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
      ...(iconExists && { icon: iconPath }),
    });

    log('ℹ️', 'isDev:', this.isDev);

    // Load the app
    if (this.isDev) {
      log('🔗', 'Loading from localhost:3000');
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
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

  private createMenu(): void {
    log('📋', 'Creating menu...');
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
          {
            label: 'テスト: 音声再生 (yt-dlp)',
            click: async () => {
              // Quick test: resolve a known YouTube video audio URL via yt-dlp and open in default browser
              const testVideoId = 'dQw4w9WgXcQ';
              const videoUrl = `https://www.youtube.com/watch?v=${testVideoId}`;
              try {
                const { execFile } = await import('child_process');
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
              } catch (err: any) {
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
    log('🔌', 'Setting up IPC handlers...');
    
    // Settings management
    ipcMain.handle('store:get', (_, key: string) => {
      log('📖', 'store:get', key);
      return store.get(key);
    });

    ipcMain.handle('store:set', (_, key: string, value: any) => {
      log('💾', 'store:set', key, value);
      store.set(key, value);
    });

    // File operations
    ipcMain.handle('fs:exists', (_, filePath: string) => {
      log('🔍', 'fs:exists', filePath);
      return existsSync(filePath);
    });

    ipcMain.handle('fs:readFile', async (_, filePath: string, encoding?: string) => {
      const { normalize } = await import('path');
      const normalizedPath = normalize(filePath);
      log('📄', 'fs:readFile', normalizedPath, encoding || 'utf-8');
      const { readFile } = await import('fs/promises');
      return await readFile(normalizedPath, (encoding || 'utf-8') as BufferEncoding);
    });

    ipcMain.handle('fs:writeFile', async (_, filePath: string, content: string) => {
      const { normalize } = await import('path');
      const normalizedPath = normalize(filePath);
      log('✍️', 'fs:writeFile', normalizedPath);
      log('📝', 'Content to write (first 100 chars):', content.substring(0, 100));
      log('📏', 'Content length:', content.length);
      
      try {
        const { writeFile } = await import('fs/promises');
        await writeFile(normalizedPath, content, 'utf-8');
        log('✅', 'File written successfully:', normalizedPath);
        
        // Verify the write
        const { readFile } = await import('fs/promises');
        const verifyContent = await readFile(normalizedPath, 'utf-8');
        log('🔍', 'Verification read (first 100 chars):', verifyContent.substring(0, 100));
        if (verifyContent === content) {
          log('✅', 'Write verification successful');
        } else {
          log('⚠️', 'Write verification FAILED - content mismatch!');
        }
      } catch (error) {
        log('❌', 'Failed to write file:', normalizedPath, error);
        throw error;
      }
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
      const { execFile } = await import('child_process');
      
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
          } else {
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
    ipcMain.handle('network:httpRequest', async (_, url: string, options?: any) => {
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
        const headersObj: Record<string, string> = {};
        try {
          response.headers.forEach((value: string, key: string) => {
            headersObj[key] = value;
          });
        } catch (e) {
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
      } catch (err: any) {
        log('❌', 'network:httpRequest failed:', err?.message || err);
        return {
          success: false,
          error: err?.message || String(err)
        };
      }
    });

    // Execute command handler
    ipcMain.handle('execute:command', async (_, command: string) => {
      const { exec } = await import('child_process');
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
        } catch (error: any) {
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

    // Music: Get audio stream URL using yt-dlp (reliable system tool)
    ipcMain.handle('music:getAudioUrl', async (_, videoId: string) => {
      log('🎵', 'Fetching audio URL for video:', videoId);
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

      try {
        const { execFile } = await import('child_process');
        const os = await import('os');
        const fs = await import('fs');
        
        log('🔧', 'Running yt-dlp to download and extract audio');

        // Create temp directory for audio files
        const tempDir = path.join(os.tmpdir(), 'tova-ide-audio');
        if (!existsSync(tempDir)) {
          mkdirSync(tempDir, { recursive: true });
        }

        // If a cached file for this videoId already exists, return it immediately.
        try {
          const cachedFiles = fs.readdirSync(tempDir).filter((f: string) => f.endsWith('.mp3'));
          const matched = cachedFiles.find((f: string) => f.startsWith(`${videoId}_`));
          if (matched) {
            const localFilePath = path.join(tempDir, matched);
            log('ℹ️', 'Cache hit for videoId, returning cached file:', localFilePath);
            return {
              success: true,
              url: `file://${localFilePath}`,
              source: 'yt-dlp-local-cache'
            };
          }
        } catch (e) {
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

        const ytResult: { stdout: string; stderr: string; exitCode: number } = await new Promise((resolve, reject) => {
          try {
            execFile('yt-dlp', ytDlpArgs, { shell: true, maxBuffer: 10 * 1024 * 1024, timeout: 120000 }, (error, stdout, stderr) => {
              if (error && (error as any).code !== 0) {
                const exitCode = (error && typeof (error as any).code === 'number') ? (error as any).code : Number((error as any).code) || 1;
                resolve({ stdout: stdout || '', stderr: stderr || (error as any).message, exitCode });
              } else {
                resolve({ stdout: stdout || '', stderr: stderr || '', exitCode: 0 });
              }
            });
          } catch (err: any) {
            reject(err);
          }
        });

        if (ytResult.exitCode === 0) {
          log('✅', 'yt-dlp downloaded audio file successfully');

          // Find the downloaded file that matches the videoId (output template uses %(id)s_...)
          const files = fs.readdirSync(tempDir);
          const mp3Files = files.filter((f: string) => f.endsWith('.mp3'));

          // Prefer exact prefix match videoId_ (safer against unrelated files)
          let matchedFile = mp3Files.find((f: string) => f.startsWith(`${videoId}_`));
          // Fallback: any file that contains the id
          if (!matchedFile) {
            matchedFile = mp3Files.find((f: string) => f.indexOf(videoId) !== -1);
          }

          if (matchedFile) {
            const localFilePath = path.join(tempDir, matchedFile);
            log('✅', 'Local file path (matched):', localFilePath);
            return {
              success: true,
              url: `file://${localFilePath}`,
              source: 'yt-dlp-local'
            };
          } else {
            log('❌', 'No matching mp3 file found for videoId in temp directory');
            return {
              success: false,
              error: 'yt-dlp did not produce an mp3 file for the requested video'
            };
          }
        } else {
          log('❌', 'yt-dlp failed with exit code:', ytResult.exitCode);
          if (ytResult.stderr) {
            log('   stderr:', ytResult.stderr.substring(0, 500));
          }
          return {
            success: false,
            error: `yt-dlp failed with exit code ${ytResult.exitCode}`
          };
        }
      } catch (err: any) {
        log('❌', 'yt-dlp exception:', err?.message || err);
        return {
          success: false,
          error: 'yt-dlp is not installed or not in PATH. Install from https://github.com/yt-dlp/yt-dlp'
        };
      }
    });

    // Clear audio cache (temp files)
    ipcMain.handle('music:clearCache', async () => {
      try {
        const os = await import('os');
        const fsPromises = await import('fs/promises');
        const tempDir = path.join((await import('os')).tmpdir(), 'tova-ide-audio');
        log('🧹', 'Clearing audio cache at', tempDir);
        await fsPromises.rm(tempDir, { recursive: true, force: true });
        // Recreate directory so subsequent calls don't fail
        const { existsSync, mkdirSync } = await import('fs');
        if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });
        return { success: true };
      } catch (err: any) {
        log('❌', 'Failed to clear audio cache:', err?.message || err);
        return { success: false, error: String(err) };
      }
    });

    // Music: Search using yt-dlp ytsearch
    ipcMain.handle('music:search', async (_, query: string, limit = 10) => {
      log('🔍 Searching YouTube for:', query, 'limit:', limit);
      try {
        const { spawn } = await import('child_process');
        const limit_clamped = Math.min(limit, 50);

        const result: { stdout: string; stderr: string; exitCode: number } = await new Promise((resolve) => {
          let stdout = '';
          let stderr = '';

          const proc = spawn('yt-dlp', [
            '--quiet',
            '--no-warnings',
            '--flat-playlist',
            `ytsearch${limit_clamped}:${query}`,
            '--print', '%(id)s|%(title)s|%(duration)s'
          ]);

          proc.stdout.on('data', (data: Buffer) => {
            stdout += data.toString('utf8');
          });

          proc.stderr.on('data', (data: Buffer) => {
            stderr += data.toString('utf8');
          });

          proc.on('close', (code: number) => {
            resolve({ stdout, stderr, exitCode: code || 0 });
          });

          proc.on('error', (err: Error) => {
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
        const lines = result.stdout.trim().split('\n').filter((line: string) => line.trim());
        const items = lines
          .map((line: string) => {
            const parts = line.split('|');
            const id = parts[0]?.trim();
            const title = parts[1]?.trim() || 'Unknown';
            const durationStr = parts[2]?.trim();

            if (!id) return null;

            return {
              id,
              title,
              duration: durationStr ? parseInt(durationStr) : 0,
              thumbnail: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
              url: `https://www.youtube.com/watch?v=${id}`,
            };
          })
          .filter((i: any) => i !== null)
          .slice(0, limit);

        log('✅ Search found:', items.length, 'videos');
        return { success: true, items };
      } catch (err: any) {
        log('❌ Search error:', err?.message || err);
        return { success: false, error: String(err) };
      }
    });

    // Music: Get playlist tracks using yt-dlp --print (fast & lightweight)
    ipcMain.handle('music:getPlaylist', async (_, playlistUrl: string, limit = 20) => {
      log('📋 Fetching playlist:', playlistUrl, 'limit:', limit);
      try {
        const { spawn } = await import('child_process');

        const result: { stdout: string; stderr: string; exitCode: number } = await new Promise((resolve) => {
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

          proc.stdout.on('data', (data: Buffer) => {
            stdout += data.toString('utf8');
          });

          proc.stderr.on('data', (data: Buffer) => {
            stderr += data.toString('utf8');
          });

          proc.on('close', (code: number) => {
            resolve({ stdout, stderr, exitCode: code || 0 });
          });

          proc.on('error', (err: Error) => {
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
        const lines = result.stdout.trim().split('\n').filter((line: string) => line.trim());
        const items = lines
          .map((line: string) => {
            const parts = line.split('|');
            const id = parts[0]?.trim();
            const title = parts[1]?.trim() || 'Unknown';
            const url = parts[2]?.trim();

            if (!id || !url) return null;

            return {
              id,
              title,
              duration: 0,
              thumbnail: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
              url,
            };
          })
          .filter((i: any) => i !== null);

        log('✅ Playlist loaded:', items.length, 'tracks');
        return { success: true, items };
      } catch (err: any) {
        log('❌ Playlist error:', err?.message || err);
        return { success: false, error: String(err) };
      }
    });

    // Music: Import a YouTube playlist (return metadata only, do not download)
    ipcMain.handle('music:importPlaylist', async (_, playlistUrl: string, limit = 20) => {
      log('📥', 'Importing playlist:', playlistUrl, 'limit:', limit);
      try {
        const { execFile } = await import('child_process');

        const ytArgs = ['--dump-single-json', playlistUrl];

        const result: { stdout: string; stderr: string; exitCode: number } = await new Promise((resolve) => {
          try {
            execFile('yt-dlp', ytArgs, { shell: true, maxBuffer: 20 * 1024 * 1024, timeout: 120000 }, (error, stdout, stderr) => {
              if (error && (error as any).code !== 0) {
                const exitCode = (error && typeof (error as any).code === 'number') ? (error as any).code : Number((error as any).code) || 1;
                resolve({ stdout: stdout || '', stderr: stderr || (error as any).message, exitCode });
              } else {
                resolve({ stdout: stdout || '', stderr: stderr || '', exitCode: 0 });
              }
            });
          } catch (err: any) {
            resolve({ stdout: '', stderr: String(err), exitCode: 1 });
          }
        });

        // If initial fetch failed, attempt a flat-playlist fallback (less metadata but more robust)
        if (result.exitCode !== 0) {
          log('⚠️', 'yt-dlp playlist fetch failed, trying flat-playlist fallback:', result.stderr?.substring(0, 300));
          const fallbackArgs = ['--flat-playlist', '--dump-single-json', playlistUrl];
          const fallbackResult: { stdout: string; stderr: string; exitCode: number } = await new Promise((resolve) => {
            try {
              execFile('yt-dlp', fallbackArgs, { shell: true, maxBuffer: 20 * 1024 * 1024, timeout: 120000 }, (error, stdout, stderr) => {
                if (error && (error as any).code !== 0) {
                  const exitCode = (error && typeof (error as any).code === 'number') ? (error as any).code : Number((error as any).code) || 1;
                  resolve({ stdout: stdout || '', stderr: stderr || (error as any).message, exitCode });
                } else {
                  resolve({ stdout: stdout || '', stderr: stderr || '', exitCode: 0 });
                }
              });
            } catch (err: any) {
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

        let parsed: any;
        try {
          parsed = JSON.parse(result.stdout);
        } catch (err) {
          log('❌', 'Failed to parse yt-dlp playlist JSON:', err);
          return { success: false, error: 'Failed to parse yt-dlp output' };
        }

        const entries = Array.isArray(parsed.entries) ? parsed.entries : (parsed?.entries || []);
        const sliced = entries.slice(0, limit || 20);
        const items = sliced.map((e: any) => ({
          id: e.id || e.video_id || e.url?.match(/v=([a-zA-Z0-9_-]{11})/)?.[1] || null,
          title: e.title || e.alt_title || 'Unknown',
          duration: typeof e.duration === 'number' ? e.duration : (e._duration_raw ? Number(e._duration_raw) : 0),
          thumbnail: e.thumbnail || e.thumbnails?.[0]?.url || null,
          url: e.webpage_url || e.url || (e.id ? `https://www.youtube.com/watch?v=${e.id}` : null),
        })).filter((i: any) => i.id && i.url);

        return { success: true, items };
      } catch (err: any) {
        log('❌', 'music:importPlaylist exception:', err?.message || err);
        return { success: false, error: String(err) };
      }
    });
  }
}

// Start the application
new TovaIDE();
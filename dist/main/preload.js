"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Store operations
    store: {
        get: (key) => electron_1.ipcRenderer.invoke('store:get', key),
        set: (key, value) => electron_1.ipcRenderer.invoke('store:set', key, value),
    },
    // File system operations
    fs: {
        exists: (filePath) => electron_1.ipcRenderer.invoke('fs:exists', filePath),
        readFile: (filePath) => electron_1.ipcRenderer.invoke('fs:readFile', filePath),
        writeFile: (filePath, content) => electron_1.ipcRenderer.invoke('fs:writeFile', filePath, content),
        mkdir: (dirPath) => electron_1.ipcRenderer.invoke('fs:mkdir', dirPath),
        readdir: (dirPath) => electron_1.ipcRenderer.invoke('fs:readdir', dirPath),
        stat: (path) => electron_1.ipcRenderer.invoke('fs:stat', path),
        rename: (oldPath, newPath) => electron_1.ipcRenderer.invoke('fs:rename', oldPath, newPath),
        unlink: (filePath) => electron_1.ipcRenderer.invoke('fs:unlink', filePath),
        rmdir: (dirPath) => electron_1.ipcRenderer.invoke('fs:rmdir', dirPath),
    },
    // Dialog operations
    dialog: {
        showOpenDialog: (options) => electron_1.ipcRenderer.invoke('dialog:showOpenDialog', options),
        showSaveDialog: (options) => electron_1.ipcRenderer.invoke('dialog:showSaveDialog', options),
        showMessageBox: (options) => electron_1.ipcRenderer.invoke('dialog:showMessageBox', options),
        showInputBox: (options) => electron_1.ipcRenderer.invoke('dialog:showInputBox', options),
    },
    // Process operations
    process: {
        exec: (command, args, options) => electron_1.ipcRenderer.invoke('process:exec', command, args, options),
    },
    // Window operations
    window: {
        minimize: () => electron_1.ipcRenderer.invoke('window:minimize'),
        maximize: () => electron_1.ipcRenderer.invoke('window:maximize'),
        close: () => electron_1.ipcRenderer.invoke('window:close'),
    },
    // Menu event listeners
    onMenuAction: (callback) => {
        electron_1.ipcRenderer.on('menu:new-file', () => callback('new-file'));
        electron_1.ipcRenderer.on('menu:open-folder', (_, data) => callback('open-folder', data));
        electron_1.ipcRenderer.on('menu:save', () => callback('save'));
        electron_1.ipcRenderer.on('menu:save-as', () => callback('save-as'));
        electron_1.ipcRenderer.on('menu:search', () => callback('search'));
        electron_1.ipcRenderer.on('menu:replace', () => callback('replace'));
        electron_1.ipcRenderer.on('menu:compile', () => callback('compile'));
        electron_1.ipcRenderer.on('menu:upload', () => callback('upload'));
        electron_1.ipcRenderer.on('menu:clean-build', () => callback('clean-build'));
        electron_1.ipcRenderer.on('menu:serial-monitor', () => callback('serial-monitor'));
        electron_1.ipcRenderer.on('menu:board-config', () => callback('board-config'));
        electron_1.ipcRenderer.on('menu:library-manager', () => callback('library-manager'));
        electron_1.ipcRenderer.on('menu:preferences', () => callback('preferences'));
    },
});
// Type definitions are in src/types/global.d.ts
//# sourceMappingURL=preload.js.map
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Store operations
  store: {
    get: (key: string) => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('store:set', key, value),
  },

  // File system operations
  fs: {
    exists: (filePath: string) => ipcRenderer.invoke('fs:exists', filePath),
  readFile: (filePath: string, encoding?: string) => ipcRenderer.invoke('fs:readFile', filePath, encoding),
    writeFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:writeFile', filePath, content),
    mkdir: (dirPath: string) => ipcRenderer.invoke('fs:mkdir', dirPath),
    readdir: (dirPath: string) => ipcRenderer.invoke('fs:readdir', dirPath),
    stat: (path: string) => ipcRenderer.invoke('fs:stat', path),
    rename: (oldPath: string, newPath: string) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
    unlink: (filePath: string) => ipcRenderer.invoke('fs:unlink', filePath),
    rmdir: (dirPath: string) => ipcRenderer.invoke('fs:rmdir', dirPath),
    readBinary: (filePath: string) => ipcRenderer.invoke('fs:readBinary', filePath),
    writeBinary: (filePath: string, data: ArrayBuffer) => ipcRenderer.invoke('fs:writeBinary', filePath, data),
    getFileHash: (filePath: string) => ipcRenderer.invoke('fs:getFileHash', filePath),
  },

  // Network operations
  network: {
    start: () => ipcRenderer.invoke('network:start'),
    stop: () => ipcRenderer.invoke('network:stop'),
    getTeamMembers: () => ipcRenderer.invoke('network:getTeamMembers'),
    sendMessage: (targetId: string, message: any) => ipcRenderer.invoke('network:sendMessage', targetId, message),
    broadcast: (message: any) => ipcRenderer.invoke('network:broadcast', message),
    getLocalInfo: () => ipcRenderer.invoke('network:getLocalInfo'),
    startFileTransfer: (targetId: string, filePath: string) => ipcRenderer.invoke('network:startFileTransfer', targetId, filePath),
    updatePresence: (presence: any) => ipcRenderer.invoke('network:updatePresence', presence),
    
    // Event listeners
    onMessage: (callback: (message: any) => void) => {
      ipcRenderer.on('network:message', (_, message) => callback(message));
    },
    onTeamMemberUpdated: (callback: (member: any) => void) => {
      ipcRenderer.on('network:teamMemberUpdated', (_, member) => callback(member));
    },
    onTeamMemberLeft: (callback: (memberId: string) => void) => {
      ipcRenderer.on('network:teamMemberLeft', (_, memberId) => callback(memberId));
    },
    
    // Legacy support for existing code
    startServer: (options: any) => ipcRenderer.invoke('network:startServer', options),
    stopServer: () => ipcRenderer.invoke('network:stopServer'),
    broadcastUDP: (options: any) => ipcRenderer.invoke('network:broadcastUDP', options),
    onUDPMessage: (callback: (message: string, address: string) => void) => {
      ipcRenderer.on('network:onUDPMessage', (_, message: string, address: string) => callback(message, address));
    },
    httpRequest: (url: string, options?: any) => ipcRenderer.invoke('network:httpRequest', url, options),
    discoverPeers: () => ipcRenderer.invoke('network:discoverPeers'),
    startSharingServer: (port: number, boards: any[]) => ipcRenderer.invoke('network:startSharingServer', port, boards),
    stopSharingServer: () => ipcRenderer.invoke('network:stopSharingServer'),
  },

  // System operations
  system: {
    requestFirewallPermission: (options: any) => ipcRenderer.invoke('system:requestFirewallPermission', options),
    getNetworkInterfaces: () => ipcRenderer.invoke('system:getNetworkInterfaces'),
    getEnv: (variable: string) => ipcRenderer.invoke('system:getEnv', variable),
    getHomePath: () => ipcRenderer.invoke('system:getHomePath'),
  },

  // Dialog operations
  dialog: {
    showOpenDialog: (options: any) => ipcRenderer.invoke('dialog:showOpenDialog', options),
    showSaveDialog: (options: any) => ipcRenderer.invoke('dialog:showSaveDialog', options),
    showMessageBox: (options: any) => ipcRenderer.invoke('dialog:showMessageBox', options),
    showInputBox: (options: any) => ipcRenderer.invoke('dialog:showInputBox', options),
  },

  // Process operations
  process: {
    exec: (command: string, args: string[], options?: any) => 
      ipcRenderer.invoke('process:exec', command, args, options),
  },

  // Execute shell command
  executeCommand: (command: string) => 
    ipcRenderer.invoke('execute:command', command),

  // Window operations
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
  },

  // Menu event listeners
  onMenuAction: (callback: (action: string, data?: any) => void) => {
    ipcRenderer.on('menu:new-file', () => callback('new-file'));
    ipcRenderer.on('menu:open-folder', (_, data) => callback('open-folder', data));
    ipcRenderer.on('menu:save', () => callback('save'));
    ipcRenderer.on('menu:save-as', () => callback('save-as'));
    ipcRenderer.on('menu:search', () => callback('search'));
    ipcRenderer.on('menu:replace', () => callback('replace'));
    ipcRenderer.on('menu:compile', () => callback('compile'));
    ipcRenderer.on('menu:upload', () => callback('upload'));
    ipcRenderer.on('menu:clean-build', () => callback('clean-build'));
    ipcRenderer.on('menu:serial-monitor', () => callback('serial-monitor'));
    ipcRenderer.on('menu:board-config', () => callback('board-config'));
    ipcRenderer.on('menu:library-manager', () => callback('library-manager'));
    ipcRenderer.on('menu:preferences', () => callback('preferences'));
  },
});

// Type definitions are in src/types/global.d.ts
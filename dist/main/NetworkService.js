"use strict";
// Network Service for Global Compile Cache - Main Process Implementation
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkService = void 0;
const electron_1 = require("electron");
const http = __importStar(require("http"));
const dgram = __importStar(require("dgram"));
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
class NetworkService {
    constructor() {
        this.server = null;
        this.udpSocket = null;
        this.routes = {};
        this.udpMessageCallback = null;
    }
    initialize() {
        // Register IPC handlers for network operations
        electron_1.ipcMain.handle('network:startServer', this.handleStartServer.bind(this));
        electron_1.ipcMain.handle('network:stopServer', this.handleStopServer.bind(this));
        electron_1.ipcMain.handle('network:broadcastUDP', this.handleBroadcastUDP.bind(this));
        electron_1.ipcMain.handle('network:httpRequest', this.handleHttpRequest.bind(this));
        electron_1.ipcMain.on('network:onUDPMessage', this.handleUDPMessageListener.bind(this));
        // System-related handlers
        electron_1.ipcMain.handle('system:requestFirewallPermission', this.handleFirewallPermission.bind(this));
        electron_1.ipcMain.handle('system:getNetworkInterfaces', this.handleGetNetworkInterfaces.bind(this));
        // Enhanced FS handlers for binary operations
        electron_1.ipcMain.handle('fs:readBinary', this.handleReadBinary.bind(this));
        electron_1.ipcMain.handle('fs:writeBinary', this.handleWriteBinary.bind(this));
        electron_1.ipcMain.handle('fs:getFileHash', this.handleGetFileHash.bind(this));
        console.log('Network service initialized');
    }
    // Start HTTP server for cache operations
    async handleStartServer(event, options) {
        if (this.server) {
            await this.handleStopServer();
        }
        return new Promise((resolve, reject) => {
            this.routes = options.routes;
            this.server = http.createServer(this.handleCacheServerRequest.bind(this));
            this.server.on('error', (error) => {
                console.error('Cache server error:', error);
                reject(error);
            });
            this.server.listen(options.port, '0.0.0.0', () => {
                console.log(`Cache server listening on port ${options.port}`);
                resolve();
            });
        });
    }
    // Stop HTTP server
    async handleStopServer() {
        if (this.server) {
            return new Promise((resolve) => {
                this.server.close(() => {
                    this.server = null;
                    console.log('Cache server stopped');
                    resolve();
                });
            });
        }
    }
    // Handle HTTP requests to cache server
    async handleCacheServerRequest(req, res) {
        const url = req.url || '';
        const method = req.method || 'GET';
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        try {
            // Parse request body for POST requests
            let body = '';
            if (method === 'POST' || method === 'PUT') {
                req.on('data', (chunk) => {
                    body += chunk.toString();
                });
            }
            req.on('end', async () => {
                try {
                    const requestData = body ? JSON.parse(body) : {};
                    // Find matching route handler
                    const routeHandler = this.routes[url];
                    if (routeHandler) {
                        const result = await routeHandler(requestData);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
                    }
                    else {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Route not found' }));
                    }
                }
                catch (error) {
                    console.error('Route handler error:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal server error' }));
                }
            });
        }
        catch (error) {
            console.error('HTTP request error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    }
    // Broadcast UDP discovery message
    async handleBroadcastUDP(event, options) {
        if (this.udpSocket) {
            this.udpSocket.close();
        }
        this.udpSocket = dgram.createSocket('udp4');
        // Set up UDP message listener
        this.udpSocket.on('message', (msg, rinfo) => {
            if (this.udpMessageCallback) {
                this.udpMessageCallback(msg.toString(), rinfo.address);
            }
        });
        this.udpSocket.on('error', (error) => {
            console.error('UDP socket error:', error);
        });
        // Bind to discovery port
        this.udpSocket.bind(options.port, () => {
            this.udpSocket.setBroadcast(true);
            console.log(`UDP discovery listening on port ${options.port}`);
        });
        // Start broadcasting at intervals
        const broadcast = () => {
            if (!this.udpSocket)
                return;
            const broadcastAddress = this.getBroadcastAddress();
            this.udpSocket.send(options.message, options.port, broadcastAddress, (error) => {
                if (error) {
                    console.error('Broadcast error:', error);
                }
            });
        };
        // Initial broadcast
        setTimeout(broadcast, 1000);
        // Schedule regular broadcasts
        setInterval(broadcast, options.interval);
    }
    // Set UDP message callback
    handleUDPMessageListener(event, callback) {
        this.udpMessageCallback = callback;
    }
    // Make HTTP request to other nodes
    async handleHttpRequest(event, url, options = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const httpModule = isHttps ? require('https') : require('http');
            const requestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port || (isHttps ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: options.method || 'GET',
                headers: options.headers || {}
            };
            const req = httpModule.request(requestOptions, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const result = {
                            status: res.statusCode,
                            headers: res.headers,
                            data: data
                        };
                        resolve(result);
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            });
            req.on('error', (error) => {
                reject(error);
            });
            if (options.body) {
                req.write(options.body);
            }
            req.end();
        });
    }
    // Request firewall permissions
    async handleFirewallPermission(event, options) {
        try {
            const platform = process.platform;
            if (platform === 'win32') {
                // Windows - Request through Windows Firewall
                const result = await this.requestWindowsFirewallPermission(options.ports, options.reason);
                return result;
            }
            else if (platform === 'darwin') {
                // macOS - Request through system dialog
                const result = await electron_1.dialog.showMessageBox({
                    type: 'question',
                    buttons: ['許可', 'キャンセル'],
                    defaultId: 0,
                    title: 'ネットワーク権限の要求',
                    message: options.reason,
                    detail: `ポート ${options.ports.join(', ')} への着信接続を許可しますか？`
                });
                return {
                    granted: result.response === 0,
                    message: result.response === 0 ? '権限が許可されました' : 'ユーザーによりキャンセルされました'
                };
            }
            else {
                // Linux - Show informational dialog
                const result = await electron_1.dialog.showMessageBox({
                    type: 'info',
                    buttons: ['OK'],
                    title: 'ファイアウォール設定',
                    message: 'ファイアウォール設定の確認',
                    detail: `以下のポートが開放されていることを確認してください: ${options.ports.join(', ')}`
                });
                return { granted: true, message: 'ファイアウォール設定を確認してください' };
            }
        }
        catch (error) {
            console.error('Firewall permission error:', error);
            return { granted: false, message: `エラーが発生しました: ${error}` };
        }
    }
    // Windows firewall permission request
    async requestWindowsFirewallPermission(ports, reason) {
        try {
            // Show dialog first
            const result = await electron_1.dialog.showMessageBox({
                type: 'question',
                buttons: ['許可', 'キャンセル'],
                defaultId: 0,
                title: 'Windows ファイアウォール権限の要求',
                message: reason,
                detail: `ポート ${ports.join(', ')} への着信接続を許可するために、Windowsファイアウォールの設定を変更します。`
            });
            if (result.response !== 0) {
                return { granted: false, message: 'ユーザーによりキャンセルされました' };
            }
            // Try to add firewall rules (requires admin privileges)
            const promises = ports.map(port => this.addWindowsFirewallRule(port));
            const results = await Promise.allSettled(promises);
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.length - successful;
            if (failed === 0) {
                return { granted: true, message: 'ファイアウォール規則が正常に追加されました' };
            }
            else {
                return {
                    granted: successful > 0,
                    message: `${successful}個の規則が追加されましたが、${failed}個は失敗しました。管理者権限が必要な場合があります。`
                };
            }
        }
        catch (error) {
            return { granted: false, message: `エラー: ${error}` };
        }
    }
    // Add Windows firewall rule
    async addWindowsFirewallRule(port) {
        return new Promise((resolve, reject) => {
            const command = `netsh advfirewall firewall add rule name="TOVA IDE Cache Port ${port}" dir=in action=allow protocol=TCP localport=${port}`;
            const child = (0, child_process_1.spawn)('cmd', ['/c', command], { stdio: 'pipe' });
            let stdout = '';
            let stderr = '';
            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            child.on('close', (code) => {
                if (code === 0) {
                    resolve();
                }
                else {
                    reject(new Error(`Firewall rule failed: ${stderr}`));
                }
            });
        });
    }
    // Get network interfaces
    async handleGetNetworkInterfaces() {
        const interfaces = os.networkInterfaces();
        const result = [];
        for (const [name, addresses] of Object.entries(interfaces)) {
            if (addresses) {
                for (const addr of addresses) {
                    if (addr.family === 'IPv4' && !addr.internal) {
                        result.push({
                            name,
                            address: addr.address,
                            netmask: addr.netmask,
                            mac: addr.mac
                        });
                    }
                }
            }
        }
        return result;
    }
    // Binary file operations
    async handleReadBinary(event, filePath) {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (error, data) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
                }
            });
        });
    }
    async handleWriteBinary(event, filePath, data) {
        return new Promise((resolve, reject) => {
            const buffer = Buffer.from(data);
            const dir = path.dirname(filePath);
            // Create directory if it doesn't exist
            fs.mkdir(dir, { recursive: true }, (mkdirError) => {
                if (mkdirError && mkdirError.code !== 'EEXIST') {
                    reject(mkdirError);
                    return;
                }
                fs.writeFile(filePath, buffer, (writeError) => {
                    if (writeError) {
                        reject(writeError);
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    }
    async handleGetFileHash(event, filePath) {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = fs.createReadStream(filePath);
            stream.on('data', (data) => {
                hash.update(data);
            });
            stream.on('end', () => {
                resolve(hash.digest('hex'));
            });
            stream.on('error', (error) => {
                reject(error);
            });
        });
    }
    // Utility methods
    getBroadcastAddress() {
        const interfaces = os.networkInterfaces();
        // Find the first non-internal IPv4 interface
        for (const addresses of Object.values(interfaces)) {
            if (addresses) {
                for (const addr of addresses) {
                    if (addr.family === 'IPv4' && !addr.internal) {
                        // Calculate broadcast address
                        const ip = addr.address.split('.').map(Number);
                        const mask = addr.netmask.split('.').map(Number);
                        const broadcast = ip.map((octet, i) => octet | (255 - mask[i]));
                        return broadcast.join('.');
                    }
                }
            }
        }
        return '255.255.255.255'; // Fallback to limited broadcast
    }
    cleanup() {
        if (this.server) {
            this.server.close();
        }
        if (this.udpSocket) {
            this.udpSocket.close();
        }
    }
}
exports.NetworkService = NetworkService;
//# sourceMappingURL=NetworkService.js.map
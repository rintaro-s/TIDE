import { ipcMain, BrowserWindow } from 'electron';
import * as net from 'net';
import * as dgram from 'dgram';
import * as os from 'os';
import { WebSocketServer } from 'ws';
import * as http from 'http';

export interface TeamMember {
  id: string;
  name: string;
  ip: string;
  port: number;
  lastSeen: number;
  capabilities: string[];
  workload: number;
  isPremium?: boolean; // 上位ユーザーフラグ
  sharedProjects?: SharedProject[]; // 共有しているプロジェクト
}

export interface SharedProject {
  id: string;
  name: string;
  type: 'arduino' | 'platformio';
  description?: string;
  lastModified: number;
  size?: number;
  owner: string;
}

export interface LANMessage {
  type: 'discovery' | 'file_change' | 'build_request' | 'chat' | 'knowledge' | 'presence' 
      | 'project_share' | 'project_request' | 'project_data' | 'collaboration_invite' 
      | 'collaboration_join' | 'collaboration_update';
  sender: string;
  data: any;
  timestamp: number;
}

class NetworkService {
  private httpServer: http.Server | null = null;
  private wsServer: WebSocketServer | null = null;
  private udpSocket: dgram.Socket | null = null;
  private port: number = 8765;
  private wsPort: number = 8766;
  private udpPort: number = 8767;
  private teamMembers: Map<string, TeamMember> = new Map();
  private localId: string;
  private localName: string;
  private isStarted: boolean = false;
  private isPremiumUser: boolean = false; // 上位ユーザー設定
  private sharedProjects: Map<string, SharedProject> = new Map(); // 共有プロジェクト

  constructor() {
    this.localId = this.generateId();
    this.localName = os.hostname();
    this.setupIPCHandlers();
    this.startPeriodicDiscovery();
  }

  private setupIPCHandlers() {
    // ネットワークサービスの開始
    ipcMain.handle('network:start', async () => {
      return await this.startService();
    });

    // ネットワークサービスの停止
    ipcMain.handle('network:stop', async () => {
      return await this.stopService();
    });

    // Peer Discovery (for BoardLibraryManager and other components)
    ipcMain.handle('network:discoverPeers', async () => {
      try {
        // Trigger discovery broadcast
        await this.announcePresence();
        
        // Wait a bit for responses
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Return current team members
        return {
          success: true,
          peers: Array.from(this.teamMembers.values())
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          peers: []
        };
      }
    });

    // チームメンバーリストの取得
    ipcMain.handle('network:getTeamMembers', () => {
      return Array.from(this.teamMembers.values());
    });

    // メッセージの送信
    ipcMain.handle('network:sendMessage', async (event, targetId: string, message: any) => {
      return await this.sendMessage(targetId, message);
    });

    // ブロードキャストメッセージの送信
    ipcMain.handle('network:broadcast', async (event, message: any) => {
      return await this.broadcastMessage(message);
    });

    // ローカル情報の取得
    ipcMain.handle('network:getLocalInfo', () => {
      return {
        id: this.localId,
        name: this.localName,
        ip: this.getLocalIP(),
        port: this.port,
        isStarted: this.isStarted
      };
    });

    // ファイル転送の開始
    ipcMain.handle('network:startFileTransfer', async (event, targetId: string, filePath: string) => {
      return await this.startFileTransfer(targetId, filePath);
    });

    // プレゼンス情報の更新
    ipcMain.handle('network:updatePresence', async (event, presence: any) => {
      return await this.updatePresence(presence);
    });

    // 上位ユーザー設定
    ipcMain.handle('network:setPremiumStatus', async (event, isPremium: boolean) => {
      this.isPremiumUser = isPremium;
      await this.announcePresence(); // 再アナウンス
      return { success: true, isPremium: this.isPremiumUser };
    });

    // プロジェクトの共有
    ipcMain.handle('network:shareProject', async (event, project: SharedProject) => {
      this.sharedProjects.set(project.id, project);
      await this.announcePresence(); // 共有プロジェクトを含めて再アナウンス
      return { success: true, projectId: project.id };
    });

    // 共有プロジェクト一覧の取得
    ipcMain.handle('network:getSharedProjects', () => {
      return Array.from(this.sharedProjects.values());
    });

    // リモートプロジェクトのダウンロード
    ipcMain.handle('network:downloadProject', async (event, peerId: string, projectId: string) => {
      return await this.downloadProject(peerId, projectId);
    });

    // 共同作業への招待
    ipcMain.handle('network:inviteCollaboration', async (event, peerId: string, projectId: string) => {
      const message: LANMessage = {
        type: 'collaboration_invite',
        sender: this.localId,
        data: { projectId, senderName: this.localName },
        timestamp: Date.now()
      };
      return await this.sendMessage(peerId, message);
    });

    // 共同作業への参加
    ipcMain.handle('network:joinCollaboration', async (event, peerId: string, projectId: string) => {
      const message: LANMessage = {
        type: 'collaboration_join',
        sender: this.localId,
        data: { projectId, senderName: this.localName },
        timestamp: Date.now()
      };
      return await this.sendMessage(peerId, message);
    });

    // ファイル変更の同期
    ipcMain.handle('network:syncFileChange', async (event, projectId: string, filePath: string, content: string) => {
      const message: LANMessage = {
        type: 'file_change',
        sender: this.localId,
        data: { projectId, filePath, content },
        timestamp: Date.now()
      };
      return await this.broadcastMessage(message);
    });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getLocalIP(): string {
    const interfaces = os.networkInterfaces();
    
    // Prioritize non-internal IPv4 addresses
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        // Skip internal (loopback) addresses
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    
    // Fallback to loopback
    return '127.0.0.1';
  }

  private getBroadcastAddress(): string {
    const interfaces = os.networkInterfaces();
    
    // Try to find a suitable broadcast address from network interfaces
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        // Look for IPv4, non-internal interfaces
        if (iface.family === 'IPv4' && !iface.internal) {
          // Calculate broadcast address from IP and netmask
          // This is a simplified approach - for production, use a proper library
          const ip = iface.address.split('.').map(Number);
          const netmask = (iface.netmask || '255.255.255.0').split('.').map(Number);
          
          const broadcast = ip.map((octet, i) => octet | (~netmask[i] & 255));
          return broadcast.join('.');
        }
      }
    }
    
    // Fallback to limited broadcast (may not work on all systems)
    return '255.255.255.255';
  }

  async startService(): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.isStarted) {
        return { success: true };
      }

      // HTTPサーバーの起動
      await this.startHTTPServer();
      
      // WebSocketサーバーの起動
      await this.startWebSocketServer();
      
      // UDPディスカバリーサービスの起動
      await this.startUDPDiscovery();

      this.isStarted = true;
      
      // 自分の存在をアナウンス
      await this.announcePresence();

      console.log(`Network service started on ports HTTP:${this.port}, WS:${this.wsPort}, UDP:${this.udpPort}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to start network service:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async stopService(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isStarted) {
        return { success: true };
      }

      // 離脱をアナウンス
      await this.announceLeaving();

      // サーバーの停止
      if (this.httpServer) {
        this.httpServer.close();
        this.httpServer = null;
      }

      if (this.wsServer) {
        this.wsServer.close();
        this.wsServer = null;
      }

      if (this.udpSocket) {
        this.udpSocket.close();
        this.udpSocket = null;
      }

      this.isStarted = false;
      this.teamMembers.clear();

      console.log('Network service stopped');
      return { success: true };
    } catch (error) {
      console.error('Failed to stop network service:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async startHTTPServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.httpServer = http.createServer((req, res) => {
        // CORS設定
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }

        this.handleHTTPRequest(req, res);
      });

      this.httpServer.on('error', (error) => {
        if ((error as any).code === 'EADDRINUSE') {
          this.port++;
          this.httpServer?.listen(this.port, '0.0.0.0');
        } else {
          reject(error);
        }
      });

      this.httpServer.on('listening', () => {
        resolve();
      });

      this.httpServer.listen(this.port, '0.0.0.0');
    });
  }

  private async startWebSocketServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.wsServer = new WebSocketServer({ 
          port: this.wsPort,
          host: '0.0.0.0'
        });

        this.wsServer.on('connection', (ws, req) => {
          console.log(`New WebSocket connection from ${req.socket.remoteAddress}`);

          ws.on('message', (data) => {
            try {
              const message = JSON.parse(data.toString());
              this.handleWebSocketMessage(ws, message);
            } catch (error) {
              console.error('Failed to parse WebSocket message:', error);
            }
          });

          ws.on('close', () => {
            console.log('WebSocket connection closed');
          });

          ws.on('error', (error) => {
            console.error('WebSocket error:', error);
          });
        });

        this.wsServer.on('error', (error) => {
          if ((error as any).code === 'EADDRINUSE') {
            this.wsPort++;
            this.startWebSocketServer().then(resolve).catch(reject);
          } else {
            reject(error);
          }
        });

        this.wsServer.on('listening', () => {
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private async startUDPDiscovery(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.udpSocket = dgram.createSocket('udp4');

      this.udpSocket.on('message', (msg, rinfo) => {
        try {
          const message: LANMessage = JSON.parse(msg.toString());
          this.handleUDPMessage(message, rinfo);
        } catch (error) {
          console.error('Failed to parse UDP message:', error);
        }
      });

      this.udpSocket.on('error', (error) => {
        if ((error as any).code === 'EADDRINUSE') {
          this.udpPort++;
          this.udpSocket?.bind(this.udpPort);
        } else {
          reject(error);
        }
      });

      this.udpSocket.on('listening', () => {
        this.udpSocket?.setBroadcast(true);
        resolve();
      });

      this.udpSocket.bind(this.udpPort);
    });
  }

  private handleHTTPRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    const url = req.url || '';
    const method = req.method || 'GET';

    console.log(`HTTP ${method} ${url}`);

    if (url === '/api/info' && method === 'GET') {
      // 基本情報の提供
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        id: this.localId,
        name: this.localName,
        ip: this.getLocalIP(),
        port: this.port,
        wsPort: this.wsPort,
        capabilities: ['build', 'compile', 'upload', 'monitor'],
        isPremium: this.isPremiumUser,
        sharedProjects: Array.from(this.sharedProjects.values()),
        timestamp: Date.now()
      }));
    } else if (url === '/api/team' && method === 'GET') {
      // チームメンバー情報の提供
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(Array.from(this.teamMembers.values())));
    } else if (url.startsWith('/api/project/') && method === 'GET') {
      // プロジェクトデータの提供
      const projectId = url.replace('/api/project/', '');
      this.handleProjectRequest(projectId, res);
    } else if (url.startsWith('/api/file/') && method === 'GET') {
      // ファイル転送処理
      this.handleFileRequest(req, res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }

  private async handleProjectRequest(projectId: string, res: http.ServerResponse) {
    try {
      const project = this.sharedProjects.get(projectId);
      if (!project) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Project not found' }));
        return;
      }

      // プロジェクトデータを読み込んで送信
      // 実装: プロジェクトディレクトリを圧縮して送信
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Note: In production, you'd want to compress the project directory
      // For now, send project metadata
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        project,
        message: 'Full project transfer requires additional implementation'
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error)
      }));
    }
  }

  private handleWebSocketMessage(ws: any, message: any) {
    console.log('WebSocket message received:', message.type);
    
    // メッセージをレンダラープロセスに転送
    if (this.isStarted) {
      // すべてのウィンドウにメッセージを送信
      BrowserWindow.getAllWindows().forEach((window: BrowserWindow) => {
        window.webContents.send('network:message', message);
      });
    }
  }

  private handleUDPMessage(message: LANMessage, rinfo: dgram.RemoteInfo) {
    if (message.sender === this.localId) {
      return; // 自分のメッセージは無視
    }

    console.log(`UDP message from ${rinfo.address}:${rinfo.port}`, message.type);

    if (message.type === 'discovery') {
      // 新しいチームメンバーの発見
      const member: TeamMember = {
        id: message.sender,
        name: message.data.name,
        ip: rinfo.address,
        port: message.data.port,
        lastSeen: Date.now(),
        capabilities: message.data.capabilities || [],
        workload: message.data.workload || 0,
        isPremium: message.data.isPremium || false,
        sharedProjects: message.data.sharedProjects || []
      };

      this.teamMembers.set(member.id, member);
      
      // レンダラープロセスに通知
      BrowserWindow.getAllWindows().forEach((window: BrowserWindow) => {
        window.webContents.send('network:teamMemberUpdated', member);
      });

      // 応答として自分の情報を送信
      this.sendDiscoveryResponse(rinfo.address);
    } else if (message.type === 'presence') {
      // プレゼンス情報の更新
      const member = this.teamMembers.get(message.sender);
      if (member) {
        member.lastSeen = Date.now();
        member.workload = message.data.workload || 0;
        if (message.data.isPremium !== undefined) {
          member.isPremium = message.data.isPremium;
        }
        if (message.data.sharedProjects) {
          member.sharedProjects = message.data.sharedProjects;
        }
        this.teamMembers.set(member.id, member);
        
        // レンダラープロセスに通知
        BrowserWindow.getAllWindows().forEach((window: BrowserWindow) => {
          window.webContents.send('network:teamMemberUpdated', member);
        });
      }
    } else if (message.type === 'collaboration_invite' || message.type === 'collaboration_join' || message.type === 'file_change') {
      // 共同作業関連メッセージをレンダラープロセスに転送
      BrowserWindow.getAllWindows().forEach((window: BrowserWindow) => {
        window.webContents.send('network:collaborationMessage', message);
      });
    }
  }

  private handleFileRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    // ファイル転送の実装（簡易版）
    const filePath = req.url?.replace('/api/file/', '') || '';
    
    // セキュリティチェック（パストラバーサル攻撃防止）
    if (filePath.includes('..') || filePath.includes('/') || filePath.includes('\\')) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
    res.end('File transfer not implemented yet');
  }

  private async announcePresence(): Promise<void> {
    const message: LANMessage = {
      type: 'discovery',
      sender: this.localId,
      data: {
        name: this.localName,
        port: this.port,
        wsPort: this.wsPort,
        capabilities: ['build', 'compile', 'upload', 'monitor'],
        workload: 0,
        isPremium: this.isPremiumUser,
        sharedProjects: Array.from(this.sharedProjects.values())
      },
      timestamp: Date.now()
    };

    await this.broadcastUDP(message);
  }

  private async announceLeaving(): Promise<void> {
    const message: LANMessage = {
      type: 'presence',
      sender: this.localId,
      data: {
        status: 'leaving'
      },
      timestamp: Date.now()
    };

    await this.broadcastUDP(message);
  }

  private async sendDiscoveryResponse(targetIP: string): Promise<void> {
    const message: LANMessage = {
      type: 'discovery',
      sender: this.localId,
      data: {
        name: this.localName,
        port: this.port,
        wsPort: this.wsPort,
        capabilities: ['build', 'compile', 'upload', 'monitor'],
        workload: 0,
        isPremium: this.isPremiumUser,
        sharedProjects: Array.from(this.sharedProjects.values())
      },
      timestamp: Date.now()
    };

    try {
      const socket = dgram.createSocket('udp4');
      const buffer = Buffer.from(JSON.stringify(message));
      
      socket.send(buffer, this.udpPort, targetIP, (error) => {
        socket.close();
        if (error) {
          console.error('Failed to send discovery response:', error);
        }
      });
    } catch (error) {
      console.error('Failed to send discovery response:', error);
    }
  }

  private async broadcastUDP(message: LANMessage): Promise<void> {
    if (!this.udpSocket) return;

    try {
      const buffer = Buffer.from(JSON.stringify(message));
      const broadcastAddr = this.getBroadcastAddress();
      
      // Try to send to calculated broadcast address
      this.udpSocket.send(buffer, this.udpPort, broadcastAddr, (error) => {
        if (error) {
          console.error('Failed to broadcast UDP message:', error);
          
          // If broadcast fails, try multicast as fallback
          const errCode = (error as any).code;
          if (errCode === 'ENETUNREACH' || errCode === 'ENETDOWN') {
            console.log('Broadcast failed, network may be unavailable. Skipping...');
          }
        }
      });
    } catch (error) {
      console.error('Failed to broadcast UDP message:', error);
    }
  }

  private async sendMessage(targetId: string, message: any): Promise<{ success: boolean; error?: string }> {
    const member = this.teamMembers.get(targetId);
    if (!member) {
      return { success: false, error: 'Team member not found' };
    }

    try {
      // HTTP POSTでメッセージを送信
      const http = require('http');
      const data = JSON.stringify(message);
      
      const options = {
        hostname: member.ip,
        port: member.port,
        path: '/api/message',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      };

      return new Promise((resolve) => {
        const req = http.request(options, (res: any) => {
          resolve({ success: res.statusCode === 200 });
        });

        req.on('error', (error: Error) => {
          resolve({ success: false, error: error.message });
        });

        req.write(data);
        req.end();
      });
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async broadcastMessage(message: any): Promise<{ success: boolean; error?: string }> {
    const lanMessage: LANMessage = {
      type: 'chat',
      sender: this.localId,
      data: message,
      timestamp: Date.now()
    };

    await this.broadcastUDP(lanMessage);
    return { success: true };
  }

  private async startFileTransfer(targetId: string, filePath: string): Promise<{ success: boolean; error?: string }> {
    // ファイル転送の実装（将来の拡張用）
    return { success: false, error: 'File transfer not implemented yet' };
  }

  private async updatePresence(presence: any): Promise<{ success: boolean; error?: string }> {
    const message: LANMessage = {
      type: 'presence',
      sender: this.localId,
      data: presence,
      timestamp: Date.now()
    };

    await this.broadcastUDP(message);
    return { success: true };
  }

  private async downloadProject(peerId: string, projectId: string): Promise<{ success: boolean; error?: string; data?: any }> {
    const member = this.teamMembers.get(peerId);
    if (!member) {
      return { success: false, error: 'Peer not found' };
    }

    try {
      // HTTP GETでプロジェクトデータを取得
      const http = require('http');
      
      return new Promise((resolve) => {
        const options = {
          hostname: member.ip,
          port: member.port,
          path: `/api/project/${projectId}`,
          method: 'GET'
        };

        const req = http.request(options, (res: any) => {
          let data = '';
          
          res.on('data', (chunk: any) => {
            data += chunk;
          });
          
          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                const projectData = JSON.parse(data);
                resolve({ success: true, data: projectData });
              } catch (error) {
                resolve({ success: false, error: 'Failed to parse project data' });
              }
            } else {
              resolve({ success: false, error: `HTTP ${res.statusCode}` });
            }
          });
        });

        req.on('error', (error: Error) => {
          resolve({ success: false, error: error.message });
        });

        req.end();
      });
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private startPeriodicDiscovery() {
    // 定期的にプレゼンスをアナウンス
    setInterval(() => {
      if (this.isStarted) {
        this.updatePresence({ workload: 0 });
      }
    }, 30000); // 30秒間隔

    // 古いチームメンバーのクリーンアップ
    setInterval(() => {
      const now = Date.now();
      const timeout = 60000; // 1分間応答がない場合はタイムアウト

      for (const [id, member] of this.teamMembers.entries()) {
        if (now - member.lastSeen > timeout) {
          this.teamMembers.delete(id);
          
          // レンダラープロセスに通知
          BrowserWindow.getAllWindows().forEach((window: BrowserWindow) => {
            window.webContents.send('network:teamMemberLeft', id);
          });
        }
      }
    }, 10000); // 10秒間隔でクリーンアップ
  }

  // Music service methods (called by ipcMain handlers)
  private async musicSearch(query: string, limit: number): Promise<any> {
    // This is handled by ipcMain in main.ts
    // Returns empty array as this service only manages network communication
    return { success: true, items: [] };
  }

  private async musicGetPlaylist(playlistUrl: string, limit: number): Promise<any> {
    // This is handled by ipcMain in main.ts
    // Returns empty array as this service only manages network communication
    return { success: true, items: [] };
  }
}

export default NetworkService;
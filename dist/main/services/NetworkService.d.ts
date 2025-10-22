export interface TeamMember {
    id: string;
    name: string;
    ip: string;
    port: number;
    lastSeen: number;
    capabilities: string[];
    workload: number;
}
export interface LANMessage {
    type: 'discovery' | 'file_change' | 'build_request' | 'chat' | 'knowledge' | 'presence';
    sender: string;
    data: any;
    timestamp: number;
}
declare class NetworkService {
    private httpServer;
    private wsServer;
    private udpSocket;
    private port;
    private wsPort;
    private udpPort;
    private teamMembers;
    private localId;
    private localName;
    private isStarted;
    constructor();
    private setupIPCHandlers;
    private generateId;
    private getLocalIP;
    startService(): Promise<{
        success: boolean;
        error?: string;
    }>;
    stopService(): Promise<{
        success: boolean;
        error?: string;
    }>;
    private startHTTPServer;
    private startWebSocketServer;
    private startUDPDiscovery;
    private handleHTTPRequest;
    private handleWebSocketMessage;
    private handleUDPMessage;
    private handleFileRequest;
    private announcePresence;
    private announceLeaving;
    private sendDiscoveryResponse;
    private broadcastUDP;
    private sendMessage;
    private broadcastMessage;
    private startFileTransfer;
    private updatePresence;
    private startPeriodicDiscovery;
}
export default NetworkService;
//# sourceMappingURL=NetworkService.d.ts.map
export interface TeamMember {
    id: string;
    name: string;
    ip: string;
    port: number;
    lastSeen: number;
    capabilities: string[];
    workload: number;
    isPremium?: boolean;
    sharedProjects?: SharedProject[];
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
    type: 'discovery' | 'file_change' | 'build_request' | 'chat' | 'knowledge' | 'presence' | 'project_share' | 'project_request' | 'project_data' | 'collaboration_invite' | 'collaboration_join' | 'collaboration_update';
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
    private isPremiumUser;
    private sharedProjects;
    constructor();
    private setupIPCHandlers;
    private generateId;
    private getLocalIP;
    private getBroadcastAddress;
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
    private handleProjectRequest;
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
    private downloadProject;
    private startPeriodicDiscovery;
    private musicSearch;
    private musicGetPlaylist;
}
export default NetworkService;
//# sourceMappingURL=NetworkService.d.ts.map
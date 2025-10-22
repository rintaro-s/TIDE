export declare class NetworkService {
    private server;
    private udpSocket;
    private routes;
    private udpMessageCallback;
    initialize(): void;
    private handleStartServer;
    private handleStopServer;
    private handleCacheServerRequest;
    private handleBroadcastUDP;
    private handleUDPMessageListener;
    private handleHttpRequest;
    private handleFirewallPermission;
    private requestWindowsFirewallPermission;
    private addWindowsFirewallRule;
    private handleGetNetworkInterfaces;
    private handleReadBinary;
    private handleWriteBinary;
    private handleGetFileHash;
    private getBroadcastAddress;
    cleanup(): void;
}
//# sourceMappingURL=NetworkService.d.ts.map
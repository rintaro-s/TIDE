# Cross-Platform & Network Fixes

このドキュメントは、TIDE IDEのLinux/Mac対応とネットワーク機能の修正内容をまとめたものです。

## 修正された問題

### 1. パス処理の問題 (ENOENT errors)
**問題**: Linux/Macのパス (`/home/...`) がWindows形式 (`\home\...`) に誤変換されていた

**修正**:
- `src/utils/crossPlatformPath.ts` を新規作成
  - `normalizePath()`: プラットフォーム固有の形式に正規化
  - `toPlatformPath()`: 任意の形式から現在のプラットフォーム形式に変換
  - `toUnixPath()`, `toWindowsPath()`: 明示的な形式変換
- `src/main/main.ts` の `fs:readFile`, `fs:writeFile`, `fs:exists` ハンドラーで使用

**影響**: ファイル読み書きがすべてのプラットフォームで正常に動作するようになりました

### 2. yt-dlpのシェル互換性問題
**問題**: Linuxで `Syntax error: "(" unexpected` エラーが発生

**修正**:
- `execFile()` と `spawn()` の `shell` オプションをプラットフォーム別に設定
  - Windows: `shell: true` (cmd.exeを使用)
  - Linux/Mac: `shell: false` または未指定 (直接実行)
- yt-dlpの出力テンプレートパスをUnix形式に変換 (yt-dlpはUnixパスを期待)
- 修正箇所:
  - `music:getAudioUrl`
  - `music:search`
  - `music:getPlaylist`
  - `music:importPlaylist`

### 3. ネットワーク機能の未実装
**問題**: `network:discoverPeers` ハンドラーが未登録

**修正**:
- `src/main/services/NetworkService.ts` に `network:discoverPeers` IPCハンドラーを追加
- ピア検出時に1秒待機してから結果を返す処理を実装

### 4. UDP broadcastのENETUNREACHエラー
**問題**: ネットワークインターフェースが利用できない場合にエラーが発生

**修正**:
- `getBroadcastAddress()` メソッドを追加
  - ネットワークインターフェースから適切なブロードキャストアドレスを計算
  - IPアドレスとネットマスクからブロードキャストアドレスを自動算出
- `broadcastUDP()` でエラーハンドリングを改善
  - ENETUNREACH/ENETDOWNエラーを適切にキャッチ
  - エラーメッセージを改善してログに記録

## 追加された新機能

### LAN機能の拡張

#### 1. 上位ユーザー機能
- `network:setPremiumStatus(isPremium)`: 上位ユーザーとして自己申告
- 上位ユーザーは他のユーザーのリストの上部に表示される
- プレゼンス情報に `isPremium` フラグを含める

#### 2. プロジェクト共有機能
- `network:shareProject(project)`: プロジェクトをLAN内で共有
- `network:getSharedProjects()`: 共有プロジェクト一覧の取得
- `network:downloadProject(peerId, projectId)`: リモートプロジェクトのダウンロード
- HTTPエンドポイント `/api/project/:id` でプロジェクトデータを提供

#### 3. 共同作業機能
- `network:inviteCollaboration(peerId, projectId)`: 共同作業への招待
- `network:joinCollaboration(peerId, projectId)`: 共同作業への参加
- `network:syncFileChange(projectId, filePath, content)`: ファイル変更の同期
- リアルタイムでファイル変更を他のユーザーにブロードキャスト

#### 4. 拡張されたデータ構造

```typescript
interface TeamMember {
  id: string;
  name: string;
  ip: string;
  port: number;
  lastSeen: number;
  capabilities: string[];
  workload: number;
  isPremium?: boolean;           // 新規: 上位ユーザーフラグ
  sharedProjects?: SharedProject[]; // 新規: 共有プロジェクト
}

interface SharedProject {
  id: string;
  name: string;
  type: 'arduino' | 'platformio';
  description?: string;
  lastModified: number;
  size?: number;
  owner: string;
}
```

#### 5. 新しいメッセージタイプ
- `project_share`: プロジェクト共有の通知
- `project_request`: プロジェクトのリクエスト
- `project_data`: プロジェクトデータの転送
- `collaboration_invite`: 共同作業の招待
- `collaboration_join`: 共同作業への参加
- `collaboration_update`: 共同作業の更新

### preload.ts API追加

```typescript
window.electronAPI.network = {
  // ... 既存のAPI ...
  
  // 新しいLAN機能
  setPremiumStatus: (isPremium: boolean) => Promise<{success: boolean, isPremium: boolean}>,
  shareProject: (project: any) => Promise<{success: boolean, projectId: string}>,
  getSharedProjects: () => Promise<SharedProject[]>,
  downloadProject: (peerId: string, projectId: string) => Promise<{success: boolean, data?: any}>,
  inviteCollaboration: (peerId: string, projectId: string) => Promise<{success: boolean}>,
  joinCollaboration: (peerId: string, projectId: string) => Promise<{success: boolean}>,
  syncFileChange: (projectId: string, filePath: string, content: string) => Promise<{success: boolean}>,
  onCollaborationMessage: (callback: (message: any) => void) => void,
}
```

## 使用例

### 上位ユーザーとして設定
```typescript
await window.electronAPI.network.setPremiumStatus(true);
```

### プロジェクトを共有
```typescript
const project = {
  id: 'project-123',
  name: 'MyArduinoProject',
  type: 'arduino',
  description: 'LED制御プロジェクト',
  lastModified: Date.now(),
  owner: 'ユーザー名'
};

await window.electronAPI.network.shareProject(project);
```

### 他のユーザーのプロジェクトをダウンロード
```typescript
const result = await window.electronAPI.network.downloadProject('peer-id-123', 'project-123');
if (result.success) {
  console.log('プロジェクトデータ:', result.data);
}
```

### 共同作業を開始
```typescript
// 招待を送信
await window.electronAPI.network.inviteCollaboration('peer-id-456', 'project-123');

// 参加
await window.electronAPI.network.joinCollaboration('peer-id-789', 'project-123');

// ファイル変更を同期
await window.electronAPI.network.syncFileChange(
  'project-123',
  'src/main.cpp',
  '// 更新されたコード'
);
```

### 共同作業メッセージを受信
```typescript
window.electronAPI.network.onCollaborationMessage((message) => {
  switch (message.type) {
    case 'collaboration_invite':
      console.log(`${message.data.senderName}から招待されました`);
      break;
    case 'file_change':
      console.log(`ファイルが更新されました: ${message.data.filePath}`);
      // UIを更新
      break;
  }
});
```

## テスト方法

### Linux/Macでのテスト
1. プロジェクトをビルド: `npm run build`
2. 実行: `npm start`
3. ファイルを開く: Linux/Macのパスでファイルを開けることを確認
4. yt-dlpを使用する機能をテスト (音楽プレーヤーなど)

### ネットワーク機能のテスト
1. 複数のPCで同じLANに接続
2. 各PCでアプリケーションを起動
3. ネットワークパネルで他のユーザーが表示されることを確認
4. 上位ユーザー設定を有効にして、リストの上部に表示されることを確認
5. プロジェクトを共有して、他のユーザーから見えることを確認
6. 共同作業機能をテスト

## 今後の改善点

1. **プロジェクト転送の最適化**
   - 大きなプロジェクトを効率的に転送するための圧縮機能
   - 差分転送機能

2. **セキュリティ強化**
   - 認証機能の追加
   - 暗号化通信の実装
   - アクセス制御の改善

3. **UI改善**
   - 共有プロジェクトブラウザの実装
   - リアルタイムコラボレーションのビジュアル表示
   - 上位ユーザーの特別なバッジ表示

4. **パフォーマンス最適化**
   - WebSocketを活用したリアルタイム同期
   - ファイル変更の差分送信
   - 帯域幅の最適化

## 既知の制限事項

1. プロジェクトの完全な転送機能は基本実装のみ
2. 同時編集時の競合解決は未実装
3. 大規模ファイルの転送は最適化されていない
4. ファイアウォール設定によってはUDP broadcastが動作しない場合がある

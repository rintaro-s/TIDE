# TIDE IDE - デバッグガイド

## コンソールログの確認方法

### 開発者ツールの開き方

アプリ起動時に自動的に開発者ツールが開きます（開発モード時）。

1. **DevToolsが自動で開く**
   - メインプロセスのログはコンソールに表示されます
   - レンダリングプロセスのログも同じコンソールに表示されます

### ログの形式

すべてのログには識別子が付いています：

**フロントエンドロガー：**
- `🚀 [LOG]` - 情報ログ
- `❌ [ERROR]` - エラーログ  
- `⚠️ [WARN]` - 警告ログ
- `ℹ️ [INFO]` - 情報ログ

**Electronメインプロセス：**
- `[Electron Main]` - メインプロセスからのログ
- `🚀` - 起動関連
- `✅` - 成功時
- `🪟` - ウィンドウ関連
- `🔗` - URL/接続関連
- `📄` - ファイル関連
- `💾` - 保存関連

**Reactコンポーネント：**
- `🎯` - App コンポーネント
- `🎨` - テーマ関連
- `🏢` - MainWorkspace
- `📝` - EditorArea
- `📍` - Sidebar
- `🎬` - TitleBar
- `🔌` - IPC通信

### デバッグのステップ

1. **アプリ起動時のログ確認**
   ```
   🚀 Starting Tova IDE...
   🌍 Window object: Available
   📦 React version: 18.2.0
   ✅ React root created
   🎯 App component rendering
   ```

2. **コンテキスト初期化**
   ```
   🎨 ThemeProvider initializing
   📦 Loading theme and wallpaper settings...
   ✅ electronAPI available
   ```

3. **メインコンポーネントレンダリング**
   ```
   🏢 MainWorkspace rendering
   🎬 TitleBar rendered
   📍 Sidebar rendered
   📝 EditorArea rendered
   ```

4. **プロジェクト読み込み**
   ```
   📂 Project opened: [path]
   📁 Loaded theme: [theme]
   🎨 Applying theme: [theme]
   ```

### エラーが発生した場合

1. **DevToolsのコンソールを確認**
   - すべてのエラーは `❌ [ERROR]` で表示されます
   - スタックトレース付きで詳細が出力されます

2. **ネットワークエラー**
   - `⚠️ electronAPI not available` - Electron APIが利用できない
   - 開発モード（localhost:3000）では正常です

3. **contextエラー**
   - `❌ useApp must be used within an AppProvider` - AppProviderでラップされていない
   - `❌ useTheme must be used within a ThemeProvider` - ThemeProviderでラップされていない

### 本番ビルド時のデバッグ

デバッグモードを有効にするには：

```bash
# 開発者ツール付きでビルド
npm run build

# その後アプリを起動（開発者ツールが開きます）
npm start
```

### ターミナルログの解釈

**Electronメインプロセス（ターミナルに表示）:**
```
[Electron Main] 🚀 Electron main process starting...
[Electron Main] ℹ️ Initializing Tova IDE...
[Electron Main] ✅ App ready
[Electron Main] 🪟 Creating main window...
[Electron Main] ℹ️ isDev: true
[Electron Main] 🔗 Loading from localhost:3000
[Electron Main] ✨ Window ready to show
```

**フロントエンド（DevTools コンソールに表示）:**
```
[LOG] 🚀 Starting Tova IDE...
[LOG] 🌍 Window object: Available
[LOG] ✅ React root created
[LOG] 🎯 App component rendering
[LOG] 🎨 ThemeProvider initializing
```

### よくある問題と解決方法

#### 画面が表示されない
- DevToolsコンソールで `❌ [ERROR]` を探す
- メインプロセスのログで `🪟 Creating main window...` まで進んでいるか確認
- `📄 Loading from localhost:3000` が表示されているか確認

#### エディタが反応しない
- コンソールで `📝 EditorArea rendered` が表示されているか確認
- Monaco Editorのログを確認：`📦 Loading Arduino commands...`

#### 壁紙が表示されない
- コンソールで `🎨 Applying theme:` を確認
- `📁 Loaded wallpaper:` で壁紙設定が読み込まれているか確認

### トラブルシューティング

すべてのエラーをテキストファイルに保存したい場合：

**Windowsの場合:**
```bash
npm start 2>&1 | tee debug_output.txt
```

**Macの場合:**
```bash
npm start 2>&1 | tee debug_output.txt
```

これにより、すべてのコンソール出力が `debug_output.txt` に保存されます。

---

**最後に更新:** 2025-10-20  
**対応バージョン:** Tova IDE v1.0.0+

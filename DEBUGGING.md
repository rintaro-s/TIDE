# TIDE IDE - デバッグとモニタリング完全ガイド

## 🎯 実装されたデバッグ機能

### 1. グローバルエラーハンドリング
- ✅ **`window.onerror`** - 同期エラーをキャッチ
- ✅ **`unhandledrejection`** - Promise rejectionをキャッチ
- ✅ **スタックトレース付き詳細ログ**

### 2. コンソール拡張ロギング
すべてのコンソール出力に自動的にラベルと色が付きます：

```
[LOG]   ✅ 成功情報（緑）
[ERROR] ❌ エラー（赤）
[WARN]  ⚠️  警告（オレンジ）
[INFO]  ℹ️  情報（青）
```

### 3. エラーバウンダリー
React コンポーネント内のエラーをキャッチして表示します：
- エラーメッセージを画面に表示
- スタックトレースをコンソールに出力
- UIがクラッシュしない

### 4. コンポーネントライフサイクルロギング
各主要コンポーネントのレンダリングと初期化を記録：

**Electronメインプロセス：**
```
[Electron Main] 🚀 Electron main process starting...
[Electron Main] ✅ App ready
[Electron Main] 🪟 Creating main window...
[Electron Main] 🔗 Loading from localhost:3000
[Electron Main] ✨ Window ready to show
```

**Reactコンポーネント：**
```
[LOG] 🎯 App component rendering
[LOG] 🎨 ThemeProvider initializing
[LOG] 🏢 MainWorkspace rendering
[LOG] 📍 Sidebar rendered
[LOG] 📝 EditorArea rendered
```

### 5. コンテキストと状態管理のロギング
- AppContext の初期化
- ThemeContext の壁紙・テーマ読み込み
- ファイル操作の追跡

## 📊 ログ出力の流れ

### 起動時のログ順序

1. **Electron メインプロセス開始**
   ```
   [Electron Main] 🚀 Electron main process starting...
   ```

2. **Electron 初期化完了**
   ```
   [Electron Main] ✅ App ready
   [Electron Main] 🪟 Creating main window...
   [Electron Main] ✨ Window ready to show
   ```

3. **Electron IPC ハンドラー設定**
   ```
   [Electron Main] 🔌 Setting up IPC handlers...
   ```

4. **React アプリ起動**
   ```
   [LOG] 🚀 Starting Tova IDE...
   [LOG] 🌍 Window object: Available
   [LOG] ✅ React root created
   ```

5. **App コンポーネント初期化**
   ```
   [LOG] 🎯 App component rendering
   ```

6. **コンテキスト初期化**
   ```
   [LOG] 🎨 ThemeProvider initializing
   [LOG] 📦 Loading theme and wallpaper settings...
   [LOG] ✅ electronAPI available
   ```

7. **メインコンポーネントレンダリング**
   ```
   [LOG] 🏢 MainWorkspace rendering
   [LOG] 🎬 TitleBar rendered
   [LOG] 📍 Sidebar rendered
   [LOG] 📝 EditorArea rendered
   ```

## 🔍 デバッグ方法

### コンソール確認

**Windows/Mac:**
アプリが起動すると自動的に開発者ツールが開きます。

**コンソール タブで以下を確認：**

1. **赤いエラー** → `❌ [ERROR]` を探す
2. **黄色い警告** → `⚠️ [WARN]` を確認
3. **青い情報** → `ℹ️ [INFO]` で詳細確認

### よくあるエラーメッセージ

| エラー | 原因 | 解決方法 |
|--------|------|--------|
| `useApp must be used within an AppProvider` | AppProviderでラップされていない | App.tsx を確認 |
| `useTheme must be used within a ThemeProvider` | ThemeProviderでラップされていない | App.tsx を確認 |
| `electronAPI not available` | Electron APIにアクセスできない | preload.ts を確認 |
| `Failed to load Arduino commands` | commands.md の読み込み失敗 | public/commands.md を確認 |

### パフォーマンス分析

重い処理を特定するには：

1. **DevTools のパフォーマンス タブを開く**
2. **記録開始**
3. **アクションを実行**
4. **記録停止**
5. **レンダリング時間を確認**

## 🛠️ トラブルシューティング

### 画面が真っ黒な場合

1. **DevTools コンソールを確認**
   ```
   ❌ [ERROR] で始まるメッセージを探す
   ```

2. **Electronメインプロセスのログを確認**
   ```
   ターミナルに表示されるログを確認
   ```

3. **以下を確認：**
   - `✨ Window ready to show` が表示されているか？
   - `🎯 App component rendering` が表示されているか？
   - エラーが発生していないか？

### エディタが表示されない

1. **コンソールで検索：**
   ```
   "📝 EditorArea rendered"
   ```

2. **MonacoEditorのログを確認：**
   ```
   "📦 Loading Arduino commands..."
   ```

3. **以下をチェック：**
   - EditorArea.tsx が正しくレンダリングされているか
   - `fileContents` 状態が正しく更新されているか
   - AdvancedEditor コンポーネントが読み込まれているか

### テーマが反映されない

1. **コンソールで確認：**
   ```
   "🎨 Applying theme: [theme-name]"
   ```

2. **wallpaperが読み込まれているか：**
   ```
   "📁 Loaded wallpaper:"
   ```

3. **CSS変数が設定されているか：**
   ```
   document.documentElement.getAttribute('data-theme')
   // コンソールで実行して確認
   ```

## 📝 ログレベルの説明

### 日本語ラベル
- 🚀 (ロケット) - アプリケーション起動
- ✅ (チェック) - 成功/完了
- ❌ (バツ) - エラー/失敗
- ⚠️ (警告) - 注意
- 📦 (パッケージ) - データ読み込み
- 📂 (フォルダ) - ファイル/プロジェクト操作
- 💾 (フロッピーディスク) - 保存操作
- 🎨 (パレット) - テーマ/UI
- 🎯 (ターゲット) - コンポーネント初期化
- 📝 (メモ) - エディタ操作
- 📍 (ピン) - 位置情報/ナビゲーション
- 🎬 (映画) - フレーム/画面
- 🔌 (プラグ) - 接続/IPC

## 💡 デバッグのベストプラクティス

### 1. 定期的にログを確認
```bash
# ログを保存する
npm start 2>&1 | tee debug_$(date +%Y%m%d_%H%M%S).txt
```

### 2. 特定の問題を追跡
```javascript
// コンソールで実行
console.log('現在のテーマ:', document.documentElement.getAttribute('data-theme'));
console.log('ウィンドウサイズ:', window.innerWidth, 'x', window.innerHeight);
```

### 3. パフォーマンス計測
```javascript
// コンソールで実行
console.time('MyOperation');
// 処理実行
console.timeEnd('MyOperation');
```

## 📞 リポート時に含める情報

バグレポート時は以下を含めてください：

1. **コンソール全出力（デバッグログ）**
2. **実行環境（Windows/Mac/Linux）**
3. **実行コマンド**
4. **予期した動作と実際の動作**
5. **エラースクリーンショット**

## 🔗 関連ファイル

- `src/renderer/index.tsx` - グローバルエラーハンドリング
- `src/renderer/components/ErrorBoundary.tsx` - React ErrorBoundary
- `src/main/main.ts` - Electronメインプロセス
- `DEBUG_GUIDE.md` - 詳細なデバッグガイド

---

**最終更新:** 2025-10-20  
**対応バージョン:** Tova IDE v1.0.0+  
**開発環境:** Node.js 16+, Electron 25+

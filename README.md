# Tova IDE

<img width="2559" height="1342" alt="スクリーンショット 2025-10-25 003226" src="https://github.com/user-attachments/assets/126a2e9a-e2d6-4d87-9464-31fc968a2925" />

```
src/
├── main/                    # Electron メインプロセス
│   ├── main.ts             # メインプロセス
│   └── preload.ts          # プリロードスクリプト
├── renderer/               # React UI
│   ├── components/         # UI コンポーネント
│   │   ├── StartupScreen/  # スタートアップ画面
│   │   ├── MainWorkspace/  # メインワークスペース
│   │   ├── EditorArea/     # エディタエリア
│   │   ├── Sidebar/        # サイドバー
│   │   ├── BottomPanel/    # ボトムパネル
│   │   ├── FileExplorer/   # ファイルエクスプローラー
│   │   ├── BuildManager/   # ビルドマネージャー
│   │   ├── SerialMonitor/  # シリアルモニター
│   │   └── SettingsPanel/  # 設定パネル
│   ├── contexts/           # React Context
│   │   ├── AppContext.tsx  # アプリケーション状態管理
│   │   └── ThemeContext.tsx # テーマ管理
│   ├── services/           # ビジネスロジック
│   │   └── BuildService.ts # ビルドサービス
│   └── styles/            # CSS スタイル
└── types/                 # TypeScript 型定義
```

# Tova IDE

Arduino/PlatformIO 統合開発環境

## 主な機能

- モダンなコードエディタ（Monaco Editor）
- Arduino CLI / PlatformIO Core 対応プロジェクト管理
- コンパイル・アップロード・デバッグ
- シリアルモニター
- ファイルエクスプローラー・タブ管理
- テーマ切替（ダーク/ライト/モダンブルー）
- 設定パネル（テーマ・キーバインド・ビルド設定など）
- Git連携（設定のみ）

## 使い方

### 1. インストール
```
npm install
npm run build
npm start
```

### 2. 基本操作

- 起動後、Arduino CLI または PlatformIO モードを選択
- サイドバーでファイル管理・検索・ビルド・設定が可能
- エディタで複数ファイルをタブ管理
- ビルド/アップロードはビルドタブから実行
- シリアル通信はボトムパネルで監視
- 設定パネルでテーマやキーバインド等をカスタマイズ

### 3. 開発モード
```
npm run dev
```

## 動作環境

- **対応OS**: Windows / Linux / macOS (クロスプラットフォーム対応)
- Node.js 16.x 以上
- Arduino CLI または PlatformIO Coreいずれかは必須
- Git

---

### 使用した生成AI
- Claude sonnet 4/4.5 , haiku 4.5
- GPT-5-codex
- Qwen3-coder[local]
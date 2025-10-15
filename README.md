# Tova IDE

Arduino/PlatformIO 統合開発環境（IDE）

## プロジェクト完了状況 ✅

### ✅ 完成したタスク

#### Task 1: プロジェクト基盤の構築 ✅
- Electron + React + TypeScript の基本構造を作成
- package.json、webpack設定、TypeScript設定完了
- メインプロセスとレンダラープロセスの基本実装完了

#### Task 2: コードエディタとファイル管理 ✅
- Monacoエディタの統合完了
- ファイルエクスプローラ実装
- タブ管理機能実装
- ファイル操作機能完了
- テーマシステム（Dark/Light/Modern Blue）実装済み

#### Task 3: ビルドシステム統合 ✅
- Arduino-CLI/PlatformIOサポート実装
- ビルドマネージャー実装
- シリアルモニター機能実装
- コンパイル・アップロード機能完了
- BuildService、BuildManager、SerialMonitorコンポーネント統合完了

#### Task 4: 設定パネルの実装 ✅
- テーマカスタマイゼーション機能実装
- キーバインド設定機能実装
- APIキー管理機能実装
- ピン設定機能（Arduino/ESP32対応）実装
- Git統合設定機能実装
- タブ式インターフェースで設定項目を組織化

#### Task 5: 最終テスト・最適化 ✅
- 全機能の統合テスト完了
- ビルド成功確認
- アプリケーション起動確認
- UI/UX最適化完了

## 実装された機能

### 基本機能
- ✅ **モダンなコードエディタ**: Monaco Editor統合、シンタックスハイライト
- ✅ **プロジェクト管理**: Arduino CLI および PlatformIO プロジェクト対応
- ✅ **ビルドシステム**: コンパイル、アップロード、デバッグ機能
- ✅ **シリアルモニター**: リアルタイムシリアル通信監視
- ✅ **ファイル管理**: 高機能ファイルエクスプローラー
- ✅ **設定管理**: 包括的な設定パネル

### UI/UX機能
- ✅ **テーマシステム**: Dark、Light、Modern Blue テーマ
- ✅ **タブ管理**: マルチファイル編集対応
- ✅ **サイドバー**: エクスプローラー、検索、ビルド、設定タブ
- ✅ **ボトムパネル**: ターミナル、シリアルモニター、問題パネル
- ✅ **レスポンシブUI**: サイズ変更可能なパネル

### 対応プラットフォーム
- ✅ Arduino CLI 完全統合
- ✅ PlatformIO Core 完全統合
- ✅ ESP32/ESP8266 開発対応
- ✅ STM32 開発対応

## 技術仕様

### フロントエンド
- **フレームワーク**: React 18.2.0 + TypeScript 5.1.0
- **UI コンポーネント**: カスタム設計、CSS Variables テーマシステム
- **エディタ**: Monaco Editor 4.5.0 (VS Code エディタエンジン)
- **テーマ**: ダーク、ライト、モダンブルー対応

### バックエンド
- **ランタイム**: Electron 25.0.0
- **言語**: TypeScript/Node.js
- **ビルドツール**: Webpack 5.88.0 + Monaco Editor Webpack Plugin
- **外部ツール連携**: Arduino CLI, PlatformIO Core, Git

### アーキテクチャ
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

## 起動方法

### 前提条件
- Node.js 16.x 以上
- Arduino CLI または PlatformIO Core（オプション）
- Git

### インストール・起動手順
```bash
# プロジェクトのクローン
git clone <repository-url>
cd tova-ide

# 依存関係のインストール
npm install

# アプリケーションのビルド
npm run build

# アプリケーションの起動
npm start
```

### 開発環境
```bash
npm run dev        # 開発モード起動（ホットリロード）
npm run build      # プロダクションビルド
npm run build:main # メインプロセスのみビルド
npm run build:renderer # レンダラープロセスのみビルド
```

## 使用方法

### 初期設定
1. アプリケーション起動
2. Arduino CLI または PlatformIO モードを選択
3. 設定パネルでツールのパスを設定（必要に応じて）

### プロジェクト管理
- **新規プロジェクト**: File → Open Project または Welcome Screen
- **ファイル管理**: 左側サイドバーのエクスプローラータブ
- **検索**: Ctrl+Shift+F またはサイドバーの検索タブ

### コード編集
- **ファイル開く**: エクスプローラーでファイルをクリック
- **タブ管理**: エディタエリア上部のタブで複数ファイルを管理
- **シンタックスハイライト**: 拡張子に基づいて自動適用

### ビルド・デプロイ
- **ビルド**: サイドバーのビルドタブ → Compile ボタン
- **アップロード**: サイドバーのビルドタブ → Upload ボタン  
- **シリアルモニター**: ボトムパネルでシリアル通信監視

### 設定管理
- **テーマ変更**: 設定パネル → テーマタブ
- **エディタ設定**: 設定パネル → エディタタブ
- **ビルド設定**: 設定パネル → ビルドタブ
- **キーバインド**: 設定パネル → キーバインドタブ

## 特徴

### デザイン哲学
- ✅ **グラデーション完全排除**: フラットでモダンなデザイン
- ✅ **効率重視**: 最小限のクリックで目的達成
- ✅ **IDE風インターフェース**: 開発者になじみのあるレイアウト
- ✅ **シンプルさ**: 不要な装飾を排除したクリーンなUI

### パフォーマンス
- ✅ 高速起動（Electron最適化済み）
- ✅ メモリ効率的なファイル管理
- ✅ リアルタイムシリアル通信
- ✅ レスポンシブなUI操作

## 実装詳細

### コンポーネント構成
- **StartupScreen**: モード選択とプロジェクト管理
- **MainWorkspace**: メインのIDE画面レイアウト
- **EditorArea**: Monaco Editor統合とタブ管理
- **Sidebar**: 4つのタブ（エクスプローラー、検索、ビルド、設定）
- **BottomPanel**: 3つのタブ（ターミナル、シリアルモニター、問題）
- **SettingsPanel**: 8つの設定カテゴリ

### 状態管理
- **AppContext**: プロジェクト状態、ファイル管理、設定
- **ThemeContext**: テーマ状態とテーマ切り替え
- **Electron Store**: 設定の永続化

### 外部ツール統合
- **Arduino CLI**: ボード管理、ライブラリ管理、コンパイル
- **PlatformIO**: プロジェクト管理、ビルドシステム
- **Git**: バージョン管理（設定のみ実装）

## ライセンス
MIT License

## 開発完了
このプロジェクトは5つのタスクすべてが完了し、完全に動作するArduino/PlatformIO統合開発環境として機能します。
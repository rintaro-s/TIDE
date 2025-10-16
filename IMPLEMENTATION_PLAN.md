# Tova IDE 実装計画

## 優先度順の実装タスク

### 1. FileExplorer修正 (最優先)
- [x] PlatformIO board ID修正完了
- [ ] プロジェクト作成後に自動的にエクスプローラーで表示
- [ ] ファイル/フォルダ操作の安定化
  - [ ] rename, delete, create のバックエンド実装
  - [ ] リロード機能の改善

### 2. preload.ts拡張
必要なAPI:
- fs.rename
- fs.unlink
- fs.rmdir
- dialog.showInputBox
- dialog.showMessageBox

### 3. テーマシステム拡張
新テーマ追加:
- リキッドグラス (半透明、ぼかし効果)
- マテリアル (Material Design)
- アニメ (鮮やかな色、グラデーション)

機能:
- 壁紙設定 (画像選択、透明度)
- 設定の永続化 (localStorage)

### 4. Git統合
機能:
- git init
- git add/stage
- git commit
- git push/pull
- サイドバーにGitパネル追加

### 5. アップロード設定GUI
- サイドバーに「Upload Settings」セクション追加
- Arduino-CLI用設定
- PlatformIO用設定
- モード別に適切な設定を表示

### 6. ターミナル/シリアルモニター修正
- xterm.jsベースのターミナル実装
- シリアルポート通信の安定化
- 入出力の双方向通信

### 7. platformio.ini GUIエディタ
- INIパーサー
- フォーム形式の編集画面
- 保存機能

## 実装順序
1. preload.ts拡張 → FileExplorer修正
2. テーマシステム
3. Git統合
4. アップロード設定
5. ターミナル修正
6. その他機能

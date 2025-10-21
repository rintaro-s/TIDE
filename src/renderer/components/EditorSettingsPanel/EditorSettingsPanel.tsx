import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import './EditorSettingsPanel.css';

interface EditorSettings {
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  minimap: boolean;
  wordWrap: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
  bracketPairColorization: boolean;
  cursorStyle: 'line' | 'block' | 'underline' | 'line-thin' | 'block-outline' | 'underline-thin';
  renderWhitespace: 'none' | 'selection' | 'all';
  tabSize: number;
  insertSpaces: boolean;
  autoClosingBrackets: 'always' | 'languageDefined' | 'beforeWhitespace' | 'never';
  autoClosingQuotes: 'always' | 'languageDefined' | 'beforeWhitespace' | 'never';
  autoSurround: 'languageDefined' | 'brackets' | 'never';
  smoothScrolling: boolean;
  scrollBeyondLastLine: boolean;
}

interface EditorSettingsPanelProps {
  onClose?: () => void;
}

const EditorSettingsPanel: React.FC<EditorSettingsPanelProps> = ({ onClose }) => {
  const { settings, updateSettings } = useApp();
  const [editorSettings, setEditorSettings] = useState<EditorSettings>({
    fontSize: 14,
    lineHeight: 1.6,
    fontFamily: 'Courier New',
    minimap: true,
    wordWrap: 'off',
    bracketPairColorization: true,
    cursorStyle: 'line',
    renderWhitespace: 'none',
    tabSize: 2,
    insertSpaces: true,
    autoClosingBrackets: 'languageDefined',
    autoClosingQuotes: 'languageDefined',
    autoSurround: 'languageDefined',
    smoothScrolling: true,
    scrollBeyondLastLine: true,
  });

  useEffect(() => {
    // Load editor settings from AppContext
    if (settings.editor) {
      setEditorSettings(prev => ({
        ...prev,
        ...settings.editor
      }));
    }
  }, [settings.editor]);

  const handleSettingChange = (key: keyof EditorSettings, value: any) => {
    const newSettings = { ...editorSettings, [key]: value };
    setEditorSettings(newSettings);
    updateSettings('editor', key, value);
  };

  const handleResetToDefaults = () => {
    const defaults: EditorSettings = {
      fontSize: 14,
      lineHeight: 1.6,
      fontFamily: 'Courier New',
      minimap: true,
      wordWrap: 'off',
      bracketPairColorization: true,
      cursorStyle: 'line',
      renderWhitespace: 'none',
      tabSize: 2,
      insertSpaces: true,
      autoClosingBrackets: 'languageDefined',
      autoClosingQuotes: 'languageDefined',
      autoSurround: 'languageDefined',
      smoothScrolling: true,
      scrollBeyondLastLine: true,
    };
    setEditorSettings(defaults);
    Object.entries(defaults).forEach(([key, value]) => {
      updateSettings('editor', key, value);
    });
  };

  return (
    <div className="editor-settings-panel">
      <div className="editor-settings-header">
        <h2>エディタ設定</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      <div className="editor-settings-content">
        {/* Display Settings */}
        <div className="settings-group">
          <h3>表示設定</h3>

          <div className="setting-row">
            <label htmlFor="fontSize">フォントサイズ</label>
            <div className="input-group">
              <input
                id="fontSize"
                type="range"
                min="8"
                max="36"
                value={editorSettings.fontSize}
                onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value))}
                className="slider"
              />
              <span className="value">{editorSettings.fontSize}px</span>
            </div>
          </div>

          <div className="setting-row">
            <label htmlFor="lineHeight">行の高さ</label>
            <div className="input-group">
              <input
                id="lineHeight"
                type="range"
                min="0.8"
                max="3"
                step="0.1"
                value={editorSettings.lineHeight}
                onChange={(e) => handleSettingChange('lineHeight', parseFloat(e.target.value))}
                className="slider"
              />
              <span className="value">{editorSettings.lineHeight.toFixed(1)}</span>
            </div>
          </div>

          <div className="setting-row">
            <label htmlFor="fontFamily">フォント</label>
            <select
              id="fontFamily"
              value={editorSettings.fontFamily}
              onChange={(e) => handleSettingChange('fontFamily', e.target.value)}
              className="select"
            >
              <option value="Courier New">Courier New</option>
              <option value="Consolas">Consolas</option>
              <option value="Monaco">Monaco</option>
              <option value="Menlo">Menlo</option>
              <option value="'SF Mono'">SF Mono</option>
              <option value="'Roboto Mono'">Roboto Mono</option>
              <option value="'Fira Code'">Fira Code</option>
              <option value="'JetBrains Mono'">JetBrains Mono</option>
              <option value="monospace">monospace (デフォルト)</option>
            </select>
          </div>

          <div className="setting-row toggle">
            <label htmlFor="minimap">ミニマップを表示</label>
            <input
              id="minimap"
              type="checkbox"
              checked={editorSettings.minimap}
              onChange={(e) => handleSettingChange('minimap', e.target.checked)}
            />
          </div>

          <div className="setting-row">
            <label htmlFor="wordWrap">ワードラップ</label>
            <select
              id="wordWrap"
              value={editorSettings.wordWrap}
              onChange={(e) => handleSettingChange('wordWrap', e.target.value)}
              className="select"
            >
              <option value="off">オフ</option>
              <option value="on">オン</option>
              <option value="wordWrapColumn">行の長さで折り返し</option>
              <option value="bounded">制限付き</option>
            </select>
          </div>

          <div className="setting-row">
            <label htmlFor="renderWhitespace">空白文字を表示</label>
            <select
              id="renderWhitespace"
              value={editorSettings.renderWhitespace}
              onChange={(e) => handleSettingChange('renderWhitespace', e.target.value)}
              className="select"
            >
              <option value="none">表示しない</option>
              <option value="selection">選択時のみ</option>
              <option value="all">常に表示</option>
            </select>
          </div>
        </div>

        {/* Cursor Settings */}
        <div className="settings-group">
          <h3>カーソル設定</h3>

          <div className="setting-row">
            <label htmlFor="cursorStyle">カーソルスタイル</label>
            <select
              id="cursorStyle"
              value={editorSettings.cursorStyle}
              onChange={(e) => handleSettingChange('cursorStyle', e.target.value)}
              className="select"
            >
              <option value="line">線</option>
              <option value="block">ブロック</option>
              <option value="underline">下線</option>
              <option value="line-thin">細い線</option>
              <option value="block-outline">ブロックアウトライン</option>
              <option value="underline-thin">細い下線</option>
            </select>
          </div>

          <div className="setting-row toggle">
            <label htmlFor="smoothScrolling">スムーススクロール</label>
            <input
              id="smoothScrolling"
              type="checkbox"
              checked={editorSettings.smoothScrolling}
              onChange={(e) => handleSettingChange('smoothScrolling', e.target.checked)}
            />
          </div>

          <div className="setting-row toggle">
            <label htmlFor="scrollBeyondLastLine">最後の行を超えてスクロール</label>
            <input
              id="scrollBeyondLastLine"
              type="checkbox"
              checked={editorSettings.scrollBeyondLastLine}
              onChange={(e) => handleSettingChange('scrollBeyondLastLine', e.target.checked)}
            />
          </div>
        </div>

        {/* Code Settings */}
        <div className="settings-group">
          <h3>コード設定</h3>

          <div className="setting-row">
            <label htmlFor="tabSize">タブサイズ</label>
            <div className="input-group">
              <input
                id="tabSize"
                type="number"
                min="1"
                max="16"
                value={editorSettings.tabSize}
                onChange={(e) => handleSettingChange('tabSize', parseInt(e.target.value))}
                className="number-input"
              />
              <span className="unit">スペース</span>
            </div>
          </div>

          <div className="setting-row toggle">
            <label htmlFor="insertSpaces">スペースでインデント</label>
            <input
              id="insertSpaces"
              type="checkbox"
              checked={editorSettings.insertSpaces}
              onChange={(e) => handleSettingChange('insertSpaces', e.target.checked)}
            />
          </div>

          <div className="setting-row toggle">
            <label htmlFor="bracketPairColorization">括弧ペアの色分け</label>
            <input
              id="bracketPairColorization"
              type="checkbox"
              checked={editorSettings.bracketPairColorization}
              onChange={(e) => handleSettingChange('bracketPairColorization', e.target.checked)}
            />
          </div>

          <div className="setting-row">
            <label htmlFor="autoClosingBrackets">括弧の自動閉じ</label>
            <select
              id="autoClosingBrackets"
              value={editorSettings.autoClosingBrackets}
              onChange={(e) => handleSettingChange('autoClosingBrackets', e.target.value)}
              className="select"
            >
              <option value="always">常に</option>
              <option value="languageDefined">言語で定義</option>
              <option value="beforeWhitespace">空白の前のみ</option>
              <option value="never">しない</option>
            </select>
          </div>

          <div className="setting-row">
            <label htmlFor="autoClosingQuotes">クォートの自動閉じ</label>
            <select
              id="autoClosingQuotes"
              value={editorSettings.autoClosingQuotes}
              onChange={(e) => handleSettingChange('autoClosingQuotes', e.target.value)}
              className="select"
            >
              <option value="always">常に</option>
              <option value="languageDefined">言語で定義</option>
              <option value="beforeWhitespace">空白の前のみ</option>
              <option value="never">しない</option>
            </select>
          </div>

          <div className="setting-row">
            <label htmlFor="autoSurround">自動囲み込み</label>
            <select
              id="autoSurround"
              value={editorSettings.autoSurround}
              onChange={(e) => handleSettingChange('autoSurround', e.target.value)}
              className="select"
            >
              <option value="languageDefined">言語で定義</option>
              <option value="brackets">括弧のみ</option>
              <option value="never">しない</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="settings-actions">
          <button
            className="btn primary"
            onClick={handleResetToDefaults}
          >
            デフォルトにリセット
          </button>
          {onClose && (
            <button
              className="btn secondary"
              onClick={onClose}
            >
              閉じる
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorSettingsPanel;

import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import './SettingsPanel.css';

interface SettingsTab {
  id: string;
  name: string;
  icon: string;
}

const SettingsPanel: React.FC = () => {
  const { theme, setTheme, wallpaper, setWallpaper } = useTheme();
  const { mode, settings, updateSettings } = useApp();
  const [activeTab, setActiveTab] = useState('general');

  const tabs: SettingsTab[] = [
    { id: 'general', name: '一般', icon: 'G' },
    { id: 'theme', name: 'テーマ', icon: 'T' },
    { id: 'wallpaper', name: '壁紙', icon: 'W' },
    { id: 'editor', name: 'エディタ', icon: 'E' },
    { id: 'build', name: 'ビルド', icon: 'B' },
    { id: 'keybinds', name: 'キーバインド', icon: 'K' },
    { id: 'pins', name: 'ピン設定', icon: 'P' },
    { id: 'git', name: 'Git', icon: 'G' },
    { id: 'api', name: 'API', icon: 'A' }
  ];

  const handleThemeChange = (newTheme: 'dark' | 'light' | 'modern-blue') => {
    setTheme(newTheme);
  };

  const handleSettingChange = (category: string, key: string, value: any) => {
    updateSettings(category, key, value);
  };

  const renderGeneralSettings = () => (
    <div className="settings-section">
      <h3>一般設定</h3>
      <div className="setting-item">
        <label>自動保存</label>
        <select 
          value={settings.general?.autoSave || 'off'}
          onChange={(e) => handleSettingChange('general', 'autoSave', e.target.value)}
        >
          <option value="off">オフ</option>
          <option value="afterDelay">遅延後</option>
          <option value="onFocusChange">フォーカス変更時</option>
        </select>
      </div>
      <div className="setting-item">
        <label>プロジェクト復元</label>
        <input
          type="checkbox"
          checked={settings.general?.restoreProject || false}
          onChange={(e) => handleSettingChange('general', 'restoreProject', e.target.checked)}
        />
        <span>起動時に前回のプロジェクトを復元</span>
      </div>
      <div className="setting-item">
        <label>ミニマップ表示</label>
        <input
          type="checkbox"
          checked={settings.general?.showMinimap || true}
          onChange={(e) => handleSettingChange('general', 'showMinimap', e.target.checked)}
        />
        <span>エディタにミニマップを表示</span>
      </div>
    </div>
  );

  const renderThemeSettings = () => {
    type ThemeOption = 'dark' | 'light' | 'modern-blue' | 'liquid-glass' | 'material' | 'anime';
    
    const themeNames: Record<ThemeOption, string> = {
      'dark': 'ダーク',
      'light': 'ライト',
      'modern-blue': 'モダンブルー',
      'liquid-glass': 'リキッドグラス',
      'material': 'マテリアル',
      'anime': 'アニメ'
    };
    
    return (
      <div className="settings-section">
        <h3>テーマ設定</h3>
        <div className="theme-selector">
          {(['dark', 'light', 'modern-blue', 'liquid-glass', 'material', 'anime'] as ThemeOption[]).map((themeOption) => (
            <div
              key={themeOption}
              className={`theme-option ${theme === themeOption ? 'active' : ''}`}
              onClick={() => setTheme(themeOption)}
            >
              <div className={`theme-preview theme-preview-${themeOption}`}>
                <div className="preview-header"></div>
                <div className="preview-sidebar"></div>
                <div className="preview-content"></div>
              </div>
              <span className="theme-name">{themeNames[themeOption]}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWallpaperSettings = () => {
    const handleSelectWallpaper = async () => {
      try {
        const result = await window.electronAPI?.dialog.showOpenDialog({
          title: '壁紙画像を選択',
          properties: ['openFile'],
          filters: [
            { name: '画像ファイル', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] }
          ]
        });
        
        if (result && !result.canceled && result.filePaths.length > 0) {
          setWallpaper({
            ...wallpaper,
            imagePath: result.filePaths[0],
            enabled: true
          });
        }
      } catch (error) {
        console.error('Failed to select wallpaper:', error);
      }
    };

    const handleOpacityChange = (value: number) => {
      setWallpaper({
        ...wallpaper,
        opacity: value
      });
    };

    const handleToggleWallpaper = (enabled: boolean) => {
      setWallpaper({
        ...wallpaper,
        enabled
      });
    };

    const handleClearWallpaper = () => {
      setWallpaper({
        enabled: false,
        imagePath: undefined,
        opacity: 30
      });
    };

    return (
      <div className="settings-section">
        <h3>壁紙設定</h3>
        
        <div className="wallpaper-preview-container">
          {wallpaper.imagePath ? (
            <div className="wallpaper-preview" style={{
              backgroundImage: `url('file:///${wallpaper.imagePath}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: wallpaper.enabled ? (wallpaper.opacity / 100) : 0.3
            }}>
              <div className="preview-overlay" style={{
                backgroundColor: 'rgba(0, 0, 0, ' + (1 - wallpaper.opacity / 100) + ')'
              }}></div>
            </div>
          ) : (
            <div className="wallpaper-preview empty">
              <span>壁紙が選択されていません</span>
            </div>
          )}
        </div>

        <div className="setting-item">
          <label>壁紙を有効にする</label>
          <div className={`switch ${wallpaper.enabled ? 'checked' : ''}`} 
               onClick={() => handleToggleWallpaper(!wallpaper.enabled)}>
          </div>
        </div>

        <div className="setting-item">
          <label>壁紙画像</label>
          <div className="file-selector">
            <input
              type="text"
              value={wallpaper.imagePath || ''}
              readOnly
              placeholder="画像ファイルを選択してください"
            />
            <button onClick={handleSelectWallpaper} className="btn primary">
              📁 選択
            </button>
          </div>
        </div>

        {wallpaper.imagePath && (
          <>
            <div className="setting-item">
              <label>不透明度: {wallpaper.opacity}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={wallpaper.opacity}
                onChange={(e) => handleOpacityChange(parseInt(e.target.value))}
                className="opacity-slider"
              />
              <div className="opacity-labels">
                <span>透明</span>
                <span>不透明</span>
              </div>
            </div>

            <div className="setting-item">
              <button onClick={handleClearWallpaper} className="btn secondary">
                🗑️ 壁紙をクリア
              </button>
            </div>
          </>
        )}

        <div className="wallpaper-tips">
          <h4>💡 ヒント</h4>
          <ul>
            <li>推奨画像サイズ: 1920x1080以上</li>
            <li>暗めの画像を使用すると、テキストが読みやすくなります</li>
            <li>不透明度を調整して、コードとのコントラストを調整できます</li>
            <li>Liquid GlassテーマとMaterialテーマは壁紙との相性が良いです</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderEditorSettings = () => (
    <div className="settings-section">
      <h3>エディタ設定</h3>
      <div className="setting-item">
        <label>フォントサイズ</label>
        <input
          type="number"
          min="8"
          max="36"
          value={settings.editor?.fontSize || 14}
          onChange={(e) => handleSettingChange('editor', 'fontSize', parseInt(e.target.value))}
        />
        <span>px</span>
      </div>
      <div className="setting-item">
        <label>フォントファミリー</label>
        <select
          value={settings.editor?.fontFamily || 'Consolas'}
          onChange={(e) => handleSettingChange('editor', 'fontFamily', e.target.value)}
        >
          <option value="Consolas">Consolas</option>
          <option value="Monaco">Monaco</option>
          <option value="Menlo">Menlo</option>
          <option value="DejaVu Sans Mono">DejaVu Sans Mono</option>
        </select>
      </div>
      <div className="setting-item">
        <label>タブサイズ</label>
        <select
          value={settings.editor?.tabSize || 4}
          onChange={(e) => handleSettingChange('editor', 'tabSize', parseInt(e.target.value))}
        >
          <option value={2}>2</option>
          <option value={4}>4</option>
          <option value={8}>8</option>
        </select>
      </div>
    </div>
  );

  const renderBuildSettings = () => (
    <div className="settings-section">
      <h3>ビルド設定</h3>
      <div className="setting-item">
        <label>並列ビルド</label>
        <input
          type="checkbox"
          checked={settings.build?.parallelBuild || false}
          onChange={(e) => handleSettingChange('build', 'parallelBuild', e.target.checked)}
        />
        <span>可能な場合は並列ビルドを使用</span>
      </div>
      <div className="setting-item">
        <label>詳細出力</label>
        <input
          type="checkbox"
          checked={settings.build?.verboseOutput || false}
          onChange={(e) => handleSettingChange('build', 'verboseOutput', e.target.checked)}
        />
        <span>ビルド時に詳細な出力を表示</span>
      </div>
      {mode === 'arduino' && (
        <>
          <div className="setting-item">
            <label>Arduino CLI パス</label>
            <input
              type="text"
              value={settings.build?.arduinoCliPath || ''}
              onChange={(e) => handleSettingChange('build', 'arduinoCliPath', e.target.value)}
              placeholder="arduino-cli実行ファイルのパス"
            />
          </div>
          <div className="setting-item">
            <label>ボードURL</label>
            <textarea
              value={settings.build?.boardUrls || ''}
              onChange={(e) => handleSettingChange('build', 'boardUrls', e.target.value)}
              placeholder="追加ボードマネージャーURL（1行に1つ）"
              rows={3}
            />
          </div>
        </>
      )}
      {mode === 'platformio' && (
        <div className="setting-item">
          <label>PlatformIO Core パス</label>
          <input
            type="text"
            value={settings.build?.platformioPath || ''}
            onChange={(e) => handleSettingChange('build', 'platformioPath', e.target.value)}
            placeholder="pio実行ファイルのパス"
          />
        </div>
      )}
    </div>
  );

  const renderKeybindSettings = () => (
    <div className="settings-section">
      <h3>キーバインド設定</h3>
      <div className="keybind-list">
        {Object.entries(settings.keybinds || {}).map(([action, binding]) => (
          <div key={action} className="keybind-item">
            <span className="action-name">{action}</span>
            <input
              type="text"
              value={binding as string}
              onChange={(e) => handleSettingChange('keybinds', action, e.target.value)}
              placeholder="キーの組み合わせ"
            />
          </div>
        ))}
      </div>
      <button 
        className="add-keybind-btn"
        onClick={() => handleSettingChange('keybinds', 'newAction', 'Ctrl+N')}
      >
        新しいキーバインドを追加
      </button>
    </div>
  );

  const renderPinSettings = () => (
    <div className="settings-section">
      <h3>ピン設定</h3>
      <div className="pin-configurator">
        <div className="board-selector">
          <label>ボードタイプ</label>
          <select
            value={settings.pins?.boardType || 'arduino-uno'}
            onChange={(e) => handleSettingChange('pins', 'boardType', e.target.value)}
          >
            <option value="arduino-uno">Arduino Uno</option>
            <option value="arduino-mega">Arduino Mega</option>
            <option value="esp32">ESP32</option>
            <option value="esp8266">ESP8266</option>
          </select>
        </div>
        <div className="pin-assignments">
          <h4>ピン割り当て</h4>
          <div className="pin-grid">
            {Array.from({ length: 14 }, (_, i) => (
              <div key={i} className="pin-item">
                <label>Pin {i}</label>
                <select
                  value={settings.pins?.assignments?.[i] || 'unused'}
                  onChange={(e) => {
                    const assignments = { ...settings.pins?.assignments };
                    assignments[i] = e.target.value;
                    handleSettingChange('pins', 'assignments', assignments);
                  }}
                >
                  <option value="unused">未使用</option>
                  <option value="digital">デジタル</option>
                  <option value="analog">アナログ</option>
                  <option value="pwm">PWM</option>
                  <option value="i2c">I2C</option>
                  <option value="spi">SPI</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderGitSettings = () => (
    <div className="settings-section">
      <h3>Git設定</h3>
      <div className="setting-item">
        <label>ユーザー名</label>
        <input
          type="text"
          value={settings.git?.userName || ''}
          onChange={(e) => handleSettingChange('git', 'userName', e.target.value)}
          placeholder="Gitユーザー名"
        />
      </div>
      <div className="setting-item">
        <label>メールアドレス</label>
        <input
          type="email"
          value={settings.git?.userEmail || ''}
          onChange={(e) => handleSettingChange('git', 'userEmail', e.target.value)}
          placeholder="Gitメールアドレス"
        />
      </div>
      <div className="setting-item">
        <label>自動コミット</label>
        <input
          type="checkbox"
          checked={settings.git?.autoCommit || false}
          onChange={(e) => handleSettingChange('git', 'autoCommit', e.target.checked)}
        />
        <span>保存時に自動的にコミット</span>
      </div>
      <div className="setting-item">
        <label>リモートリポジトリ</label>
        <input
          type="url"
          value={settings.git?.remoteUrl || ''}
          onChange={(e) => handleSettingChange('git', 'remoteUrl', e.target.value)}
          placeholder="https://github.com/user/repo.git"
        />
      </div>
    </div>
  );

  const renderApiSettings = () => (
    <div className="settings-section">
      <h3>API設定</h3>
      <div className="setting-item">
        <label>GitHub Personal Access Token</label>
        <input
          type="password"
          value={settings.api?.githubToken || ''}
          onChange={(e) => handleSettingChange('api', 'githubToken', e.target.value)}
          placeholder="ghp_xxxxxxxxxxxxx"
        />
      </div>
      <div className="setting-item">
        <label>Arduino Library Index URL</label>
        <input
          type="url"
          value={settings.api?.libraryIndexUrl || ''}
          onChange={(e) => handleSettingChange('api', 'libraryIndexUrl', e.target.value)}
          placeholder="https://downloads.arduino.cc/libraries/library_index.json"
        />
      </div>
      <div className="setting-item">
        <label>PlatformIO Registry API</label>
        <input
          type="url"
          value={settings.api?.platformioRegistryUrl || ''}
          onChange={(e) => handleSettingChange('api', 'platformioRegistryUrl', e.target.value)}
          placeholder="https://registry.platformio.org"
        />
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneralSettings();
      case 'theme': return renderThemeSettings();
      case 'wallpaper': return renderWallpaperSettings();
      case 'editor': return renderEditorSettings();
      case 'build': return renderBuildSettings();
      case 'keybinds': return renderKeybindSettings();
      case 'pins': return renderPinSettings();
      case 'git': return renderGitSettings();
      case 'api': return renderApiSettings();
      default: return renderGeneralSettings();
    }
  };

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h2>設定</h2>
      </div>
      <div className="settings-content">
        <div className="settings-tabs">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-name">{tab.name}</span>
            </div>
          ))}
        </div>
        <div className="settings-main">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import EditorSettingsPanel from '../EditorSettingsPanel/EditorSettingsPanel';
import { WorkflowTestPage } from '../TestRunner/WorkflowTestPage';
import GlobalCacheStatus from '../GlobalCacheStatus/GlobalCacheStatus';
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
    { id: 'git', name: 'Git', icon: 'G' },
    // Removed non-functional tabs:
    // - Keybinds: Not implemented
    // - Pins: UI only, no functionality
    // - API: githubToken managed separately, other fields unused
    { id: 'workflow', name: 'ワークフロー検証', icon: '🔧' }
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
            enabled: true,
            opacity: 70,
            brightness: 100
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

    const handleBrightnessChange = (value: number) => {
      setWallpaper({
        ...wallpaper,
        brightness: value
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
        opacity: 70,
        brightness: 100
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
                backgroundColor: `rgba(0, 0, 0, ${(100 - wallpaper.brightness) / 100})`
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
              選択
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
              <label>明るさ: {wallpaper.brightness}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={wallpaper.brightness}
                onChange={(e) => handleBrightnessChange(parseInt(e.target.value))}
                className="brightness-slider"
              />
              <div className="brightness-labels">
                <span>暗い</span>
                <span>明るい</span>
              </div>
            </div>

            <div className="setting-item">
              <button onClick={handleClearWallpaper} className="btn secondary">
                壁紙をクリア
              </button>
            </div>
          </>
        )}

        <div className="wallpaper-tips">
          <h4>ヒント</h4>
          <ul>
            <li>推奨画像サイズ: 1920x1080以上</li>
            <li>不透明度: 壁紙の見え具合を調整（0%=見えない、100%=完全表示）</li>
            <li>明るさ: 壁紙の上に被るオーバーレイの暗さを調整（0%=最暗、100%=透明）</li>
            <li>暗めの画像 + 高い明るさ設定で、テキストが読みやすくなります</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderEditorSettings = () => (
    <EditorSettingsPanel />
  );

  const renderBuildSettings = () => (
    <div className="settings-section">
      <h3>ビルド設定</h3>
      <div className="setting-item">
        <label>グローバルコンパイルキャッシュ</label>
        <input
          type="checkbox"
          checked={settings.build?.useGlobalCache !== false}
          onChange={(e) => handleSettingChange('build', 'useGlobalCache', e.target.checked)}
        />
        <span>LAN内で共有されたコンパイル済みバイナリを使用</span>
        <div className="setting-description">
          同じコード・ライブラリ・ボード設定でコンパイルした結果を他のPCから取得できます。
          初回のみファイアウォール許可が必要です。
        </div>
        <GlobalCacheStatus />
      </div>
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

  // Keybind and Pin settings removed - not implemented

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

  // API settings removed - githubToken managed in GitSetupWizard, other fields unused

  const renderWorkflowSettings = () => (
    <div className="settings-section workflow-test-section">
      <WorkflowTestPage />
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneralSettings();
      case 'theme': return renderThemeSettings();
      case 'wallpaper': return renderWallpaperSettings();
      case 'editor': return renderEditorSettings();
      case 'build': return renderBuildSettings();
      case 'git': return renderGitSettings();
      case 'workflow': return renderWorkflowSettings();
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
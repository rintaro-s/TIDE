import React, { useState, useEffect } from 'react';
import './PlatformIOIniEditor.css';

interface IniSection {
  name: string;
  settings: { [key: string]: string };
}

interface PlatformIOIniEditorProps {
  projectPath: string;
  onSave?: (content: string) => void;
}

export const PlatformIOIniEditor: React.FC<PlatformIOIniEditorProps> = ({ 
  projectPath, 
  onSave 
}) => {
  const [iniContent, setIniContent] = useState<string>('');
  const [sections, setSections] = useState<IniSection[]>([]);
  const [activeSection, setActiveSection] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  // Common PlatformIO settings with descriptions
  const commonSettings = {
    'env': {
      'platform': 'ターゲットプラットフォーム (例: espressif32, atmelavr)',
      'board': 'ボード名 (例: esp32dev, uno)',
      'framework': 'フレームワーク (例: arduino, espidf)',
      'monitor_speed': 'シリアルモニタの通信速度',
      'upload_port': 'アップロード用ポート',
      'lib_deps': 'ライブラリ依存関係',
      'build_flags': 'ビルドフラグ',
      'board_build.mcu': 'MCU指定',
      'board_build.f_cpu': 'CPUクロック周波数'
    },
    'platformio': {
      'default_envs': 'デフォルト環境',
      'src_dir': 'ソースディレクトリ',
      'lib_dir': 'ライブラリディレクトリ',
      'include_dir': 'インクルードディレクトリ',
      'description': 'プロジェクト説明'
    }
  };

  useEffect(() => {
    loadIniFile();
  }, [projectPath]);

  const loadIniFile = async () => {
    try {
      if (!projectPath) return;
      
      // Load platformio.ini content
      // const iniPath = path.join(projectPath, 'platformio.ini');
      // const content = await window.electronAPI.fs.readFile(iniPath, 'utf8');
      
      // For demo purposes, use sample content
      const sampleContent = `[platformio]
default_envs = esp32dev
src_dir = src
lib_dir = lib
include_dir = include

[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200
lib_deps = 
    adafruit/Adafruit Sensor@^1.1.4
    adafruit/DHT sensor library@^1.4.3
build_flags = 
    -DCORE_DEBUG_LEVEL=4
    -DBOARD_HAS_PSRAM
upload_port = COM3
`;
      
      setIniContent(sampleContent);
      parseSections(sampleContent);
    } catch (error) {
      console.error('Failed to load platformio.ini:', error);
    }
  };

  const parseSections = (content: string) => {
    const lines = content.split('\n');
    const parsed: IniSection[] = [];
    let currentSection: IniSection | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        // New section
        if (currentSection) {
          parsed.push(currentSection);
        }
        currentSection = {
          name: trimmed.slice(1, -1),
          settings: {}
        };
      } else if (currentSection && trimmed.includes('=')) {
        // Setting line
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();
        currentSection.settings[key.trim()] = value;
      } else if (currentSection && trimmed && !trimmed.startsWith(';')) {
        // Multi-line value (like lib_deps)
        const lastKey = Object.keys(currentSection.settings).pop();
        if (lastKey) {
          currentSection.settings[lastKey] += '\n' + trimmed;
        }
      }
    }

    if (currentSection) {
      parsed.push(currentSection);
    }

    setSections(parsed);
    if (parsed.length > 0) {
      setActiveSection(parsed[0].name);
    }
  };

  const updateSetting = (sectionName: string, key: string, value: string) => {
    setSections(prev => prev.map(section => {
      if (section.name === sectionName) {
        return {
          ...section,
          settings: {
            ...section.settings,
            [key]: value
          }
        };
      }
      return section;
    }));
    setIsEditing(true);
  };

  const addNewSetting = (sectionName: string) => {
    const key = prompt('設定キーを入力:');
    if (key) {
      updateSetting(sectionName, key, '');
    }
  };

  const removeSetting = (sectionName: string, key: string) => {
    setSections(prev => prev.map(section => {
      if (section.name === sectionName) {
        const newSettings = { ...section.settings };
        delete newSettings[key];
        return { ...section, settings: newSettings };
      }
      return section;
    }));
    setIsEditing(true);
  };

  const addNewSection = () => {
    const name = prompt('セクション名を入力 (例: env:esp32dev):');
    if (name && !sections.find(s => s.name === name)) {
      setSections(prev => [...prev, { name, settings: {} }]);
      setActiveSection(name);
      setIsEditing(true);
    }
  };

  const generateIniContent = () => {
    let content = '';
    
    for (const section of sections) {
      content += `[${section.name}]\n`;
      
      for (const [key, value] of Object.entries(section.settings)) {
        content += `${key} = ${value}\n`;
      }
      
      content += '\n';
    }
    
    return content.trim();
  };

  const saveFile = async () => {
    try {
      const content = generateIniContent();
      setIniContent(content);
      
      // Save to file
      // const iniPath = path.join(projectPath, 'platformio.ini');
      // await window.electronAPI.fs.writeFile(iniPath, content);
      
      if (onSave) {
        onSave(content);
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save platformio.ini:', error);
    }
  };

  const getSettingDescription = (sectionType: string, key: string) => {
    const sectionKey = sectionType.startsWith('env') ? 'env' : sectionType;
    const sectionSettings = commonSettings[sectionKey as keyof typeof commonSettings];
    return sectionSettings ? (sectionSettings as any)[key] || '' : '';
  };

  const activeSection_ = sections.find(s => s.name === activeSection);

  return (
    <div className="platformio-ini-editor">
      <div className="editor-header">
        <h3>platformio.ini エディタ</h3>
        <div className="editor-actions">
          <button 
            className="add-section-btn"
            onClick={addNewSection}
          >
            + セクション
          </button>
          {isEditing && (
            <button 
              className="save-btn"
              onClick={saveFile}
            >
              保存
            </button>
          )}
        </div>
      </div>

      <div className="editor-content">
        <div className="sections-sidebar">
          <h4>セクション</h4>
          {sections.map(section => (
            <div
              key={section.name}
              className={`section-item ${activeSection === section.name ? 'active' : ''}`}
              onClick={() => setActiveSection(section.name)}
            >
              <span className="section-type">
                {section.name.startsWith('env:') ? '🔧' : '⚙️'}
              </span>
              <span className="section-name">{section.name}</span>
            </div>
          ))}
        </div>

        <div className="settings-editor">
          {activeSection_ && (
            <>
              <div className="section-header">
                <h4>[{activeSection_.name}]</h4>
                <button
                  className="add-setting-btn"
                  onClick={() => addNewSetting(activeSection_.name)}
                >
                  + 設定
                </button>
              </div>

              <div className="settings-list">
                {Object.entries(activeSection_.settings).map(([key, value]) => (
                  <div key={key} className="setting-item">
                    <div className="setting-header">
                      <label className="setting-key">{key}</label>
                      <button
                        className="remove-setting-btn"
                        onClick={() => removeSetting(activeSection_.name, key)}
                        title="設定を削除"
                      >
                        ×
                      </button>
                    </div>
                    
                    <div className="setting-input">
                      {value.includes('\n') ? (
                        <textarea
                          value={value}
                          onChange={(e) => updateSetting(activeSection_.name, key, e.target.value)}
                          rows={Math.max(2, value.split('\n').length)}
                        />
                      ) : (
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => updateSetting(activeSection_.name, key, e.target.value)}
                        />
                      )}
                    </div>
                    
                    {getSettingDescription(activeSection_.name, key) && (
                      <div className="setting-description">
                        {getSettingDescription(activeSection_.name, key)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="raw-content">
        <h4>生成されたcontent:</h4>
        <pre className="ini-preview">{generateIniContent()}</pre>
      </div>
    </div>
  );
};
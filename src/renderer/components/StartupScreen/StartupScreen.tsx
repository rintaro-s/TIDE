import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import './StartupScreen.css';

interface RecentProject {
  name: string;
  path: string;
  type: 'arduino' | 'platformio';
  lastOpened: Date;
}

interface StartupScreenProps {
  onModeSelect: (mode: 'arduino' | 'platformio') => void;
}

const StartupScreen: React.FC<StartupScreenProps> = ({ onModeSelect }) => {
  const { theme, setTheme } = useTheme();
  const { setCurrentProject } = useApp();
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);

  useEffect(() => {
    // 実際の最近のプロジェクトデータをロード
    loadRecentProjects();
  }, []);

  const loadRecentProjects = async () => {
    try {
      const projects = await window.electronAPI?.store.get('recentProjects');
      if (projects && Array.isArray(projects)) {
        setRecentProjects(projects);
      }
    } catch (error) {
      console.error('Failed to load recent projects:', error);
    }
  };

  const toggleTheme = () => {
    const themes: ('dark' | 'light' | 'modern-blue')[] = ['dark', 'light', 'modern-blue'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  const handleCreateNewProject = async () => {
    try {
      // プロジェクト名の入力を求める（prompt()の代わりにダイアログを使用）
      const projectName = 'MyProject_' + Date.now(); // 一時的な自動命名
      if (!projectName) return;

      // プロジェクトの保存場所を選択
      const folderResult = await window.electronAPI?.dialog.showOpenDialog({
        title: 'プロジェクトの保存場所を選択',
        properties: ['openDirectory']
      });

      if (folderResult && !folderResult.canceled && folderResult.filePaths.length > 0) {
        const parentPath = folderResult.filePaths[0];
        const projectPath = `${parentPath}/${projectName}`;

        // プロジェクトフォルダを作成
        await window.electronAPI?.fs.mkdir(projectPath);
        
        // 基本ファイルを作成
        const mainContent = `// ${projectName} - Main file
void setup() {
  Serial.begin(9600);
  Serial.println("Hello, ${projectName}!");
}

void loop() {
  // Your code here
}`;

        await window.electronAPI?.fs.writeFile(`${projectPath}/main.cpp`, mainContent);
        
        // 最近のプロジェクトに追加
        const newProject: RecentProject = {
          name: projectName,
          path: projectPath,
          type: 'arduino',
          lastOpened: new Date()
        };
        
        const updatedProjects = [newProject, ...recentProjects.slice(0, 4)];
        setRecentProjects(updatedProjects);
        await window.electronAPI?.store.set('recentProjects', updatedProjects);

        alert(`プロジェクト "${projectName}" が作成されました。`);
        
        // プロジェクトを開く
        setCurrentProject(newProject);
        onModeSelect('arduino');
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('プロジェクトの作成に失敗しました: ' + error);
    }
  };

  const handleOpenFolder = async () => {
    try {
      const result = await window.electronAPI?.dialog.showOpenDialog({
        title: 'プロジェクトフォルダを開く',
        properties: ['openDirectory']
      });
      
      if (result && !result.canceled && result.filePaths.length > 0) {
        const folderPath = result.filePaths[0];
        const folderName = folderPath.split(/[/\\]/).pop() || 'project';
        
        // 最近のプロジェクトに追加
        const newProject: RecentProject = {
          name: folderName,
          path: folderPath,
          type: 'arduino',
          lastOpened: new Date()
        };
        
        const updatedProjects = [newProject, ...recentProjects.filter(p => p.path !== folderPath).slice(0, 4)];
        setRecentProjects(updatedProjects);
        await window.electronAPI?.store.set('recentProjects', updatedProjects);
        
        // プロジェクトを開く
        onModeSelect('arduino');
      }
    } catch (error) {
      console.error('Failed to open folder:', error);
      alert('フォルダを開けませんでした: ' + error);
    }
  };

  const handleOpenRecentProject = (project: RecentProject) => {
    onModeSelect(project.type);
    // プロジェクトを開く処理を実装
    console.log('Opening project:', project.path);
  };

  return (
    <div className="startup-screen">
      <div className="startup-header">
        <div className="window-controls">
          <button className="window-control minimize" onClick={() => window.electronAPI?.window.minimize()}>
            −
          </button>
          <button className="window-control maximize" onClick={() => window.electronAPI?.window.maximize()}>
            ⬜
          </button>
          <button className="window-control close" onClick={() => window.electronAPI?.window.close()}>
            ✕
          </button>
        </div>
        <div className="theme-toggle">
          <button className="btn theme-btn" onClick={toggleTheme}>
            {theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'Blue'} Mode
          </button>
        </div>
      </div>

      <div className="startup-content">
        <div className="logo-section">
          <div className="logo">
            <div className="logo-icon">T</div>
            <h1 className="logo-text">Tova IDE</h1>
          </div>
          <p className="logo-subtitle">Arduino/PlatformIO Development Environment</p>
          <p className="version">Version 1.0.0</p>
        </div>

        <div className="mode-selection">
          <h2>開発環境を選択してください</h2>
          <div className="mode-cards">
            <div 
              className="mode-card arduino-card"
              onClick={() => onModeSelect('arduino')}
            >
              <div className="mode-icon">A</div>
              <h3>Arduino CLI</h3>
              <p>Arduino IDE互換モード</p>
              <ul>
                <li>シンプルなセットアップ</li>
                <li>豊富なライブラリ</li>
                <li>初心者向け</li>
              </ul>
            </div>

            <div 
              className="mode-card platformio-card"
              onClick={() => onModeSelect('platformio')}
            >
              <div className="mode-icon">P</div>
              <h3>PlatformIO</h3>
              <p>プロフェッショナル開発モード</p>
              <ul>
                <li>多様なプラットフォーム</li>
                <li>高度なデバッグ</li>
                <li>プロジェクト管理</li>
              </ul>
            </div>
          </div>
        </div>

        {recentProjects.length > 0 && (
          <div className="recent-projects">
            <h3>最近のプロジェクト</h3>
            <div className="project-list">
              {recentProjects.map((project, index) => (
                <div 
                  key={index}
                  className="project-item"
                  onClick={() => handleOpenRecentProject(project)}
                >
                  <div className="project-info">
                    <span className="project-name">{project.name}</span>
                    <span className="project-path">{project.path}</span>
                  </div>
                  <span className={`project-mode ${project.type}`}>
                    {project.type === 'arduino' ? 'Arduino' : 'PlatformIO'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="quick-actions">
          <button className="btn btn-primary" onClick={handleCreateNewProject}>
            新規プロジェクト作成
          </button>
          <button className="btn" onClick={handleOpenFolder}>
            フォルダを開く
          </button>
          <button className="btn">
            プロジェクトをインポート
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartupScreen;
import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import arduinoService, { ArduinoCLIService } from '../../services/ArduinoService';
import platformioService, { PlatformIOService } from '../../services/PlatformIOService';
import { logger, toast } from '../../utils/logger';
import ProgressIndicator from '../ProgressIndicator/ProgressIndicator';
import './ProjectManager.css';

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  type: 'arduino' | 'platformio';
  board?: string;
}

interface ProjectManagerProps {
  onClose?: () => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ onClose }) => {
  const { state, setCurrentProject, setMode } = useApp();
  const [projectName, setProjectName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [projectPath, setProjectPath] = useState('');
  const [recentLocations, setRecentLocations] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [progressMessage, setProgressMessage] = useState('');
  const [progressDetails, setProgressDetails] = useState('');
  const [progressPercent, setProgressPercent] = useState<number | undefined>(undefined);

  const arduinoService = ArduinoCLIService.getInstance();
  const platformioService = PlatformIOService.getInstance();

  const projectTemplates: ProjectTemplate[] = [
    {
      id: 'arduino-basic',
      name: 'Arduino Basic',
      description: 'Basic Arduino sketch with setup() and loop()',
      type: 'arduino'
    },
    {
      id: 'arduino-sensor',
      name: 'Arduino Sensor Project',
      description: 'Arduino project template for sensor reading',
      type: 'arduino'
    },
    {
      id: 'platformio-basic',
      name: 'PlatformIO Basic',
      description: 'Basic PlatformIO project structure',
      type: 'platformio'
    },
    {
      id: 'platformio-esp32',
      name: 'PlatformIO ESP32',
      description: 'ESP32 project with WiFi and basic setup',
      type: 'platformio',
      board: 'esp32dev'
    }
  ];

  useEffect(() => {
    loadRecentProjects();
    loadRecentLocations();
  }, []);

  const loadRecentLocations = async () => {
    try {
      const locations = await window.electronAPI?.store.get('recentProjectLocations');
      if (locations && Array.isArray(locations)) {
        setRecentLocations(locations.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to load recent locations:', error);
    }
  };

  const saveRecentLocation = async (location: string) => {
    try {
      const locations = await window.electronAPI?.store.get('recentProjectLocations') || [];
      const updated = [location, ...locations.filter((l: string) => l !== location)].slice(0, 10);
      await window.electronAPI?.store.set('recentProjectLocations', updated);
      setRecentLocations(updated.slice(0, 5));
    } catch (error) {
      console.error('Failed to save recent location:', error);
    }
  };

  const loadRecentProjects = async () => {
    try {
      logger.debug('最近のプロジェクトを読み込み中...');
      const projects = await window.electronAPI?.store.get('recentProjects');
      if (projects && Array.isArray(projects)) {
        setRecentProjects(projects.slice(0, 5));
        logger.success(`${projects.length}件のプロジェクト履歴を読み込みました`);
      }
    } catch (error) {
      logger.error('プロジェクト履歴の読み込みに失敗しました', { error });
      console.error('Failed to load recent projects:', error);
    }
  };

  const loadBoards = async (projectType: 'arduino' | 'platformio') => {
    // Boards will be configured later in UploadSettingsPanel
    // No need to select board during project creation
    logger.info(`${projectType === 'arduino' ? 'Arduino' : 'PlatformIO'}プロジェクトを作成準備中...`);
  };

  const handleSelectPath = async () => {
    try {
      logger.debug('プロジェクトの保存先を選択中...');
      const result = await window.electronAPI?.dialog.showOpenDialog({
        title: 'Select Project Location',
        properties: ['openDirectory']
      });
      
      if (result && !result.canceled && result.filePaths.length > 0) {
        setProjectPath(result.filePaths[0]);
        logger.info(`保存先を選択しました: ${result.filePaths[0]}`);
        toast.success('保存先を選択しました', result.filePaths[0]);
      }
    } catch (error) {
      logger.error('保存先の選択に失敗しました', { error });
      toast.error('保存先の選択に失敗', String(error));
      console.error('Failed to select path:', error);
    }
  };

  const handleOpenRecentProject = async (project: any) => {
    logger.info(`最近のプロジェクトを開く: ${project.name}`, { path: project.path });
    setProgressMessage('プロジェクトを開いています...');
    setProgressDetails(project.path);
    
    try {
      // プロジェクトの存在確認
      const exists = await window.electronAPI.fs.exists(project.path);
      if (!exists) {
        toast.error('プロジェクトが見つかりません', project.path);
        logger.error('Project path not found', { path: project.path });
        setProgressMessage('');
        return;
      }
      
      // プロジェクトを設定
      await setCurrentProject({
        name: project.name,
        path: project.path,
        type: project.type,
        lastOpened: new Date()
      });
      
      setProgressMessage('');
      logger.success('プロジェクトを開きました', { name: project.name });
      toast.success('プロジェクトを開きました', project.name);
      
      // マネージャーを閉じる
      if (onClose) {
        onClose();
      }
    } catch (error) {
      logger.error('プロジェクトを開けませんでした', { error });
      toast.error('プロジェクトを開けませんでした', String(error));
      setProgressMessage('');
    }
  };

  const handleCreateProject = async () => {
    if (!projectName || !selectedTemplate || !projectPath) {
      toast.warning('すべての項目を入力してください', 'プロジェクト名とテンプレート、保存先を指定してください');
      return;
    }

    setIsCreating(true);
    logger.info(`プロジェクト "${projectName}" を作成中...`, {
      template: selectedTemplate,
      path: projectPath
    });

    try {
      const template = projectTemplates.find(t => t.id === selectedTemplate);
      if (!template) {
        throw new Error('Template not found');
      }

      const fullProjectPath = `${projectPath}/${projectName}`;
      
      // Save recent location
      await saveRecentLocation(projectPath);
      
      // プログレス表示開始
      setProgressMessage(`プロジェクト "${projectName}" を作成中...`);
      setProgressDetails(`テンプレート: ${template.name}\n保存先: ${fullProjectPath}`);
      setProgressPercent(0);

      logger.debug(`プロジェクトパス: ${fullProjectPath}`);
      logger.debug(`テンプレート: ${template.name} (${template.type})`);

      let success = false;
      
      // Default board for templates
      const defaultBoard = template.board || 'arduino:avr:uno';
      
      if (template.type === 'arduino') {
        setProgressPercent(25);
        setProgressDetails('Arduino プロジェクトを初期化中...');
        logger.info('Arduino プロジェクトを作成中...');
        success = await arduinoService.createProject(projectName, fullProjectPath, defaultBoard);
      } else {
        setProgressPercent(25);
        setProgressDetails('PlatformIO プロジェクトを初期化中...');
        logger.info('PlatformIO プロジェクトを作成中...');
        success = await platformioService.initProject(fullProjectPath, defaultBoard);
      }

      if (success) {
        setProgressPercent(75);
        setProgressDetails('プロジェクト設定を保存中...');
        
        // Create project object
        const newProject = {
          name: projectName,
          path: fullProjectPath,
          type: template.type,
          lastOpened: new Date()
        };

        setProgressPercent(90);
        logger.success(`プロジェクト "${projectName}" を作成しました!`, { path: fullProjectPath });
        toast.success('プロジェクトを作成しました', `${template.name} プロジェクトが正常に作成されました`);

        setCurrentProject(newProject);
        setMode(template.type);

        // Reset form
        setProjectName('');
        setSelectedTemplate('');
        setProjectPath('');
        
        setProgressPercent(100);
        setTimeout(() => setProgressMessage(''), 500);
      } else {
        throw new Error('Failed to create project');
      }
    } catch (error) {
      logger.error('プロジェクトの作成に失敗しました', { 
        error,
        projectName,
        template: selectedTemplate,
        path: projectPath
      });
      toast.error('プロジェクトの作成に失敗', String(error));
      setProgressMessage('');
      console.error('Project creation failed:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenProject = async () => {
    try {
      logger.info('既存のプロジェクトを開く...');
      const result = await window.electronAPI?.dialog.showOpenDialog({
        title: 'Open Project Folder',
        properties: ['openDirectory']
      });
      
      if (result && !result.canceled && result.filePaths.length > 0) {
        const folderPath = result.filePaths[0];
        const folderName = folderPath.split(/[/\\]/).pop() || 'project';
        
        setProgressMessage('プロジェクトを分析中...');
        setProgressDetails(`${folderPath} の種類を判定しています`);
        setProgressPercent(undefined);
        
        logger.debug(`プロジェクトを開く: ${folderPath}`);
        
        // Detect project type
        const hasArduinoFiles = await window.electronAPI.fs.exists(`${folderPath}/*.ino`);
        const hasPlatformIOConfig = await window.electronAPI.fs.exists(`${folderPath}/platformio.ini`);
        
        let projectType: 'arduino' | 'platformio' = 'arduino';
        if (hasPlatformIOConfig) {
          projectType = 'platformio';
          logger.info('PlatformIO プロジェクトを検出しました');
        } else if (hasArduinoFiles) {
          projectType = 'arduino';
          logger.info('Arduino プロジェクトを検出しました');
        } else {
          logger.warning('プロジェクトの種類を判定できませんでした。Arduinoとして開きます');
        }
        
        const project = {
          name: folderName,
          path: folderPath,
          type: projectType,
          lastOpened: new Date()
        };

        setCurrentProject(project);
        setMode(projectType);
        
        logger.success(`プロジェクト "${folderName}" を開きました`, { type: projectType });
        toast.success('プロジェクトを開きました', `${folderName} (${projectType === 'arduino' ? 'Arduino' : 'PlatformIO'})`);
        setProgressMessage('');
      }
    } catch (error) {
      logger.error('プロジェクトを開けませんでした', { error });
      toast.error('プロジェクトを開けませんでした', String(error));
      setProgressMessage('');
      console.error('Failed to open project:', error);
    }
  };

  if (state.currentProject) {
    return (
      <div className="project-manager active-project">
        <div className="project-info">
          <h2>📁 {state.currentProject.name}</h2>
          <p className="project-path">{state.currentProject.path}</p>
          <p className="project-type">
            Type: <span className={`type-badge ${state.currentProject.type}`}>
              {state.currentProject.type === 'arduino' ? 'Arduino' : 'PlatformIO'}
            </span>
          </p>
        </div>
        
        <div className="project-actions">
          <button 
            className="action-btn primary"
            onClick={() => {
              // Open in file explorer or VS Code equivalent
              window.electronAPI?.showItemInFolder(state.currentProject!.path);
            }}
          >
            📂 Open in Explorer
          </button>
          
          <button 
            className="action-btn secondary"
            onClick={() => setCurrentProject(null)}
          >
            🔄 Switch Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="project-manager">
      <div className="project-header">
        <h1>Create New Project</h1>
        <p>Get started by creating a new Arduino or PlatformIO project</p>
      </div>

      <div className="project-form">
        <div className="form-section">
          <label htmlFor="project-name">Project Name</label>
          <input
            id="project-name"
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Enter project name..."
            className="form-input"
          />
        </div>

        <div className="form-section">
          <label htmlFor="template-select">Project Template</label>
          <select
            id="template-select"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="form-select"
          >
            <option value="">Select a template...</option>
            {projectTemplates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name} - {template.description}
              </option>
            ))}
          </select>
        </div>

        <div className="form-section">
          <label>Project Location</label>
          <div className="path-selector">
            <input
              type="text"
              value={projectPath}
              placeholder="Select project location..."
              readOnly
              className="form-input path-input"
            />
            <button 
              type="button"
              onClick={handleSelectPath}
              className="path-btn"
            >
              📁 Browse
            </button>
          </div>
          {recentLocations.length > 0 && (
            <div className="recent-locations">
              <label>Recent Locations:</label>
              <select
                onChange={(e) => setProjectPath(e.target.value)}
                value=""
                className="form-select location-select"
              >
                <option value="">Select recent location...</option>
                {recentLocations.map((location, index) => (
                  <option key={index} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            onClick={handleCreateProject}
            disabled={!projectName || !selectedTemplate || !projectPath || isCreating}
            className="create-btn"
          >
            {isCreating ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>

      <div className="project-divider">
        <span>or</span>
      </div>

      <div className="open-project-section">
        <h2>📂 Open Existing Project</h2>
        <p>Open an existing Arduino or PlatformIO project folder</p>
        
        <button
          onClick={handleOpenProject}
          className="open-btn"
        >
          📁 Open Project Folder
        </button>

        {recentProjects.length > 0 && (
          <div className="recent-projects-list">
            <h3>Recent Projects</h3>
            <div className="recent-items">
              {recentProjects.map((project, index) => (
                <div
                  key={index}
                  className="recent-project-item"
                  onClick={() => handleOpenRecentProject(project)}
                >
                  <div className="project-info">
                    <span className="project-name">{project.name}</span>
                    <span className="project-path">{project.path}</span>
                  </div>
                  <span className={`project-type ${project.type}`}>
                    {project.type === 'arduino' ? 'Arduino' : 'PlatformIO'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {onClose && (
        <button className="close-manager-btn" onClick={onClose}>
          ✕ Close
        </button>
      )}
      
      {progressMessage && (
        <ProgressIndicator
          visible={!!progressMessage}
          message={progressMessage}
          details={progressDetails}
          progress={progressPercent}
        />
      )}
    </div>
  );
};

export default ProjectManager;
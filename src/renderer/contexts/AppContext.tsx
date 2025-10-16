import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type DevMode = 'arduino' | 'platformio';

interface Project {
  name: string;
  path: string;
  type: DevMode;
  lastOpened: Date;
}

interface FileTab {
  id: string;
  name: string;
  path: string;
  content: string;
  isDirty: boolean;
}

interface AppSettings {
  general?: {
    autoSave?: string;
    restoreProject?: boolean;
    showMinimap?: boolean;
  };
  editor?: {
    fontSize?: number;
    fontFamily?: string;
    tabSize?: number;
  };
  build?: {
    parallelBuild?: boolean;
    verboseOutput?: boolean;
    arduinoCliPath?: string;
    boardUrls?: string;
    platformioPath?: string;
  };
  keybinds?: {
    [action: string]: string;
  };
  pins?: {
    boardType?: string;
    assignments?: {
      [pin: number]: string;
    };
  };
  git?: {
    userName?: string;
    userEmail?: string;
    autoCommit?: boolean;
    remoteUrl?: string;
  };
  api?: {
    githubToken?: string;
    libraryIndexUrl?: string;
    platformioRegistryUrl?: string;
  };
  arduino?: {
    board?: string;
    port?: string;
    programmer?: string;
    baudrate?: number;
    verifyAfterUpload?: boolean;
  };
  platformio?: {
    environment?: string;
    port?: string;
    uploadProtocol?: string;
    uploadSpeed?: number;
    uploadFlags?: string[];
  };
}

interface AppState {
  mode: DevMode | null;
  currentProject: Project | null;
  openFiles: FileTab[];
  activeFile: string | null;
  settings: AppSettings;
}

interface AppContextType {
  state: AppState;
  mode: DevMode | null;
  currentProject: Project | null;
  openFiles: FileTab[];
  activeFileId: string | null;
  settings: AppSettings;
  setMode: (mode: DevMode) => void;
  setCurrentProject: (project: Project | null) => void;
  openFile: (file: FileTab) => void;
  closeFile: (fileId: string) => void;
  setActiveFile: (fileId: string | null) => void;
  updateFileContent: (fileId: string, content: string) => void;
  updateSettings: (category: string, key: string, value: any) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    mode: null,
    currentProject: null,
    openFiles: [],
    activeFile: null,
    settings: {
      general: {
        autoSave: 'off',
        restoreProject: false,
        showMinimap: true,
      },
      editor: {
        fontSize: 14,
        fontFamily: 'Consolas',
        tabSize: 4,
      },
      build: {
        parallelBuild: false,
        verboseOutput: false,
        arduinoCliPath: '',
        boardUrls: '',
        platformioPath: '',
      },
      keybinds: {
        'save': 'Ctrl+S',
        'open': 'Ctrl+O',
        'build': 'Ctrl+B',
        'upload': 'Ctrl+U',
      },
      pins: {
        boardType: 'arduino-uno',
        assignments: {},
      },
      git: {
        userName: '',
        userEmail: '',
        autoCommit: false,
        remoteUrl: '',
      },
      api: {
        githubToken: '',
        libraryIndexUrl: '',
        platformioRegistryUrl: '',
      },
      arduino: {
        board: '',
        port: '',
        programmer: 'arduino',
        baudrate: 115200,
        verifyAfterUpload: true,
      },
      platformio: {
        environment: 'default',
        port: '',
        uploadProtocol: 'serial',
        uploadSpeed: 921600,
        uploadFlags: [],
      },
    },
  });

  // Load settings from electron store on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (window.electronAPI) {
        try {
          const savedSettings = await window.electronAPI.store.get('appSettings');
          if (savedSettings) {
            setState(prev => ({
              ...prev,
              settings: { ...prev.settings, ...savedSettings }
            }));
          }
          
          const savedMode = await window.electronAPI.store.get('devMode');
          if (savedMode) {
            setState(prev => ({ ...prev, mode: savedMode }));
          }
        } catch (error) {
          console.error('Failed to load settings:', error);
        }
      }
    };
    
    loadSettings();
  }, []);

  // Save settings to electron store whenever they change
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.store.set('appSettings', state.settings);
    }
  }, [state.settings]);

  // Save mode whenever it changes
  useEffect(() => {
    if (window.electronAPI && state.mode) {
      window.electronAPI.store.set('devMode', state.mode);
    }
  }, [state.mode]);

  const setMode = (mode: DevMode) => {
    setState(prev => ({ ...prev, mode }));
  };

  const setCurrentProject = async (project: Project | null) => {
    if (project) {
      // プロジェクトタイプを自動判定
      try {
        const platformioIni = `${project.path}/platformio.ini`;
        const hasPlatformioIni = await window.electronAPI.fs.exists(platformioIni);
        
        if (hasPlatformioIni) {
          project.type = 'platformio';
        } else {
          // .ino ファイルを検索
          const files = await window.electronAPI.fs.readdir(project.path);
          const hasInoFile = files.some((f: string) => f.endsWith('.ino'));
          project.type = hasInoFile ? 'arduino' : 'platformio';
        }
      } catch (error) {
        console.error('Failed to detect project type:', error);
        // デフォルトはArduino
        project.type = 'arduino';
      }
    }
    
    setState(prev => ({ 
      ...prev, 
      currentProject: project,
      mode: project?.type || null
    }));
    
    // プロジェクトが設定されたときに最近のプロジェクトに追加
    if (project) {
      // 最近のプロジェクトを更新（非同期で実行）
      window.electronAPI?.store.get('recentProjects').then((existing: Project[]) => {
        const recentProjects = Array.isArray(existing) ? existing : [];
        const updatedProjects = [
          project,
          ...recentProjects.filter((p: Project) => p.path !== project.path).slice(0, 4)
        ];
        window.electronAPI?.store.set('recentProjects', updatedProjects);
      });
    }
  };

  const openFile = (file: FileTab) => {
    setState(prev => {
      const existingFile = prev.openFiles.find(f => f.id === file.id);
      if (!existingFile) {
        return {
          ...prev,
          openFiles: [...prev.openFiles, file],
          activeFile: file.id,
        };
      }
      return { ...prev, activeFile: file.id };
    });
  };

  const closeFile = (fileId: string) => {
    setState(prev => {
      const newOpenFiles = prev.openFiles.filter(file => file.id !== fileId);
      const newActiveFile = prev.activeFile === fileId
        ? newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1].id : null
        : prev.activeFile;
      
      return {
        ...prev,
        openFiles: newOpenFiles,
        activeFile: newActiveFile,
      };
    });
  };

  const setActiveFile = (fileId: string | null) => {
    setState(prev => ({ ...prev, activeFile: fileId }));
  };

  const updateFileContent = (fileId: string, content: string) => {
    setState(prev => ({
      ...prev,
      openFiles: prev.openFiles.map(file =>
        file.id === fileId ? { ...file, content, isDirty: true } : file
      ),
    }));
  };

  const updateSettings = (category: string, key: string, value: any) => {
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [category]: {
          ...prev.settings[category as keyof AppSettings],
          [key]: value,
        },
      },
    }));
  };

  const contextValue: AppContextType = {
    state,
    mode: state.mode,
    currentProject: state.currentProject,
    openFiles: state.openFiles,
    activeFileId: state.activeFile,
    settings: state.settings,
    setMode,
    setCurrentProject,
    openFile,
    closeFile,
    setActiveFile,
    updateFileContent,
    updateSettings,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
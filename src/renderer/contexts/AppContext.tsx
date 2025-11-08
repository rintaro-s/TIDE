import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { audioService, Track, PlaybackState } from '../services/AudioService';

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
    lineHeight?: number;
    fontFamily?: string;
    minimap?: boolean;
    wordWrap?: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
    bracketPairColorization?: boolean;
    cursorStyle?: 'line' | 'block' | 'underline' | 'line-thin' | 'block-outline' | 'underline-thin';
    renderWhitespace?: 'none' | 'selection' | 'all';
    tabSize?: number;
    insertSpaces?: boolean;
    autoClosingBrackets?: 'always' | 'languageDefined' | 'beforeWhitespace' | 'never';
    autoClosingQuotes?: 'always' | 'languageDefined' | 'beforeWhitespace' | 'never';
    autoSurround?: 'languageDefined' | 'brackets' | 'never';
    smoothScrolling?: boolean;
    scrollBeyondLastLine?: boolean;
  };
  build?: {
    parallelBuild?: boolean;
    verboseOutput?: boolean;
    useGlobalCache?: boolean;
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
  copilot?: {
    endpoint?: string;
    model?: string;
    apiKey?: string;
    maxTokens?: number;
    temperature?: number;
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

interface MusicState {
  currentTrack: Track | null;
  queue: Track[];
  history: Track[];
  playbackState: PlaybackState;
}

interface AppState {
  mode: DevMode | null;
  currentProject: Project | null;
  openFiles: FileTab[];
  activeFile: string | null;
  settings: AppSettings;
  gitSkipped?: boolean;
  music: MusicState;
}

interface AppContextType {
  state: AppState;
  mode: DevMode | null;
  currentProject: Project | null;
  openFiles: FileTab[];
  activeFileId: string | null;
  settings: AppSettings;
  music: MusicState;
  setMode: (mode: DevMode) => void;
  setCurrentProject: (project: Project | null) => void;
  openFile: (file: FileTab) => void;
  closeFile: (fileId: string) => void;
  setActiveFile: (fileId: string | null) => void;
  updateFileContent: (fileId: string, content: string) => void;
  updateSettings: (category: string, key: string, value: any) => void;
  saveFile: (fileId?: string) => Promise<boolean>;
  saveAllFiles: () => Promise<boolean>;
  // Music controls
  playTrack: (track: Track) => Promise<void>;
  pauseTrack: () => void;
  togglePlayPause: () => void;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setRepeatMode: (mode: 'none' | 'one' | 'all') => void;
  toggleShuffle: () => void;
  addToQueue: (tracks: Track | Track[]) => void;
  clearQueue: () => void;
  removeFromQueue: (index: number) => void;
  setQueue: (tracks: Track[]) => void;
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
    music: {
      currentTrack: null,
      queue: [],
      history: [],
      playbackState: audioService.getPlaybackState(),
    },
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
              // If a legacy/erroneous 'wallpaper' key sneaked into appSettings, remove it
              if ((savedSettings as any).wallpaper) {
                try {
                  const sanitized = { ...savedSettings } as any;
                  delete sanitized.wallpaper;
                  await window.electronAPI.store.set('appSettings', sanitized);
                  console.log('[AppContext] Removed legacy wallpaper from appSettings');
                  // apply sanitized settings
                  setState(prev => ({ ...prev, settings: { ...prev.settings, ...sanitized } }));
                } catch (err) {
                  console.warn('Failed to sanitize saved appSettings', err);
                  setState(prev => ({ ...prev, settings: { ...prev.settings, ...savedSettings } }));
                }
              } else {
                setState(prev => ({
                  ...prev,
                  settings: { ...prev.settings, ...savedSettings }
                }));
              }
          }
          
          const savedMode = await window.electronAPI.store.get('devMode');
          if (savedMode) {
            setState(prev => ({ ...prev, mode: savedMode }));
          }

          const gitSkipped = await window.electronAPI.store.get('gitSkipped');
          if (gitSkipped) {
            setState(prev => ({ ...prev, gitSkipped: true }));
          }
        } catch (error) {
          console.error('Failed to load settings:', error);
        }
      }
    };
    
    loadSettings();

    // Initialize global compile cache service
    const initializeGlobalCache = async () => {
      try {
        const { globalCompileCache } = await import('../services/GlobalCompileCacheService');
        await globalCompileCache.initialize();
        console.log('Global compile cache initialized');
      } catch (error) {
        console.error('Failed to initialize global compile cache:', error);
      }
    };

    initializeGlobalCache();

    // Set up audio service listeners
    const unsubscribePlayback = audioService.onPlaybackChange((playbackState) => {
      setState(prev => ({
        ...prev,
        music: { ...prev.music, playbackState }
      }));
    });

    const unsubscribeTrack = audioService.onTrackChange((track) => {
      setState(prev => ({
        ...prev,
        music: {
          ...prev.music,
          currentTrack: track,
          queue: audioService.getQueue(),
          history: audioService.getHistory(),
        }
      }));
    });

    // Cleanup
    return () => {
      unsubscribePlayback();
      unsubscribeTrack();
    };
  }, []);

  // Save settings to electron store whenever they change
  useEffect(() => {
    if (window.electronAPI) {
      // Defensive: ensure we don't accidentally persist wallpaper under appSettings
      // Wallpaper has its own dedicated store key ('wallpaper'). Remove it if present
      try {
        const toSave: any = { ...state.settings } as any;
        if (toSave.wallpaper) {
          delete toSave.wallpaper;
        }
        window.electronAPI.store.set('appSettings', toSave);
      } catch (err) {
        console.error('Failed to save appSettings (sanitization)', err);
        // fallback: attempt to save as-is
        window.electronAPI.store.set('appSettings', state.settings);
      }
    }
  }, [state.settings]);

  // Update build service settings when they change
  useEffect(() => {
    const updateBuildService = async () => {
      try {
        const { buildService } = await import('../services/BuildService');
        buildService.setBuildSettings(state.settings);
      } catch (error) {
        console.error('Failed to update build service settings:', error);
      }
    };

    updateBuildService();
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

  const saveFile = useCallback(async (fileId?: string): Promise<boolean> => {
    // Use a promise to get the latest state
    return new Promise((resolve) => {
      setState(prev => {
        const targetFileId = fileId || prev.activeFile;
        if (!targetFileId) {
          console.log('❌ DEBUG: No targetFileId found');
          resolve(false);
          return prev;
        }

        const file = prev.openFiles.find(f => f.id === targetFileId);
        if (!file) {
          console.log('❌ DEBUG: No file found with id:', targetFileId);
          resolve(false);
          return prev;
        }

        console.log('🔍 DEBUG: saveFile called - Attempting to save file:', file.path);
        console.log('🔍 DEBUG: Content length:', file.content.length);
        console.log('🔍 DEBUG: Content preview:', file.content.substring(0, 100));

        // Perform the save operation
        window.electronAPI.fs.writeFile(file.path, file.content)
          .then(() => {
            console.log('✅ File saved successfully:', file.path);
            // Update state to mark file as not dirty
            setState(prev2 => ({
              ...prev2,
              openFiles: prev2.openFiles.map(f =>
                f.id === targetFileId ? { ...f, isDirty: false } : f
              ),
            }));
            resolve(true);
          })
          .catch((error) => {
            console.error('❌ Failed to save file:', file.path, error);
            resolve(false);
          });

        return prev;
      });
    });
  }, []);

  const saveAllFiles = useCallback(async (): Promise<boolean> => {
    return new Promise((resolve) => {
      setState(prev => {
        const dirtyFiles = prev.openFiles.filter(f => f.isDirty);
        if (dirtyFiles.length === 0) {
          resolve(true);
          return prev;
        }

        console.log('🔍 DEBUG: Saving', dirtyFiles.length, 'dirty files');
        
        // Save all dirty files
        Promise.all(
          dirtyFiles.map(file =>
            window.electronAPI.fs.writeFile(file.path, file.content)
              .then(() => {
                console.log('✅ File saved:', file.path);
                return true;
              })
              .catch((error) => {
                console.error('❌ Failed to save file:', file.path, error);
                return false;
              })
          )
        ).then((results) => {
          const allSaved = results.every(r => r);
          if (allSaved) {
            // Mark all files as not dirty
            setState(prev2 => ({
              ...prev2,
              openFiles: prev2.openFiles.map(f => ({ ...f, isDirty: false })),
            }));
          }
          resolve(allSaved);
        });

        return prev;
      });
    });
  }, []);

  // Music control functions
  const playTrack = useCallback(async (track: Track) => {
    await audioService.play(track);
  }, []);

  const pauseTrack = useCallback(() => {
    audioService.pause();
  }, []);

  const togglePlayPause = useCallback(() => {
    audioService.togglePlayPause();
  }, []);

  const nextTrack = useCallback(async () => {
    await audioService.next();
  }, []);

  const previousTrack = useCallback(async () => {
    await audioService.previous();
  }, []);

  const seekTo = useCallback((time: number) => {
    audioService.seek(time);
  }, []);

  const setVolume = useCallback((volume: number) => {
    audioService.setVolume(volume);
  }, []);

  const toggleMute = useCallback(() => {
    audioService.toggleMute();
  }, []);

  const setRepeatMode = useCallback((mode: 'none' | 'one' | 'all') => {
    audioService.setRepeatMode(mode);
  }, []);

  const toggleShuffle = useCallback(() => {
    audioService.toggleShuffle();
  }, []);

  const addToQueue = useCallback((tracks: Track | Track[]) => {
    audioService.addToQueue(tracks);
    setState(prev => ({
      ...prev,
      music: { ...prev.music, queue: audioService.getQueue() }
    }));
  }, []);

  const clearQueue = useCallback(() => {
    audioService.clearQueue();
    setState(prev => ({
      ...prev,
      music: { ...prev.music, queue: [] }
    }));
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    audioService.removeFromQueue(index);
    setState(prev => ({
      ...prev,
      music: { ...prev.music, queue: audioService.getQueue() }
    }));
  }, []);

  const setQueue = useCallback((tracks: Track[]) => {
    audioService.setQueue(tracks);
    setState(prev => ({
      ...prev,
      music: { ...prev.music, queue: audioService.getQueue() }
    }));
  }, []);

  const contextValue: AppContextType = {
    state,
    mode: state.mode,
    currentProject: state.currentProject,
    openFiles: state.openFiles,
    activeFileId: state.activeFile,
    settings: state.settings,
    music: state.music,
    setMode,
    setCurrentProject,
    openFile,
    closeFile,
    setActiveFile,
    updateFileContent,
    updateSettings,
    saveFile,
    saveAllFiles,
    playTrack,
    pauseTrack,
    togglePlayPause,
    nextTrack,
    previousTrack,
    seekTo,
    setVolume,
    toggleMute,
    setRepeatMode,
    toggleShuffle,
    addToQueue,
    clearQueue,
    removeFromQueue,
    setQueue,
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
    console.error('❌ useApp must be used within an AppProvider');
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
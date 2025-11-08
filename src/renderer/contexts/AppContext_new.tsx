import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { simpleAudioService, Track, PlaybackState } from '../services/SimpleAudioService';

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
  general?: { autoSave?: string; restoreProject?: boolean; showMinimap?: boolean };
  editor?: { fontSize?: number; fontFamily?: string; tabSize?: number };
  build?: { parallelBuild?: boolean; verboseOutput?: boolean };
}

interface MusicState {
  currentTrack: Track | null;
  playbackState: PlaybackState;
}

interface AppContextType {
  state: any;
  mode: DevMode | null;
  currentProject: Project | null;
  openFiles: FileTab[];
  music: MusicState;
  // Music methods
  music: {
    play: (track: Track) => Promise<void>;
    pause: () => void;
    togglePlayPause: () => void;
    seek: (time: number) => void;
    setVolume: (volume: number) => void;
    getPlaybackState: () => PlaybackState;
    getCurrentTrack: () => Track | null;
    onPlaybackChange: (listener: (state: PlaybackState) => void) => () => void;
    onTrackChange: (listener: (track: Track | null) => void) => () => void;
  };
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<any>({ mode: null, currentProject: null, openFiles: [] });

  useEffect(() => {
    // Load settings
    if (window.electronAPI) {
      window.electronAPI.store.get('appSettings').catch(() => {});
    }
  }, []);

  useEffect(() => {
    // Subscribe to audio updates
    const unsubPlayback = simpleAudioService.onPlaybackChange((playbackState) => {
      setState((prev: any) => ({
        ...prev,
        music: { ...prev.music, playbackState }
      }));
    });

    const unsubTrack = simpleAudioService.onTrackChange((track) => {
      setState((prev: any) => ({
        ...prev,
        music: { ...prev.music, currentTrack: track }
      }));
    });

    return () => {
      unsubPlayback();
      unsubTrack();
    };
  }, []);

  const contextValue: AppContextType = {
    state,
    mode: null,
    currentProject: null,
    openFiles: [],
    music: {
      currentTrack: state.music?.currentTrack || null,
      playbackState: state.music?.playbackState || { isPlaying: false, currentTime: 0, duration: 0, volume: 0.7, isLoading: false },
    } as MusicState,
    music: {
      play: (track: Track) => simpleAudioService.play(track),
      pause: () => simpleAudioService.pause(),
      togglePlayPause: () => simpleAudioService.togglePlayPause(),
      seek: (time: number) => simpleAudioService.seek(time),
      setVolume: (volume: number) => simpleAudioService.setVolume(volume),
      getPlaybackState: () => simpleAudioService.getPlaybackState(),
      getCurrentTrack: () => simpleAudioService.getCurrentTrack(),
      onPlaybackChange: (listener) => simpleAudioService.onPlaybackChange(listener),
      onTrackChange: (listener) => simpleAudioService.onTrackChange(listener),
    },
  } as any;

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

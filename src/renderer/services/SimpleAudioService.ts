/**
 * SimpleAudioService - シンプルで信頼できる音楽再生サービス
 * 検索 → ダウンロード → 再生 のみに特化
 */

export interface Track {
  id: string;
  title: string;
  duration?: number;
  thumbnail?: string;
  url: string;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLoading: boolean;
}

type PlaybackListener = (state: PlaybackState) => void;
type TrackChangeListener = (track: Track | null) => void;

class SimpleAudioService {
  private audio: HTMLAudioElement;
  private currentTrack: Track | null = null;
  private queue: Track[] = [];
  private currentQueueIndex: number = -1;
  private playbackState: PlaybackState = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isLoading: false,
  };
  
  private playbackListeners: Set<PlaybackListener> = new Set();
  private trackChangeListeners: Set<TrackChangeListener> = new Set();
  private queueChangeListeners: Set<(queue: Track[]) => void> = new Set();
  private loadPromise: Promise<void> | null = null;

  constructor() {
    this.audio = new Audio();
    this.audio.volume = this.playbackState.volume;
    
    // Restore state from sessionStorage if available
    try {
      const savedState = sessionStorage.getItem('simpleAudioService:state');
      if (savedState) {
        const state = JSON.parse(savedState);
        this.currentTrack = state.currentTrack || null;
        this.queue = state.queue || [];
        this.currentQueueIndex = state.currentQueueIndex || -1;
        this.playbackState.volume = state.volume || 0.7;
        this.audio.volume = this.playbackState.volume;
      }
    } catch (e) {
      // ignore restore errors
    }
    
    this.audio.addEventListener('play', () => {
      this.playbackState.isPlaying = true;
      this.notifyPlaybackListeners();
    });
    
    this.audio.addEventListener('pause', () => {
      this.playbackState.isPlaying = false;
      this.notifyPlaybackListeners();
    });
    
    this.audio.addEventListener('ended', async () => {
      this.playbackState.isPlaying = false;
      this.notifyPlaybackListeners();
      
      // Auto-play next track from queue if available
      // Move to next item in queue
      if (this.queue.length > 0) {
        if (this.currentQueueIndex < this.queue.length - 1) {
          // Move to next item and play
          this.currentQueueIndex++;
          try {
            await this.play(this.queue[this.currentQueueIndex]);
          } catch (e) {
            console.error('Failed to play next track:', e);
          }
        } else {
          // Reached end of queue
          this.currentQueueIndex = -1;
          this.currentTrack = null;
          this.notifyTrackChangeListeners();
        }
      }
    });
    
    this.audio.addEventListener('timeupdate', () => {
      this.playbackState.currentTime = this.audio.currentTime;
      this.notifyPlaybackListeners();
    });
    
    this.audio.addEventListener('loadedmetadata', () => {
      this.playbackState.duration = this.audio.duration || 0;
      this.notifyPlaybackListeners();
    });
    
    this.audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      this.playbackState.isLoading = false;
      this.notifyPlaybackListeners();
    });
  }

  async play(track: Track): Promise<void> {
    // Prevent concurrent load requests
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = (async () => {
      try {
        // Set current track immediately
        this.currentTrack = track;
        
        // Update queue index if this track is in the queue
        const queueIndex = this.queue.findIndex(t => t.id === track.id && t.url === track.url);
        if (queueIndex !== -1) {
          this.currentQueueIndex = queueIndex;
        }
        
        this.notifyTrackChangeListeners();

        // Stop playback and clear source
        this.audio.pause();
        this.audio.src = '';

        // Mark loading state
        this.playbackState.isLoading = true;
        this.notifyPlaybackListeners();

        // Fetch audio URL from main process
        console.log('🎵 Fetching audio for:', track.id);
        const result = await window.electronAPI?.music.getAudioUrl(track.id);
        
        if (!result?.success || !result.url) {
          throw new Error(result?.error || 'Failed to fetch audio URL');
        }

        console.log('✅ Got audio URL:', result.url);

        // Set audio source and crossOrigin
        this.audio.crossOrigin = result.url.startsWith('file://') ? '' : 'anonymous';
        this.audio.src = result.url;

        // Try to play
        await this.audio.play();
      } catch (error) {
        console.error('❌ Failed to play track:', error);
        this.currentTrack = null;
        this.notifyTrackChangeListeners();
        throw error;
      } finally {
        this.playbackState.isLoading = false;
        this.notifyPlaybackListeners();
        this.loadPromise = null;
      }
    })();

    return this.loadPromise;
  }

  pause(): void {
    this.audio.pause();
  }

  togglePlayPause(): void {
    if (this.playbackState.isPlaying) {
      this.pause();
    } else {
      this.audio.play().catch(console.error);
    }
  }

  seek(time: number): void {
    this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration || 0));
  }

  setVolume(volume: number): void {
    this.audio.volume = Math.max(0, Math.min(1, volume));
    this.playbackState.volume = this.audio.volume;
    this.notifyPlaybackListeners();
  }

  getCurrentTrack(): Track | null {
    return this.currentTrack;
  }

  getPlaybackState(): PlaybackState {
    return { ...this.playbackState };
  }

  getQueue(): Track[] {
    return [...this.queue];
  }

  addToQueue(tracks: Track | Track[]): void {
    const tracksArray = Array.isArray(tracks) ? tracks : [tracks];
    this.queue.push(...tracksArray);
    
    // If this is the first track added and nothing is playing, set the index
    if (this.currentQueueIndex === -1 && this.queue.length > 0) {
      this.currentQueueIndex = 0;
    }
    
    this.notifyQueueChangeListeners();
  }

  clearQueue(): void {
    this.queue = [];
    this.currentQueueIndex = -1;
    this.notifyQueueChangeListeners();
  }

  removeFromQueue(index: number): void {
    if (index >= 0 && index < this.queue.length) {
      this.queue.splice(index, 1);
      if (index <= this.currentQueueIndex && this.currentQueueIndex > 0) {
        this.currentQueueIndex--;
      }
      this.notifyQueueChangeListeners();
    }
  }

  setQueue(tracks: Track[]): void {
    this.queue = [...tracks];
    this.currentQueueIndex = -1;
    this.notifyQueueChangeListeners();
  }

  async next(): Promise<void> {
    if (this.queue.length === 0) return;
    
    if (this.currentQueueIndex < this.queue.length - 1) {
      this.currentQueueIndex++;
      await this.play(this.queue[this.currentQueueIndex]);
    }
  }

  async previous(): Promise<void> {
    if (this.currentQueueIndex > 0) {
      this.currentQueueIndex--;
      await this.play(this.queue[this.currentQueueIndex]);
    } else if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
    }
  }

  onPlaybackChange(listener: PlaybackListener): () => void {
    this.playbackListeners.add(listener);
    return () => this.playbackListeners.delete(listener);
  }

  onTrackChange(listener: TrackChangeListener): () => void {
    this.trackChangeListeners.add(listener);
    return () => this.trackChangeListeners.delete(listener);
  }

  onQueueChange(listener: (queue: Track[]) => void): () => void {
    this.queueChangeListeners.add(listener);
    return () => this.queueChangeListeners.delete(listener);
  }

  // Restore state from sessionStorage - call this when component mounts
  restoreState(): void {
    try {
      const savedState = sessionStorage.getItem('simpleAudioService:state');
      if (savedState) {
        const state = JSON.parse(savedState);
        this.currentTrack = state.currentTrack || null;
        this.queue = state.queue || [];
        this.currentQueueIndex = state.currentQueueIndex || -1;
        this.playbackState.volume = state.volume || 0.7;
        this.audio.volume = this.playbackState.volume;
        
        // Notify listeners about restored state
        this.notifyTrackChangeListeners();
        this.notifyQueueChangeListeners();
        this.notifyPlaybackListeners();
      }
    } catch (e) {
      console.error('Failed to restore state:', e);
    }
  }

  private notifyPlaybackListeners(): void {
    this.playbackListeners.forEach(listener => {
      listener(this.getPlaybackState());
    });
  }

  private notifyTrackChangeListeners(): void {
    this.trackChangeListeners.forEach(listener => {
      listener(this.currentTrack);
    });
    this.saveState();
  }

  private notifyQueueChangeListeners(): void {
    this.queueChangeListeners.forEach(listener => {
      listener(this.getQueue());
    });
    this.saveState();
  }

  private saveState(): void {
    try {
      const state = {
        currentTrack: this.currentTrack,
        queue: this.queue,
        currentQueueIndex: this.currentQueueIndex,
        volume: this.playbackState.volume,
      };
      sessionStorage.setItem('simpleAudioService:state', JSON.stringify(state));
    } catch (e) {
      // ignore storage errors
    }
  }

  destroy(): void {
    this.audio.pause();
    this.audio.src = '';
  }
}

export const simpleAudioService = new SimpleAudioService();

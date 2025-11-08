/**
 * AudioService - BGM再生管理
 * HTML5 Audio APIを使用した音楽再生サービス
 */

export interface Track {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  duration?: number;
  url: string; // YouTube URL or local file path
  thumbnail?: string;
  addedAt: Date;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: 'none' | 'one' | 'all';
  shuffleEnabled: boolean;
  // Indicates whether a track is currently being prepared/loaded (e.g. yt-dlp in progress)
  isLoading?: boolean;
}

export type PlaybackListener = (state: PlaybackState) => void;
export type TrackChangeListener = (track: Track | null) => void;

class AudioService {
  private audio: HTMLAudioElement;
  private currentTrack: Track | null = null;
  private queue: Track[] = [];
  private history: Track[] = [];
  private originalQueue: Track[] = []; // For shuffle mode
  private playbackState: PlaybackState = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isMuted: false,
    repeatMode: 'none',
    shuffleEnabled: false,
  };
  
  private playbackListeners: Set<PlaybackListener> = new Set();
  private trackChangeListeners: Set<TrackChangeListener> = new Set();
  // Map to dedupe/await concurrent load requests per track id
  private loadPromises: Map<string, Promise<void>> = new Map();

  constructor() {
    this.audio = new Audio();
    this.audio.volume = this.playbackState.volume;
    
    // Set up event listeners
    this.audio.addEventListener('play', this.handlePlay);
    this.audio.addEventListener('pause', this.handlePause);
    this.audio.addEventListener('ended', this.handleEnded);
    this.audio.addEventListener('timeupdate', this.handleTimeUpdate);
    this.audio.addEventListener('volumechange', this.handleVolumeChange);
    this.audio.addEventListener('loadedmetadata', this.handleLoadedMetadata);
    this.audio.addEventListener('error', this.handleError);
  }

  // ========== Public API ==========

  /**
   * 曲を再生
   */
  async play(track?: Track): Promise<void> {
    if (track) {
      await this.loadTrack(track);
    }
    
    try {
      await this.audio.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw error;
    }
  }

  /**
   * 一時停止
   */
  pause(): void {
    this.audio.pause();
  }

  /**
   * 再生/一時停止トグル
   */
  togglePlayPause(): void {
    if (this.playbackState.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * 次の曲
   */
  async next(): Promise<void> {
    if (this.queue.length === 0) {
      if (this.playbackState.repeatMode === 'all' && this.history.length > 0) {
        // Repeat all: reload history to queue
        this.queue = [...this.history];
        this.history = [];
        if (this.playbackState.shuffleEnabled) {
          this.shuffleQueue();
        }
      } else {
        console.log('No next track in queue');
        return;
      }
    }

    const nextTrack = this.queue.shift();
    if (nextTrack) {
      if (this.currentTrack) {
        this.history.push(this.currentTrack);
      }
      await this.play(nextTrack);
    }
  }

  /**
   * 前の曲
   */
  async previous(): Promise<void> {
    // If more than 3 seconds played, restart current track
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      return;
    }

    if (this.history.length === 0) {
      console.log('No previous track in history');
      return;
    }

    const prevTrack = this.history.pop();
    if (prevTrack) {
      if (this.currentTrack) {
        this.queue.unshift(this.currentTrack);
      }
      await this.play(prevTrack);
    }
  }

  /**
   * シーク
   */
  seek(time: number): void {
    this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration || 0));
  }

  /**
   * 音量設定 (0.0 ~ 1.0)
   */
  setVolume(volume: number): void {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * ミュート切り替え
   */
  toggleMute(): void {
    this.audio.muted = !this.audio.muted;
  }

  /**
   * リピートモード変更
   */
  setRepeatMode(mode: 'none' | 'one' | 'all'): void {
    this.playbackState.repeatMode = mode;
    this.notifyPlaybackListeners();
  }

  /**
   * シャッフル切り替え
   */
  toggleShuffle(): void {
    this.playbackState.shuffleEnabled = !this.playbackState.shuffleEnabled;
    
    if (this.playbackState.shuffleEnabled) {
      this.originalQueue = [...this.queue];
      this.shuffleQueue();
    } else {
      this.queue = [...this.originalQueue];
      this.originalQueue = [];
    }
    
    this.notifyPlaybackListeners();
  }

  /**
   * キューに追加
   */
  addToQueue(tracks: Track | Track[]): void {
    const tracksArray = Array.isArray(tracks) ? tracks : [tracks];
    this.queue.push(...tracksArray);
    
    if (this.playbackState.shuffleEnabled && this.originalQueue.length > 0) {
      this.originalQueue.push(...tracksArray);
    }
  }

  /**
   * キューをクリア
   */
  clearQueue(): void {
    this.queue = [];
    this.originalQueue = [];
  }

  /**
   * キューから削除
   */
  removeFromQueue(index: number): void {
    if (index >= 0 && index < this.queue.length) {
      this.queue.splice(index, 1);
    }
  }

  /**
   * キューを置き換え
   */
  setQueue(tracks: Track[]): void {
    this.queue = [...tracks];
    if (this.playbackState.shuffleEnabled) {
      this.originalQueue = [...tracks];
      this.shuffleQueue();
    }
  }

  /**
   * 履歴をクリア
   */
  clearHistory(): void {
    this.history = [];
  }

  // ========== Getters ==========

  getCurrentTrack(): Track | null {
    return this.currentTrack;
  }

  getQueue(): Track[] {
    return [...this.queue];
  }

  getHistory(): Track[] {
    return [...this.history];
  }

  getPlaybackState(): PlaybackState {
    return { ...this.playbackState };
  }

  // ========== Listeners ==========

  onPlaybackChange(listener: PlaybackListener): () => void {
    this.playbackListeners.add(listener);
    return () => this.playbackListeners.delete(listener);
  }

  onTrackChange(listener: TrackChangeListener): () => void {
    this.trackChangeListeners.add(listener);
    return () => this.trackChangeListeners.delete(listener);
  }

  // ========== Private Methods ==========

  private async loadTrack(track: Track): Promise<void> {
    // Dedupe concurrent loads for the same track id
    if (this.loadPromises.has(track.id)) {
      return this.loadPromises.get(track.id)!;
    }

    // Prepare a load promise and store it so concurrent callers await the same work
    const loadPromise = (async () => {
      // Mark as current track early so UI can reflect selection
      this.currentTrack = track;
      this.notifyTrackChangeListeners();

      // Pause and clear source to avoid the previous audio resuming while we prepare
      try {
        this.audio.pause();
      } catch (e) {}
      this.audio.src = '';

      // Mark loading state
      this.playbackState.isLoading = true;
      this.notifyPlaybackListeners();

      try {
        // If it's a YouTube URL, fetch the audio stream URL first
        if (track.url.includes('youtube.com') || track.url.includes('youtu.be')) {
          const videoIdMatch = track.url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
          if (!videoIdMatch) {
            throw new Error('Invalid YouTube URL');
          }
          const videoId = videoIdMatch[1];
          console.log('🎵 Fetching audio stream for:', videoId);

          const result = await window.electronAPI?.music.getAudioUrl(videoId);
          if (!result?.success || !result.url) {
            throw new Error(result?.error || 'Failed to get audio URL');
          }

          console.log('✅ Got audio stream URL');

          // Set up audio element with stream URL from yt-dlp
          if (result.url.startsWith('file://')) {
            this.audio.crossOrigin = '';
          } else {
            this.audio.crossOrigin = 'anonymous';
          }
          this.audio.src = result.url;
        } else {
          // Local file or direct URL
          if (track.url.startsWith('file://')) {
            this.audio.crossOrigin = '';
          } else {
            this.audio.crossOrigin = 'anonymous';
          }
          this.audio.src = track.url;
        }

        // loadedmetadata will update duration; we keep going and let play() be called by caller
      } catch (error) {
        console.error('Failed to load track:', error);
        // On failure, clear currentTrack so UI doesn't show a stale selection
        this.currentTrack = null;
        this.notifyTrackChangeListeners();
        // Ensure audio src is cleared
        try {
          this.audio.pause();
        } catch (e) {}
        this.audio.src = '';
        throw error;
      } finally {
        // Clear loading flag
        this.playbackState.isLoading = false;
        this.notifyPlaybackListeners();
        // Remove promise from map
        this.loadPromises.delete(track.id);
      }
    })();

    this.loadPromises.set(track.id, loadPromise);
    return loadPromise;
  }

  private shuffleQueue(): void {
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
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
  }

  // ========== Event Handlers ==========

  private handlePlay = (): void => {
    this.playbackState.isPlaying = true;
    this.notifyPlaybackListeners();
  };

  private handlePause = (): void => {
    this.playbackState.isPlaying = false;
    this.notifyPlaybackListeners();
  };

  private handleEnded = async (): Promise<void> => {
    if (this.playbackState.repeatMode === 'one') {
      // Repeat current track
      this.audio.currentTime = 0;
      await this.audio.play();
    } else {
      // Play next track
      await this.next();
    }
  };

  private handleTimeUpdate = (): void => {
    this.playbackState.currentTime = this.audio.currentTime;
    this.notifyPlaybackListeners();
  };

  private handleVolumeChange = (): void => {
    this.playbackState.volume = this.audio.volume;
    this.playbackState.isMuted = this.audio.muted;
    this.notifyPlaybackListeners();
  };

  private handleLoadedMetadata = (): void => {
    this.playbackState.duration = this.audio.duration;
    if (this.currentTrack && !this.currentTrack.duration) {
      this.currentTrack.duration = this.audio.duration;
    }
    this.notifyPlaybackListeners();
  };

  private handleError = (error: Event): void => {
    console.error('Audio playback error:', error);
    this.playbackState.isPlaying = false;
    this.notifyPlaybackListeners();
  };

  // ========== Cleanup ==========

  destroy(): void {
    this.audio.pause();
    this.audio.removeEventListener('play', this.handlePlay);
    this.audio.removeEventListener('pause', this.handlePause);
    this.audio.removeEventListener('ended', this.handleEnded);
    this.audio.removeEventListener('timeupdate', this.handleTimeUpdate);
    this.audio.removeEventListener('volumechange', this.handleVolumeChange);
    this.audio.removeEventListener('loadedmetadata', this.handleLoadedMetadata);
    this.audio.removeEventListener('error', this.handleError);
    this.audio.src = '';
  }
}

// Singleton instance
export const audioService = new AudioService();

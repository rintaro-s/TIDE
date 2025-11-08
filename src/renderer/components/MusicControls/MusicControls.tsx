import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';
import './MusicControls.css';

const MusicControls: React.FC = () => {
  const { music, togglePlayPause, nextTrack, previousTrack, seekTo, setVolume } = useApp();
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const volumeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (volumeRef.current && !volumeRef.current.contains(event.target as Node)) {
        setShowVolumeSlider(false);
      }
    };

    if (showVolumeSlider) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVolumeSlider]);

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * music.playbackState.duration;
    seekTo(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const progressPercent =
    music.playbackState.duration > 0
      ? (music.playbackState.currentTime / music.playbackState.duration) * 100
      : 0;

  if (!music.currentTrack) {
    return (
      <div className="music-controls">
        <div className="music-idle">
          <span className="music-icon">🎵</span>
          <span className="music-text">No music playing</span>
        </div>
      </div>
    );
  }

  return (
    <div className="music-controls">
      {/* Previous Button */}
      <button
        className="music-btn"
        onClick={previousTrack}
        title="前の曲"
      >
        ⏮️
      </button>

      {/* Play/Pause Button */}
      <button
        className="music-btn play-pause"
        onClick={togglePlayPause}
        title={music.playbackState.isPlaying ? '一時停止' : '再生'}
      >
        {music.playbackState.isPlaying ? '⏸️' : '▶️'}
      </button>

      {/* Next Button */}
      <button
        className="music-btn"
        onClick={nextTrack}
        title="次の曲"
      >
        ⏭️
      </button>

      {/* Track Info */}
      <div className="track-info-mini">
        <div className="track-title-mini">{music.currentTrack.title}</div>
        {music.currentTrack.artist && (
          <div className="track-artist-mini">{music.currentTrack.artist}</div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="music-progress-container">
        <span className="time-label">{formatTime(music.playbackState.currentTime)}</span>
        <div
          className="music-progress-bar"
          onClick={handleProgressClick}
          title="シーク"
        >
          <div
            className="music-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="time-label">{formatTime(music.playbackState.duration)}</span>
      </div>

      {/* Volume Control */}
      <div className="volume-control" ref={volumeRef}>
        <button
          className="music-btn volume-btn"
          onClick={() => setShowVolumeSlider(!showVolumeSlider)}
          title="音量"
        >
          {music.playbackState.isMuted || music.playbackState.volume === 0
            ? '🔇'
            : music.playbackState.volume < 0.5
            ? '🔉'
            : '🔊'}
        </button>
        {showVolumeSlider && (
          <div className="volume-slider-container">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={music.playbackState.volume}
              onChange={handleVolumeChange}
              className="volume-slider"
              title={`音量: ${Math.round(music.playbackState.volume * 100)}%`}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicControls;

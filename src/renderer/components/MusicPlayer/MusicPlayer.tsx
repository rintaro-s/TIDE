import React, { useState, useEffect } from 'react';
import { simpleAudioService, Track } from '../../services/SimpleAudioService';
import './MusicPlayer.css';

interface SearchResult {
  id: string;
  title: string;
  duration?: number;
  thumbnail?: string;
  url?: string;
}

const MusicPlayer: React.FC = () => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Current track and playback
  const [currentTrackTitle, setCurrentTrackTitle] = useState('');
  const [currentTrackThumbnail, setCurrentTrackThumbnail] = useState('');
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState({
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    isLoading: false,
  });

  // Queue state
  const [queue, setQueue] = useState<Track[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'queue' | 'playlist'>('search');

  // Playlist import state
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [playlistLimit, setPlaylistLimit] = useState('20');
  const [isImportingPlaylist, setIsImportingPlaylist] = useState(false);
  const [playlistItems, setPlaylistItems] = useState<SearchResult[]>([]);

  // Subscribe to track changes
  useEffect(() => {
    // Restore state from storage when component mounts
    simpleAudioService.restoreState();
    
    const unsubscribe = simpleAudioService.onTrackChange((track) => {
      if (track) {
        setCurrentTrackTitle(track.title || 'Unknown');
        setCurrentTrackThumbnail(track.thumbnail || '');
      } else {
        setCurrentTrackTitle('');
        setCurrentTrackThumbnail('');
      }
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to playback changes
  useEffect(() => {
    const unsubscribe = simpleAudioService.onPlaybackChange((pbState) => {
      setState(pbState);
      setProgress((pbState.currentTime / pbState.duration) * 100 || 0);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to queue changes
  useEffect(() => {
    const unsubscribe = simpleAudioService.onQueueChange((q) => {
      setQueue(q);
    });
    return () => unsubscribe();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      console.warn('Search query is empty');
      return;
    }

    setIsSearching(true);
    try {
      const res = await window.electronAPI?.music.search(searchQuery, 10);
      if (res?.success && Array.isArray(res.items)) {
        setSearchResults(res.items);
        console.log('Search succeeded:', res.items.length, 'results');
      } else {
        console.error('Search failed:', res?.error);
        setSearchResults([]);
        // Show error without blocking alert
        setTimeout(() => {
          console.log('Search error:', res?.error || 'Unknown error');
        }, 100);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlayTrack = async (result: SearchResult) => {
    try {
      const track: Track = {
        id: result.id,
        title: result.title,
        duration: result.duration,
        thumbnail: result.thumbnail,
        url: result.url || `https://www.youtube.com/watch?v=${result.id}`,
      };
      
      // If already playing, add to queue; otherwise play immediately
      if (state.isPlaying) {
        // Already playing - add to queue without interrupting
        simpleAudioService.addToQueue(track);
        console.log('Added to queue:', track.title);
      } else {
        // Not playing - add to queue and play
        simpleAudioService.addToQueue(track);
        await simpleAudioService.play(track);
        console.log('Playing:', track.title);
      }
    } catch (error) {
      console.error('Play error:', error);
    }
  };

  const handleImportPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrl.trim()) {
      console.warn('Playlist URL is empty');
      return;
    }

    setIsImportingPlaylist(true);
    try {
      const limit = Math.min(Math.max(1, parseInt(playlistLimit) || 20), 200);
      const res = await window.electronAPI?.music.getPlaylist(playlistUrl, limit);
      if (res?.success && Array.isArray(res.items)) {
        setPlaylistItems(res.items);
        console.log('Playlist imported:', res.items.length, 'tracks');
      } else {
        console.error('Failed to import playlist:', res?.error);
        setPlaylistItems([]);
      }
    } catch (error) {
      console.error('Playlist import error:', error);
    } finally {
      setIsImportingPlaylist(false);
    }
  };

  const handleAddToQueue = (results: SearchResult[]) => {
    try {
      const tracks: Track[] = results.map(r => ({
        id: r.id,
        title: r.title,
        duration: r.duration,
        thumbnail: r.thumbnail,
        url: r.url || `https://www.youtube.com/watch?v=${r.id}`,
      }));
      simpleAudioService.addToQueue(tracks);
      console.log('Added to queue:', tracks.length, 'tracks');
    } catch (error) {
      console.error('Add to queue error:', error);
    }
  };

  const handleRemoveFromQueue = (index: number) => {
    simpleAudioService.removeFromQueue(index);
  };

  const handleNextTrack = async () => {
    await simpleAudioService.next();
  };

  const handlePreviousTrack = async () => {
    await simpleAudioService.previous();
  };

  const formatTime = (seconds?: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="music-player-container">
      {/* Now Playing Section */}
      <div className="now-playing">
        {currentTrackThumbnail ? (
          <img src={currentTrackThumbnail} alt={currentTrackTitle} className="now-playing-thumbnail" />
        ) : (
          <div className="now-playing-thumbnail" style={{ background: 'var(--bg-tertiary)' }} />
        )}
        <div className="now-playing-info">
          <div className="now-playing-title">{currentTrackTitle || 'No track playing'}</div>
          <div className="playback-controls">
            <button
              className="btn-control"
              onClick={handlePreviousTrack}
              disabled={state.isLoading || queue.length === 0}
              title="前の曲"
            >
              Previous
            </button>
            <button
              className="btn-control"
              onClick={() => simpleAudioService.togglePlayPause()}
              disabled={state.isLoading}
              title={state.isPlaying ? 'Pause' : 'Play'}
            >
              {state.isLoading ? 'Loading...' : state.isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              className="btn-control"
              onClick={handleNextTrack}
              disabled={state.isLoading || queue.length === 0}
              title="次の曲"
            >
              Next
            </button>
          </div>
          {/* Progress bar */}
          <div className="progress-bar-container">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => {
                const newTime = (Number(e.target.value) / 100) * (state.duration || 0);
                simpleAudioService.seek(newTime);
              }}
              className="progress-bar"
              disabled={!currentTrackTitle}
            />
            <div className="time-display">
              <span>{formatTime(state.currentTime)}</span>
              <span>{formatTime(state.duration)}</span>
            </div>
          </div>
          {state.isLoading && <div className="loading-text">読み込み中...</div>}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          Search
        </button>
        <button
          className={`tab-button ${activeTab === 'queue' ? 'active' : ''}`}
          onClick={() => setActiveTab('queue')}
        >
          Queue ({queue.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'playlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('playlist')}
        >
          Playlist
        </button>
      </div>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <>
          <div className="search-section">
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                className="search-input"
                placeholder="曲名またはアーティスト名を入力..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isSearching}
                autoComplete="off"
                autoFocus
              />
              <button type="submit" className="btn-search" disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </form>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="search-results">
              <div className="results-header">
                Results ({searchResults.length})
                <button 
                  className="btn-add-all"
                  onClick={() => handleAddToQueue(searchResults)}
                >
                  Add All to Queue
                </button>
              </div>
              <div className="results-list">
                {searchResults.map((result) => (
                  <div key={result.id} className="result-item">
                    {result.thumbnail ? (
                      <img src={result.thumbnail} alt={result.title} className="result-thumbnail" />
                    ) : (
                      <div className="result-thumbnail" style={{ background: 'var(--bg-tertiary)' }} />
                    )}
                    <div className="result-info">
                      <div className="result-title">{result.title}</div>
                      {result.duration && (
                        <div className="result-duration">{formatTime(result.duration)}</div>
                      )}
                    </div>
                    <button
                      className="btn-play"
                      onClick={() => handlePlayTrack(result)}
                      disabled={state.isLoading}
                      title="Play"
                    >
                      Play
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchQuery && !isSearching && searchResults.length === 0 && (
            <div className="empty-state">
              <p>No results found</p>
            </div>
          )}

          {!searchQuery && (
            <div className="empty-state">
              <p>Search for music to get started</p>
            </div>
          )}
        </>
      )}

      {/* Queue Tab */}
      {activeTab === 'queue' && (
        <div className="queue-section">
          {queue.length > 0 ? (
            <>
              <div className="queue-header">Queue ({queue.length})</div>
              <div className="queue-list">
                {queue.map((track, index) => (
                  <div key={`${track.id}-${index}`} className="queue-item">
                    {track.thumbnail ? (
                      <img src={track.thumbnail} alt={track.title} className="queue-thumbnail" />
                    ) : (
                      <div className="queue-thumbnail" style={{ background: 'var(--bg-tertiary)' }} />
                    )}
                    <div className="queue-info">
                      <div className="queue-title">{track.title}</div>
                      {track.duration && (
                        <div className="queue-duration">{formatTime(track.duration)}</div>
                      )}
                    </div>
                    <div className="queue-actions">
                      <button
                        className="btn-queue-play"
                        onClick={() => simpleAudioService.play(track)}
                        title="Play"
                      >
                        Play
                      </button>
                      <button
                        className="btn-queue-remove"
                        onClick={() => handleRemoveFromQueue(index)}
                        title="Remove"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>Queue is empty</p>
              <p className="hint">Add tracks from search results</p>
            </div>
          )}
        </div>
      )}

      {/* Playlist Tab */}
      {activeTab === 'playlist' && (
        <div className="playlist-section">
          <form onSubmit={handleImportPlaylist} className="playlist-form">
            <input
              type="url"
              className="playlist-input"
              placeholder="YouTube Playlist URL..."
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              disabled={isImportingPlaylist}
              autoComplete="off"
              autoFocus
            />
            <div className="playlist-controls">
              <input
                type="number"
                className="playlist-limit"
                min="1"
                max="200"
                value={playlistLimit}
                onChange={(e) => setPlaylistLimit(e.target.value)}
                disabled={isImportingPlaylist}
                title="Max tracks to import"
              />
              <button type="submit" className="btn-import" disabled={isImportingPlaylist}>
                {isImportingPlaylist ? 'Importing...' : 'Import'}
              </button>
            </div>
          </form>

          {playlistItems.length > 0 && (
            <div className="playlist-results">
              <div className="results-header">
                Results ({playlistItems.length})
                <button 
                  className="btn-add-all"
                  onClick={() => handleAddToQueue(playlistItems)}
                >
                  Add All to Queue
                </button>
              </div>
              <div className="results-list">
                {playlistItems.map((item) => (
                  <div key={item.id} className="result-item">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} className="result-thumbnail" />
                    ) : (
                      <div className="result-thumbnail" style={{ background: 'var(--bg-tertiary)' }} />
                    )}
                    <div className="result-info">
                      <div className="result-title">{item.title}</div>
                      {item.duration && (
                        <div className="result-duration">{formatTime(item.duration)}</div>
                      )}
                    </div>
                    <button
                      className="btn-play"
                      onClick={() => handlePlayTrack(item)}
                      disabled={state.isLoading}
                      title="Play"
                    >
                      Play
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!playlistItems.length && (
            <div className="empty-state">
              <p>Import a playlist to get started</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;


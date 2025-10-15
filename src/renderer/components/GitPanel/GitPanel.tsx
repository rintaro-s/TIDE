import React, { useState, useEffect } from 'react';
import './GitPanel.css';

interface GitStatus {
  branch: string;
  staged: string[];
  modified: string[];
  untracked: string[];
  ahead: number;
  behind: number;
}

const GitPanel: React.FC = () => {
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');

  const refreshGitStatus = async () => {
    setIsLoading(true);
    try {
      const result = await window.electronAPI.process.exec('git', ['status', '--porcelain', '--branch'], { cwd: process.cwd() });
      if (result.exitCode === 0) {
        // Parse git status output
        const lines = result.stdout.split('\n').filter(line => line.trim());
        const branchLine = lines.find(line => line.startsWith('##'));
        const branch = branchLine ? branchLine.replace('##', '').split('...')[0].trim() : 'main';
        
        const staged: string[] = [];
        const modified: string[] = [];
        const untracked: string[] = [];
        
        lines.forEach(line => {
          if (line.startsWith('??')) {
            untracked.push(line.substring(3));
          } else if (line.startsWith('M ')) {
            staged.push(line.substring(3));
          } else if (line.startsWith(' M')) {
            modified.push(line.substring(3));
          } else if (line.startsWith('A ')) {
            staged.push(line.substring(3));
          }
        });

        setGitStatus({
          branch,
          staged,
          modified,
          untracked,
          ahead: 0,
          behind: 0
        });
      }
    } catch (error) {
      console.error('Git status error:', error);
      setGitStatus(null);
    }
    setIsLoading(false);
  };

  const handleStageFile = async (file: string) => {
    try {
      await window.electronAPI.process.exec('git', ['add', file], { cwd: process.cwd() });
      refreshGitStatus();
    } catch (error) {
      console.error('Git add error:', error);
    }
  };

  const handleUnstageFile = async (file: string) => {
    try {
      await window.electronAPI.process.exec('git', ['reset', 'HEAD', file], { cwd: process.cwd() });
      refreshGitStatus();
    } catch (error) {
      console.error('Git reset error:', error);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;
    
    try {
      await window.electronAPI.process.exec('git', ['commit', '-m', commitMessage], { cwd: process.cwd() });
      setCommitMessage('');
      refreshGitStatus();
    } catch (error) {
      console.error('Git commit error:', error);
    }
  };

  const handlePush = async () => {
    try {
      await window.electronAPI.process.exec('git', ['push'], { cwd: process.cwd() });
      refreshGitStatus();
    } catch (error) {
      console.error('Git push error:', error);
    }
  };

  const handlePull = async () => {
    try {
      await window.electronAPI.process.exec('git', ['pull'], { cwd: process.cwd() });
      refreshGitStatus();
    } catch (error) {
      console.error('Git pull error:', error);
    }
  };

  useEffect(() => {
    refreshGitStatus();
  }, []);

  if (isLoading) {
    return <div className="git-panel loading">Loading Git status...</div>;
  }

  if (!gitStatus) {
    return (
      <div className="git-panel no-git">
        <p>No Git repository detected</p>
        <button className="git-init-btn" onClick={async () => {
          try {
            await window.electronAPI.process.exec('git', ['init'], { cwd: process.cwd() });
            refreshGitStatus();
          } catch (error) {
            console.error('Git init error:', error);
          }
        }}>
          Initialize Repository
        </button>
      </div>
    );
  }

  return (
    <div className="git-panel">
      <div className="git-header">
        <div className="git-branch">
          <span className="branch-icon">🌿</span>
          <span className="branch-name">{gitStatus.branch}</span>
        </div>
        <div className="git-actions">
          <button className="git-btn" onClick={handlePull} title="Pull">⬇️</button>
          <button className="git-btn" onClick={handlePush} title="Push">⬆️</button>
          <button className="git-btn" onClick={refreshGitStatus} title="Refresh">🔄</button>
        </div>
      </div>

      {gitStatus.staged.length > 0 && (
        <div className="git-section">
          <h4>Staged Changes</h4>
          {gitStatus.staged.map(file => (
            <div key={file} className="git-file staged">
              <span className="file-name">{file}</span>
              <button className="unstage-btn" onClick={() => handleUnstageFile(file)}>-</button>
            </div>
          ))}
        </div>
      )}

      {gitStatus.modified.length > 0 && (
        <div className="git-section">
          <h4>Modified</h4>
          {gitStatus.modified.map(file => (
            <div key={file} className="git-file modified">
              <span className="file-name">{file}</span>
              <button className="stage-btn" onClick={() => handleStageFile(file)}>+</button>
            </div>
          ))}
        </div>
      )}

      {gitStatus.untracked.length > 0 && (
        <div className="git-section">
          <h4>Untracked</h4>
          {gitStatus.untracked.map(file => (
            <div key={file} className="git-file untracked">
              <span className="file-name">{file}</span>
              <button className="stage-btn" onClick={() => handleStageFile(file)}>+</button>
            </div>
          ))}
        </div>
      )}

      {gitStatus.staged.length > 0 && (
        <div className="commit-section">
          <textarea
            className="commit-message"
            placeholder="Commit message..."
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            rows={3}
          />
          <button 
            className="commit-btn"
            onClick={handleCommit}
            disabled={!commitMessage.trim()}
          >
            Commit
          </button>
        </div>
      )}
    </div>
  );
};

export default GitPanel;
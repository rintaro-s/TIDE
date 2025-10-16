import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { logger, toast } from '../../utils/logger';
import './GitPanel.css';

interface GitStatus {
  isRepo: boolean;
  branch: string;
  ahead: number;
  behind: number;
  changes: GitChange[];
  staged: GitChange[];
  commits: GitCommit[];
}

interface GitChange {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked';
  staged: boolean;
}

interface GitCommit {
  hash: string;
  author: string;
  date: string;
  message: string;
}

const GitPanel: React.FC = () => {
  const { state } = useApp();
  const [gitStatus, setGitStatus] = useState<GitStatus>({
    isRepo: false,
    branch: 'main',
    ahead: 0,
    behind: 0,
    changes: [],
    staged: [],
    commits: []
  });
  const [commitMessage, setCommitMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCommitHistory, setShowCommitHistory] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [showRemoteDialog, setShowRemoteDialog] = useState(false);

  useEffect(() => {
    if (state.currentProject?.path) {
      loadGitStatus();
    }
  }, [state.currentProject]);

  const executeGitCommand = async (args: string[]): Promise<string> => {
    try {
      const result = await window.electronAPI.process.exec('git', args, {
        cwd: state.currentProject?.path || ''
      });
      
      if (result.exitCode !== 0 && result.stderr) {
        throw new Error(result.stderr);
      }
      
      return result.stdout;
    } catch (error) {
      logger.error('Git command failed', { args, error });
      throw error;
    }
  };

  const loadGitStatus = async () => {
    if (!state.currentProject?.path) return;

    setLoading(true);
    try {
      // Check if it's a git repo
      try {
        await executeGitCommand(['rev-parse', '--git-dir']);
      } catch {
        setGitStatus({ ...gitStatus, isRepo: false });
        setLoading(false);
        return;
      }

      // Get current branch
      const branch = (await executeGitCommand(['rev-parse', '--abbrev-ref', 'HEAD'])).trim();

      // Get status
      const statusOutput = await executeGitCommand(['status', '--porcelain']);
      const changes: GitChange[] = [];
      const staged: GitChange[] = [];

      statusOutput.split('\n').filter(line => line.trim()).forEach(line => {
        const status = line.substring(0, 2);
        const path = line.substring(3);
        
        let changeStatus: GitChange['status'] = 'modified';
        if (status.includes('A')) changeStatus = 'added';
        else if (status.includes('D')) changeStatus = 'deleted';
        else if (status.includes('??')) changeStatus = 'untracked';

        const change: GitChange = {
          path,
          status: changeStatus,
          staged: status[0] !== ' ' && status[0] !== '?'
        };

        if (change.staged) {
          staged.push(change);
        } else {
          changes.push(change);
        }
      });

      // Get commit count ahead/behind
      let ahead = 0;
      let behind = 0;
      try {
        const aheadBehind = await executeGitCommand(['rev-list', '--left-right', '--count', 'HEAD...@{u}']);
        const parts = aheadBehind.trim().split('\t');
        ahead = parseInt(parts[0]) || 0;
        behind = parseInt(parts[1]) || 0;
      } catch {
        // No remote tracking branch
      }

      // Get recent commits
      const logOutput = await executeGitCommand(['log', '--pretty=format:%H|%an|%ad|%s', '--date=short', '-10']);
      const commits: GitCommit[] = logOutput.split('\n').filter(line => line.trim()).map(line => {
        const [hash, author, date, message] = line.split('|');
        return { hash, author, date, message };
      });

      setGitStatus({
        isRepo: true,
        branch,
        ahead,
        behind,
        changes,
        staged,
        commits
      });

      logger.info('Git status loaded', { branch, changes: changes.length, staged: staged.length });
    } catch (error) {
      logger.error('Failed to load git status', { error });
      toast.error('Git status読み込みエラー', String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleInitRepo = async () => {
    if (!state.currentProject?.path) return;

    setLoading(true);
    try {
      await executeGitCommand(['init']);
      await executeGitCommand(['config', 'user.name', 'TOVA IDE User']);
      await executeGitCommand(['config', 'user.email', 'user@tova-ide.local']);
      
      logger.success('Git repository initialized');
      toast.success('Gitリポジトリを初期化しました', state.currentProject.path);
      
      await loadGitStatus();
    } catch (error) {
      logger.error('Failed to initialize git', { error });
      toast.error('Git初期化エラー', String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleStageFile = async (path: string) => {
    setLoading(true);
    try {
      await executeGitCommand(['add', path]);
      logger.info(`File staged: ${path}`);
      await loadGitStatus();
    } catch (error) {
      logger.error('Failed to stage file', { path, error });
      toast.error('ステージングエラー', String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleUnstageFile = async (path: string) => {
    setLoading(true);
    try {
      await executeGitCommand(['reset', 'HEAD', path]);
      logger.info(`File unstaged: ${path}`);
      await loadGitStatus();
    } catch (error) {
      logger.error('Failed to unstage file', { path, error });
      toast.error('アンステージエラー', String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleStageAll = async () => {
    setLoading(true);
    try {
      await executeGitCommand(['add', '-A']);
      logger.info('All files staged');
      toast.success('すべての変更をステージしました');
      await loadGitStatus();
    } catch (error) {
      logger.error('Failed to stage all', { error });
      toast.error('ステージングエラー', String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleUnstageAll = async () => {
    setLoading(true);
    try {
      await executeGitCommand(['reset', 'HEAD']);
      logger.info('All files unstaged');
      toast.success('すべての変更をアンステージしました');
      await loadGitStatus();
    } catch (error) {
      logger.error('Failed to unstage all', { error });
      toast.error('アンステージエラー', String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      toast.warning('コミットメッセージを入力してください');
      return;
    }

    if (gitStatus.staged.length === 0) {
      toast.warning('ステージされた変更がありません');
      return;
    }

    setLoading(true);
    try {
      await executeGitCommand(['commit', '-m', commitMessage]);
      logger.success(`Committed: ${commitMessage}`);
      toast.success('コミットしました', commitMessage);
      setCommitMessage('');
      await loadGitStatus();
    } catch (error) {
      logger.error('Failed to commit', { error });
      toast.error('コミットエラー', String(error));
    } finally {
      setLoading(false);
    }
  };

  const handlePush = async () => {
    setLoading(true);
    try {
      const output = await executeGitCommand(['push']);
      logger.success('Pushed to remote');
      toast.success('リモートにプッシュしました', output);
      await loadGitStatus();
    } catch (error) {
      logger.error('Failed to push', { error });
      toast.error('プッシュエラー', String(error));
    } finally {
      setLoading(false);
    }
  };

  const handlePull = async () => {
    setLoading(true);
    try {
      const output = await executeGitCommand(['pull']);
      logger.success('Pulled from remote');
      toast.success('リモートからプルしました', output);
      await loadGitStatus();
    } catch (error) {
      logger.error('Failed to pull', { error });
      toast.error('プルエラー', String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleAddRemote = async () => {
    if (!remoteUrl.trim()) {
      toast.warning('リモートURLを入力してください');
      return;
    }

    setLoading(true);
    try {
      // Remove existing origin if exists
      try {
        await executeGitCommand(['remote', 'remove', 'origin']);
      } catch {
        // Ignore if origin doesn't exist
      }

      await executeGitCommand(['remote', 'add', 'origin', remoteUrl]);
      logger.success(`Remote added: ${remoteUrl}`);
      toast.success('リモートを追加しました', remoteUrl);
      setShowRemoteDialog(false);
      setRemoteUrl('');
    } catch (error) {
      logger.error('Failed to add remote', { error });
      toast.error('リモート追加エラー', String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleViewDiff = async (path: string) => {
    try {
      const diff = await executeGitCommand(['diff', 'HEAD', path]);
      logger.info(`Diff for ${path}:\n${diff}`);
      toast.info('差分表示', `${path}の差分をコンソールに出力しました`);
    } catch (error) {
      logger.error('Failed to get diff', { path, error });
      toast.error('差分取得エラー', String(error));
    }
  };

  const getStatusIcon = (status: GitChange['status']) => {
    switch (status) {
      case 'modified': return '✏️';
      case 'added': return '➕';
      case 'deleted': return '🗑️';
      case 'untracked': return '❓';
      default: return '📄';
    }
  };

  const getStatusColor = (status: GitChange['status']) => {
    switch (status) {
      case 'modified': return '#FFA500';
      case 'added': return '#00FF00';
      case 'deleted': return '#FF0000';
      case 'untracked': return '#888888';
      default: return '#FFFFFF';
    }
  };

  if (!gitStatus.isRepo) {
    return (
      <div className="git-panel">
        <div className="git-header">
          <h3>🔧 Git</h3>
        </div>
        <div className="git-init-container">
          <div className="git-init-message">
            <p>このプロジェクトはGitリポジトリではありません</p>
            <button 
              onClick={handleInitRepo} 
              className="btn primary"
              disabled={loading}
            >
              {loading ? '初期化中...' : '📦 Gitリポジトリを初期化'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="git-panel">
      <div className="git-header">
        <h3>🔧 Git</h3>
        <button onClick={loadGitStatus} className="refresh-btn" disabled={loading}>
          🔄
        </button>
      </div>

      <div className="git-branch-info">
        <div className="branch-name">
          <span className="branch-icon">🌿</span>
          <strong>{gitStatus.branch}</strong>
        </div>
        {(gitStatus.ahead > 0 || gitStatus.behind > 0) && (
          <div className="sync-status">
            {gitStatus.ahead > 0 && <span className="ahead">↑{gitStatus.ahead}</span>}
            {gitStatus.behind > 0 && <span className="behind">↓{gitStatus.behind}</span>}
          </div>
        )}
      </div>

      <div className="git-actions">
        <button onClick={handlePull} className="btn secondary" disabled={loading}>
          ⬇️ Pull
        </button>
        <button onClick={handlePush} className="btn secondary" disabled={loading}>
          ⬆️ Push
        </button>
        <button onClick={() => setShowRemoteDialog(true)} className="btn secondary">
          🔗 Remote
        </button>
        <button onClick={() => setShowCommitHistory(!showCommitHistory)} className="btn secondary">
          � History
        </button>
      </div>

      {showCommitHistory && (
        <div className="commit-history">
          <h4>コミット履歴</h4>
          <div className="commit-list">
            {gitStatus.commits.map(commit => (
              <div key={commit.hash} className="commit-item">
                <div className="commit-hash">{commit.hash.substring(0, 7)}</div>
                <div className="commit-info">
                  <div className="commit-message">{commit.message}</div>
                  <div className="commit-meta">
                    <span className="commit-author">{commit.author}</span>
                    <span className="commit-date">{commit.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="git-staging">
        <div className="staging-section">
          <div className="section-header">
            <h4>📝 変更 ({gitStatus.changes.length})</h4>
            {gitStatus.changes.length > 0 && (
              <button onClick={handleStageAll} className="stage-all-btn">
                すべてステージ
              </button>
            )}
          </div>
          <div className="file-list">
            {gitStatus.changes.map(change => (
              <div key={change.path} className="file-item">
                <span className="file-status" style={{ color: getStatusColor(change.status) }}>
                  {getStatusIcon(change.status)}
                </span>
                <span className="file-path" title={change.path}>
                  {change.path}
                </span>
                <div className="file-actions">
                  <button 
                    onClick={() => handleViewDiff(change.path)}
                    className="action-btn"
                    title="差分を表示"
                  >
                    👁️
                  </button>
                  <button 
                    onClick={() => handleStageFile(change.path)}
                    className="action-btn"
                    title="ステージ"
                  >
                    ➕
                  </button>
                </div>
              </div>
            ))}
            {gitStatus.changes.length === 0 && (
              <div className="empty-state">変更なし</div>
            )}
          </div>
        </div>

        <div className="staging-section">
          <div className="section-header">
            <h4>✅ ステージ済み ({gitStatus.staged.length})</h4>
            {gitStatus.staged.length > 0 && (
              <button onClick={handleUnstageAll} className="unstage-all-btn">
                すべてアンステージ
              </button>
            )}
          </div>
          <div className="file-list">
            {gitStatus.staged.map(change => (
              <div key={change.path} className="file-item staged">
                <span className="file-status" style={{ color: getStatusColor(change.status) }}>
                  {getStatusIcon(change.status)}
                </span>
                <span className="file-path" title={change.path}>
                  {change.path}
                </span>
                <div className="file-actions">
                  <button 
                    onClick={() => handleViewDiff(change.path)}
                    className="action-btn"
                    title="差分を表示"
                  >
                    👁️
                  </button>
                  <button 
                    onClick={() => handleUnstageFile(change.path)}
                    className="action-btn"
                    title="アンステージ"
                  >
                    ➖
                  </button>
                </div>
              </div>
            ))}
            {gitStatus.staged.length === 0 && (
              <div className="empty-state">ステージされた変更なし</div>
            )}
          </div>
        </div>
      </div>

      <div className="git-commit">
        <textarea
          placeholder="コミットメッセージを入力..."
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          rows={3}
          disabled={loading}
        />
        <button 
          onClick={handleCommit} 
          className="btn primary commit-btn"
          disabled={loading || gitStatus.staged.length === 0 || !commitMessage.trim()}
        >
          💾 コミット
        </button>
      </div>

      {showRemoteDialog && (
        <div className="modal-overlay" onClick={() => setShowRemoteDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>リモートリポジトリの設定</h3>
            <div className="form-group">
              <label>リモートURL (origin)</label>
              <input
                type="text"
                value={remoteUrl}
                onChange={(e) => setRemoteUrl(e.target.value)}
                placeholder="https://github.com/user/repo.git"
              />
            </div>
            <div className="modal-actions">
              <button onClick={handleAddRemote} className="btn primary" disabled={loading}>
                追加
              </button>
              <button onClick={() => setShowRemoteDialog(false)} className="btn secondary">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitPanel;
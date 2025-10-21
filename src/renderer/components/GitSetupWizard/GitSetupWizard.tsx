import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import './GitSetupWizard.css';

interface GitConfig {
  globalGit: boolean;
  userName: string;
  userEmail: string;
  githubToken: string;
  useGitHubLogin: boolean;
}

const GitSetupWizard: React.FC<{ onComplete: (config: GitConfig) => void }> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<'mode' | 'user' | 'github' | 'confirm' | 'skip'>('mode');
  const [config, setConfig] = useState<GitConfig>({
    globalGit: true,
    userName: '',
    userEmail: '',
    githubToken: '',
    useGitHubLogin: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [oauthUrl, setOauthUrl] = useState('');
  const [showOAuthFlow, setShowOAuthFlow] = useState(false);
  const [tokenVerified, setTokenVerified] = useState(false);

  const handleModeSelect = (useGlobal: boolean) => {
    // Always use global config now
    setConfig({ ...config, globalGit: true });
    setCurrentStep('user');
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      // Mark as skipped in store
      await window.electronAPI?.store.set('gitConfigured', true);
      await window.electronAPI?.store.set('gitSkipped', true);
      
      // Still complete with empty config
      onComplete({
        globalGit: false,
        userName: '',
        userEmail: '',
        githubToken: '',
        useGitHubLogin: false
      });
    } catch (error) {
      console.error('Failed to skip git setup:', error);
      setError('スキップに失敗しました');
      setLoading(false);
    }
  };

  const handleUserInfo = async () => {
    if (!config.userName.trim() || !config.userEmail.trim()) {
      setError('ユーザー名とメールアドレスを入力してください');
      return;
    }
    setError('');
    setCurrentStep('github');
  };

  const handleGitHubToggle = () => {
    setConfig({ ...config, useGitHubLogin: !config.useGitHubLogin });
    if (!config.useGitHubLogin) {
      setCurrentStep('confirm');
    }
  };

  const handleManualTokenInput = async () => {
    if (!config.githubToken.trim()) {
      setError('GitHubトークンを入力してください');
      return;
    }
    
    // Validate token format
    if (!config.githubToken.startsWith('ghp_') && !config.githubToken.startsWith('github_pat_')) {
      setError('無効なトークン形式です。GitHub Personal Access Token (ghp_ または github_pat_ で始まる) を入力してください');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Verify token by testing API call
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${config.githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `認証失敗 (HTTP ${response.status})`);
      }

      const userData = await response.json();
      console.log('GitHub user verified:', userData.login);
      
      // Update config with user info
      setConfig(prev => ({
        ...prev,
        userName: userData.name || userData.login || prev.userName,
        userEmail: userData.email || prev.userEmail
      }));

      setTokenVerified(true);
      setError('');
      
      // Show success message
      alert(`✅ GitHub認証成功！\nユーザー: ${userData.login}\n名前: ${userData.name || 'N/A'}`);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setError(`トークン検証失敗: ${errorMsg}`);
      console.error('Token verification error:', error);
      setTokenVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // Apply git configuration using git config command via IPC
      const configArgs = [
        'config',
        config.globalGit ? '--global' : '--local',
        'user.name',
        config.userName
      ];

      const emailArgs = [
        'config',
        config.globalGit ? '--global' : '--local',
        'user.email',
        config.userEmail
      ];

      console.log('Executing git config command:', configArgs.join(' '));
      
      // Use IPC to execute git commands in main process
      const result1 = await window.electronAPI?.process.exec('git', configArgs);

      console.log('Git config name result:', result1);

      if (result1?.exitCode !== 0) {
        throw new Error(`Git名前設定失敗: ${result1?.stderr || 'Unknown error'}`);
      }

      const result2 = await window.electronAPI?.process.exec('git', emailArgs);

      console.log('Git config email result:', result2);

      if (result2?.exitCode !== 0) {
        throw new Error(`Gitメール設定失敗: ${result2?.stderr || 'Unknown error'}`);
      }

      if (config.useGitHubLogin && config.githubToken && tokenVerified) {
        // Configure git credential helper to store token
        const credentialHelperArgs = [
          'config',
          config.globalGit ? '--global' : '--local',
          'credential.helper',
          'store'
        ];
        
        const credResult = await window.electronAPI?.process.exec('git', credentialHelperArgs);
        console.log('Git credential helper config result:', credResult);
        
        if (credResult?.exitCode !== 0) {
          console.warn('Failed to set credential helper:', credResult?.stderr);
        }
        
        // Store GitHub token securely in electron store
        await window.electronAPI?.store.set('githubToken', config.githubToken);
        await window.electronAPI?.store.set('githubTokenVerified', tokenVerified);
        
        // Configure git to use token for HTTPS
        const githubCredentialArgs = [
          'config',
          config.globalGit ? '--global' : '--local',
          'credential.https://github.com.helper',
          'store'
        ];
        
        await window.electronAPI?.process.exec('git', githubCredentialArgs);
        
        console.log('✅ GitHub認証情報が設定されました');
      }

      // Store git config in store
      await window.electronAPI?.store.set('gitConfigured', true);
      await window.electronAPI?.store.set('gitConfig', {
        globalGit: config.globalGit,
        userName: config.userName,
        userEmail: config.userEmail,
        useGitHubLogin: config.useGitHubLogin
      });

      onComplete(config);
    } catch (error) {
      console.error('Git config error:', error);
      setError(`設定に失敗しました: ${error}`);
      setLoading(false);
    }
  };

  return (
    <div className="git-setup-wizard">
      <div className="wizard-container">
        <div className="wizard-header">
          <h1>Git設定ウィザード</h1>
          <p>TOVA IDEを使用するにはGit設定が必須です</p>
        </div>

        <div className="wizard-content">
          {currentStep === 'mode' && (
            <div className="wizard-step mode-selection">
              <h2>Git初期設定</h2>
              <p>グローバル Git 設定をセットアップします</p>
              
              <div className="mode-info-box">
                <div className="info-item">
                  <div className="info-icon">✓</div>
                  <div className="info-text">
                    <div className="info-title">グローバル設定</div>
                    <div className="info-desc">システム全体で使用される Git 設定です</div>
                  </div>
                </div>
              </div>

              <div className="wizard-actions">
                <button 
                  className="btn-next"
                  onClick={() => handleModeSelect(true)}
                >
                  次へ進む
                </button>
                <button 
                  className="btn-skip"
                  onClick={handleSkip}
                  disabled={loading}
                >
                  スキップ（Git未使用）
                </button>
              </div>
            </div>
          )}

          {currentStep === 'user' && (
            <div className="wizard-step user-info">
              <h2>ユーザー情報を入力</h2>
              <p>Git設定に使用するユーザー情報</p>

              <div className="form-group">
                <label htmlFor="userName">ユーザー名</label>
                <input
                  id="userName"
                  type="text"
                  placeholder="例: John Doe"
                  value={config.userName}
                  onChange={(e) => setConfig({ ...config, userName: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="userEmail">メールアドレス</label>
                <input
                  id="userEmail"
                  type="email"
                  placeholder="例: john@example.com"
                  value={config.userEmail}
                  onChange={(e) => setConfig({ ...config, userEmail: e.target.value })}
                  className="form-input"
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button 
                className="btn-next"
                onClick={handleUserInfo}
                disabled={loading}
              >
                次へ
              </button>
            </div>
          )}

          {currentStep === 'github' && (
            <div className="wizard-step github-setup">
              <h2>GitHub統合（オプション）</h2>
              <p>GitHubアカウントと連携しますか？</p>

              <div className="github-options">
                <button 
                  className={`github-toggle-btn ${!config.useGitHubLogin ? 'active' : ''}`}
                  onClick={() => {
                    setConfig({ ...config, useGitHubLogin: false });
                    setTokenVerified(false);
                    setShowOAuthFlow(false);
                  }}
                >
                  <span className="toggle-label">スキップ</span>
                  <span className="toggle-desc">GitHub統合なし</span>
                </button>

                <button 
                  className={`github-toggle-btn ${config.useGitHubLogin ? 'active' : ''}`}
                  onClick={() => setConfig({ ...config, useGitHubLogin: true })}
                >
                  <span className="toggle-label">GitHub連携</span>
                  <span className="toggle-desc">トークン入力で連携</span>
                </button>
              </div>

              {config.useGitHubLogin && (
                <div className="github-auth-options">
                  <div className="token-input-section">
                    <div className="info-box">
                      <h4>📝 Personal Access Token (PAT) の取得方法</h4>
                      <ol>
                        <li>GitHub.com にログイン</li>
                        <li>Settings → Developer settings → Personal access tokens → Tokens (classic)</li>
                        <li>"Generate new token (classic)" をクリック</li>
                        <li>Note: "TOVA IDE" などの名前を入力</li>
                        <li>Expiration: お好みの期限を選択（推奨: 90 days以上）</li>
                        <li>Scopes: <code>repo</code>, <code>user</code>, <code>gist</code> を選択</li>
                        <li>"Generate token" をクリック</li>
                        <li>表示されたトークン（ghp_ で始まる文字列）をコピー</li>
                      </ol>
                      <button 
                        className="open-github-btn"
                        onClick={() => window.open('https://github.com/settings/tokens/new', '_blank')}
                      >
                        🔗 GitHub Token生成ページを開く
                      </button>
                    </div>
                    
                    <div className="token-input-form">
                      <label htmlFor="github-token">GitHub Personal Access Token</label>
                      <div className="token-input-wrapper">
                        <input
                          id="github-token"
                          type="password"
                          value={config.githubToken}
                          onChange={(e) => setConfig({ ...config, githubToken: e.target.value })}
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          disabled={loading || tokenVerified}
                        />
                        <button
                          onClick={handleManualTokenInput}
                          disabled={loading || !config.githubToken.trim() || tokenVerified}
                          className="verify-btn"
                        >
                          {loading ? '検証中...' : tokenVerified ? '✓ 検証済み' : '検証'}
                        </button>
                      </div>
                      {tokenVerified && (
                        <div className="success-message">
                          ✅ トークンが正常に検証されました
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {error && <div className="error-message">{error}</div>}

              <div className="wizard-actions">
                <button 
                  className="btn-back"
                  onClick={() => setCurrentStep('user')}
                  disabled={loading}
                >
                  戻る
                </button>
                <button 
                  className="btn-next"
                  onClick={() => setCurrentStep('confirm')}
                  disabled={loading || (config.useGitHubLogin && !tokenVerified)}
                >
                  次へ
                </button>
              </div>
            </div>
          )}

          {currentStep === 'confirm' && (
            <div className="wizard-step confirm">
              <h2>設定確認</h2>
              <p>以下の内容で Git を設定します</p>

              <div className="confirm-section">
                <div className="confirm-item">
                  <span className="label">設定範囲:</span>
                  <span className="value">グローバル</span>
                </div>
                <div className="confirm-item">
                  <span className="label">ユーザー名:</span>
                  <span className="value">{config.userName}</span>
                </div>
                <div className="confirm-item">
                  <span className="label">メールアドレス:</span>
                  <span className="value">{config.userEmail}</span>
                </div>
                {config.useGitHubLogin && tokenVerified && (
                  <div className="confirm-item">
                    <span className="label">GitHub連携:</span>
                    <span className="value">有効</span>
                  </div>
                )}
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="wizard-actions">
                <button 
                  className="btn-back"
                  onClick={() => setCurrentStep('github')}
                  disabled={loading}
                >
                  戻る
                </button>
                <button 
                  className="btn-confirm"
                  onClick={handleConfirm}
                  disabled={loading}
                >
                  {loading ? '適用中...' : '設定を適用'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="wizard-footer">
          <div className="step-indicator">
            {['mode', 'user', 'github', 'confirm'].map((step, index) => (
              <div 
                key={step}
                className={`step-dot ${currentStep === step ? 'active' : ''} ${
                  ['mode', 'user', 'github', 'confirm'].indexOf(currentStep) > index ? 'completed' : ''
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GitSetupWizard;
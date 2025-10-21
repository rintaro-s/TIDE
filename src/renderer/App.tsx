import React, { useState, useEffect } from 'react';
import MainWorkspace from './components/MainWorkspace/MainWorkspace';
import ToastNotification from './components/ToastContainer/ToastNotification';
import GitSetupWizard from './components/GitSetupWizard/GitSetupWizard';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppProvider, useApp } from './contexts/AppContext';
import './styles/App.css';
import './styles/z-index.css';
import './styles/theme-liquid-glass.css';
import './styles/theme-material.css';
import './styles/theme-anime.css';
import './styles/theme-modern-blue.css';

interface GitConfig {
  globalGit: boolean;
  userName: string;
  userEmail: string;
  githubToken: string;
  useGitHubLogin: boolean;
}

const AppContent: React.FC<{ gitConfigured: boolean }> = ({ gitConfigured }) => {
  const { setMode, setCurrentProject, settings } = useApp();

  useEffect(() => {
    console.log('ℹ️ AppContent mounted');
    
    // Restore previous project if enabled
    const restorePreviousProject = async () => {
      if (settings.general?.restoreProject) {
        try {
          const lastProject = await window.electronAPI?.store.get('lastProject');
          if (lastProject) {
            console.log('Restoring previous project:', lastProject);
            setCurrentProject(lastProject);
            
            // Restore mode
            const lastMode = await window.electronAPI?.store.get('lastMode');
            if (lastMode) {
              setMode(lastMode);
            }
          }
        } catch (error) {
          console.error('Failed to restore previous project:', error);
        }
      }
    };

    restorePreviousProject();
    
    // Setup menu action listener
    if (window.electronAPI) {
      console.log('✅ electronAPI available');
      window.electronAPI.onMenuAction(async (action: string, data?: any) => {
        console.log('📝 Menu action:', action, data);
        
        switch (action) {
          case 'open-folder':
            if (data) {
              setCurrentProject(data);
              // Save as last project
              await window.electronAPI?.store.set('lastProject', data);
            }
            break;
          case 'new-project':
            // ProjectManagerが処理
            break;
          case 'save':
            // ファイル保存
            break;
          default:
            break;
        }
      });
    } else {
      console.warn('⚠️ electronAPI not available');
    }
  }, [setCurrentProject, setMode, settings.general?.restoreProject]);

  if (!gitConfigured) {
    return null;
  }

  console.log('🎨 Rendering AppContent');

  return (
    <div className="app">
      <MainWorkspace />
      <ToastNotification />
    </div>
  );
};

const App: React.FC = () => {
  const [gitConfigured, setGitConfigured] = useState(false);
  const [isCheckingGit, setIsCheckingGit] = useState(true);

  useEffect(() => {
    // Check if Git is already configured
    const checkGitConfig = async () => {
      try {
        const configured = await window.electronAPI?.store.get('gitConfigured');
        console.log('Git configured:', configured);
        
        if (configured) {
          setGitConfigured(true);
        }
      } catch (error) {
        console.error('Failed to check git config:', error);
      } finally {
        setIsCheckingGit(false);
      }
    };

    checkGitConfig();
  }, []);

  const handleGitSetupComplete = async (config: GitConfig) => {
    try {
      // Save configuration to store
      await window.electronAPI?.store.set('gitConfigured', true);
      await window.electronAPI?.store.set('gitConfig', config);
      
      console.log('Git configuration completed and saved');
      setGitConfigured(true);
    } catch (error) {
      console.error('Failed to save git config:', error);
    }
  };

  if (isCheckingGit) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, rgba(10, 15, 30, 0.95) 0%, rgba(20, 35, 60, 0.95) 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#e0e8f0', fontSize: '14px' }}>
            起動中...
          </p>
        </div>
      </div>
    );
  }

  console.log('🎯 App component rendering, gitConfigured:', gitConfigured);

  if (!gitConfigured) {
    return (
      <GitSetupWizard onComplete={handleGitSetupComplete} />
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppProvider>
          <AppContent gitConfigured={gitConfigured} />
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

// Wrapper to handle cases where electronAPI might not be available
const AppWithFallback: React.FC = () => {
  if (typeof window === 'undefined' || !window.electronAPI) {
    // If electronAPI is not available, skip git setup
    return (
      <ErrorBoundary>
        <ThemeProvider>
          <AppProvider>
            <AppContent gitConfigured={true} />
          </AppProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  return <App />;
};

export default AppWithFallback;
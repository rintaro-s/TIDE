import React, { useState, useEffect } from 'react';
import MainWorkspace from './components/MainWorkspace/MainWorkspace';
import ToastNotification from './components/ToastContainer/ToastNotification';
import GitSetupWizard from './components/GitSetupWizard/GitSetupWizard';
import ErrorBoundary from './components/ErrorBoundary';
import { Wallpaper } from './components/Wallpaper/Wallpaper';
import './components/Wallpaper/Wallpaper.css';
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
  const appContext = useApp();
  const [menuListenerSetup, setMenuListenerSetup] = useState(false);

  // Restore previous project on mount ONCE
  useEffect(() => {
    console.log('ℹ️ AppContent mounted - restoring project');
    
    const restorePreviousProject = async () => {
      if (appContext.settings.general?.restoreProject) {
        try {
          const lastProject = await window.electronAPI?.store.get('lastProject');
          if (lastProject) {
            console.log('Restoring previous project:', lastProject);
            appContext.setCurrentProject(lastProject);
            
            const lastMode = await window.electronAPI?.store.get('lastMode');
            if (lastMode) {
              appContext.setMode(lastMode);
            }
          }
        } catch (error) {
          console.error('Failed to restore previous project:', error);
        }
      }
    };

    restorePreviousProject();
  }, []); // Empty deps - run only once

  // Setup menu listener ONCE
  useEffect(() => {
    if (!window.electronAPI || menuListenerSetup) {
      return;
    }

    console.log('✅ Setting up menu listener (once)');
    setMenuListenerSetup(true);

    const handleMenuAction = async (action: string, data?: any) => {
      console.log('📝 Menu action:', action, data);
      
      switch (action) {
        case 'open-folder':
          if (data) {
            appContext.setCurrentProject(data);
            await window.electronAPI?.store.set('lastProject', data);
          }
          break;
        case 'save':
          console.log('🔍 Save action triggered');
          try {
            const saved = await appContext.saveFile();
            if (saved) {
              console.log('✅ File saved');
            }
          } catch (error) {
            console.error('❌ Save failed:', error);
          }
          break;
        case 'compile':
          window.dispatchEvent(new CustomEvent('triggerBuild', { 
            detail: { action: 'compile' } 
          }));
          break;
        case 'upload':
          window.dispatchEvent(new CustomEvent('triggerBuild', { 
            detail: { action: 'build-upload' } 
          }));
          break;
        case 'clean-build':
          window.dispatchEvent(new CustomEvent('triggerBuild', { 
            detail: { action: 'clean' } 
          }));
          break;
        default:
          break;
      }
    };

    window.electronAPI.onMenuAction(handleMenuAction);
  }, [menuListenerSetup]); // Only when menuListenerSetup changes

  if (!gitConfigured) {
    return null;
  }

  console.log('🎨 Rendering AppContent');

  return (
    <div className="app">
      <Wallpaper />
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
      <div className="app-loading">
        <div className="loading-content">
          <p className="loading-text">
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
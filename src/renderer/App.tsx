import React, { useState, useEffect } from 'react';
import MainWorkspace from './components/MainWorkspace/MainWorkspace';
import ToastNotification from './components/ToastContainer/ToastNotification';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppProvider, useApp } from './contexts/AppContext';
import './styles/App.css';
import './styles/z-index.css';
import './styles/theme-liquid-glass.css';
import './styles/theme-material.css';
import './styles/theme-anime.css';

const AppContent: React.FC = () => {
  const { setMode, setCurrentProject } = useApp();

  useEffect(() => {
    // Setup menu action listener
    if (window.electronAPI) {
      window.electronAPI.onMenuAction(async (action: string, data?: any) => {
        console.log('Menu action:', action, data);
        
        switch (action) {
          case 'open-folder':
            if (data) {
              setCurrentProject(data);
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
    }
  }, [setCurrentProject]);

  return (
    <div className="app">
      <MainWorkspace />
      <ToastNotification />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
};

export default App;
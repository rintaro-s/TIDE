import React, { useState, useEffect } from 'react';
import TitleBar from '../TitleBar/TitleBar';
import Sidebar from '../Sidebar/Sidebar';
import EditorArea from '../EditorArea/EditorArea';
import BottomPanelTabs from '../BottomPanel/BottomPanelTabs';
import StatusBar from '../StatusBar/StatusBar';
import ProjectManager from '../ProjectManager/ProjectManager';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import './MainWorkspace.css';

const MainWorkspace: React.FC = () => {
  const { mode, currentProject } = useApp();
  const { wallpaper } = useTheme();
  const [sidebarWidth, setSidebarWidth] = useState(450);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(250);
  const [isBottomPanelVisible, setIsBottomPanelVisible] = useState(true);
  const [showProjectManager, setShowProjectManager] = useState(!currentProject);

  console.log('🏢 MainWorkspace rendering', { mode, currentProject, showProjectManager, wallpaper });

  useEffect(() => {
    console.log('📊 MainWorkspace useEffect:', { currentProject, showProjectManager });
    // プロジェクトが開かれたらProjectManagerを閉じる
    if (currentProject) {
      console.log('📂 Project opened:', currentProject);
      setShowProjectManager(false);
    } else {
      console.log('📂 No project selected');
      // プロジェクトがない場合は表示
      setShowProjectManager(true);
    }
  }, [currentProject]);

  return (
    <div className="main-workspace">
      {/* Wallpaper Layer */}
      {wallpaper.enabled && wallpaper.imagePath && (
        <div 
          className="workspace-wallpaper"
          style={{
            backgroundImage: `url("${wallpaper.imagePath.replace(/\\/g, '/')}")`,
            opacity: wallpaper.opacity / 100,
            filter: `brightness(${wallpaper.brightness / 100})`
          }}
        />
      )}
      
      <TitleBar mode={mode} onNewProject={() => setShowProjectManager(true)} />
      
      <div className="workspace-content">
        <Sidebar 
          width={sidebarWidth}
          onResize={setSidebarWidth}
        />
        
        <div className="main-area">
          {showProjectManager ? (
            <ProjectManager onClose={() => setShowProjectManager(false)} />
          ) : (
            <>
              <EditorArea />
              
              {isBottomPanelVisible && (
                <BottomPanelTabs 
                  isVisible={isBottomPanelVisible}
                  onToggle={() => setIsBottomPanelVisible(false)}
                />
              )}
            </>
          )}
        </div>
      </div>
      
      <StatusBar 
        mode={mode}
        onToggleBottomPanel={() => setIsBottomPanelVisible(!isBottomPanelVisible)}
      />
    </div>
  );
};

export default MainWorkspace;
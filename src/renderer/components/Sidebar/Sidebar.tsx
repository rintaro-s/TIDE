import React, { useState } from 'react';
import FileExplorer from '../FileExplorer/FileExplorer';
import SearchPanel from '../SearchPanel/SearchPanel';
import DetailedBuildSettings from '../BuildManager/DetailedBuildSettings';
import SettingsPanel from '../SettingsPanel/SettingsPanel';
import GitPanel from '../GitPanel/GitPanel';
import BoardLibraryManager from '../BoardLibraryManager/BoardLibraryManager';
import { UploadSettingsPanel } from '../UploadSettingsPanel/UploadSettingsPanel';
import CopilotPanel from '../CopilotPanel/CopilotPanel';
import LANPanel from '../LANPanel/LANPanel';
import BuildPanel from '../BuildPanel/BuildPanel';
import './Sidebar.css';

interface SidebarTab {
  id: string;
  name: string;
  icon: string;
  component: React.ComponentType<any>;
  props?: any;
}

interface SidebarProps {
  width: number;
  onResize: (width: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ width }) => {
  const [activeTab, setActiveTab] = useState<string>('explorer');
  const [isCollapsed, setIsCollapsed] = useState(false);

  console.log('📍 Sidebar rendered', { activeTab, isCollapsed });

  const tabs: SidebarTab[] = [
    { id: 'explorer', name: 'Explorer', icon: 'F', component: FileExplorer },
    { id: 'search', name: 'Search', icon: 'S', component: SearchPanel },
    { id: 'build', name: 'Build', icon: 'B', component: BuildPanel, props: { isExpanded: true } },
    { id: 'copilot', name: 'AI Copilot', icon: '🤖', component: CopilotPanel },
    { id: 'lan', name: 'LAN Collaboration', icon: '🌐', component: LANPanel },
    { id: 'git', name: 'Git', icon: 'G', component: GitPanel },
    { id: 'build-settings', name: 'Build Settings', icon: '⚙️', component: DetailedBuildSettings },
    { id: 'boards', name: 'Boards', icon: 'H', component: BoardLibraryManager, props: { type: 'board' } },
    { id: 'libraries', name: 'Libraries', icon: 'L', component: BoardLibraryManager, props: { type: 'library' } },
    { id: 'upload', name: 'Upload', icon: 'U', component: UploadSettingsPanel },
    { id: 'settings', name: 'Settings', icon: 'C', component: SettingsPanel },
  ];

  const handleTabClick = (tabId: string) => {
    if (activeTab === tabId && !isCollapsed) {
      setIsCollapsed(true);
    } else {
      setActiveTab(tabId);
      setIsCollapsed(false);
    }
  };

  const activeTabData = tabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabData?.component;

  return (
    <div className="sidebar-container" data-surface="chrome">
      {/* Icon Bar */}
      <div className="sidebar-iconbar">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`sidebar-icon ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
            title={tab.name}
          >
            <span className="icon">{tab.icon}</span>
          </div>
        ))}
      </div>

      {/* Content Panel */}
      {!isCollapsed && (
        <div className="sidebar-panel" style={{ width: `${width - 48}px` }}>
          <div className="sidebar-panel-header">
            <h3 className="sidebar-panel-title">
              {tabs.find(tab => tab.id === activeTab)?.name}
            </h3>
            <button
              className="sidebar-collapse-btn"
              onClick={() => setIsCollapsed(true)}
            >
              ×
            </button>
          </div>
          
          <div className="sidebar-panel-content">
            {ActiveComponent && <ActiveComponent {...(activeTabData?.props || {})} />}
          </div>
          
          <div className="sidebar-resize-handle"></div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
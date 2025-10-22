import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../icons/Icons';
import './LANPanel.css';

interface TeamMember {
  id: string;
  name: string;
  ip: string;
  port: number;
  lastSeen: number;
  capabilities: string[];
  workload: number;
}

interface SharedProject {
  id: string;
  name: string;
  owner: string;
  path: string;
  lastModified: number;
  syncStatus: 'synced' | 'syncing' | 'conflict' | 'offline';
}

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: number;
  type: 'text' | 'system' | 'code' | 'file';
}

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  author: string;
  timestamp: number;
  votes: number;
}

interface BuildTask {
  id: string;
  project: string;
  type: 'compile' | 'upload' | 'test';
  status: 'queued' | 'building' | 'completed' | 'failed';
  assignedTo: string;
  progress: number;
  startTime?: number;
  endTime?: number;
}

type TabType = 'team' | 'projects' | 'chat' | 'knowledge' | 'builds';

export const LANPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('team');
  const [isConnected, setIsConnected] = useState(false);
  const [localInfo, setLocalInfo] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [sharedProjects, setSharedProjects] = useState<SharedProject[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [buildQueue, setBuildQueue] = useState<BuildTask[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [knowledgeSearch, setKnowledgeSearch] = useState('');
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize LAN collaboration service
    initializeLANService();

    // Set up event listeners
    const unsubscribe = setupEventListeners();

    return () => {
      unsubscribe();
      window.electronAPI.network.stop();
    };
  }, []);

  useEffect(() => {
    // Auto-scroll chat to bottom
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const initializeLANService = async () => {
    try {
      // Get local network info
      const info = await window.electronAPI.network.getLocalInfo();
      setLocalInfo(info);

      // Start network service
      const result = await window.electronAPI.network.start();
      if (result.success) {
        setIsConnected(true);
        console.log('LAN collaboration service started');
      } else {
        console.error('Failed to start LAN service:', result.error);
      }
    } catch (error) {
      console.error('Failed to initialize LAN service:', error);
    }
  };

  const setupEventListeners = () => {
    // Team member events
    window.electronAPI.network.onTeamMemberUpdated((member: TeamMember) => {
      setTeamMembers(prev => {
        const existing = prev.find(m => m.id === member.id);
        if (existing) {
          return prev.map(m => m.id === member.id ? member : m);
        } else {
          return [...prev, member];
        }
      });
    });

    window.electronAPI.network.onTeamMemberLeft((memberId: string) => {
      setTeamMembers(prev => prev.filter(m => m.id !== memberId));
    });

    // Network messages
    window.electronAPI.network.onMessage((message: any) => {
      handleNetworkMessage(message);
    });

    // Cleanup function
    return () => {
      // Remove event listeners if needed
    };
  };

  const handleNetworkMessage = (message: any) => {
    switch (message.type) {
      case 'chat':
        const chatMsg: ChatMessage = {
          id: Date.now().toString(),
          sender: message.sender,
          content: message.data.content,
          timestamp: message.timestamp,
          type: message.data.type || 'text'
        };
        setChatMessages(prev => [...prev, chatMsg]);
        break;
      
      case 'project_update':
        // Handle project synchronization
        updateSharedProject(message.data);
        break;
      
      case 'knowledge':
        // Handle knowledge base updates
        updateKnowledgeBase(message.data);
        break;
      
      case 'build_update':
        // Handle build queue updates
        updateBuildQueue(message.data);
        break;
    }
  };

  const updateSharedProject = (projectData: any) => {
    setSharedProjects(prev => {
      const existing = prev.find(p => p.id === projectData.id);
      if (existing) {
        return prev.map(p => p.id === projectData.id ? { ...p, ...projectData } : p);
      } else {
        return [...prev, projectData];
      }
    });
  };

  const updateKnowledgeBase = (entryData: any) => {
    setKnowledgeEntries(prev => {
      const existing = prev.find(e => e.id === entryData.id);
      if (existing) {
        return prev.map(e => e.id === entryData.id ? { ...e, ...entryData } : e);
      } else {
        return [...prev, entryData];
      }
    });
  };

  const updateBuildQueue = (taskData: any) => {
    setBuildQueue(prev => {
      const existing = prev.find(t => t.id === taskData.id);
      if (existing) {
        return prev.map(t => t.id === taskData.id ? { ...t, ...taskData } : t);
      } else {
        return [...prev, taskData];
      }
    });
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const message = {
      type: 'chat',
      content: chatInput,
      timestamp: Date.now()
    };

    try {
      await window.electronAPI.network.broadcast(message);
      
      // Add to local chat
      const chatMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: localInfo?.id || 'local',
        content: chatInput,
        timestamp: Date.now(),
        type: 'text'
      };
      setChatMessages(prev => [...prev, chatMsg]);
      setChatInput('');
    } catch (error) {
      console.error('Failed to send chat message:', error);
    }
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const getWorkloadLevel = (workload: number) => {
    if (workload < 30) return 'low';
    if (workload < 70) return 'medium';
    return 'high';
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTeamMemberInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredKnowledgeEntries = knowledgeEntries.filter(entry =>
    entry.title.toLowerCase().includes(knowledgeSearch.toLowerCase()) ||
    entry.content.toLowerCase().includes(knowledgeSearch.toLowerCase()) ||
    entry.tags.some(tag => tag.toLowerCase().includes(knowledgeSearch.toLowerCase()))
  );

  const renderTeamTab = () => (
    <div className="team-members-list">
      {teamMembers.length === 0 ? (
        <div className="empty-state">
          <Icons.Users className="empty-state-icon" />
          <div>チームメンバーが見つかりません</div>
          <div>他のユーザーがTIDE LANを起動するまでお待ちください</div>
        </div>
      ) : (
        teamMembers.map(member => (
          <div key={member.id} className="team-member">
            <div className="team-member-avatar">
              {getTeamMemberInitials(member.name)}
            </div>
            <div className="team-member-info">
              <div className="team-member-name">{member.name}</div>
              <div className="team-member-details">
                {member.ip}:{member.port} • {member.capabilities.join(', ')}
              </div>
            </div>
            <div className="team-member-workload">
              <div className="workload-bar">
                <div 
                  className={`workload-fill ${getWorkloadLevel(member.workload)}`}
                  style={{ width: `${member.workload}%` }}
                />
              </div>
              <span>{member.workload}%</span>
            </div>
            <div className="team-member-status" />
          </div>
        ))
      )}
    </div>
  );

  const renderProjectsTab = () => (
    <div className="shared-projects-list">
      {sharedProjects.length === 0 ? (
        <div className="empty-state">
          <Icons.Folder className="empty-state-icon" />
          <div>共有プロジェクトがありません</div>
          <div>プロジェクトを共有して協力開発を始めましょう</div>
        </div>
      ) : (
        sharedProjects.map(project => (
          <div key={project.id} className="shared-project">
            <Icons.Folder className="project-icon" />
            <div className="project-info">
              <div className="project-name">{project.name}</div>
              <div className="project-owner">Owner: {project.owner}</div>
            </div>
            <div className="project-sync-status">
              {project.syncStatus === 'synced' && <Icons.Check className="sync-indicator" />}
              {project.syncStatus === 'syncing' && <div className="loading-spinner" />}
              {project.syncStatus === 'conflict' && <Icons.AlertTriangle className="sync-indicator" />}
              {project.syncStatus === 'offline' && <Icons.X className="sync-indicator" />}
              <span>{project.syncStatus}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderChatTab = () => (
    <div className="chat-container">
      <div className="chat-messages" ref={chatMessagesRef}>
        {chatMessages.length === 0 ? (
          <div className="empty-state">
            <Icons.MessageCircle className="empty-state-icon" />
            <div>チャットメッセージがありません</div>
            <div>チームメンバーとコミュニケーションを始めましょう</div>
          </div>
        ) : (
          chatMessages.map(message => (
            <div 
              key={message.id} 
              className={`chat-message ${message.sender === localInfo?.id ? 'own' : 'other'}`}
            >
              {message.sender !== localInfo?.id && (
                <div className="message-avatar">
                  {getTeamMemberInitials(
                    teamMembers.find(m => m.id === message.sender)?.name || 'U'
                  )}
                </div>
              )}
              <div className="message-content">
                <div className="message-header">
                  <span className="message-sender">
                    {message.sender === localInfo?.id 
                      ? 'You' 
                      : teamMembers.find(m => m.id === message.sender)?.name || 'Unknown'
                    }
                  </span>
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                </div>
                <div className="message-text">{message.content}</div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <textarea
            className="chat-input"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={handleChatKeyPress}
            placeholder="メッセージを入力..."
            rows={1}
          />
          <button 
            className="chat-send-button"
            onClick={sendChatMessage}
            disabled={!chatInput.trim()}
          >
            <Icons.Send />
          </button>
        </div>
      </div>
    </div>
  );

  const renderKnowledgeTab = () => (
    <div className="knowledge-base">
      <div className="knowledge-search">
        <input
          className="knowledge-search-input"
          type="text"
          value={knowledgeSearch}
          onChange={(e) => setKnowledgeSearch(e.target.value)}
          placeholder="ナレッジを検索..."
        />
      </div>
      <div className="knowledge-entries">
        {filteredKnowledgeEntries.length === 0 ? (
          <div className="empty-state">
            <Icons.Book className="empty-state-icon" />
            <div>ナレッジエントリがありません</div>
            <div>チームの知識を共有して学習を促進しましょう</div>
          </div>
        ) : (
          filteredKnowledgeEntries.map(entry => (
            <div key={entry.id} className="knowledge-entry">
              <div className="knowledge-entry-header">
                <div className="knowledge-entry-title">{entry.title}</div>
                <div className="knowledge-entry-meta">
                  <span>{entry.author}</span>
                  <span>👍 {entry.votes}</span>
                  <span>{formatTime(entry.timestamp)}</span>
                </div>
              </div>
              <div className="knowledge-entry-tags">
                {entry.tags.map(tag => (
                  <span key={tag} className="knowledge-tag">{tag}</span>
                ))}
              </div>
              <div className="knowledge-entry-content">{entry.content}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderBuildsTab = () => (
    <div className="build-queue">
      {buildQueue.length === 0 ? (
        <div className="empty-state">
          <Icons.Settings className="empty-state-icon" />
          <div>ビルドタスクがありません</div>
          <div>分散ビルドキューは空です</div>
        </div>
      ) : (
        buildQueue.map(task => (
          <div key={task.id} className={`build-task ${task.status}`}>
            <Icons.Settings className="build-task-icon" />
            <div className="build-task-info">
              <div className="build-task-title">{task.project}</div>
              <div className="build-task-details">
                {task.type} • {task.assignedTo}
              </div>
            </div>
            <div className="build-task-status">
              <div className="build-progress">
                <div 
                  className="build-progress-fill"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
              <span>{task.status}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'team': return renderTeamTab();
      case 'projects': return renderProjectsTab();
      case 'chat': return renderChatTab();
      case 'knowledge': return renderKnowledgeTab();
      case 'builds': return renderBuildsTab();
      default: return null;
    }
  };

  return (
    <div className="lan-panel">
      <div className="lan-panel-header">
        <div className="lan-panel-title">LAN Collaboration</div>
        <div className="lan-connection-status">
          <div className={`lan-status-indicator ${isConnected ? 'connected' : ''}`} />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
      <div className="lan-panel-content">
        <div className="lan-tabs">
          <button 
            className={`lan-tab ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            <Icons.Users /> Team ({teamMembers.length})
          </button>
          <button 
            className={`lan-tab ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            <Icons.Folder /> Projects ({sharedProjects.length})
          </button>
          <button 
            className={`lan-tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <Icons.MessageCircle /> Chat
          </button>
          <button 
            className={`lan-tab ${activeTab === 'knowledge' ? 'active' : ''}`}
            onClick={() => setActiveTab('knowledge')}
          >
            <Icons.Book /> Knowledge ({knowledgeEntries.length})
          </button>
          <button 
            className={`lan-tab ${activeTab === 'builds' ? 'active' : ''}`}
            onClick={() => setActiveTab('builds')}
          >
            <Icons.Settings /> Builds ({buildQueue.length})
          </button>
        </div>
        <div className="lan-tab-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default LANPanel;
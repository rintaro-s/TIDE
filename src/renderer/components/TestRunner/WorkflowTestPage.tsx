import React, { useState } from 'react';
import { ArduinoWorkflowTest } from './ArduinoWorkflowTest';
import { PlatformIOWorkflowTest } from './PlatformIOWorkflowTest';
import './WorkflowTestPage.css';

export const WorkflowTestPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'arduino' | 'platformio'>('arduino');

  return (
    <div className="workflow-test-page">
      <div className="test-page-header">
        <h1>ワークフロー検証テストスイート</h1>
        <p>Arduino CLI と PlatformIO の完全なワークフローを検証します</p>
      </div>

      <div className="test-tabs">
        <button 
          className={`test-tab ${activeTab === 'arduino' ? 'active' : ''}`}
          onClick={() => setActiveTab('arduino')}
        >
          <span className="tab-icon">🔧</span>
          Arduino CLI
        </button>
        <button 
          className={`test-tab ${activeTab === 'platformio' ? 'active' : ''}`}
          onClick={() => setActiveTab('platformio')}
        >
          <span className="tab-icon">⚡</span>
          PlatformIO
        </button>
      </div>

      <div className="test-content">
        {activeTab === 'arduino' && <ArduinoWorkflowTest />}
        {activeTab === 'platformio' && <PlatformIOWorkflowTest />}
      </div>
    </div>
  );
};
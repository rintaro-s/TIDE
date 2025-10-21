import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import arduinoService, { ArduinoCLIService, ArduinoBoard, ArduinoPort } from '../../services/ArduinoService';
import platformioService, { PlatformIOService, PlatformIOBoard } from '../../services/PlatformIOService';
import './QuickBuildPanel.css';

interface QuickBuildPanelProps {
  isExpanded: boolean;
}

type BuildStep = 'idle' | 'confirming' | 'building' | 'complete' | 'error';

const QuickBuildPanel: React.FC<QuickBuildPanelProps> = ({ isExpanded }) => {
  const { state } = useApp();
  const [currentStep, setCurrentStep] = useState<BuildStep>('idle');
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [availableBoards, setAvailableBoards] = useState<(ArduinoBoard | PlatformIOBoard)[]>([]);
  const [availablePorts, setAvailablePorts] = useState<ArduinoPort[]>([]);
  const [boardSearchTerm, setBoardSearchTerm] = useState('');
  const [buildError, setBuildError] = useState('');
  const [buildOutput, setBuildOutput] = useState('');
  
  const arduinoService = ArduinoCLIService.getInstance();
  const platformioService = PlatformIOService.getInstance();

  useEffect(() => {
    if (isExpanded && currentStep === 'idle') {
      loadBoardsAndPorts();
    }
  }, [isExpanded, state.mode, state.currentProject]);

  const loadBoardsAndPorts = async () => {
    if (!state.mode) return;

    try {
      let boards: (ArduinoBoard | PlatformIOBoard)[] = [];
      let ports: ArduinoPort[] = [];

      if (state.mode === 'arduino') {
        const installed = await arduinoService.checkInstallation();
        if (installed) {
          boards = await arduinoService.listBoards();
          ports = await arduinoService.listPorts();
        }
      } else if (state.mode === 'platformio') {
        const installed = await platformioService.checkInstallation();
        if (installed) {
          boards = await platformioService.listAllBoards();
        }
      }

      setAvailableBoards(boards);
      setAvailablePorts(ports);

      if (boards.length > 0 && !selectedBoard) {
        const boardId = 'id' in boards[0] ? boards[0].id : boards[0].fqbn;
        setSelectedBoard(boardId);
      }
      if (ports.length > 0 && !selectedPort) {
        setSelectedPort(ports[0].address);
      }
    } catch (error) {
      console.error('Failed to load boards and ports:', error);
      setBuildError('ボード情報の取得に失敗しました');
    }
  };

  const handleStartBuild = async () => {
    if (!state.currentProject || !selectedBoard) {
      setBuildError('プロジェクトとボードを選択してください');
      return;
    }

    setCurrentStep('confirming');
  };

  const handleConfirmBuild = async () => {
    if (!state.currentProject) return;

    setCurrentStep('building');
    setBuildError('');
    setBuildOutput('ビルドを開始しています...');

    try {
      let success = false;
      let output = '';

      if (state.mode === 'arduino') {
        const result = await arduinoService.compile(state.currentProject.path, selectedBoard);
        success = result.success;
        output = result.output;
        
        if (!success) {
          setBuildError(result.errors.join('\n') || 'コンパイル失敗');
        }
      } else {
        const result = await platformioService.compile(state.currentProject.path);
        success = result.success;
        output = result.output;
      }

      setBuildOutput(output);
      setCurrentStep(success ? 'complete' : 'error');
    } catch (error) {
      setBuildError(`ビルドエラー: ${error}`);
      setCurrentStep('error');
    }
  };

  const handleReset = () => {
    setCurrentStep('idle');
    setBuildError('');
    setBuildOutput('');
  };

  const filteredBoards = availableBoards.filter(board => {
    const name = board.name.toLowerCase();
    return name.includes(boardSearchTerm.toLowerCase());
  });

  if (!isExpanded) {
    return (
      <div className="quick-build-panel collapsed">
        <div className="quick-actions">
          <button 
            className="quick-action-btn build"
            onClick={handleStartBuild}
            disabled={!state.currentProject || !selectedBoard || currentStep !== 'idle'}
            title="クイックビルド開始"
          >
            Build
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quick-build-panel expanded">
      <div className="panel-header">
        <h3>Quick Build</h3>
      </div>

      {!state.currentProject ? (
        <div className="message-box info">
          <p>プロジェクトを開いてください</p>
        </div>
      ) : currentStep === 'idle' ? (
        <div className="build-content">
          <div className="step-section">
            <label className="section-title">ボード選択</label>
            <input
              type="text"
              className="search-input"
              placeholder="ボード検索..."
              value={boardSearchTerm}
              onChange={(e) => setBoardSearchTerm(e.target.value)}
            />
            <select
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value)}
              className="select-input"
            >
              <option value="">ボードを選択...</option>
              {filteredBoards.map(board => {
                const boardId = 'id' in board ? board.id : board.fqbn;
                return (
                  <option key={boardId} value={boardId}>
                    {board.name}
                  </option>
                );
              })}
            </select>
          </div>

          {state.mode === 'arduino' && availablePorts.length > 0 && (
            <div className="step-section">
              <label className="section-title">シリアルポート</label>
              <select
                value={selectedPort}
                onChange={(e) => setSelectedPort(e.target.value)}
                className="select-input"
              >
                <option value="">ポートを選択...</option>
                {availablePorts.map(port => (
                  <option key={port.address} value={port.address}>
                    {port.address}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button 
            className="btn-primary"
            onClick={handleStartBuild}
            disabled={!selectedBoard}
          >
            ビルドを開始
          </button>
        </div>
      ) : currentStep === 'confirming' ? (
        <div className="confirm-content">
          <div className="confirm-box">
            <h4>ビルド確認</h4>
            <div className="confirm-item">
              <span className="label">プロジェクト:</span>
              <span className="value">{state.currentProject?.name}</span>
            </div>
            <div className="confirm-item">
              <span className="label">ボード:</span>
              <span className="value">{selectedBoard}</span>
            </div>
            {selectedPort && (
              <div className="confirm-item">
                <span className="label">ポート:</span>
                <span className="value">{selectedPort}</span>
              </div>
            )}
          </div>

          <div className="action-buttons">
            <button className="btn-secondary" onClick={handleReset}>
              キャンセル
            </button>
            <button className="btn-primary" onClick={handleConfirmBuild}>
              ビルド実行
            </button>
          </div>
        </div>
      ) : currentStep === 'building' ? (
        <div className="building-content">
          <div className="progress">
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
          </div>
          <p className="status-message">ビルド中...</p>
          <div className="output-box">
            <pre>{buildOutput}</pre>
          </div>
        </div>
      ) : currentStep === 'complete' ? (
        <div className="result-content success">
          <div className="result-icon">✓</div>
          <h4>ビルド完了</h4>
          <p>コンパイルに成功しました</p>
          <button className="btn-primary" onClick={handleReset}>
            完了
          </button>
        </div>
      ) : currentStep === 'error' ? (
        <div className="result-content error">
          <div className="result-icon">✗</div>
          <h4>ビルド失敗</h4>
          {buildError && <p className="error-text">{buildError}</p>}
          <div className="output-box">
            <pre>{buildOutput}</pre>
          </div>
          <button className="btn-primary" onClick={handleReset}>
            戻る
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default QuickBuildPanel;

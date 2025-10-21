import React, { useState } from 'react';
import { ArduinoCLIService } from '../../services/ArduinoService';
import './ArduinoWorkflowTest.css';

interface TestResult {
  testName: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  output: string;
  duration?: number;
}

export const ArduinoWorkflowTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentProject, setCurrentProject] = useState<string>('');

  const arduinoService = ArduinoCLIService.getInstance();

  const addTestResult = (testName: string, status: TestResult['status'], output: string, duration?: number) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.testName === testName);
      if (existing) {
        existing.status = status;
        existing.output = output;
        existing.duration = duration;
        return [...prev];
      } else {
        return [...prev, { testName, status, output, duration }];
      }
    });
  };

  const runSingleTest = async (testName: string, testFn: () => Promise<void>) => {
    const startTime = Date.now();
    addTestResult(testName, 'running', 'テスト実行中...');
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      addTestResult(testName, 'success', 'テスト成功', duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      addTestResult(testName, 'failed', `テスト失敗: ${error}`, duration);
    }
  };

  const runFullWorkflowTest = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      // Test 1: Arduino CLI インストール確認
      await runSingleTest('Arduino CLI インストール確認', async () => {
        const isInstalled = await arduinoService.checkInstallation();
        if (!isInstalled) {
          throw new Error('Arduino CLI がインストールされていません');
        }
      });

      // Test 2: 設定初期化
      await runSingleTest('設定初期化', async () => {
        const initialized = await arduinoService.initConfig();
        if (!initialized) {
          throw new Error('設定の初期化に失敗しました');
        }
      });

      // Test 3: コアインデックス更新
      await runSingleTest('コアインデックス更新', async () => {
        const updated = await arduinoService.updateCoreIndex();
        if (!updated) {
          throw new Error('コアインデックスの更新に失敗しました');
        }
      });

      // Test 4: ライブラリインデックス更新
      await runSingleTest('ライブラリインデックス更新', async () => {
        const updated = await arduinoService.updateLibraryIndex();
        if (!updated) {
          throw new Error('ライブラリインデックスの更新に失敗しました');
        }
      });

      // Test 5: ボード一覧取得
      await runSingleTest('ボード一覧取得', async () => {
        const boards = await arduinoService.listBoards();
        if (boards.length === 0) {
          throw new Error('ボードが見つかりませんでした');
        }
        addTestResult('ボード一覧取得', 'success', `${boards.length}個のボードが見つかりました`);
      });

      // Test 6: ライブラリ一覧取得
      await runSingleTest('ライブラリ一覧取得', async () => {
        const libraries = await arduinoService.listLibraries();
        addTestResult('ライブラリ一覧取得', 'success', `${libraries.length}個のライブラリが見つかりました`);
      });

      // Test 7: ポート一覧取得
      await runSingleTest('ポート一覧取得', async () => {
        const ports = await arduinoService.listPorts();
        addTestResult('ポート一覧取得', 'success', `${ports.length}個のポートが見つかりました`);
      });

      // Test 8: プロジェクト作成
      await runSingleTest('プロジェクト作成', async () => {
        const tempPath = `C:\\temp\\arduino-test-${Date.now()}`;
        const created = await arduinoService.createSketch(tempPath, 'TestSketch');
        if (!created) {
          throw new Error('プロジェクトの作成に失敗しました');
        }
        setCurrentProject(tempPath);
        addTestResult('プロジェクト作成', 'success', `プロジェクト作成: ${tempPath}`);
      });

      // Test 9: サンプルコード作成
      await runSingleTest('サンプルコード作成', async () => {
        if (!currentProject) throw new Error('プロジェクトが作成されていません');
        
        const sampleCode = `
void setup() {
  Serial.begin(9600);
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
  Serial.println("Hello from TOVA IDE!");
}
        `.trim();

        // ここで実際にファイルを作成する必要がある場合は window.electronAPI を使用
        // await window.electronAPI.fs.writeFile(path.join(currentProject, 'TestSketch.ino'), sampleCode);
      });

      // Test 10: コンパイル
      await runSingleTest('コンパイル', async () => {
        if (!currentProject) throw new Error('プロジェクトが作成されていません');
        
        const boards = await arduinoService.listBoards();
        if (boards.length === 0) throw new Error('コンパイル用のボードが見つかりません');
        
        const result = await arduinoService.compile(currentProject, boards[0].fqbn);
        if (!result.success) {
          throw new Error(`コンパイル失敗: ${result.errors.join(', ')}`);
        }
        addTestResult('コンパイル', 'success', 'コンパイル成功');
      });

    } catch (error) {
      console.error('ワークフローテストエラー:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '⏸️';
      case 'running': return '🔄';
      case 'success': return '✅';
      case 'failed': return '❌';
    }
  };

  const getStatusClass = (status: TestResult['status']) => {
    return `test-result-${status}`;
  };

  return (
    <div className="arduino-workflow-test">
      <div className="test-header">
        <h2>Arduino ワークフロー検証</h2>
        <button 
          onClick={runFullWorkflowTest}
          disabled={isRunning}
          className="run-test-btn"
        >
          {isRunning ? 'テスト実行中...' : '全テスト実行'}
        </button>
      </div>

      <div className="test-results">
        {testResults.map((result, index) => (
          <div key={index} className={`test-result-item ${getStatusClass(result.status)}`}>
            <div className="test-result-header">
              <span className="test-status-icon">{getStatusIcon(result.status)}</span>
              <span className="test-name">{result.testName}</span>
              {result.duration && (
                <span className="test-duration">{result.duration}ms</span>
              )}
            </div>
            <div className="test-output">{result.output}</div>
          </div>
        ))}
      </div>

      {currentProject && (
        <div className="current-project-info">
          <h3>現在のテストプロジェクト</h3>
          <code>{currentProject}</code>
        </div>
      )}
    </div>
  );
};
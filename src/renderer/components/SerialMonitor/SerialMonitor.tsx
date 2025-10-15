import React, { useState, useEffect, useRef } from 'react';
import arduinoService, { ArduinoCLIService, ArduinoPort } from '../../services/ArduinoService';
import platformioService, { PlatformIOService } from '../../services/PlatformIOService';
import { useApp } from '../../contexts/AppContext';
import './SerialMonitor.css';

interface SerialData {
  timestamp: Date;
  data: string;
  type: 'incoming' | 'outgoing' | 'system';
}

const SerialMonitor: React.FC = () => {
  const { state } = useApp();
  const [serialData, setSerialData] = useState<SerialData[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [selectedPort, setSelectedPort] = useState('');
  const [baudRate, setBaudRate] = useState(9600);
  const [availablePorts, setAvailablePorts] = useState<ArduinoPort[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showTimestamp, setShowTimestamp] = useState(true);
  const [lineEnding, setLineEnding] = useState<'none' | 'nl' | 'cr' | 'crnl'>('nl');
  
  const outputRef = useRef<HTMLDivElement>(null);
  const arduinoService = ArduinoCLIService.getInstance();
  const platformioService = PlatformIOService.getInstance();

  useEffect(() => {
    loadAvailablePorts();
  }, [state.mode]);

  useEffect(() => {
    // Auto-scroll to bottom when new data arrives
    if (autoScroll && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [serialData, autoScroll]);

  const loadAvailablePorts = async () => {
    if (!state.mode) return;

    try {
      let ports: ArduinoPort[] = [];

      if (state.mode === 'arduino') {
        const installed = await arduinoService.checkInstallation();
        if (installed) {
          ports = await arduinoService.listPorts();
        }
      } else if (state.mode === 'platformio') {
        const installed = await platformioService.checkInstallation();
        if (installed) {
          ports = await platformioService.listDevices();
        }
      }

      setAvailablePorts(ports);
      
      // Auto-select first port if available and none selected
      if (ports.length > 0 && !selectedPort) {
        setSelectedPort(ports[0].address);
      }
    } catch (error) {
      console.error('Failed to load ports:', error);
      addSerialData(`Error loading ports: ${error}`, 'system');
    }
  };

  const addSerialData = (data: string, type: SerialData['type']) => {
    const newData: SerialData = {
      timestamp: new Date(),
      data: data.trim(),
      type
    };
    setSerialData(prev => [...prev, newData]);
  };

  const handleConnect = async () => {
    if (!selectedPort) {
      addSerialData('Please select a port first', 'system');
      return;
    }

    if (isConnected) {
      // Disconnect
      try {
        // TODO: Stop monitoring process
        setIsConnected(false);
        addSerialData(`Disconnected from ${selectedPort}`, 'system');
      } catch (error) {
        addSerialData(`Error disconnecting: ${error}`, 'system');
      }
    } else {
      // Connect
      try {
        setIsConnected(true);
        addSerialData(`Connected to ${selectedPort} at ${baudRate} baud`, 'system');
        
        // Start simulated data for testing
        startSimulatedData();
      } catch (error) {
        addSerialData(`Error connecting to ${selectedPort}: ${error}`, 'system');
        setIsConnected(false);
      }
    }
  };

  const startSimulatedData = () => {
    // Simulate incoming data for testing
    const interval = setInterval(() => {
      if (!isConnected) {
        clearInterval(interval);
        return;
      }
      
      const messages = [
        'Hello from Arduino!',
        'Temperature: 25.3°C',
        'Sensor reading: 512',
        'Status: OK'
      ];
      
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      addSerialData(randomMessage, 'incoming');
    }, 2000);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !isConnected) return;

    let dataToSend = inputValue;
    
    // Add line ending
    switch (lineEnding) {
      case 'nl':
        dataToSend += '\n';
        break;
      case 'cr':
        dataToSend += '\r';
        break;
      case 'crnl':
        dataToSend += '\r\n';
        break;
    }

    // Add to output as sent data
    addSerialData(inputValue, 'outgoing');
    
    // TODO: Implement actual serial sending
    // For now, just simulate an echo
    setTimeout(() => {
      addSerialData(`Echo: ${inputValue}`, 'incoming');
    }, 100);
    
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const clearOutput = () => {
    setSerialData([]);
  };

  const refreshPorts = async () => {
    await loadAvailablePorts();
    addSerialData('Ports refreshed', 'system');
  };

  const formatTimestamp = (timestamp: Date) => {
    const hours = timestamp.getHours().toString().padStart(2, '0');
    const minutes = timestamp.getMinutes().toString().padStart(2, '0');
    const seconds = timestamp.getSeconds().toString().padStart(2, '0');
    const milliseconds = timestamp.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  };

  const getDataTypeIcon = (type: SerialData['type']) => {
    switch (type) {
      case 'incoming': return '←';
      case 'outgoing': return '→';
      case 'system': return '•';
    }
  };

  const getDataTypeClass = (type: SerialData['type']) => {
    switch (type) {
      case 'incoming': return 'data-incoming';
      case 'outgoing': return 'data-outgoing';
      case 'system': return 'data-system';
    }
  };

  return (
    <div className="serial-monitor">
      <div className="serial-header">
        <div className="connection-controls">
          <select 
            value={selectedPort}
            onChange={(e) => setSelectedPort(e.target.value)}
            disabled={isConnected}
            className="port-select"
          >
            <option value="">Select Port...</option>
            {availablePorts.map(port => (
              <option key={port.address} value={port.address}>
                {port.address} - {port.label}
              </option>
            ))}
          </select>
          
          <button 
            onClick={refreshPorts} 
            disabled={isConnected}
            className="refresh-btn"
            title="Refresh Ports"
          >
            🔄
          </button>

          <select 
            value={baudRate}
            onChange={(e) => setBaudRate(Number(e.target.value))}
            disabled={isConnected}
            className="baud-select"
          >
            <option value={9600}>9600</option>
            <option value={19200}>19200</option>
            <option value={38400}>38400</option>
            <option value={57600}>57600</option>
            <option value={115200}>115200</option>
          </select>

          <button 
            className={`connect-btn ${isConnected ? 'connected' : ''}`}
            onClick={handleConnect}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
        </div>

        <div className="display-controls">
          <label className="control-label">
            <input
              type="checkbox"
              checked={showTimestamp}
              onChange={(e) => setShowTimestamp(e.target.checked)}
            />
            タイムスタンプ
          </label>

          <label className="control-label">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            自動スクロール
          </label>

          <button className="clear-btn" onClick={clearOutput}>
            Clear
          </button>
        </div>
      </div>

      <div className="serial-output" ref={outputRef}>
        {serialData.map((data, index) => (
          <div 
            key={index}
            className={`output-line ${getDataTypeClass(data.type)}`}
          >
            {showTimestamp && (
              <span className="timestamp">
                [{formatTimestamp(data.timestamp)}]
              </span>
            )}
            <span className="data-type-icon">
              {getDataTypeIcon(data.type)}
            </span>
            <span className="data-content">
              {data.data}
            </span>
          </div>
        ))}
        {serialData.length === 0 && (
          <div className="empty-state">
            シリアルデータが表示されます...
          </div>
        )}
      </div>

      <div className="serial-input">
        <div className="input-controls">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="送信するデータを入力..."
            disabled={!isConnected}
            className="data-input"
          />

          <select 
            value={lineEnding}
            onChange={(e) => setLineEnding(e.target.value as any)}
            className="ending-select"
            disabled={!isConnected}
          >
            <option value="none">改行なし</option>
            <option value="nl">LF (\\n)</option>
            <option value="cr">CR (\\r)</option>
            <option value="crnl">CR+LF (\\r\\n)</option>
          </select>

          <button 
            className="send-btn"
            onClick={handleSend}
            disabled={!isConnected || !inputValue.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default SerialMonitor;
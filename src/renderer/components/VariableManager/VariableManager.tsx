import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import './VariableManager.css';

interface Variable {
  id: string;
  name: string;
  type: 'int' | 'float' | 'string' | 'boolean' | 'custom';
  value: string;
  description?: string;
  isConstant?: boolean;
  scope: 'global' | 'local';
}

const VariableManager: React.FC = () => {
  const { state } = useApp();
  const [variables, setVariables] = useState<Variable[]>([]);
  const [newVariable, setNewVariable] = useState<Partial<Variable>>({
    name: '',
    type: 'int',
    value: '',
    description: '',
    isConstant: false,
    scope: 'global'
  });
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState<'all' | 'global' | 'local'>('all');

  useEffect(() => {
    loadVariables();
  }, [state.currentProject]);

  const loadVariables = async () => {
    try {
      const stored = await window.electronAPI?.store.get('projectVariables') || {};
      const projectKey = state.currentProject?.path || 'default';
      const projectVars = stored[projectKey] || [];
      setVariables(projectVars);
    } catch (error) {
      console.error('Failed to load variables:', error);
    }
  };

  const saveVariables = async (vars: Variable[]) => {
    try {
      const stored = await window.electronAPI?.store.get('projectVariables') || {};
      const projectKey = state.currentProject?.path || 'default';
      stored[projectKey] = vars;
      await window.electronAPI?.store.set('projectVariables', stored);
      setVariables(vars);
    } catch (error) {
      console.error('Failed to save variables:', error);
    }
  };

  const addVariable = () => {
    if (!newVariable.name || !newVariable.type) return;

    const variable: Variable = {
      id: Date.now().toString(),
      name: newVariable.name!,
      type: newVariable.type as Variable['type'],
      value: newVariable.value || '',
      description: newVariable.description || '',
      isConstant: newVariable.isConstant || false,
      scope: newVariable.scope || 'global'
    };

    const updatedVariables = [...variables, variable];
    saveVariables(updatedVariables);
    
    // Reset form
    setNewVariable({
      name: '',
      type: 'int',
      value: '',
      description: '',
      isConstant: false,
      scope: 'global'
    });
    setIsAdding(false);
  };

  const removeVariable = (id: string) => {
    const updatedVariables = variables.filter(v => v.id !== id);
    saveVariables(updatedVariables);
  };

  const updateVariable = (id: string, updates: Partial<Variable>) => {
    const updatedVariables = variables.map(v => 
      v.id === id ? { ...v, ...updates } : v
    );
    saveVariables(updatedVariables);
  };

  const generateCode = (variable: Variable) => {
    const prefix = variable.isConstant ? 'const ' : '';
    const typeMap = {
      int: 'int',
      float: 'float',
      string: 'String',
      boolean: 'bool',
      custom: ''
    };
    
    const type = typeMap[variable.type];
    return `${prefix}${type} ${variable.name} = ${variable.value};`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const generateAllCode = () => {
    const code = variables
      .filter(v => filter === 'all' || v.scope === filter)
      .map(generateCode)
      .join('\n');
    return code;
  };

  const filteredVariables = variables.filter(v => 
    filter === 'all' || v.scope === filter
  );

  return (
    <div className="variable-manager">
      <div className="variable-header">
        <h4>Variables</h4>
        <div className="header-actions">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="filter-select"
          >
            <option value="all">All</option>
            <option value="global">Global</option>
            <option value="local">Local</option>
          </select>
          <button 
            className="add-variable-btn"
            onClick={() => setIsAdding(true)}
            title="Add Variable"
          >
            +
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="add-variable-form">
          <div className="form-row">
            <input
              type="text"
              placeholder="Variable name"
              value={newVariable.name || ''}
              onChange={(e) => setNewVariable({...newVariable, name: e.target.value})}
              className="var-input"
            />
            <select
              value={newVariable.type || 'int'}
              onChange={(e) => setNewVariable({...newVariable, type: e.target.value as Variable['type']})}
              className="var-select"
            >
              <option value="int">int</option>
              <option value="float">float</option>
              <option value="string">String</option>
              <option value="boolean">bool</option>
              <option value="custom">custom</option>
            </select>
          </div>
          
          <input
            type="text"
            placeholder="Initial value"
            value={newVariable.value || ''}
            onChange={(e) => setNewVariable({...newVariable, value: e.target.value})}
            className="var-input"
          />
          
          <input
            type="text"
            placeholder="Description (optional)"
            value={newVariable.description || ''}
            onChange={(e) => setNewVariable({...newVariable, description: e.target.value})}
            className="var-input"
          />
          
          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={newVariable.isConstant || false}
                onChange={(e) => setNewVariable({...newVariable, isConstant: e.target.checked})}
              />
              Constant
            </label>
            
            <select
              value={newVariable.scope || 'global'}
              onChange={(e) => setNewVariable({...newVariable, scope: e.target.value as 'global' | 'local'})}
              className="scope-select"
            >
              <option value="global">Global</option>
              <option value="local">Local</option>
            </select>
          </div>
          
          <div className="form-actions">
            <button className="save-btn" onClick={addVariable}>Save</button>
            <button className="cancel-btn" onClick={() => setIsAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="variable-list">
        {filteredVariables.length === 0 ? (
          <div className="empty-state">
            <p>No variables defined</p>
            <p>Click + to add a variable</p>
          </div>
        ) : (
          filteredVariables.map(variable => (
            <div key={variable.id} className="variable-item">
              <div className="variable-header-item">
                <div className="variable-info">
                  <span className="variable-name">{variable.name}</span>
                  <span className={`variable-type ${variable.type}`}>{variable.type}</span>
                  {variable.isConstant && <span className="const-badge">const</span>}
                  <span className={`scope-badge ${variable.scope}`}>{variable.scope}</span>
                </div>
                <button 
                  className="remove-btn"
                  onClick={() => removeVariable(variable.id)}
                  title="Remove Variable"
                >
                  ×
                </button>
              </div>
              
              <div className="variable-value">
                <input
                  type="text"
                  value={variable.value}
                  onChange={(e) => updateVariable(variable.id, { value: e.target.value })}
                  className="value-input"
                  placeholder="Value"
                />
              </div>
              
              {variable.description && (
                <div className="variable-description">
                  {variable.description}
                </div>
              )}
              
              <div className="variable-actions">
                <button
                  className="code-btn"
                  onClick={() => copyToClipboard(generateCode(variable))}
                  title="Copy code to clipboard"
                >
                  📋 Copy Code
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {variables.length > 0 && (
        <div className="code-generation">
          <div className="code-header">
            <h5>Generated Code</h5>
            <button
              className="copy-all-btn"
              onClick={() => copyToClipboard(generateAllCode())}
              title="Copy all code"
            >
              📋 Copy All
            </button>
          </div>
          <pre className="code-preview">
            {generateAllCode()}
          </pre>
        </div>
      )}

      <div className="quick-templates">
        <h5>Quick Templates</h5>
        <div className="template-grid">
          <button 
            className="template-btn"
            onClick={() => setNewVariable({
              name: 'ledPin',
              type: 'int',
              value: '13',
              description: 'LED pin number',
              isConstant: true,
              scope: 'global'
            })}
          >
            💡 LED Pin
          </button>
          <button 
            className="template-btn"
            onClick={() => setNewVariable({
              name: 'sensorValue',
              type: 'int',
              value: '0',
              description: 'Sensor reading',
              isConstant: false,
              scope: 'global'
            })}
          >
            📊 Sensor
          </button>
          <button 
            className="template-btn"
            onClick={() => setNewVariable({
              name: 'temperature',
              type: 'float',
              value: '0.0',
              description: 'Temperature in Celsius',
              isConstant: false,
              scope: 'global'
            })}
          >
            🌡️ Temperature
          </button>
          <button 
            className="template-btn"
            onClick={() => setNewVariable({
              name: 'isConnected',
              type: 'boolean',
              value: 'false',
              description: 'Connection status',
              isConstant: false,
              scope: 'global'
            })}
          >
            🔗 Boolean
          </button>
        </div>
      </div>
    </div>
  );
};

export default VariableManager;
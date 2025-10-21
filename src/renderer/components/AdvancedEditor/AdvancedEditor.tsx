import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as monaco from 'monaco-editor';
import Fuse from 'fuse.js';
import debounce from 'lodash.debounce';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import arduinoCommandsData from '../../data/arduinoCommands.json';
import './AdvancedEditor.css';

interface AdvancedEditorProps {
  filePath: string;
  value: string;
  onChange: (value: string) => void;
  language?: string;
}

interface ArduinoCommand {
  command: string;
  template: string;
  description: string;
  category?: string;
  parameters?: string[];
}

const AdvancedEditor: React.FC<AdvancedEditorProps> = ({
  filePath,
  value,
  onChange,
  language = 'cpp'
}) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const { theme } = useTheme();
  const { settings } = useApp();
  const [arduinoCommands, setArduinoCommands] = useState<ArduinoCommand[]>([]);
  const [commandFuse, setCommandFuse] = useState<Fuse<ArduinoCommand> | null>(null);
  const [diagnostics, setDiagnostics] = useState<monaco.editor.IMarkerData[]>([]);

  // Load Arduino commands from imported JSON
  useEffect(() => {
    try {
      const commands = arduinoCommandsData as ArduinoCommand[];
      setArduinoCommands(commands);
      
      // Initialize Fuse for fuzzy searching and typo correction
      const fuse = new Fuse(commands, {
        keys: [
          { name: 'command', weight: 2 },
          { name: 'description', weight: 0.5 },
          { name: 'template', weight: 1 }
        ],
        threshold: 0.4, // More tolerant for typo correction
        includeScore: true,
        minMatchCharLength: 2
      });
      setCommandFuse(fuse);
      
      console.log(`✅ Loaded ${commands.length} Arduino commands`);
    } catch (error) {
      console.error('Failed to load Arduino commands:', error);
    }
  }, []);

  // Setup Monaco Editor themes
  useEffect(() => {
    // Advanced Dark Theme
    monaco.editor.defineTheme('advanced-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        // Arduino-specific syntax highlighting
        { token: 'keyword.arduino', foreground: '#c586c0', fontStyle: 'bold' },
        { token: 'function.arduino', foreground: '#dcdcaa' },
        { token: 'variable.arduino', foreground: '#9cdcfe' },
        { token: 'type.arduino', foreground: '#4ec9b0' },
        { token: 'number.arduino', foreground: '#b5cea8' },
        { token: 'string.arduino', foreground: '#ce9178' },
        { token: 'comment.arduino', foreground: '#6a9955', fontStyle: 'italic' },
        { token: 'preprocessor.arduino', foreground: '#c586c0' },
        
        // Standard syntax
        { token: 'comment', foreground: '#6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '#569CD6', fontStyle: 'bold' },
        { token: 'string', foreground: '#CE9178' },
        { token: 'number', foreground: '#B5CEA8' },
        { token: 'type', foreground: '#4EC9B0' },
        { token: 'function', foreground: '#DCDCAA' },
        { token: 'variable', foreground: '#9CDCFE' },
        { token: 'constant', foreground: '#4FC1FF' },
        { token: 'operator', foreground: '#D4D4D4' },
        { token: 'delimiter', foreground: '#D4D4D4' }
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#cccccc',
        'editor.lineHighlightBackground': '#2d2d30aa',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#aeafad',
        'editorWhitespace.foreground': '#404040',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#c6c6c6',
        'editorGutter.background': '#1e1e1e',
        'editorBracketMatch.background': '#0064001a',
        'editorBracketMatch.border': '#888888',
        'editorError.foreground': '#f14c4c',
        'editorWarning.foreground': '#ffcc02',
        'editorInfo.foreground': '#3794ff',
        'editorHint.foreground': '#eeeeeeb3'
      }
    });

    // Advanced Light Theme
    monaco.editor.defineTheme('advanced-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword.arduino', foreground: '#af00db', fontStyle: 'bold' },
        { token: 'function.arduino', foreground: '#795e26' },
        { token: 'variable.arduino', foreground: '#001080' },
        { token: 'type.arduino', foreground: '#267f99' },
        { token: 'number.arduino', foreground: '#098658' },
        { token: 'string.arduino', foreground: '#a31515' },
        { token: 'comment.arduino', foreground: '#008000', fontStyle: 'italic' },
        { token: 'preprocessor.arduino', foreground: '#af00db' },
        
        { token: 'comment', foreground: '#008000', fontStyle: 'italic' },
        { token: 'keyword', foreground: '#0000FF', fontStyle: 'bold' },
        { token: 'string', foreground: '#A31515' },
        { token: 'number', foreground: '#098658' },
        { token: 'type', foreground: '#267F99' },
        { token: 'function', foreground: '#795E26' },
        { token: 'variable', foreground: '#001080' },
        { token: 'constant', foreground: '#0070C1' },
        { token: 'operator', foreground: '#000000' },
        { token: 'delimiter', foreground: '#000000' }
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#000000',
        'editor.lineHighlightBackground': '#f7f7f7',
        'editor.selectionBackground': '#add6ff',
        'editorCursor.foreground': '#000000',
        'editorWhitespace.foreground': '#bfbfbf',
        'editorLineNumber.foreground': '#237893',
        'editorGutter.background': '#f7f7f7'
      }
    });
  }, []);

  // Enhanced Arduino language configuration
  useEffect(() => {
    // Register custom Arduino language features
    monaco.languages.register({ id: 'arduino-cpp' });

    // Set language configuration
    monaco.languages.setLanguageConfiguration('arduino-cpp', {
      comments: {
        lineComment: '//',
        blockComment: ['/*', '*/']
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
      ],
      surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
      ],
      folding: {
        markers: {
          start: new RegExp('^\\s*#pragma\\s+region\\b'),
          end: new RegExp('^\\s*#pragma\\s+endregion\\b')
        }
      }
    });

    // Enhanced tokenization for Arduino
    monaco.languages.setMonarchTokensProvider('arduino-cpp', {
      keywords: [
        'void', 'int', 'char', 'byte', 'boolean', 'float', 'double', 'long', 'short',
        'unsigned', 'signed', 'const', 'static', 'volatile', 'PROGMEM',
        'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue',
        'return', 'goto', 'sizeof', 'true', 'false', 'HIGH', 'LOW',
        'INPUT', 'OUTPUT', 'INPUT_PULLUP', 'LED_BUILTIN'
      ],
      
      arduinoFunctions: [
        'setup', 'loop', 'pinMode', 'digitalWrite', 'digitalRead', 'analogWrite', 'analogRead',
        'delay', 'delayMicroseconds', 'millis', 'micros', 'map', 'constrain', 'min', 'max',
        'abs', 'sin', 'cos', 'tan', 'pow', 'sqrt', 'random', 'randomSeed'
      ],

      operators: [
        '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
        '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
        '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
        '%=', '<<=', '>>=', '>>>='
      ],

      symbols: /[=><!~?:&|+\-*\/\^%]+/,

      tokenizer: {
        root: [
          [/[a-zA-Z_$][\w$]*/, {
            cases: {
              '@keywords': { token: 'keyword.arduino' },
              '@arduinoFunctions': { token: 'function.arduino' },
              '@default': 'identifier'
            }
          }],
          
          [/[A-Z][\w$]*/, 'type.arduino'],
          [/#\w+/, 'preprocessor.arduino'],
          [/\d+/, 'number.arduino'],
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/"/, 'string.arduino', '@string_double'],
          [/'[^\\']'/, 'string.arduino'],
          [/(\/\/).*$/, 'comment.arduino'],
          [/\/\*/, 'comment.arduino', '@comment'],
          
          [/@symbols/, {
            cases: {
              '@operators': 'operator',
              '@default': ''
            }
          }],
          
          [/[{}()\[\]]/, '@brackets'],
          [/[;,.]/, 'delimiter']
        ],

        string_double: [
          [/[^\\"]+/, 'string.arduino'],
          [/\\./, 'string.escape.invalid.arduino'],
          [/"/, 'string.arduino', '@pop']
        ],

        comment: [
          [/[^\/*]+/, 'comment.arduino'],
          [/\*\//, 'comment.arduino', '@pop'],
          [/[\/*]/, 'comment.arduino']
        ]
      }
    });

  }, []);

  // Advanced completion provider
  useEffect(() => {
    if (!commandFuse || arduinoCommands.length === 0) return;

    const completionDisposable = monaco.languages.registerCompletionItemProvider('cpp', {
      triggerCharacters: ['.', '(', ' '],
      
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        const suggestions: monaco.languages.CompletionItem[] = [];
        
        if (word.word) {
          // Fuzzy search Arduino commands
          const searchResults = commandFuse.search(word.word);
          
          searchResults.slice(0, 20).forEach((result, index) => {
            const cmd = result.item;
            suggestions.push({
              label: cmd.command,
              kind: monaco.languages.CompletionItemKind.Function,
              documentation: {
                value: `**${cmd.command}**\n\n${cmd.description}\n\n\`\`\`cpp\n${cmd.template}\n\`\`\``
              },
              detail: cmd.template,
              insertText: cmd.template,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: range,
              sortText: String(index).padStart(3, '0')
            });
          });
        }

        // Add common C++ keywords and types
        const cppKeywords = [
          'void', 'int', 'char', 'float', 'double', 'bool', 'long', 'short',
          'unsigned', 'signed', 'const', 'static', 'volatile', 'extern'
        ];

        cppKeywords.forEach((keyword, index) => {
          if (keyword.toLowerCase().includes(word.word.toLowerCase())) {
            suggestions.push({
              label: keyword,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: keyword,
              range: range,
              sortText: String(1000 + index).padStart(4, '0')
            });
          }
        });

        return { suggestions };
      }
    });

    return () => completionDisposable.dispose();
  }, [commandFuse, arduinoCommands]);

  // Signature help provider for Arduino functions
  useEffect(() => {
    if (arduinoCommands.length === 0) return;

    const signatureDisposable = monaco.languages.registerSignatureHelpProvider('cpp', {
      signatureHelpTriggerCharacters: ['(', ','],
      
      provideSignatureHelp: (model, position) => {
        const line = model.getLineContent(position.lineNumber);
        const beforeCursor = line.substring(0, position.column - 1);
        
        // Find function name before the opening parenthesis
        const match = beforeCursor.match(/(\w+)\s*\(([^)]*)$/);
        if (!match) return null;
        
        const functionName = match[1];
        const command = arduinoCommands.find(cmd => cmd.command === functionName);
        
        if (!command) return null;
        
        return {
          value: {
            signatures: [{
              label: command.template,
              documentation: {
                value: command.description
              },
              parameters: []
            }],
            activeSignature: 0,
            activeParameter: 0
          },
          dispose: () => {}
        };
      }
    });

    return () => signatureDisposable.dispose();
  }, [arduinoCommands]);

  // Code Action Provider for typo auto-correction
  useEffect(() => {
    if (!commandFuse || arduinoCommands.length === 0) return;

    const codeActionDisposable = monaco.languages.registerCodeActionProvider('cpp', {
      provideCodeActions: (model, range, context) => {
        const actions: monaco.languages.CodeAction[] = [];
        
        context.markers.forEach(marker => {
          if (marker.code === 'typo-case-mismatch' || marker.code === 'typo-suggestion') {
            // Extract the suggestion from the message
            const match = marker.message.match(/Did you mean '([^']+)'\?/);
            if (match) {
              const suggestion = match[1];
              const word = model.getValueInRange({
                startLineNumber: marker.startLineNumber,
                startColumn: marker.startColumn,
                endLineNumber: marker.endLineNumber,
                endColumn: marker.endColumn
              });

              actions.push({
                title: `Replace with '${suggestion}'`,
                kind: 'quickfix',
                diagnostics: [marker],
                isPreferred: true,
                edit: {
                  edits: [{
                    resource: model.uri,
                    textEdit: {
                      range: {
                        startLineNumber: marker.startLineNumber,
                        startColumn: marker.startColumn,
                        endLineNumber: marker.endLineNumber,
                        endColumn: marker.endColumn
                      },
                      text: suggestion
                    },
                    versionId: model.getVersionId()
                  }]
                }
              });
            }
          }
        });

        return {
          actions: actions,
          dispose: () => {}
        };
      }
    });

    return () => codeActionDisposable.dispose();
  }, [commandFuse, arduinoCommands]);

  // Enhanced error checking and diagnostics
  const checkSyntax = useCallback(
    debounce((code: string) => {
      const markers: monaco.editor.IMarkerData[] = [];
      const lines = code.split('\n');

      lines.forEach((line, lineNumber) => {
        // Check for common Arduino mistakes
        if (line.includes('digitalRead') && !line.includes('pinMode')) {
          const prevLine = lines[lineNumber - 1] || '';
          if (!prevLine.includes('pinMode')) {
            markers.push({
              severity: monaco.MarkerSeverity.Warning,
              startLineNumber: lineNumber + 1,
              startColumn: 1,
              endLineNumber: lineNumber + 1,
              endColumn: line.length + 1,
              message: 'Consider setting pinMode() before using digitalRead()',
              code: 'arduino-best-practice'
            });
          }
        }

        // Check for typos in Arduino commands (case-insensitive)
        if (commandFuse) {
          const words = line.match(/\b[a-zA-Z_]\w*\b/g);
          if (words) {
            words.forEach(word => {
              // Skip keywords and common types
              if (['int', 'float', 'char', 'void', 'boolean', 'byte', 'long', 'short', 
                   'unsigned', 'signed', 'const', 'static', 'volatile', 'if', 'else', 
                   'for', 'while', 'do', 'switch', 'case', 'return', 'break', 'continue',
                   'HIGH', 'LOW', 'INPUT', 'OUTPUT', 'INPUT_PULLUP', 'true', 'false'].includes(word)) {
                return;
              }

              // Find exact match (case-sensitive)
              const exactMatch = arduinoCommands.find(cmd => cmd.command === word);
              if (exactMatch) return;

              // Find case-insensitive match
              const caseInsensitiveMatch = arduinoCommands.find(
                cmd => cmd.command.toLowerCase() === word.toLowerCase()
              );

              if (caseInsensitiveMatch && caseInsensitiveMatch.command !== word) {
                // Found a typo (wrong case)
                const wordStart = line.indexOf(word);
                markers.push({
                  severity: monaco.MarkerSeverity.Warning,
                  startLineNumber: lineNumber + 1,
                  startColumn: wordStart + 1,
                  endLineNumber: lineNumber + 1,
                  endColumn: wordStart + word.length + 1,
                  message: `Did you mean '${caseInsensitiveMatch.command}'? (case mismatch)`,
                  code: 'typo-case-mismatch',
                  tags: [monaco.MarkerTag.Unnecessary]
                });
              } else {
                // Fuzzy search for similar commands
                const fuzzyResults = commandFuse.search(word);
                if (fuzzyResults.length > 0 && fuzzyResults[0].score && fuzzyResults[0].score < 0.3) {
                  const suggestion = fuzzyResults[0].item.command;
                  if (suggestion !== word && word.length >= 4) {
                    const wordStart = line.indexOf(word);
                    markers.push({
                      severity: monaco.MarkerSeverity.Info,
                      startLineNumber: lineNumber + 1,
                      startColumn: wordStart + 1,
                      endLineNumber: lineNumber + 1,
                      endColumn: wordStart + word.length + 1,
                      message: `Did you mean '${suggestion}'?`,
                      code: 'typo-suggestion'
                    });
                  }
                }
              }
            });
          }
        }

        // Check for missing semicolons
        const trimmedLine = line.trim();
        if (trimmedLine && 
            !trimmedLine.endsWith(';') && 
            !trimmedLine.endsWith('{') && 
            !trimmedLine.endsWith('}') &&
            !trimmedLine.startsWith('//') &&
            !trimmedLine.startsWith('/*') &&
            !trimmedLine.includes('if') &&
            !trimmedLine.includes('for') &&
            !trimmedLine.includes('while') &&
            !trimmedLine.includes('#include') &&
            !trimmedLine.includes('#define')) {
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            startLineNumber: lineNumber + 1,
            startColumn: line.length,
            endLineNumber: lineNumber + 1,
            endColumn: line.length + 1,
            message: 'Missing semicolon',
            code: 'syntax-error'
          });
        }
      });

      setDiagnostics(markers);
      
      if (editorRef.current) {
        monaco.editor.setModelMarkers(editorRef.current.getModel()!, 'syntax', markers);
      }
    }, 500),
    [arduinoCommands]
  );

  // Create and configure editor
  useEffect(() => {
    if (editorContainerRef.current && !editorRef.current) {
      editorRef.current = monaco.editor.create(editorContainerRef.current, {
        value: value,
        language: language === 'cpp' ? 'cpp' : language,
        theme: getMonacoTheme(theme),
        
        // Enhanced editor options
        fontSize: settings.editor?.fontSize || 14,
        lineHeight: 22,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', 'Consolas', monospace",
        fontLigatures: true,
        
        // Advanced features
        minimap: { 
          enabled: settings.general?.showMinimap !== false,
          side: 'right',
          showSlider: 'always',
          renderCharacters: true
        },
        
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: 'on',
        lineNumbers: 'on',
        renderWhitespace: 'boundary',
        folding: true,
        foldingStrategy: 'indentation',
        showFoldingControls: 'always',
        
        // Bracket features
        bracketPairColorization: { enabled: true },
        guides: {
          bracketPairs: 'active',
          indentation: true,
          highlightActiveIndentation: true
        },
        
        // IntelliSense
        suggest: {
          showIcons: true,
          showSnippets: true,
          showWords: true,
          showMethods: true,
          showFunctions: true,
          showConstructors: true,
          showFields: true,
          showVariables: true,
          showClasses: true,
          showStructs: true,
          showInterfaces: true,
          showModules: true,
          showProperties: true,
          showEvents: true,
          showOperators: true,
          showUnits: true,
          showValues: true,
          showConstants: true,
          showEnums: true,
          showEnumMembers: true,
          showKeywords: true,

          showColors: true,
          showFiles: true,
          showReferences: true,
          showFolders: true,
          showTypeParameters: true
        },
        
        quickSuggestions: {
          other: true,
          comments: false,
          strings: false
        },
        
        // Code actions
        // lightbulb: { enabled: 'on' },
        
        // Error highlighting
        renderValidationDecorations: 'on',
        
        // Cursor and selection
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        cursorWidth: 2,
        
        // Scrolling
        smoothScrolling: true,
        mouseWheelScrollSensitivity: 1.2,
        
        // Advanced editing
        multiCursorModifier: 'ctrlCmd',
        acceptSuggestionOnCommitCharacter: true,
        acceptSuggestionOnEnter: 'on',
        tabCompletion: 'on',
        
        // Format on type/paste
        formatOnType: true,
        formatOnPaste: true,
        
        // Hover
        hover: {
          enabled: true,
          delay: 300,
          sticky: true
        }
      });

      // Setup change listener
      editorRef.current.onDidChangeModelContent((e) => {
        if (editorRef.current) {
          const newValue = editorRef.current.getValue();
          onChange(newValue);
          checkSyntax(newValue);
        }
      });

      // Enhanced keyboard shortcuts
      editorRef.current.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        console.log('Save file:', filePath);
        // Emit save event
      });

      editorRef.current.addCommand(monaco.KeyCode.F7, () => {
        console.log('Compile project');
        // Emit compile event
      });

      editorRef.current.addCommand(monaco.KeyCode.F5, () => {
        console.log('Upload to board');
        // Emit upload event
      });

      editorRef.current.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
        editorRef.current?.trigger('keyboard', 'editor.action.commentLine', {});
      });

      editorRef.current.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyA, () => {
        editorRef.current?.trigger('keyboard', 'editor.action.blockComment', {});
      });

      // Auto-indent on paste
      editorRef.current.onDidPaste(() => {
        setTimeout(() => {
          editorRef.current?.trigger('keyboard', 'editor.action.formatDocument', {});
        }, 100);
      });

      // Content change handler - trigger syntax checking
      editorRef.current.onDidChangeModelContent(() => {
        if (editorRef.current) {
          const currentValue = editorRef.current.getValue();
          onChange(currentValue);
          // Trigger syntax checking for typos
          checkSyntax(currentValue);
        }
      });
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, [filePath, settings]);

  // Update theme when changed
  useEffect(() => {
    if (editorRef.current) {
      monaco.editor.setTheme(getMonacoTheme(theme));
    }
  }, [theme]);

  // Update content when value changes externally
  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== value) {
      const model = editorRef.current.getModel();
      if (model) {
        const selection = editorRef.current.getSelection();
        editorRef.current.setValue(value);
        if (selection) {
          editorRef.current.setSelection(selection);
        }
      }
    }
  }, [value]);

  const getMonacoTheme = (theme: string): string => {
    switch (theme) {
      case 'light': 
      case 'modern-blue': 
        return 'advanced-light';
      default: 
        return 'advanced-dark';
    }
  };

  return (
    <div className="advanced-editor-wrapper">
      <div className="editor-header">
        <div className="editor-info">
          <span className="file-name">{filePath.split('/').pop() || filePath.split('\\').pop()}</span>
          <span className="language-indicator">{language.toUpperCase()}</span>
        </div>
        <div className="editor-actions">
          <button 
            className="editor-action-btn" 
            title="Format Document (Alt+Shift+F)"
            onClick={() => editorRef.current?.trigger('keyboard', 'editor.action.formatDocument', {})}
          >
            <span>⚡</span>
          </button>
          <button 
            className="editor-action-btn" 
            title="Toggle Minimap"
            onClick={() => {
              if (editorRef.current) {
                const currentOptions = editorRef.current.getOptions();
                editorRef.current.updateOptions({
                  minimap: { enabled: !currentOptions.get(monaco.editor.EditorOption.minimap).enabled }
                });
              }
            }}
          >
            <span>🗺️</span>
          </button>
          <button 
            className="editor-action-btn" 
            title="Find and Replace (Ctrl+H)"
            onClick={() => editorRef.current?.trigger('keyboard', 'editor.action.startFindReplaceAction', {})}
          >
            <span>🔍</span>
          </button>
        </div>
      </div>
      
      {diagnostics.length > 0 && (
        <div className="diagnostics-bar">
          <span className="diagnostics-count">
            {diagnostics.filter(d => d.severity === monaco.MarkerSeverity.Error).length} errors, 
            {diagnostics.filter(d => d.severity === monaco.MarkerSeverity.Warning).length} warnings
          </span>
        </div>
      )}
      
      <div ref={editorContainerRef} className="advanced-editor-container" />
    </div>
  );
};

export default AdvancedEditor;
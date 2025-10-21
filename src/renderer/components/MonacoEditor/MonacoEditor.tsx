import React, { useRef, useEffect, useState } from 'react';
import * as monaco from 'monaco-editor';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import './MonacoEditor.css';

interface MonacoEditorProps {
  filePath: string;
  value: string;
  onChange: (value: string) => void;
  language?: string;
}

interface ArduinoCommand {
  command: string;
  template: string;
  description: string;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
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

  // Load Arduino commands for enhanced completion
  useEffect(() => {
    const loadCommands = async () => {
      try {
        // Parse commands from static data
        const defaultCommands: ArduinoCommand[] = [
          { command: 'pinMode', template: 'pinMode(${1:pin}, ${2:mode})', description: 'ピンのモードを設定 (INPUT, OUTPUT, INPUT_PULLUP)' },
          { command: 'digitalWrite', template: 'digitalWrite(${1:pin}, ${2:value})', description: 'デジタルピンに HIGH または LOW を出力する' },
          { command: 'digitalRead', template: 'digitalRead(${1:pin})', description: 'デジタルピンの状態を読み取る (HIGH または LOW)' },
          { command: 'analogWrite', template: 'analogWrite(${1:pin}, ${2:value})', description: 'PWMピンにアナログ値（PWM波）を出力する (0 から 255)' },
          { command: 'analogRead', template: 'analogRead(${1:pin})', description: 'アナログピンの値を読み取る (0 から 1023)' },
          { command: 'delay', template: 'delay(${1:ms})', description: '指定した時間（ミリ秒）プログラムを一時停止する' },
          { command: 'delayMicroseconds', template: 'delayMicroseconds(${1:us})', description: '指定した時間（マイクロ秒）プログラムを一時停止する' },
          { command: 'millis', template: 'millis()', description: 'プログラム開始からの経過時間（ミリ秒）を返す' },
          { command: 'micros', template: 'micros()', description: 'プログラム開始からの経過時間（マイクロ秒）を返す' },
          { command: 'Serial.begin', template: 'Serial.begin(${1:baudrate})', description: 'シリアル通信を開始する（ボーレート指定）' },
          { command: 'Serial.print', template: 'Serial.print(${1:data})', description: 'データをASCIIテキストとしてシリアル送信する' },
          { command: 'Serial.println', template: 'Serial.println(${1:data})', description: 'データをASCIIテキストとしてシリアル送信し、最後に改行を追加する' },
          { command: 'map', template: 'map(${1:value}, ${2:fromLow}, ${3:fromHigh}, ${4:toLow}, ${5:toHigh})', description: 'ある範囲の数値を別の範囲に線形変換する' },
          { command: 'constrain', template: 'constrain(${1:x}, ${2:a}, ${3:b})', description: '数値を範囲 (a から b) 内に収める' },
          { command: 'random', template: 'random(${1:max})', description: '指定した範囲の疑似乱数（整数）を生成する' },
          { command: 'randomSeed', template: 'randomSeed(${1:seed})', description: '疑似乱数生成のシード（種）を設定する' }
        ];
        setArduinoCommands(defaultCommands);
      } catch (error) {
        console.error('Failed to load Arduino commands:', error);
      }
    };
    loadCommands();
  }, []);

  useEffect(() => {
    let completionProvider: any = null;
    let errorProvider: any = null;
    
    if (editorContainerRef.current) {
      // Configure Monaco Editor themes
      monaco.editor.defineTheme('tova-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '7FA863', fontStyle: 'italic' },
          { token: 'keyword', foreground: '6FB1E8', fontStyle: 'bold' },
          { token: 'string', foreground: 'D99A7C' },
          { token: 'number', foreground: 'C4D7B2' },
          { token: 'type', foreground: '63D2C0' },
          { token: 'function', foreground: 'DCDCAA' },
        ],
        colors: {
          'editor.background': '#1e1e1e',
          'editor.foreground': '#d4d4d4',
          'editor.lineHighlightBackground': '#2a2d2e',
          'editor.selectionBackground': '#264F78',
          'editorCursor.foreground': '#aeafad',
          'editorWhitespace.foreground': '#484848',
          'editorLineNumber.foreground': '#5a5a5a',
        }
      });

      monaco.editor.defineTheme('tova-light', {
        base: 'vs',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '008800', fontStyle: 'italic' },
          { token: 'keyword', foreground: '0066CC', fontStyle: 'bold' },
          { token: 'string', foreground: 'B31515' },
          { token: 'number', foreground: '007755' },
          { token: 'type', foreground: '2B8FAA' },
          { token: 'function', foreground: '795E26' },
        ],
        colors: {
          'editor.background': '#ffffff',
          'editor.foreground': '#24292e',
          'editor.lineHighlightBackground': '#f6f8fa',
          'editor.selectionBackground': '#c8e1ff',
          'editorCursor.foreground': '#0066CC',
          'editorLineNumber.foreground': '#999999',
        }
      });

      monaco.editor.defineTheme('tova-modern-blue', {
        base: 'vs',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '5a7a85', fontStyle: 'italic' },
          { token: 'keyword', foreground: '0052cc', fontStyle: 'bold' },
          { token: 'string', foreground: '226622' },
          { token: 'number', foreground: 'cc5500' },
          { token: 'type', foreground: '0052cc' },
          { token: 'function', foreground: '6f42c1' },
        ],
        colors: {
          'editor.background': '#ffffff',
          'editor.foreground': '#1a1a1a',
          'editor.lineHighlightBackground': '#f0f6ff',
          'editor.selectionBackground': '#b3d7ff',
          'editorCursor.foreground': '#0052cc',
        }
      });

      monaco.editor.defineTheme('tova-liquid-glass', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '8B98A5', fontStyle: 'italic' },
          { token: 'keyword', foreground: '7DC4FF', fontStyle: 'bold' },
          { token: 'string', foreground: '4ECCA3' },
          { token: 'number', foreground: 'FFD93D' },
          { token: 'type', foreground: 'C084FC' },
          { token: 'function', foreground: 'F472B6' },
        ],
        colors: {
          'editor.background': '#0a0e1a',
          'editor.foreground': '#f0f0f0',
          'editor.lineHighlightBackground': '#1a1f35',
          'editor.selectionBackground': '#3d5a80',
          'editorCursor.foreground': '#7DC4FF',
          'editorLineNumber.foreground': '#4a5a6a',
        }
      });

      monaco.editor.defineTheme('tova-material', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: 'A59DAD', fontStyle: 'italic' },
          { token: 'keyword', foreground: '9575CD', fontStyle: 'bold' },
          { token: 'string', foreground: '66BB6A' },
          { token: 'number', foreground: 'FFA726' },
          { token: 'type', foreground: '7E57C2' },
          { token: 'function', foreground: 'EF5350' },
        ],
        colors: {
          'editor.background': '#1e1e2e',
          'editor.foreground': '#eff1f5',
          'editor.lineHighlightBackground': '#2a2a3a',
          'editor.selectionBackground': '#6750A466',
          'editorCursor.foreground': '#9575CD',
          'editorLineNumber.foreground': '#4a4a5a',
        }
      });

      monaco.editor.defineTheme('tova-anime', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: 'B8B8D0', fontStyle: 'italic' },
          { token: 'keyword', foreground: '33F5FF', fontStyle: 'bold' },
          { token: 'string', foreground: '5FFF5F' },
          { token: 'number', foreground: 'FFE55F' },
          { token: 'type', foreground: 'BD5FFF' },
          { token: 'function', foreground: 'FF5FA3' },
        ],
        colors: {
          'editor.background': '#0f1429',
          'editor.foreground': '#f5f5ff',
          'editor.lineHighlightBackground': '#1a2040',
          'editor.selectionBackground': '#FF5FA355',
          'editorCursor.foreground': '#33F5FF',
          'editorLineNumber.foreground': '#4a5070',
        }
      });

      // Register enhanced Arduino completion provider
      completionProvider = monaco.languages.registerCompletionItemProvider('cpp', {
        triggerCharacters: ['.', '(', ' ', '#'],
        provideCompletionItems: (model: any, position: any) => {
          const word = model.getWordUntilPosition(position);
          const line = model.getLineContent(position.lineNumber);
          const beforeCursor = line.substring(0, position.column - 1);
          
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
          };

          const suggestions: any[] = [];
          
          // Arduino commands
          arduinoCommands.forEach((cmd, index) => {
            if (word.word.length === 0 || cmd.command.toLowerCase().includes(word.word.toLowerCase())) {
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
                sortText: `a${index.toString().padStart(3, '0')}`
              });
            }
          });

          // C++ keywords
          const cppKeywords = [
            'void', 'int', 'char', 'float', 'double', 'bool', 'long', 'short',
            'unsigned', 'signed', 'const', 'static', 'volatile', 'extern',
            'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
            'break', 'continue', 'return', 'sizeof', 'true', 'false'
          ];

          cppKeywords.forEach((keyword, index) => {
            if (word.word.length === 0 || keyword.toLowerCase().includes(word.word.toLowerCase())) {
              suggestions.push({
                label: keyword,
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: keyword,
                range: range,
                sortText: `b${index.toString().padStart(3, '0')}`
              });
            }
          });

          // Arduino specific constants
          const arduinoConstants = [
            'HIGH', 'LOW', 'INPUT', 'OUTPUT', 'INPUT_PULLUP', 'LED_BUILTIN',
            'A0', 'A1', 'A2', 'A3', 'A4', 'A5'
          ];

          arduinoConstants.forEach((constant, index) => {
            if (word.word.length === 0 || constant.toLowerCase().includes(word.word.toLowerCase())) {
              suggestions.push({
                label: constant,
                kind: monaco.languages.CompletionItemKind.Constant,
                insertText: constant,
                range: range,
                sortText: `c${index.toString().padStart(3, '0')}`
              });
            }
          });

          return { suggestions };
        }
      });

      // Create editor instance with user-configured settings
      editorRef.current = monaco.editor.create(editorContainerRef.current, {
        value: value,
        language: language,
        theme: getMonacoTheme(theme),
        
        // Typography settings from user preferences
        fontSize: settings.editor?.fontSize || 14,
        lineHeight: settings.editor?.lineHeight ? settings.editor.lineHeight * (settings.editor?.fontSize || 14) : 22,
        fontFamily: settings.editor?.fontFamily || "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', 'Consolas', monospace",
        fontLigatures: true,
        
        // Minimap from user preferences
        minimap: { 
          enabled: settings.editor?.minimap !== false,
          side: 'right',
          showSlider: 'mouseover',
          renderCharacters: false
        },
        
        // Layout and scrolling
        scrollBeyondLastLine: settings.editor?.scrollBeyondLastLine !== false,
        automaticLayout: true,
        smoothScrolling: settings.editor?.smoothScrolling !== false,
        
        // Word wrap from user preferences
        wordWrap: settings.editor?.wordWrap || 'off',
        
        // Line numbers and whitespace
        lineNumbers: 'on',
        renderWhitespace: settings.editor?.renderWhitespace || 'none',
        
        // Folding
        folding: true,
        foldingStrategy: 'indentation',
        showFoldingControls: 'mouseover',
        
        // Bracket features from user preferences
        bracketPairColorization: { 
          enabled: settings.editor?.bracketPairColorization !== false 
        },
        guides: {
          bracketPairs: 'active',
          indentation: true,
          highlightActiveIndentation: true
        },
        
        // Tab settings from user preferences
        tabSize: settings.editor?.tabSize || 2,
        insertSpaces: settings.editor?.insertSpaces !== false,
        
        // Cursor style from user preferences
        cursorStyle: settings.editor?.cursorStyle || 'line',
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        
        // Auto-closing from user preferences
        autoClosingBrackets: settings.editor?.autoClosingBrackets || 'languageDefined',
        autoClosingQuotes: settings.editor?.autoClosingQuotes || 'languageDefined',
        autoSurround: settings.editor?.autoSurround || 'languageDefined',
        
        // Enhanced IntelliSense
        suggest: {
          showIcons: true,
          showSnippets: true,
          showWords: true,
          showMethods: true,
          showFunctions: true,
          showKeywords: true,
          filterGraceful: true,
          localityBonus: true
        },
        
        quickSuggestions: {
          other: true,
          comments: false,
          strings: false
        },
        
        // Additional features
        acceptSuggestionOnCommitCharacter: true,
        acceptSuggestionOnEnter: 'on',
        tabCompletion: 'on',
        
        // Error handling
        renderValidationDecorations: 'on',
        
        // Hover
        hover: {
          enabled: true,
          delay: 300
        }
      });

      // Setup change listener
      editorRef.current.onDidChangeModelContent(() => {
        if (editorRef.current) {
          onChange(editorRef.current.getValue());
        }
      });

      // Setup keyboard shortcuts
      editorRef.current.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        // Save file - emit to main process
        console.log('Save file:', filePath);
      });

      editorRef.current.addCommand(monaco.KeyCode.F7, () => {
        // Compile
        console.log('Compile project');
      });

      editorRef.current.addCommand(monaco.KeyCode.F5, () => {
        // Upload
        console.log('Upload to board');
      });

      // Advanced editor features
      editorRef.current.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
        // Duplicate line
        editorRef.current?.getAction('editor.action.duplicateSelection')?.run();
      });

      editorRef.current.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
        // Toggle comment
        editorRef.current?.getAction('editor.action.commentLine')?.run();
      });

      editorRef.current.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.UpArrow, () => {
        // Move line up
        editorRef.current?.getAction('editor.action.moveLinesUpAction')?.run();
      });

      editorRef.current.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.DownArrow, () => {
        // Move line down
        editorRef.current?.getAction('editor.action.moveLinesDownAction')?.run();
      });

      // Format document
      editorRef.current.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
        editorRef.current?.getAction('editor.action.formatDocument')?.run();
      });

      // Find and replace
      editorRef.current.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH, () => {
        editorRef.current?.getAction('editor.action.startFindReplaceAction')?.run();
      });
    }

    // Register error checking and markers
    errorProvider = monaco.languages.registerCodeLensProvider('cpp', {
      provideCodeLenses: (model: any) => {
        const lenses: any[] = [];
        const content = model.getValue();
        
        // Simple error checking for common Arduino issues
        const lines = content.split('\n');
        lines.forEach((line: string, index: number) => {
          if (line.includes('digitalRead') && !line.includes('pinMode')) {
            lenses.push({
              range: {
                startLineNumber: index + 1,
                endLineNumber: index + 1,
                startColumn: 1,
                endColumn: line.length + 1
              },
              id: `warning_${index}`,
              command: {
                id: 'editor.action.showHover',
                title: '⚠️ Consider using pinMode() first'
              }
            });
          }
        });
        
        return { lenses, dispose: () => {} };
      }
    });

    // Add bracket matching and auto-closing
    monaco.languages.setLanguageConfiguration('cpp', {
      brackets: [['(', ')'], ['{', '}'], ['[', ']']],
      autoClosingPairs: [
        { open: '(', close: ')' },
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
      ],
      surroundingPairs: [
        { open: '(', close: ')' },
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
      ]
    });

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
      completionProvider?.dispose();
      errorProvider?.dispose();
    };
  }, [filePath]);

  // Update theme when changed
  useEffect(() => {
    if (editorRef.current) {
      monaco.editor.setTheme(getMonacoTheme(theme));
    }
  }, [theme]);

  // Update content when value changes externally
  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== value) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  // Update editor settings when they change
  useEffect(() => {
    if (editorRef.current && settings.editor) {
      editorRef.current.updateOptions({
        fontSize: settings.editor.fontSize || 14,
        lineHeight: settings.editor.lineHeight ? settings.editor.lineHeight * (settings.editor.fontSize || 14) : undefined,
        fontFamily: settings.editor.fontFamily || undefined,
        minimap: { enabled: settings.editor.minimap !== false },
        scrollBeyondLastLine: settings.editor.scrollBeyondLastLine !== false,
        smoothScrolling: settings.editor.smoothScrolling !== false,
        wordWrap: settings.editor.wordWrap || 'off',
        renderWhitespace: settings.editor.renderWhitespace || 'none',
        bracketPairColorization: { enabled: settings.editor.bracketPairColorization !== false },
        tabSize: settings.editor.tabSize || 2,
        insertSpaces: settings.editor.insertSpaces !== false,
        cursorStyle: settings.editor.cursorStyle || 'line',
        autoClosingBrackets: settings.editor.autoClosingBrackets || 'languageDefined',
        autoClosingQuotes: settings.editor.autoClosingQuotes || 'languageDefined',
        autoSurround: settings.editor.autoSurround || 'languageDefined',
      });
    }
  }, [settings.editor]);

  const getMonacoTheme = (theme: string): string => {
    switch (theme) {
      case 'light': return 'tova-light';
      case 'modern-blue': return 'tova-modern-blue';
      case 'liquid-glass': return 'tova-liquid-glass';
      case 'material': return 'tova-material';
      case 'anime': return 'tova-anime';
      case 'dark':
      default: return 'tova-dark';
    }
  };

  return (
    <div className="monaco-editor-wrapper">
      <div 
        ref={editorContainerRef} 
        className="monaco-editor-container"
        style={{ width: '100%', height: '100%', minHeight: '300px' }}
      />
    </div>
  );
};

export default MonacoEditor;
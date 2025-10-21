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
          { token: 'comment', foreground: '6A9955' },
          { token: 'keyword', foreground: '569CD6' },
          { token: 'string', foreground: 'CE9178' },
          { token: 'number', foreground: 'B5CEA8' },
          { token: 'type', foreground: '4EC9B0' },
        ],
        colors: {
          'editor.background': '#1e1e1e',
          'editor.foreground': '#cccccc',
          'editor.lineHighlightBackground': '#2d2d30',
          'editor.selectionBackground': '#094771',
          'editorCursor.foreground': '#aeafad',
          'editorWhitespace.foreground': '#404040',
        }
      });

      monaco.editor.defineTheme('tova-light', {
        base: 'vs',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '008000' },
          { token: 'keyword', foreground: '0000FF' },
          { token: 'string', foreground: 'A31515' },
          { token: 'number', foreground: '098658' },
          { token: 'type', foreground: '267F99' },
        ],
        colors: {
          'editor.background': '#ffffff',
          'editor.foreground': '#24292e',
        }
      });

      monaco.editor.defineTheme('tova-modern-blue', {
        base: 'vs',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '546e7a' },
          { token: 'keyword', foreground: '1976d2' },
          { token: 'string', foreground: '2e7d32' },
          { token: 'number', foreground: 'd84315' },
          { token: 'type', foreground: '1976d2' },
        ],
        colors: {
          'editor.background': '#f6f8fa',
          'editor.foreground': '#263238',
          'editor.lineHighlightBackground': '#e3f2fd',
        }
      });

      monaco.editor.defineTheme('tova-liquid-glass', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '7A8A9A' },
          { token: 'keyword', foreground: '63B3ED' },
          { token: 'string', foreground: '34D399' },
          { token: 'number', foreground: 'FBBF24' },
          { token: 'type', foreground: 'A855F7' },
        ],
        colors: {
          'editor.background': '#0D1117',
          'editor.foreground': '#E6E1E5',
          'editor.lineHighlightBackground': '#161B22',
          'editor.selectionBackground': '#264F78',
        }
      });

      monaco.editor.defineTheme('tova-material', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '948F99' },
          { token: 'keyword', foreground: '6750A4' },
          { token: 'string', foreground: '2E7D32' },
          { token: 'number', foreground: 'F57C00' },
          { token: 'type', foreground: '625B71' },
        ],
        colors: {
          'editor.background': '#1C1B1F',
          'editor.foreground': '#E6E1E5',
          'editor.lineHighlightBackground': '#2B2930',
          'editor.selectionBackground': '#EADDFF33',
        }
      });

      monaco.editor.defineTheme('tova-anime', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: 'A0A0C0' },
          { token: 'keyword', foreground: '00E5FF' },
          { token: 'string', foreground: '39FF14' },
          { token: 'number', foreground: 'FFD23F' },
          { token: 'type', foreground: '9D00FF' },
          { token: 'function', foreground: 'FF1493' },
        ],
        colors: {
          'editor.background': '#0a0e27',
          'editor.foreground': '#FFFFFF',
          'editor.lineHighlightBackground': '#1a1f3a',
          'editor.selectionBackground': '#FF149344',
          'editorCursor.foreground': '#00E5FF',
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

      // Create editor instance with enhanced settings
      editorRef.current = monaco.editor.create(editorContainerRef.current, {
        value: value,
        language: language,
        theme: getMonacoTheme(theme),
        
        // Enhanced typography
        fontSize: settings.editor?.fontSize || 14,
        lineHeight: 22,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', 'Consolas', monospace",
        fontLigatures: true,
        
        // Advanced features
        minimap: { 
          enabled: settings.general?.showMinimap !== false,
          side: 'right',
          showSlider: 'mouseover',
          renderCharacters: false
        },
        
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: 'on',
        lineNumbers: 'on',
        renderWhitespace: 'boundary',
        folding: true,
        foldingStrategy: 'indentation',
        showFoldingControls: 'mouseover',
        
        // Enhanced bracket features
        bracketPairColorization: { enabled: true },
        guides: {
          bracketPairs: 'active',
          indentation: true,
          highlightActiveIndentation: true
        },
        
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
        
        // Cursor and selection
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        
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
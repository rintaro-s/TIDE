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

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  filePath,
  value,
  onChange,
  language = 'cpp'
}) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
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

      // Create editor instance
      editorRef.current = monaco.editor.create(editorContainerRef.current, {
        value: value,
        language: language,
        theme: getMonacoTheme(theme),
        fontSize: 14,
        lineHeight: 20,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Courier New', monospace",
        minimap: { enabled: true, side: 'right' },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: 'on',
        lineNumbers: 'on',
        renderWhitespace: 'selection',
        folding: true,
        foldingStrategy: 'auto',
        showFoldingControls: 'always',
        bracketPairColorization: { enabled: true },
        guides: {
          bracketPairs: 'active',
          indentation: true
        },
        suggest: {
          showIcons: true,
          showSnippets: true,
        },
        quickSuggestions: {
          other: true,
          comments: false,
          strings: false
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
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
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
      default: return 'tova-dark';
    }
  };

  return (
    <div className="monaco-editor-wrapper">
      <div ref={editorContainerRef} className="monaco-editor-container" />
    </div>
  );
};

export default MonacoEditor;
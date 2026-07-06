import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';

interface CursorPosition {
  lineNumber: number;
  column: number;
}

interface EditorWrapperProps {
  itemKey: string | number;
  initialValue: string;
  onChange: (val: string) => void;
  language?: string;
  cursorPosition?: CursorPosition | null;
  scrollPosition?: number | null;
  onMount?: (editor: any) => void;
  onCursorChange?: (position: CursorPosition | null) => void;
  onScrollChange?: (scrollTop: number) => void;
}

export const EditorWrapper: React.FC<EditorWrapperProps> = ({
  itemKey,
  initialValue,
  onChange,
  language = 'json',
  cursorPosition,
  scrollPosition,
  onMount,
  onCursorChange,
  onScrollChange,
}) => {
  const [value, setValue] = useState(initialValue);
  const editorRef = useRef<any>(null);
  const restoringRef = useRef(false);

  useEffect(() => {
    setValue(initialValue);
  }, [itemKey, initialValue]);

  useEffect(() => {
    if (editorRef.current && cursorPosition && !restoringRef.current) {
      restoringRef.current = true;
      requestAnimationFrame(() => {
        try {
          editorRef.current.setPosition(cursorPosition);
          editorRef.current.revealPositionInCenter(cursorPosition);
        } catch (_) {}
        restoringRef.current = false;
      });
    }
  }, [cursorPosition, itemKey]);

  useEffect(() => {
    if (editorRef.current && scrollPosition !== null && scrollPosition !== undefined) {
      requestAnimationFrame(() => {
        try {
          editorRef.current.setScrollTop(scrollPosition);
        } catch (_) {}
      });
    }
  }, [scrollPosition, itemKey]);

  const handleChange = (newValue: string | undefined) => {
    const val = newValue || '';
    setValue(val);
    onChange(val);
  };

  const handleMount = useCallback((editor: any) => {
    editorRef.current = editor;
    onMount?.(editor);

    editor.onDidChangeCursorPosition((e: any) => {
      onCursorChange?.({ lineNumber: e.position.lineNumber, column: e.position.column });
    });

    editor.onDidScrollChange((e: any) => {
      onScrollChange?.(e.scrollTop);
    });
  }, [onMount, onCursorChange, onScrollChange]);

  return (
    <Editor
      key={itemKey}
      height="100%"
      language={language}
      theme="vs-light"
      value={value}
      onChange={handleChange}
      onMount={handleMount}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        wordWrap: 'on',
        padding: { top: 12, bottom: 12 },
        lineNumbers: 'on',
        glyphMargin: false,
        folding: true,
        bracketPairColorization: { enabled: true },
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        formatOnPaste: true,
        scrollBeyondLastLine: false,
      }}
    />
  );
};
